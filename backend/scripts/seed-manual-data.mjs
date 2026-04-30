import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../src/config.mjs';
import { closeDb, withTransaction } from '../src/db.mjs';
import { createUuid, hashPassword } from '../src/security.mjs';
import { normalizeEmail, sanitizeUsername } from '../src/serializers.mjs';

function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeRole(value) {
  return String(value || '').toLowerCase() === 'master' ? 'master' : 'player';
}

function createPlaceholderCharacterSheet(account, userId) {
  const name = String(account.characterName || account.username || 'Personagem').trim();
  return {
    id: String(account.characterId || slugify(name) || account.username || createUuid()),
    ownerUserId: userId,
    ownerUsername: String(account.username || ''),
    identity: {
      name,
      age: '',
      className: 'Especialista',
      level: 1,
      concept: 'Ficha placeholder criada para migracao.',
      manifestationOrigin: '',
      links: '',
      summary: 'Ficha placeholder. Os dados reais serao importados depois.',
      appearance: '',
      image: ''
    },
    attributes: {
      forca: 0,
      destreza: 0,
      sentidos: 0,
      vigor: 0,
      inteligencia: 0,
      nexo: 0
    },
    resources: {
      pvCurrent: null,
      peCurrent: null,
      pdCurrent: null,
      instability: 0,
      armorBonus: 0,
      armorEquipment: '',
      blockMode: 'vigor',
      status: 'Pendente de importacao'
    },
    progression: {
      extraPeV: 0,
      manualPeVSpent: 0,
      facetaUnlocks: 0,
      facetaStabilizations: 0,
      notes: 'Criado automaticamente na migracao.'
    },
    skills: {
      acrobacia: 0,
      adestramento: 0,
      artes: 0,
      atletismo: 0,
      atualidades: 0,
      ciencias: 0,
      crime: 0,
      diplomacia: 0,
      enganacao: 0,
      fortitude: 0,
      furtividade: 0,
      iniciativa: 0,
      intimidacao: 0,
      intuicao: 0,
      investigacao: 0,
      luta: 0,
      manifestacao: 0,
      medicina: 0,
      percepcao: 0,
      pilotagem: 0,
      pontaria: 0,
      profissao: 0,
      reflexos: 0,
      sobrevivencia: 0,
      tecnologia: 0,
      vontade: 0
    },
    aptitudes: [],
    manifestation: {
      name: '',
      origin: '',
      state: 'Parcial',
      glitches: '',
      activeEffects: ''
    },
    facets: [],
    companions: [],
    equipment: {
      primaryWeapon: '',
      secondaryWeapon: '',
      items: ''
    },
    notes: 'Placeholder automatico para manter conta e vinculo.',
    masterSession: {
      tags: [],
      combatShared: null,
      combatControl: {
        requestId: '',
        updatedAt: '',
        self: null,
        companions: []
      }
    },
    masterNotes: ''
  };
}

async function main() {
  const manualAccountsPath = path.join(config.repoRoot, 'migration-input', 'manual-accounts.json');
  const raw = await fs.readFile(manualAccountsPath, 'utf8');
  const accounts = JSON.parse(raw);

  if (!Array.isArray(accounts) || !accounts.length) {
    throw new Error('manual-accounts.json vazio ou invalido.');
  }

  await withTransaction(async (client) => {
    for (const account of accounts) {
      const username = sanitizeUsername(account.username, `user-${createUuid().slice(0, 8)}`);
      const email = normalizeEmail(account.email, username);
      const role = normalizeRole(account.role);
      const passwordHash = await hashPassword(String(account.password || ''));

      let userId = String(account.userId || '');
      const existingUser = await client.query(
        `
          SELECT id
          FROM users
          WHERE lower(username) = lower($1) OR lower(email) = lower($2)
          LIMIT 1
        `,
        [username, email]
      );

      if (existingUser.rows[0]) {
        userId = String(existingUser.rows[0].id);
      } else {
        userId = userId || createUuid();
      }

      await client.query(
        `
          INSERT INTO users (id, email, username, role, password_hash, must_reset_password)
          VALUES ($1, $2, $3, $4, $5, false)
          ON CONFLICT (id)
          DO UPDATE SET
            email = EXCLUDED.email,
            username = EXCLUDED.username,
            role = EXCLUDED.role,
            password_hash = EXCLUDED.password_hash,
            must_reset_password = false,
            updated_at = now()
        `,
        [userId, email, username, role, passwordHash]
      );

      if (role !== 'player' || !account.characterId || !account.characterName) {
        continue;
      }

      const sheet = createPlaceholderCharacterSheet(account, userId);

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
          String(account.characterId),
          userId,
          String(account.characterName),
          '',
          'Especialista',
          1,
          'Pendente de importacao',
          '',
          sheet
        ]
      );
    }
  });

  console.log('Contas manuais e placeholders criados com sucesso.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDb();
  });
