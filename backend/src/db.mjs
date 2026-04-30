import { Pool } from 'pg';
import { config } from './config.mjs';

function getSslConfig() {
  if (!config.databaseUrl) return false;
  const localHosts = ['localhost', '127.0.0.1'];
  if (localHosts.some((host) => config.databaseUrl.includes(host))) {
    return false;
  }
  return { rejectUnauthorized: false };
}

export const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: getSslConfig()
});

pool.on('error', (error) => {
  console.error('Postgres pool error:', error);
});

export async function query(text, params = [], client = pool) {
  return client.query(text, params);
}

export async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Rollback error:', rollbackError);
    }
    throw error;
  } finally {
    client.release();
  }
}

export async function closeDb() {
  await pool.end();
}
