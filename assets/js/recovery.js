(function () {
  const refs = {
    inspectButton: document.getElementById('inspectRecoveryButton'),
    downloadButton: document.getElementById('downloadRecoveryButton'),
    summary: document.getElementById('recoverySummary'),
    characters: document.getElementById('recoveryCharacters')
  };

  const STORAGE_KEYS = [
    'omnivita_campaign_cache_v1',
    'omnivita_campaign_data_v2',
    'omnivita_api_session_v1',
    'omnivita_session_v2'
  ];

  let latestBundle = null;

  function clone(value) {
    return JSON.parse(JSON.stringify(value ?? null));
  }

  function slugify(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function readJson(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  function getAllRelevantEntries() {
    return STORAGE_KEYS
      .map((key) => ({ key, value: readJson(key) }))
      .filter((entry) => entry.value);
  }

  function extractCharactersFromPayload(payload) {
    if (!payload) return [];
    if (Array.isArray(payload.characters)) return payload.characters;
    if (payload.state && Array.isArray(payload.state.characters)) return payload.state.characters;
    if (Array.isArray(payload.data)) return payload.data;
    return [];
  }

  function scoreCharacter(character) {
    return JSON.stringify(character || {}).length;
  }

  function dedupeCharacters(characters) {
    const map = new Map();
    characters.forEach((character) => {
      const key = String(character?.id || '');
      if (!key) return;
      const existing = map.get(key);
      if (!existing || scoreCharacter(character) > scoreCharacter(existing)) {
        map.set(key, clone(character));
      }
    });
    return Array.from(map.values());
  }

  function getMockAccount(username) {
    const accounts = Array.isArray(window.MOCK_DATA?.accounts) ? window.MOCK_DATA.accounts : [];
    return accounts.find((entry) => String(entry.username || '').toLowerCase() === String(username || '').toLowerCase()) || null;
  }

  function deriveProfiles(characters, sessionSnapshots) {
    const profiles = [];
    characters.forEach((character, index) => {
      const username = String(
        character?.ownerUsername
        || sessionSnapshots.find((entry) => entry.characterId === character.id)?.username
        || `player-${index + 1}`
      ).trim().toLowerCase();
      const mockAccount = getMockAccount(username);
      const sessionMatch = sessionSnapshots.find((entry) => entry.username === username || entry.characterId === character.id) || null;

      profiles.push({
        id: String(character?.ownerUserId || sessionMatch?.userId || ''),
        email: String(sessionMatch?.email || `${username}@omnivita.local`),
        username,
        display_name: String(character?.identity?.name || username),
        role: String(sessionMatch?.role || mockAccount?.role || 'player'),
        character_id: String(character?.id || '')
      });
    });
    return profiles;
  }

  function deriveCharactersRows(characters) {
    return characters.map((character) => ({
      id: String(character?.id || ''),
      owner_user_id: String(character?.ownerUserId || ''),
      owner_username: String(character?.ownerUsername || ''),
      name: String(character?.identity?.name || ''),
      age: character?.identity?.age ?? '',
      character_class: String(character?.identity?.className || 'Especialista'),
      level: Number(character?.identity?.level || 1),
      status: String(character?.resources?.status || ''),
      profile_image_url: String(character?.identity?.image || ''),
      sheet: clone(character)
    }));
  }

  function deriveCompanionsRows(characters) {
    const rows = [];
    characters.forEach((character) => {
      const companions = Array.isArray(character?.companions) ? character.companions : [];
      companions.forEach((companion, index) => {
        rows.push({
          id: String(companion?.id || `${character.id}-cmp-${index + 1}`),
          character_id: String(character?.id || ''),
          name: String(companion?.name || ''),
          type: String(companion?.type || ''),
          status: String(companion?.status || ''),
          photo_url: String(companion?.image || ''),
          current_pv: Number(companion?.pvCurrent || 0),
          max_pv: Number(companion?.pvMax || 0),
          armor: Number(companion?.armor || 0),
          attributes: clone(companion?.attributes || {}),
          skills: clone(companion?.skills || []),
          facets: clone(companion?.facets || []),
          notes: String(companion?.notes || ''),
          sort_order: index
        });
      });
    });
    return rows;
  }

  function readSessionSnapshots(entries) {
    return entries
      .filter((entry) => entry.key === 'omnivita_api_session_v1' || entry.key === 'omnivita_session_v2')
      .map((entry) => entry.value)
      .filter(Boolean)
      .map((value) => ({
        userId: String(value.userId || ''),
        email: String(value.email || ''),
        username: String(value.username || ''),
        role: String(value.role || ''),
        characterId: String(value.characterId || '')
      }));
  }

  function renderCharacters(characters) {
    refs.characters.innerHTML = '';
    if (!characters.length) {
      refs.characters.innerHTML = '<div class="empty-state">Nenhuma ficha encontrada neste navegador.</div>';
      return;
    }

    characters.forEach((character) => {
      const card = document.createElement('article');
      card.className = 'info-card';
      card.innerHTML = `
        <h3>${character.identity?.name || 'Sem nome'}</h3>
        <p class="subtle">${character.identity?.className || 'Sem classe'} | Nível ${Number(character.identity?.level || 1)}</p>
        <div class="card-stat-row wrap-row">
          <span class="stat-tag">ID ${character.id || '-'}</span>
          <span class="stat-tag">Dono ${character.ownerUsername || '-'}</span>
          <span class="stat-tag">Mini-fichas ${(character.companions || []).length}</span>
        </div>
      `;
      refs.characters.appendChild(card);
    });
  }

  function buildBundle() {
    const entries = getAllRelevantEntries();
    const characters = dedupeCharacters(
      entries.flatMap((entry) => extractCharactersFromPayload(entry.value))
    );
    const sessionSnapshots = readSessionSnapshots(entries);
    const profiles = deriveProfiles(characters, sessionSnapshots);
    const companions = deriveCompanionsRows(characters);
    const characterRows = deriveCharactersRows(characters);

    return {
      source: 'omnivita-browser-recovery',
      exportedAt: new Date().toISOString(),
      origin: location.origin,
      storageKeys: entries.map((entry) => entry.key),
      sessions: sessionSnapshots,
      profiles,
      characters: characterRows,
      companions,
      authUsers: []
    };
  }

  function downloadJson(filename, payload) {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function inspect() {
    latestBundle = buildBundle();
    const characterCount = latestBundle.characters.length;
    const companionCount = latestBundle.companions.length;
    const accountCount = latestBundle.profiles.length;

    refs.summary.innerHTML = `
      <strong>Resultado</strong>
      <p>${characterCount} ficha(s), ${companionCount} mini-ficha(s) e ${accountCount} perfil(is) encontrados.</p>
      <p>Chaves lidas: ${latestBundle.storageKeys.length ? latestBundle.storageKeys.join(', ') : 'nenhuma'}</p>
    `;
    renderCharacters(
      latestBundle.characters.map((entry) => entry.sheet || entry)
    );
    refs.downloadButton.disabled = !characterCount;
  }

  function downloadBundle() {
    if (!latestBundle) {
      inspect();
    }
    if (!latestBundle || !latestBundle.characters.length) return;

    const primaryProfile = latestBundle.profiles[0]?.username || 'browser';
    const filename = `omnivita-recovery-${slugify(primaryProfile) || 'browser'}-${Date.now()}.json`;
    downloadJson(filename, latestBundle);
  }

  refs.inspectButton?.addEventListener('click', inspect);
  refs.downloadButton?.addEventListener('click', downloadBundle);
})();
