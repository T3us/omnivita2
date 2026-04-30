(function () {
  function getSessionStorages() {
    const storages = [];
    try {
      storages.push(localStorage);
    } catch (error) {
      console.error(error);
    }
    try {
      storages.push(sessionStorage);
    } catch (error) {
      console.error(error);
    }
    return storages;
  }

  function normalizeLogin(value) {
    return String(value || '').trim().toLowerCase();
  }

  function clearLegacySnapshots() {
    try {
      if (window.APP_CONFIG.legacySessionKey) {
        localStorage.removeItem(window.APP_CONFIG.legacySessionKey);
        sessionStorage.removeItem(window.APP_CONFIG.legacySessionKey);
      }
      if (window.APP_CONFIG.legacyStorageKey) {
        localStorage.removeItem(window.APP_CONFIG.legacyStorageKey);
      }
    } catch (error) {
      console.error(error);
    }
  }

  function normalizeSessionSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== 'object') return null;
    const user = snapshot.user && typeof snapshot.user === 'object'
      ? snapshot.user
      : snapshot;

    const token = String(snapshot.token || user.token || '').trim();
    const userId = String(user.id || user.userId || snapshot.userId || '').trim();
    const role = String(user.role || snapshot.role || '').trim();
    if (!token || !userId || !role) return null;

    return {
      token,
      userId,
      email: String(user.email || ''),
      username: String(user.username || ''),
      role,
      characterId: String(user.characterId || ''),
      mustResetPassword: Boolean(user.mustResetPassword),
      expiresAt: String(snapshot.expiresAt || user.expiresAt || '')
    };
  }

  function readSnapshot() {
    for (const storage of getSessionStorages()) {
      try {
        const raw = storage.getItem(window.APP_CONFIG.sessionKey);
        if (!raw) continue;
        const snapshot = normalizeSessionSnapshot(JSON.parse(raw));
        if (!snapshot) continue;

        for (const syncStorage of getSessionStorages()) {
          try {
            syncStorage.setItem(window.APP_CONFIG.sessionKey, JSON.stringify(snapshot));
          } catch (syncError) {
            console.error(syncError);
          }
        }

        return snapshot;
      } catch (error) {
        console.error(error);
      }
    }

    return null;
  }

  function storeSnapshot(snapshot) {
    const normalized = normalizeSessionSnapshot(snapshot);
    if (!normalized) return null;

    for (const storage of getSessionStorages()) {
      try {
        storage.setItem(window.APP_CONFIG.sessionKey, JSON.stringify(normalized));
      } catch (error) {
        console.error(error);
      }
    }

    return normalized;
  }

  function clearSnapshot() {
    for (const storage of getSessionStorages()) {
      try {
        storage.removeItem(window.APP_CONFIG.sessionKey);
      } catch (error) {
        console.error(error);
      }
    }
  }

  async function sleep(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  async function getSessionWithRetry(retries = 2, delayMs = 150) {
    let session = await getSession();
    if (session) return session;

    for (let index = 0; index < retries; index += 1) {
      await sleep(delayMs);
      session = await getSession();
      if (session) return session;
    }

    return null;
  }

  async function login(identifier, password) {
    clearLegacySnapshots();
    clearSnapshot();

    try {
      const response = await window.AppApi.login({
        identifier: normalizeLogin(identifier),
        password: String(password || '')
      });

      const snapshot = storeSnapshot(response);
      if (!snapshot) {
        return { ok: false, message: 'Login feito, mas a sessao nao pode ser criada.' };
      }

      return {
        ok: true,
        session: snapshot
      };
    } catch (error) {
      console.error(error);
      return {
        ok: false,
        message: (error && error.message) ? error.message : 'Erro inesperado ao entrar.'
      };
    }
  }

  async function logout() {
    try {
      await window.AppApi.logout();
    } catch (error) {
      console.error(error);
    } finally {
      clearSnapshot();
      clearLegacySnapshots();
      window.AppApi.disconnectSocket();
    }
  }

  async function getSession() {
    clearLegacySnapshots();
    const snapshot = readSnapshot();
    if (!snapshot || !snapshot.token) return null;

    const expiresAt = Date.parse(String(snapshot.expiresAt || ''));
    if (Number.isFinite(expiresAt) && expiresAt < Date.now()) {
      clearSnapshot();
      return null;
    }

    window.setTimeout(async () => {
      try {
        const remote = await window.AppApi.getSession();
        storeSnapshot({
          token: snapshot.token,
          ...remote
        });
      } catch (error) {
        console.error(error);
      }
    }, 0);

    return snapshot;
  }

  async function requireSession() {
    const session = await getSessionWithRetry();
    if (!session) {
      window.location.href = 'index.html';
      return null;
    }
    return session;
  }

  async function requireRole(role) {
    const session = await requireSession();
    if (!session) return null;
    if (session.role !== role) {
      window.location.href = session.role === 'master' ? 'mestre.html' : 'personagem.html';
      return null;
    }
    return session;
  }

  window.AppAuth = {
    normalizeLogin,
    login,
    logout,
    getSession,
    requireSession,
    requireRole
  };
})();
