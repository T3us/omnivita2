import type { AuthSession } from '../api/types';

export const SESSION_KEY = 'omnivita_api_session_v1';
export const LEGACY_SESSION_KEY = 'omnivita_session_v2';
export const LEGACY_STORAGE_KEY = 'omnivita_campaign_data_v2';

function storages(): Storage[] {
  const output: Storage[] = [];
  try {
    output.push(localStorage);
  } catch {
    // ignored
  }
  try {
    output.push(sessionStorage);
  } catch {
    // ignored
  }
  return output;
}

export function normalizeSession(value: unknown): AuthSession | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  const user = (raw.user && typeof raw.user === 'object' ? raw.user : raw) as Record<string, unknown>;
  const token = String(raw.token || user.token || '').trim();
  const id = String(user.id || user.userId || raw.userId || '').trim();
  const role = String(user.role || raw.role || '').trim();
  if (!token || !id || (role !== 'master' && role !== 'player')) return null;

  return {
    token,
    expiresAt: String(raw.expiresAt || user.expiresAt || ''),
    user: {
      id,
      email: String(user.email || ''),
      username: String(user.username || ''),
      role,
      characterId: String(user.characterId || ''),
      mustResetPassword: Boolean(user.mustResetPassword)
    }
  };
}

export function clearLegacySnapshots(): void {
  for (const storage of storages()) {
    storage.removeItem(LEGACY_SESSION_KEY);
  }
  localStorage.removeItem(LEGACY_STORAGE_KEY);
  localStorage.removeItem('omnivita_api_base_url');
}

export function readStoredSession(): AuthSession | null {
  for (const storage of storages()) {
    const raw = storage.getItem(SESSION_KEY);
    if (!raw) continue;
    try {
      const session = normalizeSession(JSON.parse(raw));
      if (!session) continue;
      return session;
    } catch {
      storage.removeItem(SESSION_KEY);
    }
  }
  return null;
}

export function storeSession(session: AuthSession): AuthSession {
  for (const storage of storages()) {
    storage.setItem(SESSION_KEY, JSON.stringify(session));
  }
  return session;
}

export function clearStoredSession(): void {
  for (const storage of storages()) {
    storage.removeItem(SESSION_KEY);
  }
}
