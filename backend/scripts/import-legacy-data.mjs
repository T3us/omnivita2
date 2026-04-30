import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { config } from '../src/config.mjs';
import { closeDb, withTransaction } from '../src/db.mjs';
import { characterToRowPayload, coerceObject, normalizeEmail, sanitizeUsername } from '../src/serializers.mjs';
import { createTemporaryPassword, createUuid, hashPassword } from '../src/security.mjs';

function asArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.data)) return payload.data;
  return [];
}

function dedupeBy(items, keyBuilder) {
  const map = new Map();
  for (const item of items) {
    const key = keyBuilder(item);
    if (!key) continue;
    const current = map.get(key);
    if (!current || JSON.stringify(item).length > JSON.stringify(current).length) {
      map.set(key, item);
    }
  }
  return Array.from(map.values());
}

async function readJsonIfExists(filePath, fallback = null) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === 'ENOENT') return fallback;
    throw error;
  }
}

async function readRecoveryBundles() {
  const collected = {
    profiles: [],
    characters: [],
    companions: [],
    authUsers: []
  };
  const candidateDirs = [
    config.migrationInputDir,
    path.join(config.migrationInputDir, 'recovery-bundles')
  ];

  for (const directory of candidateDirs) {
    try {
      const entries = await fs.readdir(directory);
      const bundleFiles = entries.filter((file) => /^omnivita-recovery-.*\.json$/i.test(file));

      for (const file of bundleFiles) {
        const payload = await readJsonIfExists(path.join(directory, file), null);
        if (!payload || payload.source !== 'omnivita-browser-recovery') continue;
        collected.profiles.push(...asArray(payload.profiles));
        collected.characters.push(...asArray(payload.characters));
        collected.companions.push(...asArray(payload.companions));
        collected.authUsers.push(...asArray(payload.authUsers));
      }
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }

  return {
    profiles: dedupeBy(collected.profiles, (item) => String(item?.character_id || item?.id || item?.username || '')),
    characters: dedupeBy(collected.characters, (item) => String(item?.id || '')),
    companions: dedupeBy(collected.companions, (item) => String(item?.id || `${item?.character_id || ''}:${item?.name || ''}`)),
    authUsers: dedupeBy(collected.authUsers, (item) => String(item?.id || item?.email || ''))
  };
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeRole(value) {
  return String(value || '').toLowerCase() === 'master' ? 'master' : 'player';
}

function ensureUniqueValue(initialValue, usedValues, fallbackPrefix) {
  const base = String(initialValue || `${fallbackPrefix}-${createUuid().slice(0, 8)}`).trim() || `${fallbackPrefix}-${createUuid().slice(0, 8)}`;
  let attempt = base;
  let counter = 2;
  while (usedValues.has(attempt)) {
    attempt = `${base}-${counter}`;
    counter += 1;
  }
  usedValues.add(attempt);
  return attempt;
}

function ensureUniqueEmail(initialValue, usedValues) {
  const base = String(initialValue || `user-${createUuid().slice(0, 8)}@omnivita.local`).trim().toLowerCase();
  const [localPart, domainPart = 'omnivita.local'] = base.split('@');
  let attempt = `${localPart}@${domainPart}`;
  let counter = 2;
  while (usedValues.has(attempt)) {
    attempt = `${localPart}-${counter}@${domainPart}`;
    counter += 1;
  }
  usedValues.add(attempt);
  return attempt;
}

function normalizeAttributes(value) {
  const safe = coerceObject(value, {});
  return {
    forca: toNumber(safe.forca, 0),
    destreza: toNumber(safe.destreza, 0),
    sentidos: toNumber(safe.sentidos, 0),
    vigor: toNumber(safe.vigor, 0),
    inteligencia: toNumber(safe.inteligencia, 0),
    nexo: toNumber(safe.nexo, 0)
  };
}

function normalizeCompanionRow(row) {
  const safe = coerceObject(row, {});
  return {
    id: String(safe.id || `cmp-${createUuid()}`),
    name: String(safe.name || ''),
    type: String(safe.type || ''),
    image: String(safe.photo_url || safe.image || ''),
    pvCurrent: toNumber(safe.current_pv ?? safe.pvCurrent, 0),
    pvMax: toNumber(safe.max_pv ?? safe.pvMax, 0),
    armor: toNumber(safe.armor, 0),
    status: String(safe.status || ''),
    notes: String(safe.notes || ''),
    attributes: normalizeAttributes(safe.attributes),
    skills: Array.isArray(safe.skills) ? safe.skills : [],
    facets: Array.isArray(safe.facets) ? safe.facets : []
  };
}

function buildCharacterFromLegacyRow(row, profile = null, companions = []) {
  const safeRow = coerceObject(row, {});
  const sheet = coerceObject(safeRow.sheet, {});
  const identity = coerceObject(sheet.identity, {});
  const resources = coerceObject(sheet.resources, {});

  return {
    ...sheet,
    id: String(safeRow.id || sheet.id || ''),
    ownerUserId: String(safeRow.owner_user_id || profile?.id || sheet.ownerUserId || ''),
    ownerUsername: String(profile?.username || safeRow.owner_username || sheet.ownerUsername || ''),
    identity: {
      ...identity,
      name: String(safeRow.name || identity.name || ''),
      age: safeRow.age ?? identity.age ?? '',
      className: String(safeRow.character_class || identity.className || 'Especialista'),
      level: Math.max(1, toNumber(safeRow.level ?? identity.level, 1)),
      concept: String(safeRow.concept || identity.concept || ''),
      manifestationOrigin: String(safeRow.manifestation_origin || identity.manifestationOrigin || ''),
      links: String(safeRow.bonds || identity.links || ''),
      summary: String(identity.summary || ''),
      appearance: String(identity.appearance || ''),
      image: String(safeRow.profile_image_url || identity.image || '')
    },
    resources: {
      ...resources,
      pvCurrent: toNumber(safeRow.current_pv ?? resources.pvCurrent, resources.pvCurrent ?? 0),
      peCurrent: toNumber(safeRow.current_pe ?? resources.peCurrent, resources.peCurrent ?? 0),
      pdCurrent: toNumber(safeRow.current_pd ?? resources.pdCurrent, resources.pdCurrent ?? 0),
      instability: toNumber(safeRow.instability ?? resources.instability, resources.instability ?? 0),
      armorBonus: toNumber(resources.armorBonus, 0),
      armorEquipment: String(resources.armorEquipment || ''),
      blockMode: String(resources.blockMode || 'vigor'),
      status: String(safeRow.status || resources.status || '')
    },
    companions
  };
}

async function loadMockAccounts() {
  const filePath = path.join(config.repoRoot, 'assets', 'js', 'mock-data.js');
  const raw = await fs.readFile(filePath, 'utf8');
  const context = { window: {} };
  vm.runInNewContext(raw, context);
  return Array.isArray(context.window?.MOCK_DATA?.accounts)
    ? context.window.MOCK_DATA.accounts
    : [];
}

function deriveProfilesFromCharacters(characters, mockAccounts) {
  const mockByUsername = new Map(mockAccounts.map((row) => [String(row.username || '').toLowerCase(), row]));
  return characters
    .map((character, index) => {
      const safeCharacter = coerceObject(character, {});
      const sheet = coerceObject(safeCharacter.sheet, {});
      const identity = coerceObject(sheet.identity || safeCharacter.identity, {});
      const username = sanitizeUsername(
        safeCharacter.owner_username
        || safeCharacter.ownerUsername
        || sheet.ownerUsername
        || identity.ownerUsername
        || `player-${index + 1}`,
        `player-${index + 1}`
      );
      const mock = mockByUsername.get(username.toLowerCase()) || null;
      const ownerId = String(safeCharacter.owner_user_id || safeCharacter.ownerUserId || sheet.ownerUserId || '');

      return {
        id: ownerId || '',
        email: normalizeEmail('', username),
        username,
        display_name: String(identity.name || safeCharacter.name || username),
        role: normalizeRole(mock?.role || 'player'),
        character_id: String(safeCharacter.id || sheet.id || '')
      };
    })
    .filter((profile) => profile.character_id);
}

async function main() {
  const directProfiles = asArray(await readJsonIfExists(path.join(config.migrationInputDir, 'profiles.json'), []));
  const directCharacters = asArray(await readJsonIfExists(path.join(config.migrationInputDir, 'characters.json'), []));
  const directCompanions = asArray(await readJsonIfExists(path.join(config.migrationInputDir, 'companions.json'), []));
  const directAuthUsers = asArray(await readJsonIfExists(path.join(config.migrationInputDir, 'auth-users.json'), []));
  const recoveryBundles = await readRecoveryBundles();
  const mockAccounts = await loadMockAccounts();
  const characters = dedupeBy(
    [...directCharacters, ...recoveryBundles.characters],
    (item) => String(item?.id || '')
  );
  const companions = dedupeBy(
    [...directCompanions, ...recoveryBundles.companions],
    (item) => String(item?.id || `${item?.character_id || ''}:${item?.name || ''}`)
  );
  const authUsers = dedupeBy(
    [...directAuthUsers, ...recoveryBundles.authUsers],
    (item) => String(item?.id || item?.email || '')
  );
  const profiles = dedupeBy(
    [
      ...directProfiles,
      ...recoveryBundles.profiles,
      ...deriveProfilesFromCharacters(characters, mockAccounts)
    ],
    (item) => String(item?.character_id || item?.id || item?.username || '')
  );

  if (!characters.length) {
    throw new Error('Nenhum personagem encontrado em migration-input/. Use characters.json ou bundles do navegador.');
  }

  if (!profiles.length) {
    throw new Error('Nenhum perfil encontrado ou derivado a partir dos personagens.');
  }

  const authById = new Map(authUsers.map((row) => [String(row.id || ''), row]));
  const authByEmail = new Map(authUsers.map((row) => [String(row.email || '').toLowerCase(), row]));
  const mockByUsername = new Map(mockAccounts.map((row) => [String(row.username || '').toLowerCase(), row]));
  const usedUsernames = new Set();
  const usedEmails = new Set();
  const profilesByCharacterId = new Map(
    profiles
      .filter((profile) => profile && profile.character_id)
      .map((profile) => [String(profile.character_id), profile])
  );
  const companionsByCharacterId = new Map();
  const orphanCompanions = [];

  companions.forEach((row) => {
    const characterId = String(row.character_id || '');
    if (!characterId) {
      orphanCompanions.push(row);
      return;
    }
    const list = companionsByCharacterId.get(characterId) || [];
    list.push(row);
    companionsByCharacterId.set(characterId, list);
  });

  const generatedPasswords = [];
  const missingHashes = [];

  await withTransaction(async (client) => {
    for (const profile of profiles) {
      const username = ensureUniqueValue(
        sanitizeUsername(
        profile.username || profile.display_name || profile.handle || (profile.email ? String(profile.email).split('@')[0] : '') || `user-${String(profile.id || createUuid()).slice(0, 8)}`,
        `user-${String(profile.id || createUuid()).slice(0, 8)}`
        ),
        usedUsernames,
        'user'
      );
      const email = ensureUniqueEmail(normalizeEmail(profile.email, username), usedEmails);
      const authUser = authById.get(String(profile.id || '')) || authByEmail.get(email.toLowerCase()) || null;
      const mockAccount = mockByUsername.get(username.toLowerCase()) || mockByUsername.get(String(profile.display_name || '').toLowerCase()) || null;

      let passwordHash = String(authUser?.encrypted_password || '');
      let mustResetPassword = false;

      if (!passwordHash && mockAccount?.password) {
        passwordHash = await hashPassword(mockAccount.password);
      }

      if (!passwordHash) {
        const tempPassword = createTemporaryPassword();
        passwordHash = await hashPassword(tempPassword);
        mustResetPassword = true;
        generatedPasswords.push({
          id: String(profile.id || ''),
          username,
          email,
          temporaryPassword: tempPassword
        });
        missingHashes.push({
          id: String(profile.id || ''),
          username,
          email
        });
      }

      await client.query(
        `
          INSERT INTO users (id, email, username, role, password_hash, must_reset_password)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (id)
          DO UPDATE SET
            email = EXCLUDED.email,
            username = EXCLUDED.username,
            role = EXCLUDED.role,
            password_hash = EXCLUDED.password_hash,
            must_reset_password = EXCLUDED.must_reset_password,
            updated_at = now()
        `,
        [
          String(profile.id || createUuid()),
          email,
          username,
          normalizeRole(profile.role),
          passwordHash,
          mustResetPassword
        ]
      );
    }

    for (const row of characters) {
      const characterId = String(row.id || '');
      const profile = profilesByCharacterId.get(characterId) || null;
      const ownCompanions = (companionsByCharacterId.get(characterId) || [])
        .sort((left, right) => toNumber(left.sort_order, 0) - toNumber(right.sort_order, 0))
        .map(normalizeCompanionRow);

      const character = buildCharacterFromLegacyRow(
        row,
        profile,
        ownCompanions.length
          ? ownCompanions
          : asArray(coerceObject(row, {}).sheet?.companions || row.companions).map(normalizeCompanionRow)
      );
      const ownerUserId = String(row.owner_user_id || profile?.id || character.ownerUserId || '') || null;
      const payload = characterToRowPayload(character, {
        id: characterId,
        owner_user_id: ownerUserId
      });

      await client.query(
        `
          INSERT INTO characters (
            id,
            owner_user_id,
            name,
            age,
            character_class,
            level,
            status,
            profile_image_url,
            sheet
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (id)
          DO UPDATE SET
            owner_user_id = EXCLUDED.owner_user_id,
            name = EXCLUDED.name,
            age = EXCLUDED.age,
            character_class = EXCLUDED.character_class,
            level = EXCLUDED.level,
            status = EXCLUDED.status,
            profile_image_url = EXCLUDED.profile_image_url,
            sheet = EXCLUDED.sheet,
            updated_at = now()
        `,
        [
          payload.id,
          ownerUserId,
          payload.name,
          payload.age,
          payload.character_class,
          payload.level,
          payload.status,
          payload.profile_image_url,
          payload.sheet
        ]
      );
    }
  });

  const report = {
    importedAt: new Date().toISOString(),
    usersImported: profiles.length,
    charactersImported: characters.length,
    companionsImported: companions.length,
    orphanCompanions,
    missingHashes,
    generatedPasswords
  };

  const reportPath = path.join(config.migrationInputDir, 'import-report.json');
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');

  console.log('Importacao concluida.');
  console.log(`Usuarios: ${report.usersImported}`);
  console.log(`Fichas: ${report.charactersImported}`);
  console.log(`Mini-fichas: ${report.companionsImported}`);
  console.log(`Relatorio: ${reportPath}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDb();
  });
