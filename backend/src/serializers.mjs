export function cloneJson(value) {
  return JSON.parse(JSON.stringify(value ?? null));
}

const MAX_STORED_INLINE_DATA_URL_LENGTH = 200_000;

export function coerceObject(value, fallback = {}) {
  if (!value) return cloneJson(fallback);
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (error) {
      return cloneJson(fallback);
    }
  }
  if (typeof value === 'object') return cloneJson(value);
  return cloneJson(fallback);
}

function toText(value, fallback = '') {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function sanitizeStoredValue(value) {
  if (typeof value === 'string') {
    if (value.startsWith('data:') && value.length > MAX_STORED_INLINE_DATA_URL_LENGTH) {
      return '';
    }
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeStoredValue);
  }

  if (value && typeof value === 'object') {
    const next = {};
    for (const [key, entry] of Object.entries(value)) {
      next[key] = sanitizeStoredValue(entry);
    }
    return next;
  }

  return value;
}

export function normalizeEmail(value, username = 'user') {
  const email = String(value || '').trim().toLowerCase();
  if (email) return email;
  return `${String(username || 'user').trim().toLowerCase()}@omnivita.local`;
}

export function sanitizeUsername(value, fallback = 'user') {
  const normalized = String(value || fallback)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9._-]/g, '');
  return normalized || fallback;
}

export function serializeUser(row) {
  return {
    id: String(row.id || ''),
    email: String(row.email || ''),
    username: String(row.username || ''),
    role: String(row.role || 'player'),
    characterId: row.character_id ? String(row.character_id) : '',
    mustResetPassword: Boolean(row.must_reset_password),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : '',
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : ''
  };
}

export function rowToCharacter(row) {
  const sheet = coerceObject(row.sheet, {});
  const identity = coerceObject(sheet.identity, {});
  const resources = coerceObject(sheet.resources, {});

  return {
    ...sheet,
    id: String(row.id || sheet.id || ''),
    ownerUserId: row.owner_user_id ? String(row.owner_user_id) : String(sheet.ownerUserId || ''),
    ownerUsername: String(row.owner_username || sheet.ownerUsername || ''),
    identity: {
      ...identity,
      name: toText(row.name, identity.name || ''),
      age: row.age ?? identity.age ?? '',
      className: toText(row.character_class, identity.className || 'Especialista'),
      level: Math.max(1, toNumber(row.level, identity.level || 1)),
      image: toText(row.profile_image_url, identity.image || '')
    },
    resources: {
      ...resources,
      status: toText(row.status, resources.status || '')
    },
    companions: Array.isArray(sheet.companions) ? sheet.companions : []
  };
}

export function characterToRowPayload(character, existingRow = {}) {
  const safeCharacter = sanitizeStoredValue(cloneJson(character || {}));
  const identity = coerceObject(safeCharacter.identity, {});
  const resources = coerceObject(safeCharacter.resources, {});

  delete safeCharacter.id;
  delete safeCharacter.ownerUserId;
  delete safeCharacter.ownerUsername;

  safeCharacter.identity = {
    ...identity,
    name: toText(identity.name, existingRow.name || 'Sem nome'),
    age: identity.age ?? existingRow.age ?? '',
    className: toText(identity.className, existingRow.character_class || 'Especialista'),
    level: Math.max(1, toNumber(identity.level, existingRow.level || 1)),
    image: toText(identity.image, existingRow.profile_image_url || '')
  };

  safeCharacter.resources = {
    ...resources,
    status: toText(resources.status, existingRow.status || '')
  };

  safeCharacter.masterSession = {
    ...(coerceObject(safeCharacter.masterSession, {})),
    combatShared: null,
    combatControl: null
  };

  if (!Array.isArray(safeCharacter.companions)) {
    safeCharacter.companions = [];
  }

  return {
    id: String(character.id || existingRow.id || ''),
    name: toText(safeCharacter.identity.name, existingRow.name || 'Sem nome'),
    age: safeCharacter.identity.age === '' ? null : toText(safeCharacter.identity.age, existingRow.age || ''),
    character_class: toText(safeCharacter.identity.className, existingRow.character_class || 'Especialista'),
    level: Math.max(1, toNumber(safeCharacter.identity.level, existingRow.level || 1)),
    status: toText(safeCharacter.resources.status, existingRow.status || ''),
    profile_image_url: toText(safeCharacter.identity.image, existingRow.profile_image_url || ''),
    sheet: safeCharacter
  };
}
