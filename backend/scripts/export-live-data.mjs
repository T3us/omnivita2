import fs from 'node:fs/promises';
import path from 'node:path';

import { config } from '../src/config.mjs';
import { closeDb, query } from '../src/db.mjs';
import { listMasterData } from '../src/master-data.mjs';
import { rowToCharacter } from '../src/serializers.mjs';

function buildTimestamp() {
  return new Date()
    .toISOString()
    .replace(/[:]/g, '-')
    .replace(/\.\d{3}Z$/, 'Z');
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function main() {
  const usersResult = await query(`
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
    ORDER BY lower(u.username), u.created_at
  `);

  const charactersResult = await query(`
    SELECT
      c.*,
      u.username AS owner_username
    FROM characters c
    LEFT JOIN users u ON u.id = c.owner_user_id
    ORDER BY lower(c.name), c.created_at
  `);

  const combatResult = await query(`
    SELECT id, state, updated_at
    FROM combat_state
    ORDER BY id
  `);
  const masterData = await listMasterData();

  const payload = {
    exportedAt: new Date().toISOString(),
    source: 'omnivita-backend',
    databaseUrlHost: (() => {
      try {
        const url = new URL(config.databaseUrl);
        return url.host;
      } catch {
        return 'unknown';
      }
    })(),
    counts: {
      users: usersResult.rows.length,
      characters: charactersResult.rows.length,
      combatStates: combatResult.rows.length,
      masterData: masterData.length
    },
    users: usersResult.rows.map((row) => ({
      id: String(row.id),
      email: String(row.email || ''),
      username: String(row.username || ''),
      role: String(row.role || 'player'),
      passwordHash: row.password_hash ? String(row.password_hash) : '',
      mustResetPassword: Boolean(row.must_reset_password),
      characterId: row.character_id ? String(row.character_id) : '',
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null
    })),
    characters: charactersResult.rows.map((row) => rowToCharacter(row)),
    combatStates: combatResult.rows.map((row) => ({
      id: String(row.id),
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
      state: row.state || {}
    })),
    masterData
  };

  const exportDir = path.join(config.migrationInputDir, 'live-export');
  await ensureDir(exportDir);

  const fileName = `omnivita-backend-export-${buildTimestamp()}.json`;
  const filePath = path.join(exportDir, fileName);

  await fs.writeFile(filePath, JSON.stringify(payload, null, 2), 'utf8');

  console.log(`Export concluido em: ${filePath}`);
  console.log(`Usuarios: ${payload.counts.users}`);
  console.log(`Fichas: ${payload.counts.characters}`);
  console.log(`Estados de combate: ${payload.counts.combatStates}`);
  console.log(`Dados do mestre: ${payload.counts.masterData}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDb().catch(() => {});
  });
