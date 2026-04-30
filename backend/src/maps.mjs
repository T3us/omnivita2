import { query } from './db.mjs';

function normalizeId(value) {
  return String(value || '').trim();
}

function normalizeName(value) {
  const name = String(value || '').trim();
  return name || 'Mapa sem nome';
}

function normalizeMapPayload(input = {}) {
  const map = input && typeof input === 'object' && input.map ? input.map : input;
  const id = normalizeId(map?.id);
  if (!id) {
    const error = new Error('Mapa sem id.');
    error.statusCode = 400;
    throw error;
  }

  return {
    id,
    name: normalizeName(map?.name),
    data: {
      ...map,
      id,
      name: normalizeName(map?.name)
    }
  };
}

function rowToMap(row) {
  if (!row) return null;
  const data = row.data && typeof row.data === 'object' ? row.data : {};
  return {
    ...data,
    id: String(row.id),
    name: String(row.name || data.name || 'Mapa sem nome'),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : '',
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : ''
  };
}

function rowToMapSummary(row) {
  const data = row.data && typeof row.data === 'object' ? row.data : {};
  return {
    id: String(row.id),
    name: String(row.name || data.name || 'Mapa sem nome'),
    width: Number(data.width || 0),
    height: Number(data.height || 0),
    gridSize: Number(data.gridSize || 0),
    mode: String(data.mode || 'build'),
    tokens: Array.isArray(data.tokens) ? data.tokens.length : 0,
    objects: Array.isArray(data.objectLayer?.objects) ? data.objectLayer.objects.length : 0,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : '',
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : ''
  };
}

export async function listMaps(client) {
  const result = await query(
    'SELECT id, name, data, created_at, updated_at FROM maps ORDER BY updated_at DESC, lower(name)',
    [],
    client
  );
  return result.rows.map(rowToMapSummary);
}

export async function getMapById(mapId, client) {
  const result = await query(
    'SELECT id, name, data, created_at, updated_at FROM maps WHERE id = $1 LIMIT 1',
    [normalizeId(mapId)],
    client
  );
  return rowToMap(result.rows[0]);
}

export async function createMap(mapInput, client) {
  const payload = normalizeMapPayload(mapInput);
  const result = await query(
    `
      INSERT INTO maps (id, name, data)
      VALUES ($1, $2, $3)
      ON CONFLICT (id)
      DO UPDATE SET name = EXCLUDED.name, data = EXCLUDED.data, updated_at = now()
      RETURNING id, name, data, created_at, updated_at
    `,
    [payload.id, payload.name, payload.data],
    client
  );
  return rowToMap(result.rows[0]);
}

export async function updateMap(mapId, mapInput, client) {
  const payload = normalizeMapPayload({
    ...(mapInput && typeof mapInput === 'object' && mapInput.map ? mapInput.map : mapInput),
    id: normalizeId(mapId)
  });
  const result = await query(
    `
      UPDATE maps
      SET name = $2, data = $3, updated_at = now()
      WHERE id = $1
      RETURNING id, name, data, created_at, updated_at
    `,
    [payload.id, payload.name, payload.data],
    client
  );
  return rowToMap(result.rows[0]);
}

export async function deleteMap(mapId, client) {
  const result = await query(
    'DELETE FROM maps WHERE id = $1 RETURNING id',
    [normalizeId(mapId)],
    client
  );
  return Boolean(result.rows[0]);
}
