import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../src/config.mjs';
import { closeDb, pool, withTransaction } from '../src/db.mjs';

async function ensureSchemaMigrations() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);
}

async function getAppliedFiles(client) {
  const result = await client.query('SELECT filename FROM schema_migrations');
  return new Set(result.rows.map((row) => String(row.filename)));
}

async function main() {
  if (!config.databaseUrl) {
    throw new Error('DATABASE_URL nao configurada.');
  }

  await ensureSchemaMigrations();

  const files = (await fs.readdir(config.sqlDir))
    .filter((file) => file.endsWith('.sql'))
    .sort();

  await withTransaction(async (client) => {
    const applied = await getAppliedFiles(client);

    for (const file of files) {
      if (applied.has(file)) continue;
      const sql = await fs.readFile(path.join(config.sqlDir, file), 'utf8');
      console.log(`Aplicando migration ${file}...`);
      await client.query(sql);
      await client.query(
        'INSERT INTO schema_migrations (filename) VALUES ($1) ON CONFLICT (filename) DO NOTHING',
        [file]
      );
    }
  });

  console.log('Migrations aplicadas com sucesso.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDb();
  });
