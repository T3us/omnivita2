import { query } from './db.mjs';
import { cloneJson } from './serializers.mjs';

function normalizeKey(key) {
  return String(key || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

export function sanitizeMasterDataKey(key) {
  const normalized = normalizeKey(key);
  if (!normalized) {
    throw new Error('Chave de dados do mestre invalida.');
  }
  return normalized;
}

export async function getMasterData(key, client) {
  const safeKey = sanitizeMasterDataKey(key);
  const result = await query(
    'SELECT key, data, updated_at FROM master_data WHERE key = $1 LIMIT 1',
    [safeKey],
    client
  );

  const row = result.rows[0];
  if (!row) {
    return {
      key: safeKey,
      data: null,
      updatedAt: null
    };
  }

  return {
    key: String(row.key || safeKey),
    data: cloneJson(row.data || null),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null
  };
}

export async function saveMasterData(key, data, client) {
  const safeKey = sanitizeMasterDataKey(key);
  const safeData = cloneJson(data || {});
  const result = await query(
    `
      INSERT INTO master_data (key, data, updated_at)
      VALUES ($1, $2::jsonb, now())
      ON CONFLICT (key)
      DO UPDATE SET
        data = EXCLUDED.data,
        updated_at = now()
      RETURNING key, data, updated_at
    `,
    [safeKey, JSON.stringify(safeData)],
    client
  );

  const row = result.rows[0];
  return {
    key: String(row.key || safeKey),
    data: cloneJson(row.data || {}),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null
  };
}

export async function listMasterData(client) {
  const result = await query(
    'SELECT key, data, updated_at FROM master_data ORDER BY key',
    [],
    client
  );

  return result.rows.map((row) => ({
    key: String(row.key || ''),
    data: cloneJson(row.data || {}),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null
  }));
}

