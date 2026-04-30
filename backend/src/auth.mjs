import { query } from './db.mjs';
import {
  buildSessionExpiry,
  createSessionToken,
  createUuid,
  hashSessionToken,
  normalizeIdentifier,
  verifyPassword
} from './security.mjs';
import { serializeUser } from './serializers.mjs';

function extractBearerToken(value) {
  const header = String(value || '');
  if (!header.toLowerCase().startsWith('bearer ')) return '';
  return header.slice(7).trim();
}

export async function getUserByIdentifier(identifier, client) {
  const normalized = normalizeIdentifier(identifier);
  const result = await query(
    `
      SELECT
        u.*,
        c.id AS character_id
      FROM users u
      LEFT JOIN characters c ON c.owner_user_id = u.id
      WHERE lower(u.username) = $1 OR lower(u.email) = $1
      LIMIT 1
    `,
    [normalized],
    client
  );
  return result.rows[0] || null;
}

export async function getUserById(userId, client) {
  const result = await query(
    `
      SELECT
        u.*,
        c.id AS character_id
      FROM users u
      LEFT JOIN characters c ON c.owner_user_id = u.id
      WHERE u.id = $1
      LIMIT 1
    `,
    [userId],
    client
  );
  return result.rows[0] || null;
}

export async function createSessionForUser(userId, client) {
  const token = createSessionToken();
  const tokenHash = hashSessionToken(token);
  const sessionId = createUuid();
  const expiresAt = buildSessionExpiry();

  await query(
    `
      INSERT INTO sessions (id, user_id, token_hash, expires_at)
      VALUES ($1, $2, $3, $4)
    `,
    [sessionId, userId, tokenHash, expiresAt.toISOString()],
    client
  );

  return {
    token,
    expiresAt: expiresAt.toISOString()
  };
}

export async function deleteSessionByToken(token, client) {
  const tokenHash = hashSessionToken(token);
  await query('DELETE FROM sessions WHERE token_hash = $1', [tokenHash], client);
}

export async function getAuthSessionFromToken(token, client) {
  if (!token) return null;
  const tokenHash = hashSessionToken(token);
  const result = await query(
    `
      SELECT
        s.id AS session_id,
        s.user_id,
        s.expires_at,
        s.created_at AS session_created_at,
        s.last_seen_at,
        u.*,
        c.id AS character_id
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      LEFT JOIN characters c ON c.owner_user_id = u.id
      WHERE s.token_hash = $1
      LIMIT 1
    `,
    [tokenHash],
    client
  );

  const row = result.rows[0];
  if (!row) return null;

  const expiresAt = Date.parse(String(row.expires_at || ''));
  if (Number.isFinite(expiresAt) && expiresAt < Date.now()) {
    await query('DELETE FROM sessions WHERE id = $1', [row.session_id], client);
    return null;
  }

  await query(
    'UPDATE sessions SET last_seen_at = now() WHERE id = $1',
    [row.session_id],
    client
  );

  return {
    token,
    sessionId: String(row.session_id),
    expiresAt: new Date(row.expires_at).toISOString(),
    user: serializeUser(row)
  };
}

export async function requireAuth(request, reply) {
  const token = extractBearerToken(request.headers.authorization);
  const session = await getAuthSessionFromToken(token);

  if (!session) {
    reply.code(401).send({ message: 'Sessao invalida ou expirada.' });
    return null;
  }

  request.auth = session;
  return session;
}

export async function requireMaster(request, reply) {
  const session = request.auth || await requireAuth(request, reply);
  if (!session) return null;

  if (session.user.role !== 'master') {
    reply.code(403).send({ message: 'Acesso restrito ao mestre.' });
    return null;
  }

  return session;
}

export async function validateLogin(identifier, password) {
  const user = await getUserByIdentifier(identifier);
  if (!user) return null;

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) return null;

  return user;
}
