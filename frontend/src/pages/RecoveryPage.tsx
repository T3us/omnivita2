import { useState } from 'react';
import { AppLayout } from '../components/AppLayout';
import { Badge, Button, Card } from '../components/Ui';
import { downloadJson } from '../utils/json';

const STORAGE_KEYS = [
  'omnivita_campaign_cache_v1',
  'omnivita_campaign_data_v2',
  'omnivita_api_session_v1',
  'omnivita_session_v2'
];

const MOCK_ACCOUNTS = [
  { username: 'mestre', role: 'master', characterId: '' },
  { username: 'cael', role: 'player', characterId: 'cael' },
  { username: 'serena', role: 'player', characterId: 'serena' },
  { username: 'k', role: 'player', characterId: 'k' },
  { username: 'greg', role: 'player', characterId: 'greg' }
];

type JsonRecord = Record<string, unknown>;

interface RecoveryEntry {
  key: string;
  value: unknown;
}

interface SessionSnapshot {
  userId: string;
  email: string;
  username: string;
  role: string;
  characterId: string;
}

interface RecoveryBundle {
  source: 'omnivita-browser-recovery';
  exportedAt: string;
  origin: string;
  storageKeys: string[];
  sessions: SessionSnapshot[];
  profiles: JsonRecord[];
  characters: JsonRecord[];
  companions: JsonRecord[];
  authUsers: unknown[];
}

export function RecoveryPage() {
  const [bundle, setBundle] = useState<RecoveryBundle | null>(null);
  const [message, setMessage] = useState('Nenhuma analise feita ainda.');

  function inspect() {
    const nextBundle = buildBundle();
    setBundle(nextBundle);
    const characterCount = nextBundle.characters.length;
    const companionCount = nextBundle.companions.length;
    const accountCount = nextBundle.profiles.length;
    const keys = nextBundle.storageKeys.length ? nextBundle.storageKeys.join(', ') : 'nenhuma';
    setMessage(`${characterCount} ficha(s), ${companionCount} mini-ficha(s) e ${accountCount} perfil(is) encontrados. Chaves lidas: ${keys}.`);
  }

  function downloadBundle() {
    const nextBundle = bundle || buildBundle();
    setBundle(nextBundle);
    if (!nextBundle.characters.length) {
      setMessage('Nenhuma ficha encontrada neste navegador.');
      return;
    }
    const primaryProfile = String((nextBundle.profiles[0]?.username as string | undefined) || 'browser');
    const filename = `omnivita-recovery-${slugify(primaryProfile) || 'browser'}-${Date.now()}.json`;
    downloadJson(filename, nextBundle);
  }

  const characters = (bundle?.characters || []).map((entry) => (entry.sheet && typeof entry.sheet === 'object' ? entry.sheet : entry) as JsonRecord);
  const hasCharacters = Boolean(bundle?.characters.length);

  return (
    <AppLayout title="Recuperar dados" eyebrow="RECUPERACAO">
      <div className="mx-auto grid max-w-4xl gap-4">
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <span className="inline-flex min-h-6 items-center rounded-full border border-vita/20 bg-vita/10 px-3 text-xs font-black uppercase tracking-[0.08em] text-violet">
                Recuperacao
              </span>
              <h1 className="mt-3 text-2xl font-black md:text-3xl">Exportar dados do navegador</h1>
              <p className="mt-2 text-sm leading-relaxed text-textMuted">
                Use esta pagina no navegador de cada player para salvar o que ainda estiver em cache.
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button type="button" onClick={inspect}>Inspecionar navegador</Button>
            <Button tone="primary" type="button" disabled={!hasCharacters} onClick={downloadBundle}>Baixar bundle de recuperacao</Button>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-black">Como usar</h2>
          <div className="mt-3 grid gap-2 text-sm text-textMuted">
            <p>1. Abra esta pagina no navegador certo.</p>
            <p>2. Clique em <code className="rounded bg-white/10 px-1 py-0.5 text-textMain">Inspecionar navegador</code>.</p>
            <p>3. Se aparecerem fichas, clique em <code className="rounded bg-white/10 px-1 py-0.5 text-textMain">Baixar bundle de recuperacao</code>.</p>
            <p>4. Mande o arquivo para o mestre colocar em <code className="rounded bg-white/10 px-1 py-0.5 text-textMain">migration-input/recovery-bundles</code>.</p>
          </div>
        </Card>

        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-black">Resultado</h2>
              <p className="mt-1 text-sm text-textMuted">{message}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge>{bundle?.storageKeys.length || 0} chave(s)</Badge>
              <Badge>{bundle?.characters.length || 0} ficha(s)</Badge>
              <Badge>{bundle?.companions.length || 0} mini-ficha(s)</Badge>
            </div>
          </div>
        </Card>

        <div className="grid gap-3">
          {!bundle ? null : characters.length ? characters.map((character, index) => (
            <Card key={`${String(character.id || '')}-${index}`}>
              <h3 className="text-xl font-black">{getCharacterName(character)}</h3>
              <p className="mt-1 text-sm text-textMuted">{getCharacterClass(character)} | Nivel {getCharacterLevel(character)}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge>ID {String(character.id || '-')}</Badge>
                <Badge>Dono {String(character.ownerUsername || '-')}</Badge>
                <Badge>Mini-fichas {Array.isArray(character.companions) ? character.companions.length : 0}</Badge>
              </div>
            </Card>
          )) : (
            <Card>
              <p className="text-sm text-textMuted">Nenhuma ficha encontrada neste navegador.</p>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function buildBundle(): RecoveryBundle {
  const entries = getAllRelevantEntries();
  const characters = dedupeCharacters(entries.flatMap((entry) => extractCharactersFromPayload(entry.value)));
  const sessionSnapshots = readSessionSnapshots(entries);
  const profiles = deriveProfiles(characters, sessionSnapshots);
  const companions = deriveCompanionsRows(characters);
  const characterRows = deriveCharactersRows(characters);

  return {
    source: 'omnivita-browser-recovery',
    exportedAt: new Date().toISOString(),
    origin: window.location.origin,
    storageKeys: entries.map((entry) => entry.key),
    sessions: sessionSnapshots,
    profiles,
    characters: characterRows,
    companions,
    authUsers: []
  };
}

function getAllRelevantEntries(): RecoveryEntry[] {
  return STORAGE_KEYS
    .map((key) => ({ key, value: readJson(key) }))
    .filter((entry) => entry.value);
}

function readJson(key: string): unknown {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function extractCharactersFromPayload(payload: unknown): JsonRecord[] {
  if (!payload || typeof payload !== 'object') return [];
  const raw = payload as JsonRecord;
  if (Array.isArray(raw.characters)) return raw.characters.filter(isRecord);
  if (raw.state && typeof raw.state === 'object' && Array.isArray((raw.state as JsonRecord).characters)) {
    return ((raw.state as JsonRecord).characters as unknown[]).filter(isRecord);
  }
  if (Array.isArray(raw.data)) return raw.data.filter(isRecord);
  return [];
}

function dedupeCharacters(characters: JsonRecord[]) {
  const map = new Map<string, JsonRecord>();
  characters.forEach((character) => {
    const key = String(character.id || '');
    if (!key) return;
    const existing = map.get(key);
    if (!existing || scoreCharacter(character) > scoreCharacter(existing)) {
      map.set(key, clone(character) as JsonRecord);
    }
  });
  return Array.from(map.values());
}

function deriveProfiles(characters: JsonRecord[], sessionSnapshots: SessionSnapshot[]) {
  return characters.map((character, index) => {
    const identity = getIdentity(character);
    const username = String(
      character.ownerUsername
      || sessionSnapshots.find((entry) => entry.characterId === character.id)?.username
      || `player-${index + 1}`
    ).trim().toLowerCase();
    const mockAccount = getMockAccount(username);
    const sessionMatch = sessionSnapshots.find((entry) => entry.username === username || entry.characterId === character.id) || null;

    return {
      id: String(character.ownerUserId || sessionMatch?.userId || ''),
      email: String(sessionMatch?.email || `${username}@omnivita.local`),
      username,
      display_name: String(identity.name || username),
      role: String(sessionMatch?.role || mockAccount?.role || 'player'),
      character_id: String(character.id || '')
    };
  });
}

function deriveCharactersRows(characters: JsonRecord[]) {
  return characters.map((character) => {
    const identity = getIdentity(character);
    const resources = getRecord(character.resources);
    return {
      id: String(character.id || ''),
      owner_user_id: String(character.ownerUserId || ''),
      owner_username: String(character.ownerUsername || ''),
      name: String(identity.name || ''),
      age: identity.age ?? '',
      character_class: String(identity.className || 'Especialista'),
      level: Number(identity.level || 1),
      status: String(resources.status || ''),
      profile_image_url: String(identity.image || ''),
      sheet: clone(character)
    };
  });
}

function deriveCompanionsRows(characters: JsonRecord[]) {
  const rows: JsonRecord[] = [];
  characters.forEach((character) => {
    const companions = Array.isArray(character.companions) ? character.companions.filter(isRecord) : [];
    companions.forEach((companion, index) => {
      rows.push({
        id: String(companion.id || `${String(character.id || '')}-cmp-${index + 1}`),
        character_id: String(character.id || ''),
        name: String(companion.name || ''),
        type: String(companion.type || ''),
        status: String(companion.status || ''),
        photo_url: String(companion.image || ''),
        current_pv: Number(companion.pvCurrent || 0),
        max_pv: Number(companion.pvMax || 0),
        armor: Number(companion.armor || 0),
        attributes: clone(companion.attributes || {}),
        skills: clone(companion.skills || []),
        facets: clone(companion.facets || []),
        notes: String(companion.notes || ''),
        sort_order: index
      });
    });
  });
  return rows;
}

function readSessionSnapshots(entries: RecoveryEntry[]): SessionSnapshot[] {
  return entries
    .filter((entry) => entry.key === 'omnivita_api_session_v1' || entry.key === 'omnivita_session_v2')
    .map((entry) => entry.value)
    .filter(isRecord)
    .map((value) => {
      const user = value.user && typeof value.user === 'object' ? value.user as JsonRecord : value;
      return {
        userId: String(value.userId || user.id || ''),
        email: String(value.email || user.email || ''),
        username: String(value.username || user.username || ''),
        role: String(value.role || user.role || ''),
        characterId: String(value.characterId || user.characterId || '')
      };
    });
}

function getMockAccount(username: string) {
  return MOCK_ACCOUNTS.find((entry) => entry.username.toLowerCase() === username.toLowerCase()) || null;
}

function getCharacterName(character: JsonRecord) {
  const identity = getIdentity(character);
  return String(identity.name || character.name || 'Sem nome');
}

function getCharacterClass(character: JsonRecord) {
  const identity = getIdentity(character);
  return String(identity.className || character.className || 'Sem classe');
}

function getCharacterLevel(character: JsonRecord) {
  const identity = getIdentity(character);
  return Number(identity.level || character.level || 1);
}

function getIdentity(character: JsonRecord) {
  const identity = getRecord(character.identity);
  return {
    ...identity,
    name: identity.name || character.name,
    age: identity.age || character.age,
    className: identity.className || character.className,
    level: identity.level || character.level,
    image: identity.image || character.image
  };
}

function getRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {};
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function clone(value: unknown) {
  return JSON.parse(JSON.stringify(value ?? null));
}

function scoreCharacter(character: JsonRecord) {
  return JSON.stringify(character || {}).length;
}

function slugify(value: unknown) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
