(function () {
  let stateCache = { characters: [] };
  let initialized = false;
  let initPromise = null;
  let refreshTimer = null;
  let currentSessionCache = null;
  let lastRemoteSignature = '';
  const persistQueue = new Map();
  const MAX_LOCAL_STATE_RAW_LENGTH = 4_500_000;
  const MAX_DATA_URL_LENGTH = 2048;

  function clone(data) {
    return JSON.parse(JSON.stringify(data));
  }

  function dispatchUpdate(detail = {}) {
    window.dispatchEvent(new CustomEvent('app-storage-updated', { detail }));
  }

  function dispatchRealtime(detail = {}) {
    window.dispatchEvent(new CustomEvent('app-storage-realtime', { detail }));
  }

  function dispatchError(error) {
    window.dispatchEvent(new CustomEvent('app-storage-error', { detail: error || {} }));
  }

  function getDefaultState() {
    return { characters: [] };
  }

  function normalizeState(state) {
    return {
      characters: (state.characters || []).map((character) => window.AppSystem.hydrateCharacter(character))
    };
  }

  function sanitizeCacheImage(value) {
    const text = String(value || '');
    if (!text) return '';
    if (text.startsWith('data:') && text.length > MAX_DATA_URL_LENGTH) return '';
    return text;
  }

  function createCacheSafeCharacter(character) {
    const safeCharacter = clone(window.AppSystem.hydrateCharacter(character));

    if (safeCharacter.identity) {
      safeCharacter.identity.image = sanitizeCacheImage(safeCharacter.identity.image);
    }

    if (Array.isArray(safeCharacter.companions)) {
      safeCharacter.companions = safeCharacter.companions.map((entry) => ({
        ...entry,
        image: sanitizeCacheImage(entry?.image)
      }));
    }

    return safeCharacter;
  }

  function createCacheSafeState(state) {
    return {
      characters: (state.characters || []).map(createCacheSafeCharacter)
    };
  }

  function saveLocalState(state) {
    const cacheSafeState = createCacheSafeState(normalizeState(state));

    try {
      localStorage.setItem(window.APP_CONFIG.storageKey, JSON.stringify(cacheSafeState));
      return true;
    } catch (error) {
      console.error(error);
      try {
        localStorage.removeItem(window.APP_CONFIG.storageKey);
      } catch (removeError) {
        console.error(removeError);
      }
      return false;
    }
  }

  function getLocalState() {
    try {
      const raw = localStorage.getItem(window.APP_CONFIG.storageKey);
      if (!raw) return getDefaultState();
      if (raw.length > MAX_LOCAL_STATE_RAW_LENGTH) {
        localStorage.removeItem(window.APP_CONFIG.storageKey);
        return getDefaultState();
      }

      return normalizeState(JSON.parse(raw));
    } catch (error) {
      console.error(error);
      try {
        localStorage.removeItem(window.APP_CONFIG.storageKey);
      } catch (removeError) {
        console.error(removeError);
      }
      return getDefaultState();
    }
  }

  function getStateSignature(state = stateCache) {
    return JSON.stringify(normalizeState(state));
  }

  function createCharacterTransferEnvelope(character, metadata = {}) {
    const hydrated = window.AppSystem.hydrateCharacter(clone(character));
    return {
      app: window.APP_CONFIG.appName || 'OmniVita',
      format: 'omnivita-character-transfer',
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      metadata: { ...(metadata || {}) },
      character: hydrated
    };
  }

  function extractCharacterFromTransferPayload(payload) {
    if (!payload) return null;
    if (payload.character && typeof payload.character === 'object') return clone(payload.character);
    return clone(payload);
  }

  function applyRemotePayload(payload, options = {}) {
    currentSessionCache = payload?.session?.user
      ? {
          userId: String(payload.session.user.id || ''),
          email: String(payload.session.user.email || ''),
          username: String(payload.session.user.username || ''),
          role: String(payload.session.user.role || ''),
          characterId: String(payload.session.user.characterId || '')
        }
      : currentSessionCache;

    stateCache = normalizeState({
      characters: Array.isArray(payload?.characters) ? payload.characters : []
    });
    saveLocalState(stateCache);

    if (payload?.combatState && window.AppCombatState?.seedState) {
      window.AppCombatState.seedState(payload.combatState, { source: options.source || 'bootstrap' });
    }

    const nextSignature = getStateSignature(stateCache);
    const changed = nextSignature !== lastRemoteSignature;
    lastRemoteSignature = nextSignature;
    return changed;
  }

  async function refreshFromRemote(notify = true, source = 'remote-refresh') {
    const session = currentSessionCache || await window.AppAuth.getSession();
    if (!session) {
      stateCache = getDefaultState();
      saveLocalState(stateCache);
      lastRemoteSignature = getStateSignature(stateCache);
      if (notify) dispatchUpdate({ source, characterId: '' });
      return stateCache;
    }

    const payload = await window.AppApi.getBootstrap();
    const changed = applyRemotePayload(payload, { source });

    if (notify && changed) {
      dispatchUpdate({ source, characterId: '' });
    }

    if (changed) {
      dispatchRealtime({ table: 'characters' });
    }

    return stateCache;
  }

  function startRefreshLoop() {
    if (refreshTimer) return;
    refreshTimer = window.setInterval(async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        await refreshFromRemote(true, 'remote-refresh');
      } catch (error) {
        console.error(error);
      }
    }, 3000);
  }

  async function init() {
    if (initialized) return stateCache;
    if (initPromise) return initPromise;

    initPromise = (async () => {
      stateCache = getLocalState();
      lastRemoteSignature = getStateSignature(stateCache);
      currentSessionCache = await window.AppAuth.getSession();

      if (currentSessionCache) {
        await refreshFromRemote(false, 'initial-refresh');
        startRefreshLoop();
      }

      initialized = true;
      return stateCache;
    })().catch((error) => {
      console.error(error);
      initPromise = null;
      throw error;
    });

    return initPromise;
  }

  function getState() {
    return normalizeState(stateCache);
  }

  function getCharacters() {
    return stateCache.characters || [];
  }

  function getCharacterById(characterId) {
    return getCharacters().find((character) => character.id === characterId) || null;
  }

  function getCharacterByOwnerUserId(ownerUserId) {
    return getCharacters().find((character) => character.ownerUserId === ownerUserId) || null;
  }

  function upsertCharacter(character) {
    const hydrated = window.AppSystem.hydrateCharacter(character);
    const existingIndex = getCharacters().findIndex((entry) => entry.id === hydrated.id);
    if (existingIndex >= 0) {
      stateCache.characters.splice(existingIndex, 1, hydrated);
    } else {
      stateCache.characters.push(hydrated);
    }
    saveLocalState(stateCache);
    lastRemoteSignature = getStateSignature(stateCache);
    return hydrated;
  }

  async function fetchCharacterByOwnerUserIdDirect(ownerUserId) {
    if (!ownerUserId) return null;
    const session = currentSessionCache || await window.AppAuth.getSession();

    if (session && session.userId === ownerUserId) {
      const character = await window.AppApi.getMyCharacter();
      return upsertCharacter(character);
    }

    await refreshFromRemote(false, 'direct-owner-fetch');
    return getCharacterByOwnerUserId(ownerUserId);
  }

  async function fetchCharacterByIdDirect(characterId) {
    if (!characterId) return null;
    try {
      const character = await window.AppApi.getCharacterById(characterId);
      return upsertCharacter(character);
    } catch (error) {
      console.error(error);
      const cached = getCharacterById(characterId);
      if (cached) return cached;
      return null;
    }
  }

  function getPersistQueueKey(character) {
    return String(
      (character && character.id)
      || (character && character.ownerUserId)
      || (character && character.identity && character.identity.name)
      || 'default'
    );
  }

  async function persistCharacterImmediate(nextCharacter) {
    const hydrated = window.AppSystem.hydrateCharacter(clone(nextCharacter));
    const saved = await window.AppApi.updateCharacter(hydrated.id, hydrated);
    const normalized = upsertCharacter(saved);
    dispatchUpdate({ source: 'remote-save', characterId: normalized.id });
    return normalized;
  }

  async function runPersistQueue(key, slot) {
    if (!slot || slot.running) return;
    slot.running = true;
    let lastSaved = null;

    try {
      while (slot.latest) {
        const payload = slot.latest;
        slot.latest = null;
        lastSaved = await persistCharacterImmediate(payload);
      }

      const waiters = slot.waiters.splice(0);
      waiters.forEach(({ resolve }) => resolve(lastSaved));
    } catch (error) {
      const waiters = slot.waiters.splice(0);
      waiters.forEach(({ reject }) => reject(error));
      throw error;
    } finally {
      slot.running = false;
      if (slot.latest) {
        runPersistQueue(key, slot).catch(console.error);
      } else if (!slot.waiters.length) {
        persistQueue.delete(key);
      }
    }
  }

  async function persistCharacter(nextCharacter) {
    const hydrated = window.AppSystem.hydrateCharacter(clone(nextCharacter));
    const key = getPersistQueueKey(hydrated);
    let slot = persistQueue.get(key);

    if (!slot) {
      slot = { running: false, latest: null, waiters: [] };
      persistQueue.set(key, slot);
    }

    slot.latest = hydrated;

    return new Promise((resolve, reject) => {
      slot.waiters.push({ resolve, reject });
      runPersistQueue(key, slot).catch((error) => {
        console.error(error);
        dispatchError(error);
      });
    });
  }

  function replaceCharacter(characterId, nextCharacter) {
    const hydrated = window.AppSystem.hydrateCharacter(nextCharacter);
    upsertCharacter({
      ...hydrated,
      id: characterId
    });

    dispatchUpdate({ source: 'optimistic-save', characterId });

    persistCharacter(hydrated).catch((error) => {
      console.error(error);
      dispatchError(error);
    });

    return hydrated;
  }

  function patchCharacter(characterId, patch) {
    const current = getCharacterById(characterId);
    if (!current) return null;
    return replaceCharacter(characterId, {
      ...current,
      ...patch
    });
  }

  function resetState() {
    stateCache = getDefaultState();
    saveLocalState(stateCache);
    lastRemoteSignature = getStateSignature(stateCache);
    dispatchUpdate({ source: 'reset', characterId: '' });
    return stateCache;
  }

  window.addEventListener('pagehide', function () {
    if (refreshTimer) {
      window.clearInterval(refreshTimer);
      refreshTimer = null;
    }
  });

  window.AppStorage = {
    init,
    refresh: refreshFromRemote,
    getState,
    resetState,
    getCharacters,
    getCharacterById,
    getCharacterByOwnerUserId,
    fetchCharacterByOwnerUserIdDirect,
    fetchCharacterByIdDirect,
    createCharacterTransferEnvelope,
    extractCharacterFromTransferPayload,
    persistCharacter,
    replaceCharacter,
    patchCharacter
  };
})();
