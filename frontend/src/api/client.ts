import { getRuntimeApiBaseUrl } from './runtime';
import type {
  AuthSession,
  BackupImportResult,
  BootstrapPayload,
  CharacterSheet,
  CombatState,
  MasterData,
  MapSummary,
  OmniMap,
  OmnivitaCodeEvaluationResponse,
  SessionBoard,
  SessionBoardSummary
} from './types';
import { clearStoredSession, readStoredSession } from '../auth/session';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  auth?: boolean;
  body?: unknown;
  timeoutMs?: number;
}

type BackupScope = 'all' | 'characters' | 'maps' | 'session-boards' | 'custom-assets' | 'settings';

interface DownloadResult {
  blob: Blob;
  filename: string;
}

function friendlyError(message: string, status = 0): string {
  const normalized = message.toLowerCase();
  if (normalized.includes('timeout') || normalized.includes('aborterror') || normalized.includes('tempo esgotado')) {
    return 'A API demorou demais para responder. Tente novamente em instantes.';
  }
  if (
    normalized.includes('failed to fetch') ||
    normalized.includes('econnreset') ||
    normalized.includes('econnrefused')
  ) {
    return 'Nao consegui falar com a API local. Confira se o start do OmniVita esta rodando.';
  }
  if (
    normalized.includes('banco de dados indisponivel') ||
    normalized.includes('db_unavailable')
  ) {
    return 'O backend esta online, mas o banco local nao respondeu. Verifique o PostgreSQL.';
  }
  if (status === 503) return 'O backend esta sem acesso ao banco neste momento.';
  return message || `HTTP ${status || 500}`;
}

export function getAccessToken(): string {
  return readStoredSession()?.token || '';
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const baseUrl = getRuntimeApiBaseUrl();

  const headers: Record<string, string> = {};
  const token = options.auth === false ? '' : getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), options.timeoutMs || (options.method === 'GET' ? 8000 : 16000));

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method: options.method || 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal
    });
  } catch (error) {
    const raw = error instanceof Error ? error.message : 'Failed to fetch';
    throw new Error(friendlyError(raw));
  } finally {
    window.clearTimeout(timeoutId);
  }

  const text = await response.text();
  const payload = text
    ? (() => {
        try {
          return JSON.parse(text) as unknown;
        } catch {
          return { message: text };
        }
      })()
    : null;

  if (!response.ok) {
    if (response.status === 401) clearStoredSession();
    const message = typeof payload === 'object' && payload && 'message' in payload
      ? String((payload as { message?: unknown }).message || '')
      : '';
    const wrapped = new Error(friendlyError(message, response.status));
    Object.assign(wrapped, { status: response.status, payload });
    throw wrapped;
  }

  return payload as T;
}

async function apiDownload(path: string, fallbackFilename: string): Promise<DownloadResult> {
  const baseUrl = getRuntimeApiBaseUrl();
  const headers: Record<string, string> = {};
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, { headers });
  } catch (error) {
    const raw = error instanceof Error ? error.message : 'Failed to fetch';
    throw new Error(friendlyError(raw));
  }

  if (!response.ok) {
    const text = await response.text();
    let message = text;
    try {
      const payload = JSON.parse(text) as { message?: string };
      message = payload.message || text;
    } catch {
      // Text responses are fine here.
    }
    throw new Error(friendlyError(message, response.status));
  }

  const disposition = response.headers.get('Content-Disposition') || '';
  const match = disposition.match(/filename="?([^";]+)"?/i);
  return {
    blob: await response.blob(),
    filename: match?.[1] || fallbackFilename
  };
}

export const api = {
  login(identifier: string, password: string) {
    return apiRequest<AuthSession>('/api/auth/login', {
      method: 'POST',
      auth: false,
      body: { identifier, password }
    });
  },
  session() {
    return apiRequest<Omit<AuthSession, 'token'>>('/api/auth/session');
  },
  logout() {
    return apiRequest<{ ok: boolean }>('/api/auth/logout', { method: 'POST' });
  },
  bootstrap() {
    return apiRequest<BootstrapPayload>('/api/bootstrap');
  },
  getCharacters() {
    return apiRequest<CharacterSheet[]>('/api/characters');
  },
  getMyCharacter() {
    return apiRequest<CharacterSheet>('/api/characters/me');
  },
  updateCharacter(characterId: string, character: CharacterSheet) {
    return apiRequest<CharacterSheet>(`/api/characters/${encodeURIComponent(characterId)}`, {
      method: 'PUT',
      body: { character },
      timeoutMs: 30000
    });
  },
  getCombat() {
    return apiRequest<{ state: CombatState }>('/api/combat');
  },
  putCombat(state: CombatState, meta: Record<string, unknown> = {}) {
    return apiRequest<{ state: CombatState }>('/api/combat', {
      method: 'PUT',
      body: { state, meta }
    });
  },
  sendCombatControl(control: Record<string, unknown>) {
    return apiRequest<{ state: CombatState }>('/api/combat/control', {
      method: 'POST',
      body: { control }
    });
  },
  getMasterData(key: string) {
    return apiRequest<{ key: string; data: MasterData | null; updatedAt?: string }>(`/api/master-data/${encodeURIComponent(key)}`);
  },
  putMasterData(key: string, data: unknown) {
    return apiRequest<{ key: string; data: unknown; updatedAt?: string }>(`/api/master-data/${encodeURIComponent(key)}`, {
      method: 'PUT',
      body: { data },
      timeoutMs: 30000
    });
  },
  evaluateOmnivitaCode(trail: Array<'up' | 'down'>) {
    return apiRequest<OmnivitaCodeEvaluationResponse>('/api/omnivita/evaluate', {
      method: 'POST',
      body: { trail },
      timeoutMs: 12000
    });
  },
  listMaps() {
    return apiRequest<{ maps: MapSummary[] }>('/api/maps');
  },
  getMap(mapId: string) {
    return apiRequest<{ map: OmniMap }>(`/api/maps/${encodeURIComponent(mapId)}`);
  },
  createMap(map: OmniMap) {
    return apiRequest<{ map: OmniMap }>('/api/maps', {
      method: 'POST',
      body: { map },
      timeoutMs: 30000
    });
  },
  updateMap(mapId: string, map: OmniMap) {
    return apiRequest<{ map: OmniMap }>(`/api/maps/${encodeURIComponent(mapId)}`, {
      method: 'PUT',
      body: { map },
      timeoutMs: 30000
    });
  },
  deleteMap(mapId: string) {
    return apiRequest<{ ok: boolean }>(`/api/maps/${encodeURIComponent(mapId)}`, {
      method: 'DELETE'
    });
  },
  listSessionBoards() {
    return apiRequest<{ boards: SessionBoardSummary[] }>('/api/session-boards');
  },
  getSessionBoard(boardId: string) {
    return apiRequest<{ board: SessionBoard }>(`/api/session-boards/${encodeURIComponent(boardId)}`);
  },
  getActiveSessionBoard() {
    return apiRequest<{ board: SessionBoard | null }>('/api/session-boards/active');
  },
  moveActiveSessionToken(tokenId: string, position: { x: number; y: number }) {
    return apiRequest<{ board: SessionBoard | null }>(`/api/session-boards/active/tokens/${encodeURIComponent(tokenId)}`, {
      method: 'PUT',
      body: position,
      timeoutMs: 12000
    });
  },
  createSessionBoard(board: SessionBoard) {
    return apiRequest<{ board: SessionBoard }>('/api/session-boards', {
      method: 'POST',
      body: { board },
      timeoutMs: 30000
    });
  },
  updateSessionBoard(boardId: string, board: SessionBoard) {
    return apiRequest<{ board: SessionBoard }>(`/api/session-boards/${encodeURIComponent(boardId)}`, {
      method: 'PUT',
      body: { board },
      timeoutMs: 30000
    });
  },
  deleteSessionBoard(boardId: string) {
    return apiRequest<{ ok: boolean }>(`/api/session-boards/${encodeURIComponent(boardId)}`, {
      method: 'DELETE'
    });
  },
  exportBackup(scope: BackupScope = 'all') {
    return apiDownload(`/api/backups/export?scope=${encodeURIComponent(scope)}`, 'omnivita-backup.json');
  },
  downloadLatestBackup() {
    return apiDownload('/api/backups/latest', 'omnivita-backup-latest.json');
  },
  importBackup(backup: unknown, confirm = false) {
    return apiRequest<BackupImportResult>('/api/backups/import', {
      method: 'POST',
      body: { backup, confirm },
      timeoutMs: 60000
    });
  }
};
