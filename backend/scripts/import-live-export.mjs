import fs from 'node:fs/promises';
import path from 'node:path';

import { config } from '../src/config.mjs';
import { characterToRowPayload } from '../src/serializers.mjs';
import { closeDb, withTransaction } from '../src/db.mjs';
import { sanitizeMasterDataKey } from '../src/master-data.mjs';

async function listJsonFiles(dirPath) {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.json'))
      .map((entry) => path.join(dirPath, entry.name));
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
}

async function resolveInputFile() {
  const explicitArg = process.argv[2] ? path.resolve(process.argv[2]) : '';
  if (explicitArg) return explicitArg;

  const exportDir = path.join(config.migrationInputDir, 'live-export');
  const files = await listJsonFiles(exportDir);
  if (!files.length) {
    throw new Error('Nenhum export live encontrado em migration-input/live-export/.');
  }

  const stats = await Promise.all(
    files.map(async (filePath) => ({
      filePath,
      stat: await fs.stat(filePath)
    }))
  );

  stats.sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs);
  return stats[0].filePath;
}

async function readPayload(filePath) {
  const raw = JSON.parse(await fs.readFile(filePath, 'utf8'));
  return {
    users: Array.isArray(raw?.users) ? raw.users : [],
    characters: Array.isArray(raw?.characters) ? raw.characters : [],
    combatStates: Array.isArray(raw?.combatStates) ? raw.combatStates : [],
    masterData: Array.isArray(raw?.masterData) ? raw.masterData : []
  };
}

async function main() {
  const inputFile = await resolveInputFile();
  const payload = await readPayload(inputFile);

  await withTransaction(async (client) => {
    await client.query('DELETE FROM sessions');

    for (const user of payload.users) {
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
            password_hash = EXCLUDED.password_hash,
            must_reset_password = EXCLUDED.must_reset_password,
            updated_at = COALESCE(EXCLUDED.updated_at, now())
        `,
        [
          String(user.id),
          String(user.email || ''),
          String(user.username || ''),
          String(user.role || 'player'),
          user.passwordHash ? String(user.passwordHash) : null,
          Boolean(user.mustResetPassword),
          user.createdAt || null,
          user.updatedAt || null
        ]
      );
    }

    for (const character of payload.characters) {
      const rowPayload = characterToRowPayload(character, {});
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
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, now(), now())
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
          rowPayload.id,
          character.ownerUserId ? String(character.ownerUserId) : null,
          rowPayload.name,
          rowPayload.age,
          rowPayload.character_class,
          rowPayload.level,
          rowPayload.status,
          rowPayload.profile_image_url,
          JSON.stringify(rowPayload.sheet)
        ]
      );
    }

    for (const combatState of payload.combatStates) {
      await client.query(
        `
          INSERT INTO combat_state (id, state, updated_at)
          VALUES ($1, $2::jsonb, COALESCE($3::timestamptz, now()))
          ON CONFLICT (id) DO UPDATE SET
            state = EXCLUDED.state,
            updated_at = COALESCE(EXCLUDED.updated_at, now())
        `,
        [
          String(combatState.id || 'global'),
          JSON.stringify(combatState.state || {}),
          combatState.updatedAt || null
        ]
      );
    }

    for (const item of payload.masterData) {
      const key = sanitizeMasterDataKey(item.key);
      await client.query(
        `
          INSERT INTO master_data (key, data, updated_at)
          VALUES ($1, $2::jsonb, COALESCE($3::timestamptz, now()))
          ON CONFLICT (key) DO UPDATE SET
            data = EXCLUDED.data,
            updated_at = COALESCE(EXCLUDED.updated_at, now())
        `,
        [
          key,
          JSON.stringify(item.data || {}),
          item.updatedAt || null
        ]
      );
    }
  });

  console.log(`Import concluido a partir de: ${inputFile}`);
  console.log(`Usuarios: ${payload.users.length}`);
  console.log(`Fichas: ${payload.characters.length}`);
  console.log(`Estados de combate: ${payload.combatStates.length}`);
  console.log(`Dados do mestre: ${payload.masterData.length}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDb().catch(() => {});
  });
