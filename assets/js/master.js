(async function () {
  const session = await window.AppAuth.requireRole('master');
  if (!session) return;
  await window.AppStorage.init();

  const refs = {
    masterSessionUser: document.getElementById('masterSessionUser'),
    masterStatus: document.getElementById('masterStatus'),
    masterExportAllButton: document.getElementById('masterExportAllButton'),
    masterImportAllButton: document.getElementById('masterImportAllButton'),
    masterImportAllInput: document.getElementById('masterImportAllInput'),
    masterOptimizeImagesButton: document.getElementById('masterOptimizeImagesButton'),
    masterSearchInput: document.getElementById('masterSearchInput'),
    masterQuickFilter: document.getElementById('masterQuickFilter'),
    masterVisibleCount: document.getElementById('masterVisibleCount'),
    masterAlertCount: document.getElementById('masterAlertCount'),
    masterOverviewSummary: document.getElementById('masterOverviewSummary'),
    masterEncounterCopyButton: document.getElementById('masterEncounterCopyButton'),
    masterEncounterType: document.getElementById('masterEncounterType'),
    masterEncounterPressure: document.getElementById('masterEncounterPressure'),
    masterEncounterSelectPresentButton: document.getElementById('masterEncounterSelectPresentButton'),
    masterEncounterSelectVisibleButton: document.getElementById('masterEncounterSelectVisibleButton'),
    masterEncounterSelectAllButton: document.getElementById('masterEncounterSelectAllButton'),
    masterEncounterParticipants: document.getElementById('masterEncounterParticipants'),
    masterEncounterSummary: document.getElementById('masterEncounterSummary'),
    masterEncounterOutput: document.getElementById('masterEncounterOutput'),
    masterEncounterBlock: document.getElementById('masterEncounterBlock'),
    masterEnemyLibraryCount: document.getElementById('masterEnemyLibraryCount'),
    masterEnemyLibraryList: document.getElementById('masterEnemyLibraryList'),
    masterNewEnemyButton: document.getElementById('masterNewEnemyButton'),
    masterActiveEncounterCount: document.getElementById('masterActiveEncounterCount'),
    masterActiveEncounterPv: document.getElementById('masterActiveEncounterPv'),
    masterAddPresentPlayersButton: document.getElementById('masterAddPresentPlayersButton'),
    masterAddVisiblePlayersButton: document.getElementById('masterAddVisiblePlayersButton'),
    masterPassTurnButton: document.getElementById('masterPassTurnButton'),
    masterResetTurnButton: document.getElementById('masterResetTurnButton'),
    masterSortActiveEncounterButton: document.getElementById('masterSortActiveEncounterButton'),
    masterClearActiveEncounterButton: document.getElementById('masterClearActiveEncounterButton'),
    masterHardResetCombatButton: document.getElementById('masterHardResetCombatButton'),
    masterActiveEncounterSummary: document.getElementById('masterActiveEncounterSummary'),
    masterActiveEncounterQuickAdd: document.getElementById('masterActiveEncounterQuickAdd'),
    masterActiveEncounterList: document.getElementById('masterActiveEncounterList'),
    masterLogMount: document.getElementById('masterLogMount'),
    masterCharacterList: document.getElementById('masterCharacterList'),
    masterCharacterSelect: document.getElementById('masterCharacterSelect'),
    masterPvInput: document.getElementById('masterPvInput'),
    masterPeInput: document.getElementById('masterPeInput'),
    masterPdInput: document.getElementById('masterPdInput'),
    masterInstabilityInput: document.getElementById('masterInstabilityInput'),
    masterStatusInput: document.getElementById('masterStatusInput'),
    masterNotesInput: document.getElementById('masterNotesInput'),
    masterOpenCompanionManagerButton: document.getElementById('masterOpenCompanionManagerButton'),
    masterSessionTags: document.getElementById('masterSessionTags'),
    masterSelectedSummary: document.getElementById('masterSelectedSummary'),
    masterLogoutButton: document.getElementById('masterLogoutButton'),
    masterCompanionDialog: document.getElementById('masterCompanionDialog'),
    masterCompanionDialogTitle: document.getElementById('masterCompanionDialogTitle'),
    masterAddCompanionButton: document.getElementById('masterAddCompanionButton'),
    masterCompanionApplyButton: document.getElementById('masterCompanionApplyButton'),
    masterCompanionStickyAvatar: document.getElementById('masterCompanionStickyAvatar'),
    masterCompanionStickyName: document.getElementById('masterCompanionStickyName'),
    masterCompanionStickyType: document.getElementById('masterCompanionStickyType'),
    masterCompanionStickyStatus: document.getElementById('masterCompanionStickyStatus'),
    masterCompanionPicker: document.getElementById('masterCompanionPicker'),
    masterCompanionBulkInput: document.getElementById('masterCompanionBulkInput'),
    masterCompanionBulkResult: document.getElementById('masterCompanionBulkResult'),
    masterCompanionNameInput: document.getElementById('masterCompanionNameInput'),
    masterCompanionTypeInput: document.getElementById('masterCompanionTypeInput'),
    masterCompanionStatusInput: document.getElementById('masterCompanionStatusInput'),
    masterCompanionArmorInput: document.getElementById('masterCompanionArmorInput'),
    masterCompanionPvCurrentInput: document.getElementById('masterCompanionPvCurrentInput'),
    masterCompanionPvMaxInput: document.getElementById('masterCompanionPvMaxInput'),
    masterCompanionAttrForcaInput: document.getElementById('masterCompanionAttrForcaInput'),
    masterCompanionAttrDestrezaInput: document.getElementById('masterCompanionAttrDestrezaInput'),
    masterCompanionAttrSentidosInput: document.getElementById('masterCompanionAttrSentidosInput'),
    masterCompanionAttrVigorInput: document.getElementById('masterCompanionAttrVigorInput'),
    masterCompanionAttrInteligenciaInput: document.getElementById('masterCompanionAttrInteligenciaInput'),
    masterCompanionAttrNexoInput: document.getElementById('masterCompanionAttrNexoInput'),
    masterCompanionSkillsView: document.getElementById('masterCompanionSkillsView'),
    masterCompanionFacetsView: document.getElementById('masterCompanionFacetsView'),
    masterCompanionNotesInput: document.getElementById('masterCompanionNotesInput'),
    masterEnemyDialog: document.getElementById('masterEnemyDialog'),
    masterEnemyDialogTitle: document.getElementById('masterEnemyDialogTitle'),
    masterEnemySaveButton: document.getElementById('masterEnemySaveButton'),
    masterEnemyDeleteButton: document.getElementById('masterEnemyDeleteButton'),
    masterEnemyStickyAvatar: document.getElementById('masterEnemyStickyAvatar'),
    masterEnemyStickyName: document.getElementById('masterEnemyStickyName'),
    masterEnemyStickyRole: document.getElementById('masterEnemyStickyRole'),
    masterEnemyStickySource: document.getElementById('masterEnemyStickySource'),
    masterEnemyStickyMeta: document.getElementById('masterEnemyStickyMeta'),
    masterEnemyNameInput: document.getElementById('masterEnemyNameInput'),
    masterEnemyRoleInput: document.getElementById('masterEnemyRoleInput'),
    masterEnemyStatusInput: document.getElementById('masterEnemyStatusInput'),
    masterEnemyCountCurrentInput: document.getElementById('masterEnemyCountCurrentInput'),
    masterEnemyCountMaxInput: document.getElementById('masterEnemyCountMaxInput'),
    masterEnemyPvCurrentInput: document.getElementById('masterEnemyPvCurrentInput'),
    masterEnemyPvMaxInput: document.getElementById('masterEnemyPvMaxInput'),
    masterEnemyArmorInput: document.getElementById('masterEnemyArmorInput'),
    masterEnemyDodgeInput: document.getElementById('masterEnemyDodgeInput'),
    masterEnemyBlockInput: document.getElementById('masterEnemyBlockInput'),
    masterEnemyInitiativeInput: document.getElementById('masterEnemyInitiativeInput'),
    masterEnemyAttackInput: document.getElementById('masterEnemyAttackInput'),
    masterEnemyPeInput: document.getElementById('masterEnemyPeInput'),
    masterEnemyPdInput: document.getElementById('masterEnemyPdInput'),
    masterEnemyDamageLabelInput: document.getElementById('masterEnemyDamageLabelInput'),
    masterEnemyDamageExpressionInput: document.getElementById('masterEnemyDamageExpressionInput'),
    masterEnemyDamageAverageInput: document.getElementById('masterEnemyDamageAverageInput'),
    masterEnemySourceInput: document.getElementById('masterEnemySourceInput'),
    masterEnemyAttrForcaInput: document.getElementById('masterEnemyAttrForcaInput'),
    masterEnemyAttrDestrezaInput: document.getElementById('masterEnemyAttrDestrezaInput'),
    masterEnemyAttrSentidosInput: document.getElementById('masterEnemyAttrSentidosInput'),
    masterEnemyAttrVigorInput: document.getElementById('masterEnemyAttrVigorInput'),
    masterEnemyAttrInteligenciaInput: document.getElementById('masterEnemyAttrInteligenciaInput'),
    masterEnemyAttrNexoInput: document.getElementById('masterEnemyAttrNexoInput'),
    masterEnemyBasicDamageLabelInput: document.getElementById('masterEnemyBasicDamageLabelInput'),
    masterEnemyBasicDamageExpressionInput: document.getElementById('masterEnemyBasicDamageExpressionInput'),
    masterEnemyBasicDamageAverageInput: document.getElementById('masterEnemyBasicDamageAverageInput'),
    masterEnemyNotesInput: document.getElementById('masterEnemyNotesInput'),
    masterScenarioAddButton: document.getElementById('masterScenarioAddButton'),
    masterScenarioList: document.getElementById('masterScenarioList'),
    masterScenarioSearchInput: document.getElementById('masterScenarioSearchInput'),
    masterScenarioFilterType: document.getElementById('masterScenarioFilterType'),
    masterScenarioFilterStatus: document.getElementById('masterScenarioFilterStatus'),
    masterScenarioFilterTags: document.getElementById('masterScenarioFilterTags'),
    masterScenarioBulkInput: document.getElementById('masterScenarioBulkInput'),
    masterScenarioBulkImportButton: document.getElementById('masterScenarioBulkImportButton'),
    masterScenarioBulkClearButton: document.getElementById('masterScenarioBulkClearButton'),
    masterScenarioBulkResult: document.getElementById('masterScenarioBulkResult'),
    masterScenarioDetail: document.getElementById('masterScenarioDetail'),
    masterScenarioTools: document.getElementById('masterScenarioTools')
  };

  const companionUi = window.AppCompanionUi;
  const masterCompanionFieldRefs = {
    nameInput: refs.masterCompanionNameInput,
    typeInput: refs.masterCompanionTypeInput,
    statusInput: refs.masterCompanionStatusInput,
    pvCurrentInput: refs.masterCompanionPvCurrentInput,
    pvMaxInput: refs.masterCompanionPvMaxInput,
    armorInput: refs.masterCompanionArmorInput,
    attrForcaInput: refs.masterCompanionAttrForcaInput,
    attrDestrezaInput: refs.masterCompanionAttrDestrezaInput,
    attrSentidosInput: refs.masterCompanionAttrSentidosInput,
    attrVigorInput: refs.masterCompanionAttrVigorInput,
    attrInteligenciaInput: refs.masterCompanionAttrInteligenciaInput,
    attrNexoInput: refs.masterCompanionAttrNexoInput,
    notesInput: refs.masterCompanionNotesInput
  };
  const masterCompanionStickyRefs = {
    avatarElement: refs.masterCompanionStickyAvatar,
    stickyNameElement: refs.masterCompanionStickyName,
    stickyTypeElement: refs.masterCompanionStickyType,
    stickyStatusElement: refs.masterCompanionStickyStatus
  };
  const masterEnemyFieldRefs = {
    nameInput: refs.masterEnemyNameInput,
    roleInput: refs.masterEnemyRoleInput,
    statusInput: refs.masterEnemyStatusInput,
    countCurrentInput: refs.masterEnemyCountCurrentInput,
    countMaxInput: refs.masterEnemyCountMaxInput,
    pvCurrentInput: refs.masterEnemyPvCurrentInput,
    pvMaxInput: refs.masterEnemyPvMaxInput,
    armorInput: refs.masterEnemyArmorInput,
    dodgeInput: refs.masterEnemyDodgeInput,
    blockInput: refs.masterEnemyBlockInput,
    initiativeInput: refs.masterEnemyInitiativeInput,
    attackInput: refs.masterEnemyAttackInput,
    peInput: refs.masterEnemyPeInput,
    pdInput: refs.masterEnemyPdInput,
    damageLabelInput: refs.masterEnemyDamageLabelInput,
    damageExpressionInput: refs.masterEnemyDamageExpressionInput,
    damageAverageInput: refs.masterEnemyDamageAverageInput,
    sourceInput: refs.masterEnemySourceInput,
    attrForcaInput: refs.masterEnemyAttrForcaInput,
    attrDestrezaInput: refs.masterEnemyAttrDestrezaInput,
    attrSentidosInput: refs.masterEnemyAttrSentidosInput,
    attrVigorInput: refs.masterEnemyAttrVigorInput,
    attrInteligenciaInput: refs.masterEnemyAttrInteligenciaInput,
    attrNexoInput: refs.masterEnemyAttrNexoInput,
    basicDamageLabelInput: refs.masterEnemyBasicDamageLabelInput,
    basicDamageExpressionInput: refs.masterEnemyBasicDamageExpressionInput,
    basicDamageAverageInput: refs.masterEnemyBasicDamageAverageInput,
    notesInput: refs.masterEnemyNotesInput
  };

  const SESSION_TAG_OPTIONS = [
    { value: 'presente', label: 'Presente' },
    { value: 'ausente', label: 'Ausente' },
    { value: 'ferido', label: 'Ferido' },
    { value: 'instavel', label: 'Instavel' },
    { value: 'pressao', label: 'Pressao' },
    { value: 'focus', label: 'Foco' }
  ];
  const combatUtils = window.AppCombatUtils;
  const COMBAT_STATUS_OPTIONS = combatUtils?.getStatusOptions
    ? combatUtils.getStatusOptions()
    : (window.AppSystem.getCombatStatusOptions ? window.AppSystem.getCombatStatusOptions() : ['Vivo', 'Morrendo', 'Morto']);
  const IMAGE_OPTIMIZATION = {
    maxDimension: 768,
    outputType: 'image/webp',
    preferredQuality: 0.84,
    minimumQuality: 0.62,
    maxStoredLength: 180_000
  };

  function normalizeCombatStatus(value, fallback = 'Vivo') {
    if (combatUtils?.normalizeStatus) {
      return combatUtils.normalizeStatus(value, fallback);
    }
    if (window.AppSystem?.normalizeCombatStatus) {
      return window.AppSystem.normalizeCombatStatus(value, fallback);
    }
    return String(value || '').trim() || fallback;
  }

  function buildCombatStatusOptionsMarkup(selectedStatus = 'Vivo') {
    return combatUtils?.buildStatusOptionsMarkup
      ? combatUtils.buildStatusOptionsMarkup(selectedStatus)
      : (() => {
        const selected = normalizeCombatStatus(selectedStatus, 'Vivo');
        return COMBAT_STATUS_OPTIONS.map((status) => `
          <option value="${escapeHtml(status)}" ${status === selected ? 'selected' : ''}>${escapeHtml(status)}</option>
        `).join('');
      })();
  }

  function getCombatStatusTone(status) {
    return combatUtils?.getStatusTone
      ? combatUtils.getStatusTone(status)
      : (() => {
        const normalized = normalizeCombatStatus(status, 'Vivo');
        if (normalized === 'Morto') return 'dead';
        if (normalized === 'Morrendo') return 'dying';
        return 'alive';
      })();
  }

  function normalizeStatusForPv(currentStatus, pvCurrent) {
    return combatUtils?.normalizeStatusForPv
      ? combatUtils.normalizeStatusForPv(currentStatus, pvCurrent)
      : (() => {
        const status = normalizeCombatStatus(currentStatus, 'Vivo');
        const pv = Number(pvCurrent || 0);
        if (pv <= 0) return status === 'Morto' ? 'Morto' : 'Morrendo';
        if (status === 'Morrendo') return 'Vivo';
        return status;
      })();
  }

  function buildMasterEncounterPvBar(entry) {
    const current = Number(entry?.pvCurrent || 0);
    const max = Number(entry?.pvMax || 0);
    const pct = combatUtils?.percent ? combatUtils.percent(current, max) : percent(current, max);

    return `
      <div class="master-encounter-pv-block">
        <div class="master-encounter-resource-head">
          <strong>PV ${current}/${max}</strong>
          <span>${pct}%</span>
        </div>
        <div class="resource-bar-shell compact-resource-bar master-encounter-pv-bar">
          <div class="resource-bar-track">
            <div class="resource-bar-fill bar-pv" style="width: ${pct}%"></div>
          </div>
        </div>
      </div>
    `;
  }

  const BULK_ATTRIBUTE_KEYS = ['forca', 'destreza', 'sentidos', 'vigor', 'inteligencia', 'nexo'];
  const MASTER_ENCOUNTER_STORAGE_KEY = 'omnivita-master-encounter-v1';
  const MASTER_ENEMY_LIBRARY_KEY = 'omnivita-master-enemies-v1';
  const MASTER_ACTIVE_ENCOUNTER_KEY = 'omnivita-master-active-encounter-v1';
  const MASTER_ACTIVE_TURN_STORAGE_KEY = 'omnivita-master-active-turn-v1';
  const MASTER_SCENARIO_STORAGE_KEY = 'omnivita-master-scenarios-v1';
  const MASTER_SCENARIO_REMOTE_KEY = 'scenarios';
  const SCENARIO_TYPES = [
    'entry',
    'social',
    'danger',
    'faction',
    'rest',
    'secret',
    'investigation',
    'combat',
    'support'
  ];
  const SCENARIO_STATUSES = ['unvisited', 'active', 'visited', 'changed'];
  const SCENARIO_NPC_STATUSES = ['present', 'absent', 'hostile', 'neutral', 'friendly', 'hidden'];
  const SCENARIO_EVENT_STATUSES = ['available', 'used', 'discarded', 'moved'];
  const SCENARIO_CLUE_STATUSES = ['hidden', 'found', 'missed'];
  const ARC_EVENT_STATUSES = ['latent', 'active', 'triggered', 'resolved'];

  let scenarioState = null;
  let activeScenarioId = '';
  let scenarioRemoteReady = false;
  let scenarioRemoteSaving = false;
  let scenarioRemoteSaveQueued = false;
  let scenarioFilters = {
    search: '',
    type: 'all',
    status: 'all',
    tags: ''
  };
  const ENCOUNTER_PRESSURE_LABELS = {
    light: 'Leve',
    balanced: 'Equilibrada',
    heavy: 'Pesada'
  };
  const ENCOUNTER_TYPE_CONFIG = {
    swarm: {
      label: 'Varios fracos',
      archetype: 'Pressao numerica',
      count(partySize, pressureIndex) {
        return Math.max(3, Math.min(12, partySize + 2 + Math.max(0, pressureIndex)));
      },
      duration: [1.9, 2.2, 2.5],
      damageShare: [0.13, 0.16, 0.19],
      armorDelta: -1,
      dodgeDelta: -1,
      blockDelta: -2,
      attackDelta: -1,
      pdFactor: 0.25,
      peFactor: 0.3,
      cardNote: 'Serve para ocupar espaco, drenar acao e cair em um ou dois bons acertos.'
    },
    skirmish: {
      label: 'Grupo equilibrado',
      archetype: 'Oponente base',
      count(partySize, pressureIndex) {
        return Math.max(2, Math.min(8, partySize + (pressureIndex === 2 ? 1 : 0)));
      },
      duration: [2.2, 2.5, 2.9],
      damageShare: [0.18, 0.22, 0.26],
      armorDelta: 0,
      dodgeDelta: 0,
      blockDelta: 0,
      attackDelta: 0,
      pdFactor: 0.42,
      peFactor: 0.45,
      cardNote: 'Boa linha media para encontros de troca franca, sem burst exagerado.'
    },
    elite: {
      label: 'Elites',
      archetype: 'Elite de cena',
      count(partySize, pressureIndex) {
        return Math.max(1, Math.min(4, Math.ceil(partySize / 2) + (pressureIndex === 2 && partySize >= 4 ? 1 : 0)));
      },
      duration: [2.6, 3.0, 3.4],
      damageShare: [0.24, 0.29, 0.34],
      armorDelta: 1,
      dodgeDelta: 1,
      blockDelta: 1,
      attackDelta: 1,
      pdFactor: 0.58,
      peFactor: 0.62,
      cardNote: 'Cada inimigo deve aguentar foco por alguns turnos e cobrar reposicionamento.'
    },
    boss: {
      label: 'Boss',
      archetype: 'Boss principal',
      count() {
        return 1;
      },
      duration: [3.0, 3.4, 3.9],
      damageShare: [0.3, 0.35, 0.4],
      armorDelta: 2,
      dodgeDelta: 2,
      blockDelta: 2,
      attackDelta: 2,
      pdFactor: 0.72,
      peFactor: 0.82,
      cardNote: 'Pensado para aguentar foco do grupo inteiro e ainda devolver pressao real.'
    }
  };
  const ENCOUNTER_DAMAGE_PROFILES = [
    { key: 'impulso', label: 'Impulso', expression: '1d6 + Nexo/2', average(scale) { return 3.5 + (scale / 2); } },
    { key: 'menor', label: 'Menor', expression: '2d6 + Nexo', average(scale) { return 7 + scale; } },
    { key: 'padrao', label: 'Padrao', expression: '3d6 + Nexo/2', average(scale) { return 10.5 + (scale / 2); } },
    { key: 'forte', label: 'Forte', expression: '3d10 + Nexo', average(scale) { return 16.5 + scale; } },
    { key: 'pesada', label: 'Pesada', expression: '4d10 + Nexo', average(scale) { return 22 + scale; } },
    { key: 'extrema', label: 'Extrema', expression: '5d10 + Nexo', average(scale) { return 27.5 + scale; } }
  ];

  let activeMasterCompanionIndex = null;
  let activeEnemyId = null;
  let activeEnemyCreatedAt = null;
  let lastEncounterBlueprint = null;

  refs.masterSessionUser.textContent = session.username || session.email || '-';

  const tabButtons = Array.from(document.querySelectorAll('.tab-button'));
  const tabPanels = Array.from(document.querySelectorAll('.tab-panel'));

  function activateTab(tabId) {
    if (!tabId) return;
    tabButtons.forEach((button) => {
      const isActive = button.dataset.tab === tabId;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    tabPanels.forEach((panel) => {
      panel.classList.toggle('is-active', panel.dataset.panel === tabId);
    });
    if (tabId === 'masterScenariosTab') {
      renderScenarioPanel();
    }
    try {
      sessionStorage.setItem('omnivita-master-active-tab', tabId);
    } catch (error) {
      // ignore storage issues
    }
  }

  function initTabs() {
    if (!tabButtons.length || !tabPanels.length) return;
    const savedTab = (() => {
      try {
        return sessionStorage.getItem('omnivita-master-active-tab');
      } catch (error) {
        return null;
      }
    })();
    const initialTab = tabButtons.some((button) => button.dataset.tab === savedTab)
      ? savedTab
      : (tabButtons[0] && tabButtons[0].dataset.tab);
    activateTab(initialTab);
    tabButtons.forEach((button) => {
      button.addEventListener('click', () => activateTab(button.dataset.tab));
    });
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escapeMultiline(value) {
    return escapeHtml(value).replace(/\n/g, '<br>');
  }

  function avatarMarkup(image, name) {
    return companionUi.avatarMarkup(image, name, { wrapperClass: 'avatar-shell small-avatar' });
  }

  function setStatus(message) {
    refs.masterStatus.textContent = message;
    clearTimeout(setStatus.timer);
    setStatus.timer = setTimeout(() => {
      refs.masterStatus.textContent = 'Ao vivo';
    }, 1200);
  }

  function downloadTextFile(filename, content, mimeType = 'application/json;charset=utf-8') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  function createId(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  }

  function clonePlain(value) {
    return JSON.parse(JSON.stringify(value ?? null));
  }

  function getScenarioTypeLabel(type) {
    const map = {
      entry: 'Entrada',
      social: 'Social',
      danger: 'Perigo',
      faction: 'Faccao',
      rest: 'Descanso',
      secret: 'Segredo',
      investigation: 'Investigacao',
      combat: 'Combate',
      support: 'Suporte'
    };
    return map[type] || 'Entrada';
  }

  function getScenarioStatusLabel(status) {
    const map = {
      unvisited: 'Nao visitado',
      active: 'Ativo',
      visited: 'Visitado',
      changed: 'Alterado'
    };
    return map[status] || 'Nao visitado';
  }

  function normalizeImportLookup(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function cleanMarkdownLine(value) {
    return String(value || '')
      .replace(/\*\*/g, '')
      .replace(/^[-*]\s+/, '')
      .replace(/^\d+[.)]\s+/, '')
      .trim();
  }

  function cleanMarkdownBody(value) {
    return String(value || '')
      .replace(/\r/g, '')
      .split('\n')
      .filter((line) => !/^\s*-{3,}\s*$/.test(line))
      .join('\n')
      .trim();
  }

  function parseMarkdownFields(text) {
    const fields = new Map();
    const looseLines = [];

    String(text || '').replace(/\r/g, '').split('\n').forEach((line) => {
      if (/^\s*-{3,}\s*$/.test(line)) return;
      const cleaned = cleanMarkdownLine(line);
      if (!cleaned) {
        looseLines.push('');
        return;
      }

      const match = cleaned.match(/^([^:]{1,90}):\s*(.*)$/);
      if (!match) {
        looseLines.push(line);
        return;
      }

      fields.set(normalizeImportLookup(match[1]), match[2].trim());
    });

    return {
      fields,
      body: cleanMarkdownBody(looseLines.join('\n'))
    };
  }

  function getImportedField(fields, keys) {
    const safeKeys = Array.isArray(keys) ? keys : [keys];
    for (const key of safeKeys) {
      const value = fields.get(normalizeImportLookup(key));
      if (value !== undefined) return value;
    }
    return '';
  }

  function mapImportedScenarioType(value) {
    const text = normalizeImportLookup(value);
    if (text.includes('social')) return 'social';
    if (text.includes('perigo') || text.includes('danger')) return 'danger';
    if (text.includes('faccao') || text.includes('faction')) return 'faction';
    if (text.includes('descanso') || text.includes('rest')) return 'rest';
    if (text.includes('segredo') || text.includes('secret')) return 'secret';
    if (text.includes('investigacao') || text.includes('investigation')) return 'investigation';
    if (text.includes('combate') || text.includes('combat')) return 'combat';
    if (text.includes('suporte') || text.includes('support')) return 'support';
    return 'entry';
  }

  function mapImportedScenarioStatus(value) {
    const text = normalizeImportLookup(value);
    if (text.includes('active') || text.includes('ativo')) return 'active';
    if (text.includes('visited') || text.includes('visitado')) return 'visited';
    if (text.includes('changed') || text.includes('alterado')) return 'changed';
    return 'unvisited';
  }

  function mapImportedNpcStatus(value) {
    const text = normalizeImportLookup(value);
    if (text.includes('absent') || text.includes('ausente')) return 'absent';
    if (text.includes('hostile') || text.includes('hostil')) return 'hostile';
    if (text.includes('friendly') || text.includes('amigavel') || text.includes('aliado')) return 'friendly';
    if (text.includes('hidden') || text.includes('oculto') || text.includes('escondido')) return 'hidden';
    if (text.includes('neutral') || text.includes('neutro')) return 'neutral';
    return 'present';
  }

  function mapImportedEventStatus(value) {
    const text = normalizeImportLookup(value);
    if (text.includes('used') || text.includes('usado') || text.includes('aconteceu')) return 'used';
    if (text.includes('discarded') || text.includes('descart')) return 'discarded';
    if (text.includes('moved') || text.includes('movido')) return 'moved';
    return 'available';
  }

  function mapImportedClueStatus(value) {
    const text = normalizeImportLookup(value);
    if (text.includes('found') || text.includes('descobert')) return 'found';
    if (text.includes('missed') || text.includes('perdid')) return 'missed';
    return 'hidden';
  }

  function normalizeScenarioState(state) {
    const safe = state && typeof state === 'object' ? state : {};
    return {
      session: {
        name: String(safe.session?.name || 'Sessao atual'),
        currentScene: String(safe.session?.currentScene || ''),
        currentScenarioId: String(safe.session?.currentScenarioId || ''),
        mood: String(safe.session?.mood || ''),
        pressure: String(safe.session?.pressure || ''),
        note: String(safe.session?.note || '')
      },
      scenarios: Array.isArray(safe.scenarios) ? safe.scenarios : [],
      npcs: Array.isArray(safe.npcs) ? safe.npcs : [],
      events: Array.isArray(safe.events) ? safe.events : [],
      clues: Array.isArray(safe.clues) ? safe.clues : [],
      clocks: Array.isArray(safe.clocks) ? safe.clocks : [],
      arcEvents: Array.isArray(safe.arcEvents) ? safe.arcEvents : []
    };
  }

  function createScenarioSeed(name = 'Novo cenario') {
    return {
      id: createId('scenario'),
      name,
      type: 'entry',
      status: 'unvisited',
      order: 1,
      mood: '',
      narrativePurpose: '',
      objective: '',
      summary: '',
      playerFacingDescription: '',
      notes: '',
      tags: [],
      connectedScenarioIds: [],
      npcIds: [],
      eventIds: [],
      clueIds: [],
      isCurrent: false,
      playersHere: false
    };
  }

  function createScenarioStateSeed() {
    const scenario = createScenarioSeed('Cena inicial');
    return {
      session: {
        name: 'Sessao atual',
        currentScene: '',
        currentScenarioId: scenario.id,
        mood: '',
        pressure: '',
        note: ''
      },
      scenarios: [{ ...scenario, order: 1 }],
      npcs: [],
      events: [],
      clues: [],
      clocks: [],
      arcEvents: []
    };
  }

  function loadScenarioState() {
    try {
      const raw = localStorage.getItem(MASTER_SCENARIO_STORAGE_KEY);
      if (!raw) return createScenarioStateSeed();
      return normalizeScenarioState(JSON.parse(raw));
    } catch (error) {
      console.error(error);
      return createScenarioStateSeed();
    }
  }

  function saveScenarioStateLocal() {
    try {
      localStorage.setItem(MASTER_SCENARIO_STORAGE_KEY, JSON.stringify(scenarioState));
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  function hasScenarioPayload(value) {
    return Boolean(
      value
      && typeof value === 'object'
      && !Array.isArray(value)
      && (
        Array.isArray(value.scenarios)
        || Array.isArray(value.npcs)
        || Array.isArray(value.events)
        || Array.isArray(value.clues)
        || value.session
      )
    );
  }

  async function flushScenarioStateToBackend() {
    if (!scenarioRemoteReady || scenarioRemoteSaving || !window.AppApi?.putMasterData) return;
    scenarioRemoteSaving = true;

    try {
      while (scenarioRemoteSaveQueued) {
        scenarioRemoteSaveQueued = false;
        const payload = normalizeScenarioState(clonePlain(scenarioState));
        await window.AppApi.putMasterData(MASTER_SCENARIO_REMOTE_KEY, payload);
      }
    } catch (error) {
      console.error(error);
      setStatus('Cenarios salvos localmente; backend nao respondeu.');
    } finally {
      scenarioRemoteSaving = false;
      if (scenarioRemoteSaveQueued) {
        flushScenarioStateToBackend();
      }
    }
  }

  function queueScenarioStateRemoteSave() {
    if (!scenarioRemoteReady || !window.AppApi?.putMasterData) return;
    scenarioRemoteSaveQueued = true;
    flushScenarioStateToBackend();
  }

  async function hydrateScenarioStateFromBackend() {
    scenarioState = loadScenarioState();

    if (!window.AppApi?.getMasterData) return;

    try {
      const remote = await window.AppApi.getMasterData(MASTER_SCENARIO_REMOTE_KEY);
      if (hasScenarioPayload(remote?.data)) {
        scenarioState = normalizeScenarioState(remote.data);
        saveScenarioStateLocal();
        scenarioRemoteReady = true;
        return;
      }

      scenarioRemoteReady = true;
      queueScenarioStateRemoteSave();
    } catch (error) {
      console.error(error);
      scenarioRemoteReady = false;
      setStatus('Cenarios em modo local; backend nao respondeu.');
    }
  }

  function persistScenarioState(message = 'Cenarios salvos.') {
    const savedLocal = saveScenarioStateLocal();
    if (savedLocal) {
      setStatus(message);
      queueScenarioStateRemoteSave();
    } else {
      setStatus('Falha ao salvar cenarios.');
    }
  }

  const persistScenarioStateDebounced = debounce(() => {
    persistScenarioState('Cenarios salvos.');
  }, 320);

  function ensureScenarioState() {
    if (!scenarioState) scenarioState = loadScenarioState();
    if (!scenarioState.scenarios.length) {
      const seed = createScenarioSeed('Cena inicial');
      scenarioState.scenarios.push({ ...seed, order: 1 });
      scenarioState.session.currentScenarioId = seed.id;
      persistScenarioState('Cenarios inicializados.');
    }
    activeScenarioId = scenarioState.session.currentScenarioId || scenarioState.scenarios[0].id;
    scenarioState.session.currentScenarioId = activeScenarioId;
  }

  function getScenarioById(id) {
    return scenarioState.scenarios.find((scenario) => scenario.id === id) || null;
  }

  function getScenarioByImportedName(name) {
    const lookup = normalizeImportLookup(name);
    if (!lookup) return null;
    return scenarioState.scenarios.find((scenario) => normalizeImportLookup(scenario.name) === lookup) || null;
  }

  function getNpcById(id) {
    return scenarioState.npcs.find((npc) => npc.id === id) || null;
  }

  function getEventById(id) {
    return scenarioState.events.find((event) => event.id === id) || null;
  }

  function getClueById(id) {
    return scenarioState.clues.find((clue) => clue.id === id) || null;
  }

  function normalizeTagsInput(value) {
    if (!value) return [];
    const slugify = window.AppSystem?.slugify || ((text) => String(text || '').toLowerCase().trim());
    return [...new Set(
      String(value)
        .split(',')
        .map((tag) => slugify(tag))
        .filter(Boolean)
    )].slice(0, 10);
  }

  function syncScenarioOrders(list) {
    list.forEach((scenario, index) => {
      scenario.order = index + 1;
    });
  }

  function setActiveScenario(id, { markStatus = true } = {}) {
    activeScenarioId = id;
    scenarioState.session.currentScenarioId = id;
    scenarioState.scenarios.forEach((scenario) => {
      scenario.isCurrent = scenario.id === id;
      if (markStatus && scenario.isCurrent) {
        scenario.status = 'active';
      }
    });
    persistScenarioStateDebounced();
    renderScenarioPanel();
  }

  function moveScenario(dragId, targetId) {
    if (!dragId || !targetId || dragId === targetId) return;
    const list = [...scenarioState.scenarios].sort((a, b) => a.order - b.order);
    const fromIndex = list.findIndex((scenario) => scenario.id === dragId);
    const toIndex = list.findIndex((scenario) => scenario.id === targetId);
    if (fromIndex < 0 || toIndex < 0) return;
    const [moved] = list.splice(fromIndex, 1);
    list.splice(toIndex, 0, moved);
    syncScenarioOrders(list);
    scenarioState.scenarios = list;
    persistScenarioStateDebounced();
    renderScenarioPanel();
  }

  function applyScenarioFilters(list) {
    const search = scenarioFilters.search.trim().toLowerCase();
    const filterType = scenarioFilters.type;
    const filterStatus = scenarioFilters.status;
    const tagFilter = normalizeTagsInput(scenarioFilters.tags);

    return list.filter((scenario) => {
      if (filterType !== 'all' && scenario.type !== filterType) return false;
      if (filterStatus !== 'all' && scenario.status !== filterStatus) return false;
      if (tagFilter.length) {
        const tagMatch = (scenario.tags || []).some((tag) => tagFilter.includes(tag));
        if (!tagMatch) return false;
      }
      if (search) {
        const haystack = [
          scenario.name,
          scenario.summary,
          scenario.playerFacingDescription,
          scenario.notes,
          (scenario.tags || []).join(' ')
        ].join(' ').toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    });
  }

  function renderScenarioList() {
    if (!refs.masterScenarioList) return;
    const list = [...scenarioState.scenarios].sort((a, b) => a.order - b.order);
    const filtered = applyScenarioFilters(list);

    if (!filtered.length) {
      refs.masterScenarioList.innerHTML = '<div class="scenario-empty-state">Nenhum cenario encontrado.</div>';
      return;
    }

    refs.masterScenarioList.innerHTML = filtered.map((scenario) => {
      const isActive = scenario.id === activeScenarioId;
      const statusLabel = getScenarioStatusLabel(scenario.status);
      const typeLabel = getScenarioTypeLabel(scenario.type);
      const currentMarker = scenario.isCurrent ? '<span class="scenario-status-tag status-active">Agora</span>' : '';
      return `
        <article class="scenario-list-item${isActive ? ' is-active' : ''}" draggable="true" data-scenario-id="${scenario.id}">
          <div class="scenario-list-head">
            <strong>${escapeHtml(scenario.name || 'Sem nome')}</strong>
            <span class="scenario-status-tag status-${scenario.status}">${escapeHtml(statusLabel)}</span>
          </div>
          <div class="scenario-meta-line">
            <span class="stat-tag">${escapeHtml(typeLabel)}</span>
            ${currentMarker}
          </div>
          <div class="scenario-action-row">
            <button class="secondary-button small-button" type="button" data-action="scenario-open" data-scenario-id="${scenario.id}">Abrir</button>
            <button class="secondary-button small-button" type="button" data-action="scenario-set-active" data-scenario-id="${scenario.id}">Ativar</button>
            <button class="secondary-button small-button" type="button" data-action="scenario-mark-visited" data-scenario-id="${scenario.id}">Visitado</button>
            <button class="secondary-button small-button" type="button" data-action="scenario-mark-changed" data-scenario-id="${scenario.id}">Alterado</button>
            <button class="secondary-button small-button" type="button" data-action="scenario-duplicate" data-scenario-id="${scenario.id}">Duplicar</button>
            <button class="danger-button small-button" type="button" data-action="scenario-delete" data-scenario-id="${scenario.id}">Excluir</button>
          </div>
        </article>
      `;
    }).join('');
  }

  function renderScenarioDetail() {
    if (!refs.masterScenarioDetail) return;
    const scenario = getScenarioById(activeScenarioId);
    if (!scenario) {
      refs.masterScenarioDetail.innerHTML = '<div class="scenario-empty-state">Selecione ou crie um cenario para visualizar detalhes.</div>';
      return;
    }

    const tagValue = (scenario.tags || []).join(', ');
    const typeOptions = SCENARIO_TYPES.map((type) => `<option value="${type}" ${scenario.type === type ? 'selected' : ''}>${escapeHtml(getScenarioTypeLabel(type))}</option>`).join('');
    const statusOptions = SCENARIO_STATUSES.map((status) => `<option value="${status}" ${scenario.status === status ? 'selected' : ''}>${escapeHtml(getScenarioStatusLabel(status))}</option>`).join('');

    refs.masterScenarioDetail.innerHTML = `
      <section class="scenario-section">
        <details open>
          <summary>Resumo rapido</summary>
          <div class="form-grid two-columns top-gap-small">
            <label>
              Nome
              <input data-scenario-field="name" type="text" value="${escapeHtml(scenario.name || '')}" />
            </label>
            <label>
              Tipo
              <select data-scenario-field="type">${typeOptions}</select>
            </label>
            <label>
              Clima / atmosfera
              <input data-scenario-field="mood" type="text" value="${escapeHtml(scenario.mood || '')}" />
            </label>
            <label>
              Funcao narrativa
              <input data-scenario-field="narrativePurpose" type="text" value="${escapeHtml(scenario.narrativePurpose || '')}" />
            </label>
            <label>
              Objetivo do lugar
              <input data-scenario-field="objective" type="text" value="${escapeHtml(scenario.objective || '')}" />
            </label>
            <label>
              Resumo
              <input data-scenario-field="summary" type="text" value="${escapeHtml(scenario.summary || '')}" />
            </label>
            <label>
              Estado atual
              <select data-scenario-field="status">${statusOptions}</select>
            </label>
            <label class="span-2">
              Tags
              <input data-scenario-field="tags" type="text" value="${escapeHtml(tagValue)}" placeholder="tag1, tag2" />
            </label>
          </div>
          <div class="scenario-action-row top-gap-small">
            <label class="checkbox-row">
              <input data-scenario-field="playersHere" type="checkbox" ${scenario.playersHere ? 'checked' : ''} />
              Players estao aqui agora
            </label>
            <label class="checkbox-row">
              <input data-scenario-field="isCurrent" type="checkbox" ${scenario.isCurrent ? 'checked' : ''} />
              Cenario ativo agora
            </label>
          </div>
        </details>
      </section>

      <section class="scenario-section">
        <details open>
          <summary>Descricao de mesa</summary>
          <div class="scenario-inline-grid top-gap-small">
            <textarea data-scenario-field="playerFacingDescription" rows="4" placeholder="Texto para narrar a chegada">${escapeHtml(scenario.playerFacingDescription || '')}</textarea>
          </div>
        </details>
      </section>

      <section class="scenario-section">
        <details open>
          <summary>NPCs do cenario</summary>
          <div class="scenario-inline-grid top-gap-small" data-scenario-npcs></div>
        </details>
      </section>

      <section class="scenario-section">
        <details open>
          <summary>Acontecimentos possiveis</summary>
          <div class="scenario-inline-grid top-gap-small" data-scenario-events></div>
        </details>
      </section>

      <section class="scenario-section">
        <details open>
          <summary>Pistas / informacoes</summary>
          <div class="scenario-inline-grid top-gap-small" data-scenario-clues></div>
        </details>
      </section>

      <section class="scenario-section">
        <details open>
          <summary>Notas rapidas do mestre</summary>
          <textarea data-scenario-field="notes" rows="5" placeholder="Notas de mesa em tempo real">${escapeHtml(scenario.notes || '')}</textarea>
        </details>
      </section>

      <section class="scenario-section">
        <details open>
          <summary>Conexoes do cenario</summary>
          <div class="scenario-inline-grid top-gap-small" data-scenario-connections></div>
        </details>
      </section>
    `;

    renderScenarioNpcList(scenario);
    renderScenarioEventList(scenario);
    renderScenarioClueList(scenario);
    renderScenarioConnections(scenario);
  }

  function renderScenarioNpcList(scenario) {
    const mount = refs.masterScenarioDetail?.querySelector('[data-scenario-npcs]');
    if (!mount) return;
    const npcIds = Array.isArray(scenario.npcIds) ? scenario.npcIds : [];
    const availableNpcs = scenarioState.npcs.filter((npc) => !npcIds.includes(npc.id));

    if (!npcIds.length && !availableNpcs.length) {
      mount.innerHTML = `
        <div class="scenario-empty-state">Nenhum NPC vinculado.</div>
        <button class="secondary-button small-button" data-action="npc-add" type="button">Adicionar NPC</button>
      `;
      return;
    }

    const npcCards = npcIds.map((npcId) => {
      const npc = getNpcById(npcId);
      if (!npc) return '';
      const statusOptions = SCENARIO_NPC_STATUSES.map((status) => `<option value="${status}" ${npc.status === status ? 'selected' : ''}>${status}</option>`).join('');
      const scenarioOptions = scenarioState.scenarios.map((entry) => `<option value="${entry.id}" ${npc.locationScenarioId === entry.id ? 'selected' : ''}>${escapeHtml(entry.name)}</option>`).join('');
      return `
        <article class="scenario-mini-card" data-npc-id="${npc.id}">
          <label>
            Nome
            <input data-npc-field="name" type="text" placeholder="Nome do NPC" value="${escapeHtml(npc.name || '')}" />
          </label>
          <input data-npc-field="role" type="text" placeholder="Funcao" value="${escapeHtml(npc.role || '')}" />
          <input data-npc-field="attitude" type="text" placeholder="Atitude" value="${escapeHtml(npc.attitude || '')}" />
          <input data-npc-field="currentAction" type="text" placeholder="O que faz agora" value="${escapeHtml(npc.currentAction || '')}" />
          <input data-npc-field="secret" type="text" placeholder="Segredo / detalhe" value="${escapeHtml(npc.secret || '')}" />
          <select data-npc-field="status">${statusOptions}</select>
          <select data-npc-field="locationScenarioId">${scenarioOptions}</select>
          <div class="scenario-action-row">
            <button class="secondary-button small-button" data-action="npc-present" type="button">Presente agora</button>
            <button class="secondary-button small-button" data-action="npc-unlink" type="button">Remover vinculo</button>
            <button class="danger-button small-button" data-action="npc-delete" type="button">Excluir NPC</button>
          </div>
        </article>
      `;
    }).join('');

    const linkOptions = availableNpcs.map((npc) => `<option value="${npc.id}">${escapeHtml(npc.name)}</option>`).join('');

    mount.innerHTML = `
      ${npcCards}
      <div class="scenario-action-row">
        <button class="secondary-button small-button" data-action="npc-add" type="button">Novo NPC</button>
        <label>
          Vincular existente
          <select data-action="npc-link">
            <option value="">Selecionar</option>
            ${linkOptions}
          </select>
        </label>
      </div>
    `;
  }

  function renderScenarioEventList(scenario) {
    const mount = refs.masterScenarioDetail?.querySelector('[data-scenario-events]');
    if (!mount) return;
    const eventIds = Array.isArray(scenario.eventIds) ? scenario.eventIds : [];
    const availableEvents = scenarioState.events.filter((event) => !eventIds.includes(event.id));
    const eventEntries = eventIds
      .map((eventId) => getEventById(eventId))
      .filter(Boolean)
      .sort((a, b) => Number(b.priority || 0) - Number(a.priority || 0));

    const eventCards = eventEntries.map((entry) => {
      const statusOptions = SCENARIO_EVENT_STATUSES.map((status) => `<option value="${status}" ${entry.status === status ? 'selected' : ''}>${status}</option>`).join('');
      const scenarioOptions = scenarioState.scenarios.map((item) => `<option value="${item.id}" ${entry.scenarioId === item.id ? 'selected' : ''}>${escapeHtml(item.name)}</option>`).join('');
      return `
        <article class="scenario-mini-card" data-event-id="${entry.id}">
          <input data-event-field="title" type="text" placeholder="Titulo" value="${escapeHtml(entry.title || '')}" />
          <label>
            Prioridade
            <input data-event-field="priority" type="number" min="0" value="${Number(entry.priority || 0)}" />
          </label>
          <input data-event-field="trigger" type="text" placeholder="Gatilho" value="${escapeHtml(entry.trigger || '')}" />
          <textarea data-event-field="description" rows="2" placeholder="Descricao">${escapeHtml(entry.description || '')}</textarea>
          <textarea data-event-field="consequence" rows="2" placeholder="Consequencia">${escapeHtml(entry.consequence || '')}</textarea>
          <select data-event-field="status">${statusOptions}</select>
          <select data-event-field="scenarioId">${scenarioOptions}</select>
          <div class="scenario-action-row">
            <button class="secondary-button small-button" data-action="event-priority-up" type="button">Prioridade +</button>
            <button class="secondary-button small-button" data-action="event-priority-down" type="button">Prioridade -</button>
            <button class="secondary-button small-button" data-action="event-used" type="button">Marcar como usado</button>
            <button class="secondary-button small-button" data-action="event-discard" type="button">Descartar</button>
            <button class="secondary-button small-button" data-action="event-duplicate" type="button">Duplicar</button>
            <button class="danger-button small-button" data-action="event-delete" type="button">Excluir</button>
          </div>
        </article>
      `;
    }).join('');

    const linkOptions = availableEvents.map((event) => `<option value="${event.id}">${escapeHtml(event.title)}</option>`).join('');

    mount.innerHTML = `
      ${eventCards || '<div class="scenario-empty-state">Nenhum acontecimento cadastrado.</div>'}
      <div class="scenario-action-row">
        <button class="secondary-button small-button" data-action="event-add" type="button">Novo acontecimento</button>
        <label>
          Vincular existente
          <select data-action="event-link">
            <option value="">Selecionar</option>
            ${linkOptions}
          </select>
        </label>
      </div>
    `;
  }

  function renderScenarioClueList(scenario) {
    const mount = refs.masterScenarioDetail?.querySelector('[data-scenario-clues]');
    if (!mount) return;
    const clueIds = Array.isArray(scenario.clueIds) ? scenario.clueIds : [];
    const availableClues = scenarioState.clues.filter((clue) => !clueIds.includes(clue.id));

    const clueCards = clueIds.map((clueId) => {
      const entry = getClueById(clueId);
      if (!entry) return '';
      const statusOptions = SCENARIO_CLUE_STATUSES.map((status) => `<option value="${status}" ${entry.status === status ? 'selected' : ''}>${status}</option>`).join('');
      const scenarioOptions = scenarioState.scenarios.map((item) => `<option value="${item.id}" ${entry.scenarioId === item.id ? 'selected' : ''}>${escapeHtml(item.name)}</option>`).join('');
      return `
        <article class="scenario-mini-card" data-clue-id="${entry.id}">
          <input data-clue-field="title" type="text" placeholder="Titulo" value="${escapeHtml(entry.title || '')}" />
          <textarea data-clue-field="description" rows="2" placeholder="Descricao">${escapeHtml(entry.description || '')}</textarea>
          <textarea data-clue-field="discoveryMethod" rows="2" placeholder="Como pode ser descoberta">${escapeHtml(entry.discoveryMethod || '')}</textarea>
          <select data-clue-field="status">${statusOptions}</select>
          <select data-clue-field="scenarioId">${scenarioOptions}</select>
          <div class="scenario-action-row">
            <button class="secondary-button small-button" data-action="clue-found" type="button">Descoberta</button>
            <button class="secondary-button small-button" data-action="clue-missed" type="button">Perdida</button>
            <button class="danger-button small-button" data-action="clue-delete" type="button">Excluir</button>
          </div>
        </article>
      `;
    }).join('');

    const linkOptions = availableClues.map((clue) => `<option value="${clue.id}">${escapeHtml(clue.title)}</option>`).join('');

    mount.innerHTML = `
      ${clueCards || '<div class="scenario-empty-state">Nenhuma pista cadastrada.</div>'}
      <div class="scenario-action-row">
        <button class="secondary-button small-button" data-action="clue-add" type="button">Nova pista</button>
        <label>
          Vincular existente
          <select data-action="clue-link">
            <option value="">Selecionar</option>
            ${linkOptions}
          </select>
        </label>
      </div>
    `;
  }

  function renderScenarioConnections(scenario) {
    const mount = refs.masterScenarioDetail?.querySelector('[data-scenario-connections]');
    if (!mount) return;
    const connected = Array.isArray(scenario.connectedScenarioIds) ? scenario.connectedScenarioIds : [];
    const connectedItems = connected.map((id) => {
      const entry = getScenarioById(id);
      if (!entry) return '';
      return `<button class="secondary-button small-button" type="button" data-action="scenario-jump" data-scenario-id="${entry.id}">${escapeHtml(entry.name)}</button>`;
    }).join('');

    const addOptions = scenarioState.scenarios
      .filter((entry) => entry.id !== scenario.id && !connected.includes(entry.id))
      .map((entry) => `<option value="${entry.id}">${escapeHtml(entry.name)}</option>`)
      .join('');

    mount.innerHTML = `
      <div class="scenario-chip-list">${connectedItems || '<span class="subtle">Sem conexoes ainda.</span>'}</div>
      <div class="scenario-action-row">
        <label>
          Adicionar conexao
          <select data-action="scenario-connect">
            <option value="">Selecionar</option>
            ${addOptions}
          </select>
        </label>
        <button class="secondary-button small-button" type="button" data-action="scenario-clear-connections">Limpar</button>
      </div>
    `;
  }

  function renderScenarioTools() {
    if (!refs.masterScenarioTools) return;
    const sessionData = scenarioState.session || {};
    const currentScenario = getScenarioById(activeScenarioId);

    const clockCards = scenarioState.clocks.map((clock) => `
      <div class="scenario-clock" data-clock-id="${clock.id}">
        <input data-clock-field="title" type="text" value="${escapeHtml(clock.title || '')}" placeholder="Relogio" />
        <div class="scenario-clock-row">
          <button class="secondary-button small-button" data-action="clock-dec" type="button">-</button>
          <input data-clock-field="current" type="number" min="0" value="${clock.current || 0}" />
          <span>/</span>
          <input data-clock-field="max" type="number" min="1" value="${clock.max || 4}" />
          <button class="secondary-button small-button" data-action="clock-inc" type="button">+</button>
          <button class="secondary-button small-button" data-action="clock-reset" type="button">Reset</button>
          <button class="danger-button small-button" data-action="clock-delete" type="button">Excluir</button>
        </div>
        <div class="scenario-clock-row">
          <input data-clock-field="color" type="color" value="${clock.color || '#7f6be5'}" />
          <input data-clock-field="notes" type="text" placeholder="Notas" value="${escapeHtml(clock.notes || '')}" />
        </div>
      </div>
    `).join('');

    const activeNpcList = scenarioState.npcs.map((npc) => {
      const location = npc.locationScenarioId ? getScenarioById(npc.locationScenarioId) : null;
      return `
        <div class="scenario-mini-card">
          <strong>${escapeHtml(npc.name || 'NPC')}</strong>
          <span class="subtle">${escapeHtml(npc.status || 'neutral')}</span>
          <span class="subtle">${escapeHtml(location?.name || 'Sem local')}</span>
          <span class="subtle">${escapeHtml(npc.attitude || '')}</span>
        </div>
      `;
    }).join('');

    const arcEvents = scenarioState.arcEvents.map((event) => `
      <div class="scenario-mini-card" data-arc-event-id="${event.id}">
        <input data-arc-field="title" type="text" placeholder="Titulo" value="${escapeHtml(event.title || '')}" />
        <textarea data-arc-field="description" rows="2" placeholder="Descricao">${escapeHtml(event.description || '')}</textarea>
        <input data-arc-field="trigger" type="text" placeholder="Gatilho" value="${escapeHtml(event.trigger || '')}" />
        <select data-arc-field="status">
          ${ARC_EVENT_STATUSES.map((status) => `<option value="${status}" ${event.status === status ? 'selected' : ''}>${status}</option>`).join('')}
        </select>
        <div class="scenario-action-row">
          <button class="secondary-button small-button" data-action="arc-delete" type="button">Excluir</button>
        </div>
      </div>
    `).join('');

    refs.masterScenarioTools.innerHTML = `
      <div class="scenario-tools-card">
        <h4>Estado da sessao</h4>
        <div class="scenario-inline-grid top-gap-small">
          <label>Nome da sessao<input data-session-field="name" type="text" value="${escapeHtml(sessionData.name || '')}" /></label>
          <label>Cena atual<input data-session-field="currentScene" type="text" value="${escapeHtml(sessionData.currentScene || '')}" /></label>
          <label>Cenario atual<input data-session-field="currentScenarioId" type="text" value="${escapeHtml(currentScenario?.name || '')}" readonly /></label>
          <label>Clima geral<input data-session-field="mood" type="text" value="${escapeHtml(sessionData.mood || '')}" /></label>
          <label>Pressao atual<input data-session-field="pressure" type="text" value="${escapeHtml(sessionData.pressure || '')}" /></label>
          <label>Observacao<textarea data-session-field="note" rows="3">${escapeHtml(sessionData.note || '')}</textarea></label>
        </div>
      </div>

      <div class="scenario-tools-card">
        <div class="section-title-row">
          <h4>Clocks</h4>
          <button class="secondary-button small-button" data-action="clock-add" type="button">Novo</button>
        </div>
        <div class="scenario-compact-list">${clockCards || '<div class="scenario-empty-state">Sem clocks ainda.</div>'}</div>
      </div>

      <div class="scenario-tools-card">
        <h4>NPCs ativos da sessao</h4>
        <div class="scenario-compact-list">${activeNpcList || '<div class="scenario-empty-state">Nenhum NPC cadastrado.</div>'}</div>
      </div>

      <div class="scenario-tools-card">
        <div class="section-title-row">
          <h4>Eventos do arco</h4>
          <button class="secondary-button small-button" data-action="arc-add" type="button">Novo</button>
        </div>
        <div class="scenario-compact-list">${arcEvents || '<div class="scenario-empty-state">Nenhum evento global.</div>'}</div>
      </div>
    `;
  }

  function renderScenarioPanel() {
    if (!refs.masterScenarioList || !refs.masterScenarioDetail || !refs.masterScenarioTools) return;
    ensureScenarioState();
    renderScenarioList();
    renderScenarioDetail();
    renderScenarioTools();
  }

  function createNpcSeed(name = 'NPC') {
    return {
      id: createId('npc'),
      name,
      role: '',
      attitude: '',
      currentAction: '',
      secret: '',
      status: 'present',
      locationScenarioId: activeScenarioId || '',
      notes: ''
    };
  }

  function createEventSeed(title = 'Acontecimento') {
    return {
      id: createId('event'),
      title,
      priority: 1,
      trigger: '',
      description: '',
      consequence: '',
      status: 'available',
      scenarioId: activeScenarioId || ''
    };
  }

  function createClueSeed(title = 'Pista') {
    return {
      id: createId('clue'),
      title,
      description: '',
      discoveryMethod: '',
      status: 'hidden',
      scenarioId: activeScenarioId || ''
    };
  }

  function createClockSeed() {
    return {
      id: createId('clock'),
      title: 'Novo clock',
      current: 0,
      max: 4,
      color: '#7f6be5',
      notes: ''
    };
  }

  function createArcEventSeed() {
    return {
      id: createId('arc'),
      title: 'Evento do arco',
      description: '',
      trigger: '',
      status: 'latent'
    };
  }

  function splitScenarioImportBlocks(text) {
    const lines = String(text || '').replace(/\r/g, '').split('\n');
    const blocks = [];
    let current = [];
    const pushCurrent = () => {
      const block = current.join('\n');
      if (cleanMarkdownBody(block)) blocks.push(block);
    };

    lines.forEach((line) => {
      if (/^#(?!#)\s+/.test(line.trim())) {
        pushCurrent();
        current = [line];
        return;
      }

      current.push(line);
    });

    pushCurrent();
    return blocks.length ? blocks : [String(text || '')].filter((entry) => entry.trim());
  }

  function parseScenarioImportSections(blockText) {
    const lines = String(blockText || '').replace(/\r/g, '').split('\n');
    const sections = [];
    let title = '';
    let current = { heading: '', lines: [] };

    lines.forEach((line) => {
      const trimmed = line.trim();
      const titleMatch = trimmed.match(/^#(?!#)\s+(.+)$/);
      if (titleMatch) {
        title = cleanMarkdownLine(titleMatch[1]);
        return;
      }

      const sectionMatch = trimmed.match(/^##\s+(.+)$/);
      if (sectionMatch) {
        if (current.heading || current.lines.join('\n').trim()) sections.push(current);
        current = { heading: cleanMarkdownLine(sectionMatch[1]), lines: [] };
        return;
      }

      current.lines.push(line);
    });

    if (current.heading || current.lines.join('\n').trim()) sections.push(current);
    return { title, sections };
  }

  function parseScenarioImportList(text) {
    const lines = cleanMarkdownBody(text)
      .split('\n')
      .map((line) => cleanMarkdownLine(line))
      .filter(Boolean);

    if (lines.length === 1 && lines[0].includes(',')) {
      return lines[0].split(',').map((entry) => cleanMarkdownLine(entry)).filter(Boolean);
    }

    return lines;
  }

  function parseScenarioImportDraft(blockText) {
    const parsed = parseScenarioImportSections(blockText);
    const draft = {
      name: parsed.title || 'Cenario importado',
      type: 'entry',
      status: 'unvisited',
      mood: '',
      narrativePurpose: '',
      objective: '',
      summary: '',
      playerFacingDescription: '',
      notes: '',
      tags: [],
      connections: [],
      npcs: [],
      events: [],
      clues: []
    };

    parsed.sections.forEach((section) => {
      const heading = normalizeImportLookup(section.heading);
      const body = cleanMarkdownBody(section.lines.join('\n'));
      const parsedFields = parseMarkdownFields(body);

      if (heading.includes('resumo')) {
        const name = getImportedField(parsedFields.fields, 'nome');
        const statusRaw = getImportedField(parsedFields.fields, ['estado atual', 'status']);
        const status = mapImportedScenarioStatus(statusRaw);
        if (name) draft.name = name;
        draft.type = mapImportedScenarioType(getImportedField(parsedFields.fields, 'tipo') || draft.type);
        draft.status = status;
        draft.mood = getImportedField(parsedFields.fields, ['clima', 'clima atmosfera', 'atmosfera']) || draft.mood;
        draft.narrativePurpose = getImportedField(parsedFields.fields, ['funcao narrativa', 'função narrativa']) || draft.narrativePurpose;
        draft.objective = getImportedField(parsedFields.fields, ['objetivo do lugar', 'objetivo']) || draft.objective;
        draft.summary = getImportedField(parsedFields.fields, ['resumo', 'sumario', 'sumário']) || (status === 'unvisited' && statusRaw ? statusRaw : draft.summary);
        draft.tags = normalizeTagsInput(getImportedField(parsedFields.fields, 'tags'));
        return;
      }

      if (heading.includes('descricao') || heading.includes('descrição')) {
        draft.playerFacingDescription = body;
        return;
      }

      if (heading.startsWith('npc')) {
        const fields = parsedFields.fields;
        draft.npcs.push({
          name: getImportedField(fields, 'nome') || section.heading,
          role: getImportedField(fields, ['funcao', 'função', 'papel']),
          attitude: getImportedField(fields, 'atitude'),
          currentAction: getImportedField(fields, ['o que esta fazendo agora', 'o que está fazendo agora', 'acao atual', 'ação atual']),
          secret: getImportedField(fields, ['segredo ou detalhe', 'segredo', 'detalhe oculto']),
          status: mapImportedNpcStatus(getImportedField(fields, 'status')),
          notes: parsedFields.body
        });
        return;
      }

      if (heading.includes('acontecimento') || heading.includes('evento')) {
        const fields = parsedFields.fields;
        draft.events.push({
          title: getImportedField(fields, ['titulo', 'título']) || section.heading,
          trigger: getImportedField(fields, 'gatilho'),
          description: getImportedField(fields, ['descricao', 'descrição']) || parsedFields.body,
          consequence: getImportedField(fields, ['consequencia', 'consequência']),
          status: mapImportedEventStatus(getImportedField(fields, 'status'))
        });
        return;
      }

      if (heading.includes('pista') || heading.includes('informacao') || heading.includes('informação')) {
        const fields = parsedFields.fields;
        draft.clues.push({
          title: getImportedField(fields, ['titulo', 'título']) || section.heading,
          description: getImportedField(fields, ['descricao', 'descrição']) || parsedFields.body,
          discoveryMethod: getImportedField(fields, ['como pode ser descoberta', 'como descobrir', 'descoberta']),
          status: mapImportedClueStatus(getImportedField(fields, 'status'))
        });
        return;
      }

      if (heading.includes('nota')) {
        draft.notes = body;
        return;
      }

      if (heading.includes('conexao') || heading.includes('conexoes') || heading.includes('leva para')) {
        draft.connections = parseScenarioImportList(body);
      }
    });

    draft.name = draft.name || 'Cenario importado';
    return draft;
  }

  function findLinkedNpcByName(scenario, name) {
    const lookup = normalizeImportLookup(name);
    return (scenario.npcIds || [])
      .map((id) => getNpcById(id))
      .find((npc) => npc && normalizeImportLookup(npc.name) === lookup) || null;
  }

  function findLinkedEventByTitle(scenario, title) {
    const lookup = normalizeImportLookup(title);
    return (scenario.eventIds || [])
      .map((id) => getEventById(id))
      .find((entry) => entry && normalizeImportLookup(entry.title) === lookup) || null;
  }

  function findLinkedClueByTitle(scenario, title) {
    const lookup = normalizeImportLookup(title);
    return (scenario.clueIds || [])
      .map((id) => getClueById(id))
      .find((entry) => entry && normalizeImportLookup(entry.title) === lookup) || null;
  }

  function getOrCreateConnectedScenario(name) {
    const safeName = String(name || '').trim();
    if (!safeName) return null;
    const existing = getScenarioByImportedName(safeName);
    if (existing) return existing;

    const placeholder = createScenarioSeed(safeName);
    placeholder.type = 'support';
    placeholder.status = 'unvisited';
    placeholder.summary = 'Criado automaticamente como conexao importada.';
    placeholder.order = scenarioState.scenarios.length + 1;
    scenarioState.scenarios.push(placeholder);
    return placeholder;
  }

  function upsertScenarioImportDraft(draft) {
    const existing = getScenarioByImportedName(draft.name);
    const scenario = existing || createScenarioSeed(draft.name);
    const wasExisting = Boolean(existing);

    if (!wasExisting) {
      scenario.order = scenarioState.scenarios.length + 1;
      scenarioState.scenarios.push(scenario);
    }

    Object.assign(scenario, {
      name: draft.name,
      type: SCENARIO_TYPES.includes(draft.type) ? draft.type : 'entry',
      status: SCENARIO_STATUSES.includes(draft.status) ? draft.status : 'unvisited',
      mood: draft.mood || scenario.mood || '',
      narrativePurpose: draft.narrativePurpose || scenario.narrativePurpose || '',
      objective: draft.objective || scenario.objective || '',
      summary: draft.summary || scenario.summary || '',
      playerFacingDescription: draft.playerFacingDescription || scenario.playerFacingDescription || '',
      notes: draft.notes || scenario.notes || '',
      tags: Array.isArray(draft.tags) ? draft.tags : []
    });

    if (scenario.status === 'active') {
      scenarioState.scenarios.forEach((entry) => {
        entry.isCurrent = entry.id === scenario.id;
      });
      scenarioState.session.currentScenarioId = scenario.id;
    }

    scenario.npcIds = Array.isArray(scenario.npcIds) ? scenario.npcIds : [];
    scenario.eventIds = Array.isArray(scenario.eventIds) ? scenario.eventIds : [];
    scenario.clueIds = Array.isArray(scenario.clueIds) ? scenario.clueIds : [];
    scenario.connectedScenarioIds = Array.isArray(scenario.connectedScenarioIds) ? scenario.connectedScenarioIds : [];

    draft.npcs.forEach((entry) => {
      const npc = findLinkedNpcByName(scenario, entry.name) || createNpcSeed(entry.name);
      Object.assign(npc, {
        name: entry.name || npc.name,
        role: entry.role || '',
        attitude: entry.attitude || '',
        currentAction: entry.currentAction || '',
        secret: entry.secret || '',
        status: SCENARIO_NPC_STATUSES.includes(entry.status) ? entry.status : 'present',
        locationScenarioId: scenario.id,
        notes: entry.notes || ''
      });
      if (!scenarioState.npcs.some((item) => item.id === npc.id)) scenarioState.npcs.push(npc);
      if (!scenario.npcIds.includes(npc.id)) scenario.npcIds.push(npc.id);
    });

    draft.events.forEach((entry, index) => {
      const scenarioEvent = findLinkedEventByTitle(scenario, entry.title) || createEventSeed(entry.title);
      Object.assign(scenarioEvent, {
        title: entry.title || scenarioEvent.title,
        trigger: entry.trigger || '',
        description: entry.description || '',
        consequence: entry.consequence || '',
        status: SCENARIO_EVENT_STATUSES.includes(entry.status) ? entry.status : 'available',
        scenarioId: scenario.id,
        priority: Math.max(1, Number(scenarioEvent.priority || draft.events.length - index))
      });
      if (!scenarioState.events.some((item) => item.id === scenarioEvent.id)) scenarioState.events.push(scenarioEvent);
      if (!scenario.eventIds.includes(scenarioEvent.id)) scenario.eventIds.push(scenarioEvent.id);
    });

    draft.clues.forEach((entry) => {
      const clue = findLinkedClueByTitle(scenario, entry.title) || createClueSeed(entry.title);
      Object.assign(clue, {
        title: entry.title || clue.title,
        description: entry.description || '',
        discoveryMethod: entry.discoveryMethod || '',
        status: SCENARIO_CLUE_STATUSES.includes(entry.status) ? entry.status : 'hidden',
        scenarioId: scenario.id
      });
      if (!scenarioState.clues.some((item) => item.id === clue.id)) scenarioState.clues.push(clue);
      if (!scenario.clueIds.includes(clue.id)) scenario.clueIds.push(clue.id);
    });

    draft.connections.forEach((name) => {
      const connectedScenario = getOrCreateConnectedScenario(name);
      if (!connectedScenario || connectedScenario.id === scenario.id) return;
      if (!scenario.connectedScenarioIds.includes(connectedScenario.id)) {
        scenario.connectedScenarioIds.push(connectedScenario.id);
      }
    });

    return { scenario, wasExisting };
  }

  function importScenariosFromBulkInput() {
    ensureScenarioState();
    const text = refs.masterScenarioBulkInput?.value || '';
    if (!text.trim()) {
      if (refs.masterScenarioBulkResult) refs.masterScenarioBulkResult.textContent = 'Cole um texto de cenario primeiro.';
      return;
    }

    const drafts = splitScenarioImportBlocks(text)
      .map(parseScenarioImportDraft)
      .filter((draft) => draft && draft.name);

    if (!drafts.length) {
      if (refs.masterScenarioBulkResult) refs.masterScenarioBulkResult.textContent = 'Nao consegui identificar nenhum cenario nesse texto.';
      return;
    }

    let created = 0;
    let updated = 0;
    let totalNpcs = 0;
    let totalEvents = 0;
    let totalClues = 0;
    let lastScenario = null;

    drafts.forEach((draft) => {
      const result = upsertScenarioImportDraft(draft);
      lastScenario = result.scenario;
      if (result.wasExisting) updated += 1;
      else created += 1;
      totalNpcs += draft.npcs.length;
      totalEvents += draft.events.length;
      totalClues += draft.clues.length;
    });

    if (lastScenario) {
      activeScenarioId = lastScenario.id;
      scenarioState.session.currentScenarioId = lastScenario.id;
    }

    persistScenarioState(`${created} criado(s), ${updated} atualizado(s)`);
    renderScenarioPanel();

    if (refs.masterScenarioBulkResult) {
      refs.masterScenarioBulkResult.textContent = `Importado: ${drafts.length} cenario(s), ${totalNpcs} NPC(s), ${totalEvents} acontecimento(s), ${totalClues} pista(s).`;
    }
  }

  function updateScenarioField(field, value) {
    const scenario = getScenarioById(activeScenarioId);
    if (!scenario) return;

    if (field === 'tags') {
      scenario.tags = normalizeTagsInput(value);
      persistScenarioStateDebounced();
      renderScenarioList();
      return;
    }

    if (field === 'status') {
      scenario.status = SCENARIO_STATUSES.includes(value) ? value : scenario.status;
      if (value === 'active') {
        setActiveScenario(scenario.id, { markStatus: true });
        return;
      }
      persistScenarioStateDebounced();
      renderScenarioList();
      return;
    }

    if (field === 'type') {
      scenario.type = SCENARIO_TYPES.includes(value) ? value : scenario.type;
      persistScenarioStateDebounced();
      renderScenarioList();
      return;
    }

    if (field === 'isCurrent') {
      scenario.isCurrent = Boolean(value);
      if (scenario.isCurrent) {
        setActiveScenario(scenario.id, { markStatus: true });
        return;
      }
      persistScenarioStateDebounced();
      renderScenarioList();
      return;
    }

    if (field === 'playersHere') {
      scenario.playersHere = Boolean(value);
      persistScenarioStateDebounced();
      return;
    }

    scenario[field] = value;
    persistScenarioStateDebounced();
    if (field === 'name') {
      renderScenarioList();
    }
  }

  function setNpcLocation(npc, scenarioId) {
    scenarioState.scenarios.forEach((scenario) => {
      scenario.npcIds = (scenario.npcIds || []).filter((id) => id !== npc.id);
    });
    npc.locationScenarioId = scenarioId || '';
    if (scenarioId) {
      const scenario = getScenarioById(scenarioId);
      if (scenario && !scenario.npcIds.includes(npc.id)) {
        scenario.npcIds.push(npc.id);
      }
    }
  }

  function setEventLocation(event, scenarioId) {
    scenarioState.scenarios.forEach((scenario) => {
      scenario.eventIds = (scenario.eventIds || []).filter((id) => id !== event.id);
    });
    event.scenarioId = scenarioId || '';
    if (scenarioId) {
      const scenario = getScenarioById(scenarioId);
      if (scenario && !scenario.eventIds.includes(event.id)) {
        scenario.eventIds.push(event.id);
      }
    }
  }

  function setClueLocation(clue, scenarioId) {
    scenarioState.scenarios.forEach((scenario) => {
      scenario.clueIds = (scenario.clueIds || []).filter((id) => id !== clue.id);
    });
    clue.scenarioId = scenarioId || '';
    if (scenarioId) {
      const scenario = getScenarioById(scenarioId);
      if (scenario && !scenario.clueIds.includes(clue.id)) {
        scenario.clueIds.push(clue.id);
      }
    }
  }

  function deleteScenarioNpc(npcId) {
    scenarioState.npcs = scenarioState.npcs.filter((npc) => npc.id !== npcId);
    scenarioState.scenarios.forEach((scenario) => {
      scenario.npcIds = (scenario.npcIds || []).filter((id) => id !== npcId);
    });
  }

  function deleteScenarioEvent(eventId) {
    scenarioState.events = scenarioState.events.filter((event) => event.id !== eventId);
    scenarioState.scenarios.forEach((scenario) => {
      scenario.eventIds = (scenario.eventIds || []).filter((id) => id !== eventId);
    });
  }

  function deleteScenarioClue(clueId) {
    scenarioState.clues = scenarioState.clues.filter((clue) => clue.id !== clueId);
    scenarioState.scenarios.forEach((scenario) => {
      scenario.clueIds = (scenario.clueIds || []).filter((id) => id !== clueId);
    });
  }

  function buildCampaignExportFilename() {
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    return `omnivita-campanha-${stamp}.json`;
  }

  function getCombatSyncLabel() {
    return combatUtils?.syncLabel
      ? combatUtils.syncLabel(lastMasterCombatSyncAt)
      : (() => {
        if (!lastMasterCombatSyncAt) return 'Aguardando sync';
        const secondsAgo = Math.max(0, Math.round((Date.now() - lastMasterCombatSyncAt) / 1000));
        if (secondsAgo <= 1) return 'Atualizado agora';
        if (secondsAgo < 60) return `Atualizado ha ${secondsAgo}s`;
        const minutesAgo = Math.max(1, Math.round(secondsAgo / 60));
        return `Atualizado ha ${minutesAgo}min`;
      })();
  }

  function trackMasterCombatState(state) {
    const safeState = window.AppSystem.hydrateCombatSharedState(state);
    const currentTurnId = String(safeState.currentInstanceId || '');

    if (currentTurnId && lastMasterCurrentTurnInstanceId && currentTurnId !== lastMasterCurrentTurnInstanceId) {
      masterTurnFlashUntil = Date.now() + 1800;
    }

    lastMasterCurrentTurnInstanceId = currentTurnId;
    lastMasterCombatSyncAt = Date.now();
  }

  function exportAllCharactersToJson() {
    const characters = getCharacters();
    ensureScenarioState();
    const envelopes = characters.map((character) => (
      window.AppStorage.createCharacterTransferEnvelope
        ? window.AppStorage.createCharacterTransferEnvelope(character, { source: 'master-export-all' })
        : window.AppSystem.hydrateCharacter(character)
    ));

    const payload = {
      app: window.APP_CONFIG.appName || 'OmniVita',
      format: 'omnivita-campaign-export',
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      metadata: {
        source: 'master-export-all',
        exportedBy: session.username || session.email || 'mestre'
      },
      characters: envelopes,
      enemyLibrary: enemyLibrary,
      activeEncounter: activeEncounter,
      activeEncounterTurn: activeEncounterTurn,
      masterScenarios: normalizeScenarioState(clonePlain(scenarioState))
    };

    downloadTextFile(
      buildCampaignExportFilename(),
      JSON.stringify(payload, null, 2)
    );
    setStatus(`${characters.length} ficha(s) + cenarios exportados`);
  }

  function loadImageFromDataUrl(dataUrl) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Nao foi possivel processar uma das imagens salvas.'));
      image.src = dataUrl;
    });
  }

  function normalizeImageDimensions(width, height, maxDimension) {
    const safeWidth = Math.max(1, Number(width || 0));
    const safeHeight = Math.max(1, Number(height || 0));
    const ratio = Math.min(1, maxDimension / Math.max(safeWidth, safeHeight));
    return {
      width: Math.max(1, Math.round(safeWidth * ratio)),
      height: Math.max(1, Math.round(safeHeight * ratio))
    };
  }

  async function optimizeImageDataUrl(dataUrl) {
    const rawDataUrl = String(dataUrl || '');
    if (!rawDataUrl.startsWith('data:image/')) return rawDataUrl;
    if (rawDataUrl.length <= IMAGE_OPTIMIZATION.maxStoredLength) return rawDataUrl;

    const image = await loadImageFromDataUrl(rawDataUrl);
    let { width, height } = normalizeImageDimensions(image.naturalWidth, image.naturalHeight, IMAGE_OPTIMIZATION.maxDimension);
    let quality = IMAGE_OPTIMIZATION.preferredQuality;
    let bestAttempt = rawDataUrl;

    while (width >= 128 && height >= 128) {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d', { alpha: true });
      if (!context) break;

      context.clearRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);

      while (quality >= IMAGE_OPTIMIZATION.minimumQuality) {
        const attempt = canvas.toDataURL(IMAGE_OPTIMIZATION.outputType, quality);
        if (attempt.length < bestAttempt.length) bestAttempt = attempt;
        if (attempt.length <= IMAGE_OPTIMIZATION.maxStoredLength) {
          return attempt;
        }
        quality = Math.round((quality - 0.06) * 100) / 100;
      }

      width = Math.round(width * 0.82);
      height = Math.round(height * 0.82);
      quality = IMAGE_OPTIMIZATION.preferredQuality;
    }

    return bestAttempt;
  }

  async function optimizeCharacterImages(character) {
    const nextCharacter = window.AppSystem.hydrateCharacter(JSON.parse(JSON.stringify(character || {})));
    let changed = false;
    let optimizedImages = 0;
    let bytesSaved = 0;

    async function applyOptimizedImage(target, key) {
      const current = String(target?.[key] || '');
      if (!current.startsWith('data:image/')) return;
      const optimized = await optimizeImageDataUrl(current);
      if (optimized !== current) {
        target[key] = optimized;
        changed = true;
        optimizedImages += 1;
        bytesSaved += Math.max(0, current.length - optimized.length);
      }
    }

    if (nextCharacter.identity) {
      await applyOptimizedImage(nextCharacter.identity, 'image');
    }

    if (Array.isArray(nextCharacter.companions)) {
      for (const companion of nextCharacter.companions) {
        if (companion && typeof companion === 'object') {
          await applyOptimizedImage(companion, 'image');
        }
      }
    }

    return {
      character: nextCharacter,
      changed,
      optimizedImages,
      bytesSaved
    };
  }

  async function optimizeStoredCharacterImages() {
    const characterIds = getCharacters().map((character) => character.id).filter(Boolean);
    if (!characterIds.length) {
      setStatus('Nenhuma ficha carregada');
      return;
    }

    const confirmed = window.confirm('Otimizar as imagens salvas de todas as fichas? Isso pode demorar um pouco, mas deixa backup e banco bem mais leves.');
    if (!confirmed) return;

    if (refs.masterOptimizeImagesButton) refs.masterOptimizeImagesButton.disabled = true;

    let changedCharacters = 0;
    let optimizedImages = 0;
    let bytesSaved = 0;
    let failures = 0;

    try {
      for (let index = 0; index < characterIds.length; index += 1) {
        const characterId = characterIds[index];
        const currentCharacter = getCharacterById(characterId);
        if (!currentCharacter) continue;

        refs.masterStatus.textContent = `Otimizando ${index + 1}/${characterIds.length}: ${currentCharacter.identity?.name || 'Ficha'}`;

        try {
          const result = await optimizeCharacterImages(currentCharacter);
          if (!result.changed) continue;

          lastLocalEditAt = Date.now();
          await window.AppStorage.persistCharacter(result.character);
          changedCharacters += 1;
          optimizedImages += result.optimizedImages;
          bytesSaved += result.bytesSaved;
        } catch (error) {
          console.error(error);
          failures += 1;
        }

        await new Promise((resolve) => window.setTimeout(resolve, 0));
      }

      renderMasterNow();
      const savedMb = bytesSaved / (1024 * 1024);
      if (!changedCharacters) {
        setStatus(failures ? 'Nenhuma imagem otimizada; algumas fichas falharam' : 'Nenhuma imagem grande encontrada');
      } else if (failures) {
        setStatus(`${changedCharacters} ficha(s), ${optimizedImages} imagem(ns), ${savedMb.toFixed(1)} MB salvos; ${failures} falha(s)`);
      } else {
        setStatus(`${changedCharacters} ficha(s), ${optimizedImages} imagem(ns), ${savedMb.toFixed(1)} MB salvos`);
      }
    } finally {
      if (refs.masterOptimizeImagesButton) refs.masterOptimizeImagesButton.disabled = false;
    }
  }

  async function importCampaignFromFile(file) {
    if (!file) return;

    const rawText = await file.text();
    let parsed = null;

    try {
      parsed = JSON.parse(rawText);
    } catch (error) {
      throw new Error('Arquivo JSON invalido.');
    }

    const importedCharacters = Array.isArray(parsed?.characters) ? parsed.characters : [];
    if (!importedCharacters.length) {
      throw new Error('O backup nao contem fichas para importar.');
    }

    const shouldRestoreLocalState = window.confirm(
      `Importar ${importedCharacters.length} ficha(s) deste backup? Isso atualiza as fichas do arquivo e restaura tambem biblioteca de inimigos, encontro local e cenarios, se eles estiverem no backup.`
    );
    if (!shouldRestoreLocalState) return;

    if (refs.masterImportAllButton) refs.masterImportAllButton.disabled = true;

    let importedCount = 0;
    let failedCount = 0;

    try {
      for (let index = 0; index < importedCharacters.length; index += 1) {
        const envelope = importedCharacters[index];
        const importedRaw = window.AppStorage.extractCharacterFromTransferPayload
          ? window.AppStorage.extractCharacterFromTransferPayload(envelope)
          : (envelope?.character || envelope);

        if (!importedRaw || typeof importedRaw !== 'object') {
          failedCount += 1;
          continue;
        }

        const hydrated = window.AppSystem.hydrateCharacter(importedRaw);
        refs.masterStatus.textContent = `Importando ${index + 1}/${importedCharacters.length}: ${hydrated.identity?.name || 'Ficha'}`;

        try {
          lastLocalEditAt = Date.now();
          await window.AppStorage.persistCharacter(hydrated);
          importedCount += 1;
        } catch (error) {
          console.error(error);
          failedCount += 1;
        }

        await new Promise((resolve) => window.setTimeout(resolve, 0));
      }

      if (Array.isArray(parsed.enemyLibrary)) {
        enemyLibrary = parsed.enemyLibrary
          .map((entry) => hydrateEnemyRecord(entry))
          .sort((left, right) => String(right.updatedAt || '').localeCompare(String(left.updatedAt || '')));
        persistEnemyLibrary();
      }

      const masterDataScenarioEntry = Array.isArray(parsed.masterData)
        ? parsed.masterData.find((item) => String(item?.key || '') === MASTER_SCENARIO_REMOTE_KEY)
        : null;
      const importedScenarioState = hasScenarioPayload(parsed.masterScenarios)
        ? parsed.masterScenarios
        : hasScenarioPayload(parsed.scenarios)
        ? parsed.scenarios
        : hasScenarioPayload(masterDataScenarioEntry?.data)
        ? masterDataScenarioEntry.data
        : null;

      if (importedScenarioState) {
        scenarioState = normalizeScenarioState(importedScenarioState);
        scenarioRemoteReady = true;
        persistScenarioState('Cenarios importados');
        renderScenarioPanel();
      }

      if (Array.isArray(parsed.activeEncounter)) {
        activeEncounter = parsed.activeEncounter.map((entry) => hydrateActiveEncounterEntry(entry));
        persistActiveEncounter();
      }

      if (parsed.activeEncounterTurn) {
        activeEncounterTurn = hydrateActiveEncounterTurnState(parsed.activeEncounterTurn);
      } else if (!activeEncounter.length) {
        activeEncounterTurn = { currentInstanceId: '', round: 1 };
      } else {
        activeEncounterTurn = hydrateActiveEncounterTurnState();
      }

      if (activeEncounter.length) {
        const hasCurrentTurn = activeEncounter.some((entry) => entry.instanceId === activeEncounterTurn.currentInstanceId);
        if (!hasCurrentTurn) {
          sortActiveEncounterByInitiative();
          const firstEntry = getLivingActiveEncounterEntries()[0] || activeEncounter[0] || null;
          activeEncounterTurn = {
            currentInstanceId: firstEntry ? firstEntry.instanceId : '',
            round: Math.max(1, Number(activeEncounterTurn.round || 1))
          };
        }
      }

      persistActiveEncounterTurn();
      syncCombatSharedState(true);
      renderMasterNow();

      if (failedCount) {
        setStatus(`${importedCount} ficha(s) importadas; ${failedCount} falha(s)`);
      } else {
        setStatus(`${importedCount} ficha(s) importadas`);
      }
    } finally {
      if (refs.masterImportAllButton) refs.masterImportAllButton.disabled = false;
    }
  }

  function debounce(callback, delay) {
    let timer = null;
    return function () {
      clearTimeout(timer);
      timer = setTimeout(callback, delay);
    };
  }

  function loadEncounterState() {
    try {
      const parsed = JSON.parse(sessionStorage.getItem(MASTER_ENCOUNTER_STORAGE_KEY) || '{}');
      return {
        type: parsed.type || 'skirmish',
        pressure: parsed.pressure || 'balanced',
        selectedIds: Array.isArray(parsed.selectedIds) ? parsed.selectedIds.filter(Boolean) : []
      };
    } catch (error) {
      return {
        type: 'skirmish',
        pressure: 'balanced',
        selectedIds: []
      };
    }
  }

  function saveEncounterState() {
    try {
      sessionStorage.setItem(MASTER_ENCOUNTER_STORAGE_KEY, JSON.stringify({
        type: encounterState.type,
        pressure: encounterState.pressure,
        selectedIds: encounterState.selectedIds
      }));
    } catch (error) {
      console.error(error);
    }
  }

  const encounterState = loadEncounterState();
  let enemyLibrary = [];
  let activeEncounter = [];
  let activeEncounterTurn = { currentInstanceId: '', round: 1 };
  let lastCombatBroadcastSignature = '';
  let lastCombatSharedState = window.AppSystem.hydrateCombatSharedState(null);
  let applyingCombatControlRequests = false;
  let lastMasterCombatSyncAt = 0;
  let lastMasterCurrentTurnInstanceId = '';
  let masterTurnFlashUntil = 0;

  function getCharacters() {
    return window.AppStorage.getCharacters();
  }

  function getSelectedCharacter() {
    return window.AppStorage.getCharacterById(refs.masterCharacterSelect.value);
  }

  function getCharacterById(characterId) {
    return window.AppStorage.getCharacterById(characterId);
  }

  function getSessionTags(character) {
    return Array.isArray(character?.masterSession?.tags)
      ? character.masterSession.tags
      : [];
  }

  function getSessionTagLabel(tag) {
    const match = SESSION_TAG_OPTIONS.find((entry) => entry.value === tag);
    return match ? match.label : String(tag || '');
  }

  function getCompanions(character) {
    return Array.isArray(character?.companions) ? character.companions : [];
  }

  function normalizeLooseText(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ');
  }

  function clampRange(value, min, max) {
    return Math.min(max, Math.max(min, Number(value || 0)));
  }

  function roundToStep(value, step = 1) {
    if (!step) return Math.round(Number(value || 0));
    return Math.round(Number(value || 0) / step) * step;
  }

  function averageFrom(list, getter) {
    if (!list.length) return 0;
    const total = list.reduce((sum, entry) => sum + Number(getter(entry) || 0), 0);
    return total / list.length;
  }

  function createEnemyId() {
    return `enemy-${Math.random().toString(36).slice(2, 10)}`;
  }

  function hydrateEnemyRecord(entry = {}) {
    const countMax = Math.max(1, clampRange(entry.countMax ?? entry.count ?? 1, 1, 99));
    const countCurrent = clampRange(entry.countCurrent ?? countMax, 0, countMax);
    const pvMax = Math.max(0, clampRange(entry.pvMax ?? 0, 0, 9999));
    const pvCurrent = clampRange(entry.pvCurrent ?? pvMax, 0, pvMax || 9999);
    const updatedAt = entry.updatedAt || new Date().toISOString();
    const attributes = {
      forca: Math.max(0, clampRange(entry.attributes?.forca ?? 0, 0, 99)),
      destreza: Math.max(0, clampRange(entry.attributes?.destreza ?? 0, 0, 99)),
      sentidos: Math.max(0, clampRange(entry.attributes?.sentidos ?? 0, 0, 99)),
      vigor: Math.max(0, clampRange(entry.attributes?.vigor ?? 0, 0, 99)),
      inteligencia: Math.max(0, clampRange(entry.attributes?.inteligencia ?? 0, 0, 99)),
      nexo: Math.max(0, clampRange(entry.attributes?.nexo ?? 0, 0, 99))
    };

    return {
      id: entry.id || createEnemyId(),
      name: String(entry.name || 'Novo inimigo'),
      role: String(entry.role || 'Capanga'),
      status: normalizeCombatStatus(entry.status, 'Vivo'),
      countCurrent,
      countMax,
      pvCurrent,
      pvMax,
      armor: Math.max(0, clampRange(entry.armor ?? 0, 0, 99)),
      dodge: Math.max(0, clampRange(entry.dodge ?? 0, 0, 99)),
      block: Math.max(0, clampRange(entry.block ?? 10, 0, 999)),
      initiative: Math.max(0, clampRange(entry.initiative ?? 0, 0, 99)),
      attack: Math.max(0, clampRange(entry.attack ?? 0, 0, 99)),
      pe: Math.max(0, clampRange(entry.pe ?? 0, 0, 999)),
      pd: Math.max(0, clampRange(entry.pd ?? 0, 0, 999)),
      damageLabel: String(entry.damageLabel || 'Impulso'),
      damageExpression: String(entry.damageExpression || '1d6 + Nexo/2'),
      damageAverage: Math.max(0, clampRange(entry.damageAverage ?? 4, 0, 999)),
      basicDamageLabel: String(entry.basicDamageLabel || 'Desarmado'),
      basicDamageExpression: String(entry.basicDamageExpression || '1d6 + Forca/2'),
      basicDamageAverage: Math.max(0, clampRange(entry.basicDamageAverage ?? 4, 0, 999)),
      attributes,
      source: String(entry.source || 'Manual'),
      notes: String(entry.notes || ''),
      createdAt: entry.createdAt || updatedAt,
      updatedAt
    };
  }

  function createEnemyRecord(overrides = {}) {
    return hydrateEnemyRecord({
      id: createEnemyId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides
    });
  }

  function createEncounterInstanceId() {
    return `enc-${Math.random().toString(36).slice(2, 10)}`;
  }

  function hydrateEncounterAttributes(attributes = {}) {
    return {
      forca: Math.max(0, clampRange(attributes.forca ?? 0, 0, 99)),
      destreza: Math.max(0, clampRange(attributes.destreza ?? 0, 0, 99)),
      sentidos: Math.max(0, clampRange(attributes.sentidos ?? 0, 0, 99)),
      vigor: Math.max(0, clampRange(attributes.vigor ?? 0, 0, 99)),
      inteligencia: Math.max(0, clampRange(attributes.inteligencia ?? 0, 0, 99)),
      nexo: Math.max(0, clampRange(attributes.nexo ?? 0, 0, 99))
    };
  }

  function detectActiveEncounterType(entry = {}) {
    if (entry.combatantType === 'character' || entry.sourceCharacterId) return entry.sourceCompanionId ? 'companion' : 'character';
    if (entry.combatantType === 'companion') return 'companion';
    return 'enemy';
  }

  function hydrateActiveEncounterEntry(entry = {}) {
    const combatantType = detectActiveEncounterType(entry);
    const updatedAt = entry.updatedAt || new Date().toISOString();
    const initiativeBonus = clampRange(entry.initiativeBonus ?? entry.initiative ?? 0, -99, 999);
    const initiativeRoll = clampRange(entry.initiativeRoll ?? 0, 0, 20);
    const initiativeDice = Array.isArray(entry.initiativeDice)
      ? entry.initiativeDice.slice(0, 2).map((value) => clampRange(value, 1, 10))
      : [];
    const initiativeTotal = clampRange(
      entry.initiativeTotal ?? (initiativeRoll + initiativeBonus),
      -99,
      999
    );

    if (combatantType === 'enemy') {
      const baseEnemy = hydrateEnemyRecord(entry);
      return {
        ...baseEnemy,
        combatantType,
        isForm: false,
        instanceId: entry.instanceId || createEncounterInstanceId(),
        sourceId: String(entry.sourceId || entry.sourceEnemyId || baseEnemy.id || ''),
        sourceEnemyId: String(entry.sourceEnemyId || baseEnemy.id || ''),
        sourceCharacterId: '',
        sourceCompanionId: '',
        sourceName: String(entry.sourceName || entry.name || 'Inimigo'),
        ownerName: '',
        image: String(entry.image || ''),
        className: '',
        level: 0,
        manifestation: 0,
        initiative: initiativeBonus,
        initiativeBonus,
        initiativeRoll,
        initiativeTotal,
        initiativeDice,
        addedAt: entry.addedAt || new Date().toISOString(),
        updatedAt
      };
    }

    const pvMax = Math.max(0, clampRange(entry.pvMax ?? 0, 0, 9999));
    const pvCurrent = clampRange(entry.pvCurrent ?? pvMax, 0, pvMax || 9999);

    const isForm = Boolean(entry.isForm);

    return {
      combatantType,
      isForm,
      instanceId: entry.instanceId || createEncounterInstanceId(),
      sourceId: String(entry.sourceId || ''),
      sourceEnemyId: '',
      sourceCharacterId: String(entry.sourceCharacterId || ''),
      sourceCompanionId: combatantType === 'companion' ? String(entry.sourceCompanionId || '') : '',
      sourceName: String(entry.sourceName || entry.name || (combatantType === 'character' ? 'Personagem' : 'Mini-ficha')),
      ownerName: String(entry.ownerName || ''),
      image: String(entry.image || ''),
      name: String(entry.name || (combatantType === 'character' ? 'Personagem' : 'Mini-ficha')),
      role: String(entry.role || (combatantType === 'character' ? 'Personagem' : 'Mini-ficha')),
      className: String(entry.className || ''),
      level: Math.max(0, clampRange(entry.level ?? 0, 0, 99)),
      status: normalizeCombatStatus(entry.status, 'Vivo'),
      countCurrent: 1,
      countMax: 1,
      pvCurrent,
      pvMax,
      armor: Math.max(0, clampRange(entry.armor ?? 0, 0, 99)),
      dodge: Math.max(0, clampRange(entry.dodge ?? 0, 0, 99)),
      block: Math.max(0, clampRange(entry.block ?? 0, 0, 999)),
      initiative: initiativeBonus,
      initiativeBonus,
      initiativeRoll,
      initiativeTotal,
      initiativeDice,
      attack: Math.max(0, clampRange(entry.attack ?? 0, 0, 99)),
      manifestation: Math.max(0, clampRange(entry.manifestation ?? 0, 0, 99)),
      pe: Math.max(0, clampRange(entry.pe ?? 0, 0, 999)),
      pd: Math.max(0, clampRange(entry.pd ?? 0, 0, 999)),
      damageLabel: isForm ? '' : String(entry.damageLabel || ''),
      damageExpression: isForm ? '' : String(entry.damageExpression || ''),
      damageAverage: isForm ? 0 : Math.max(0, clampRange(entry.damageAverage ?? 0, 0, 999)),
      basicDamageLabel: isForm ? '' : String(entry.basicDamageLabel || ''),
      basicDamageExpression: isForm ? '' : String(entry.basicDamageExpression || ''),
      basicDamageAverage: isForm ? 0 : Math.max(0, clampRange(entry.basicDamageAverage ?? 0, 0, 999)),
      attributes: hydrateEncounterAttributes(entry.attributes),
      notes: String(entry.notes || ''),
      addedAt: entry.addedAt || new Date().toISOString(),
      updatedAt
    };
  }

  function createEnemyEncounterEntry(enemy, overrides = {}) {
    const safeEnemy = hydrateEnemyRecord(enemy || {});
    return hydrateActiveEncounterEntry({
      ...safeEnemy,
      combatantType: 'enemy',
      id: safeEnemy.id,
      sourceId: safeEnemy.id,
      sourceEnemyId: safeEnemy.id,
      sourceName: safeEnemy.name,
      status: normalizeCombatStatus(safeEnemy.status, 'Vivo'),
      initiativeBonus: Number(safeEnemy.initiative || 0),
      initiativeRoll: 0,
      initiativeTotal: 0,
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides
    });
  }

  function getCompanionNamedSkillTotal(entry, skillNames = []) {
    const wanted = new Set(skillNames.map((value) => normalizeLooseText(value)).filter(Boolean));
    return (Array.isArray(entry?.skills) ? entry.skills : []).reduce((best, skill) => {
      if (!wanted.has(normalizeLooseText(skill?.name))) return best;
      return Math.max(best, Number(window.AppSystem.getCompanionSkillTotal(entry, skill) || 0));
    }, 0);
  }

  function getHighestCompanionSkillTotal(entry) {
    return (Array.isArray(entry?.skills) ? entry.skills : []).reduce((best, skill) => {
      if (!skill || !String(skill.name || '').trim()) return best;
      return Math.max(best, Number(window.AppSystem.getCompanionSkillTotal(entry, skill) || 0));
    }, 0);
  }

  function buildCharacterEncounterEntry(character, overrides = {}) {
    const safeCharacter = window.AppSystem.hydrateCharacter(character || {});
    const derived = window.AppSystem.calculateDerived(safeCharacter);
    const name = safeCharacter.identity?.name || 'Personagem';
    return hydrateActiveEncounterEntry({
      combatantType: 'character',
      sourceId: safeCharacter.id,
      sourceCharacterId: safeCharacter.id,
      sourceName: name,
      image: safeCharacter.identity?.image || '',
      name,
      role: safeCharacter.identity?.className || 'Personagem',
      className: safeCharacter.identity?.className || '',
      level: Number(safeCharacter.identity?.level || 1),
      status: normalizeCombatStatus(safeCharacter.resources?.status, 'Vivo'),
      pvCurrent: Number(safeCharacter.resources?.pvCurrent || 0),
      pvMax: Number(derived.maxPv || 0),
      armor: Number(derived.armor || 0),
      dodge: Number(derived.esquivaMod || 0),
      block: Number(derived.selectedBlock || 0),
      manifestation: Number(derived.manifestationMod || 0),
      pe: Number(safeCharacter.resources?.peCurrent || 0),
      pd: Number(safeCharacter.resources?.pdCurrent || 0),
      initiativeBonus: Number(derived.initiativeMod || 0),
      initiativeRoll: 0,
      initiativeTotal: 0,
      attributes: safeCharacter.attributes || {},
      notes: safeCharacter.masterNotes || '',
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides
    });
  }

  function buildCompanionEncounterEntry(character, companion, overrides = {}) {
    const safeCharacter = window.AppSystem.hydrateCharacter(character || {});
    const safeCompanion = window.AppSystem.normalizeCompanion(companion || {});
    const derived = window.AppSystem.calculateDerived(safeCharacter);
    const ownerName = safeCharacter.identity?.name || 'Personagem';
    const name = safeCompanion.name || 'Mini-ficha';
    const isForm = window.AppSystem.isCompanionForm(safeCompanion);
    const forca = Number(safeCompanion.attributes?.forca || 0);
    const destreza = Number(safeCompanion.attributes?.destreza || 0);
    const vigor = Number(safeCompanion.attributes?.vigor || 0);
    const nexo = Number(safeCompanion.attributes?.nexo || 0);
    const reflexos = getCompanionNamedSkillTotal(safeCompanion, ['reflexos']);
    const iniciativa = getCompanionNamedSkillTotal(safeCompanion, ['iniciativa']);
    const fortitude = getCompanionNamedSkillTotal(safeCompanion, ['fortitude']);
    const bestSkill = getHighestCompanionSkillTotal(safeCompanion);
    const initiativeBonus = isForm
      ? Number(derived.initiativeMod || 0)
      : Math.max(
        iniciativa,
        reflexos,
        Number(window.AppSystem.floorHalf(destreza) || 0)
      );
    const dodge = Math.max(reflexos, Number(window.AppSystem.floorHalf(destreza) || 0));
    const block = 10 + Math.max(fortitude, Number(window.AppSystem.floorHalf(Math.max(forca, vigor)) || 0));
    const attack = Math.max(bestSkill, Number(window.AppSystem.floorHalf(Math.max(forca, destreza, nexo)) || 0));
    const basicDamage = getDefaultBasicDamageFromAttributes(safeCompanion.attributes, safeCompanion.type || 'Mini-ficha');
    const usesNexo = nexo > forca && nexo > 0;
    const initiativeTotal = isForm
      ? getSharedInitiativeTotalForCharacter(safeCharacter.id, initiativeBonus)
      : 0;

    return hydrateActiveEncounterEntry({
      combatantType: 'companion',
      sourceId: `${safeCharacter.id}:${safeCompanion.id}`,
      sourceCharacterId: safeCharacter.id,
      sourceCompanionId: safeCompanion.id,
      sourceName: ownerName,
      ownerName,
      image: safeCompanion.image || '',
      name,
      role: safeCompanion.type || 'Mini-ficha',
      isForm,
      className: '',
      level: Number(safeCharacter.identity?.level || 1),
      status: normalizeCombatStatus(safeCompanion.status, 'Vivo'),
      pvCurrent: Number(safeCompanion.pvCurrent || 0),
      pvMax: Number(safeCompanion.pvMax || 0),
      armor: Number(safeCompanion.armor || 0),
      dodge,
      block,
      attack,
      manifestation: 0,
      pe: 0,
      pd: 0,
      initiativeBonus,
      initiativeRoll: 0,
      initiativeTotal,
      damageLabel: isForm ? '' : (usesNexo ? 'Manifestacao' : basicDamage.label),
      damageExpression: isForm ? '' : (usesNexo ? '1d6 + Nexo/2' : basicDamage.expression),
      damageAverage: isForm ? 0 : (usesNexo ? roundToStep(3.5 + (nexo / 2), 1) : basicDamage.average),
      basicDamageLabel: isForm ? '' : basicDamage.label,
      basicDamageExpression: isForm ? '' : basicDamage.expression,
      basicDamageAverage: isForm ? 0 : basicDamage.average,
      attributes: safeCompanion.attributes || {},
      notes: safeCompanion.notes || '',
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides
    });
  }

  function loadActiveEncounter() {
    try {
      const parsed = JSON.parse(localStorage.getItem(MASTER_ACTIVE_ENCOUNTER_KEY) || '[]');
      return Array.isArray(parsed) ? parsed.map((entry) => hydrateActiveEncounterEntry(entry)) : [];
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  function hydrateActiveEncounterTurnState(state = {}) {
    return {
      currentInstanceId: String(state.currentInstanceId || ''),
      round: Math.max(1, clampRange(state.round ?? 1, 1, 999))
    };
  }

  function loadActiveEncounterTurn() {
    try {
      return hydrateActiveEncounterTurnState(JSON.parse(localStorage.getItem(MASTER_ACTIVE_TURN_STORAGE_KEY) || '{}'));
    } catch (error) {
      console.error(error);
      return hydrateActiveEncounterTurnState();
    }
  }

  function persistActiveEncounter() {
    try {
      localStorage.setItem(MASTER_ACTIVE_ENCOUNTER_KEY, JSON.stringify(activeEncounter));
    } catch (error) {
      console.error(error);
    }
  }

  function persistActiveEncounterTurn() {
    try {
      localStorage.setItem(MASTER_ACTIVE_TURN_STORAGE_KEY, JSON.stringify(activeEncounterTurn));
    } catch (error) {
      console.error(error);
    }
  }

  function getActiveEncounterEntry(instanceId) {
    return activeEncounter.find((entry) => entry.instanceId === instanceId) || null;
  }

  function getLivingActiveEncounterEntries() {
    return activeEncounter.filter((entry) => {
      return combatUtils?.isLiving
        ? combatUtils.isLiving(entry)
        : (() => {
          const status = normalizeCombatStatus(entry.status, 'Vivo');
          return Number(entry.pvCurrent || 0) > 0 && status !== 'Morto' && normalizeLooseText(entry.status) !== 'derrotado';
        })();
    });
  }

  function getActiveEncounterSourceKey(entry) {
    const safeEntry = hydrateActiveEncounterEntry(entry || {});
    return combatUtils?.sourceKey
      ? combatUtils.sourceKey(safeEntry)
      : (() => {
        if (safeEntry.combatantType === 'character') return `character:${safeEntry.sourceCharacterId}`;
        if (safeEntry.combatantType === 'companion') return `companion:${safeEntry.sourceCharacterId}:${safeEntry.sourceCompanionId}`;
        return '';
      })();
  }

  function getCharacterCompanionById(characterId, companionId) {
    const character = getCharacterById(characterId);
    return getCompanions(character).find((entry) => entry.id === companionId) || null;
  }

  function isFormCompanionById(characterId, companionId) {
    const companion = getCharacterCompanionById(characterId, companionId);
    return window.AppSystem.isCompanionForm(companion);
  }

  function getCharacterEncounterIndex(characterId) {
    return findActiveEncounterIndexBySourceKey(`character:${characterId}`);
  }

  function getCharacterFormEncounterEntries(characterId) {
    return activeEncounter.filter((entry) => {
      const safeEntry = hydrateActiveEncounterEntry(entry);
      return safeEntry.combatantType === 'companion'
        && safeEntry.sourceCharacterId === characterId
        && Boolean(safeEntry.isForm || isFormCompanionById(characterId, safeEntry.sourceCompanionId));
    });
  }

  function syncEncounterEntryToSourceSheet(entry) {
    const safeEntry = hydrateActiveEncounterEntry(entry || {});
    if (!safeEntry.sourceCharacterId || !window.AppStorage?.replaceCharacter) return false;

    const character = getCharacterById(safeEntry.sourceCharacterId);
    if (!character) return false;

    let changed = false;
    const status = normalizeStatusForPv(safeEntry.status, safeEntry.pvCurrent);

    if (safeEntry.combatantType === 'character') {
      const derived = window.AppSystem.calculateDerived(character);
      const nextPv = clampRange(Number(safeEntry.pvCurrent || 0), 0, Number(derived.maxPv || safeEntry.pvMax || 0));
      if (Number(character.resources?.pvCurrent || 0) !== nextPv) {
        character.resources.pvCurrent = nextPv;
        changed = true;
      }
      if (normalizeCombatStatus(character.resources?.status, 'Vivo') !== status) {
        character.resources.status = status;
        changed = true;
      }
    } else if (safeEntry.combatantType === 'companion' && safeEntry.sourceCompanionId) {
      const companion = getCharacterCompanionById(safeEntry.sourceCharacterId, safeEntry.sourceCompanionId);
      if (!companion) return false;

      const nextPv = clampRange(Number(safeEntry.pvCurrent || 0), 0, Number(companion.pvMax || safeEntry.pvMax || 0));
      if (Number(companion.pvCurrent || 0) !== nextPv) {
        companion.pvCurrent = nextPv;
        changed = true;
      }
      if (normalizeCombatStatus(companion.status, 'Vivo') !== status) {
        companion.status = status;
        changed = true;
      }

      if (safeEntry.isForm || isFormCompanionById(safeEntry.sourceCharacterId, safeEntry.sourceCompanionId)) {
        if (normalizeCombatStatus(character.resources?.status, 'Vivo') !== status) {
          character.resources.status = status;
          changed = true;
        }
      }
    }

    if (!changed) return false;

    lastLocalEditAt = Date.now();
    window.AppStorage.replaceCharacter(character.id, character);
    return true;
  }

  function syncActiveEncounterFromSourceSheets() {
    let changed = false;

    activeEncounter = activeEncounter.map((entry) => {
      const safeEntry = hydrateActiveEncounterEntry(entry);
      if (!safeEntry.sourceCharacterId) return safeEntry;
      const character = getCharacterById(safeEntry.sourceCharacterId);
      if (!character) return safeEntry;

      if (safeEntry.combatantType === 'character') {
        const nextPv = Number(character.resources?.pvCurrent || 0);
        const nextStatus = normalizeCombatStatus(character.resources?.status, 'Vivo');
        if (Number(safeEntry.pvCurrent || 0) === nextPv && normalizeCombatStatus(safeEntry.status, 'Vivo') === nextStatus) {
          return safeEntry;
        }
        changed = true;
        return hydrateActiveEncounterEntry({
          ...safeEntry,
          pvCurrent: nextPv,
          status: normalizeStatusForPv(nextStatus, nextPv),
          updatedAt: new Date().toISOString()
        });
      }

      if (safeEntry.combatantType === 'companion' && safeEntry.sourceCompanionId) {
        const companion = getCharacterCompanionById(safeEntry.sourceCharacterId, safeEntry.sourceCompanionId);
        if (!companion) return safeEntry;
        const isForm = safeEntry.isForm || isFormCompanionById(safeEntry.sourceCharacterId, safeEntry.sourceCompanionId);
        const nextPv = Number(companion.pvCurrent || 0);
        const nextStatus = isForm
          ? normalizeCombatStatus(character.resources?.status, 'Vivo')
          : normalizeCombatStatus(companion.status, 'Vivo');
        if (Number(safeEntry.pvCurrent || 0) === nextPv && normalizeCombatStatus(safeEntry.status, 'Vivo') === nextStatus) {
          return safeEntry;
        }
        changed = true;
        return hydrateActiveEncounterEntry({
          ...safeEntry,
          pvCurrent: nextPv,
          status: normalizeStatusForPv(nextStatus, nextPv),
          updatedAt: new Date().toISOString()
        });
      }

      return safeEntry;
    });

    if (!changed) return false;
    persistActiveEncounter();
    syncActiveEncounterTurn();
    syncCombatSharedState(true);
    return true;
  }

  function getSharedInitiativeTotalForCharacter(characterId, fallback = 0) {
    const characterEntry = activeEncounter.find((entry) => {
      const safeEntry = hydrateActiveEncounterEntry(entry);
      return safeEntry.combatantType === 'character' && safeEntry.sourceCharacterId === characterId;
    });
    if (characterEntry) return Number(characterEntry.initiativeTotal || 0);

    const formEntry = getCharacterFormEncounterEntries(characterId)[0];
    if (formEntry) return Number(formEntry.initiativeTotal || 0);

    return Number(fallback || 0);
  }

  function synchronizeSharedFormInitiative(characterId, total) {
    let changed = false;
    const nextTotal = clampRange(total, -99, 999);

    activeEncounter = activeEncounter.map((entry) => {
      const safeEntry = hydrateActiveEncounterEntry(entry);
      const isSharedActor = (
        (safeEntry.combatantType === 'character' && safeEntry.sourceCharacterId === characterId)
        || (safeEntry.combatantType === 'companion'
          && safeEntry.sourceCharacterId === characterId
          && Boolean(safeEntry.isForm || isFormCompanionById(characterId, safeEntry.sourceCompanionId)))
      );

      if (!isSharedActor) return safeEntry;
      if (Number(safeEntry.initiativeTotal || 0) === nextTotal) return safeEntry;

      changed = true;
      return hydrateActiveEncounterEntry({
        ...safeEntry,
        initiativeDice: [],
        initiativeRoll: 0,
        initiativeTotal: nextTotal,
        updatedAt: new Date().toISOString()
      });
    });

    return changed;
  }

  function hasActiveEncounterSourceKey(sourceKey) {
    return Boolean(sourceKey && activeEncounter.some((entry) => getActiveEncounterSourceKey(entry) === sourceKey));
  }

  function hasCharacterSharedActorInEncounter(characterId) {
    return activeEncounter.some((entry) => {
      const safeEntry = hydrateActiveEncounterEntry(entry);
      if (String(safeEntry.sourceCharacterId || '') !== String(characterId || '')) return false;
      if (safeEntry.combatantType === 'character') return true;
      if (
        safeEntry.combatantType === 'companion'
        && Boolean(safeEntry.isForm || isFormCompanionById(characterId, safeEntry.sourceCompanionId))
      ) {
        return true;
      }
      return false;
    });
  }

  function findActiveEncounterIndexBySourceKey(sourceKey) {
    return activeEncounter.findIndex((entry) => getActiveEncounterSourceKey(entry) === sourceKey);
  }

  function applyEncounterControlOverrides(entry, control) {
    if (!control) return hydrateActiveEncounterEntry(entry);

    const nextDraft = { ...hydrateActiveEncounterEntry(entry) };

    if (control.initiativeTotal !== null && control.initiativeTotal !== undefined) {
      nextDraft.initiativeDice = [];
      nextDraft.initiativeRoll = 0;
      nextDraft.initiativeTotal = clampRange(control.initiativeTotal, -99, 999);
    }

    if (String(control.status || '').trim()) {
      nextDraft.status = normalizeCombatStatus(control.status, 'Vivo');
    }

    nextDraft.updatedAt = new Date().toISOString();
    return hydrateActiveEncounterEntry(nextDraft);
  }

  function ensureCharacterEncounterEntry(characterId, control) {
    const character = getCharacterById(characterId);
    if (!character) return false;

    const sourceKey = `character:${characterId}`;
    const currentIndex = findActiveEncounterIndexBySourceKey(sourceKey);
    const shouldBePresent = control && control.inEncounter === false
      ? false
      : currentIndex >= 0;

    if (!shouldBePresent) {
      if (currentIndex < 0) return false;
      activeEncounter.splice(currentIndex, 1);
      return true;
    }

    if (currentIndex >= 0) {
      const currentEntry = hydrateActiveEncounterEntry(activeEncounter[currentIndex]);
      const nextEntry = applyEncounterControlOverrides(currentEntry, control);
      const changed = JSON.stringify(nextEntry) !== JSON.stringify(currentEntry);
      activeEncounter[currentIndex] = nextEntry;
      return changed;
    }

    const draft = applyEncounterControlOverrides(buildCharacterEncounterEntry(character), control);
    activeEncounter.unshift(draft);
    return true;
  }

  function ensureCompanionEncounterEntry(characterId, companionId, control) {
    const character = getCharacterById(characterId);
    const companion = getCompanions(character).find((entry) => entry.id === companionId);
    if (!character || !companion) return false;

    const sourceKey = `companion:${characterId}:${companionId}`;
    const currentIndex = findActiveEncounterIndexBySourceKey(sourceKey);
    const shouldBePresent = control && typeof control.inEncounter === 'boolean'
      ? control.inEncounter
      : currentIndex >= 0;

    if (!shouldBePresent) {
      if (currentIndex < 0) return false;
      activeEncounter.splice(currentIndex, 1);
      return true;
    }

    if (currentIndex >= 0) {
      const currentEntry = hydrateActiveEncounterEntry(activeEncounter[currentIndex]);
      const nextEntry = applyEncounterControlOverrides(currentEntry, control);
      const changed = JSON.stringify(nextEntry) !== JSON.stringify(currentEntry);
      activeEncounter[currentIndex] = nextEntry;
      return changed;
    }

    const draft = applyEncounterControlOverrides(
      buildCompanionEncounterEntry(character, companion, {
        initiativeTotal: window.AppSystem.isCompanionForm(companion)
          ? getSharedInitiativeTotalForCharacter(characterId, control?.initiativeTotal ?? 0)
          : (control?.initiativeTotal ?? 0)
      }),
      control
    );
    activeEncounter.unshift(draft);
    return true;
  }

  function hasPendingCombatControl(character) {
    const control = window.AppSystem.hydrateCombatControlState(character?.masterSession?.combatControl);
    return Boolean(control.requestId && (control.self || control.companions.length));
  }

  function applyCombatControlForCharacter(character) {
    const control = window.AppSystem.hydrateCombatControlState(character?.masterSession?.combatControl);
    if (!control.requestId || (!control.self && !control.companions.length)) {
      return { changed: false, consumed: false };
    }

    let changed = false;
    const selfExitRequested = Boolean(control.self && control.self.inEncounter === false);
    const formControls = control.companions.filter((entry) => isFormCompanionById(character.id, entry.companionId));
    const activeFormControls = formControls.filter((entry) => entry.inEncounter === true);
    const nonFormControls = control.companions.filter((entry) => !isFormCompanionById(character.id, entry.companionId));
    const sharedInitiativeTotal = control.self && control.self.initiativeTotal !== null && control.self.initiativeTotal !== undefined
      ? Number(control.self.initiativeTotal || 0)
      : getSharedInitiativeTotalForCharacter(character.id, 0);
    const hadSharedActor = Boolean(
      getCharacterEncounterIndex(character.id) >= 0
      || getCharacterFormEncounterEntries(character.id).length
    );

    if (control.self) {
      changed = synchronizeSharedFormInitiative(character.id, sharedInitiativeTotal) || changed;
    }

    if (selfExitRequested) {
      const characterIndex = getCharacterEncounterIndex(character.id);
      if (characterIndex >= 0) {
        activeEncounter.splice(characterIndex, 1);
        changed = true;
      }
    } else if (activeFormControls.length) {
      const characterIndex = getCharacterEncounterIndex(character.id);
      if (characterIndex >= 0) {
        activeEncounter.splice(characterIndex, 1);
        changed = true;
      }
    } else if (hadSharedActor && getCharacterEncounterIndex(character.id) < 0) {
      const draft = buildCharacterEncounterEntry(character, {
        initiativeTotal: sharedInitiativeTotal
      });
      activeEncounter.unshift(draft);
      changed = true;
    }

    const characterIndex = getCharacterEncounterIndex(character.id);
    if (characterIndex >= 0 && control.self) {
      const currentEntry = hydrateActiveEncounterEntry(activeEncounter[characterIndex]);
      const nextEntry = applyEncounterControlOverrides(currentEntry, control.self);
      if (JSON.stringify(nextEntry) !== JSON.stringify(currentEntry)) {
        activeEncounter[characterIndex] = nextEntry;
        changed = true;
      }
    }

    formControls.forEach((entry) => {
      const shouldBePresent = selfExitRequested
        ? false
        : activeFormControls.length
        ? activeFormControls[activeFormControls.length - 1].companionId === entry.companionId
        : false;
      changed = ensureCompanionEncounterEntry(character.id, entry.companionId, {
        ...entry,
        inEncounter: shouldBePresent,
        initiativeTotal: sharedInitiativeTotal
      }) || changed;
    });

    nonFormControls.forEach((entry) => {
      changed = ensureCompanionEncounterEntry(character.id, entry.companionId, entry) || changed;
    });

    if (!selfExitRequested && (activeFormControls.length || hadSharedActor)) {
      changed = synchronizeSharedFormInitiative(character.id, sharedInitiativeTotal) || changed;
    }

    return { changed, consumed: true };
  }

  function clearCombatControlForCharacter(character) {
    const nextCharacter = window.AppSystem.hydrateCharacter({
      ...character,
      masterSession: window.AppSystem.hydrateMasterSession({
        ...(character.masterSession || {}),
        combatControl: null
      })
    });
    window.AppStorage.replaceCharacter(character.id, nextCharacter);
  }

  function applyCombatControlRequests() {
    if (applyingCombatControlRequests) return false;

    const pendingCharacters = getCharacters().filter(hasPendingCombatControl);
    if (!pendingCharacters.length) return false;

    applyingCombatControlRequests = true;

    try {
      let encounterChanged = false;

      pendingCharacters.forEach((character) => {
        const result = applyCombatControlForCharacter(character);
        encounterChanged = encounterChanged || result.changed;
      });

      if (encounterChanged) {
        persistActiveEncounter();
        syncActiveEncounterTurn();
        syncCombatSharedState();
      }

      pendingCharacters.forEach(clearCombatControlForCharacter);
      return encounterChanged || pendingCharacters.length > 0;
    } finally {
      applyingCombatControlRequests = false;
    }
  }

  function addCharactersToActiveEncounterBatch(characters, statusMessage) {
    let added = 0;

    (Array.isArray(characters) ? characters : []).forEach((character) => {
      if (!character?.id) return;
      if (hasCharacterSharedActorInEncounter(character.id)) return;
      const draft = buildCharacterEncounterEntry(character);
      const sourceKey = getActiveEncounterSourceKey(draft);
      if (sourceKey && hasActiveEncounterSourceKey(sourceKey)) return;
      activeEncounter.unshift(draft);
      added += 1;
    });

    if (!added) {
      setStatus('Nenhum novo player foi adicionado');
      return;
    }

    persistActiveEncounter();
    syncActiveEncounterTurn();
    syncCombatSharedState();
    renderActiveEncounter();
    setStatus(statusMessage || `${added} player(s) adicionados`);
  }

  function syncActiveEncounterTurn(options = {}) {
    const keepRound = options.keepRound !== false;
    const livingEntries = getLivingActiveEncounterEntries();
    const previousState = hydrateActiveEncounterTurnState(activeEncounterTurn);

    if (!livingEntries.length) {
      activeEncounterTurn = {
        currentInstanceId: '',
        round: 1
      };
    } else if (!livingEntries.some((entry) => entry.instanceId === previousState.currentInstanceId)) {
      activeEncounterTurn = {
        currentInstanceId: livingEntries[0].instanceId,
        round: keepRound ? previousState.round : 1
      };
    } else {
      activeEncounterTurn = {
        currentInstanceId: previousState.currentInstanceId,
        round: keepRound ? previousState.round : 1
      };
    }

    const changed = previousState.currentInstanceId !== activeEncounterTurn.currentInstanceId || previousState.round !== activeEncounterTurn.round;
    if (changed) persistActiveEncounterTurn();
    return changed;
  }

  function sortActiveEncounterByInitiative() {
    activeEncounter = activeEncounter
      .map((entry) => hydrateActiveEncounterEntry(entry))
      .sort((left, right) => {
        const initiativeDelta = Number(right.initiativeTotal || 0) - Number(left.initiativeTotal || 0);
        if (initiativeDelta) return initiativeDelta;
        const bonusDelta = Number(right.initiativeBonus || 0) - Number(left.initiativeBonus || 0);
        if (bonusDelta) return bonusDelta;
        return String(left.addedAt || '').localeCompare(String(right.addedAt || ''));
      });
    persistActiveEncounter();
    syncActiveEncounterTurn();
  }

  function buildEnemyUnitRecords(record) {
    const safeEnemy = hydrateEnemyRecord(record || {});
    const unitTotal = Math.max(1, Number(safeEnemy.countMax || safeEnemy.countCurrent || 1));
    if (unitTotal <= 1) return [safeEnemy];

    const activeUnits = Math.max(0, Math.min(Number(safeEnemy.countCurrent || 0), unitTotal));
    const baseName = String(safeEnemy.name || 'Novo inimigo')
      .replace(/\s+#?\d+$/, '')
      .trim();
    const timestamp = new Date().toISOString();

    return Array.from({ length: unitTotal }, (_, index) => {
      const isActive = index < activeUnits;
      return hydrateEnemyRecord({
        ...safeEnemy,
        id: createEnemyId(),
        name: `${baseName} ${index + 1}`,
        countCurrent: 1,
        countMax: 1,
        pvCurrent: isActive ? safeEnemy.pvCurrent : 0,
        status: isActive ? normalizeCombatStatus(safeEnemy.status, 'Vivo') : 'Morto',
        notes: `${safeEnemy.notes || ''}${safeEnemy.notes ? '\n' : ''}Unidade ${index + 1}/${unitTotal} do grupo original.`.trim(),
        createdAt: timestamp,
        updatedAt: timestamp
      });
    });
  }

  function loadEnemyLibrary() {
    try {
      const parsed = JSON.parse(localStorage.getItem(MASTER_ENEMY_LIBRARY_KEY) || '[]');
      return Array.isArray(parsed)
        ? parsed.map((entry) => hydrateEnemyRecord(entry)).sort((left, right) => String(right.updatedAt || '').localeCompare(String(left.updatedAt || '')))
        : [];
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  function persistEnemyLibrary() {
    try {
      localStorage.setItem(MASTER_ENEMY_LIBRARY_KEY, JSON.stringify(enemyLibrary));
    } catch (error) {
      console.error(error);
    }
  }

  function getEnemyById(enemyId) {
    return enemyLibrary.find((entry) => entry.id === enemyId) || null;
  }

  function getEnemyRelevantAttributes(enemy) {
    const safeEnemy = hydrateEnemyRecord(enemy || {});
    const mentioned = new Set();
    const referenceText = `${safeEnemy.damageExpression} ${safeEnemy.basicDamageExpression}`.toLowerCase();

    Object.keys(safeEnemy.attributes).forEach((key) => {
      if (referenceText.includes(key)) mentioned.add(key);
    });

    const ordered = [
      ['forca', 'Forca'],
      ['destreza', 'Destreza'],
      ['sentidos', 'Sentidos'],
      ['vigor', 'Vigor'],
      ['inteligencia', 'Inteligencia'],
      ['nexo', 'Nexo']
    ];

    return ordered
      .filter(([key]) => Number(safeEnemy.attributes[key] || 0) > 0 || mentioned.has(key))
      .map(([key, label]) => ({ key, label, value: Number(safeEnemy.attributes[key] || 0) }));
  }

  function getDefaultBasicDamageFromAttributes(attributes, role) {
    const forca = Number(attributes?.forca || 0);
    if (/boss|elite/i.test(String(role || ''))) {
      return {
        label: 'Desarmado',
        expression: '1d12 + Forca/2',
        average: roundToStep(6.5 + (forca / 2), 1)
      };
    }
    if (forca >= 4) {
      return {
        label: 'Desarmado',
        expression: '1d12 + Forca/2',
        average: roundToStep(6.5 + (forca / 2), 1)
      };
    }
    return {
      label: 'Desarmado',
      expression: '1d6 + Forca/2',
      average: roundToStep(3.5 + (forca / 2), 1)
    };
  }

  function inferEnemyAttributes(card, blueprint) {
    const safeCard = card || {};
    const metrics = blueprint?.metrics || {};
    const damageScale = Number(safeCard.damage?.scale || metrics.avgNexo || Math.max(1, metrics.avgLevel || 1));
    const role = getEnemyRoleFromBlueprint(safeCard, blueprint);
    const hasNexoDamage = /nexo/i.test(String(safeCard.damage?.expression || ''));

    return {
      forca: Math.max(0, clampRange(Math.round(Number(safeCard.attack || 0) / 2), 0, 10)),
      destreza: Math.max(0, clampRange(Math.round(Number(safeCard.dodge || 0) / 2), 0, 10)),
      sentidos: Math.max(0, clampRange(Math.round(Math.max(Number(safeCard.initiative || 0) - 1, 0) / 2), 0, 10)),
      vigor: Math.max(0, clampRange(Math.round(Math.max(Number(safeCard.block || 10) - 10, 0) / 2), 0, 10)),
      inteligencia: /boss|elite/i.test(role) ? Math.max(0, clampRange(Math.round((metrics.avgLevel || 1) + 1), 0, 10)) : 0,
      nexo: hasNexoDamage ? Math.max(0, clampRange(Math.round(damageScale), 0, 10)) : 0
    };
  }

  function getEnemyRoleFromBlueprint(card, blueprint) {
    const sourceLabel = String(blueprint?.config?.label || '').toLowerCase();
    if (card?.title && /boss/i.test(card.title)) return 'Boss';
    if (card?.title && /elite/i.test(card.title)) return 'Elite';
    if (sourceLabel.includes('elite')) return 'Elite';
    if (sourceLabel.includes('boss')) return 'Boss';
    return 'Capanga';
  }

  function buildEnemyDraftFromEncounterCard(cardIndex) {
    const blueprint = lastEncounterBlueprint;
    const card = blueprint?.cards?.[Number(cardIndex)];
    if (!blueprint || !card) return null;

    const participantNames = blueprint.metrics.participants.map((entry) => entry.name).join(', ');
    const role = getEnemyRoleFromBlueprint(card, blueprint);
    const attributes = inferEnemyAttributes(card, blueprint);
    const basicDamage = getDefaultBasicDamageFromAttributes(attributes, role);
    return createEnemyRecord({
      name: card.title || `${role} da cena`,
      role,
      status: 'Vivo',
      countCurrent: Math.max(1, Number(card.count || 1)),
      countMax: Math.max(1, Number(card.count || 1)),
      pvCurrent: Math.max(0, Number(card.eachPv || 0)),
      pvMax: Math.max(0, Number(card.eachPv || 0)),
      armor: Math.max(0, Number(card.armor || 0)),
      dodge: Math.max(0, Number(card.dodge || 0)),
      block: Math.max(0, Number(card.block || 10)),
      initiative: Math.max(0, Number(card.initiative || 0)),
      attack: Math.max(0, Number(card.attack || 0)),
      pe: Math.max(0, Number(card.pe || 0)),
      pd: Math.max(0, Number(card.pd || 0)),
      damageLabel: card.damage?.label || 'Impulso',
      damageExpression: card.damage?.expression || '1d6 + Nexo/2',
      damageAverage: Math.max(0, Number(card.damage?.average || card.damage?.avg || 0)),
      basicDamageLabel: basicDamage.label,
      basicDamageExpression: basicDamage.expression,
      basicDamageAverage: basicDamage.average,
      attributes,
      source: `${blueprint.config.label} • ${blueprint.pressureLabel}`,
      notes: `${card.note || ''}\nBaseado em: ${participantNames}`.trim()
    });
  }

  function populateEnemyFields(enemy) {
    const safeEnemy = hydrateEnemyRecord(enemy || {});
    masterEnemyFieldRefs.nameInput.value = safeEnemy.name;
    masterEnemyFieldRefs.roleInput.value = safeEnemy.role;
    masterEnemyFieldRefs.statusInput.value = safeEnemy.status;
    masterEnemyFieldRefs.countCurrentInput.value = safeEnemy.countCurrent;
    masterEnemyFieldRefs.countMaxInput.value = safeEnemy.countMax;
    masterEnemyFieldRefs.pvCurrentInput.value = safeEnemy.pvCurrent;
    masterEnemyFieldRefs.pvMaxInput.value = safeEnemy.pvMax;
    masterEnemyFieldRefs.armorInput.value = safeEnemy.armor;
    masterEnemyFieldRefs.dodgeInput.value = safeEnemy.dodge;
    masterEnemyFieldRefs.blockInput.value = safeEnemy.block;
    masterEnemyFieldRefs.initiativeInput.value = safeEnemy.initiative;
    masterEnemyFieldRefs.attackInput.value = safeEnemy.attack;
    masterEnemyFieldRefs.peInput.value = safeEnemy.pe;
    masterEnemyFieldRefs.pdInput.value = safeEnemy.pd;
    masterEnemyFieldRefs.damageLabelInput.value = safeEnemy.damageLabel;
    masterEnemyFieldRefs.damageExpressionInput.value = safeEnemy.damageExpression;
    masterEnemyFieldRefs.damageAverageInput.value = safeEnemy.damageAverage;
    masterEnemyFieldRefs.basicDamageLabelInput.value = safeEnemy.basicDamageLabel;
    masterEnemyFieldRefs.basicDamageExpressionInput.value = safeEnemy.basicDamageExpression;
    masterEnemyFieldRefs.basicDamageAverageInput.value = safeEnemy.basicDamageAverage;
    masterEnemyFieldRefs.sourceInput.value = safeEnemy.source;
    masterEnemyFieldRefs.attrForcaInput.value = safeEnemy.attributes.forca;
    masterEnemyFieldRefs.attrDestrezaInput.value = safeEnemy.attributes.destreza;
    masterEnemyFieldRefs.attrSentidosInput.value = safeEnemy.attributes.sentidos;
    masterEnemyFieldRefs.attrVigorInput.value = safeEnemy.attributes.vigor;
    masterEnemyFieldRefs.attrInteligenciaInput.value = safeEnemy.attributes.inteligencia;
    masterEnemyFieldRefs.attrNexoInput.value = safeEnemy.attributes.nexo;
    masterEnemyFieldRefs.notesInput.value = safeEnemy.notes;
  }

  function readEnemyFields() {
    return hydrateEnemyRecord({
      id: activeEnemyId || createEnemyId(),
      createdAt: activeEnemyCreatedAt || getEnemyById(activeEnemyId)?.createdAt || new Date().toISOString(),
      name: masterEnemyFieldRefs.nameInput.value,
      role: masterEnemyFieldRefs.roleInput.value,
      status: masterEnemyFieldRefs.statusInput.value,
      countCurrent: masterEnemyFieldRefs.countCurrentInput.value,
      countMax: masterEnemyFieldRefs.countMaxInput.value,
      pvCurrent: masterEnemyFieldRefs.pvCurrentInput.value,
      pvMax: masterEnemyFieldRefs.pvMaxInput.value,
      armor: masterEnemyFieldRefs.armorInput.value,
      dodge: masterEnemyFieldRefs.dodgeInput.value,
      block: masterEnemyFieldRefs.blockInput.value,
      initiative: masterEnemyFieldRefs.initiativeInput.value,
      attack: masterEnemyFieldRefs.attackInput.value,
      pe: masterEnemyFieldRefs.peInput.value,
      pd: masterEnemyFieldRefs.pdInput.value,
      damageLabel: masterEnemyFieldRefs.damageLabelInput.value,
      damageExpression: masterEnemyFieldRefs.damageExpressionInput.value,
      damageAverage: masterEnemyFieldRefs.damageAverageInput.value,
      basicDamageLabel: masterEnemyFieldRefs.basicDamageLabelInput.value,
      basicDamageExpression: masterEnemyFieldRefs.basicDamageExpressionInput.value,
      basicDamageAverage: masterEnemyFieldRefs.basicDamageAverageInput.value,
      source: masterEnemyFieldRefs.sourceInput.value,
      attributes: {
        forca: masterEnemyFieldRefs.attrForcaInput.value,
        destreza: masterEnemyFieldRefs.attrDestrezaInput.value,
        sentidos: masterEnemyFieldRefs.attrSentidosInput.value,
        vigor: masterEnemyFieldRefs.attrVigorInput.value,
        inteligencia: masterEnemyFieldRefs.attrInteligenciaInput.value,
        nexo: masterEnemyFieldRefs.attrNexoInput.value
      },
      notes: masterEnemyFieldRefs.notesInput.value,
      updatedAt: new Date().toISOString()
    });
  }

  function syncEnemySticky(enemy) {
    if (!refs.masterEnemyStickyName || !refs.masterEnemyStickyMeta || !refs.masterEnemyStickyAvatar) return;
    const safeEnemy = hydrateEnemyRecord(enemy || {});
    const attributes = getEnemyRelevantAttributes(safeEnemy);
    companionUi.setAvatar(refs.masterEnemyStickyAvatar, '', safeEnemy.name, {
      wrapperClass: 'avatar-shell profile-editor-avatar square-avatar'
    });
    refs.masterEnemyStickyName.textContent = safeEnemy.name || 'Novo inimigo';
    refs.masterEnemyStickyRole.textContent = safeEnemy.role || 'Capanga';
    refs.masterEnemyStickySource.textContent = `${normalizeCombatStatus(safeEnemy.status, 'Vivo')} • ${safeEnemy.source || 'Manual'}`;
    refs.masterEnemyStickyMeta.innerHTML = `
      <span class="stat-tag">x${safeEnemy.countCurrent}/${safeEnemy.countMax} unidades</span>
      <span class="stat-tag">PV ${safeEnemy.pvCurrent}/${safeEnemy.pvMax}</span>
      <span class="stat-tag">Arm ${safeEnemy.armor} • Esq +${safeEnemy.dodge}</span>
      <span class="stat-tag">Blk ${safeEnemy.block} • Init +${safeEnemy.initiative}</span>
      <span class="stat-tag">Atk +${safeEnemy.attack} • ${escapeHtml(safeEnemy.damageLabel)} ${escapeHtml(safeEnemy.damageExpression)}</span>
      <span class="stat-tag">Base ${escapeHtml(safeEnemy.basicDamageExpression)}</span>
      ${attributes.length ? attributes.map((attribute) => `<span class="stat-tag">${escapeHtml(attribute.label)} ${attribute.value}</span>`).join('') : ''}
      <span class="stat-tag">PE ${safeEnemy.pe} • PD ${safeEnemy.pd}</span>
    `;
  }

  function renderEnemyDialogPreview() {
    syncEnemySticky(readEnemyFields());
  }

  function renderEnemyLibrary() {
    if (!refs.masterEnemyLibraryList || !refs.masterEnemyLibraryCount) return;

    enemyLibrary = enemyLibrary
      .map((entry) => hydrateEnemyRecord(entry))
      .sort((left, right) => String(right.updatedAt || '').localeCompare(String(left.updatedAt || '')));

    refs.masterEnemyLibraryCount.textContent = `${enemyLibrary.length} ficha${enemyLibrary.length === 1 ? '' : 's'}`;

    if (!enemyLibrary.length) {
      refs.masterEnemyLibraryList.innerHTML = `
        <div class="master-enemy-empty">
          Nenhuma ficha salva ainda. Gere um inimigo no bloco acima ou use "Novo inimigo" para montar uma ficha manual.
        </div>
      `;
      return;
    }

    refs.masterEnemyLibraryList.innerHTML = enemyLibrary.map((enemy) => {
      const totalPv = Number(enemy.countCurrent || 0) * Number(enemy.pvCurrent || 0);
      const attributes = getEnemyRelevantAttributes(enemy);
      return `
        <article class="info-card master-enemy-library-card" data-enemy-id="${escapeHtml(enemy.id)}">
          <div class="master-enemy-library-head">
            <div>
              <h4>${escapeHtml(enemy.name)}</h4>
              <p class="subtle">${escapeHtml(enemy.role)} • ${escapeHtml(enemy.source || 'Manual')}</p>
            </div>
            <span class="stat-tag">x${enemy.countCurrent}/${enemy.countMax}</span>
          </div>
          <div class="master-enemy-meta-row">
            <span class="stat-tag">PV ${enemy.pvCurrent}/${enemy.pvMax}</span>
            <span class="stat-tag">Total ${totalPv}</span>
            <span class="stat-tag">Arm ${enemy.armor}</span>
            <span class="stat-tag">Esq +${enemy.dodge}</span>
            <span class="stat-tag">Blk ${enemy.block}</span>
            <span class="stat-tag">Atk +${enemy.attack}</span>
          </div>
          <div class="master-enemy-meta-row">
            <span class="stat-tag">${escapeHtml(enemy.damageLabel)}</span>
            <span class="stat-tag">${escapeHtml(enemy.damageExpression)}</span>
            <span class="stat-tag">Base ${escapeHtml(enemy.basicDamageExpression)}</span>
            <span class="stat-tag">${escapeHtml(normalizeCombatStatus(enemy.status, 'Vivo'))}</span>
            <span class="stat-tag">PE ${enemy.pe}</span>
            <span class="stat-tag">PD ${enemy.pd}</span>
          </div>
          ${attributes.length ? `
            <div class="master-enemy-meta-row">
              ${attributes.map((attribute) => `<span class="stat-tag">${escapeHtml(attribute.label)} ${attribute.value}</span>`).join('')}
            </div>
          ` : ''}
          <p class="subtle">${escapeHtml(enemy.notes || 'Sem notas.')}</p>
          <div class="card-actions-row">
            <button class="secondary-button small-button" type="button" data-action="add-enemy-to-encounter" data-enemy-id="${escapeHtml(enemy.id)}">Entrar em cena</button>
            <button class="secondary-button small-button" type="button" data-action="edit-enemy" data-enemy-id="${escapeHtml(enemy.id)}">Editar</button>
            <button class="secondary-button small-button" type="button" data-action="duplicate-enemy" data-enemy-id="${escapeHtml(enemy.id)}">Duplicar</button>
            <button class="danger-button small-button" type="button" data-action="delete-enemy" data-enemy-id="${escapeHtml(enemy.id)}">Excluir</button>
          </div>
        </article>
      `;
    }).join('');
  }

  function getEncounterRelevantAttributes(entry) {
    const safeEntry = hydrateActiveEncounterEntry(entry || {});
    if (safeEntry.combatantType === 'enemy') return getEnemyRelevantAttributes(safeEntry);

    const ordered = [
      ['forca', 'Forca'],
      ['destreza', 'Destreza'],
      ['sentidos', 'Sentidos'],
      ['vigor', 'Vigor'],
      ['inteligencia', 'Inteligencia'],
      ['nexo', 'Nexo']
    ];

    return ordered
      .filter(([key]) => Number(safeEntry.attributes?.[key] || 0) > 0)
      .map(([key, label]) => ({ key, label, value: Number(safeEntry.attributes?.[key] || 0) }));
  }

  function isFormEncounterEntry(entry) {
    const safeEntry = hydrateActiveEncounterEntry(entry || {});
    if (safeEntry.combatantType !== 'companion') return false;
    if (safeEntry.isForm) return true;
    return window.AppSystem.isCompanionForm({ type: safeEntry.role || '' });
  }

  function getActiveEncounterTypeLabel(entry) {
    const type = hydrateActiveEncounterEntry(entry || {}).combatantType;
    if (type === 'character') return 'Player';
    if (type === 'companion') return isFormEncounterEntry(entry) ? 'Forma' : 'Mini-ficha';
    return 'Inimigo';
  }

  function getActiveEncounterTypeClass(entry) {
    const type = hydrateActiveEncounterEntry(entry || {}).combatantType;
    if (type === 'character') return 'type-character';
    if (type === 'companion') return 'type-companion';
    return 'type-enemy';
  }

  function getActiveEncounterSubtitle(entry) {
    const safeEntry = hydrateActiveEncounterEntry(entry || {});
    if (safeEntry.combatantType === 'character') {
      const classLabel = safeEntry.className || safeEntry.role || 'Personagem';
      return `${classLabel} | Nv ${safeEntry.level || 1}`;
    }
    if (safeEntry.combatantType === 'companion') {
      const roleLabel = safeEntry.role || (isFormEncounterEntry(safeEntry) ? 'Forma' : 'Mini-ficha');
      return `${roleLabel} | ${safeEntry.ownerName || safeEntry.sourceName || 'Sem dono'}`;
    }
    return `${safeEntry.role || 'Inimigo'} | Base ${safeEntry.sourceName || safeEntry.name}`;
  }

  function getCurrentActiveEncounterTurnEntry() {
    if (!activeEncounterTurn.currentInstanceId) return null;
    return getActiveEncounterEntry(activeEncounterTurn.currentInstanceId);
  }

  function setActiveEncounterTurn(instanceId, options = {}) {
    const keepRound = options.keepRound !== false;
    const livingEntries = getLivingActiveEncounterEntries();
    const target = livingEntries.find((entry) => entry.instanceId === instanceId) || livingEntries[0] || null;

    activeEncounterTurn = {
      currentInstanceId: target ? target.instanceId : '',
      round: keepRound ? Math.max(1, Number(activeEncounterTurn.round || 1)) : 1
    };
    persistActiveEncounterTurn();
    syncCombatSharedState();
    renderActiveEncounter();
  }

  function resetActiveEncounterTurn() {
    sortActiveEncounterByInitiative();
    const firstEntry = getLivingActiveEncounterEntries()[0] || null;
    activeEncounterTurn = {
      currentInstanceId: firstEntry ? firstEntry.instanceId : '',
      round: 1
    };
    persistActiveEncounterTurn();
    syncCombatSharedState();
    renderActiveEncounter();
    setStatus(firstEntry ? `Rodada reiniciada em ${firstEntry.name}` : 'Rodada reiniciada');
  }

  function passActiveEncounterTurn() {
    sortActiveEncounterByInitiative();
    const livingEntries = getLivingActiveEncounterEntries();
    if (!livingEntries.length) {
      setStatus('Nao ha combatentes vivos para passar a vez');
      return;
    }

    const currentIndex = livingEntries.findIndex((entry) => entry.instanceId === activeEncounterTurn.currentInstanceId);
    if (currentIndex < 0) {
      activeEncounterTurn = {
        currentInstanceId: livingEntries[0].instanceId,
        round: Math.max(1, Number(activeEncounterTurn.round || 1))
      };
      persistActiveEncounterTurn();
      syncCombatSharedState();
      renderActiveEncounter();
      setStatus(`Turno definido para ${livingEntries[0].name}`);
      return;
    }

    const wrapped = currentIndex + 1 >= livingEntries.length;
    const nextEntry = livingEntries[(currentIndex + 1) % livingEntries.length];
    activeEncounterTurn = {
      currentInstanceId: nextEntry.instanceId,
      round: Math.max(1, Number(activeEncounterTurn.round || 1)) + (wrapped ? 1 : 0)
    };
    persistActiveEncounterTurn();
    syncCombatSharedState();
    renderActiveEncounter();
    setStatus(`Vez de ${nextEntry.name}`);
  }

  function getEncounterCombatSummary(entry) {
    const safeEntry = hydrateActiveEncounterEntry(entry || {});
    if (safeEntry.combatantType === 'character') {
      return `PE ${safeEntry.pe} | PD ${safeEntry.pd} | Manifestacao ${companionUi.formatSigned(safeEntry.manifestation || 0)}`;
    }
    const pieces = [];
    if (Number(safeEntry.attack || 0) !== 0) pieces.push(`Ataque ${companionUi.formatSigned(safeEntry.attack || 0)}`);
    if (safeEntry.damageExpression) pieces.push(`${safeEntry.damageLabel || 'Dano'} ${safeEntry.damageExpression}`);
    if (!pieces.length && safeEntry.basicDamageExpression) pieces.push(`Base ${safeEntry.basicDamageExpression}`);
    return pieces.join(' | ') || 'Sem ofensiva registrada';
  }

  function buildPublicCombatSharedState() {
    const currentTurnEntry = getCurrentActiveEncounterTurnEntry();
    const sortedEntries = activeEncounter.map((entry) => hydrateActiveEncounterEntry(entry));
    const preferredFormsByCharacter = new Map();

    sortedEntries.forEach((entry) => {
      if (!isFormEncounterEntry(entry) || !entry.sourceCharacterId) return;
      const currentChoice = preferredFormsByCharacter.get(entry.sourceCharacterId);
      const candidate = {
        entry,
        isCurrentTurn: Boolean(currentTurnEntry && currentTurnEntry.instanceId === entry.instanceId)
      };

      if (!currentChoice || (candidate.isCurrentTurn && !currentChoice.isCurrentTurn)) {
        preferredFormsByCharacter.set(entry.sourceCharacterId, candidate);
      }
    });

    let publicCurrentInstanceId = currentTurnEntry ? currentTurnEntry.instanceId : '';
    if (currentTurnEntry && currentTurnEntry.sourceCharacterId) {
      const preferredForm = preferredFormsByCharacter.get(currentTurnEntry.sourceCharacterId);
      const currentSharesActor = currentTurnEntry.combatantType === 'character' || isFormEncounterEntry(currentTurnEntry);
      if (preferredForm && currentSharesActor) {
        publicCurrentInstanceId = preferredForm.entry.instanceId;
      }
    }

    const filteredEntries = sortedEntries.filter((entry) => {
      if (entry.combatantType === 'character' && preferredFormsByCharacter.has(entry.sourceCharacterId)) {
        return false;
      }

      if (isFormEncounterEntry(entry) && entry.sourceCharacterId) {
        return preferredFormsByCharacter.get(entry.sourceCharacterId)?.entry.instanceId === entry.instanceId;
      }

      return true;
    });

    return window.AppSystem.hydrateCombatSharedState({
      active: filteredEntries.length > 0,
      round: Math.max(1, Number(activeEncounterTurn.round || 1)),
      currentInstanceId: publicCurrentInstanceId,
      combatants: filteredEntries.map((entry, index) => ({
        order: index + 1,
        instanceId: entry.instanceId,
        combatantType: entry.combatantType,
        typeLabel: getActiveEncounterTypeLabel(entry),
        name: entry.name,
        subtitle: getActiveEncounterSubtitle(entry),
        status: normalizeCombatStatus(entry.status, 'Vivo'),
        pvCurrent: Number(entry.pvCurrent || 0),
        pvMax: Number(entry.pvMax || 0),
        armor: Number(entry.armor || 0),
        dodge: Number(entry.dodge || 0),
        block: Number(entry.block || 0),
        initiativeTotal: Number(entry.initiativeTotal || 0),
        sourceCharacterId: entry.sourceCharacterId || '',
        sourceCompanionId: entry.sourceCompanionId || '',
        ownerName: entry.ownerName || '',
        image: entry.image || '',
        isForm: isFormEncounterEntry(entry),
        isCurrentTurn: Boolean(publicCurrentInstanceId && publicCurrentInstanceId === entry.instanceId)
      }))
    });
  }

  function buildCombatSharedSignature(state) {
    const safeState = window.AppSystem.hydrateCombatSharedState(state);
    return JSON.stringify({
      active: safeState.active,
      round: safeState.round,
      currentInstanceId: safeState.currentInstanceId,
      combatants: safeState.combatants.map((entry) => ({
        order: entry.order,
        instanceId: entry.instanceId,
        combatantType: entry.combatantType,
        typeLabel: entry.typeLabel,
        name: entry.name,
        subtitle: entry.subtitle,
        status: entry.status,
        pvCurrent: entry.pvCurrent,
        pvMax: entry.pvMax,
        armor: entry.armor,
        dodge: entry.dodge,
        block: entry.block,
        initiativeTotal: entry.initiativeTotal,
        sourceCharacterId: entry.sourceCharacterId,
        sourceCompanionId: entry.sourceCompanionId,
        ownerName: entry.ownerName,
        image: entry.image,
        isForm: entry.isForm,
        isCurrentTurn: entry.isCurrentTurn
      }))
    });
  }

  function captureCombatSharedState(options = {}) {
    const forceStamp = Boolean(options.forceStamp);
    const rawState = buildPublicCombatSharedState();
    const signature = buildCombatSharedSignature(rawState);
    const hasSnapshot = Boolean(lastCombatSharedState?.updatedAt);
    const shouldStamp = forceStamp || !hasSnapshot || signature !== lastCombatBroadcastSignature;

    if (shouldStamp) {
      lastCombatBroadcastSignature = signature;
      lastCombatSharedState = window.AppSystem.hydrateCombatSharedState({
        ...rawState,
        updatedAt: new Date().toISOString()
      });
    }

    return {
      changed: shouldStamp,
      signature: lastCombatBroadcastSignature,
      state: lastCombatSharedState
    };
  }

  function syncCombatSharedState(force = false) {
    sortActiveEncounterByInitiative();
    const snapshot = captureCombatSharedState({ forceStamp: force });
    if (!snapshot.changed && !force) return snapshot.state;

    const sharedState = snapshot.state;
    trackMasterCombatState(sharedState);
    window.AppCombatState?.broadcastState(sharedState, { reason: force ? 'force-sync' : 'sync' });
    return sharedState;
  }

  function buildEncounterEntryFromSharedCombatant(sharedEntry) {
    const safeSharedState = window.AppSystem.hydrateCombatSharedState({
      combatants: [sharedEntry]
    });
    const safeEntry = safeSharedState.combatants[0];
    if (!safeEntry) return null;

    if (safeEntry.combatantType === 'character' && safeEntry.sourceCharacterId) {
      const character = getCharacterById(safeEntry.sourceCharacterId);
      if (character) {
        return buildCharacterEncounterEntry(character, {
          instanceId: safeEntry.instanceId,
          initiativeTotal: Number(safeEntry.initiativeTotal || 0),
          status: normalizeCombatStatus(safeEntry.status || character.resources?.status, 'Vivo'),
          pvCurrent: Number(safeEntry.pvMax || 0) > 0 ? Number(safeEntry.pvCurrent || 0) : Number(character.resources?.pvCurrent || 0),
          pvMax: Number(safeEntry.pvMax || 0),
          image: safeEntry.image || character.identity?.image || '',
          addedAt: new Date().toISOString(),
          updatedAt: safeSharedState.updatedAt || new Date().toISOString()
        });
      }
    }

    if (safeEntry.combatantType === 'companion' && safeEntry.sourceCharacterId && safeEntry.sourceCompanionId) {
      const character = getCharacterById(safeEntry.sourceCharacterId);
      const companion = getCharacterCompanionById(safeEntry.sourceCharacterId, safeEntry.sourceCompanionId);
      if (character && companion) {
        return buildCompanionEncounterEntry(character, companion, {
          instanceId: safeEntry.instanceId,
          initiativeTotal: Number(safeEntry.initiativeTotal || 0),
          status: normalizeCombatStatus(safeEntry.status || companion.status, 'Vivo'),
          pvCurrent: Number(safeEntry.pvMax || 0) > 0 ? Number(safeEntry.pvCurrent || 0) : Number(companion.pvCurrent || 0),
          pvMax: Number(safeEntry.pvMax || 0) || Number(companion.pvMax || 0),
          image: safeEntry.image || companion.image || '',
          addedAt: new Date().toISOString(),
          updatedAt: safeSharedState.updatedAt || new Date().toISOString()
        });
      }
    }

    return hydrateActiveEncounterEntry({
      instanceId: safeEntry.instanceId,
      combatantType: safeEntry.combatantType,
      name: safeEntry.name,
      role: safeEntry.typeLabel || safeEntry.combatantType,
      status: safeEntry.status,
      initiativeTotal: Number(safeEntry.initiativeTotal || 0),
      sourceCharacterId: safeEntry.sourceCharacterId,
      sourceCompanionId: safeEntry.sourceCompanionId,
      ownerName: safeEntry.ownerName,
      image: safeEntry.image,
      isForm: safeEntry.isForm,
      addedAt: new Date().toISOString(),
      updatedAt: safeSharedState.updatedAt || new Date().toISOString()
    });
  }

  function applyRemoteCombatStateToEncounter(state, options = {}) {
    const safeState = window.AppSystem.hydrateCombatSharedState(state);
    trackMasterCombatState(safeState);
    const nextEncounter = safeState.combatants.map((sharedEntry) => {
      const sharedSourceKey = sharedEntry.combatantType === 'character'
        ? `character:${sharedEntry.sourceCharacterId}`
        : (
          sharedEntry.combatantType === 'companion'
            ? `companion:${sharedEntry.sourceCharacterId}:${sharedEntry.sourceCompanionId}`
            : ''
        );

      const existing = activeEncounter.find((entry) => {
        const safeLocal = hydrateActiveEncounterEntry(entry);
        return (
          String(safeLocal.instanceId || '') === String(sharedEntry.instanceId || '')
          || (sharedSourceKey && getActiveEncounterSourceKey(safeLocal) === sharedSourceKey)
        );
      });

      const baseEntry = existing
        ? hydrateActiveEncounterEntry(existing)
        : buildEncounterEntryFromSharedCombatant(sharedEntry);

      if (!baseEntry) return null;

      return hydrateActiveEncounterEntry({
        ...baseEntry,
        instanceId: sharedEntry.instanceId || baseEntry.instanceId,
        name: sharedEntry.name || baseEntry.name,
        status: sharedEntry.status || baseEntry.status,
        pvCurrent: Number(sharedEntry.pvMax || 0) > 0 ? Number(sharedEntry.pvCurrent || 0) : Number(baseEntry.pvCurrent || 0),
        pvMax: Number(sharedEntry.pvMax || 0) || Number(baseEntry.pvMax || 0),
        armor: Number(sharedEntry.armor || baseEntry.armor || 0),
        dodge: Number(sharedEntry.dodge || baseEntry.dodge || 0),
        block: Number(sharedEntry.block || baseEntry.block || 0),
        image: sharedEntry.image || baseEntry.image,
        ownerName: sharedEntry.ownerName || baseEntry.ownerName,
        sourceCharacterId: sharedEntry.sourceCharacterId || baseEntry.sourceCharacterId,
        sourceCompanionId: sharedEntry.sourceCompanionId || baseEntry.sourceCompanionId,
        isForm: Boolean(sharedEntry.isForm || baseEntry.isForm),
        initiativeDice: [],
        initiativeRoll: 0,
        initiativeTotal: Number(sharedEntry.initiativeTotal || 0),
        updatedAt: safeState.updatedAt || new Date().toISOString()
      });
    }).filter(Boolean);

    activeEncounter = nextEncounter;
    activeEncounterTurn = {
      currentInstanceId: String(safeState.currentInstanceId || ''),
      round: Math.max(1, Number(safeState.round || 1))
    };
    persistActiveEncounter();
    persistActiveEncounterTurn();
    lastCombatSharedState = safeState;
    lastCombatBroadcastSignature = buildCombatSharedSignature(safeState);

    if (options.render !== false) {
      renderActiveEncounter();
    }

    return safeState;
  }

  function renderActiveEncounter() {
    if (!refs.masterActiveEncounterSummary || !refs.masterActiveEncounterList) return;
    const isTurnSpotlight = Date.now() < masterTurnFlashUntil;
    const isSyncFresh = lastMasterCombatSyncAt && (Date.now() - lastMasterCombatSyncAt) < 1100;
    if (!remoteCombatBootstrapped) {
      if (refs.masterActiveEncounterCount) {
        refs.masterActiveEncounterCount.textContent = 'Sincronizando';
      }

      if (refs.masterActiveEncounterPv) {
        refs.masterActiveEncounterPv.textContent = '--';
      }

      refs.masterActiveEncounterSummary.innerHTML = `
        <article class="info-card master-overview-card">
          <span class="master-overview-label">Combate</span>
          <strong class="master-overview-value">Sincronizando</strong>
          <p class="subtle">Esperando o estado global do combate chegar do backend.</p>
        </article>
      `;

      refs.masterActiveEncounterList.innerHTML = `
        <div class="master-enemy-empty">
          Sincronizando o combate atual. O encontro salvo localmente nao vai sobrescrever o estado global.
        </div>
      `;
      return;
    }

    sortActiveEncounterByInitiative();
    syncActiveEncounterTurn();
    const livingEntries = getLivingActiveEncounterEntries();
    const totalPv = activeEncounter.reduce((sum, entry) => sum + Number(entry.pvCurrent || 0), 0);
    const totalEntries = activeEncounter.length;
    const typeCounts = activeEncounter.reduce((accumulator, entry) => {
      const type = hydrateActiveEncounterEntry(entry).combatantType;
      accumulator[type] = Number(accumulator[type] || 0) + 1;
      return accumulator;
    }, { character: 0, companion: 0, enemy: 0 });
    const currentTurnEntry = getCurrentActiveEncounterTurnEntry();
    const currentTurnIndex = currentTurnEntry
      ? livingEntries.findIndex((entry) => entry.instanceId === currentTurnEntry.instanceId)
      : -1;
    const nextTurnEntry = currentTurnIndex >= 0 && livingEntries.length > 1
      ? livingEntries[(currentTurnIndex + 1) % livingEntries.length]
      : null;
    const syncLabel = getCombatSyncLabel();

    if (refs.masterActiveEncounterCount) {
      refs.masterActiveEncounterCount.textContent = `${totalEntries} em cena`;
    }

    if (refs.masterActiveEncounterPv) {
      refs.masterActiveEncounterPv.textContent = `${totalPv} PV restantes`;
    }

    const initiativeRail = livingEntries.length
      ? livingEntries.map((entry) => {
        const safeRailEntry = hydrateActiveEncounterEntry(entry);
        const isRailCurrent = currentTurnEntry && currentTurnEntry.instanceId === safeRailEntry.instanceId;
        const isRailNext = nextTurnEntry && nextTurnEntry.instanceId === safeRailEntry.instanceId;
        return `
          <span class="master-initiative-pill${isRailCurrent ? ' is-current' : ''}${isRailNext ? ' is-next' : ''}">
            <strong>${escapeHtml(safeRailEntry.name || 'Combatente')}</strong>
            <small>${Number(safeRailEntry.initiativeTotal || 0)}</small>
          </span>
        `;
      }).join('')
      : '<span class="master-empty-inline">Sem combatentes vivos na ordem.</span>';

    refs.masterActiveEncounterSummary.innerHTML = `
      <article class="info-card master-combat-command-card ${isTurnSpotlight && currentTurnEntry ? 'is-turn-spotlight' : ''}">
        <div class="master-command-copy">
          <span class="master-overview-label">Vez atual</span>
          <strong class="master-command-current">${escapeHtml(currentTurnEntry ? currentTurnEntry.name : 'Sem turno')}</strong>
          <p class="subtle">${escapeHtml(currentTurnEntry ? `Iniciativa ${Number(currentTurnEntry.initiativeTotal || 0)} | ${normalizeCombatStatus(currentTurnEntry.status, 'Vivo')}` : 'Defina a iniciativa e passe a vez quando a cena comecar.')}</p>
        </div>
        <div class="master-command-actions">
          <button class="primary-button" type="button" data-action="summary-pass-turn">Passar vez</button>
          <button class="secondary-button small-button" type="button" data-action="summary-sort-turns">Ordenar</button>
          <button class="secondary-button small-button" type="button" data-action="summary-reset-turn">Reiniciar</button>
        </div>
      </article>
      <article class="info-card master-combat-next-card">
        <span class="master-overview-label">Proximo</span>
        <strong class="master-overview-value">${escapeHtml(nextTurnEntry ? nextTurnEntry.name : '-')}</strong>
        <p class="subtle">Rodada ${Math.max(1, Number(activeEncounterTurn.round || 1))} | ${livingEntries.length} vivo(s)</p>
      </article>
      <article class="info-card master-combat-next-card ${isSyncFresh ? 'is-sync-fresh' : ''}">
        <span class="master-overview-label">Cena</span>
        <strong class="master-overview-value">${livingEntries.length}/${totalEntries}</strong>
        <p class="subtle">PV ${totalPv} | P ${typeCounts.character} M ${typeCounts.companion} I ${typeCounts.enemy} | ${escapeHtml(syncLabel)}</p>
      </article>
      <article class="info-card master-initiative-rail-card">
        <div class="master-initiative-rail-head">
          <span class="master-overview-label">Ordem de iniciativa</span>
          <span class="subtle">${escapeHtml(currentTurnEntry ? 'Fila viva ordenada por iniciativa.' : 'Sem turno atual definido.')}</span>
        </div>
        <div class="master-initiative-rail">${initiativeRail}</div>
      </article>
    `;

    if (refs.masterActiveEncounterQuickAdd) {
      const quickAddCharacters = getVisibleCharacters().filter((character) => {
        return !hasCharacterSharedActorInEncounter(character.id);
      });

      refs.masterActiveEncounterQuickAdd.innerHTML = `
        <button class="secondary-button small-button master-quick-add-pill" type="button" data-action="quick-add-visible-to-encounter">+ Todos visiveis</button>
        <button class="secondary-button small-button master-quick-add-pill" type="button" data-action="quick-open-enemy-dialog">+ Inimigo</button>
        ${quickAddCharacters.length
          ? quickAddCharacters.map((character) => `
            <button
              class="secondary-button small-button master-quick-add-pill"
              type="button"
              data-action="quick-add-character-to-encounter"
              data-character-id="${escapeHtml(character.id)}"
            >
              + ${escapeHtml(character.identity?.name || 'Sem nome')}
            </button>
          `).join('')
          : '<span class="master-empty-inline">Todos os players visiveis ja estao em cena.</span>'}
      `;
    }

    if (!activeEncounter.length) {
      refs.masterActiveEncounterList.innerHTML = `
        <div class="master-enemy-empty">
          Nenhum combatente em cena ainda. Adicione players, mini-fichas ou inimigos para montar a ordem do combate.
        </div>
      `;
      return;
    }

    refs.masterActiveEncounterList.innerHTML = activeEncounter.map((entry) => {
      const safeEntry = hydrateActiveEncounterEntry(entry);
      const isCurrentTurn = currentTurnEntry && currentTurnEntry.instanceId === safeEntry.instanceId;
      const statusLabel = normalizeCombatStatus(safeEntry.status, 'Vivo');
      const statusTone = getCombatStatusTone(statusLabel);
      const orderIndex = livingEntries.findIndex((entry) => entry.instanceId === safeEntry.instanceId);
      const isFormEntry = safeEntry.combatantType === 'companion' && Boolean(safeEntry.isForm);
      const detailsOpen = isCurrentTurn || statusTone !== 'alive';
      const typeLabel = getActiveEncounterTypeLabel(safeEntry);

      return `
        <article class="info-card master-active-encounter-card master-encounter-control-card ${getActiveEncounterTypeClass(safeEntry)}${isCurrentTurn ? ' is-current-turn' : ''}${isTurnSpotlight && isCurrentTurn ? ' is-turn-spotlight' : ''}${nextTurnEntry && nextTurnEntry.instanceId === safeEntry.instanceId ? ' is-next-turn' : ''} is-${statusTone}" data-instance-id="${escapeHtml(safeEntry.instanceId)}">
          <div class="master-encounter-control-head">
            <div class="master-encounter-identity">
              ${avatarMarkup(safeEntry.image, safeEntry.name)}
              <div class="master-encounter-name-block">
                <div class="master-encounter-title-line">
                  <h4>#${orderIndex >= 0 ? orderIndex + 1 : '-'} ${escapeHtml(safeEntry.name)}</h4>
                  ${isCurrentTurn ? '<span class="stat-tag master-current-turn-chip">Vez atual</span>' : ''}
                  ${nextTurnEntry && nextTurnEntry.instanceId === safeEntry.instanceId && !isCurrentTurn ? '<span class="stat-tag combat-next-turn-chip">Proximo</span>' : ''}
                </div>
                <p class="subtle">${escapeHtml(getActiveEncounterSubtitle(safeEntry))}</p>
              </div>
            </div>
            <div class="master-active-encounter-head-tags master-encounter-status-tags">
              <span class="stat-tag master-combatant-chip ${getActiveEncounterTypeClass(safeEntry)}">${escapeHtml(getActiveEncounterTypeLabel(safeEntry))}</span>
              ${isFormEntry ? '<span class="stat-tag combat-transformed-chip">Transformado</span>' : ''}
              <span class="stat-tag combat-status-chip is-${statusTone}">${escapeHtml(statusLabel)}</span>
            </div>
          </div>

          <div class="master-encounter-control-main">
            <div class="master-encounter-pv-column">
              ${buildMasterEncounterPvBar(safeEntry)}
              <div class="master-encounter-pv-buttons">
                <button class="secondary-button small-button" type="button" data-action="adjust-instance-pv" data-delta="-10">-10</button>
                <button class="secondary-button small-button" type="button" data-action="adjust-instance-pv" data-delta="-5">-5</button>
                <button class="secondary-button small-button" type="button" data-action="adjust-instance-pv" data-delta="-1">-1</button>
                <button class="secondary-button small-button" type="button" data-action="adjust-instance-pv" data-delta="1">+1</button>
                <button class="secondary-button small-button" type="button" data-action="adjust-instance-pv" data-delta="5">+5</button>
                <button class="secondary-button small-button" type="button" data-action="adjust-instance-pv" data-delta="10">+10</button>
              </div>
            </div>
            <div class="master-encounter-fast-controls">
              <label class="master-mini-field">
                PV
                <input type="number" min="0" max="${Number(safeEntry.pvMax || 0)}" value="${Number(safeEntry.pvCurrent || 0)}" data-field="pvCurrent" />
              </label>
              <label class="master-mini-field">
                Inic
                <input type="number" min="-99" max="999" value="${Number(safeEntry.initiativeTotal || 0)}" data-field="initiativeTotal" />
              </label>
              <div class="master-status-quickset" aria-label="Status de ${escapeHtml(safeEntry.name)}">
                ${COMBAT_STATUS_OPTIONS.map((status) => `
                  <button
                    class="secondary-button small-button${statusLabel === status ? ' is-active' : ''}"
                    type="button"
                    data-action="set-instance-status"
                    data-status="${escapeHtml(status)}"
                  >
                    ${escapeHtml(status)}
                  </button>
                `).join('')}
              </div>
            </div>
          </div>

          <div class="master-active-encounter-actions master-encounter-footer-actions">
            <button class="secondary-button small-button" type="button" data-action="defeat-instance">Derrotar</button>
            <button class="danger-button small-button" type="button" data-action="remove-instance">Sair de cena</button>
          </div>

          <details class="master-encounter-details"${detailsOpen ? ' open' : ''}>
            <summary>Detalhes de ${escapeHtml(typeLabel)}</summary>
            <div class="master-encounter-details-grid">
              <span class="stat-tag">Arm ${safeEntry.armor}</span>
              <span class="stat-tag">Esq ${companionUi.formatSigned(safeEntry.dodge || 0)}</span>
              <span class="stat-tag">Blk ${safeEntry.block}</span>
              <span class="stat-tag">Tipo ${escapeHtml(typeLabel)}</span>
            </div>
            <p class="subtle master-encounter-summary">${escapeHtml(getEncounterCombatSummary(safeEntry))}</p>
            <label class="master-status-select-field">
              Status manual
              <select data-field="status">
                ${buildCombatStatusOptionsMarkup(safeEntry.status)}
              </select>
            </label>
          </details>
        </article>
      `;
    }).join('');
  }

  function addEnemyToActiveEncounter(enemyId) {
    const target = getEnemyById(enemyId);
    if (!target) return;
    activeEncounter.unshift(createEnemyEncounterEntry(target));
    persistActiveEncounter();
    syncActiveEncounterTurn();
    syncCombatSharedState();
    renderActiveEncounter();
    setStatus('Inimigo entrou em cena');
  }

  function addCharacterToActiveEncounter(characterId) {
    const character = getCharacterById(characterId);
    if (!character) return;
    if (hasCharacterSharedActorInEncounter(characterId)) {
      setStatus('Esse player ja esta representado em cena por ele mesmo ou por uma forma');
      return;
    }

    const draft = buildCharacterEncounterEntry(character);
    const sourceKey = getActiveEncounterSourceKey(draft);
    if (sourceKey && activeEncounter.some((entry) => getActiveEncounterSourceKey(entry) === sourceKey)) {
      setStatus('Esse player ja esta em cena');
      return;
    }

    activeEncounter.unshift(draft);
    persistActiveEncounter();
    syncActiveEncounterTurn();
    syncCombatSharedState();
    renderActiveEncounter();
    setStatus('Player entrou em cena');
  }

  function addCompanionToActiveEncounter(characterId, companionId) {
    const character = getCharacterById(characterId);
    const companion = getCompanions(character).find((entry) => entry.id === companionId);
    if (!character || !companion) return;
    const beforeLength = activeEncounter.length;

    if (window.AppSystem.isCompanionForm(companion)) {
      activeEncounter = activeEncounter.filter((entry) => {
        const safeEntry = hydrateActiveEncounterEntry(entry);
        if (safeEntry.combatantType === 'character' && safeEntry.sourceCharacterId === characterId) return false;
        if (
          safeEntry.combatantType === 'companion'
          && safeEntry.sourceCharacterId === characterId
          && Boolean(safeEntry.isForm || isFormCompanionById(characterId, safeEntry.sourceCompanionId))
        ) {
          return safeEntry.sourceCompanionId === companionId;
        }
        return true;
      });
    }

    const draft = buildCompanionEncounterEntry(character, companion);
    const sourceKey = getActiveEncounterSourceKey(draft);
    if (sourceKey && activeEncounter.some((entry) => getActiveEncounterSourceKey(entry) === sourceKey)) {
      if (activeEncounter.length !== beforeLength) {
        persistActiveEncounter();
        syncActiveEncounterTurn();
        syncCombatSharedState();
        renderActiveEncounter();
      }
      setStatus('Essa mini-ficha ja esta em cena');
      return;
    }

    activeEncounter.unshift(draft);
    persistActiveEncounter();
    syncActiveEncounterTurn();
    syncCombatSharedState();
    renderActiveEncounter();
    setStatus('Mini-ficha entrou em cena');
  }

  function removeActiveEncounterEntry(instanceId) {
    activeEncounter = activeEncounter.filter((entry) => entry.instanceId !== instanceId);
    persistActiveEncounter();
    syncActiveEncounterTurn();
    syncCombatSharedState();
    renderActiveEncounter();
    setStatus('Combatente removido do encontro');
  }

  function updateActiveEncounterEntry(instanceId, updater) {
    const index = activeEncounter.findIndex((entry) => entry.instanceId === instanceId);
    if (index < 0) return;

    const current = hydrateActiveEncounterEntry(activeEncounter[index]);
    const nextDraft = typeof updater === 'function' ? updater(current) : { ...current, ...(updater || {}) };
    const next = hydrateActiveEncounterEntry({
      ...current,
      ...nextDraft,
      updatedAt: new Date().toISOString()
    });
    activeEncounter[index] = next;
    syncEncounterEntryToSourceSheet(next);
    persistActiveEncounter();
    syncActiveEncounterTurn();
    syncCombatSharedState();
    renderActiveEncounter();
  }

  function clearActiveEncounter() {
    activeEncounter = [];
    activeEncounterTurn = { currentInstanceId: '', round: 1 };
    persistActiveEncounter();
    persistActiveEncounterTurn();
    syncCombatSharedState(true);
    renderActiveEncounter();
    setStatus('Encontro limpo');
  }

  async function hardResetCombatState() {
    activeEncounter = [];
    activeEncounterTurn = { currentInstanceId: '', round: 1 };
    lastCombatBroadcastSignature = '';
    lastCombatSharedState = window.AppSystem.hydrateCombatSharedState(null);
    persistActiveEncounter();
    persistActiveEncounterTurn();

    const resetCharacters = getCharacters().map((character) => {
      return window.AppSystem.hydrateCharacter({
        ...character,
        masterSession: window.AppSystem.hydrateMasterSession({
          ...(character.masterSession || {}),
          combatShared: null,
          combatControl: null
        })
      });
    });

    for (const nextCharacter of resetCharacters) {
      await window.AppStorage.persistCharacter(nextCharacter);
    }

    if (window.AppStorage.refresh) {
      await window.AppStorage.refresh(true);
    }

    syncCombatSharedState(true);
    renderMasterNow();
    setStatus('Combate global resetado');
  }

  function openEnemyDialog(enemy) {
    const safeEnemy = hydrateEnemyRecord(enemy || createEnemyRecord());
    activeEnemyId = safeEnemy.id;
    activeEnemyCreatedAt = safeEnemy.createdAt || new Date().toISOString();
    if (refs.masterEnemyDialogTitle) {
      refs.masterEnemyDialogTitle.textContent = getEnemyById(safeEnemy.id) ? 'Editar inimigo' : 'Nova ficha de inimigo';
    }
    populateEnemyFields(safeEnemy);
    syncEnemySticky(safeEnemy);
    if (refs.masterEnemyDeleteButton) {
      refs.masterEnemyDeleteButton.disabled = !getEnemyById(safeEnemy.id);
    }
    companionUi.openDialog(refs.masterEnemyDialog);
  }

  function closeEnemyDialog() {
    companionUi.closeDialog(refs.masterEnemyDialog);
  }

  function saveEnemyFromDialog() {
    const payload = readEnemyFields();
    const existingIndex = enemyLibrary.findIndex((entry) => entry.id === payload.id);
    const unitRecords = buildEnemyUnitRecords(payload);

    if (unitRecords.length > 1) {
      const filteredLibrary = enemyLibrary.filter((entry) => entry.id !== payload.id);
      enemyLibrary = [...unitRecords, ...filteredLibrary];
      persistEnemyLibrary();
      renderEnemyLibrary();
      activeEnemyId = null;
      activeEnemyCreatedAt = null;
      closeEnemyDialog();
      setStatus(`${unitRecords.length} fichas criadas`);
      return;
    }

    if (existingIndex >= 0) {
      enemyLibrary[existingIndex] = unitRecords[0];
    } else {
      enemyLibrary.unshift(unitRecords[0]);
    }
    persistEnemyLibrary();
    renderEnemyLibrary();
    activeEnemyId = unitRecords[0].id;
    activeEnemyCreatedAt = unitRecords[0].createdAt;
    if (refs.masterEnemyDeleteButton) refs.masterEnemyDeleteButton.disabled = false;
    setStatus('Ficha de inimigo salva');
  }

  function deleteEnemyRecord(enemyId) {
    enemyLibrary = enemyLibrary.filter((entry) => entry.id !== enemyId);
    persistEnemyLibrary();
    renderEnemyLibrary();
    if (activeEnemyId === enemyId) {
      activeEnemyId = null;
      closeEnemyDialog();
    }
    setStatus('Ficha de inimigo removida');
  }

  function duplicateEnemyRecord(enemyId) {
    const target = getEnemyById(enemyId);
    if (!target) return;
    const duplicate = createEnemyRecord({
      ...target,
      id: createEnemyId(),
      name: `${target.name} copia`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    enemyLibrary.unshift(duplicate);
    persistEnemyLibrary();
    renderEnemyLibrary();
    openEnemyDialog(duplicate);
    setStatus('Ficha duplicada');
  }

  enemyLibrary = loadEnemyLibrary();
  activeEncounter = loadActiveEncounter();
  activeEncounterTurn = loadActiveEncounterTurn();
  sortActiveEncounterByInitiative();

  let remoteCombatBootstrapped = false;

  window.AppCombatState?.subscribeState?.((state) => {
    if (!remoteCombatBootstrapped) return;
    applyRemoteCombatStateToEncounter(state);
  });

  function getCharacterSkillTotal(character, skillKey) {
    const attributeKey = character?.skillAttributes?.[skillKey] || window.AppSystem.getSkillDefaultAttribute(skillKey);
    return window.AppSystem.calculateSkillTotal(
      character?.skills?.[skillKey],
      attributeKey,
      character?.attributes || {}
    ) + window.AppSystem.getSkillFixedBonus(character, skillKey);
  }

  function getCharacterBestAttack(character) {
    const candidates = ['luta', 'pontaria', 'manifestacao'].map((skillKey) => {
      const match = window.AppSystem.SKILLS.find((entry) => entry.key === skillKey);
      return {
        key: skillKey,
        label: match ? match.label : skillKey,
        total: getCharacterSkillTotal(character, skillKey)
      };
    });

    return candidates.sort((left, right) => right.total - left.total)[0] || {
      key: 'luta',
      label: 'Luta',
      total: 0
    };
  }

  function ensureEncounterSelection() {
    const characters = getCharacters();
    const validIds = new Set(characters.map((character) => character.id));

    encounterState.selectedIds = (encounterState.selectedIds || []).filter((id) => validIds.has(id));
    if (!ENCOUNTER_TYPE_CONFIG[encounterState.type]) encounterState.type = 'skirmish';
    if (!ENCOUNTER_PRESSURE_LABELS[encounterState.pressure]) encounterState.pressure = 'balanced';

    if (!encounterState.selectedIds.length) {
      const defaultIds = characters
        .filter((character) => !getCharacterAlertData(character).isAbsent)
        .map((character) => character.id);

      encounterState.selectedIds = defaultIds.length ? defaultIds : characters.map((character) => character.id);
      saveEncounterState();
    }
  }

  function getEncounterParticipants() {
    ensureEncounterSelection();
    const selectedIds = new Set(encounterState.selectedIds);
    return getCharacters().filter((character) => selectedIds.has(character.id));
  }

  function setEncounterParticipants(characters) {
    encounterState.selectedIds = Array.from(new Set((characters || []).map((character) => character.id).filter(Boolean)));
    if (!encounterState.selectedIds.length) {
      encounterState.selectedIds = getCharacters().map((character) => character.id);
    }
    saveEncounterState();
    renderEncounterPlanner();
  }

  function toggleEncounterParticipant(characterId) {
    const nextIds = new Set(encounterState.selectedIds || []);
    if (nextIds.has(characterId)) {
      nextIds.delete(characterId);
    } else {
      nextIds.add(characterId);
    }

    encounterState.selectedIds = Array.from(nextIds);
    if (!encounterState.selectedIds.length) {
      encounterState.selectedIds = [characterId];
    }

    saveEncounterState();
    renderEncounterPlanner();
  }

  function getDamageProfileForAverage(targetAverage, scale) {
    const safeScale = Math.max(1, Number(scale || 1));
    let selected = ENCOUNTER_DAMAGE_PROFILES[0];
    let selectedAverage = selected.average(safeScale);

    ENCOUNTER_DAMAGE_PROFILES.forEach((profile) => {
      const currentAverage = profile.average(safeScale);
      if (Math.abs(currentAverage - targetAverage) < Math.abs(selectedAverage - targetAverage)) {
        selected = profile;
        selectedAverage = currentAverage;
      }
    });

    return {
      ...selected,
      average: roundToStep(selectedAverage, 1)
    };
  }

  function getEncounterReadinessLabel(metrics) {
    const readiness = (metrics.pvReadiness * 0.5) + (metrics.peReadiness * 0.25) + (metrics.pdReadiness * 0.25);
    if (readiness < 0.62) return 'Grupo ja chega bem gasto';
    if (readiness < 0.82) return 'Grupo em meia carga';
    return 'Grupo praticamente inteiro';
  }

  function buildEncounterMetrics(participants) {
    const roster = participants.map((character) => {
      const derived = window.AppSystem.calculateDerived(character);
      const bestAttack = getCharacterBestAttack(character);
      const pvMax = Number(derived.maxPv || 0);
      const peMax = Number(derived.maxPe || 0);
      const pdMax = Number(derived.maxPd || 0);
      const pvCurrent = Number(character.resources?.pvCurrent || 0);
      const peCurrent = Number(character.resources?.peCurrent || 0);
      const pdCurrent = Number(character.resources?.pdCurrent || 0);

      return {
        id: character.id,
        name: character.identity?.name || 'Sem nome',
        level: Number(character.identity?.level || 1),
        className: character.identity?.className || 'Especialista',
        maxPv: pvMax,
        maxPe: peMax,
        maxPd: pdMax,
        pvCurrent,
        peCurrent,
        pdCurrent,
        armor: Number(derived.armor || 0),
        dodge: Number(derived.esquivaMod || 0),
        block: Number(derived.selectedBlock || 0),
        initiative: Number(derived.initiativeMod || 0),
        nexo: Number(character.attributes?.nexo || 0),
        bestAttack
      };
    });

    return {
      participants: roster,
      count: roster.length,
      avgLevel: averageFrom(roster, (entry) => entry.level),
      avgMaxPv: averageFrom(roster, (entry) => entry.maxPv),
      avgMaxPe: averageFrom(roster, (entry) => entry.maxPe),
      avgMaxPd: averageFrom(roster, (entry) => entry.maxPd),
      avgArmor: averageFrom(roster, (entry) => entry.armor),
      avgDodge: averageFrom(roster, (entry) => entry.dodge),
      avgBlock: averageFrom(roster, (entry) => entry.block),
      avgInitiative: averageFrom(roster, (entry) => entry.initiative),
      avgNexo: averageFrom(roster, (entry) => entry.nexo),
      avgAttack: averageFrom(roster, (entry) => entry.bestAttack.total),
      pvReadiness: averageFrom(roster, (entry) => (entry.maxPv ? entry.pvCurrent / entry.maxPv : 1)),
      peReadiness: averageFrom(roster, (entry) => (entry.maxPe ? entry.peCurrent / entry.maxPe : 1)),
      pdReadiness: averageFrom(roster, (entry) => (entry.maxPd ? entry.pdCurrent / entry.maxPd : 1))
    };
  }

  function createEncounterCard(config, metrics, pressureIndex) {
    const count = config.count(metrics.count, pressureIndex);
    const damageScale = Math.max(1, Math.round(metrics.avgNexo || Math.max(1, metrics.avgLevel / 2)));
    const expectedHeroHit = 3 + (metrics.avgLevel * 1.1) + (metrics.avgNexo * 1.3) + (metrics.avgAttack * 0.3);
    const totalPv = Math.max(
      count * 6,
      roundToStep(expectedHeroHit * metrics.count * config.duration[pressureIndex], config.label === 'Boss' ? 5 : 2)
    );
    const eachPv = Math.max(6, roundToStep(totalPv / count, count >= 4 ? 1 : 5));
    const targetDamage = (metrics.avgMaxPv * config.damageShare[pressureIndex]) + (metrics.avgArmor * 1.5);
    const damage = getDamageProfileForAverage(targetDamage, damageScale);

    return {
      title: config.archetype,
      count,
      totalPv,
      eachPv,
      armor: Math.max(0, roundToStep(metrics.avgArmor + config.armorDelta + (pressureIndex === 2 ? 1 : 0), 1)),
      dodge: Math.max(0, roundToStep(metrics.avgDodge + config.dodgeDelta + pressureIndex, 1)),
      block: Math.max(10, roundToStep(metrics.avgBlock + config.blockDelta + pressureIndex, 1)),
      attack: Math.max(2, roundToStep(metrics.avgAttack + config.attackDelta + pressureIndex, 1)),
      initiative: Math.max(0, roundToStep(metrics.avgInitiative + config.attackDelta, 1)),
      pe: Math.max(0, roundToStep(metrics.avgMaxPe * config.peFactor, 1)),
      pd: Math.max(0, roundToStep(metrics.avgMaxPd * config.pdFactor, 1)),
      damageScale,
      damage,
      note: config.cardNote
    };
  }

  function buildEncounterBlueprint() {
    const participants = getEncounterParticipants();
    if (!participants.length) return null;

    const metrics = buildEncounterMetrics(participants);
    const config = ENCOUNTER_TYPE_CONFIG[encounterState.type] || ENCOUNTER_TYPE_CONFIG.skirmish;
    const pressureKey = encounterState.pressure in ENCOUNTER_PRESSURE_LABELS ? encounterState.pressure : 'balanced';
    const pressureIndex = ['light', 'balanced', 'heavy'].indexOf(pressureKey);
    const pressureLabel = ENCOUNTER_PRESSURE_LABELS[pressureKey];
    const cards = [createEncounterCard(config, metrics, pressureIndex)];

    if (encounterState.type === 'boss' && metrics.count >= 4) {
      const supportProfile = createEncounterCard(ENCOUNTER_TYPE_CONFIG.swarm, metrics, Math.max(0, pressureIndex - 1));
      cards.push({
        ...supportProfile,
        title: 'Escorta opcional',
        count: Math.max(1, Math.ceil(metrics.count / 2) - (pressureIndex === 0 ? 1 : 0)),
        eachPv: Math.max(6, roundToStep(supportProfile.eachPv * 0.55, 1)),
        totalPv: Math.max(10, roundToStep(Math.max(1, Math.ceil(metrics.count / 2) - (pressureIndex === 0 ? 1 : 0)) * Math.max(6, roundToStep(supportProfile.eachPv * 0.55, 1)), 2)),
        armor: Math.max(0, supportProfile.armor - 1),
        dodge: Math.max(0, supportProfile.dodge),
        block: Math.max(10, supportProfile.block - 1),
        attack: Math.max(2, supportProfile.attack),
        note: 'Use so se o boss solo estiver sendo apagado cedo demais ou se quiser segurar flancos.'
      });
    }

    const readinessLabel = getEncounterReadinessLabel(metrics);
    const names = metrics.participants.map((entry) => `${entry.name} (Nv ${entry.level})`).join(', ');
    const blockLines = [
      `${config.label} • pressao ${pressureLabel.toLowerCase()}`,
      `Participantes (${metrics.count}): ${names}`,
      `Media do grupo: nivel ${metrics.avgLevel.toFixed(1)} • PV ${Math.round(metrics.avgMaxPv)} • ataque ${Math.round(metrics.avgAttack)} • armadura ${Math.round(metrics.avgArmor)}`,
      ...cards.map((card) => `${card.title} x${card.count} | PV ${card.eachPv} cada (${card.totalPv} total) | Arm ${card.armor} | Esquiva +${card.dodge} | Bloqueio ${card.block} | Ataque +${card.attack} | Dano ${card.damage.label} (${card.damage.expression}, media ${card.damage.average}) | PE ${card.pe} | PD ${card.pd}`),
      `Leitura da mesa: ${readinessLabel}.`
    ];

    if (readinessLabel !== 'Grupo praticamente inteiro') {
      blockLines.push('Ajuste sugerido: reduza um passo de pressao ou corte 10% a 15% do PV total se o encontro vier logo depois de outra luta.');
    }

    return {
      config,
      metrics,
      pressureLabel,
      readinessLabel,
      cards,
      block: blockLines.join('\n')
    };
  }

  function renderEncounterPlanner() {
    if (!refs.masterEncounterParticipants || !refs.masterEncounterSummary || !refs.masterEncounterOutput || !refs.masterEncounterBlock) return;

    ensureEncounterSelection();
    if (refs.masterEncounterType) refs.masterEncounterType.value = encounterState.type;
    if (refs.masterEncounterPressure) refs.masterEncounterPressure.value = encounterState.pressure;

    const selectedIds = new Set(encounterState.selectedIds || []);
    const characters = getCharacters();

    refs.masterEncounterParticipants.innerHTML = characters.length
      ? characters.map((character) => {
          const active = selectedIds.has(character.id);
          return `
            <button
              type="button"
              class="secondary-button small-button master-encounter-participant${active ? ' is-active' : ''}"
              data-action="toggle-encounter-participant"
              data-character-id="${escapeHtml(character.id)}"
            >
              <strong>${escapeHtml(character.identity?.name || 'Sem nome')}</strong>
              <span>${escapeHtml(character.identity?.className || 'Sem classe')} • Nv ${Number(character.identity?.level || 1)}</span>
            </button>
          `;
        }).join('')
      : '<div class="master-empty-state">Nenhuma ficha carregada para usar como base.</div>';

    const blueprint = buildEncounterBlueprint();
    lastEncounterBlueprint = blueprint;

    if (!blueprint) {
      refs.masterEncounterSummary.innerHTML = '<div class="master-empty-state">Marque pelo menos uma ficha para gerar o encontro.</div>';
      refs.masterEncounterOutput.innerHTML = '';
      refs.masterEncounterBlock.value = '';
      if (refs.masterEncounterCopyButton) refs.masterEncounterCopyButton.disabled = true;
      return;
    }

    const primaryCard = blueprint.cards[0];
    refs.masterEncounterSummary.innerHTML = `
      <article class="info-card master-overview-card">
        <span class="master-overview-label">Participantes</span>
        <strong class="master-overview-value">${blueprint.metrics.count}</strong>
        <p class="subtle">${escapeHtml(blueprint.metrics.participants.map((entry) => entry.name).join(', '))}</p>
      </article>
      <article class="info-card master-overview-card">
        <span class="master-overview-label">Nivel medio</span>
        <strong class="master-overview-value">${blueprint.metrics.avgLevel.toFixed(1)}</strong>
        <p class="subtle">Ataque medio ${Math.round(blueprint.metrics.avgAttack)} e Nexo medio ${Math.round(blueprint.metrics.avgNexo)}</p>
      </article>
      <article class="info-card master-overview-card">
        <span class="master-overview-label">PV sugerido</span>
        <strong class="master-overview-value">${primaryCard.totalPv}</strong>
        <p class="subtle">${primaryCard.count} inimigo(s) • ${primaryCard.eachPv} PV por unidade na proposta principal.</p>
      </article>
      <article class="info-card master-overview-card">
        <span class="master-overview-label">Dano alvo</span>
        <strong class="master-overview-value">${primaryCard.damage.label}</strong>
        <p class="subtle">${primaryCard.damage.expression} • media ${primaryCard.damage.average}</p>
      </article>
      <article class="info-card master-overview-card">
        <span class="master-overview-label">Leitura</span>
        <strong class="master-overview-value">${escapeHtml(blueprint.readinessLabel)}</strong>
        <p class="subtle">${escapeHtml(blueprint.pressureLabel)} para ${escapeHtml(blueprint.config.label.toLowerCase())}.</p>
      </article>
    `;

    refs.masterEncounterOutput.innerHTML = blueprint.cards.map((card, index) => `
      <article class="info-card master-encounter-card">
        <div class="master-encounter-head">
          <div>
            <h4>${escapeHtml(card.title)}</h4>
            <p class="subtle">${escapeHtml(blueprint.config.label)} • ${escapeHtml(blueprint.pressureLabel)}</p>
          </div>
          <span class="stat-tag">x${card.count}</span>
        </div>
        <div class="master-encounter-stats">
          <div class="master-encounter-stat">
            <span>PV</span>
            <strong>${card.eachPv}</strong>
            <small class="subtle">${card.totalPv} total</small>
          </div>
          <div class="master-encounter-stat">
            <span>Defesa</span>
            <strong>Arm ${card.armor}</strong>
            <small class="subtle">Esquiva +${card.dodge}</small>
          </div>
          <div class="master-encounter-stat">
            <span>Bloqueio</span>
            <strong>${card.block}</strong>
            <small class="subtle">Iniciativa +${card.initiative}</small>
          </div>
          <div class="master-encounter-stat">
            <span>Ataque</span>
            <strong>+${card.attack}</strong>
            <small class="subtle">${escapeHtml(card.damage.label)}</small>
          </div>
          <div class="master-encounter-stat">
            <span>Dano</span>
            <strong>${escapeHtml(card.damage.expression)}</strong>
            <small class="subtle">media ${card.damage.average}</small>
          </div>
          <div class="master-encounter-stat">
            <span>Recursos</span>
            <strong>PE ${card.pe}</strong>
            <small class="subtle">PD ${card.pd}</small>
          </div>
        </div>
        <div class="master-encounter-note">
          <strong>Uso de mesa:</strong> ${escapeHtml(card.note)}
        </div>
        <div class="master-encounter-card-actions">
          <button class="secondary-button small-button" type="button" data-action="create-enemy-from-card" data-card-index="${index}">
            Criar ficha
          </button>
        </div>
      </article>
    `).join('');

    refs.masterEncounterBlock.value = blueprint.block;
    if (refs.masterEncounterCopyButton) refs.masterEncounterCopyButton.disabled = false;
  }

  function getActiveMasterCompanion() {
    const character = getSelectedCharacter();
    if (!character) return null;
    if (!getCompanions(character).length) return null;

    if (activeMasterCompanionIndex === null || activeMasterCompanionIndex >= character.companions.length) {
      activeMasterCompanionIndex = 0;
    }

    return character.companions[activeMasterCompanionIndex] || null;
  }

  function createMasterCompanion(name) {
    return window.AppSystem.createCompanion({ name: name || '' });
  }

  function setMasterCompanionResult(message, tone = 'neutral') {
    if (!refs.masterCompanionBulkResult) return;
    refs.masterCompanionBulkResult.textContent = message;
    refs.masterCompanionBulkResult.dataset.tone = tone;
  }

  function openMasterCompanionDialog(characterId, companionIndex = 0) {
    const targetCharacterId = characterId || refs.masterCharacterSelect.value;
    if (targetCharacterId) refs.masterCharacterSelect.value = targetCharacterId;

    const character = getSelectedCharacter();
    if (!character) return;

    activeMasterCompanionIndex = Math.max(0, Math.min(Number(companionIndex || 0), Math.max(0, character.companions.length - 1)));
    renderEditorV31();
    renderMasterCompanionDialog();
    companionUi.openDialog(refs.masterCompanionDialog);
  }

  function closeMasterCompanionDialog() {
    companionUi.closeDialog(refs.masterCompanionDialog);
  }

  function getSearchableText(character) {
    return [
      character.identity?.name,
      character.identity?.className,
      character.resources?.status,
      character.identity?.summary,
      character.masterNotes,
      getSessionTags(character).map((tag) => getSessionTagLabel(tag)).join(' '),
      getCompanions(character).map((entry) => entry.name || '').join(' ')
    ]
      .join(' ')
      .toLowerCase();
  }

  function getCharacterAlertData(character) {
    const derived = window.AppSystem.calculateDerived(character);
    const pvCurrent = Number(character.resources?.pvCurrent || 0);
    const peCurrent = Number(character.resources?.peCurrent || 0);
    const pdCurrent = Number(character.resources?.pdCurrent || 0);
    const instability = Number(character.resources?.instability || 0);
    const tags = getSessionTags(character);
    const companions = getCompanions(character);

    const pvPct = percent(pvCurrent, Number(derived.maxPv || 0));
    const pePct = percent(peCurrent, Number(derived.maxPe || 0));
    const pdPct = percent(pdCurrent, Number(derived.maxPd || 0));

    const isAbsent = tags.includes('ausente');
    const isFocus = tags.includes('focus');
    const isLowPv = pvPct > 0 && pvPct <= 50;
    const isLowPe = pePct > 0 && pePct <= 35;
    const isLowPd = pdPct > 0 && pdPct <= 35;
    const highInstability = instability >= 4 || tags.includes('instavel');
    const isInjured = tags.includes('ferido') || isLowPv;
    const underPressure = tags.includes('pressao');

    let alertScore = 0;
    if (isAbsent) alertScore += 3;
    if (highInstability) alertScore += 2;
    if (isInjured) alertScore += 1;
    if (isLowPe) alertScore += 1;
    if (isLowPd) alertScore += 1;
    if (underPressure) alertScore += 1;

    return {
      derived,
      companions,
      companionCount: companions.length,
      hasCompanions: companions.length > 0,
      pvCurrent,
      peCurrent,
      pdCurrent,
      instability,
      isAbsent,
      isFocus,
      isLowPv,
      isLowPe,
      isLowPd,
      highInstability,
      isInjured,
      underPressure,
      isAlert: isAbsent || highInstability || isInjured || isLowPe || isLowPd || underPressure,
      alertScore
    };
  }

  function matchesSearch(character) {
    const query = String(refs.masterSearchInput?.value || '')
      .trim()
      .toLowerCase();
    if (!query) return true;
    return getSearchableText(character).includes(query);
  }

  function matchesQuickFilter(character) {
    const filter = refs.masterQuickFilter?.value || 'all';
    const alertData = getCharacterAlertData(character);

    switch (filter) {
      case 'alert':
        return alertData.isAlert;
      case 'instability':
        return alertData.highInstability;
      case 'entities':
        return alertData.hasCompanions;
      case 'absent':
        return alertData.isAbsent;
      case 'focus':
        return alertData.isFocus;
      default:
        return true;
    }
  }

  function getVisibleCharacters() {
    return getCharacters()
      .filter((character) => matchesSearch(character) && matchesQuickFilter(character))
      .sort((left, right) => {
        const alertDelta = getCharacterAlertData(right).alertScore - getCharacterAlertData(left).alertScore;
        if (alertDelta) return alertDelta;
        return String(left.identity?.name || '').localeCompare(String(right.identity?.name || ''), 'pt-BR');
      });
  }

  function getCardTags(character, alertData) {
    const tags = getSessionTags(character).map((tag) => ({
      label: getSessionTagLabel(tag),
      tone: 'default'
    }));

    if (alertData.isLowPv) tags.push({ label: 'PV baixo', tone: 'alert' });
    if (alertData.highInstability) tags.push({ label: 'Instabilidade alta', tone: 'alert' });
    if (alertData.isLowPe) tags.push({ label: 'PE baixo', tone: 'alert' });
    if (alertData.hasCompanions) tags.push({ label: `Entidades ${alertData.companionCount}`, tone: 'neutral' });

    return tags.slice(0, 6);
  }

  function getCompanionListMarkup(character) {
    const companions = getCompanions(character);
    if (!companions.length) {
      return '<p class="subtle top-gap-small">Sem entidades registradas.</p>';
    }

    return `
      <ul class="master-companion-list">
        ${companions.map((entry) => {
          const details = [
            `${Number(entry.pvCurrent || 0)}/${Number(entry.pvMax || 0)} PV`,
            entry.status ? String(entry.status) : ''
          ].filter(Boolean).join(' | ');

          return `
            <li>
              <div class="master-companion-list-copy">
                <strong>${escapeHtml(entry.name || 'Sem nome')}</strong>
                <span>${escapeHtml(details || 'Sem status')}</span>
              </div>
              <button
                class="secondary-button small-button"
                type="button"
                data-action="add-companion-to-encounter"
                data-character-id="${escapeHtml(character.id)}"
                data-companion-id="${escapeHtml(entry.id || '')}"
              >
                Entrar em combate
              </button>
            </li>
          `;
        }).join('')}
      </ul>
    `;
  }

  function ensureLogMount() {
    let mount = document.getElementById('masterActivityLog');
    if (mount) return mount;

    const host = refs.masterLogMount;
    if (!host) return null;

    const section = document.createElement('section');
    section.className = 'glass-card panel-block';
    section.innerHTML = `
      <div class="section-title-row">
        <h3>Log do mestre</h3>
        <p class="subtle">Mudanças detectadas enquanto este painel estiver aberto.</p>
      </div>
      <div id="masterActivityLog" class="stack-list master-log-list"></div>
    `;

    host.appendChild(section);
    return section.querySelector('#masterActivityLog');
  }

  function percent(current, max) {
    return window.AppCombatUtils?.percent
      ? window.AppCombatUtils.percent(current, max)
      : (!max || max <= 0 ? 0 : Math.max(0, Math.min(100, Math.round((current / max) * 100))));
  }

  function createBarShell(key) {
    const shell = document.createElement('div');
    shell.className = 'resource-bar-shell';
    shell.innerHTML = `
      <div class="resource-bar-track">
        <div class="resource-bar-fill bar-${key}"></div>
      </div>
      <div class="resource-bar-meta">
        <span data-role="resource-values">0/0</span>
        <span data-role="resource-percent">0%</span>
      </div>
    `;
    return shell;
  }

  function updateShell(shell, current, max) {
    const pct = percent(current, max);
    const fill = shell.querySelector('.resource-bar-fill');
    const values = shell.querySelector('[data-role="resource-values"]');
    const pctLabel = shell.querySelector('[data-role="resource-percent"]');

    if (fill) fill.style.width = `${pct}%`;
    if (values) values.textContent = `${current}/${max}`;
    if (pctLabel) pctLabel.textContent = `${pct}%`;
  }

  function getStoredLog() {
    try {
      return JSON.parse(sessionStorage.getItem('omnivita-master-log-v31') || '[]');
    } catch (error) {
      return [];
    }
  }

  function setStoredLog(entries) {
    try {
      sessionStorage.setItem('omnivita-master-log-v31', JSON.stringify(entries.slice(0, 40)));
    } catch (error) {
      console.error(error);
    }
  }

  function renderLog() {
    const mount = ensureLogMount();
    if (!mount) return;

    const entries = getStoredLog();
    if (!entries.length) {
      mount.innerHTML = '<div class="master-log-empty">Nenhuma mudança detectada ainda.</div>';
      return;
    }

    mount.innerHTML = entries.map((entry) => `
      <article class="master-log-item">
        <div class="master-log-head">
          <strong>${escapeHtml(entry.name)}</strong>
          <span>${escapeHtml(entry.time)}</span>
        </div>
        <div class="master-log-body">${escapeHtml(entry.message)}</div>
      </article>
    `).join('');
  }

  function appendLog(name, message) {
    const entries = getStoredLog();
    const now = new Date();

    entries.unshift({
      name,
      message,
      time: now.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    });

    setStoredLog(entries);
    renderLog();
  }

  function snapshotCharacter(character) {
    const alertData = getCharacterAlertData(character);
    return {
      id: character.id,
      name: character.identity?.name || 'Sem nome',
      pv: alertData.pvCurrent,
      pe: alertData.peCurrent,
      pd: alertData.pdCurrent,
      instability: alertData.instability,
      status: String(character.resources?.status || ''),
      masterNotes: String(character.masterNotes || ''),
      companions: alertData.companionCount,
      companionsSignature: alertData.companions
        .map((entry) => `${entry.id || entry.name}:${Number(entry.pvCurrent || 0)}/${Number(entry.pvMax || 0)}:${String(entry.status || '')}`)
        .join('|'),
      sessionTagsSignature: getSessionTags(character).join('|'),
      maxPv: Number(alertData.derived.maxPv || 0),
      maxPe: Number(alertData.derived.maxPe || 0),
      maxPd: Number(alertData.derived.maxPd || 0)
    };
  }

  function cloneSnapshot() {
    const output = new Map();
    getCharacters().forEach((character) => {
      output.set(character.id, snapshotCharacter(character));
    });
    return output;
  }

  function getLiveSignature() {
    return JSON.stringify(
      getCharacters().map((character) => snapshotCharacter(character))
    );
  }

  function diffAndLog(previous, next) {
    next.forEach((current, id) => {
      const before = previous.get(id);
      if (!before) return;

      if (before.pv !== current.pv) appendLog(current.name, `PV: ${before.pv} → ${current.pv}`);
      if (before.pe !== current.pe) appendLog(current.name, `PE: ${before.pe} → ${current.pe}`);
      if (before.pd !== current.pd) appendLog(current.name, `PD: ${before.pd} → ${current.pd}`);
      if (before.instability !== current.instability) appendLog(current.name, `Instabilidade: ${before.instability} → ${current.instability}`);
      if (before.status !== current.status) appendLog(current.name, `Status: ${before.status || '—'} → ${current.status || '—'}`);
      if (before.masterNotes !== current.masterNotes) appendLog(current.name, 'Notas do mestre atualizadas');
      if (before.companions !== current.companions) appendLog(current.name, `Entidades: ${before.companions} → ${current.companions}`);
      if (before.companionsSignature !== current.companionsSignature) appendLog(current.name, 'Mini-fichas atualizadas');
      if (before.sessionTagsSignature !== current.sessionTagsSignature) appendLog(current.name, 'Marcadores da sessao atualizados');
    });
  }

  function renderOverviewSummary() {
    if (!refs.masterOverviewSummary) return;

    const characters = getCharacters();
    const visibleCharacters = getVisibleCharacters();
    const visibleAlerts = visibleCharacters.filter((character) => getCharacterAlertData(character).isAlert).length;
    const highInstability = characters.filter((character) => getCharacterAlertData(character).highInstability).length;
    const absentCount = characters.filter((character) => getCharacterAlertData(character).isAbsent).length;
    const focusCount = characters.filter((character) => getCharacterAlertData(character).isFocus).length;
    const companionOwners = characters.filter((character) => getCharacterAlertData(character).hasCompanions).length;
    const totalCompanions = characters.reduce((total, character) => total + getCompanions(character).length, 0);

    if (refs.masterVisibleCount) {
      refs.masterVisibleCount.textContent = `${visibleCharacters.length}/${characters.length} visiveis`;
    }

    if (refs.masterAlertCount) {
      refs.masterAlertCount.textContent = `${visibleAlerts} alertas`;
    }

    refs.masterOverviewSummary.innerHTML = `
      <article class="info-card master-overview-card">
        <span class="master-overview-label">Painel atual</span>
        <strong class="master-overview-value">${visibleCharacters.length}</strong>
        <p class="subtle">Fichas batendo com a busca e o filtro rapido.</p>
      </article>
      <article class="info-card master-overview-card">
        <span class="master-overview-label">Alertas</span>
        <strong class="master-overview-value">${visibleAlerts}</strong>
        <p class="subtle">Ausentes, instabilidade alta ou recursos em zona de risco.</p>
      </article>
      <article class="info-card master-overview-card">
        <span class="master-overview-label">Instabilidade alta</span>
        <strong class="master-overview-value">${highInstability}</strong>
        <p class="subtle">Personagens em 4+ ou marcados como instaveis.</p>
      </article>
      <article class="info-card master-overview-card">
        <span class="master-overview-label">Entidades ativas</span>
        <strong class="master-overview-value">${totalCompanions}</strong>
        <p class="subtle">${companionOwners} fichas com mini-fichas abertas na sessao.</p>
      </article>
      <article class="info-card master-overview-card">
        <span class="master-overview-label">Sessao</span>
        <strong class="master-overview-value">${absentCount}</strong>
        <p class="subtle">Ausentes agora. ${focusCount} personagem(ns) estao marcados em foco.</p>
      </article>
    `;
  }

  function renderCharacterCardsV31() {
    refs.masterCharacterList.innerHTML = '';
    const characters = getVisibleCharacters();

    if (!characters.length) {
      refs.masterCharacterList.innerHTML = `
        <div class="master-empty-state">
          Nenhuma ficha combina com a busca atual. Limpe os filtros para voltar ao panorama completo.
        </div>
      `;
      return;
    }

    characters.forEach((character) => {
      const alertData = getCharacterAlertData(character);
      const derived = alertData.derived;
      const sharedActorActive = hasCharacterSharedActorInEncounter(character.id);
      const summary = character.identity?.summary || 'Sem resumo.';
      const companionsText = alertData.hasCompanions
        ? alertData.companions.slice(0, 3).map((entry) => entry.name || 'Sem nome').join(', ')
        : 'Sem mini-fichas.';

      const card = document.createElement('article');
      card.className = `info-card master-character-card${alertData.isAlert ? ' is-alert' : ''}`;
      card.dataset.characterId = character.id;
      card.innerHTML = `
        <div class="master-card-head">
          <div class="companion-head-left">
            ${avatarMarkup(character.identity?.image, character.identity?.name)}
            <div>
              <h4>${escapeHtml(character.identity?.name || 'Sem nome')}</h4>
              <p>${escapeHtml(character.identity?.className || 'Sem classe')} • Nivel ${Number(character.identity?.level || 1)}</p>
            </div>
          </div>
          <div class="card-actions-row compact-actions">
            <button class="secondary-button small-button" type="button" data-action="add-character-to-encounter" data-character-id="${escapeHtml(character.id)}" ${sharedActorActive ? 'disabled' : ''}>
              ${sharedActorActive ? 'Ja em combate' : 'Entrar em combate'}
            </button>
            <button class="secondary-button small-button" type="button" data-action="open-companions" data-character-id="${escapeHtml(character.id)}">
              Mini-fichas
            </button>
            <button class="secondary-button small-button" type="button" data-action="focus-character" data-character-id="${escapeHtml(character.id)}">
              Abrir
            </button>
          </div>
        </div>
        <div class="card-stat-row wrap-row top-gap-small">
          <span class="stat-tag">PV ${alertData.pvCurrent}/${derived.maxPv}</span>
          <span class="stat-tag">PE ${alertData.peCurrent}/${derived.maxPe}</span>
          <span class="stat-tag">PD ${alertData.pdCurrent}/${derived.maxPd}</span>
        </div>
        <div class="card-stat-row wrap-row">
          <span class="stat-tag">Inst ${alertData.instability}/6</span>
          <span class="stat-tag">PeV livres ${derived.peVAvailable}</span>
          <span class="stat-tag">Entidades ${alertData.companionCount}</span>
        </div>
        <p class="top-gap-small"><strong>Status:</strong> ${escapeHtml(normalizeCombatStatus(character.resources?.status, 'Vivo'))}</p>
        <p><strong>Entidades:</strong> ${escapeHtml(companionsText)}</p>
        <p class="subtle">${escapeHtml(summary)}</p>
      `;
      refs.masterCharacterList.appendChild(card);
    });
  }

  function renderCharacterCards() {
    refs.masterCharacterList.innerHTML = '';

    getCharacters().forEach((character) => {
      const derived = window.AppSystem.calculateDerived(character);
      const card = document.createElement('article');
      card.className = 'info-card';
      card.innerHTML = `
        <div class="companion-head-left">
          ${avatarMarkup(character.identity.image, character.identity.name)}
          <div>
            <h4>${escapeHtml(character.identity.name)}</h4>
            <p>${escapeHtml(character.identity.className)} • Nível ${character.identity.level}</p>
          </div>
        </div>
        <div class="card-stat-row wrap-row top-gap-small">
          <span class="stat-tag">PV ${character.resources.pvCurrent}/${derived.maxPv}</span>
          <span class="stat-tag">PE ${character.resources.peCurrent}/${derived.maxPe}</span>
          <span class="stat-tag">PD ${character.resources.pdCurrent}/${derived.maxPd}</span>
        </div>
        <div class="card-stat-row wrap-row">
          <span class="stat-tag">Inst ${character.resources.instability}/6</span>
          <span class="stat-tag">PeV livres ${derived.peVAvailable}</span>
          <span class="stat-tag">Entidades ${character.companions.length}</span>
        </div>
        <p><strong>Status:</strong> ${escapeHtml(character.resources.status || '—')}</p>
        <p class="subtle">${escapeHtml(character.identity.summary || 'Sem resumo.')}</p>
      `;
      refs.masterCharacterList.appendChild(card);
    });
  }

  function renderSelect() {
    const currentValue = refs.masterCharacterSelect.value;
    refs.masterCharacterSelect.innerHTML = '';

    getCharacters().forEach((character) => {
      const option = document.createElement('option');
      option.value = character.id;
      option.textContent = character.identity.name;
      refs.masterCharacterSelect.appendChild(option);
    });

    if (currentValue && getCharacters().some((character) => character.id === currentValue)) {
      refs.masterCharacterSelect.value = currentValue;
    } else if (refs.masterCharacterSelect.options.length) {
      refs.masterCharacterSelect.selectedIndex = 0;
    }
  }

  function renderEditor() {
    const character = getSelectedCharacter();
    if (!character) {
      refs.masterSelectedSummary.innerHTML = '';
      return;
    }

    refs.masterPvInput.value = character.resources.pvCurrent;
    refs.masterPeInput.value = character.resources.peCurrent;
    refs.masterPdInput.value = character.resources.pdCurrent;
    refs.masterInstabilityInput.value = character.resources.instability;
    refs.masterStatusInput.value = normalizeCombatStatus(character.resources.status, 'Vivo');
    refs.masterNotesInput.value = character.masterNotes || '';

    const derived = window.AppSystem.calculateDerived(character);
    refs.masterSelectedSummary.innerHTML = `
      <article class="info-card derived-card">
        <div class="companion-head-left">
          ${avatarMarkup(character.identity.image, character.identity.name)}
          <div>
            <h4>${escapeHtml(character.identity.name)}</h4>
            <p>${escapeHtml(character.identity.className)} • Nível ${character.identity.level}</p>
          </div>
        </div>
        <p class="top-gap-small">Máximos: PV ${derived.maxPv} • PE ${derived.maxPe} • PD ${derived.maxPd}</p>
        <p>Armadura ${derived.armor} • Iniciativa +${derived.initiativeMod}</p>
      </article>
      <article class="info-card derived-card">
        <h4>Combate</h4>
        <p>Esquiva +${derived.esquivaMod}</p>
        <p>Bloqueio ${derived.selectedBlock}</p>
        <p>Manifestação +${derived.manifestationMod}</p>
      </article>
      <article class="info-card derived-card">
        <h4>Progressão</h4>
        <p>PeV totais ${derived.peVGranted}</p>
        <p>PeV gastos ${derived.peVSpent.total}</p>
        <p>PeV livres ${derived.peVAvailable}</p>
      </article>
      <article class="info-card derived-card">
        <h4>Formas / ajudantes</h4>
        <p>Total: ${character.companions.length}</p>
        <p>${escapeHtml(character.companions.map((entry) => entry.name).filter(Boolean).slice(0, 3).join(', ') || 'Sem registros.')}</p>
      </article>
    `;
  }

  function renderSessionTagEditor() {
    if (!refs.masterSessionTags) return;

    const character = getSelectedCharacter();
    if (!character) {
      refs.masterSessionTags.innerHTML = '<div class="master-empty-state">Selecione uma ficha para editar os marcadores da sessao.</div>';
      return;
    }

    const tags = new Set(getSessionTags(character));
    refs.masterSessionTags.innerHTML = `
      <div class="master-tag-row">
        ${SESSION_TAG_OPTIONS.map((option) => `
          <button
            type="button"
            class="secondary-button small-button master-session-tag${tags.has(option.value) ? ' is-active' : ''}"
            data-action="toggle-session-tag"
            data-tag="${escapeHtml(option.value)}"
          >
            ${escapeHtml(option.label)}
          </button>
        `).join('')}
      </div>
      <p class="subtle">Use estes marcadores para acompanhar estado de mesa sem entrar nas notas.</p>
    `;
  }

  function renderEditorV31() {
    const character = getSelectedCharacter();
    if (!character) {
      refs.masterSelectedSummary.innerHTML = '';
      if (refs.masterOpenCompanionManagerButton) {
        refs.masterOpenCompanionManagerButton.textContent = 'Gerenciar mini-fichas';
        refs.masterOpenCompanionManagerButton.disabled = true;
      }
      renderSessionTagEditor();
      return;
    }

    if (refs.masterOpenCompanionManagerButton) {
      refs.masterOpenCompanionManagerButton.disabled = false;
      refs.masterOpenCompanionManagerButton.textContent = `Gerenciar mini-fichas (${getCompanions(character).length})`;
    }

    refs.masterPvInput.value = Number(character.resources?.pvCurrent || 0);
    refs.masterPeInput.value = Number(character.resources?.peCurrent || 0);
    refs.masterPdInput.value = Number(character.resources?.pdCurrent || 0);
    refs.masterInstabilityInput.value = Number(character.resources?.instability || 0);
    refs.masterStatusInput.value = normalizeCombatStatus(character.resources?.status, 'Vivo');
    refs.masterNotesInput.value = character.masterNotes || '';

    const alertData = getCharacterAlertData(character);
    const derived = alertData.derived;
    refs.masterSelectedSummary.innerHTML = `
      <article class="info-card derived-card">
        <div class="companion-head-left">
          ${avatarMarkup(character.identity?.image, character.identity?.name)}
          <div>
            <h4>${escapeHtml(character.identity?.name || 'Sem nome')}</h4>
            <p>${escapeHtml(character.identity?.className || 'Sem classe')} • Nivel ${Number(character.identity?.level || 1)}</p>
          </div>
        </div>
        <p class="top-gap-small">Maximos: PV ${derived.maxPv} • PE ${derived.maxPe} • PD ${derived.maxPd}</p>
        <p>Armadura ${derived.armor} • Iniciativa +${derived.initiativeMod}</p>
        <p>Status atual: ${escapeHtml(normalizeCombatStatus(character.resources?.status, 'Vivo'))}</p>
      </article>
      <article class="info-card derived-card">
        <h4>Combate</h4>
        <p>Esquiva +${derived.esquivaMod}</p>
        <p>Bloqueio ${derived.selectedBlock}</p>
        <p>Manifestacao +${derived.manifestationMod}</p>
        <p>Instabilidade ${alertData.instability}/6</p>
      </article>
      <article class="info-card derived-card">
        <h4>Progressao</h4>
        <p>PeV totais ${derived.peVGranted}</p>
        <p>PeV gastos ${derived.peVSpent.total}</p>
        <p>PeV livres ${derived.peVAvailable}</p>
      </article>
      <article class="info-card derived-card">
        <h4>Notas do mestre</h4>
        <p class="subtle">${escapeMultiline(character.masterNotes || 'Sem notas do mestre.')}</p>
      </article>
      <article class="info-card derived-card">
        <h4>Formas / ajudantes</h4>
        <p>Total: ${alertData.companionCount}</p>
        ${getCompanionListMarkup(character)}
      </article>
    `;

    renderSessionTagEditor();
  }

  function formatSigned(value) {
    return companionUi.formatSigned(value);
  }

  function getCompanionSkillTotal(entry, skill) {
    return window.AppSystem.getCompanionSkillTotal(entry, skill);
  }

  function renderMasterCompanionSkills(entry) {
    if (!refs.masterCompanionSkillsView) return;
    companionUi.renderCompanionSkills(refs.masterCompanionSkillsView, entry, {
      mode: 'readonly',
      itemClass: 'info-card skill-inline-card master-readonly-row',
      emptyText: 'Nenhuma pericia cadastrada.'
    });
    return;

    const skills = Array.isArray(entry?.skills) ? entry.skills : [];
    if (!skills.length) {
      refs.masterCompanionSkillsView.innerHTML = '<div class="empty-state">Nenhuma pericia cadastrada.</div>';
      return;
    }

    refs.masterCompanionSkillsView.innerHTML = skills.map((skill, index) => `
      <article class="info-card skill-inline-card master-readonly-row">
        <div class="minor-title-row">
          <strong>${escapeHtml(skill.name || `Pericia ${index + 1}`)}</strong>
          <span class="skill-total-badge">${formatSigned(getCompanionSkillTotal(entry, skill))}</span>
        </div>
        <p class="subtle">Valor ${Number(skill.value || 0)} • ${escapeHtml(skill.attribute || 'destreza')}</p>
      </article>
    `).join('');
  }

  function renderMasterCompanionFacets(entry) {
    if (!refs.masterCompanionFacetsView) return;
    companionUi.renderCompanionFacets(refs.masterCompanionFacetsView, entry, {
      mode: 'readonly',
      itemClass: 'info-card master-readonly-row',
      emptyText: 'Nenhuma faceta cadastrada.'
    });
    return;

    const facets = Array.isArray(entry?.facets) ? entry.facets : [];
    if (!facets.length) {
      refs.masterCompanionFacetsView.innerHTML = '<div class="empty-state">Nenhuma faceta cadastrada.</div>';
      return;
    }

    refs.masterCompanionFacetsView.innerHTML = facets.map((facet, index) => `
      <article class="info-card master-readonly-row">
        <div class="minor-title-row">
          <strong>${escapeHtml(facet.name || `Faceta ${index + 1}`)}</strong>
          <span class="stat-tag">Rank ${Number(facet.rank || 1)}</span>
        </div>
        <p class="subtle">XP ${Number(facet.xp || 0)}</p>
      </article>
    `).join('');
  }

  function renderMasterCompanionDialog() {
    if (!refs.masterCompanionDialog) return;

    const character = getSelectedCharacter();
    const companions = getCompanions(character);

    refs.masterCompanionDialogTitle.textContent = character
      ? `Mini-fichas — ${character.identity?.name || 'Personagem'}`
      : 'Mini-fichas do personagem';

    if (!character || !companions.length) {
      activeMasterCompanionIndex = null;
      if (refs.masterCompanionPicker) {
        refs.masterCompanionPicker.innerHTML = '<div class="master-empty-state">Esse personagem ainda nao tem mini-fichas cadastradas.</div>';
      }
      companionUi.syncCompanionSticky(masterCompanionStickyRefs, null, {
        emptyName: 'Sem mini-ficha',
        emptyType: 'Sem tipo',
        emptyStatus: 'Sem status',
        squareAvatar: true
      });
      [
        refs.masterCompanionNameInput,
        refs.masterCompanionTypeInput,
        refs.masterCompanionStatusInput,
        refs.masterCompanionArmorInput,
        refs.masterCompanionPvCurrentInput,
        refs.masterCompanionPvMaxInput,
        refs.masterCompanionAttrForcaInput,
        refs.masterCompanionAttrDestrezaInput,
        refs.masterCompanionAttrSentidosInput,
        refs.masterCompanionAttrVigorInput,
        refs.masterCompanionAttrInteligenciaInput,
        refs.masterCompanionAttrNexoInput,
        refs.masterCompanionNotesInput
      ].forEach((element) => {
        if (element) element.value = '';
      });
      if (refs.masterCompanionSkillsView) refs.masterCompanionSkillsView.innerHTML = '<div class="empty-state">Nenhuma pericia cadastrada.</div>';
      if (refs.masterCompanionFacetsView) refs.masterCompanionFacetsView.innerHTML = '<div class="empty-state">Nenhuma faceta cadastrada.</div>';
      if (!refs.masterCompanionBulkInput?.value.trim()) {
        setMasterCompanionResult('Cole um bloco e aplique para atualizar sem editar alien por alien.', 'neutral');
      }
      return;
    }

    if (activeMasterCompanionIndex === null || activeMasterCompanionIndex >= companions.length) {
      activeMasterCompanionIndex = 0;
    }

    if (refs.masterCompanionPicker) {
      refs.masterCompanionPicker.innerHTML = companions.map((entry, index) => `
        <button
          type="button"
          class="secondary-button small-button master-companion-picker-item${index === activeMasterCompanionIndex ? ' is-active' : ''}"
          data-action="select-master-companion"
          data-companion-index="${index}"
        >
          <strong>${escapeHtml(entry.name || `Mini-ficha ${index + 1}`)}</strong>
          <span>${escapeHtml(entry.type || 'Sem tipo')}</span>
        </button>
      `).join('');
    }

    const entry = getActiveMasterCompanion();
    if (!entry) return;

    companionUi.syncCompanionSticky(masterCompanionStickyRefs, entry, {
      squareAvatar: true
    });
    companionUi.populateCompanionFields(masterCompanionFieldRefs, entry);

    renderMasterCompanionSkills(entry);
    renderMasterCompanionFacets(entry);

    if (!refs.masterCompanionBulkInput?.value.trim()) {
      setMasterCompanionResult(`Pronto para editar ${entry.name || 'a mini-ficha selecionada'}.`, 'neutral');
    }
  }

  function persistSelectedCharacterChanges(message) {
    const character = getSelectedCharacter();
    if (!character) return;

    lastLocalEditAt = Date.now();
    window.AppStorage.replaceCharacter(character.id, character);
    renderMasterNow();
    if (refs.masterCompanionDialog?.open) renderMasterCompanionDialog();
    setStatus(message || 'Salvo');
  }

  const persistSelectedCharacterChangesDebounced = debounce(function () {
    persistSelectedCharacterChanges('Mini-ficha salva');
  }, 260);

  function updateMasterCompanionFromDialog() {
    const entry = getActiveMasterCompanion();
    if (!entry) return;

    companionUi.applyCompanionFields(masterCompanionFieldRefs, entry);

    const character = getSelectedCharacter();
    if (!character) return;
    const normalized = window.AppSystem.normalizeCompanion(entry);
    character.companions[activeMasterCompanionIndex] = normalized;

    refs.masterCompanionPvCurrentInput.value = Number(normalized.pvCurrent || 0);
    refs.masterCompanionPvMaxInput.value = Number(normalized.pvMax || 0);
    companionUi.syncCompanionSticky(masterCompanionStickyRefs, normalized, {
      squareAvatar: true
    });

    persistSelectedCharacterChangesDebounced();
  }

  function findCompanionIndexByName(character, rawName) {
    const companions = getCompanions(character);
    const target = normalizeLooseText(rawName);
    if (!target) return -1;

    let exactIndex = companions.findIndex((entry) => normalizeLooseText(entry.name) === target);
    if (exactIndex >= 0) return exactIndex;

    return companions.findIndex((entry) => {
      const entryName = normalizeLooseText(entry.name);
      if (!entryName) return false;
      return entryName.includes(target) || target.includes(entryName);
    });
  }

  function ensureCompanionIndex(character, rawName) {
    const foundIndex = findCompanionIndexByName(character, rawName);
    if (foundIndex >= 0) return foundIndex;

    character.companions.push(createMasterCompanion(String(rawName || '').trim()));
    return character.companions.length - 1;
  }

  function parseTrailingNumber(text) {
    const arrowMatch = String(text || '').match(/->\s*(-?\d+)/);
    if (arrowMatch) return Number(arrowMatch[1]);

    const slashMatch = String(text || '').match(/(-?\d+)\s*\/\s*(-?\d+)/);
    if (slashMatch) {
      return { current: Number(slashMatch[1]), max: Number(slashMatch[2]) };
    }

    const numberMatches = String(text || '').match(/-?\d+/g);
    if (!numberMatches || !numberMatches.length) return null;
    return Number(numberMatches[numberMatches.length - 1]);
  }

  function applyCompanionScalarLine(entry, originalLine, normalizedLine) {
    const fieldAliases = {
      nome: 'name',
      tipo: 'type',
      status: 'status',
      armadura: 'armor',
      forca: 'forca',
      destreza: 'destreza',
      sentidos: 'sentidos',
      vigor: 'vigor',
      inteligencia: 'inteligencia',
      nexo: 'nexo'
    };

    if (/^pv\b/.test(normalizedLine)) {
      const slash = parseTrailingNumber(originalLine);
      if (slash && typeof slash === 'object') {
        entry.pvCurrent = Math.max(0, slash.current);
        entry.pvMax = Math.max(0, slash.max);
        return 'PV atualizado';
      }

      const targetValue = parseTrailingNumber(originalLine);
      if (targetValue === null) return '';

      if (/^pv max/.test(normalizedLine)) {
        entry.pvMax = Math.max(0, Number(targetValue || 0));
        entry.pvCurrent = Math.min(entry.pvCurrent, entry.pvMax);
        return 'PV maximo atualizado';
      }

      entry.pvCurrent = Math.max(0, Number(targetValue || 0));
      if (entry.pvMax) entry.pvCurrent = Math.min(entry.pvCurrent, entry.pvMax);
      return /^pv atual/.test(normalizedLine) ? 'PV atual atualizado' : 'PV atualizado';
    }

    const scalarField = Object.keys(fieldAliases).find((key) => normalizedLine.startsWith(`${key} `) || normalizedLine === key || normalizedLine.startsWith(`${key}:`) || normalizedLine.startsWith(`${key}=`));
    if (!scalarField) return '';

    const targetField = fieldAliases[scalarField];

    if (BULK_ATTRIBUTE_KEYS.includes(targetField)) {
      const nextValue = parseTrailingNumber(originalLine);
      if (nextValue === null || typeof nextValue === 'object') return '';
      entry.attributes[targetField] = Math.max(0, Number(nextValue || 0));
      return `${scalarField} atualizado`;
    }

    if (targetField === 'armor') {
      const nextArmor = parseTrailingNumber(originalLine);
      if (nextArmor === null || typeof nextArmor === 'object') return '';
      entry.armor = Math.max(0, Number(nextArmor || 0));
      return 'Armadura atualizada';
    }

    const textValue = originalLine
      .replace(/^[^:=]+[:=]\s*/i, '')
      .replace(/^(nome|tipo|status)\s+/i, '')
      .trim();

    entry[targetField] = textValue;
    return `${scalarField} atualizado`;
  }

  function applyCompanionSkillLine(entry, originalLine) {
    const text = originalLine.replace(/^(adicionar\s+)?(pericia|perícia|skill)\s+/i, '').trim();
    if (!text) return '';

    let attribute = '';
    let workingText = text;
    const trailingAttributeMatch = workingText.match(/\b(forca|destreza|sentidos|vigor|inteligencia|nexo)$/i);
    if (trailingAttributeMatch) {
      attribute = normalizeLooseText(trailingAttributeMatch[1]);
      workingText = workingText.slice(0, trailingAttributeMatch.index).trim();
    }

    let nextValue = null;
    let skillName = workingText;
    const arrowMatch = workingText.match(/->\s*(-?\d+)/);
    if (arrowMatch) {
      nextValue = Number(arrowMatch[1]);
      skillName = workingText.slice(0, arrowMatch.index).replace(/\d+\s*$/, '').trim();
    } else if (workingText.includes(':')) {
      const parts = workingText.split(':');
      skillName = parts.shift().trim();
      nextValue = parseTrailingNumber(parts.join(':'));
    } else {
      const trailingValue = workingText.match(/(-?\d+)\s*$/);
      if (trailingValue) {
        nextValue = Number(trailingValue[1]);
        skillName = workingText.slice(0, trailingValue.index).trim();
      }
    }

    skillName = skillName.trim();
    if (!skillName) return '';

    let skill = entry.skills.find((item) => normalizeLooseText(item.name) === normalizeLooseText(skillName));
    if (!skill) {
      skill = window.AppSystem.createCompanionSkillEntry({ name: skillName });
      entry.skills.push(skill);
    }

    skill.name = skillName;
    if (typeof nextValue === 'number' && !Number.isNaN(nextValue)) {
      skill.value = Math.max(0, nextValue);
    }
    if (attribute && BULK_ATTRIBUTE_KEYS.includes(attribute)) {
      skill.attribute = attribute;
    }

    return `Pericia ${skillName} atualizada`;
  }

  function applyCompanionFacetLine(entry, originalLine) {
    const text = originalLine.replace(/^(adicionar\s+)?faceta\s+/i, '').trim();
    if (!text) return '';

    const normalizedText = normalizeLooseText(text);
    const rankMatch = normalizedText.match(/\brank\s+(?:\d+\s*->\s*)?(\d+)/);
    const xpMatch = normalizedText.match(/\bxp\s+(?:\d+\s*->\s*)?(\d+)/);
    const splitIndex = text.search(/\b(rank|xp)\b/i);
    const facetName = (splitIndex >= 0 ? text.slice(0, splitIndex) : text).replace(/[:=]\s*$/, '').trim();
    if (!facetName) return '';

    let facet = entry.facets.find((item) => normalizeLooseText(item.name) === normalizeLooseText(facetName));
    if (!facet) {
      facet = window.AppSystem.createCompanionFacetEntry({ name: facetName });
      entry.facets.push(facet);
    }

    facet.name = facetName;
    if (rankMatch) facet.rank = Math.max(1, Number(rankMatch[1]));
    if (xpMatch) facet.xp = Math.max(0, Number(xpMatch[1]));

    return `Faceta ${facetName} atualizada`;
  }

  function applyCompanionNotesLine(entry, originalLine) {
    const match = originalLine.match(/^(nota|notas|obs|observacao|observação)\s*[:=]?\s*(.*)$/i);
    if (!match) return '';
    entry.notes = match[2] || '';
    return 'Notas atualizadas';
  }

  function applyMasterCompanionBulkUpdates() {
    const character = getSelectedCharacter();
    const rawInput = refs.masterCompanionBulkInput?.value || '';
    const lines = rawInput
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (!character || !lines.length) {
      setMasterCompanionResult('Cole um bloco com as mudancas antes de aplicar.', 'warning');
      return;
    }

    const commandStarts = ['nome', 'tipo', 'status', 'armadura', 'pv', 'forca', 'destreza', 'sentidos', 'vigor', 'inteligencia', 'nexo', 'pericia', 'perícia', 'skill', 'faceta', 'nota', 'notas', 'obs', 'observacao', 'observação', 'adicionar'];

    let targetIndex = activeMasterCompanionIndex;
    const applied = [];

    lines.forEach((line, index) => {
      const normalized = normalizeLooseText(line);

      const isTargetLine = !commandStarts.some((token) => normalized.startsWith(`${token} `) || normalized === token || normalized.startsWith(`${token}:`));
      if (isTargetLine || /^(selecionar|abrir|mini ficha|minificha|forma|entidade|alien|inserir)\b/.test(normalized)) {
        const rawName = line.replace(/^(selecionar|abrir|mini ficha|minificha|forma|entidade|alien|inserir)\s+/i, '').trim() || line.trim();
        targetIndex = ensureCompanionIndex(character, rawName);
        activeMasterCompanionIndex = targetIndex;
        applied.push(`Alvo ${character.companions[targetIndex].name || rawName}`);
        return;
      }

      if (targetIndex === null || targetIndex < 0) {
        targetIndex = ensureCompanionIndex(character, 'Nova mini-ficha');
        activeMasterCompanionIndex = targetIndex;
      }

      const entry = character.companions[targetIndex];
      let message = '';

      if (/^(adicionar\s+)?(pericia|perícia|skill)\b/.test(normalized)) {
        message = applyCompanionSkillLine(entry, line);
      } else if (/^(adicionar\s+)?faceta\b/.test(normalized)) {
        message = applyCompanionFacetLine(entry, line);
      } else if (/^(nota|notas|obs|observacao|observação)\b/.test(normalized)) {
        message = applyCompanionNotesLine(entry, line);
      } else {
        message = applyCompanionScalarLine(entry, line, normalized);
      }

      character.companions[targetIndex] = window.AppSystem.normalizeCompanion(entry);
      if (message) applied.push(message);
    });

    if (!applied.length) {
      setMasterCompanionResult('Nao consegui reconhecer esse bloco. Tente linhas simples como "Pelagornis" e "forca 4 -> 5".', 'warning');
      return;
    }

    persistSelectedCharacterChanges('Mini-fichas atualizadas');
    renderMasterCompanionDialog();
    setMasterCompanionResult(applied.join(' • '), 'success');
  }

  function enhanceCardBarsV31() {
    const cards = refs.masterCharacterList.querySelectorAll('.master-character-card[data-character-id]');

    cards.forEach((card) => {
      const character = window.AppStorage.getCharacterById(card.dataset.characterId);
      if (!character) return;

      const derived = window.AppSystem.calculateDerived(character);

      let mount = card.querySelector('.v28-master-card-enhanced');
      if (!mount) {
        mount = document.createElement('div');
        mount.className = 'master-resource-stack v28-master-card-enhanced';

        const summary = card.querySelector('.subtle');
        if (summary) {
          summary.insertAdjacentElement('beforebegin', mount);
        } else {
          card.appendChild(mount);
        }
      }

      const bars = [
        { key: 'pv', current: Number(character.resources?.pvCurrent || 0), max: Number(derived.maxPv || 0) },
        { key: 'pe', current: Number(character.resources?.peCurrent || 0), max: Number(derived.maxPe || 0) },
        { key: 'pd', current: Number(character.resources?.pdCurrent || 0), max: Number(derived.maxPd || 0) }
      ];

      mount.innerHTML = '';

      bars.forEach((bar) => {
        const shell = createBarShell(bar.key);
        updateShell(shell, bar.current, bar.max);
        mount.appendChild(shell);
      });
    });
  }

  function enhanceCardBars() {
    const cards = refs.masterCharacterList.querySelectorAll('.info-card');
    const characters = getCharacters();

    cards.forEach((card, index) => {
      const character = characters[index];
      if (!character) return;

      const derived = window.AppSystem.calculateDerived(character);

      let mount = card.querySelector('.v28-master-card-enhanced');
      if (!mount) {
        mount = document.createElement('div');
        mount.className = 'master-resource-stack v28-master-card-enhanced';

        const summary = card.querySelector('.subtle');
        if (summary) {
          summary.insertAdjacentElement('beforebegin', mount);
        } else {
          card.appendChild(mount);
        }
      }

      const bars = [
        { key: 'pv', current: Number(character.resources?.pvCurrent || 0), max: Number(derived.maxPv || 0) },
        { key: 'pe', current: Number(character.resources?.peCurrent || 0), max: Number(derived.maxPe || 0) },
        { key: 'pd', current: Number(character.resources?.pdCurrent || 0), max: Number(derived.maxPd || 0) }
      ];

      mount.innerHTML = '';

      bars.forEach((bar) => {
        const shell = createBarShell(bar.key);
        updateShell(shell, bar.current, bar.max);
        mount.appendChild(shell);
      });
    });
  }

  function enhanceSelectedSummary() {
    const summary = refs.masterSelectedSummary;
    const character = getSelectedCharacter();
    if (!summary || !character) return;

    const derived = window.AppSystem.calculateDerived(character);

    let card = summary.querySelector('#masterSummaryBarsCard');
    if (!card) {
      card = document.createElement('article');
      card.className = 'info-card derived-card v28-master-resource-card';
      card.id = 'masterSummaryBarsCard';
      summary.insertAdjacentElement('afterbegin', card);
    }

    card.innerHTML = `
      <h4>Recursos</h4>
      <div class="master-resource-stack">
        <div class="resource-bar-shell" data-bar="pv">
          <div class="resource-bar-track"><div class="resource-bar-fill bar-pv"></div></div>
          <div class="resource-bar-meta"><span data-role="resource-values">0/0</span><span data-role="resource-percent">0%</span></div>
        </div>
        <div class="resource-bar-shell" data-bar="pe">
          <div class="resource-bar-track"><div class="resource-bar-fill bar-pe"></div></div>
          <div class="resource-bar-meta"><span data-role="resource-values">0/0</span><span data-role="resource-percent">0%</span></div>
        </div>
        <div class="resource-bar-shell" data-bar="pd">
          <div class="resource-bar-track"><div class="resource-bar-fill bar-pd"></div></div>
          <div class="resource-bar-meta"><span data-role="resource-values">0/0</span><span data-role="resource-percent">0%</span></div>
        </div>
      </div>
    `;

    updateShell(
      card.querySelector('[data-bar="pv"]'),
      Number(character.resources?.pvCurrent || 0),
      Number(derived.maxPv || 0)
    );
    updateShell(
      card.querySelector('[data-bar="pe"]'),
      Number(character.resources?.peCurrent || 0),
      Number(derived.maxPe || 0)
    );
    updateShell(
      card.querySelector('[data-bar="pd"]'),
      Number(character.resources?.pdCurrent || 0),
      Number(derived.maxPd || 0)
    );
  }

  function renderMasterNow() {
    renderSelect();
    renderOverviewSummary();
    renderEncounterPlanner();
    renderEnemyLibrary();
    renderActiveEncounter();
    renderCharacterCardsV31();
    renderEditorV31();
    enhanceCardBarsV31();
    enhanceSelectedSummary();
    if (refs.masterCompanionDialog?.open) renderMasterCompanionDialog();
    if (document.querySelector('[data-panel=\"masterScenariosTab\"]')?.classList.contains('is-active')) {
      renderScenarioPanel();
    }
    renderLog();
  }

  let masterRefreshInFlight = false;
  let masterLiveSignature = getLiveSignature();
  let previousSnapshot = cloneSnapshot();
  let lastLocalEditAt = 0;

  async function pullRemoteState(source = 'sync') {
    if (masterRefreshInFlight) return;
    if (!window.AppStorage.refresh) return;

    masterRefreshInFlight = true;

    try {
      await window.AppStorage.refresh(false);
      const nextSignature = getLiveSignature();

      if (nextSignature !== masterLiveSignature) {
        masterLiveSignature = nextSignature;
        window.dispatchEvent(new CustomEvent('app-storage-updated', {
          detail: { source: 'remote-refresh-forced' }
        }));
      }

      if (source === 'realtime' || source === 'poll' || source === 'focus' || source === 'visible') {
        refs.masterStatus.textContent = 'Atualizado ao vivo';
        clearTimeout(setStatus.timer);
        setStatus.timer = setTimeout(() => {
          refs.masterStatus.textContent = 'Ao vivo';
        }, 1200);
      }
    } catch (error) {
      console.error(error);
      refs.masterStatus.textContent = 'Erro ao sincronizar.';
    } finally {
      masterRefreshInFlight = false;
    }
  }

  function persistEditor() {
    const character = getSelectedCharacter();
    if (!character) return;

    const derived = window.AppSystem.calculateDerived(character);
    character.resources.pvCurrent = Math.min(Math.max(0, Number(refs.masterPvInput.value || 0)), derived.maxPv);
    character.resources.peCurrent = Math.min(Math.max(0, Number(refs.masterPeInput.value || 0)), derived.maxPe);
    character.resources.pdCurrent = Math.min(Math.max(0, Number(refs.masterPdInput.value || 0)), derived.maxPd);
    character.resources.instability = Math.min(6, Math.max(0, Number(refs.masterInstabilityInput.value || 0)));
    character.resources.status = normalizeCombatStatus(refs.masterStatusInput.value, 'Vivo');
    character.masterNotes = refs.masterNotesInput.value.trim();
    character.masterSession = window.AppSystem.hydrateMasterSession(character.masterSession);

    lastLocalEditAt = Date.now();
    window.AppStorage.replaceCharacter(character.id, character);
    renderMasterNow();
    setStatus('Salvo');
  }

  function toggleSelectedSessionTag(tag) {
    const character = getSelectedCharacter();
    if (!character) return;

    const tags = new Set(getSessionTags(character));
    if (tags.has(tag)) {
      tags.delete(tag);
    } else {
      tags.add(tag);
      if (tag === 'ausente') tags.delete('presente');
      if (tag === 'presente') tags.delete('ausente');
    }

    character.masterSession = window.AppSystem.hydrateMasterSession({
      ...(character.masterSession || {}),
      tags: Array.from(tags)
    });

    lastLocalEditAt = Date.now();
    window.AppStorage.replaceCharacter(character.id, character);
    renderMasterNow();
    setStatus('Marcadores atualizados');
  }

  const persistEditorDebounced = debounce(persistEditor, 260);

  refs.masterCharacterSelect.addEventListener('change', () => {
    renderEditorV31();
    enhanceSelectedSummary();
    if (refs.masterCompanionDialog?.open) renderMasterCompanionDialog();
  });

  [
    refs.masterPvInput,
    refs.masterPeInput,
    refs.masterPdInput,
    refs.masterInstabilityInput,
    refs.masterStatusInput,
    refs.masterNotesInput
  ].forEach((element) => {
    element.addEventListener('input', persistEditorDebounced);
    element.addEventListener('change', persistEditorDebounced);
  });

  refs.masterSearchInput?.addEventListener('input', function () {
    renderOverviewSummary();
    renderCharacterCardsV31();
    enhanceCardBarsV31();
  });

  refs.masterQuickFilter?.addEventListener('change', function () {
    renderOverviewSummary();
    renderCharacterCardsV31();
    enhanceCardBarsV31();
  });

  refs.masterEncounterType?.addEventListener('change', function () {
    encounterState.type = refs.masterEncounterType.value || 'skirmish';
    saveEncounterState();
    renderEncounterPlanner();
  });

  refs.masterEncounterPressure?.addEventListener('change', function () {
    encounterState.pressure = refs.masterEncounterPressure.value || 'balanced';
    saveEncounterState();
    renderEncounterPlanner();
  });

  refs.masterEncounterParticipants?.addEventListener('click', function (event) {
    const button = event.target.closest('[data-action="toggle-encounter-participant"]');
    if (!button) return;
    toggleEncounterParticipant(button.getAttribute('data-character-id') || '');
  });

  refs.masterEncounterSelectPresentButton?.addEventListener('click', function () {
    const presentCharacters = getCharacters().filter((character) => !getCharacterAlertData(character).isAbsent);
    if (!presentCharacters.length) {
      setStatus('Nenhuma ficha marcada como presente');
      return;
    }
    setEncounterParticipants(presentCharacters);
  });

  refs.masterEncounterSelectVisibleButton?.addEventListener('click', function () {
    const visibleCharacters = getVisibleCharacters();
    if (!visibleCharacters.length) {
      setStatus('Nenhuma ficha visivel nos filtros');
      return;
    }
    setEncounterParticipants(visibleCharacters);
  });

  refs.masterEncounterSelectAllButton?.addEventListener('click', function () {
    setEncounterParticipants(getCharacters());
  });

  refs.masterEncounterCopyButton?.addEventListener('click', async function () {
    if (!lastEncounterBlueprint?.block) return;

    try {
      await navigator.clipboard.writeText(lastEncounterBlueprint.block);
      setStatus('Bloco copiado');
    } catch (error) {
      console.error(error);
      refs.masterStatus.textContent = 'Nao consegui copiar. O bloco ficou disponivel abaixo.';
    }
  });

  refs.masterEncounterOutput?.addEventListener('click', function (event) {
    const button = event.target.closest('[data-action="create-enemy-from-card"]');
    if (!button) return;

    const draft = buildEnemyDraftFromEncounterCard(button.getAttribute('data-card-index') || 0);
    if (!draft) return;
    openEnemyDialog(draft);
  });

  refs.masterNewEnemyButton?.addEventListener('click', function () {
    openEnemyDialog(createEnemyRecord());
  });

  refs.masterEnemyLibraryList?.addEventListener('click', function (event) {
    const addButton = event.target.closest('[data-action="add-enemy-to-encounter"]');
    if (addButton) {
      addEnemyToActiveEncounter(addButton.getAttribute('data-enemy-id') || '');
      return;
    }

    const editButton = event.target.closest('[data-action="edit-enemy"]');
    if (editButton) {
      const enemy = getEnemyById(editButton.getAttribute('data-enemy-id') || '');
      if (enemy) openEnemyDialog(enemy);
      return;
    }

    const duplicateButton = event.target.closest('[data-action="duplicate-enemy"]');
    if (duplicateButton) {
      duplicateEnemyRecord(duplicateButton.getAttribute('data-enemy-id') || '');
      return;
    }

    const deleteButton = event.target.closest('[data-action="delete-enemy"]');
    if (deleteButton) {
      deleteEnemyRecord(deleteButton.getAttribute('data-enemy-id') || '');
    }
  });

  refs.masterSortActiveEncounterButton?.addEventListener('click', function () {
    sortActiveEncounterByInitiative();
    persistActiveEncounter();
    renderActiveEncounter();
    setStatus('Encontro ordenado');
  });

  refs.masterAddPresentPlayersButton?.addEventListener('click', function () {
    addCharactersToActiveEncounterBatch(
      getCharacters().filter((character) => !getCharacterAlertData(character).isAbsent),
      'Players presentes adicionados'
    );
  });

  refs.masterAddVisiblePlayersButton?.addEventListener('click', function () {
    addCharactersToActiveEncounterBatch(
      getVisibleCharacters(),
      'Players visiveis adicionados'
    );
  });

  refs.masterPassTurnButton?.addEventListener('click', function () {
    passActiveEncounterTurn();
  });

  refs.masterResetTurnButton?.addEventListener('click', function () {
    resetActiveEncounterTurn();
  });

  refs.masterClearActiveEncounterButton?.addEventListener('click', function () {
    clearActiveEncounter();
  });

  refs.masterHardResetCombatButton?.addEventListener('click', function () {
    hardResetCombatState().catch((error) => {
      console.error(error);
      refs.masterStatus.textContent = 'Erro ao resetar combate.';
    });
  });

  refs.masterActiveEncounterList?.addEventListener('click', function (event) {
    const card = event.target.closest('[data-instance-id]');
    if (!card) return;
    const instanceId = card.getAttribute('data-instance-id') || '';

    const adjustButton = event.target.closest('[data-action="adjust-instance-pv"]');
    if (adjustButton) {
      const delta = Number(adjustButton.getAttribute('data-delta') || 0);
      updateActiveEncounterEntry(instanceId, function (entry) {
        const nextPv = clampRange(Number(entry.pvCurrent || 0) + delta, 0, Number(entry.pvMax || 0));
        const currentStatus = normalizeCombatStatus(entry.status, 'Vivo');
        return {
          ...entry,
          pvCurrent: nextPv,
          status: normalizeStatusForPv(currentStatus, nextPv)
        };
      });
      return;
    }

    const statusButton = event.target.closest('[data-action="set-instance-status"]');
    if (statusButton) {
      const nextStatus = normalizeCombatStatus(statusButton.getAttribute('data-status') || '', 'Vivo');
      updateActiveEncounterEntry(instanceId, function (entry) {
        return {
          ...entry,
          status: nextStatus,
          pvCurrent: nextStatus === 'Morto' ? 0 : Number(entry.pvCurrent || 0)
        };
      });
      return;
    }

    if (event.target.closest('[data-action="defeat-instance"]')) {
      updateActiveEncounterEntry(instanceId, function (entry) {
        return {
          ...entry,
          pvCurrent: 0,
          status: 'Morto'
        };
      });
      return;
    }

    if (event.target.closest('[data-action="remove-instance"]')) {
      removeActiveEncounterEntry(instanceId);
    }
  });

  refs.masterActiveEncounterSummary?.addEventListener('click', function (event) {
    if (event.target.closest('[data-action="summary-pass-turn"]')) {
      passActiveEncounterTurn();
      return;
    }

    if (event.target.closest('[data-action="summary-sort-turns"]')) {
      sortActiveEncounterByInitiative();
      persistActiveEncounter();
      renderActiveEncounter();
      setStatus('Encontro ordenado');
      return;
    }

    if (event.target.closest('[data-action="summary-reset-turn"]')) {
      resetActiveEncounterTurn();
    }
  });

  refs.masterActiveEncounterQuickAdd?.addEventListener('click', function (event) {
    const visibleButton = event.target.closest('[data-action="quick-add-visible-to-encounter"]');
    if (visibleButton) {
      addCharactersToActiveEncounterBatch(
        getVisibleCharacters(),
        'Players visiveis adicionados'
      );
      return;
    }

    if (event.target.closest('[data-action="quick-open-enemy-dialog"]')) {
      openEnemyDialog(createEnemyRecord());
      return;
    }

    const button = event.target.closest('[data-action="quick-add-character-to-encounter"]');
    if (button) {
      addCharacterToActiveEncounter(button.getAttribute('data-character-id') || '');
    }
  });

  refs.masterActiveEncounterList?.addEventListener('change', function (event) {
    const input = event.target.closest('[data-field]');
    const card = event.target.closest('[data-instance-id]');
    if (!input || !card) return;

    const instanceId = card.getAttribute('data-instance-id') || '';
    const field = input.getAttribute('data-field') || '';

    updateActiveEncounterEntry(instanceId, function (entry) {
      if (field === 'pvCurrent') {
        const nextPv = clampRange(Number(input.value || 0), 0, Number(entry.pvMax || 0));
        const currentStatus = normalizeCombatStatus(entry.status, 'Vivo');
        return {
          ...entry,
          pvCurrent: nextPv,
          status: normalizeStatusForPv(currentStatus, nextPv)
        };
      }

      if (field === 'initiativeTotal') {
        return {
          ...entry,
          initiativeDice: [],
          initiativeRoll: 0,
          initiativeTotal: clampRange(Number(input.value || 0), -99, 999)
        };
      }

      if (field === 'status') {
        return {
          ...entry,
          status: normalizeCombatStatus(input.value, 'Vivo')
        };
      }

      return entry;
    });
  });

  refs.masterEnemySaveButton?.addEventListener('click', function () {
    saveEnemyFromDialog();
  });

  refs.masterEnemyDeleteButton?.addEventListener('click', function () {
    if (!activeEnemyId) return;
    deleteEnemyRecord(activeEnemyId);
  });

  [
    refs.masterEnemyNameInput,
    refs.masterEnemyRoleInput,
    refs.masterEnemyStatusInput,
    refs.masterEnemyCountCurrentInput,
    refs.masterEnemyCountMaxInput,
    refs.masterEnemyPvCurrentInput,
    refs.masterEnemyPvMaxInput,
    refs.masterEnemyArmorInput,
    refs.masterEnemyDodgeInput,
    refs.masterEnemyBlockInput,
    refs.masterEnemyInitiativeInput,
    refs.masterEnemyAttackInput,
    refs.masterEnemyPeInput,
    refs.masterEnemyPdInput,
    refs.masterEnemyDamageLabelInput,
    refs.masterEnemyDamageExpressionInput,
    refs.masterEnemyDamageAverageInput,
    refs.masterEnemyAttrForcaInput,
    refs.masterEnemyAttrDestrezaInput,
    refs.masterEnemyAttrSentidosInput,
    refs.masterEnemyAttrVigorInput,
    refs.masterEnemyAttrInteligenciaInput,
    refs.masterEnemyAttrNexoInput,
    refs.masterEnemyBasicDamageLabelInput,
    refs.masterEnemyBasicDamageExpressionInput,
    refs.masterEnemyBasicDamageAverageInput,
    refs.masterEnemySourceInput,
    refs.masterEnemyNotesInput
  ].forEach((element) => {
    element?.addEventListener('input', renderEnemyDialogPreview);
    element?.addEventListener('change', renderEnemyDialogPreview);
  });

  refs.masterEnemyDialog?.addEventListener('close', function () {
    activeEnemyId = null;
    activeEnemyCreatedAt = null;
  });

  refs.masterCharacterList?.addEventListener('click', function (event) {
    const addCharacterButton = event.target.closest('[data-action="add-character-to-encounter"]');
    if (addCharacterButton) {
      addCharacterToActiveEncounter(addCharacterButton.getAttribute('data-character-id') || '');
      return;
    }

    const companionsButton = event.target.closest('[data-action="open-companions"]');
    if (companionsButton) {
      openMasterCompanionDialog(companionsButton.getAttribute('data-character-id') || '', 0);
      return;
    }

    const button = event.target.closest('[data-action="focus-character"]');
    if (!button) return;

    refs.masterCharacterSelect.value = button.getAttribute('data-character-id') || '';
    renderEditorV31();
    enhanceSelectedSummary();
    if (refs.masterCompanionDialog?.open) renderMasterCompanionDialog();
    setStatus('Ficha em foco');
  });

  refs.masterSelectedSummary?.addEventListener('click', function (event) {
    const addCompanionButton = event.target.closest('[data-action="add-companion-to-encounter"]');
    if (!addCompanionButton) return;
    addCompanionToActiveEncounter(
      addCompanionButton.getAttribute('data-character-id') || '',
      addCompanionButton.getAttribute('data-companion-id') || ''
    );
  });

  refs.masterSessionTags?.addEventListener('click', function (event) {
    const button = event.target.closest('[data-action="toggle-session-tag"]');
    if (!button) return;
    toggleSelectedSessionTag(button.getAttribute('data-tag') || '');
  });

  refs.masterOpenCompanionManagerButton?.addEventListener('click', function () {
    openMasterCompanionDialog(refs.masterCharacterSelect.value, activeMasterCompanionIndex ?? 0);
  });

  refs.masterCompanionPicker?.addEventListener('click', function (event) {
    const button = event.target.closest('[data-action="select-master-companion"]');
    if (!button) return;

    activeMasterCompanionIndex = Number(button.getAttribute('data-companion-index') || 0);
    renderMasterCompanionDialog();
  });

  refs.masterCompanionApplyButton?.addEventListener('click', function () {
    applyMasterCompanionBulkUpdates();
  });

  refs.masterAddCompanionButton?.addEventListener('click', function () {
    const character = getSelectedCharacter();
    if (!character) return;

    character.companions.push(createMasterCompanion(''));
    activeMasterCompanionIndex = character.companions.length - 1;
    persistSelectedCharacterChanges('Mini-ficha criada');
    if (refs.masterCompanionDialog?.open) renderMasterCompanionDialog();
  });

  [
    refs.masterCompanionNameInput,
    refs.masterCompanionTypeInput,
    refs.masterCompanionStatusInput,
    refs.masterCompanionArmorInput,
    refs.masterCompanionPvCurrentInput,
    refs.masterCompanionPvMaxInput,
    refs.masterCompanionAttrForcaInput,
    refs.masterCompanionAttrDestrezaInput,
    refs.masterCompanionAttrSentidosInput,
    refs.masterCompanionAttrVigorInput,
    refs.masterCompanionAttrInteligenciaInput,
    refs.masterCompanionAttrNexoInput,
    refs.masterCompanionNotesInput
  ].forEach((element) => {
    element?.addEventListener('input', updateMasterCompanionFromDialog);
    element?.addEventListener('change', updateMasterCompanionFromDialog);
  });

  refs.masterCompanionDialog?.addEventListener('close', function () {
    activeMasterCompanionIndex = getActiveMasterCompanion() ? activeMasterCompanionIndex : null;
  });

  window.addEventListener('app-storage-updated', function (event) {
    const source = event && event.detail ? event.detail.source : '';
    if (source === 'optimistic-save') return;

    setTimeout(() => {
      const next = cloneSnapshot();

      if (
        source !== 'local-save' &&
        source !== 'optimistic-save' &&
        Date.now() - lastLocalEditAt > 1200
      ) {
        diffAndLog(previousSnapshot, next);
      }

      previousSnapshot = next;
      masterLiveSignature = getLiveSignature();
      // Combat state is the source of truth during an active scene. Rebuilding it
      // from fichas on every remote refresh can overwrite player form swaps.
      renderMasterNow();
    }, 80);
  });

  window.addEventListener('app-storage-error', function (event) {
    const message = event.detail && event.detail.message ? event.detail.message : 'Erro ao salvar no banco.';
    refs.masterStatus.textContent = message;
  });

  window.addEventListener('app-storage-realtime', function (event) {
    const detail = event && event.detail ? event.detail : {};
    const table = detail.table || 'dados';
    refs.masterStatus.textContent = `Atualizado ao vivo • ${table}`;
    clearTimeout(setStatus.timer);
    setStatus.timer = setTimeout(() => {
      refs.masterStatus.textContent = 'Ao vivo';
    }, 1400);

    pullRemoteState('realtime');
  });

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') {
      pullRemoteState('visible');
    }
  });

  window.addEventListener('focus', function () {
    pullRemoteState('focus');
  });

  const masterPollTimer = window.setInterval(() => {
    if (document.visibilityState === 'visible') {
      pullRemoteState('poll');
    }
  }, 1200);

  window.addEventListener('pagehide', function () {
    window.clearInterval(masterPollTimer);
  });

  refs.masterExportAllButton?.addEventListener('click', exportAllCharactersToJson);
  refs.masterImportAllButton?.addEventListener('click', () => {
    refs.masterImportAllInput?.click();
  });
  refs.masterImportAllInput?.addEventListener('change', async function () {
    const file = refs.masterImportAllInput.files && refs.masterImportAllInput.files[0];
    if (!file) return;

    try {
      await importCampaignFromFile(file);
    } catch (error) {
      console.error(error);
      setStatus(error?.message || 'Falha ao importar campanha');
    } finally {
      refs.masterImportAllInput.value = '';
    }
  });
  refs.masterOptimizeImagesButton?.addEventListener('click', () => {
    optimizeStoredCharacterImages().catch((error) => {
      console.error(error);
      setStatus('Falha ao otimizar imagens');
      if (refs.masterOptimizeImagesButton) refs.masterOptimizeImagesButton.disabled = false;
    });
  });

  async function bindScenarioPanel() {
    if (!refs.masterScenarioList || !refs.masterScenarioDetail || !refs.masterScenarioTools) return;

    await hydrateScenarioStateFromBackend();
    ensureScenarioState();
    renderScenarioPanel();

    if (refs.masterScenarioFilterType && refs.masterScenarioFilterType.options.length <= 1) {
      SCENARIO_TYPES.forEach((type) => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = getScenarioTypeLabel(type);
        refs.masterScenarioFilterType.appendChild(option);
      });
    }

    if (refs.masterScenarioFilterStatus && refs.masterScenarioFilterStatus.options.length <= 1) {
      SCENARIO_STATUSES.forEach((status) => {
        const option = document.createElement('option');
        option.value = status;
        option.textContent = getScenarioStatusLabel(status);
        refs.masterScenarioFilterStatus.appendChild(option);
      });
    }

    refs.masterScenarioAddButton?.addEventListener('click', () => {
      const scenario = createScenarioSeed('Novo cenario');
      scenario.order = scenarioState.scenarios.length + 1;
      scenarioState.scenarios.push(scenario);
      setActiveScenario(scenario.id, { markStatus: false });
      persistScenarioState('Cenario criado');
      renderScenarioPanel();
    });

    refs.masterScenarioSearchInput?.addEventListener('input', (event) => {
      scenarioFilters.search = event.target.value || '';
      renderScenarioList();
    });

    refs.masterScenarioFilterType?.addEventListener('change', (event) => {
      scenarioFilters.type = event.target.value || 'all';
      renderScenarioList();
    });

    refs.masterScenarioFilterStatus?.addEventListener('change', (event) => {
      scenarioFilters.status = event.target.value || 'all';
      renderScenarioList();
    });

    refs.masterScenarioFilterTags?.addEventListener('input', (event) => {
      scenarioFilters.tags = event.target.value || '';
      renderScenarioList();
    });

    refs.masterScenarioBulkImportButton?.addEventListener('click', () => {
      importScenariosFromBulkInput();
    });

    refs.masterScenarioBulkClearButton?.addEventListener('click', () => {
      if (refs.masterScenarioBulkInput) refs.masterScenarioBulkInput.value = '';
      if (refs.masterScenarioBulkResult) refs.masterScenarioBulkResult.textContent = '';
    });

    refs.masterScenarioList.addEventListener('click', (event) => {
      const actionButton = event.target.closest('[data-action]');
      const card = event.target.closest('[data-scenario-id]');
      const scenarioId = actionButton?.getAttribute('data-scenario-id') || card?.getAttribute('data-scenario-id') || '';
      if (!scenarioId) return;

      if (!actionButton) {
        setActiveScenario(scenarioId, { markStatus: false });
        renderScenarioPanel();
        return;
      }

      const action = actionButton.getAttribute('data-action');
      const scenario = getScenarioById(scenarioId);
      if (!scenario) return;

      if (action === 'scenario-open') {
        setActiveScenario(scenarioId, { markStatus: false });
        renderScenarioPanel();
        return;
      }

      if (action === 'scenario-set-active') {
        setActiveScenario(scenarioId, { markStatus: true });
        renderScenarioPanel();
        return;
      }

      if (action === 'scenario-mark-visited') {
        scenario.status = 'visited';
        persistScenarioState('Cenario atualizado');
        renderScenarioPanel();
        return;
      }

      if (action === 'scenario-mark-changed') {
        scenario.status = 'changed';
        persistScenarioState('Cenario atualizado');
        renderScenarioPanel();
        return;
      }

      if (action === 'scenario-duplicate') {
        const clone = JSON.parse(JSON.stringify(scenario));
        clone.id = createId('scenario');
        clone.name = `${scenario.name || 'Cenario'} (copia)`;
        clone.order = scenarioState.scenarios.length + 1;
        clone.isCurrent = false;
        scenarioState.scenarios.push(clone);
        persistScenarioState('Cenario duplicado');
        renderScenarioPanel();
        return;
      }

      if (action === 'scenario-delete') {
        if (!window.confirm('Excluir este cenario?')) return;
        scenarioState.scenarios = scenarioState.scenarios.filter((entry) => entry.id !== scenarioId);
        scenarioState.scenarios.forEach((entry) => {
          entry.connectedScenarioIds = (entry.connectedScenarioIds || []).filter((id) => id !== scenarioId);
        });
        scenarioState.npcs.forEach((npc) => {
          if (npc.locationScenarioId === scenarioId) npc.locationScenarioId = '';
        });
        scenarioState.events.forEach((eventEntry) => {
          if (eventEntry.scenarioId === scenarioId) eventEntry.scenarioId = '';
        });
        scenarioState.clues.forEach((clueEntry) => {
          if (clueEntry.scenarioId === scenarioId) clueEntry.scenarioId = '';
        });
        if (scenarioState.session.currentScenarioId === scenarioId) {
          scenarioState.session.currentScenarioId = scenarioState.scenarios[0]?.id || '';
          activeScenarioId = scenarioState.session.currentScenarioId;
        }
        syncScenarioOrders(scenarioState.scenarios);
        persistScenarioState('Cenario removido');
        renderScenarioPanel();
        return;
      }
    });

    refs.masterScenarioList.addEventListener('dragstart', (event) => {
      const card = event.target.closest('[data-scenario-id]');
      if (!card || !event.dataTransfer) return;
      event.dataTransfer.setData('text/plain', card.getAttribute('data-scenario-id'));
      event.dataTransfer.effectAllowed = 'move';
    });

    refs.masterScenarioList.addEventListener('dragover', (event) => {
      const card = event.target.closest('[data-scenario-id]');
      if (!card) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
    });

    refs.masterScenarioList.addEventListener('drop', (event) => {
      const card = event.target.closest('[data-scenario-id]');
      if (!card || !event.dataTransfer) return;
      event.preventDefault();
      const dragId = event.dataTransfer.getData('text/plain');
      const targetId = card.getAttribute('data-scenario-id');
      moveScenario(dragId, targetId);
    });

    refs.masterScenarioDetail.addEventListener('input', (event) => {
      const field = event.target.getAttribute('data-scenario-field');
      if (field) {
        const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
        updateScenarioField(field, value);
        return;
      }

      const npcField = event.target.getAttribute('data-npc-field');
      if (npcField) {
        const npcId = event.target.closest('[data-npc-id]')?.getAttribute('data-npc-id');
        const npc = getNpcById(npcId);
        if (!npc) return;
        npc[npcField] = event.target.value;
        persistScenarioStateDebounced();
        return;
      }

      const eventField = event.target.getAttribute('data-event-field');
      if (eventField) {
        const eventId = event.target.closest('[data-event-id]')?.getAttribute('data-event-id');
        const entry = getEventById(eventId);
        if (!entry) return;
        if (eventField === 'priority') {
          entry.priority = Math.max(0, Number(event.target.value || 0));
        } else {
          entry[eventField] = event.target.value;
        }
        persistScenarioStateDebounced();
        return;
      }

      const clueField = event.target.getAttribute('data-clue-field');
      if (clueField) {
        const clueId = event.target.closest('[data-clue-id]')?.getAttribute('data-clue-id');
        const entry = getClueById(clueId);
        if (!entry) return;
        entry[clueField] = event.target.value;
        persistScenarioStateDebounced();
        return;
      }
    });

    refs.masterScenarioDetail.addEventListener('change', (event) => {
      const actionSelect = event.target.getAttribute('data-action');
      if (actionSelect) {
        const scenario = getScenarioById(activeScenarioId);
        if (!scenario) return;
        const value = event.target.value || '';
        if (!value) return;

        if (actionSelect === 'npc-link') {
          if (!scenario.npcIds.includes(value)) scenario.npcIds.push(value);
          const npc = getNpcById(value);
          if (npc) setNpcLocation(npc, scenario.id);
          persistScenarioState('NPC vinculado');
          renderScenarioPanel();
          event.target.value = '';
          return;
        }

        if (actionSelect === 'event-link') {
          if (!scenario.eventIds.includes(value)) scenario.eventIds.push(value);
          const entry = getEventById(value);
          if (entry) setEventLocation(entry, scenario.id);
          persistScenarioState('Acontecimento vinculado');
          renderScenarioPanel();
          event.target.value = '';
          return;
        }

        if (actionSelect === 'clue-link') {
          if (!scenario.clueIds.includes(value)) scenario.clueIds.push(value);
          const entry = getClueById(value);
          if (entry) setClueLocation(entry, scenario.id);
          persistScenarioState('Pista vinculada');
          renderScenarioPanel();
          event.target.value = '';
          return;
        }

        if (actionSelect === 'scenario-connect') {
          scenario.connectedScenarioIds = scenario.connectedScenarioIds || [];
          if (!scenario.connectedScenarioIds.includes(value)) {
            scenario.connectedScenarioIds.push(value);
            persistScenarioState('Conexao adicionada');
            renderScenarioPanel();
          }
          event.target.value = '';
          return;
        }
      }

      const field = event.target.getAttribute('data-scenario-field');
      if (field) {
        const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
        updateScenarioField(field, value);
        return;
      }

      const npcField = event.target.getAttribute('data-npc-field');
      if (npcField) {
        const npcId = event.target.closest('[data-npc-id]')?.getAttribute('data-npc-id');
        const npc = getNpcById(npcId);
        if (!npc) return;
        if (npcField === 'locationScenarioId') {
          setNpcLocation(npc, event.target.value);
          persistScenarioStateDebounced();
          renderScenarioPanel();
          return;
        }
        npc[npcField] = event.target.value;
        persistScenarioStateDebounced();
        return;
      }

      const eventField = event.target.getAttribute('data-event-field');
      if (eventField) {
        const eventId = event.target.closest('[data-event-id]')?.getAttribute('data-event-id');
        const entry = getEventById(eventId);
        if (!entry) return;
        if (eventField === 'scenarioId') {
          setEventLocation(entry, event.target.value);
          persistScenarioStateDebounced();
          renderScenarioPanel();
          return;
        }
        entry[eventField] = event.target.value;
        persistScenarioStateDebounced();
        return;
      }

      const clueField = event.target.getAttribute('data-clue-field');
      if (clueField) {
        const clueId = event.target.closest('[data-clue-id]')?.getAttribute('data-clue-id');
        const entry = getClueById(clueId);
        if (!entry) return;
        if (clueField === 'scenarioId') {
          setClueLocation(entry, event.target.value);
          persistScenarioStateDebounced();
          renderScenarioPanel();
          return;
        }
        entry[clueField] = event.target.value;
        persistScenarioStateDebounced();
      }
    });

    refs.masterScenarioDetail.addEventListener('click', (event) => {
      const actionButton = event.target.closest('[data-action]');
      if (!actionButton) return;
      const action = actionButton.getAttribute('data-action');
      const scenario = getScenarioById(activeScenarioId);
      if (!scenario) return;

      if (action === 'npc-add') {
        const npc = createNpcSeed('NPC novo');
        scenarioState.npcs.push(npc);
        scenario.npcIds.push(npc.id);
        setNpcLocation(npc, scenario.id);
        persistScenarioState('NPC criado');
        renderScenarioPanel();
        return;
      }

      if (action === 'npc-link') {
        return;
      }

      if (action === 'npc-unlink') {
        const npcId = actionButton.closest('[data-npc-id]')?.getAttribute('data-npc-id');
        scenario.npcIds = scenario.npcIds.filter((id) => id !== npcId);
        persistScenarioState('NPC removido');
        renderScenarioPanel();
        return;
      }

      if (action === 'npc-delete') {
        const npcId = actionButton.closest('[data-npc-id]')?.getAttribute('data-npc-id');
        if (!npcId || !window.confirm('Excluir este NPC de todos os cenarios?')) return;
        deleteScenarioNpc(npcId);
        persistScenarioState('NPC excluido');
        renderScenarioPanel();
        return;
      }

      if (action === 'npc-present') {
        const npcId = actionButton.closest('[data-npc-id]')?.getAttribute('data-npc-id');
        const npc = getNpcById(npcId);
        if (npc) {
          npc.status = 'present';
          setNpcLocation(npc, scenario.id);
          persistScenarioStateDebounced();
          renderScenarioPanel();
        }
        return;
      }

      if (action === 'event-add') {
        const entry = createEventSeed('Acontecimento');
        scenarioState.events.push(entry);
        scenario.eventIds.push(entry.id);
        setEventLocation(entry, scenario.id);
        persistScenarioState('Acontecimento criado');
        renderScenarioPanel();
        return;
      }

      if (action === 'event-link') {
        return;
      }

      if (action === 'event-used') {
        const eventId = actionButton.closest('[data-event-id]')?.getAttribute('data-event-id');
        const entry = getEventById(eventId);
        if (entry) entry.status = 'used';
        persistScenarioStateDebounced();
        renderScenarioPanel();
        return;
      }

      if (action === 'event-priority-up' || action === 'event-priority-down') {
        const eventId = actionButton.closest('[data-event-id]')?.getAttribute('data-event-id');
        const entry = getEventById(eventId);
        if (!entry) return;
        const delta = action === 'event-priority-up' ? 1 : -1;
        entry.priority = Math.max(0, Number(entry.priority || 0) + delta);
        persistScenarioStateDebounced();
        renderScenarioPanel();
        return;
      }

      if (action === 'event-discard') {
        const eventId = actionButton.closest('[data-event-id]')?.getAttribute('data-event-id');
        const entry = getEventById(eventId);
        if (entry) entry.status = 'discarded';
        persistScenarioStateDebounced();
        renderScenarioPanel();
        return;
      }

      if (action === 'event-delete') {
        const eventId = actionButton.closest('[data-event-id]')?.getAttribute('data-event-id');
        if (!eventId || !window.confirm('Excluir este acontecimento?')) return;
        deleteScenarioEvent(eventId);
        persistScenarioState('Acontecimento excluido');
        renderScenarioPanel();
        return;
      }

      if (action === 'event-duplicate') {
        const eventId = actionButton.closest('[data-event-id]')?.getAttribute('data-event-id');
        const entry = getEventById(eventId);
        if (!entry) return;
        const clone = { ...entry, id: createId('event'), status: 'available' };
        scenarioState.events.push(clone);
        scenario.eventIds.push(clone.id);
        persistScenarioState('Acontecimento duplicado');
        renderScenarioPanel();
        return;
      }

      if (action === 'clue-add') {
        const entry = createClueSeed('Pista');
        scenarioState.clues.push(entry);
        scenario.clueIds.push(entry.id);
        setClueLocation(entry, scenario.id);
        persistScenarioState('Pista criada');
        renderScenarioPanel();
        return;
      }

      if (action === 'clue-link') {
        return;
      }

      if (action === 'clue-found') {
        const clueId = actionButton.closest('[data-clue-id]')?.getAttribute('data-clue-id');
        const entry = getClueById(clueId);
        if (entry) entry.status = 'found';
        persistScenarioStateDebounced();
        renderScenarioPanel();
        return;
      }

      if (action === 'clue-missed') {
        const clueId = actionButton.closest('[data-clue-id]')?.getAttribute('data-clue-id');
        const entry = getClueById(clueId);
        if (entry) entry.status = 'missed';
        persistScenarioStateDebounced();
        renderScenarioPanel();
        return;
      }

      if (action === 'clue-delete') {
        const clueId = actionButton.closest('[data-clue-id]')?.getAttribute('data-clue-id');
        if (!clueId || !window.confirm('Excluir esta pista?')) return;
        deleteScenarioClue(clueId);
        persistScenarioState('Pista excluida');
        renderScenarioPanel();
        return;
      }

      if (action === 'scenario-connect') {
        return;
      }

      if (action === 'scenario-clear-connections') {
        scenario.connectedScenarioIds = [];
        persistScenarioStateDebounced();
        renderScenarioPanel();
        return;
      }

      if (action === 'scenario-jump') {
        const targetId = actionButton.getAttribute('data-scenario-id');
        if (!targetId) return;
        setActiveScenario(targetId, { markStatus: false });
        renderScenarioPanel();
      }
    });

    refs.masterScenarioTools.addEventListener('input', (event) => {
      const field = event.target.getAttribute('data-session-field');
      if (field) {
        scenarioState.session[field] = event.target.value;
        persistScenarioStateDebounced();
        return;
      }

      const clockField = event.target.getAttribute('data-clock-field');
      if (clockField) {
        const clockId = event.target.closest('[data-clock-id]')?.getAttribute('data-clock-id');
        const clock = scenarioState.clocks.find((item) => item.id === clockId);
        if (!clock) return;
        clock[clockField] = event.target.value;
        if (clockField === 'current' || clockField === 'max') {
          clock[clockField] = Math.max(0, Number(event.target.value || 0));
        }
        persistScenarioStateDebounced();
        return;
      }

      const arcField = event.target.getAttribute('data-arc-field');
      if (arcField) {
        const arcId = event.target.closest('[data-arc-event-id]')?.getAttribute('data-arc-event-id');
        const arc = scenarioState.arcEvents.find((item) => item.id === arcId);
        if (!arc) return;
        arc[arcField] = event.target.value;
        persistScenarioStateDebounced();
      }
    });

    refs.masterScenarioTools.addEventListener('change', (event) => {
      const clockField = event.target.getAttribute('data-clock-field');
      if (clockField) {
        const clockId = event.target.closest('[data-clock-id]')?.getAttribute('data-clock-id');
        const clock = scenarioState.clocks.find((item) => item.id === clockId);
        if (!clock) return;
        clock[clockField] = event.target.value;
        if (clockField === 'current' || clockField === 'max') {
          clock[clockField] = Math.max(0, Number(event.target.value || 0));
        }
        persistScenarioStateDebounced();
        return;
      }

      const arcField = event.target.getAttribute('data-arc-field');
      if (arcField) {
        const arcId = event.target.closest('[data-arc-event-id]')?.getAttribute('data-arc-event-id');
        const arc = scenarioState.arcEvents.find((item) => item.id === arcId);
        if (!arc) return;
        arc[arcField] = event.target.value;
        persistScenarioStateDebounced();
      }
    });

    refs.masterScenarioTools.addEventListener('click', (event) => {
      const actionButton = event.target.closest('[data-action]');
      if (!actionButton) return;
      const action = actionButton.getAttribute('data-action');

      if (action === 'clock-add') {
        scenarioState.clocks.push(createClockSeed());
        persistScenarioState('Clock criado');
        renderScenarioPanel();
        return;
      }

      if (action === 'clock-inc' || action === 'clock-dec' || action === 'clock-reset') {
        const clockId = actionButton.closest('[data-clock-id]')?.getAttribute('data-clock-id');
        const clock = scenarioState.clocks.find((item) => item.id === clockId);
        if (!clock) return;
        if (action === 'clock-inc') clock.current = Math.min(clock.max, clock.current + 1);
        if (action === 'clock-dec') clock.current = Math.max(0, clock.current - 1);
        if (action === 'clock-reset') clock.current = 0;
        persistScenarioStateDebounced();
        renderScenarioPanel();
        return;
      }

      if (action === 'clock-delete') {
        const clockId = actionButton.closest('[data-clock-id]')?.getAttribute('data-clock-id');
        if (!clockId || !window.confirm('Excluir este clock?')) return;
        scenarioState.clocks = scenarioState.clocks.filter((clock) => clock.id !== clockId);
        persistScenarioState('Clock excluido');
        renderScenarioPanel();
        return;
      }

      if (action === 'arc-add') {
        scenarioState.arcEvents.push(createArcEventSeed());
        persistScenarioState('Evento criado');
        renderScenarioPanel();
        return;
      }

      if (action === 'arc-delete') {
        const arcId = actionButton.closest('[data-arc-event-id]')?.getAttribute('data-arc-event-id');
        scenarioState.arcEvents = scenarioState.arcEvents.filter((item) => item.id !== arcId);
        persistScenarioState('Evento removido');
        renderScenarioPanel();
      }
    });
  }

  refs.masterLogoutButton.addEventListener('click', async function () {
    try {
      sessionStorage.removeItem('omnivita-master-active-tab');
    } catch (error) {
      // ignore storage issues
    }
    await window.AppAuth.logout();
    window.location.href = 'index.html';
  });

  await bindScenarioPanel();
  initTabs();
  const initialCombatState = await window.AppCombatState?.requestState?.({
    requesterRole: 'master',
    reason: 'boot'
  });
  remoteCombatBootstrapped = true;

  const safeInitialCombatState = window.AppSystem.hydrateCombatSharedState(initialCombatState);
  trackMasterCombatState(safeInitialCombatState);
  if (safeInitialCombatState.active || safeInitialCombatState.combatants.length) {
    applyRemoteCombatStateToEncounter(safeInitialCombatState, { render: false });
  } else {
    activeEncounter = [];
    activeEncounterTurn = { currentInstanceId: '', round: 1 };
    persistActiveEncounter();
    persistActiveEncounterTurn();
  }

  renderMasterNow();
  pullRemoteState('boot');
})();
