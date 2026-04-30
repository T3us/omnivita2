(function () {
  const DEFAULT_STATUS_OPTIONS = ['Vivo', 'Morrendo', 'Morto'];

  function normalizeLookup(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function getStatusOptions() {
    if (window.AppSystem?.getCombatStatusOptions) {
      return window.AppSystem.getCombatStatusOptions();
    }
    return DEFAULT_STATUS_OPTIONS.slice();
  }

  function normalizeStatus(value, fallback = 'Vivo') {
    if (window.AppSystem?.normalizeCombatStatus) {
      return window.AppSystem.normalizeCombatStatus(value, fallback);
    }

    const normalized = normalizeLookup(value).replace(/-/g, ' ');
    if (!normalized) return fallback;
    if (normalized.includes('morto') || normalized.includes('derrotado')) return 'Morto';
    if (normalized.includes('morrendo') || normalized.includes('agonizando')) return 'Morrendo';
    if (
      normalized.includes('vivo')
      || normalized.includes('estavel')
      || normalized.includes('disponivel')
      || normalized.includes('pronto')
      || normalized.includes('em cena')
      || normalized.includes('ativo')
    ) {
      return 'Vivo';
    }

    return fallback;
  }

  function buildStatusOptionsMarkup(selectedStatus = 'Vivo') {
    const selected = normalizeStatus(selectedStatus, 'Vivo');
    return getStatusOptions().map((status) => `
      <option value="${escapeHtml(status)}" ${status === selected ? 'selected' : ''}>${escapeHtml(status)}</option>
    `).join('');
  }

  function getStatusTone(status) {
    const normalized = normalizeStatus(status, 'Vivo');
    if (normalized === 'Morto') return 'dead';
    if (normalized === 'Morrendo') return 'dying';
    return 'alive';
  }

  function getStatusVisualClass(status) {
    const tone = getStatusTone(status);
    if (tone === 'dead') return 'is-dead';
    if (tone === 'dying') return 'is-dying';
    return 'is-alive';
  }

  function normalizeStatusForPv(currentStatus, pvCurrent) {
    const status = normalizeStatus(currentStatus, 'Vivo');
    const pv = Number(pvCurrent || 0);
    if (pv <= 0) return status === 'Morto' ? 'Morto' : 'Morrendo';
    if (status === 'Morrendo') return 'Vivo';
    return status;
  }

  function percent(current, max) {
    const safeMax = Number(max || 0);
    if (!safeMax || safeMax <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round((Number(current || 0) / safeMax) * 100)));
  }

  function sourceKey(entry) {
    const safeEntry = entry && typeof entry === 'object' ? entry : {};
    const combatantType = String(safeEntry.combatantType || '');
    const characterId = String(safeEntry.sourceCharacterId || '');
    const companionId = String(safeEntry.sourceCompanionId || '');

    if (combatantType === 'character' && characterId) return `character:${characterId}`;
    if (combatantType === 'companion' && characterId && companionId) return `companion:${characterId}:${companionId}`;
    return '';
  }

  function actorKey(entry) {
    const safeEntry = entry && typeof entry === 'object' ? entry : {};
    return [
      String(safeEntry.combatantType || ''),
      String(safeEntry.instanceId || safeEntry.sourceCompanionId || safeEntry.sourceCharacterId || '')
    ].join(':');
  }

  function isLiving(entry) {
    const safeEntry = entry && typeof entry === 'object' ? entry : {};
    const status = normalizeStatus(safeEntry.status, 'Vivo');
    const looseStatus = normalizeLookup(safeEntry.status);
    return Number(safeEntry.pvCurrent || 0) > 0 && status !== 'Morto' && looseStatus !== 'derrotado';
  }

  function getNextCombatant(combatants, currentEntry) {
    if (!Array.isArray(combatants) || !combatants.length) return null;
    if (!currentEntry) return combatants[0] || null;
    const currentId = String(currentEntry.instanceId || '');
    const currentIndex = combatants.findIndex((entry) => String(entry.instanceId || '') === currentId);
    if (currentIndex < 0) return combatants[0] || null;
    return combatants[(currentIndex + 1) % combatants.length] || null;
  }

  function syncLabel(lastSyncAt) {
    if (!lastSyncAt) return 'Aguardando sync';
    const secondsAgo = Math.max(0, Math.round((Date.now() - Number(lastSyncAt || 0)) / 1000));
    if (secondsAgo <= 1) return 'Atualizado agora';
    if (secondsAgo < 60) return `Atualizado ha ${secondsAgo}s`;
    const minutesAgo = Math.max(1, Math.round(secondsAgo / 60));
    return `Atualizado ha ${minutesAgo}min`;
  }

  window.AppCombatUtils = {
    escapeHtml,
    normalizeStatus,
    getStatusOptions,
    buildStatusOptionsMarkup,
    getStatusTone,
    getStatusVisualClass,
    normalizeStatusForPv,
    percent,
    sourceKey,
    actorKey,
    isLiving,
    getNextCombatant,
    syncLabel
  };
})();
