(function () {
  let socket = null;
  const DEFAULT_GET_TIMEOUT_MS = 8000;
  const DEFAULT_WRITE_TIMEOUT_MS = 16000;
  const LONG_WRITE_TIMEOUT_MS = 30000;
  const COMBAT_TIMEOUT_MS = 5000;

  function getBaseUrl() {
    try {
      localStorage.removeItem('omnivita_api_base_url');
    } catch (error) {
      console.error(error);
    }
    return String(window.APP_CONFIG.apiBaseUrl || '').trim().replace(/\/+$/, '');
  }

  function readSessionSnapshot() {
    try {
      const raw = localStorage.getItem(window.APP_CONFIG.sessionKey);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  function getAccessToken() {
    return String(readSessionSnapshot()?.token || '').trim();
  }

  function clearSessionSnapshot() {
    try {
      localStorage.removeItem(window.APP_CONFIG.sessionKey);
    } catch (error) {
      console.error(error);
    }
  }

  async function request(path, options = {}) {
    const method = options.method || 'GET';
    const headers = { ...(options.headers || {}) };
    const baseUrl = getBaseUrl();
    if (!baseUrl) {
      throw new Error('API nao configurada. Rode start-omnivita-local.bat ou start-omnivita-radmin.bat para atualizar a URL.');
    }
    const url = `${baseUrl}${path}`;
    const token = options.auth === false ? '' : getAccessToken();

    if (token) headers.Authorization = `Bearer ${token}`;
    if (options.body !== undefined && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    function getTimeoutMs() {
      const explicit = Number(options.timeoutMs);
      if (Number.isFinite(explicit) && explicit > 0) return explicit;
      if (path.startsWith('/api/combat')) return COMBAT_TIMEOUT_MS;
      if (method === 'GET') return DEFAULT_GET_TIMEOUT_MS;
      return DEFAULT_WRITE_TIMEOUT_MS;
    }

    function buildFriendlyMessage(message, status) {
      const text = String(message || '').trim();
      const normalized = text.toLowerCase();

      if (
        normalized.includes('aborterror')
        || normalized.includes('timeout')
        || normalized.includes('tempo esgotado')
      ) {
        return 'A API demorou demais para responder. Vou tentar sincronizar de novo automaticamente.';
      }

      if (
        normalized.includes('econnreset')
        || normalized.includes('econnrefused')
        || normalized.includes('failed to fetch')
        || normalized.includes('db_unavailable')
        || normalized.includes('banco de dados indisponivel')
      ) {
        return 'O backend esta online, mas o banco de dados nao respondeu. Verifique se o PostgreSQL local esta aberto e tente de novo.';
      }

      if (status === 503) {
        return 'O backend esta sem acesso ao banco neste momento. Tente novamente em instantes.';
      }

      return text || `HTTP ${status || 500}`;
    }

    let response;
    const timeoutMs = getTimeoutMs();
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller
      ? window.setTimeout(() => controller.abort(), timeoutMs)
      : null;

    try {
      response = await fetch(url, {
        method,
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: controller ? controller.signal : undefined
      });
    } catch (error) {
      const rawMessage = error?.name === 'AbortError'
        ? 'Tempo esgotado'
        : (error?.message || 'Failed to fetch');
      const wrapped = new Error(buildFriendlyMessage(rawMessage, 0));
      wrapped.cause = error;
      throw wrapped;
    } finally {
      if (timeoutId) window.clearTimeout(timeoutId);
    }

    const text = await response.text();
    let payload = null;
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch (error) {
        payload = { message: text };
      }
    }

    if (!response.ok) {
      if (response.status === 401) {
        clearSessionSnapshot();
      }
      const wrapped = new Error(buildFriendlyMessage(payload?.message, response.status));
      wrapped.status = response.status;
      wrapped.payload = payload;
      throw wrapped;
    }

    return payload;
  }

  async function login(body) {
    return request('/api/auth/login', {
      method: 'POST',
      auth: false,
      body
    });
  }

  async function getSession() {
    return request('/api/auth/session');
  }

  async function logout() {
    return request('/api/auth/logout', {
      method: 'POST'
    });
  }

  async function getBootstrap() {
    return request('/api/bootstrap');
  }

  async function getCharacters() {
    return request('/api/characters');
  }

  async function getMyCharacter() {
    return request('/api/characters/me');
  }

  async function getCharacterById(characterId) {
    return request(`/api/characters/${encodeURIComponent(characterId)}`);
  }

  async function updateCharacter(characterId, character) {
    return request(`/api/characters/${encodeURIComponent(characterId)}`, {
      method: 'PUT',
      body: { character },
      timeoutMs: LONG_WRITE_TIMEOUT_MS
    });
  }

  async function getCombatState() {
    return request('/api/combat');
  }

  async function putCombatState(state, meta = {}) {
    return request('/api/combat', {
      method: 'PUT',
      body: { state, meta }
    });
  }

  async function sendCombatControl(control) {
    return request('/api/combat/control', {
      method: 'POST',
      body: { control }
    });
  }

  async function getMasterData(key) {
    return request(`/api/master-data/${encodeURIComponent(key)}`);
  }

  async function putMasterData(key, data) {
    return request(`/api/master-data/${encodeURIComponent(key)}`, {
      method: 'PUT',
      body: { data },
      timeoutMs: LONG_WRITE_TIMEOUT_MS
    });
  }

  function ensureSocket() {
    if (socket || !window.io) return socket;
    const baseUrl = getBaseUrl();
    const token = getAccessToken();
    if (!baseUrl || !token) return null;

    socket = window.io(baseUrl, {
      transports: ['websocket', 'polling'],
      auth: { token }
    });

    socket.on('connect_error', (error) => {
      console.error(error);
    });

    return socket;
  }

  function onSocket(eventName, handler) {
    const active = ensureSocket();
    if (!active || typeof handler !== 'function') return function () {};
    active.on(eventName, handler);
    return function () {
      active.off(eventName, handler);
    };
  }

  function emitSocket(eventName, payload) {
    const active = ensureSocket();
    if (!active) return false;
    active.emit(eventName, payload || {});
    return true;
  }

  function disconnectSocket() {
    if (!socket) return;
    socket.disconnect();
    socket = null;
  }

  window.AppApi = {
    getBaseUrl,
    getAccessToken,
    request,
    login,
    getSession,
    logout,
    getBootstrap,
    getCharacters,
    getMyCharacter,
    getCharacterById,
    updateCharacter,
    getCombatState,
    putCombatState,
    sendCombatControl,
    getMasterData,
    putMasterData,
    ensureSocket,
    onSocket,
    emitSocket,
    disconnectSocket
  };
})();
