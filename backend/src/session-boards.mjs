import { query } from './db.mjs';

function normalizeId(value) {
  return String(value || '').trim();
}

function normalizeName(value) {
  const name = String(value || '').trim();
  return name || 'Sessao sem nome';
}

function normalizeBoardPayload(input = {}) {
  const board = input && typeof input === 'object' && input.board ? input.board : input;
  const id = normalizeId(board?.id);
  if (!id) {
    const error = new Error('Sessao sem id.');
    error.statusCode = 400;
    throw error;
  }

  return {
    id,
    name: normalizeName(board?.name),
    data: {
      ...board,
      id,
      name: normalizeName(board?.name)
    }
  };
}

function rowToBoard(row) {
  if (!row) return null;
  const data = row.data && typeof row.data === 'object' ? row.data : {};
  return {
    ...data,
    id: String(row.id),
    name: String(row.name || data.name || 'Sessao sem nome'),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : '',
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : ''
  };
}

function rowToBoardSummary(row) {
  const data = row.data && typeof row.data === 'object' ? row.data : {};
  const activeMap = data.activeMap && typeof data.activeMap === 'object' ? data.activeMap : null;
  const tokens = Array.isArray(data.tokens)
    ? data.tokens.length
    : Array.isArray(activeMap?.tokens)
      ? activeMap.tokens.length
      : 0;
  const exploredCells = Array.isArray(data.fog?.exploredCells)
    ? data.fog.exploredCells.length
    : Array.isArray(activeMap?.fogLayer?.revealedCells)
      ? activeMap.fogLayer.revealedCells.length
      : 0;

  return {
    id: String(row.id),
    name: String(row.name || data.name || 'Sessao sem nome'),
    sourceMapId: String(data.sourceMapId || activeMap?.id || ''),
    sourceMapName: String(data.sourceMapName || activeMap?.name || ''),
    activeMapInstanceId: data.activeMapInstanceId ? String(data.activeMapInstanceId) : undefined,
    tokens,
    exploredCells,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : '',
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : ''
  };
}

export async function listSessionBoards(client) {
  const result = await query(
    'SELECT id, name, data, created_at, updated_at FROM session_boards ORDER BY updated_at DESC, lower(name)',
    [],
    client
  );
  return result.rows.map(rowToBoardSummary);
}

export async function getSessionBoardById(boardId, client) {
  const result = await query(
    'SELECT id, name, data, created_at, updated_at FROM session_boards WHERE id = $1 LIMIT 1',
    [normalizeId(boardId)],
    client
  );
  return rowToBoard(result.rows[0]);
}

export async function getLatestSessionBoard(client) {
  const result = await query(
    'SELECT id, name, data, created_at, updated_at FROM session_boards ORDER BY updated_at DESC LIMIT 1',
    [],
    client
  );
  return rowToBoard(result.rows[0]);
}

export async function createSessionBoard(boardInput, client) {
  const payload = normalizeBoardPayload(boardInput);
  const result = await query(
    `
      INSERT INTO session_boards (id, name, data)
      VALUES ($1, $2, $3)
      ON CONFLICT (id)
      DO UPDATE SET name = EXCLUDED.name, data = EXCLUDED.data, updated_at = now()
      RETURNING id, name, data, created_at, updated_at
    `,
    [payload.id, payload.name, payload.data],
    client
  );
  return rowToBoard(result.rows[0]);
}

export async function updateSessionBoard(boardId, boardInput, client) {
  const payload = normalizeBoardPayload({
    ...(boardInput && typeof boardInput === 'object' && boardInput.board ? boardInput.board : boardInput),
    id: normalizeId(boardId)
  });
  const result = await query(
    `
      UPDATE session_boards
      SET name = $2, data = $3, updated_at = now()
      WHERE id = $1
      RETURNING id, name, data, created_at, updated_at
    `,
    [payload.id, payload.name, payload.data],
    client
  );
  return rowToBoard(result.rows[0]);
}

export async function deleteSessionBoard(boardId, client) {
  const result = await query(
    'DELETE FROM session_boards WHERE id = $1 RETURNING id',
    [normalizeId(boardId)],
    client
  );
  return Boolean(result.rows[0]);
}

export function canControlSessionToken(user, token = {}) {
  const role = String(user?.role || '').toLowerCase();
  if (role === 'master' || role === 'gm') return true;
  if (token.locked) return false;
  if (token.hidden || token.visibleToPlayers === false) return false;
  // Temporary tabletop rule: players may move visible tokens while ownership is being stabilized.
  return true;
  const userId = String(user?.id || '');
  const characterId = String(user?.characterId || '');
  const controlledBy = Array.isArray(token.controlledByUserIds) ? token.controlledByUserIds.map(String) : [];
  return Boolean(
    (token.ownerUserId && String(token.ownerUserId) === userId)
    || (userId && controlledBy.includes(userId))
    || (token.ownerCharacterId && String(token.ownerCharacterId) === characterId)
    || (token.formOwnerCharacterId && String(token.formOwnerCharacterId) === characterId)
    || (token.sourceSheetId && String(token.sourceSheetId) === characterId)
    || (token.characterId && String(token.characterId) === characterId)
  );
}

export function sanitizeSessionBoardForUser(board, user) {
  if (!board) return null;
  const role = String(user?.role || '').toLowerCase();
  if (role === 'master' || role === 'gm') return board;

  const next = JSON.parse(JSON.stringify(board));
  const activeMap = next.activeMap && typeof next.activeMap === 'object' ? next.activeMap : null;
  if (!activeMap) return next;

  activeMap.mode = 'session';
  sanitizeMapDataForPlayer(activeMap);
  activeMap.sessionMapInstances = safeArray(activeMap.sessionMapInstances)
    .filter((instance) => instance.visibleToPlayers !== false)
    .map((instance) => ({ ...instance, data: instance.data ? sanitizeMapDataForPlayer(instance.data) : instance.data }));
  next.mapInstances = safeArray(next.mapInstances)
    .filter((instance) => instance.visibleToPlayers !== false)
    .map((instance) => ({ ...instance, data: instance.data ? sanitizeMapDataForPlayer(instance.data) : instance.data }));

  return next;
}

function sanitizeMapDataForPlayer(map) {
  if (!map || typeof map !== 'object') return map;
  map.mode = 'session';
  map.tokens = safeArray(map.tokens).filter((token) => token.visibleToPlayers !== false && !token.hidden);
  filterObjectLayer(map.objectLayer);
  filterObjectLayer(map.decorationLayer);
  filterObjectLayer(map.detailLayer);
  filterObjectLayer(map.mechanicalLayer);
  filterObjectLayer(map.notesLayer);
  filterObjectLayer(map.lightingLayer, true);
  map.areaTemplates = safeArray(map.areaTemplates).filter((template) => template.visibleToPlayers !== false);
  map.lightingRegions = safeArray(map.lightingRegions).filter((region) => region.visibleToPlayers !== false && !region.gmOnly);
  if (map.sessionLighting?.regions) {
    map.sessionLighting.regions = safeArray(map.sessionLighting.regions).filter((region) => region.visibleToPlayers !== false && !region.gmOnly);
  }
  return map;
}

export function moveSessionTokenOnBoard(board, tokenId, x, y, user) {
  if (!board?.activeMap) return { ok: false, reason: 'missing-board' };
  const next = JSON.parse(JSON.stringify(board));
  const token = safeArray(next.activeMap.tokens).find((entry) => String(entry.id) === String(tokenId));
  if (!token) return { ok: false, reason: 'missing-token' };
  if (!canControlSessionToken(user, token)) return { ok: false, reason: 'permission' };
  token.x = Number.isFinite(Number(x)) ? Number(x) : token.x;
  token.y = Number.isFinite(Number(y)) ? Number(y) : token.y;
  token.positionMode = 'world';
  next.tokens = safeArray(next.tokens).map((entry) => String(entry.id) === String(tokenId) ? { ...entry, x: token.x, y: token.y, positionMode: 'world' } : entry);
  return { ok: true, board: next, token };
}

function filterObjectLayer(layer, lightLayer = false) {
  if (!layer || !Array.isArray(layer.objects)) return;
  layer.objects = layer.objects.filter((object) => (
    object.visibleToPlayers !== false
    && !object.hidden
    && !object.gmOnly
    && (!lightLayer || !object.gmOnlyLight)
  ));
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}
