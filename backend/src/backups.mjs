import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from './config.mjs';
import { query, withTransaction } from './db.mjs';

export const BACKUP_VERSION = 1;

function toIso(value) {
  return value ? new Date(value).toISOString() : '';
}

function normalizeBackupRows(rows, dataKey = 'data') {
  return rows.map((row) => ({
    ...row,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    [dataKey]: row[dataKey] && typeof row[dataKey] === 'object' ? row[dataKey] : {}
  })).map(({ created_at, updated_at, ...entry }) => entry);
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

export function createBackupFilename(date = new Date()) {
  const parts = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ];
  const time = [
    String(date.getHours()).padStart(2, '0'),
    String(date.getMinutes()).padStart(2, '0')
  ];
  return `omnivita-backup-${parts.join('-')}-${time.join('-')}.json`;
}

export function getBackupDir() {
  return path.join(config.repoRoot, 'migration-input', 'backups');
}

export async function buildBackupPayload({ reason = 'manual-export' } = {}) {
  const [
    usersResult,
    charactersResult,
    combatResult,
    masterDataResult,
    mapsResult,
    sessionBoardsResult,
    customAssetsResult,
    tabletopSettingsResult
  ] = await Promise.all([
    query(`
      SELECT
        u.id,
        u.email,
        u.username,
        u.role,
        u.password_hash,
        u.must_reset_password,
        u.created_at,
        u.updated_at,
        c.id AS character_id
      FROM users u
      LEFT JOIN characters c ON c.owner_user_id = u.id
      ORDER BY lower(u.username)
    `),
    query(`
      SELECT
        c.id,
        c.owner_user_id,
        u.username AS owner_username,
        c.name,
        c.age,
        c.character_class,
        c.level,
        c.status,
        c.profile_image_url,
        c.sheet,
        c.created_at,
        c.updated_at
      FROM characters c
      LEFT JOIN users u ON u.id = c.owner_user_id
      ORDER BY lower(c.name)
    `),
    query('SELECT id, state, updated_at FROM combat_state ORDER BY id'),
    query('SELECT key, data, updated_at FROM master_data ORDER BY key'),
    query('SELECT id, name, data, created_at, updated_at FROM maps ORDER BY updated_at DESC'),
    query('SELECT id, name, data, created_at, updated_at FROM session_boards ORDER BY updated_at DESC'),
    query('SELECT id, name, data, created_at, updated_at FROM custom_assets ORDER BY updated_at DESC'),
    query('SELECT id, data, updated_at FROM tabletop_settings ORDER BY id')
  ]);

  const exportedAt = new Date().toISOString();
  return {
    schema: 'omnivita-backup',
    version: BACKUP_VERSION,
    exportedAt,
    reason,
    counts: {
      users: usersResult.rows.length,
      characters: charactersResult.rows.length,
      combatState: combatResult.rows.length,
      masterData: masterDataResult.rows.length,
      maps: mapsResult.rows.length,
      sessionBoards: sessionBoardsResult.rows.length,
      customAssets: customAssetsResult.rows.length,
      tabletopSettings: tabletopSettingsResult.rows.length
    },
    users: usersResult.rows.map((row) => ({
      id: String(row.id),
      email: String(row.email || ''),
      username: String(row.username || ''),
      role: String(row.role || 'player'),
      passwordHash: row.password_hash ? String(row.password_hash) : null,
      mustResetPassword: Boolean(row.must_reset_password),
      characterId: row.character_id ? String(row.character_id) : '',
      createdAt: toIso(row.created_at),
      updatedAt: toIso(row.updated_at)
    })),
    characters: charactersResult.rows.map((row) => ({
      ...(row.sheet && typeof row.sheet === 'object' ? row.sheet : {}),
      id: String(row.id),
      ownerUserId: row.owner_user_id ? String(row.owner_user_id) : '',
      ownerUsername: row.owner_username ? String(row.owner_username) : '',
      createdAt: toIso(row.created_at),
      updatedAt: toIso(row.updated_at)
    })),
    combatState: combatResult.rows.map((row) => ({
      id: String(row.id || 'global'),
      state: row.state && typeof row.state === 'object' ? row.state : {},
      updatedAt: toIso(row.updated_at)
    })),
    masterData: masterDataResult.rows.map((row) => ({
      key: String(row.key),
      data: row.data && typeof row.data === 'object' ? row.data : {},
      updatedAt: toIso(row.updated_at)
    })),
    maps: normalizeBackupRows(mapsResult.rows),
    sessionBoards: normalizeBackupRows(sessionBoardsResult.rows),
    customAssets: normalizeBackupRows(customAssetsResult.rows),
    tabletopSettings: tabletopSettingsResult.rows.map((row) => ({
      id: String(row.id || 'global'),
      data: row.data && typeof row.data === 'object' ? row.data : {},
      updatedAt: toIso(row.updated_at)
    }))
  };
}

export async function writeBackupFile(payload, { filename = createBackupFilename(), dir = getBackupDir(), writeLatest = true } = {}) {
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, filename);
  await fs.writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  if (writeLatest) {
    await fs.writeFile(path.join(dir, 'latest.json'), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  }
  return { filePath, filename };
}

export async function readLatestBackupFile() {
  const filePath = path.join(getBackupDir(), 'latest.json');
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

export function summarizeBackupPayload(payload = {}) {
  return {
    schema: String(payload.schema || ''),
    version: Number(payload.version || 0),
    exportedAt: String(payload.exportedAt || ''),
    users: safeArray(payload.users).length,
    characters: safeArray(payload.characters).length,
    combatState: safeArray(payload.combatState || payload.combatStates).length,
    masterData: safeArray(payload.masterData).length,
    maps: safeArray(payload.maps).length,
    sessionBoards: safeArray(payload.sessionBoards || payload.session_boards).length,
    customAssets: safeArray(payload.customAssets || payload.custom_assets).length,
    tabletopSettings: safeArray(payload.tabletopSettings || payload.tabletop_settings).length
  };
}

export async function restoreBackupPayload(payload = {}, { confirm = false } = {}) {
  const summary = summarizeBackupPayload(payload);
  if (!confirm) {
    return {
      dryRun: true,
      message: 'Importacao pronta. Confirme para aplicar sem apagar dados existentes.',
      summary
    };
  }

  await withTransaction(async (client) => {
    for (const user of safeArray(payload.users)) {
      await client.query(
        `
          INSERT INTO users (
            id,
            email,
            username,
            role,
            password_hash,
            must_reset_password,
            created_at,
            updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7::timestamptz, now()), COALESCE($8::timestamptz, now()))
          ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            username = EXCLUDED.username,
            role = EXCLUDED.role,
            password_hash = COALESCE(EXCLUDED.password_hash, users.password_hash),
            must_reset_password = EXCLUDED.must_reset_password,
            updated_at = now()
        `,
        [
          String(user.id),
          String(user.email || ''),
          String(user.username || ''),
          String(user.role || 'player') === 'master' ? 'master' : 'player',
          user.passwordHash ? String(user.passwordHash) : null,
          Boolean(user.mustResetPassword),
          user.createdAt || null,
          user.updatedAt || null
        ]
      );
    }

    for (const character of safeArray(payload.characters)) {
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
            sheet,
            created_at,
            updated_at
          )
          VALUES ($1, NULLIF($2, '')::uuid, $3, $4, $5, $6, $7, $8, $9::jsonb, COALESCE($10::timestamptz, now()), COALESCE($11::timestamptz, now()))
          ON CONFLICT (id) DO UPDATE SET
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
          String(character.id),
          String(character.ownerUserId || ''),
          String(character.identity?.name || character.name || 'Personagem'),
          String(character.identity?.age || character.age || ''),
          String(character.identity?.className || character.characterClass || 'Especialista'),
          Number(character.identity?.level || character.level || 1),
          String(character.resources?.status || character.status || ''),
          String(character.identity?.image || character.profileImageUrl || ''),
          JSON.stringify(character),
          character.createdAt || null,
          character.updatedAt || null
        ]
      );
    }

    for (const item of safeArray(payload.combatState || payload.combatStates)) {
      await client.query(
        `
          INSERT INTO combat_state (id, state, updated_at)
          VALUES ($1, $2::jsonb, COALESCE($3::timestamptz, now()))
          ON CONFLICT (id) DO UPDATE SET
            state = EXCLUDED.state,
            updated_at = now()
        `,
        [String(item.id || 'global'), JSON.stringify(item.state || {}), item.updatedAt || null]
      );
    }

    for (const item of safeArray(payload.masterData)) {
      await client.query(
        `
          INSERT INTO master_data (key, data, updated_at)
          VALUES ($1, $2::jsonb, COALESCE($3::timestamptz, now()))
          ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = now()
        `,
        [String(item.key || ''), JSON.stringify(item.data || {}), item.updatedAt || null]
      );
    }

    for (const item of safeArray(payload.maps)) {
      const data = item.data && typeof item.data === 'object' ? item.data : item;
      await client.query(
        `
          INSERT INTO maps (id, name, data, created_at, updated_at)
          VALUES ($1, $2, $3::jsonb, COALESCE($4::timestamptz, now()), COALESCE($5::timestamptz, now()))
          ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, data = EXCLUDED.data, updated_at = now()
        `,
        [String(item.id || data.id), String(item.name || data.name || 'Mapa sem nome'), JSON.stringify(data), item.createdAt || null, item.updatedAt || null]
      );
    }

    for (const item of safeArray(payload.sessionBoards || payload.session_boards)) {
      const data = item.data && typeof item.data === 'object' ? item.data : item;
      await client.query(
        `
          INSERT INTO session_boards (id, name, data, created_at, updated_at)
          VALUES ($1, $2, $3::jsonb, COALESCE($4::timestamptz, now()), COALESCE($5::timestamptz, now()))
          ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, data = EXCLUDED.data, updated_at = now()
        `,
        [String(item.id || data.id), String(item.name || data.name || 'Sessao sem nome'), JSON.stringify(data), item.createdAt || null, item.updatedAt || null]
      );
    }

    for (const item of safeArray(payload.customAssets || payload.custom_assets)) {
      const data = item.data && typeof item.data === 'object' ? item.data : item;
      await client.query(
        `
          INSERT INTO custom_assets (id, name, data, created_at, updated_at)
          VALUES ($1, $2, $3::jsonb, COALESCE($4::timestamptz, now()), COALESCE($5::timestamptz, now()))
          ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, data = EXCLUDED.data, updated_at = now()
        `,
        [String(item.id || data.id), String(item.name || data.name || 'Asset customizado'), JSON.stringify(data), item.createdAt || null, item.updatedAt || null]
      );
    }

    for (const item of safeArray(payload.tabletopSettings || payload.tabletop_settings)) {
      await client.query(
        `
          INSERT INTO tabletop_settings (id, data, updated_at)
          VALUES ($1, $2::jsonb, COALESCE($3::timestamptz, now()))
          ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()
        `,
        [String(item.id || 'global'), JSON.stringify(item.data || {}), item.updatedAt || null]
      );
    }
  });

  return {
    dryRun: false,
    message: 'Backup importado sem apagar dados fora do arquivo.',
    summary
  };
}
