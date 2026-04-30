(async function () {
  let activeCompanionIndex = null;
  let externalSyncBlockedUntil = 0;
  let selectedCombatFormId = '';
  let liveCombatSharedState = window.AppSystem.hydrateCombatSharedState(null);
  let localCombatControlSentAt = 0;
  let pendingCombatControl = null;
  let lastCombatSyncAt = 0;
  let combatSyncPulseUntil = 0;
  let lastRepresentedActorKey = '';
  let representedActorFlashUntil = 0;
  let lastCurrentTurnInstanceId = '';
  let currentTurnFlashUntil = 0;
  let omnivitaVisualState = 'ready';
  let omnivitaDischargeTimer = null;

  function blockExternalSync(duration = 1800) {
    externalSyncBlockedUntil = Math.max(externalSyncBlockedUntil, Date.now() + duration);
  }

  function isExternalSyncBlocked() {
    return Date.now() < externalSyncBlockedUntil;
  }

  function markEditing(event) {
    const target = event && event.target;
    if (!target) return;

    if (typeof target.closest === 'function' && target.closest('[data-combat-control-panel]')) {
      return;
    }

    const isField = typeof target.matches === 'function' && target.matches('input, textarea, select');
    const isEditorAction = typeof target.closest === 'function' && target.closest(
      '[data-action="remove-facet"], [data-action="remove-aptitude"], [data-action="remove-companion"], [data-action="remove-companion-skill"], [data-action="remove-companion-facet"], #addFacetButton, #addAptitudeButton, #addCompanionButton, #addCompanionSkillButton, #addCompanionFacetButton, #deleteCompanionButton, #removeProfileImageButton, #removeCompanionImageButton'
    );

    if (isField || isEditorAction) {
      blockExternalSync();
      markPendingChanges();
    }
  }

  document.addEventListener('input', markEditing, true);
  document.addEventListener('change', markEditing, true);
  document.addEventListener('click', markEditing, true);

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
    try {
      sessionStorage.setItem('omnivita-active-tab', tabId);
    } catch (error) {
      // ignore storage issues
    }
  }

  function initTabs() {
    if (!tabButtons.length || !tabPanels.length) return;
    const savedTab = (() => {
      try {
        return sessionStorage.getItem('omnivita-active-tab');
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

  const refs = {
    saveStatus: document.getElementById('saveStatus'),
    exportCharacterButton: document.getElementById('exportCharacterButton'),
    importCharacterInput: document.getElementById('importCharacterInput'),
    combatRoundBadge: document.getElementById('combatRoundBadge'),
    combatOverviewCards: document.getElementById('combatOverviewCards'),
    combatControlList: document.getElementById('combatControlList'),
    combatRosterList: document.getElementById('combatRosterList'),
    sessionUserLabel: document.getElementById('sessionUserLabel'),
    logoutButton: document.getElementById('logoutButton'),
    sidebarCharacterName: document.getElementById('sidebarCharacterName'),
    sidebarCharacterSubtitle: document.getElementById('sidebarCharacterSubtitle'),
    sidebarPeVAvailable: document.getElementById('sidebarPeVAvailable'),
    sidebarInstability: document.getElementById('sidebarInstability'),
    pageCharacterSummary: document.getElementById('pageCharacterSummary'),
    classNoteBadge: document.getElementById('classNoteBadge'),
    attributeLimitBadge: document.getElementById('attributeLimitBadge'),
    skillLimitBadge: document.getElementById('skillLimitBadge'),
    attributePointsSpentBadge: document.getElementById('attributePointsSpentBadge'),
    attributePointsAvailableBadge: document.getElementById('attributePointsAvailableBadge'),
    peVGrantedBadge: document.getElementById('peVGrantedBadge'),
    peVSpentBadge: document.getElementById('peVSpentBadge'),
    peVAvailableBadge: document.getElementById('peVAvailableBadge'),
    skillsSpentBadge: document.getElementById('skillsSpentBadge'),
    attributeGrid: document.getElementById('attributeGrid'),
    skillsGrid: document.getElementById('skillsGrid'),
    aptitudesList: document.getElementById('aptitudesList'),
    addAptitudeButton: document.getElementById('addAptitudeButton'),
    addFacetButton: document.getElementById('addFacetButton'),
    facetsList: document.getElementById('facetsList'),
    companionsList: document.getElementById('companionsList'),
    addCompanionButton: document.getElementById('addCompanionButton'),
    pvCurrentInput: document.getElementById('pvCurrentInput'),
    peCurrentInput: document.getElementById('peCurrentInput'),
    pdCurrentInput: document.getElementById('pdCurrentInput'),
    instabilityInput: document.getElementById('instabilityInput'),
    resourceStatus: document.getElementById('resourceStatus'),
    armorBonusInput: document.getElementById('armorBonusInput'),
    blockModeSelect: document.getElementById('blockModeSelect'),
    armorEquipmentInput: document.getElementById('armorEquipmentInput'),
    pvMaxLabel: document.getElementById('pvMaxLabel'),
    peMaxLabel: document.getElementById('peMaxLabel'),
    pdMaxLabel: document.getElementById('pdMaxLabel'),
    pvFormulaLabel: document.getElementById('pvFormulaLabel'),
    peFormulaLabel: document.getElementById('peFormulaLabel'),
    pdFormulaLabel: document.getElementById('pdFormulaLabel'),
    esquivaLabel: document.getElementById('esquivaLabel'),
    blockLabel: document.getElementById('blockLabel'),
    blockHelper: document.getElementById('blockHelper'),
    initiativeLabel: document.getElementById('initiativeLabel'),
    manifestationModLabel: document.getElementById('manifestationModLabel'),
    armorLabel: document.getElementById('armorLabel'),
    defenseSummaryLabel: document.getElementById('defenseSummaryLabel'),
    identityName: document.getElementById('identityName'),
    identityAge: document.getElementById('identityAge'),
    identityLevel: document.getElementById('identityLevel'),
    identityClass: document.getElementById('identityClass'),
    identityManifestationOrigin: document.getElementById('identityManifestationOrigin'),
    identityLinks: document.getElementById('identityLinks'),
    identityConcept: document.getElementById('identityConcept'),
    identitySummary: document.getElementById('identitySummary'),
    extraPeVInput: document.getElementById('extraPeVInput'),
    manualPeVSpentInput: document.getElementById('manualPeVSpentInput'),
    facetaUnlocksInput: document.getElementById('facetaUnlocksInput'),
    facetaStabilizationsInput: document.getElementById('facetaStabilizationsInput'),
    progressionNotesInput: document.getElementById('progressionNotesInput'),
    manifestationNameInput: document.getElementById('manifestationNameInput'),
    manifestationOriginInput: document.getElementById('manifestationOriginInput'),
    manifestationStateInput: document.getElementById('manifestationStateInput'),
    manifestationGlitchesInput: document.getElementById('manifestationGlitchesInput'),
    manifestationEffectsInput: document.getElementById('manifestationEffectsInput'),
    primaryWeaponInput: document.getElementById('primaryWeaponInput'),
    secondaryWeaponInput: document.getElementById('secondaryWeaponInput'),
    appearanceInput: document.getElementById('appearanceInput'),
    itemsInput: document.getElementById('itemsInput'),
    characterNotesInput: document.getElementById('characterNotesInput'),
    profileImagePreview: document.getElementById('profileImagePreview'),
    profileImageInput: document.getElementById('profileImageInput'),
    removeProfileImageButton: document.getElementById('removeProfileImageButton'),
    sidebarAvatar: document.getElementById('sidebarAvatar'),
    companionDialog: document.getElementById('companionDialog'),
    companionDialogTitle: document.getElementById('companionDialogTitle'),
    deleteCompanionButton: document.getElementById('deleteCompanionButton'),
    companionImagePreview: document.getElementById('companionImagePreview'),
    companionStickyName: document.getElementById('companionStickyName'),
    companionStickyType: document.getElementById('companionStickyType'),
    companionStickyStatus: document.getElementById('companionStickyStatus'),
    companionImageInput: document.getElementById('companionImageInput'),
    removeCompanionImageButton: document.getElementById('removeCompanionImageButton'),
    companionNameInput: document.getElementById('companionNameInput'),
    companionTypeInput: document.getElementById('companionTypeInput'),
    companionStatusInput: document.getElementById('companionStatusInput'),
    companionPvCurrentInput: document.getElementById('companionPvCurrentInput'),
    companionPvMaxInput: document.getElementById('companionPvMaxInput'),
    companionArmorInput: document.getElementById('companionArmorInput'),
    companionAttrForcaInput: document.getElementById('companionAttrForcaInput'),
    companionAttrDestrezaInput: document.getElementById('companionAttrDestrezaInput'),
    companionAttrSentidosInput: document.getElementById('companionAttrSentidosInput'),
    companionAttrVigorInput: document.getElementById('companionAttrVigorInput'),
    companionAttrInteligenciaInput: document.getElementById('companionAttrInteligenciaInput'),
    companionAttrNexoInput: document.getElementById('companionAttrNexoInput'),
    addCompanionSkillButton: document.getElementById('addCompanionSkillButton'),
    companionSkillsList: document.getElementById('companionSkillsList'),
    addCompanionFacetButton: document.getElementById('addCompanionFacetButton'),
    companionFacetsList: document.getElementById('companionFacetsList'),
    companionNotesInput: document.getElementById('companionNotesInput')
  };

  const companionUi = window.AppCompanionUi;
  const companionDialogFieldRefs = {
    nameInput: refs.companionNameInput,
    typeInput: refs.companionTypeInput,
    statusInput: refs.companionStatusInput,
    pvCurrentInput: refs.companionPvCurrentInput,
    pvMaxInput: refs.companionPvMaxInput,
    armorInput: refs.companionArmorInput,
    attrForcaInput: refs.companionAttrForcaInput,
    attrDestrezaInput: refs.companionAttrDestrezaInput,
    attrSentidosInput: refs.companionAttrSentidosInput,
    attrVigorInput: refs.companionAttrVigorInput,
    attrInteligenciaInput: refs.companionAttrInteligenciaInput,
    attrNexoInput: refs.companionAttrNexoInput,
    notesInput: refs.companionNotesInput
  };
  const companionDialogDisplayRefs = {
    titleElement: refs.companionDialogTitle,
    avatarElement: refs.companionImagePreview,
    stickyNameElement: refs.companionStickyName,
    stickyTypeElement: refs.companionStickyType,
    stickyStatusElement: refs.companionStickyStatus
  };

  initTabs();

  const session = await window.AppAuth.requireRole('player');
  if (!session) return;
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

  function getCombatStatusVisualClass(status) {
    return combatUtils?.getStatusVisualClass
      ? combatUtils.getStatusVisualClass(status)
      : (() => {
        const normalized = normalizeCombatStatus(status, 'Vivo');
        if (normalized === 'Morto') return 'is-dead';
        if (normalized === 'Morrendo') return 'is-dying';
        return 'is-alive';
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

  function getSaveErrorMessage(error) {
    return (error && error.message) ? error.message : 'Erro ao salvar no banco.';
  }

  async function flushCharacterSave() {
    try {
      await saveCharacter({ successMessage: 'Salvo' });
    } catch (error) {
      console.error(error);
      markSaveError(getSaveErrorMessage(error));
    }
  }

  async function handleLogout() {
    await flushCharacterSave();
    await window.AppAuth.logout();
    sessionStorage.removeItem('omnivita-active-tab');
    window.location.href = 'index.html';
  }

  refs.logoutButton.addEventListener('click', handleLogout);

  await window.AppStorage.init();
  let character = null;

  async function loadBoundCharacter() {
    let loadedCharacter = null;

    if (session.characterId && window.AppStorage.fetchCharacterByIdDirect) {
      loadedCharacter = await window.AppStorage.fetchCharacterByIdDirect(session.characterId);
    }

    if (!loadedCharacter && window.AppStorage.fetchCharacterByOwnerUserIdDirect) {
      loadedCharacter = await window.AppStorage.fetchCharacterByOwnerUserIdDirect(session.userId);
    }

    return loadedCharacter;
  }

  function showMissingCharacterState() {
    refs.saveStatus.textContent = 'Nenhuma ficha vinculada a esta conta.';
    refs.sessionUserLabel.textContent = session.username || session.email || '-';
    refs.sidebarCharacterName.textContent = session.username || 'Sem ficha';
    refs.sidebarCharacterSubtitle.textContent = 'Nenhuma ficha vinculada';
    refs.pageCharacterSummary.textContent = 'Esta conta entrou com sucesso, mas ainda não tem ficha vinculada no banco.';
  }

  try {
    character = await loadBoundCharacter();
  } catch (error) {
    console.error(error);
    refs.saveStatus.textContent = 'Erro ao carregar a ficha vinculada.';
  }

  if (!character) {
    showMissingCharacterState();
    return;
  }

  refs.sessionUserLabel.textContent = session.username || session.email || '-';

  function debounce(callback, delay) {
    let timer = null;
    return function () {
      clearTimeout(timer);
      timer = setTimeout(callback, delay);
    };
  }

  function setSaveStatus(message, state = 'neutral', options = {}) {
    const holdMs = options.holdMs === undefined ? 1200 : options.holdMs;
    const sticky = Boolean(options.sticky);
    refs.saveStatus.textContent = message;
    refs.saveStatus.dataset.state = state;
    clearTimeout(setSaveStatus.timer);
    if (sticky) return;
    setSaveStatus.timer = setTimeout(() => {
      refs.saveStatus.textContent = 'Pronto';
      refs.saveStatus.dataset.state = 'neutral';
    }, holdMs);
  }

  function markPendingChanges() {
    if (!character) return;
    if ((refs.saveStatus.dataset.state || '') === 'saving') return;
    setSaveStatus('Alterações pendentes', 'warning', { sticky: true });
  }

  function markSaving(message = 'Salvando...') {
    setSaveStatus(message, 'saving', { sticky: true });
  }

  function markSaveSuccess(message = 'Salvo') {
    setSaveStatus(message, 'success', { holdMs: 1500 });
  }

  function markSaveError(message) {
    setSaveStatus(message || 'Erro ao salvar no banco.', 'error', { sticky: true });
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function normalizeOmnivitaLookup(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  const OMNIVITA_SILHOUETTE_ASSETS = {
    armoguana: 'assets/armoguana%20silhueta.png',
    cinetico: 'assets/cinetico%20silhueta.png',
    desmodus: 'assets/desmodus%20silhueta.png',
    eciton: 'assets/eciton%20silhueta.png',
    geck: 'assets/geck%20silhueta.png',
    gecko: 'assets/geck%20silhueta.png',
    landslide: 'assets/landslide%20silhueta.png',
    pelagornis: 'assets/pelagornis%20silhueta.png',
    sidarta: 'assets/sidarta%20silhueta.png'
  };

  function usesOmnivitaCombatUi() {
    const lookup = normalizeOmnivitaLookup([
      session.username,
      character.identity?.name,
      character.identity?.manifestationOrigin,
      character.manifestation?.origin,
      character.manifestation?.name,
      character.inventory?.primaryWeapon
    ].join(' '));

    return lookup.includes('cael') || lookup.includes('omnivita');
  }

  function getOmnivitaSilhouetteImage(entry) {
    const lookup = normalizeOmnivitaLookup(entry?.name || entry?.id || '');
    const directKey = Object.keys(OMNIVITA_SILHOUETTE_ASSETS).find((key) => lookup.includes(key));
    return directKey ? OMNIVITA_SILHOUETTE_ASSETS[directKey] : (entry?.image || '');
  }

  function formatSigned(value) {
    return companionUi.formatSigned(value);
  }

  function getAttributeSelectOptions(selectedKey) {
    return companionUi.getAttributeSelectOptions(selectedKey);
  }

  function getMainSkillFixedBonus(skillKey) {
    return window.AppSystem.getSkillFixedBonus(character, skillKey);
  }

  function getSkillTotal(skillKey) {
    return window.AppSystem.calculateSkillTotal(
      character.skills[skillKey],
      character.skillAttributes[skillKey],
      character.attributes
    ) + getMainSkillFixedBonus(skillKey);
  }

  function getCompanionSkillTotal(entry, skill) {
    return window.AppSystem.getCompanionSkillTotal(entry, skill);
  }

  function createCompanionSkillEntry(overrides) {
    return window.AppSystem.createCompanionSkillEntry(overrides);
  }

  function createCompanionFacetEntry(overrides) {
    return window.AppSystem.createCompanionFacetEntry(overrides);
  }

  function hasCompanionSkillUserContent(skill) {
    if (!skill) return false;
    return Boolean(
      String(skill.name || '').trim() ||
      Number(skill.value || 0) > 0 ||
      (skill.attribute || 'destreza') !== 'destreza'
    );
  }

  function hasCompanionFacetUserContent(facet) {
    if (!facet) return false;
    return Boolean(
      String(facet.name || '').trim() ||
      Number(facet.rank || 1) > 1 ||
      Number(facet.xp || 0) > 0
    );
  }

  function normalizeCompanion(entry) {
    return window.AppSystem.normalizeCompanion(entry);
  }

  character.companions = Array.isArray(character.companions) ? character.companions.map(normalizeCompanion) : [];

  function setAvatar(element, image, name, square) {
    companionUi.setAvatar(element, image, name, { square });
  }

  function ensureHydrated() {
    character = window.AppSystem.hydrateCharacter(character);
    character.resources.status = normalizeStatusForPv(character.resources.status, character.resources.pvCurrent);
  }

  function preserveCurrentCharacterIdentity(nextCharacter) {
    const hydrated = window.AppSystem.hydrateCharacter(nextCharacter);
    hydrated.id = character.id;
    hydrated.ownerUserId = character.ownerUserId;
    hydrated.ownerUsername = character.ownerUsername;
    return hydrated;
  }

  function buildCharacterExportFilename() {
    const slug = window.AppSystem.slugify(character.identity.name || 'personagem') || 'personagem';
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    return `${slug}-${stamp}.json`;
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

  async function persistCurrentCharacter() {
    const latestStored = window.AppStorage.getCharacterById(character.id);
    if (latestStored && latestStored.masterSession) {
      character.masterSession = latestStored.masterSession;
    }

    if (window.AppStorage.persistCharacter) {
      const savedCharacter = await window.AppStorage.persistCharacter(character);
      if (savedCharacter) character = savedCharacter;
      return character;
    }

    window.AppStorage.replaceCharacter(character.id, character);
    return character;
  }

  async function saveCharacter(options = {}) {
    const successMessage = options.successMessage || 'Salvo';
    const savingMessage = options.savingMessage || 'Salvando...';

    try {
      ensureHydrated();
      markSaving(savingMessage);
      blockExternalSync(2200);
      await persistCurrentCharacter();
      markSaveSuccess(successMessage);
      return character;
    } catch (error) {
      console.error(error);
      markSaveError(getSaveErrorMessage(error));
      throw error;
    }
  }

  const saveDebounced = debounce(() => {
    saveCharacter().catch(console.error);
  }, 850);

  const syncCombatControlDebounced = debounce(() => {
    syncCombatControlFromPanel().catch(console.error);
  }, 220);

  const syncOwnSheetResourcesToCombatDebounced = debounce(() => {
    syncOwnSheetResourcesToCombat().catch(console.error);
  }, 260);

  function persistCharacterOnPageHide() {
    if (!character || !character.id || !window.AppStorage.persistCharacter) return;
    try {
      ensureHydrated();
      const latestStored = window.AppStorage.getCharacterById(character.id);
      if (latestStored && latestStored.masterSession) {
        character.masterSession = latestStored.masterSession;
      }
      window.AppStorage.persistCharacter(character).catch(console.error);
    } catch (error) {
      console.error(error);
    }
  }

  window.addEventListener('pagehide', persistCharacterOnPageHide);

  function createAttributeInputs() {
    refs.attributeGrid.innerHTML = '';
    window.AppSystem.ATTRIBUTES.forEach((attribute) => {
      const label = document.createElement('label');
      label.innerHTML = `
        <span>${attribute.label}</span>
        <input type="number" min="0" data-attribute-key="${attribute.key}" />
      `;
      refs.attributeGrid.appendChild(label);
    });
  }

  function createSkillInputs() {
    refs.skillsGrid.innerHTML = '';
    window.AppSystem.SKILLS.forEach((skill) => {
      const article = document.createElement('article');
      article.className = 'info-card skill-card';
      article.dataset.skillCard = skill.key;
      article.innerHTML = `
        <div class="skill-card-top">
          <div>
            <strong>${skill.label}</strong>
            <p class="subtle">Perícia + metade do atributo escolhido</p>
          </div>
          <span class="skill-total-badge" data-role="skill-total">+0</span>
        </div>
        <div class="skill-editor-grid">
          <label>
            Valor
            <input type="number" min="0" data-skill-key="${skill.key}" />
          </label>
          <label>
            Atributo
            <select data-skill-attr="${skill.key}">
              ${getAttributeSelectOptions(window.AppSystem.getSkillDefaultAttribute(skill.key))}
            </select>
          </label>
        </div>
      `;
      refs.skillsGrid.appendChild(article);
    });
  }

  function renderAttributeValues() {
    const limit = window.AppSystem.getAttributeLimit(character.identity.level);
    refs.attributeGrid.querySelectorAll('input[data-attribute-key]').forEach((input) => {
      const key = input.dataset.attributeKey;
      input.max = String(limit);
      input.value = character.attributes[key] || 0;
    });
  }

  function renderSkillValues() {
    const limit = window.AppSystem.getSkillLimit(character.identity.level);
    refs.skillsGrid.querySelectorAll('[data-skill-card]').forEach((card) => {
      const key = card.dataset.skillCard;
      const input = card.querySelector('input[data-skill-key]');
      const select = card.querySelector('select[data-skill-attr]');
      const total = card.querySelector('[data-role="skill-total"]');
      input.max = String(limit);
      input.value = character.skills[key] || 0;
      select.value = character.skillAttributes[key] || window.AppSystem.getSkillDefaultAttribute(key);
      total.textContent = formatSigned(getSkillTotal(key));
    });
  }

  function createAptitudeEntry(entry) {
    const catalogOptions = ['<option value="">Aptidão personalizada</option>']
      .concat(window.AppSystem.APTITUDE_CATALOG.map((aptitude) => {
        const selected = aptitude.id === entry.catalogId ? 'selected' : '';
        return `<option value="${aptitude.id}" ${selected}>${aptitude.group} • ${aptitude.name}</option>`;
      }))
      .join('');

    const tierOptions = Object.keys(window.AppSystem.APTITUDE_COSTS)
      .map((tier) => `<option value="${tier}" ${tier === entry.tier ? 'selected' : ''}>${tier}</option>`)
      .join('');

    const catalog = entry.catalogId ? window.AppSystem.getAptitudeById(entry.catalogId) : null;
    const cost = window.AppSystem.getAptitudeCostByTier(entry.tier);
    const effectOptions = window.AppSystem.getAptitudeEffectOptions(entry.catalogId || '');
    const autoConfig = window.AppSystem.getAptitudeAutoConfig(entry.catalogId || '');
    const wrapper = document.createElement('article');
    wrapper.className = 'list-card';
    wrapper.dataset.aptitudeId = entry.id;
    wrapper.innerHTML = `
      <div class="list-card-grid aptitude-grid">
        <label class="span-2">
          Aptidão
          <select data-field="catalogId">${catalogOptions}</select>
        </label>
        <label>
          Nome personalizado
          <input type="text" data-field="customName" value="${escapeHtml(entry.customName || '')}" ${entry.catalogId ? 'disabled' : ''} />
        </label>
        <label>
          Grau
          <select data-field="tier">${tierOptions}</select>
        </label>
        <div class="static-meta-block">
          <strong>Custo</strong>
          <span>${cost} PeV</span>
        </div>
        <div class="static-meta-block span-3">
          <strong>Pré-requisitos</strong>
          <span>${catalog ? escapeHtml(catalog.prerequisites) : 'Defina manualmente se quiser.'}</span>
        </div>
        <div class="static-meta-block span-3">
          <strong>Efeito</strong>
          <span>${catalog ? escapeHtml(catalog.summary) : 'Aptidão personalizada; descreva nas notas.'}</span>
        </div>
        ${effectOptions.length ? `
          <label>
            Bônus fixo em
            <select data-field="effectChoice">
              ${effectOptions.map((option) => `<option value="${option.value}" ${option.value === entry.effectChoice ? 'selected' : ''}>${option.label}</option>`).join('')}
            </select>
          </label>
        ` : ''}
        <div class="static-meta-block ${effectOptions.length ? 'span-2' : 'span-3'}">
          <strong>Aplicação automática</strong>
          <span>${autoConfig ? 'O bônus fixo entra direto na ficha; a parte situacional fica só descrita.' : 'Sem efeito automático fixo na ficha.'}</span>
        </div>
        <label class="span-3">
          Notas
          <textarea rows="2" data-field="notes">${escapeHtml(entry.notes || '')}</textarea>
        </label>
      </div>
      <div class="card-actions-row">
        <button type="button" class="danger-button small-button" data-action="remove-aptitude">Remover</button>
      </div>
    `;
    return wrapper;
  }

  function renderAptitudes() {
    refs.aptitudesList.innerHTML = '';
    if (!character.aptitudes.length) {
      refs.aptitudesList.innerHTML = '<div class="empty-state">Nenhuma aptidão cadastrada.</div>';
      return;
    }
    character.aptitudes.forEach((entry) => refs.aptitudesList.appendChild(createAptitudeEntry(entry)));
  }

  function renderFacets() {
    refs.facetsList.innerHTML = '';
    if (!character.facets.length) {
      refs.facetsList.innerHTML = '<div class="empty-state">Nenhuma faceta cadastrada.</div>';
      return;
    }
    character.facets.forEach((entry, index) => {
      const row = document.createElement('article');
      row.className = 'list-card';
      row.dataset.facetIndex = String(index);
      row.innerHTML = `
        <div class="list-card-grid facet-grid">
          <label>
            Nome da Faceta
            <input type="text" data-field="name" value="${escapeHtml(entry.name || '')}" />
          </label>
          <label>
            Rank
            <input type="number" min="1" max="10" data-field="rank" value="${Number(entry.rank || 1)}" />
          </label>
          <label>
            XP
            <input type="number" min="0" max="999" data-field="xp" value="${Number(entry.xp || 0)}" />
          </label>
          <label class="span-3">
            Notas
            <input type="text" data-field="notes" value="${escapeHtml(entry.notes || '')}" />
          </label>
        </div>
        <div class="card-actions-row">
          <button type="button" class="danger-button small-button" data-action="remove-facet">Remover</button>
        </div>
      `;
      refs.facetsList.appendChild(row);
    });
  }

  function createCompanionCard(entry, index) {
    const article = document.createElement('article');
    article.className = 'info-card companion-mini-card';
    article.dataset.companionIndex = String(index);
    const filledSkills = (entry.skills || []).filter((skill) => skill && (skill.name || Number(skill.value || 0) > 0));
    const filledFacets = (entry.facets || []).filter((facet) => facet && (facet.name || Number(facet.xp || 0) > 0 || Number(facet.rank || 1) > 1));
    article.innerHTML = `
      <div class="companion-card-head">
        <div class="companion-head-left">
          <div class="avatar-shell small-avatar companion-avatar" data-avatar></div>
          <div>
            <h4>${escapeHtml(entry.name || 'Sem nome')}</h4>
            <p>${escapeHtml(entry.type || 'Sem tipo')}</p>
          </div>
        </div>
        <button type="button" class="secondary-button small-button" data-action="open-companion">Abrir mini-ficha</button>
      </div>
      <div class="card-stat-row wrap-row">
        <span class="stat-tag">PV ${Number(entry.pvCurrent || 0)}/${Number(entry.pvMax || 0)}</span>
        <span class="stat-tag">Armadura ${Number(entry.armor || 0)}</span>
        <span class="stat-tag">${escapeHtml(entry.status || 'Sem status')}</span>
      </div>
      <div class="card-stat-row wrap-row compact-tags-row">
        <span class="stat-tag">Perícias ${filledSkills.length}</span>
        <span class="stat-tag">Facetas ${filledFacets.length}</span>
      </div>
      <p class="subtle">${escapeHtml(entry.notes || 'Sem notas.')}</p>
      <div class="card-actions-row top-gap-small">
        <button type="button" class="danger-button small-button" data-action="remove-companion">Remover</button>
      </div>
    `;
    setAvatar(article.querySelector('[data-avatar]'), entry.image, entry.name, true);
    return article;
  }

  function renderCompanions() {
    refs.companionsList.innerHTML = '';
    if (!character.companions.length) {
      refs.companionsList.innerHTML = '<div class="empty-state">Nenhuma forma, ajudante ou entidade cadastrada.</div>';
      return;
    }
    character.companions.forEach((entry, index) => {
      refs.companionsList.appendChild(createCompanionCard(entry, index));
    });
  }

  function getCombatStateTimestamp(state) {
    const timestamp = Date.parse(String(state?.updatedAt || ''));
    return Number.isFinite(timestamp) ? timestamp : 0;
  }

  function getBaseCombatSharedState() {
    const liveState = window.AppSystem.hydrateCombatSharedState(liveCombatSharedState);
    const storedState = window.AppSystem.hydrateCombatSharedState(character?.masterSession?.combatShared);
    const liveTimestamp = getCombatStateTimestamp(liveState);
    const storedTimestamp = getCombatStateTimestamp(storedState);

    if (liveTimestamp || liveState.active || liveState.combatants.length) return liveState;

    const storedIsFresh = storedTimestamp && (Date.now() - storedTimestamp) < 300000;
    if (!storedIsFresh) return liveState;

    if (liveTimestamp > storedTimestamp) return liveState;
    if (storedTimestamp > liveTimestamp) return storedState;

    if (storedState.combatants.length > liveState.combatants.length) return storedState;
    if (liveState.combatants.length > storedState.combatants.length) return liveState;

    if (storedState.active && !liveState.active) return storedState;
    if (liveState.active && !storedState.active) return liveState;

    return liveState.updatedAt ? liveState : storedState;
  }

  function syncCharacterCombatSharedState(sharedState) {
    if (!character) return;
    const safeState = window.AppSystem.hydrateCombatSharedState(sharedState);
    character.masterSession = window.AppSystem.hydrateMasterSession({
      ...(character.masterSession || {}),
      combatShared: null
    });

    const ownEntries = (Array.isArray(safeState.combatants) ? safeState.combatants : [])
      .filter((entry) => String(entry?.sourceCharacterId || '') === String(character.id || ''));
    let changed = false;

    ownEntries.forEach((entry) => {
      const status = normalizeCombatStatus(entry.status, 'Vivo');
      const hasPvPayload = Number(entry.pvMax || 0) > 0 || Number(entry.pvCurrent || 0) > 0;

      if (entry.combatantType === 'character') {
        if (hasPvPayload && Number(character.resources?.pvCurrent || 0) !== Number(entry.pvCurrent || 0)) {
          character.resources.pvCurrent = Number(entry.pvCurrent || 0);
          changed = true;
        }
        if (normalizeCombatStatus(character.resources?.status, 'Vivo') !== status) {
          character.resources.status = status;
          changed = true;
        }
      }

      if (entry.combatantType === 'companion' && entry.sourceCompanionId) {
        const companion = (Array.isArray(character.companions) ? character.companions : [])
          .find((item) => String(item.id || '') === String(entry.sourceCompanionId || ''));
        if (!companion) return;

        if (hasPvPayload && Number(companion.pvCurrent || 0) !== Number(entry.pvCurrent || 0)) {
          companion.pvCurrent = Number(entry.pvCurrent || 0);
          changed = true;
        }
        if (normalizeCombatStatus(companion.status, 'Vivo') !== status) {
          companion.status = status;
          changed = true;
        }
        if ((entry.isForm || isFormCompanion(companion)) && normalizeCombatStatus(character.resources?.status, 'Vivo') !== status) {
          character.resources.status = status;
          changed = true;
        }
      }
    });

    if (!safeState.active || !safeState.combatants.length) {
      selectedCombatFormId = '';
    }

    if (changed) {
      character = window.AppSystem.hydrateCharacter(character);
    }
  }

  function getCombatControlState() {
    const control = window.AppSystem.hydrateCombatControlState(pendingCombatControl);

    if (!control.requestId) return control;
    if (Date.now() - localCombatControlSentAt > 8000) {
      return window.AppSystem.hydrateCombatControlState(null);
    }

    return control;
  }

  function clearPendingCombatControl() {
    pendingCombatControl = null;
    localCombatControlSentAt = 0;
  }

  function combatStateMatchesPendingControl(sharedState, controlState = pendingCombatControl) {
    const safeState = window.AppSystem.hydrateCombatSharedState(sharedState);
    const control = window.AppSystem.hydrateCombatControlState(controlState);
    if (!control.requestId) return false;

    const ownEntries = (Array.isArray(safeState.combatants) ? safeState.combatants : []).filter((entry) => {
      return String(entry?.sourceCharacterId || '') === String(character?.id || '');
    });
    const selfEntry = ownEntries.find((entry) => entry.combatantType === 'character') || null;
    const companionEntries = ownEntries.filter((entry) => entry.combatantType === 'companion');
    const forms = (Array.isArray(character?.companions) ? character.companions : []).filter(isFormCompanion);
    const formIds = new Set(forms.map((entry) => String(entry?.id || '')));
    const activeFormControls = control.companions.filter((entry) => {
      return formIds.has(String(entry?.companionId || '')) && entry?.inEncounter === true;
    });
    const explicitFormControls = control.companions.filter((entry) => {
      return formIds.has(String(entry?.companionId || '')) && typeof entry?.inEncounter === 'boolean';
    });
    const selectedFormControl = activeFormControls.length ? activeFormControls[activeFormControls.length - 1] : null;
    const selectedFormEntry = selectedFormControl
      ? companionEntries.find((entry) => String(entry?.sourceCompanionId || '') === String(selectedFormControl.companionId || '')) || null
      : null;
    const sharedActorEntry = selectedFormEntry || selfEntry || companionEntries.find((entry) => formIds.has(String(entry?.sourceCompanionId || ''))) || null;

    if (control.self?.inEncounter === false) {
      if (ownEntries.length) return false;
    } else if (selectedFormControl) {
      if (!selectedFormEntry || selfEntry) return false;
    } else if (explicitFormControls.length) {
      if (!selfEntry) return false;
    } else if (control.self || ownEntries.length) {
      if (!sharedActorEntry) return false;
    }

    if (
      control.self
      && control.self.initiativeTotal !== null
      && control.self.initiativeTotal !== undefined
      && sharedActorEntry
      && Number(sharedActorEntry.initiativeTotal || 0) !== Number(control.self.initiativeTotal || 0)
    ) {
      return false;
    }

    if (
      control.self
      && control.self.pvCurrent !== null
      && control.self.pvCurrent !== undefined
      && selfEntry
      && Number(selfEntry.pvCurrent || 0) !== Number(control.self.pvCurrent || 0)
    ) {
      return false;
    }

    if (
      selectedFormEntry
      && selectedFormControl
      && selectedFormControl.pvCurrent !== null
      && selectedFormControl.pvCurrent !== undefined
      && Number(selectedFormEntry.pvCurrent || 0) !== Number(selectedFormControl.pvCurrent || 0)
    ) {
      return false;
    }

    const supportControls = control.companions.filter((entry) => !formIds.has(String(entry?.companionId || '')));
    for (const supportControl of supportControls) {
      const supportEntry = companionEntries.find((entry) => {
        return String(entry?.sourceCompanionId || '') === String(supportControl?.companionId || '');
      }) || null;

      if (supportControl?.inEncounter === false && supportEntry) return false;
      if (supportControl?.inEncounter === true && !supportEntry) return false;
      if (
        supportEntry
        && supportControl?.initiativeTotal !== null
        && supportControl?.initiativeTotal !== undefined
        && Number(supportEntry.initiativeTotal || 0) !== Number(supportControl.initiativeTotal || 0)
      ) {
        return false;
      }
      if (
        supportEntry
        && supportControl?.pvCurrent !== null
        && supportControl?.pvCurrent !== undefined
        && Number(supportEntry.pvCurrent || 0) !== Number(supportControl.pvCurrent || 0)
      ) {
        return false;
      }
    }

    return true;
  }

  function buildCombatPreviewState(baseSharedState) {
    const baseState = window.AppSystem.hydrateCombatSharedState(baseSharedState);
    const control = getCombatControlState();
    const hasPendingControl = Boolean(control.requestId && (control.self || control.companions.length));

    if (!baseState.active || !baseState.combatants.length || !hasPendingControl) {
      return baseState;
    }

    if (combatStateMatchesPendingControl(baseState, control)) {
      clearPendingCombatControl();
      return baseState;
    }

    const forms = (Array.isArray(character.companions) ? character.companions : []).filter(isFormCompanion);
    const formIds = new Set(forms.map((entry) => entry.id));
    const ownEntries = baseState.combatants.filter((entry) => entry.sourceCharacterId === character.id);

    if (!ownEntries.length) {
      return baseState;
    }

    const ownCharacterEntry = ownEntries.find((entry) => entry.combatantType === 'character') || null;
    const ownFormEntries = ownEntries.filter((entry) => entry.combatantType === 'companion' && formIds.has(entry.sourceCompanionId));
    const actorEntry = ownCharacterEntry || ownFormEntries[0] || null;
    const actorOrder = Math.max(1, Number(actorEntry?.order || 1));
    const actorWasCurrentTurn = ownEntries.some((entry) => entry.isCurrentTurn);
    const sharedInitiative = control.self && control.self.initiativeTotal !== null && control.self.initiativeTotal !== undefined
      ? Number(control.self.initiativeTotal || 0)
      : Number(actorEntry?.initiativeTotal || 0);
    const characterPv = control.self && control.self.pvCurrent !== null && control.self.pvCurrent !== undefined
      ? Number(control.self.pvCurrent || 0)
      : Number(character.resources?.pvCurrent || ownCharacterEntry?.pvCurrent || 0);
    const sharedStatus = normalizeCombatStatus(
      actorEntry?.status || ownCharacterEntry?.status || ownFormEntries[0]?.status || character.resources?.status,
      'Vivo'
    );
    const canSwapSharedActor = sharedStatus === 'Vivo';
    const activeFormControl = control.companions.find((entry) => entry.inEncounter === true && formIds.has(entry.companionId)) || null;
    const explicitFormControls = control.companions.filter((entry) => {
      return formIds.has(String(entry?.companionId || '')) && typeof entry?.inEncounter === 'boolean';
    });
    const activeForm = activeFormControl
      ? forms.find((entry) => entry.id === activeFormControl.companionId) || null
      : null;
    const selfExitRequested = Boolean(control.self && control.self.inEncounter === false);
    const returnToCharacterRequested = Boolean(
      !activeForm
      && !selfExitRequested
      && explicitFormControls.length
    );
    const nonFormControls = new Map(
      control.companions
        .filter((entry) => !formIds.has(entry.companionId))
        .map((entry) => [entry.companionId, entry])
    );

    let nextCombatants = baseState.combatants
      .filter((entry) => {
        if (entry.sourceCharacterId !== character.id) return true;

        if (entry.combatantType === 'character') return false;
        if (entry.combatantType === 'companion' && formIds.has(entry.sourceCompanionId)) return false;

        const companionControl = nonFormControls.get(entry.sourceCompanionId || '');
        if (companionControl && companionControl.inEncounter === false) return false;
        return true;
      })
      .map((entry) => {
        if (entry.sourceCharacterId !== character.id || entry.combatantType !== 'companion') return { ...entry };

        const companionControl = nonFormControls.get(entry.sourceCompanionId || '');
        if (!companionControl) return { ...entry };

      return {
        ...entry,
        initiativeTotal: companionControl.initiativeTotal !== null && companionControl.initiativeTotal !== undefined
          ? Number(companionControl.initiativeTotal || 0)
          : Number(entry.initiativeTotal || 0),
        pvCurrent: companionControl.pvCurrent !== null && companionControl.pvCurrent !== undefined
          ? Number(companionControl.pvCurrent || 0)
          : Number(entry.pvCurrent || 0)
      };
      });

    let previewCurrentInstanceId = String(baseState.currentInstanceId || '');
    let previewActorInstanceId = '';

    if (!selfExitRequested) {
      if (activeForm && canSwapSharedActor) {
        previewActorInstanceId = `preview-form-${activeForm.id}`;
        nextCombatants.push({
          order: actorOrder,
          instanceId: previewActorInstanceId,
          combatantType: 'companion',
          typeLabel: 'Forma',
          name: activeForm.name || 'Forma',
          subtitle: `${activeForm.type || 'Forma'} | ${character.identity?.name || 'Sem dono'}`,
          status: sharedStatus,
          pvCurrent: activeFormControl?.pvCurrent !== null && activeFormControl?.pvCurrent !== undefined
            ? Number(activeFormControl.pvCurrent || 0)
            : Number(activeForm.pvCurrent || 0),
          pvMax: Number(activeForm.pvMax || actorEntry?.pvMax || 0),
          initiativeTotal: sharedInitiative,
          sourceCharacterId: character.id,
          sourceCompanionId: activeForm.id,
          ownerName: character.identity?.name || '',
          image: activeForm.image || '',
          isForm: true,
          isCurrentTurn: actorWasCurrentTurn
        });
      } else if (actorEntry && (!canSwapSharedActor || !returnToCharacterRequested)) {
        previewActorInstanceId = String(actorEntry.instanceId || '');
        const actorLocalForm = actorEntry.combatantType === 'companion'
          ? forms.find((entry) => String(entry.id || '') === String(actorEntry.sourceCompanionId || '')) || null
          : null;
        const actorPv = actorEntry.combatantType === 'character'
          ? characterPv
          : Number(actorLocalForm?.pvCurrent ?? actorEntry.pvCurrent ?? 0);

        nextCombatants.push({
          ...actorEntry,
          order: actorOrder,
          status: sharedStatus,
          pvCurrent: actorPv,
          pvMax: Number(actorEntry.pvMax || 0),
          initiativeTotal: sharedInitiative,
          isCurrentTurn: actorWasCurrentTurn
        });
      } else {
        previewActorInstanceId = `preview-self-${character.id}`;
        nextCombatants.push({
          order: actorOrder,
          instanceId: previewActorInstanceId,
          combatantType: 'character',
          typeLabel: 'Player',
          name: character.identity?.name || 'Personagem',
          subtitle: `${character.identity?.className || 'Personagem'} | Nv ${Number(character.identity?.level || 1)}`,
          status: sharedStatus,
          pvCurrent: characterPv,
          pvMax: Number(actorEntry?.pvMax || 0),
          initiativeTotal: sharedInitiative,
          sourceCharacterId: character.id,
          sourceCompanionId: '',
          ownerName: '',
          image: character.identity?.image || '',
          isForm: false,
          isCurrentTurn: actorWasCurrentTurn
        });
      }
    }

    if (actorWasCurrentTurn) {
      previewCurrentInstanceId = previewActorInstanceId;
    }

    nextCombatants = nextCombatants
      .sort((left, right) => Number(left.order || 0) - Number(right.order || 0))
      .map((entry, index) => ({
        ...entry,
        order: index + 1,
        isCurrentTurn: previewCurrentInstanceId
          ? String(entry.instanceId || '') === previewCurrentInstanceId
          : false
      }));

    return window.AppSystem.hydrateCombatSharedState({
      ...baseState,
      active: nextCombatants.length > 0,
      currentInstanceId: previewCurrentInstanceId,
      combatants: nextCombatants
    });
  }

  function getCombatSharedState() {
    return buildCombatPreviewState(getBaseCombatSharedState());
  }

  function getOwnCombatEntries(sharedState) {
    const combatants = Array.isArray(sharedState?.combatants) ? sharedState.combatants : [];
    return combatants.filter((entry) => entry.sourceCharacterId === character.id);
  }

  function isFormCompanion(entry) {
    return window.AppSystem.isCompanionForm(entry);
  }

  function resolveCombatEntryImage(entry) {
    if (entry?.image) return entry.image;

    if (entry?.combatantType === 'character' && entry?.sourceCharacterId) {
      return window.AppStorage.getCharacterById(entry.sourceCharacterId)?.identity?.image || '';
    }

    if (entry?.combatantType === 'companion' && entry?.sourceCharacterId && entry?.sourceCompanionId) {
      const owner = window.AppStorage.getCharacterById(entry.sourceCharacterId);
      return (Array.isArray(owner?.companions) ? owner.companions : []).find((companion) => companion.id === entry.sourceCompanionId)?.image || '';
    }

    return '';
  }

  function isOwnedFormCombatEntry(entry) {
    if (!entry || entry.combatantType !== 'companion' || entry.sourceCharacterId !== character.id) return false;
    const localCompanion = (Array.isArray(character.companions) ? character.companions : [])
      .find((companion) => companion.id === entry.sourceCompanionId);
    return isFormCompanion(localCompanion || entry);
  }

  function getCombatOwnership(sharedState) {
    const ownEntries = getOwnCombatEntries(sharedState);
    const selfEntry = ownEntries.find((entry) => entry.combatantType === 'character') || null;
    const companionEntries = ownEntries.filter((entry) => entry.combatantType === 'companion');
    const forms = (Array.isArray(character.companions) ? character.companions : []).filter(isFormCompanion);
    const supportCompanions = (Array.isArray(character.companions) ? character.companions : []).filter((entry) => !isFormCompanion(entry));
    const activeFormEntry = companionEntries.find((entry) => {
      const localCompanion = (character.companions || []).find((companion) => companion.id === entry.sourceCompanionId);
      return isFormCompanion(localCompanion);
    }) || null;

    if (forms.length) {
      const formIds = new Set(forms.map((entry) => entry.id));
      if (!selectedCombatFormId || !formIds.has(selectedCombatFormId)) {
        selectedCombatFormId = activeFormEntry?.sourceCompanionId || forms[0].id;
      }
    } else {
      selectedCombatFormId = '';
    }

    const selectedForm = forms.find((entry) => entry.id === selectedCombatFormId) || null;
    const selectedFormActiveEntry = selectedForm
      ? companionEntries.find((entry) => entry.sourceCompanionId === selectedForm.id) || null
      : null;
    const supportRows = supportCompanions.map((entry) => {
      const activeEntry = companionEntries.find((item) => item.sourceCompanionId === entry.id) || null;
      return {
        companion: entry,
        activeEntry
      };
    });

    return {
      ownEntries,
      selfEntry,
      forms,
      supportRows,
      activeFormEntry,
      selectedForm,
      selectedFormActiveEntry
    };
  }

  function getSharedActorStatus(ownership) {
    return normalizeCombatStatus(
      ownership.activeFormEntry?.status
      || ownership.selfEntry?.status
      || ownership.ownEntries.find((entry) => entry.combatantType === 'companion' && entry.isForm)?.status
      || character.resources?.status,
      'Vivo'
    );
  }

  function getCombatPercent(current, max) {
    return combatUtils?.percent
      ? combatUtils.percent(current, max)
      : (!max || max <= 0 ? 0 : Math.max(0, Math.min(100, Math.round((current / max) * 100))));
  }

  function getCombatSyncLabel() {
    return combatUtils?.syncLabel
      ? combatUtils.syncLabel(lastCombatSyncAt)
      : (() => {
        if (!lastCombatSyncAt) return 'Aguardando sync';
        const secondsAgo = Math.max(0, Math.round((Date.now() - lastCombatSyncAt) / 1000));
        if (secondsAgo <= 1) return 'Atualizado agora';
        if (secondsAgo < 60) return `Atualizado ha ${secondsAgo}s`;
        const minutesAgo = Math.max(1, Math.round(secondsAgo / 60));
        return `Atualizado ha ${minutesAgo}min`;
      })();
  }

  function getRepresentedCombatEntry(ownership) {
    return ownership.activeFormEntry || ownership.selfEntry || ownership.ownEntries[0] || null;
  }

  function getNextCombatant(combatants, currentEntry) {
    return combatUtils?.getNextCombatant
      ? combatUtils.getNextCombatant(combatants, currentEntry)
      : (() => {
        if (!Array.isArray(combatants) || !combatants.length) return null;
        if (!currentEntry) return combatants[0] || null;
        const currentIndex = combatants.findIndex((entry) => String(entry.instanceId || '') === String(currentEntry.instanceId || ''));
        if (currentIndex < 0) return combatants[0] || null;
        return combatants[(currentIndex + 1) % combatants.length] || null;
      })();
  }

  function trackCombatVisualState(sharedState) {
    const safeState = window.AppSystem.hydrateCombatSharedState(sharedState);
    const ownership = getCombatOwnership(safeState);
    const representedEntry = getRepresentedCombatEntry(ownership);
    const representedKey = representedEntry
      ? (combatUtils?.actorKey ? combatUtils.actorKey(representedEntry) : `${representedEntry.combatantType}:${representedEntry.instanceId || representedEntry.sourceCompanionId || representedEntry.sourceCharacterId}`)
      : '';
    const currentTurnId = String(safeState.currentInstanceId || '');

    if (representedKey && lastRepresentedActorKey && representedKey !== lastRepresentedActorKey) {
      representedActorFlashUntil = Date.now() + 1800;
    }

    if (currentTurnId && lastCurrentTurnInstanceId && currentTurnId !== lastCurrentTurnInstanceId) {
      currentTurnFlashUntil = Date.now() + 1800;
    }

    lastRepresentedActorKey = representedKey;
    lastCurrentTurnInstanceId = currentTurnId;
    lastCombatSyncAt = Date.now();
    combatSyncPulseUntil = Date.now() + 1100;
  }

  function buildCombatResourceBar(current, max, key = 'pv', label = 'PV') {
    const safeMax = Math.max(0, Number(max || 0));
    const safeCurrent = Math.max(0, Math.min(safeMax || Number(current || 0), Number(current || 0)));
    const pct = getCombatPercent(safeCurrent, safeMax);

    return `
      <div class="combat-resource-block">
        <div class="combat-resource-head">
          <span>${escapeHtml(label)}</span>
          <strong>${safeCurrent}/${safeMax}</strong>
        </div>
        <div class="resource-bar-shell combat-resource-shell">
          <div class="resource-bar-track">
            <div class="resource-bar-fill bar-${escapeHtml(key)}" style="width: ${pct}%"></div>
          </div>
          <div class="resource-bar-meta">
            <span>${safeCurrent}/${safeMax}</span>
            <span>${pct}%</span>
          </div>
        </div>
      </div>
    `;
  }

  function getCombatAttributeTags(attributes, limit = 4) {
    const ordered = [
      ['forca', 'Forca'],
      ['destreza', 'Destreza'],
      ['sentidos', 'Sentidos'],
      ['vigor', 'Vigor'],
      ['inteligencia', 'Inteligencia'],
      ['nexo', 'Nexo']
    ];

    return ordered
      .filter(([key]) => Number(attributes?.[key] || 0) > 0)
      .slice(0, limit)
      .map(([key, label]) => ({
        key,
        label,
        value: Number(attributes?.[key] || 0)
      }));
  }

  function getCombatActorView(ownership) {
    const representedEntry = getRepresentedCombatEntry(ownership);
    const derived = window.AppSystem.calculateDerived(character);

    if (ownership.activeFormEntry) {
      const form = (character.companions || []).find((entry) => entry.id === ownership.activeFormEntry.sourceCompanionId)
        || ownership.selectedForm
        || {};

      return {
        kind: 'form',
        entry: ownership.activeFormEntry,
        local: form,
        image: form.image || ownership.activeFormEntry.image || '',
        name: form.name || ownership.activeFormEntry.name || 'Forma',
        subtitle: `Transformado | ${character.identity?.name || 'Personagem'}`,
        status: normalizeCombatStatus(ownership.activeFormEntry.status || form.status, 'Vivo'),
        pvCurrent: Number(ownership.activeFormEntry.pvCurrent ?? form.pvCurrent ?? 0),
        pvMax: Number(ownership.activeFormEntry.pvMax ?? form.pvMax ?? 0),
        armor: Number(form.armor ?? ownership.activeFormEntry.armor ?? 0),
        dodge: Number(ownership.activeFormEntry.dodge || 0),
        block: Number(ownership.activeFormEntry.block || 0),
        initiative: Number(ownership.activeFormEntry.initiativeTotal || 0),
        label: 'Transformado',
        chipClass: 'combat-transformed-chip',
        representedEntry
      };
    }

    return {
      kind: 'character',
      entry: ownership.selfEntry,
      local: character,
      image: character.identity?.image || '',
      name: character.identity?.name || 'Personagem',
      subtitle: `${character.identity?.className || 'Personagem'} | Nivel ${Number(character.identity?.level || 1)}`,
      status: getSharedActorStatus(ownership),
      pvCurrent: Number(character.resources?.pvCurrent || 0),
      pvMax: Number(derived.maxPv || 0),
      peCurrent: Number(character.resources?.peCurrent || 0),
      peMax: Number(derived.maxPe || 0),
      pdCurrent: Number(character.resources?.pdCurrent || 0),
      pdMax: Number(derived.maxPd || 0),
      armor: Number(derived.armor || 0),
      dodge: Number(derived.esquivaMod || 0),
      block: Number(derived.selectedBlock || 0),
      manifestation: Number(derived.manifestationMod || 0),
      initiative: ownership.selfEntry
        ? Number(ownership.selfEntry.initiativeTotal || 0)
        : (ownership.activeFormEntry ? Number(ownership.activeFormEntry.initiativeTotal || 0) : 0),
      label: ownership.selfEntry ? 'Em cena' : (ownership.ownEntries.length ? 'Representado' : 'Aguardando'),
      chipClass: ownership.selfEntry ? 'combat-self-chip' : 'combat-standby-chip',
      representedEntry
    };
  }

  function buildPlayerInitiativeRail(combatants, currentEntry, nextEntry, representedEntry) {
    if (!Array.isArray(combatants) || !combatants.length) {
      return '<span class="master-empty-inline">Sem ordem de iniciativa.</span>';
    }

    return combatants.map((entry) => {
      const isCurrent = currentEntry && String(currentEntry.instanceId || '') === String(entry.instanceId || '');
      const isNext = nextEntry && String(nextEntry.instanceId || '') === String(entry.instanceId || '');
      const isYou = representedEntry && String(representedEntry.instanceId || '') === String(entry.instanceId || '');

      return `
        <span class="player-initiative-pill${isCurrent ? ' is-current' : ''}${isNext ? ' is-next' : ''}${isYou ? ' is-you' : ''}">
          ${companionUi.avatarMarkup(resolveCombatEntryImage(entry), entry.name, { wrapperClass: 'avatar-shell tiny-avatar avatar-square' })}
          <span>${escapeHtml(entry.name || 'Combatente')}</span>
          <small>${Number(entry.initiativeTotal || 0)}</small>
        </span>
      `;
    }).join('');
  }

  function buildPlayerCombatHero(sharedState, ownership, currentEntry, nextEntry, uiState = {}) {
    const representedEntry = getRepresentedCombatEntry(ownership);
    const actor = getCombatActorView(ownership);
    const isOwnTurn = ownership.ownEntries.some((entry) => Boolean(entry.isCurrentTurn));
    const statusClass = getCombatStatusVisualClass(actor.status);
    const turnTitle = isOwnTurn ? 'Sua vez' : 'Aguardando';
    const turnSubtitle = currentEntry
      ? `${currentEntry.name} esta agindo agora`
      : 'O mestre ainda nao definiu o turno atual';

    return `
      <article class="info-card player-combat-hero ${isOwnTurn ? 'is-your-turn' : 'is-waiting'} ${statusClass}${uiState.turnFlash ? ' is-turn-spotlight' : ''}">
        <div class="player-combat-hero-main">
          <div class="player-turn-kicker">${escapeHtml(turnTitle)}</div>
          <h3>${escapeHtml(turnSubtitle)}</h3>
          <p class="subtle">${escapeHtml(nextEntry ? `Proximo: ${nextEntry.name}` : `Rodada ${Math.max(1, Number(sharedState.round || 1))}`)}</p>
        </div>
        <div class="player-combat-hero-actor">
          ${companionUi.avatarMarkup(actor.image, actor.name, { wrapperClass: 'avatar-shell profile-editor-avatar square-avatar player-combat-hero-avatar' })}
          <div>
            <span class="master-overview-label">${escapeHtml(actor.kind === 'form' ? 'Transformado' : 'Voce no combate')}</span>
            <strong>${escapeHtml(actor.name)}</strong>
            <p class="subtle">${escapeHtml(`${actor.subtitle} | ${actor.status}`)}</p>
          </div>
        </div>
        <div class="player-combat-hero-meta">
          <span class="stat-tag ${actor.chipClass}">${escapeHtml(actor.label)}</span>
          <span class="stat-tag ${statusClass}">${escapeHtml(actor.status)}</span>
          <span class="stat-tag">Inic ${Number(actor.initiative || 0)}</span>
          <span class="stat-tag">Rodada ${Math.max(1, Number(sharedState.round || 1))}</span>
        </div>
      </article>
    `;
  }

  function buildCombatCharacterSummaryCard(sharedState, ownership, uiState = {}) {
    const actor = getCombatActorView(ownership);
    const sharedInitiative = Number(actor.initiative || 0);
    const sharedStatus = actor.status;
    const activeFormId = actor.kind === 'form' ? String(actor.local?.id || actor.entry?.sourceCompanionId || '') : '';
    const cardClasses = [
      'info-card',
      'combat-sheet-card',
      'player-current-actor-card',
      getCombatStatusVisualClass(sharedStatus)
    ];

    if (ownership.activeFormEntry) {
      cardClasses.push('is-representing-actor');
    } else if (ownership.selfEntry) {
      cardClasses.push('is-representing-actor');
    }

    if (uiState.representedActorFlash && !ownership.activeFormEntry) {
      cardClasses.push('is-swap-highlight');
    }

    return `
      <article class="${cardClasses.join(' ')}" data-combat-self-card>
        <div class="combat-sheet-head">
          <div class="companion-head-left">
            ${companionUi.avatarMarkup(actor.image, actor.name, { wrapperClass: 'avatar-shell profile-editor-avatar square-avatar player-current-actor-avatar' })}
            <div>
              <span class="master-overview-label">${escapeHtml(actor.kind === 'form' ? 'Transformado' : 'Voce')}</span>
              <strong>${escapeHtml(actor.name)}</strong>
              <p class="subtle">${escapeHtml(actor.subtitle)}</p>
            </div>
          </div>
          <div class="card-actions-row compact-actions">
            <button type="button" class="secondary-button small-button" data-action="jump-combat-overview">Geral</button>
            ${actor.kind === 'form' ? `<button type="button" class="secondary-button small-button" data-action="open-combat-form-sheet" data-companion-id="${escapeHtml(activeFormId)}">Abrir ficha</button>` : ''}
            ${ownership.forms.length ? '<button type="button" class="secondary-button small-button" data-action="focus-combat-forms">Trocar forma</button>' : ''}
            ${(ownership.selfEntry || ownership.activeFormEntry) ? '<button type="button" class="danger-button small-button" data-action="leave-combat-self">Sair da cena</button>' : ''}
          </div>
        </div>

        ${buildCombatResourceBar(actor.pvCurrent, actor.pvMax, 'pv', actor.kind === 'form' ? 'PV da forma' : 'PV atual')}

        ${actor.kind === 'character' ? `
          <div class="player-current-resource-row">
            ${buildCombatResourceBar(actor.peCurrent, actor.peMax, 'pe', 'PE')}
            ${buildCombatResourceBar(actor.pdCurrent, actor.pdMax, 'pd', 'PD')}
          </div>
        ` : ''}

        <div class="card-stat-row wrap-row compact-tags-row player-current-tags">
          <span class="stat-tag ${getCombatStatusVisualClass(sharedStatus)}">${escapeHtml(sharedStatus)}</span>
          <span class="stat-tag ${actor.chipClass}">${escapeHtml(actor.label)}</span>
        </div>
        <div class="combat-control-grid top-gap-small">
          <label>
            Iniciativa compartilhada
            <input type="number" min="-99" max="999" data-field="selfInitiativeTotal" value="${sharedInitiative}" />
          </label>
          <div class="combat-inline-note">
            <strong>${escapeHtml(actor.kind === 'form' ? 'Forma ativa na ordem' : 'Iniciativa do seu turno')}</strong>
            <span class="subtle">Personagem e formas compartilham essa iniciativa na cena.</span>
          </div>
        </div>
      </article>
    `;
  }

  function buildFormChoiceButton(entry, options = {}) {
    const isActive = Boolean(options.isActive);
    const isSelected = Boolean(options.isSelected);
    const disabled = Boolean(options.disabled);

    return `
      <button
        type="button"
        class="player-form-choice${isActive ? ' is-active' : ''}${isSelected ? ' is-selected' : ''}"
        data-action="select-combat-form"
        data-companion-id="${escapeHtml(entry.id)}"
        ${disabled ? 'disabled' : ''}
      >
        ${companionUi.avatarMarkup(entry.image, entry.name, { wrapperClass: 'avatar-shell tiny-avatar avatar-square' })}
        <span>${escapeHtml(entry.name || 'Forma')}</span>
        <small>${isActive ? 'Atual' : `PV ${Number(entry.pvCurrent || 0)}/${Number(entry.pvMax || 0)}`}</small>
      </button>
    `;
  }

  function getCombatFormOffset(index, selectedIndex, total) {
    let offset = index - selectedIndex;
    const half = Math.floor(total / 2);
    if (offset > half) offset -= total;
    if (offset < -half) offset += total;
    return offset;
  }

  function buildOmnivitaFormToken(entry, index, selectedIndex, activeFormId, options = {}) {
    const offset = getCombatFormOffset(index, selectedIndex, options.total || 1);
    const distance = Math.abs(offset);
    const isSelected = String(entry.id || '') === String(options.selectedFormId || '');
    const isActive = String(entry.id || '') === String(activeFormId || '');
    const hidden = distance > 2;
    const disabled = Boolean(options.disabled);
    const image = getOmnivitaSilhouetteImage(entry);

    return `
      <button
        type="button"
        class="omnivita-form-token${isSelected ? ' is-selected' : ''}${isActive ? ' is-active' : ''}${hidden ? ' is-hidden' : ''}"
        style="--offset: ${offset}; --distance: ${distance};"
        data-action="omnivita-form-token"
        data-companion-id="${escapeHtml(entry.id)}"
        aria-label="${escapeHtml(entry.name || 'Forma')}"
        title="${escapeHtml(entry.name || 'Forma')}"
        ${disabled ? 'disabled' : ''}
      >
        <span class="omnivita-form-image" aria-hidden="true">
          ${image ? `<img src="${escapeHtml(image)}" alt="" draggable="false" />` : `<span>${escapeHtml(String(entry.name || 'F').slice(0, 2).toUpperCase())}</span>`}
        </span>
      </button>
    `;
  }

  function buildOmnivitaCombatFormsSection(ownership, uiState = {}) {
    if (!ownership.forms.length) return '';

    const selectedForm = ownership.selectedForm || ownership.forms[0];
    const activeFormEntry = ownership.activeFormEntry;
    const activeFormId = String(activeFormEntry?.sourceCompanionId || '');
    const activeForm = activeFormId
      ? ownership.forms.find((entry) => String(entry.id || '') === activeFormId) || selectedForm
      : null;
    const selectedIndex = Math.max(0, ownership.forms.findIndex((entry) => String(entry.id || '') === String(selectedForm?.id || '')));
    const sharedStatus = getSharedActorStatus(ownership);
    const canSwapForms = sharedStatus === 'Vivo';
    const isDischarging = omnivitaVisualState === 'discharging';
    const isCooldown = omnivitaVisualState === 'cooldown' && !activeFormId;
    const selectedIsActive = activeFormId && String(selectedForm?.id || '') === activeFormId;
    const isBrowsingWhileTransformed = false;
    const canBrowseForms = canSwapForms && !activeFormId && !isDischarging && !isCooldown;
    const activePvCurrent = Number(activeFormEntry?.pvCurrent ?? activeForm?.pvCurrent ?? 0);
    const activePvMax = Number(activeFormEntry?.pvMax ?? activeForm?.pvMax ?? 0);
    const selectedPvCurrent = Number(selectedForm?.pvCurrent || 0);
    const selectedPvMax = Number(selectedForm?.pvMax || 0);
    const mainActionLabel = isCooldown
      ? 'Recarregar'
      : (isDischarging
        ? 'Descarregando'
        : (activeFormId && selectedIsActive
          ? 'Descarregar'
          : (activeFormId && !selectedIsActive ? 'Trocar forma' : 'Transformar')));
    const statusLabel = !canSwapForms
      ? `Bloqueado: ${sharedStatus}`
      : (isCooldown
        ? 'Descarregado'
        : (isDischarging
          ? 'Descarregando'
          : (activeFormId
            ? (selectedIsActive ? `${activeForm?.name || 'Forma'} ativo` : `${selectedForm?.name || 'Forma'} selecionado`)
            : `${selectedForm?.name || 'Forma'} selecionado`)));

    return `
      <article
        class="info-card combat-form-card player-omnivita-combat-card${activeFormId ? ' is-transformed' : ''}${isBrowsingWhileTransformed ? ' is-browsing' : ''}${isDischarging ? ' is-discharging' : ''}${isCooldown ? ' is-cooldown' : ''}${canSwapForms ? '' : ' is-disabled'}${uiState.representedActorFlash && activeFormId ? ' is-swap-highlight' : ''}"
        data-combat-form-card
        data-omnivita-combat
        data-active="${activeFormId ? 'true' : 'false'}"
        data-companion-id="${escapeHtml(selectedForm?.id || '')}"
      >
        <div class="omnivita-combat-head">
          <div>
            <strong>OmniVita</strong>
            <p class="subtle">${escapeHtml(statusLabel)}</p>
          </div>
          <div class="card-actions-row compact-actions">
            <button type="button" class="secondary-button small-button" data-action="open-combat-form-sheet" data-companion-id="${escapeHtml(selectedForm?.id || '')}">Abrir ficha</button>
          </div>
        </div>

        <div class="omnivita-combat-stage" aria-label="Controle visual de transformacao do Cael">
          <button
            type="button"
            class="omnivita-combat-device"
            data-action="omnivita-main"
            ${canSwapForms && !isDischarging ? '' : 'disabled'}
            aria-label="${escapeHtml(mainActionLabel)}"
          >
            <span class="omnivita-combat-cylinder">
              <span class="omnivita-combat-cap top"></span>
              <span class="omnivita-combat-cap bottom"></span>
              <span class="omnivita-combat-core"></span>
            </span>
          </button>

          <div class="omnivita-combat-vortex">
            <span class="omnivita-combat-layer layer-a"></span>
            <span class="omnivita-combat-layer layer-b"></span>
            <span class="omnivita-combat-layer layer-c"></span>
            <span class="omnivita-combat-hole"></span>
            <div class="omnivita-combat-forms">
              ${ownership.forms.map((entry, index) => buildOmnivitaFormToken(entry, index, selectedIndex, activeFormId, {
                total: ownership.forms.length,
                selectedFormId: selectedForm?.id || '',
                disabled: !canBrowseForms
              })).join('')}
            </div>
          </div>
        </div>

        <div class="omnivita-combat-controls">
          <button type="button" class="secondary-button small-button" data-action="omnivita-step" data-direction="-1" ${canBrowseForms ? '' : 'disabled'}>Subir</button>
          <button type="button" class="primary-button small-button" data-action="omnivita-main" ${canSwapForms && !isDischarging ? '' : 'disabled'}>
            ${escapeHtml(mainActionLabel)}
          </button>
          <button type="button" class="secondary-button small-button" data-action="omnivita-step" data-direction="1" ${canBrowseForms ? '' : 'disabled'}>Descer</button>
        </div>

        <div class="omnivita-combat-footer">
          <span class="stat-tag ${activeFormId ? 'combat-transformed-chip' : 'combat-standby-chip'}">${escapeHtml(isCooldown ? 'Sem carga' : (activeFormId ? 'Transformado' : 'Em espera'))}</span>
          <span class="stat-tag">PV ${activeFormId && selectedIsActive ? `${activePvCurrent}/${activePvMax}` : `${selectedPvCurrent}/${selectedPvMax}`}</span>
        </div>
        ${canSwapForms ? '' : `<p class="subtle">Nao da para transformar enquanto estiver ${escapeHtml(sharedStatus)}.</p>`}
      </article>
    `;
  }

  function buildCombatFormsSection(ownership, uiState = {}) {
    if (!ownership.forms.length) return '';
    if (usesOmnivitaCombatUi()) return buildOmnivitaCombatFormsSection(ownership, uiState);

    const selectedForm = ownership.selectedForm;
    const activeEntry = ownership.selectedFormActiveEntry;
    const activeFormEntry = ownership.activeFormEntry;
    const activeForm = activeFormEntry
      ? ownership.forms.find((entry) => String(entry.id || '') === String(activeFormEntry.sourceCompanionId || '')) || selectedForm
      : null;
    const sharedStatus = getSharedActorStatus(ownership);
    const canSwapForms = sharedStatus === 'Vivo';
    const attributeTags = selectedForm ? getCombatAttributeTags(selectedForm.attributes, 4) : [];
    const activeAttributeTags = activeForm ? getCombatAttributeTags(activeForm.attributes, 4) : [];
    const selectedIsActive = Boolean(
      selectedForm
      && activeForm
      && String(selectedForm.id || '') === String(activeForm.id || '')
    );
    const previewForm = activeForm && !selectedIsActive ? selectedForm : null;
    const formChoices = ownership.forms.filter((entry) => {
      return !activeForm || String(entry.id || '') !== String(activeForm.id || '') || !selectedIsActive;
    });
    const previewAttributeTags = previewForm ? getCombatAttributeTags(previewForm.attributes, 4) : [];
    const activeFormPvCurrent = Number(activeFormEntry?.pvCurrent ?? activeForm?.pvCurrent ?? 0);
    const activeFormPvMax = Number(activeFormEntry?.pvMax ?? activeForm?.pvMax ?? 0);

    if (activeForm && activeFormEntry) {
      return `
        <article class="info-card combat-form-card player-transform-control-card is-active" data-combat-form-card data-active="true" data-companion-id="${escapeHtml(activeForm.id)}">
          <div class="combat-form-card-top">
            <div>
              <span class="master-overview-label">Controle da transformacao</span>
              <strong>${escapeHtml(activeForm.name || 'Forma ativa')}</strong>
              <p class="subtle">${previewForm ? `${previewForm.name || 'Outra forma'} selecionada para troca.` : 'A ficha principal da esquerda ja representa esta forma no combate.'}</p>
            </div>
            <div class="card-actions-row compact-actions">
              <button type="button" class="secondary-button small-button" data-action="open-combat-form-sheet" data-companion-id="${escapeHtml(activeForm.id)}">Abrir ficha</button>
              <button
                type="button"
                class="secondary-button small-button"
                data-action="toggle-selected-form"
                data-next-active="false"
                ${canSwapForms ? '' : 'disabled'}
                title="${canSwapForms ? '' : 'Nao e possivel trocar de forma enquanto estiver Morrendo ou Morto.'}"
              >
                Voltar ao personagem
              </button>
            </div>
          </div>

          <div class="player-transform-note">
            <span class="stat-tag combat-transformed-chip">Transformado</span>
            <span class="stat-tag">PV ${activeFormPvCurrent}/${activeFormPvMax}</span>
            ${activeAttributeTags.map((attribute) => `<span class="stat-tag">${escapeHtml(attribute.label)} ${attribute.value}</span>`).join('')}
          </div>

          ${previewForm ? `
            <div class="player-form-preview-panel">
              <div class="combat-form-identity">
                ${companionUi.avatarMarkup(previewForm.image, previewForm.name, { wrapperClass: 'avatar-shell small-avatar avatar-square combat-form-avatar' })}
                <div class="combat-form-copy">
                  <span class="master-overview-label">Selecionada</span>
                  <strong>${escapeHtml(previewForm.name || 'Forma')}</strong>
                  <p class="subtle">Voce ainda esta em ${escapeHtml(activeForm.name || 'forma ativa')}.</p>
                </div>
              </div>
              <div class="card-stat-row wrap-row compact-tags-row">
                <span class="stat-tag">PV ${Number(previewForm.pvCurrent || 0)}/${Number(previewForm.pvMax || 0)}</span>
                ${previewAttributeTags.map((attribute) => `<span class="stat-tag">${escapeHtml(attribute.label)} ${attribute.value}</span>`).join('')}
              </div>
              <div class="card-actions-row compact-actions">
                <button
                  type="button"
                  class="primary-button small-button"
                  data-action="toggle-selected-form"
                  data-next-active="true"
                  ${canSwapForms ? '' : 'disabled'}
                  title="${canSwapForms ? '' : 'Nao e possivel trocar de forma enquanto estiver Morrendo ou Morto.'}"
                >
                  Transformar em ${escapeHtml(previewForm.name || 'forma')}
                </button>
                <button type="button" class="secondary-button small-button" data-action="open-combat-form-sheet" data-companion-id="${escapeHtml(previewForm.id)}">Abrir ficha</button>
              </div>
            </div>
          ` : ''}

          <div class="player-form-switcher">
            <div>
              <strong>Outras formas</strong>
              <p class="subtle">${canSwapForms ? 'Selecione outra forma sem perder o controle para voltar ao personagem.' : `Troca bloqueada enquanto estiver ${escapeHtml(sharedStatus)}.`}</p>
            </div>
            ${formChoices.length ? `
              <div class="player-form-choice-grid">
                ${formChoices.map((entry) => buildFormChoiceButton(entry, {
                  disabled: !canSwapForms,
                  isActive: activeForm && String(entry.id || '') === String(activeForm.id || ''),
                  isSelected: selectedForm && String(entry.id || '') === String(selectedForm.id || '')
                })).join('')}
              </div>
            ` : '<p class="subtle">Nenhuma outra forma cadastrada para troca rapida.</p>'}
          </div>
        </article>
      `;
    }

    return `
      ${selectedForm ? `
        <article class="info-card combat-form-card player-selected-form-card${activeEntry ? ' is-active is-representing-actor' : ''}${uiState.representedActorFlash && activeEntry ? ' is-swap-highlight' : ''}" data-combat-form-card data-active="${activeEntry ? 'true' : 'false'}" data-companion-id="${escapeHtml(selectedForm.id)}">
          <div class="combat-form-card-top">
            <div class="combat-form-identity">
              ${companionUi.avatarMarkup(selectedForm.image, selectedForm.name, { wrapperClass: 'avatar-shell small-avatar avatar-square combat-form-avatar' })}
              <div class="combat-form-copy">
                <strong>${escapeHtml(selectedForm.name || 'Forma')}</strong>
                <p class="subtle">${escapeHtml(selectedForm.type || 'Forma')}</p>
                <span class="subtle">${activeEntry ? 'Ativa no seu lugar na ordem.' : 'Disponivel para transformar.'}</span>
              </div>
            </div>
            <div class="card-actions-row compact-actions">
              <button
                type="button"
                class="secondary-button small-button"
                data-action="open-combat-form-sheet"
                data-companion-id="${escapeHtml(selectedForm.id)}"
              >
                Abrir ficha
              </button>
              <button
                type="button"
                class="${activeEntry ? 'secondary-button' : 'primary-button'} small-button"
                data-action="toggle-selected-form"
                data-next-active="${activeEntry ? 'false' : 'true'}"
                ${canSwapForms ? '' : 'disabled'}
                title="${canSwapForms ? '' : 'Nao e possivel trocar de forma enquanto estiver Morrendo ou Morto.'}"
              >
                ${activeEntry ? 'Voltar ao personagem' : 'Usar esta forma'}
              </button>
            </div>
          </div>
          <div class="player-selected-form-body">
            ${buildCombatResourceBar(Number(selectedForm.pvCurrent || 0), Number(selectedForm.pvMax || 0), 'pv', 'PV da forma')}
          </div>
          <div class="card-stat-row wrap-row compact-tags-row">
            ${activeEntry ? '<span class="stat-tag combat-transformed-chip">Transformado</span>' : '<span class="stat-tag combat-standby-chip">Disponivel</span>'}
            ${attributeTags.map((attribute) => `<span class="stat-tag">${escapeHtml(attribute.label)} ${attribute.value}</span>`).join('')}
          </div>
          ${canSwapForms ? '' : `<p class="subtle top-gap-small">Troca bloqueada enquanto estiver ${escapeHtml(sharedStatus)}.</p>`}
        </article>
      ` : ''}
    `;
  }

  function buildCombatSupportSection(ownership) {
    if (!ownership.supportRows.length) return '';

    return `
      <article class="info-card combat-support-section">
        <div class="combat-form-selector-head">
          <div>
            <strong>Outras mini-fichas</strong>
            <p class="subtle">Ajudantes e entidades que nao substituem voce no combate.</p>
          </div>
        </div>
        <div class="stack-list top-gap-small">
          ${ownership.supportRows.map(({ companion, activeEntry }) => `
            <article class="combat-control-card" data-combat-support-card data-companion-id="${escapeHtml(companion.id)}">
              <div class="combat-control-head">
                <div>
                  <strong>${escapeHtml(companion.name || 'Mini-ficha')}</strong>
                  <p class="subtle">${escapeHtml(companion.type || 'Mini-ficha')}</p>
                </div>
                <label class="combat-toggle-row">
                  <input type="checkbox" data-field="supportInEncounter" ${activeEntry ? 'checked' : ''} />
                  <span>Em cena</span>
                </label>
              </div>
              <div class="combat-control-grid">
                <label>
                  Iniciativa
                  <input type="number" min="-99" max="999" data-field="supportInitiativeTotal" value="${Number(activeEntry?.initiativeTotal || 0)}" />
                </label>
                <div class="combat-inline-note">
                  <strong>Status</strong>
                  <span class="subtle">${escapeHtml(normalizeCombatStatus(activeEntry ? activeEntry.status : companion.status, 'Vivo'))}</span>
                </div>
              </div>
            </article>
          `).join('')}
        </div>
      </article>
    `;
  }

  async function submitCombatControlPayload(payload, successMessage = 'Controle de combate sincronizado.') {
    pendingCombatControl = payload;
    localCombatControlSentAt = Date.now();
    renderCombatView();

    try {
      const response = await window.AppApi.sendCombatControl(payload);
      const nextState = window.AppSystem.hydrateCombatSharedState(response?.state || null);

      if (getCombatStateTimestamp(nextState) >= getCombatStateTimestamp(liveCombatSharedState)) {
        liveCombatSharedState = nextState;
        trackCombatVisualState(nextState);
      }

      clearPendingCombatControl();
      character.masterSession = window.AppSystem.hydrateMasterSession({
        ...(character.masterSession || {}),
        combatShared: nextState,
        combatControl: null
      });
      playerCombatLiveSignature = JSON.stringify(getCombatSharedState());
      window.AppCombatState?.seedState?.(nextState, { source: 'player-control' });
      renderCombatView();
      setSaveStatus(successMessage, 'neutral', { holdMs: 1000 });
      return response;
    } catch (error) {
      console.error(error);
      clearPendingCombatControl();
      renderCombatView();
      markSaveError(getSaveErrorMessage(error));
      throw error;
    }
  }

  async function syncCombatControlFromPanel() {
    if (!refs.combatControlList) return;

    const sharedState = getCombatSharedState();
    const ownEntries = getOwnCombatEntries(sharedState);
    if (!sharedState.active || !sharedState.combatants.length || !ownEntries.length) return;
    const ownership = getCombatOwnership(sharedState);
    const sharedStatus = getSharedActorStatus(ownership);
    const selfCard = refs.combatControlList.querySelector('[data-combat-self-card]');
    if (!selfCard) return;

    if (sharedStatus !== 'Vivo') {
      setSaveStatus(`Nao e possivel trocar de forma enquanto estiver ${sharedStatus}.`, 'warning', { holdMs: 1800 });
      return;
    }

    const payload = {
      requestId: `ctrl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      updatedAt: new Date().toISOString(),
      self: null,
      companions: []
    };

    const selfInitiativeInput = selfCard.querySelector('[data-field="selfInitiativeTotal"]');
    payload.self = {
      initiativeTotal: selfInitiativeInput && selfInitiativeInput.value !== ''
        ? Number(selfInitiativeInput.value || 0)
        : null,
      pvCurrent: Number(character.resources?.pvCurrent || 0),
      inEncounter: null
    };

    Array.from(refs.combatControlList.querySelectorAll('[data-combat-support-card]')).forEach((card) => {
      const companionId = card.getAttribute('data-companion-id') || '';
      payload.companions.push({
        companionId,
        inEncounter: Boolean(card.querySelector('[data-field="supportInEncounter"]')?.checked),
        pvCurrent: Number((character.companions || []).find((entry) => entry.id === companionId)?.pvCurrent || 0),
        initiativeTotal: card.querySelector('[data-field="supportInitiativeTotal"]')?.value !== ''
          ? Number(card.querySelector('[data-field="supportInitiativeTotal"]').value || 0)
          : null
      });
    });

    await submitCombatControlPayload(payload, 'Controle de combate enviado.');
  }

  async function toggleSelectedCombatForm(nextActive) {
    if (!refs.combatControlList || !selectedCombatFormId) return;

    const sharedState = getCombatSharedState();
    const ownEntries = getOwnCombatEntries(sharedState);
    if (!sharedState.active || !sharedState.combatants.length || !ownEntries.length) return;

    const ownership = getCombatOwnership(sharedState);
    const selfCard = refs.combatControlList.querySelector('[data-combat-self-card]');
    if (!selfCard) return;

    const payload = {
      requestId: `ctrl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      updatedAt: new Date().toISOString(),
      self: {
        initiativeTotal: selfCard.querySelector('[data-field="selfInitiativeTotal"]')?.value !== ''
          ? Number(selfCard.querySelector('[data-field="selfInitiativeTotal"]').value || 0)
          : null,
        pvCurrent: Number(character.resources?.pvCurrent || 0),
        inEncounter: null
      },
      companions: ownership.forms.map((entry) => {
        const isSelected = entry.id === selectedCombatFormId;

        return {
          companionId: entry.id,
          inEncounter: isSelected ? Boolean(nextActive) : false,
          pvCurrent: Number(entry.pvCurrent || 0),
          initiativeTotal: null
        };
      })
    };

    Array.from(refs.combatControlList.querySelectorAll('[data-combat-support-card]')).forEach((card) => {
      const companionId = card.getAttribute('data-companion-id') || '';
      payload.companions.push({
        companionId,
        inEncounter: Boolean(card.querySelector('[data-field="supportInEncounter"]')?.checked),
        pvCurrent: Number((character.companions || []).find((entry) => entry.id === companionId)?.pvCurrent || 0),
        initiativeTotal: card.querySelector('[data-field="supportInitiativeTotal"]')?.value !== ''
          ? Number(card.querySelector('[data-field="supportInitiativeTotal"]').value || 0)
          : null
      });
    });

    await submitCombatControlPayload(
      payload,
      nextActive ? 'Forma preparada para assumir a cena.' : 'Retorno ao personagem enviado.'
    );
  }

  function stepSelectedCombatForm(direction) {
    if (omnivitaVisualState !== 'ready') return;
    const ownership = getCombatOwnership(getCombatSharedState());
    if (ownership.activeFormEntry) return;
    const forms = (Array.isArray(character.companions) ? character.companions : []).filter(isFormCompanion);
    if (!forms.length) return;
    const currentIndex = Math.max(0, forms.findIndex((entry) => String(entry.id || '') === String(selectedCombatFormId || '')));
    const nextIndex = (currentIndex + Number(direction || 0) + forms.length) % forms.length;
    selectedCombatFormId = forms[nextIndex].id;
    renderCombatView();
  }

  function rechargeOmnivita() {
    if (omnivitaVisualState !== 'cooldown') return;
    omnivitaVisualState = 'ready';
    renderCombatView();
    setSaveStatus('OmniVita recarregado.', 'success', { holdMs: 1200 });
  }

  function beginOmnivitaDischarge() {
    if (omnivitaVisualState !== 'ready' || omnivitaDischargeTimer) return;
    omnivitaVisualState = 'discharging';
    renderCombatView();
    setSaveStatus('OmniVita descarregando...', 'warning', { holdMs: 2600 });

    omnivitaDischargeTimer = window.setTimeout(async () => {
      omnivitaDischargeTimer = null;
      try {
        await toggleSelectedCombatForm(false);
      } catch (error) {
        console.error(error);
      } finally {
        omnivitaVisualState = 'cooldown';
        renderCombatView();
        setSaveStatus('OmniVita descarregado.', 'warning', { holdMs: 1800 });
      }
    }, 2400);
  }

  async function handleOmnivitaMainAction() {
    if (!selectedCombatFormId) return;
    if (omnivitaVisualState === 'discharging') return;
    if (omnivitaVisualState === 'cooldown') {
      rechargeOmnivita();
      return;
    }

    const sharedState = getCombatSharedState();
    const ownership = getCombatOwnership(sharedState);
    const sharedStatus = getSharedActorStatus(ownership);
    if (sharedStatus !== 'Vivo') {
      setSaveStatus(`Nao da para transformar enquanto estiver ${sharedStatus}.`, 'warning', { holdMs: 1800 });
      return;
    }

    const activeFormId = String(ownership.activeFormEntry?.sourceCompanionId || '');
    if (activeFormId && activeFormId === selectedCombatFormId) {
      beginOmnivitaDischarge();
      return;
    }

    await toggleSelectedCombatForm(true);
  }

  async function handleOmnivitaTokenClick(companionId) {
    if (omnivitaVisualState !== 'ready') return;
    if (!companionId) return;
    const ownership = getCombatOwnership(getCombatSharedState());
    if (ownership.activeFormEntry) {
      await handleOmnivitaMainAction();
      return;
    }
    const wasSelected = String(selectedCombatFormId || '') === String(companionId || '');
    selectedCombatFormId = companionId;

    if (wasSelected) {
      await handleOmnivitaMainAction();
      return;
    }

    renderCombatView();
  }

  async function syncOwnSheetResourcesToCombat() {
    const sharedState = getCombatSharedState();
    if (!sharedState.active || !sharedState.combatants.length) return;

    const ownership = getCombatOwnership(sharedState);
    if (!ownership.ownEntries.length) return;

    const sharedInitiative = ownership.selfEntry
      ? Number(ownership.selfEntry.initiativeTotal || 0)
      : (ownership.activeFormEntry ? Number(ownership.activeFormEntry.initiativeTotal || 0) : null);

    const payload = {
      requestId: `ctrl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      updatedAt: new Date().toISOString(),
      self: {
        inEncounter: null,
        initiativeTotal: sharedInitiative,
        pvCurrent: Number(character.resources?.pvCurrent || 0)
      },
      companions: []
    };

    ownership.forms.forEach((entry) => {
      const active = ownership.activeFormEntry
        && String(ownership.activeFormEntry.sourceCompanionId || '') === String(entry.id || '');
      if (!active) return;
      payload.companions.push({
        companionId: entry.id,
        inEncounter: true,
        pvCurrent: Number(entry.pvCurrent || 0),
        initiativeTotal: null
      });
    });

    ownership.supportRows.forEach(({ companion, activeEntry }) => {
      if (!activeEntry) return;
      payload.companions.push({
        companionId: companion.id,
        inEncounter: true,
        pvCurrent: Number(companion.pvCurrent || 0),
        initiativeTotal: Number(activeEntry.initiativeTotal || 0)
      });
    });

    await submitCombatControlPayload(payload, 'Recursos sincronizados no combate.');
  }

  function openCombatFormSheetById(companionId) {
    const targetId = companionId || selectedCombatFormId;
    if (!targetId) return;
    const index = (Array.isArray(character.companions) ? character.companions : [])
      .findIndex((entry) => entry.id === targetId);
    if (index < 0) return;
    openCompanionDialog(index);
  }

  function openSelectedCombatFormSheet() {
    openCombatFormSheetById(selectedCombatFormId);
  }

  async function requestCombatExit() {
    const sharedState = getCombatSharedState();
    const ownership = getCombatOwnership(sharedState);
    if (!ownership.ownEntries.length) return;

    const payload = {
      requestId: `ctrl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      updatedAt: new Date().toISOString(),
      self: {
        inEncounter: false,
        initiativeTotal: ownership.selfEntry
          ? Number(ownership.selfEntry.initiativeTotal || 0)
          : (ownership.activeFormEntry ? Number(ownership.activeFormEntry.initiativeTotal || 0) : null)
      },
      companions: ownership.forms.map((entry) => ({
        companionId: entry.id,
        inEncounter: false,
        initiativeTotal: null
      }))
    };

    await submitCombatControlPayload(payload, 'Saida da cena enviada.');
  }

  function renderCombatView() {
    if (!refs.combatOverviewCards || !refs.combatRosterList || !refs.combatRoundBadge) return;

    const sharedState = getCombatSharedState();
    const combatants = Array.isArray(sharedState.combatants) ? sharedState.combatants : [];
    const currentEntry = combatants.find((entry) => entry.isCurrentTurn) || null;
    const nextEntry = getNextCombatant(combatants, currentEntry);
    const ownership = getCombatOwnership(sharedState);
    const ownEntries = ownership.ownEntries;
    const ownForms = ownEntries.filter((entry) => entry.combatantType === 'companion').length;
    const representedEntry = getRepresentedCombatEntry(ownership);
    const isSyncFresh = Date.now() < combatSyncPulseUntil;
    const isRepresentedActorHighlighted = Date.now() < representedActorFlashUntil;
    const isTurnHighlighted = Date.now() < currentTurnFlashUntil;
    const syncLabel = pendingCombatControl ? 'Sincronizando acao...' : getCombatSyncLabel();
    const sharedStatus = getSharedActorStatus(ownership);
    const isOwnTurn = ownEntries.some((entry) => Boolean(entry.isCurrentTurn));

    refs.combatRoundBadge.textContent = sharedState.active
      ? `Rodada ${Math.max(1, Number(sharedState.round || 1))}`
      : 'Sem combate';

    if (refs.combatControlList) {
      refs.combatControlList.innerHTML = '';
    }

    if (!sharedState.active || !combatants.length) {
      refs.combatOverviewCards.innerHTML = `
        <article class="info-card combat-overview-card">
          <span class="master-overview-label">Combate</span>
          <strong class="master-overview-value">Inativo</strong>
          <p class="subtle">Nenhum encontro ativo no momento.</p>
        </article>
      `;
      refs.combatRosterList.innerHTML = '<div class="empty-state">Nenhum combate ativo no momento.</div>';
      return;
    }

    if (!ownEntries.length) {
      refs.combatRoundBadge.textContent = 'Combate oculto';
      refs.combatOverviewCards.innerHTML = `
        <article class="info-card combat-overview-card">
          <span class="master-overview-label">Combate</span>
          <strong class="master-overview-value">Fora da cena</strong>
          <p class="subtle">Voce nao participa deste combate no momento.</p>
        </article>
        <article class="info-card combat-overview-card ${isSyncFresh ? 'is-sync-fresh' : ''}">
          <span class="master-overview-label">Sincronizacao</span>
          <strong class="master-overview-value">${escapeHtml(syncLabel)}</strong>
          <p class="subtle">A cena existe, mas voce nao esta representado nela agora.</p>
        </article>
      `;
      refs.combatRosterList.innerHTML = '<div class="empty-state">Voce nao participa deste combate no momento.</div>';
      return;
    }

    refs.combatRoundBadge.textContent = isOwnTurn
      ? 'Sua vez'
      : `Rodada ${Math.max(1, Number(sharedState.round || 1))}`;

    refs.combatOverviewCards.innerHTML = buildPlayerCombatHero(
      sharedState,
      ownership,
      currentEntry,
      nextEntry,
      {
        turnFlash: isTurnHighlighted,
        representedActorFlash: isRepresentedActorHighlighted,
        syncFresh: isSyncFresh,
        syncLabel,
        sharedStatus,
        ownForms
      }
    );

    if (refs.combatControlList) {
      const useOmnivitaUi = ownership.forms.length && usesOmnivitaCombatUi();
      refs.combatControlList.innerHTML = ownership.forms.length
        ? `
          ${useOmnivitaUi ? '' : `
          <article class="info-card combat-form-selector-card">
            <div class="combat-form-selector-head">
              <div>
                <strong>Formas</strong>
                <p class="subtle">Escolha uma forma para controlar sem sair da aba de combate.</p>
              </div>
              <label class="combat-form-select-label">
                <span>Forma selecionada</span>
                <select data-field="selectedCombatForm">
                  ${ownership.forms.map((entry) => `
                    <option value="${escapeHtml(entry.id)}" ${entry.id === selectedCombatFormId ? 'selected' : ''}>${escapeHtml(entry.name || 'Forma')}</option>
                  `).join('')}
                </select>
              </label>
            </div>
          </article>
          `}
          <div class="combat-dual-grid">
            ${buildCombatCharacterSummaryCard(sharedState, ownership, { representedActorFlash: isRepresentedActorHighlighted })}
            ${buildCombatFormsSection(ownership, { representedActorFlash: isRepresentedActorHighlighted })}
          </div>
          ${buildCombatSupportSection(ownership)}
        `
        : `
          ${buildCombatCharacterSummaryCard(sharedState, ownership, { representedActorFlash: isRepresentedActorHighlighted })}
          ${buildCombatSupportSection(ownership)}
        `;
    }

    refs.combatRosterList.innerHTML = combatants.map((entry) => {
      const normalizedStatus = normalizeCombatStatus(entry.status, 'Vivo');
      const isOwnCharacter = entry.combatantType === 'character' && entry.sourceCharacterId === character.id;
      const isOwnCompanion = entry.combatantType === 'companion' && entry.sourceCharacterId === character.id;
      const isOwnForm = isOwnedFormCombatEntry(entry);
      const ownershipChip = isOwnCharacter
        ? '<span class="stat-tag combat-self-chip">Voce</span>'
        : (isOwnCompanion && !isOwnForm
          ? '<span class="stat-tag combat-self-chip">Sua mini-ficha</span>'
          : '');
      const representsYou = representedEntry && String(representedEntry.instanceId || '') === String(entry.instanceId || '');
      const actorChip = representsYou && isOwnForm
        ? '<span class="stat-tag combat-transformed-chip">Transformado</span>'
        : '';

      return `
        <article class="info-card combat-roster-card ${getCombatStatusVisualClass(normalizedStatus)}${entry.isCurrentTurn ? ' is-current-turn' : ''}${representsYou ? ' is-representing-actor' : ''}${isTurnHighlighted && entry.isCurrentTurn ? ' is-turn-spotlight' : ''}${isRepresentedActorHighlighted && representsYou ? ' is-sync-fresh' : ''}">
          <div class="combat-roster-head">
            <div class="combat-roster-identity">
              ${companionUi.avatarMarkup(resolveCombatEntryImage(entry), entry.name, { wrapperClass: 'avatar-shell small-avatar avatar-square combat-roster-avatar' })}
              <div>
                <strong>#${Number(entry.order || 0)} ${escapeHtml(entry.name || 'Combatente')}</strong>
                <p class="subtle">${escapeHtml(entry.subtitle || entry.typeLabel || 'Sem detalhe')}</p>
              </div>
            </div>
            <div class="card-stat-row wrap-row compact-tags-row">
              <span class="stat-tag combat-status-chip ${getCombatStatusVisualClass(normalizedStatus)}">${escapeHtml(normalizedStatus)}</span>
              ${ownershipChip}
              ${actorChip}
              ${entry.isCurrentTurn ? '<span class="stat-tag combat-turn-chip">Vez atual</span>' : ''}
              ${nextEntry && String(nextEntry.instanceId || '') === String(entry.instanceId || '') && !entry.isCurrentTurn ? '<span class="stat-tag combat-next-turn-chip">Proximo</span>' : ''}
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  function renderProfileImages() {
    setAvatar(refs.profileImagePreview, character.identity.image, character.identity.name);
    setAvatar(refs.sidebarAvatar, character.identity.image, character.identity.name);
  }

  function renderFixedFields() {
    refs.identityName.value = character.identity.name || '';
    refs.identityAge.value = character.identity.age || '';
    refs.identityLevel.value = character.identity.level || 1;
    refs.identityClass.value = character.identity.className || 'Especialista';
    refs.identityManifestationOrigin.value = character.identity.manifestationOrigin || '';
    refs.identityLinks.value = character.identity.links || '';
    refs.identityConcept.value = character.identity.concept || '';
    refs.identitySummary.value = character.identity.summary || '';

    refs.pvCurrentInput.value = character.resources.pvCurrent;
    refs.peCurrentInput.value = character.resources.peCurrent;
    refs.pdCurrentInput.value = character.resources.pdCurrent;
    refs.instabilityInput.value = character.resources.instability;
      refs.resourceStatus.value = normalizeCombatStatus(character.resources.status, 'Vivo');
    refs.armorBonusInput.value = character.resources.armorBonus || 0;
    refs.blockModeSelect.value = character.resources.blockMode || 'vigor';
    refs.armorEquipmentInput.value = character.resources.armorEquipment || '';

    refs.extraPeVInput.value = character.progression.extraPeV || 0;
    refs.manualPeVSpentInput.value = character.progression.manualPeVSpent || 0;
    refs.facetaUnlocksInput.value = character.progression.facetaUnlocks || 0;
    refs.facetaStabilizationsInput.value = character.progression.facetaStabilizations || 0;
    refs.progressionNotesInput.value = character.progression.notes || '';

    refs.manifestationNameInput.value = character.manifestation.name || '';
    refs.manifestationOriginInput.value = character.manifestation.origin || '';
    refs.manifestationStateInput.value = character.manifestation.state || 'Parcial';
    refs.manifestationGlitchesInput.value = character.manifestation.glitches || '';
    refs.manifestationEffectsInput.value = character.manifestation.activeEffects || '';

    refs.primaryWeaponInput.value = character.equipment.primaryWeapon || '';
    refs.secondaryWeaponInput.value = character.equipment.secondaryWeapon || '';
    refs.itemsInput.value = character.equipment.items || '';
    refs.appearanceInput.value = character.identity.appearance || '';
    refs.characterNotesInput.value = character.notes || '';

    renderProfileImages();
  }

  function renderComputed() {
    const derived = window.AppSystem.calculateDerived(character);

    character.resources.pvCurrent = Math.min(Number(character.resources.pvCurrent || 0), derived.maxPv);
    character.resources.peCurrent = Math.min(Number(character.resources.peCurrent || 0), derived.maxPe);
    character.resources.pdCurrent = Math.min(Number(character.resources.pdCurrent || 0), derived.maxPd);

    refs.sidebarCharacterName.textContent = character.identity.name || 'Sem nome';
    refs.sidebarCharacterSubtitle.textContent = `${character.identity.className} • Nível ${character.identity.level}`;
    refs.pageCharacterSummary.textContent = character.identity.summary || 'Sem resumo.';
    refs.sidebarPeVAvailable.textContent = derived.peVAvailable;
    refs.sidebarInstability.textContent = character.resources.instability;

    refs.classNoteBadge.textContent = derived.classConfig.notes;
    refs.attributeLimitBadge.textContent = `Limite de atributo: ${derived.attributeLimit}`;
    refs.skillLimitBadge.textContent = `Limite de perícia: ${derived.skillLimit}`;
    refs.attributePointsSpentBadge.textContent = `Gastos: ${derived.attributePointsSpent}`;
    refs.attributePointsAvailableBadge.textContent = `Disponíveis: ${derived.attributePointsAvailable}`;
    refs.peVGrantedBadge.textContent = `PeV totais: ${derived.peVGranted}`;
    refs.peVSpentBadge.textContent = `PeV gastos: ${derived.peVSpent.total}`;
    refs.peVAvailableBadge.textContent = `PeV livres: ${derived.peVAvailable}`;
    refs.skillsSpentBadge.textContent = `PeV em perícias: ${derived.peVSpent.skillsSpent}`;

    refs.pvMaxLabel.textContent = String(derived.maxPv);
    refs.peMaxLabel.textContent = String(derived.maxPe);
    refs.pdMaxLabel.textContent = String(derived.maxPd);
    if (derived.breakdown) {
      const pv = derived.breakdown.pv;
      const pe = derived.breakdown.pe;
      const pd = derived.breakdown.pd;
      refs.pvFormulaLabel.textContent = `Base ${pv.base} + nível ${pv.level} + ${pv.attributeName} ${pv.attribute} + aptidões ${pv.aptitudes}`;
      refs.peFormulaLabel.textContent = `Base ${pe.base} + nível ${pe.level} + ${pe.attributeName} ${pe.attribute} + aptidões ${pe.aptitudes}`;
      refs.pdFormulaLabel.textContent = `Base ${pd.base} + nível ${pd.level} + ${pd.attributeName} ${pd.attribute} + aptidões ${pd.aptitudes}`;
    }
    refs.esquivaLabel.textContent = derived.esquivaMod >= 0 ? `+${derived.esquivaMod}` : String(derived.esquivaMod);
    refs.blockLabel.textContent = String(derived.selectedBlock);
    refs.blockHelper.textContent = `Força ${derived.blockForce} • Vigor ${derived.blockVigor}`;
    refs.initiativeLabel.textContent = derived.initiativeMod >= 0 ? `+${derived.initiativeMod}` : String(derived.initiativeMod);
    refs.manifestationModLabel.textContent = derived.manifestationMod >= 0 ? `+${derived.manifestationMod}` : String(derived.manifestationMod);
    refs.armorLabel.textContent = String(derived.armor);
    refs.defenseSummaryLabel.textContent = 'Escolha Esquiva ou Bloqueio';

    refs.pvCurrentInput.max = String(derived.maxPv);
    refs.peCurrentInput.max = String(derived.maxPe);
    refs.pdCurrentInput.max = String(derived.maxPd);
    refs.pvCurrentInput.value = String(character.resources.pvCurrent);
    refs.peCurrentInput.value = String(character.resources.peCurrent);
    refs.pdCurrentInput.value = String(character.resources.pdCurrent);
  }

  function renderAll() {
    ensureHydrated();
    renderFixedFields();
    renderAttributeValues();
    renderSkillValues();
    renderAptitudes();
    renderFacets();
    renderCompanions();
    renderCombatView();
    renderComputed();
    if (activeCompanionIndex !== null) renderCompanionDialog();
  }

  function bindSimpleInputs() {
    const simpleBindings = [
      [refs.identityName, (value) => { character.identity.name = value; }],
      [refs.identityAge, (value) => { character.identity.age = Number(value || 0); }],
      [refs.identityLevel, (value) => { character.identity.level = Math.max(1, Number(value || 1)); }],
      [refs.identityClass, (value) => { character.identity.className = value; }],
      [refs.identityManifestationOrigin, (value) => { character.identity.manifestationOrigin = value; }],
      [refs.identityLinks, (value) => { character.identity.links = value; }],
      [refs.identityConcept, (value) => { character.identity.concept = value; }],
      [refs.identitySummary, (value) => { character.identity.summary = value; }],
      [refs.pvCurrentInput, (value) => { character.resources.pvCurrent = Number(value || 0); }],
      [refs.peCurrentInput, (value) => { character.resources.peCurrent = Number(value || 0); }],
      [refs.pdCurrentInput, (value) => { character.resources.pdCurrent = Number(value || 0); }],
      [refs.instabilityInput, (value) => { character.resources.instability = Math.min(6, Math.max(0, Number(value || 0))); }],
        [refs.resourceStatus, (value) => { character.resources.status = normalizeCombatStatus(value, 'Vivo'); }],
      [refs.armorBonusInput, (value) => { character.resources.armorBonus = Math.max(0, Number(value || 0)); }],
      [refs.blockModeSelect, (value) => { character.resources.blockMode = value; }],
      [refs.armorEquipmentInput, (value) => { character.resources.armorEquipment = value; }],
      [refs.extraPeVInput, (value) => { character.progression.extraPeV = Math.max(0, Number(value || 0)); }],
      [refs.manualPeVSpentInput, (value) => { character.progression.manualPeVSpent = Math.max(0, Number(value || 0)); }],
      [refs.facetaUnlocksInput, (value) => { character.progression.facetaUnlocks = Math.max(0, Number(value || 0)); }],
      [refs.facetaStabilizationsInput, (value) => { character.progression.facetaStabilizations = Math.max(0, Number(value || 0)); }],
      [refs.progressionNotesInput, (value) => { character.progression.notes = value; }],
      [refs.manifestationNameInput, (value) => { character.manifestation.name = value; }],
      [refs.manifestationOriginInput, (value) => { character.manifestation.origin = value; }],
      [refs.manifestationStateInput, (value) => { character.manifestation.state = value; }],
      [refs.manifestationGlitchesInput, (value) => { character.manifestation.glitches = value; }],
      [refs.manifestationEffectsInput, (value) => { character.manifestation.activeEffects = value; }],
      [refs.primaryWeaponInput, (value) => { character.equipment.primaryWeapon = value; }],
      [refs.secondaryWeaponInput, (value) => { character.equipment.secondaryWeapon = value; }],
      [refs.appearanceInput, (value) => { character.identity.appearance = value; }],
      [refs.itemsInput, (value) => { character.equipment.items = value; }],
      [refs.characterNotesInput, (value) => { character.notes = value; }]
    ];

    simpleBindings.forEach(([element, apply]) => {
      element.addEventListener('input', () => {
        apply(element.value);
        if (element === refs.pvCurrentInput) {
          character.resources.status = normalizeStatusForPv(character.resources.status, character.resources.pvCurrent);
        }
        renderAll();
        saveDebounced();
        if (element === refs.pvCurrentInput || element === refs.resourceStatus) {
          syncOwnSheetResourcesToCombatDebounced();
        }
      });
      element.addEventListener('change', () => {
        apply(element.value);
        if (element === refs.pvCurrentInput) {
          character.resources.status = normalizeStatusForPv(character.resources.status, character.resources.pvCurrent);
        }
        renderAll();
        saveDebounced();
        if (element === refs.pvCurrentInput || element === refs.resourceStatus) {
          syncOwnSheetResourcesToCombatDebounced();
        }
      });
    });
  }

  async function handleProfileImage(file) {
    if (!file) return;
    const dataUrl = await readFileAsOptimizedImage(file);
    character.identity.image = dataUrl;
    renderProfileImages();
    saveDebounced();
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function loadImageFromDataUrl(dataUrl) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Nao foi possivel processar a imagem selecionada.'));
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

  async function readFileAsOptimizedImage(file) {
    const dataUrl = await readFileAsDataUrl(file);
    return optimizeImageDataUrl(dataUrl);
  }

  async function optimizeCharacterImages(targetCharacter) {
    if (!targetCharacter || typeof targetCharacter !== 'object') return targetCharacter;

    if (targetCharacter.identity?.image) {
      targetCharacter.identity.image = await optimizeImageDataUrl(targetCharacter.identity.image);
    }

    if (Array.isArray(targetCharacter.companions)) {
      for (const companion of targetCharacter.companions) {
        if (companion?.image) {
          companion.image = await optimizeImageDataUrl(companion.image);
        }
      }
    }

    return targetCharacter;
  }

  async function importCharacterFromFile(file) {
    const rawText = await file.text();
    let parsed = null;

    try {
      parsed = JSON.parse(rawText);
    } catch (error) {
      throw new Error('Arquivo JSON inválido.');
    }

    const importedRaw = window.AppStorage.extractCharacterFromTransferPayload
      ? window.AppStorage.extractCharacterFromTransferPayload(parsed)
      : (parsed && parsed.character ? parsed.character : parsed);

    if (!importedRaw || typeof importedRaw !== 'object') {
      throw new Error('O arquivo não contém uma ficha válida.');
    }

    setSaveStatus('Otimizando imagens do JSON...', 'saving', { sticky: true });
    const optimizedCharacter = await optimizeCharacterImages(importedRaw);
    character = preserveCurrentCharacterIdentity(optimizedCharacter);
    blockExternalSync(2800);
    renderAll();
    await saveCharacter({ successMessage: 'Importado e salvo', savingMessage: 'Importando...' });
  }

  function exportCharacterToJson() {
    try {
      ensureHydrated();
      const envelope = window.AppStorage.createCharacterTransferEnvelope
        ? window.AppStorage.createCharacterTransferEnvelope(character, { source: 'manual-export' })
        : { character };
      downloadTextFile(buildCharacterExportFilename(), `${JSON.stringify(envelope, null, 2)}\n`);
      setSaveStatus('JSON exportado.', 'success', { holdMs: 1600 });
    } catch (error) {
      console.error(error);
      markSaveError(getSaveErrorMessage(error));
    }
  }

  async function handleImportCharacterChange() {
    const file = refs.importCharacterInput.files && refs.importCharacterInput.files[0];
    if (!file) return;
    try {
      await importCharacterFromFile(file);
    } catch (error) {
      console.error(error);
      markSaveError(getSaveErrorMessage(error));
    } finally {
      refs.importCharacterInput.value = '';
    }
  }

  refs.exportCharacterButton.addEventListener('click', exportCharacterToJson);
  refs.importCharacterInput.addEventListener('change', handleImportCharacterChange);

  refs.profileImageInput.addEventListener('change', async () => {
    const file = refs.profileImageInput.files && refs.profileImageInput.files[0];
    if (!file) return;
    await handleProfileImage(file);
    refs.profileImageInput.value = '';
  });

  refs.removeProfileImageButton.addEventListener('click', () => {
    character.identity.image = '';
    renderProfileImages();
    saveDebounced();
  });

  refs.attributeGrid.addEventListener('input', (event) => {
    const input = event.target.closest('input[data-attribute-key]');
    if (!input) return;
    const key = input.dataset.attributeKey;
    const limit = window.AppSystem.getAttributeLimit(character.identity.level);
    character.attributes[key] = Math.min(limit, Math.max(0, Number(input.value || 0)));
    renderAll();
    saveDebounced();
  });

  refs.skillsGrid.addEventListener('input', (event) => {
    const input = event.target.closest('input[data-skill-key]');
    if (!input) return;
    const key = input.dataset.skillKey;
    const limit = window.AppSystem.getSkillLimit(character.identity.level);
    character.skills[key] = Math.min(limit, Math.max(0, Number(input.value || 0)));
    renderAll();
    saveDebounced();
  });

  refs.skillsGrid.addEventListener('change', (event) => {
    const select = event.target.closest('select[data-skill-attr]');
    if (!select) return;
    const key = select.dataset.skillAttr;
    character.skillAttributes[key] = select.value;
    renderAll();
    saveDebounced();
  });

  refs.addAptitudeButton.addEventListener('click', () => {
    character.aptitudes.push(window.AppSystem.hydrateAptitudeEntry({}));
    renderAll();
    saveDebounced();
  });

  refs.aptitudesList.addEventListener('input', handleAptitudeChange);
  refs.aptitudesList.addEventListener('change', handleAptitudeChange);
  refs.aptitudesList.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action="remove-aptitude"]');
    if (!button) return;
    const card = button.closest('[data-aptitude-id]');
    character.aptitudes = character.aptitudes.filter((entry) => entry.id !== card.dataset.aptitudeId);
    renderAll();
    saveDebounced();
  });

  function handleAptitudeChange(event) {
    const card = event.target.closest('[data-aptitude-id]');
    if (!card) return;
    const entry = character.aptitudes.find((item) => item.id === card.dataset.aptitudeId);
    if (!entry) return;
    const field = event.target.dataset.field;
    if (!field) return;
    entry[field] = event.target.value;
    if (field === 'catalogId') {
      const catalog = entry.catalogId ? window.AppSystem.getAptitudeById(entry.catalogId) : null;
      if (catalog) entry.tier = catalog.tier;
      const options = window.AppSystem.getAptitudeEffectOptions(entry.catalogId || '');
      entry.effectChoice = options[0] ? options[0].value : '';
      renderAptitudes();
    }
    renderComputed();
    renderSkillValues();
    saveDebounced();
  }

  refs.addFacetButton.addEventListener('click', () => {
    character.facets.push({ name: '', rank: 1, xp: 0, notes: '', _draft: true });
    renderFacets();
    saveDebounced();
  });

  refs.facetsList.addEventListener('input', (event) => {
    const card = event.target.closest('[data-facet-index]');
    if (!card) return;
    const entry = character.facets[Number(card.dataset.facetIndex)];
    const field = event.target.dataset.field;
    entry[field] = field === 'rank' || field === 'xp' ? Number(event.target.value || 0) : event.target.value;
    if (field === 'rank') entry.rank = Math.min(10, Math.max(1, entry.rank));
    if (field === 'xp') entry.xp = Math.max(0, entry.xp);
    entry._draft = false;
    saveDebounced();
  });

  refs.facetsList.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action="remove-facet"]');
    if (!button) return;
    const card = button.closest('[data-facet-index]');
    blockExternalSync();
    character.facets.splice(Number(card.dataset.facetIndex), 1);
    renderFacets();
    saveDebounced();
  });

  function createCompanion() {
    return window.AppSystem.createCompanion();
  }

  refs.addCompanionButton.addEventListener('click', () => {
    character.companions.push(createCompanion());
    activeCompanionIndex = character.companions.length - 1;
    renderAll();
    openCompanionDialog(activeCompanionIndex);
    saveDebounced();
  });

  refs.companionsList.addEventListener('click', (event) => {
    const openButton = event.target.closest('[data-action="open-companion"]');
    if (openButton) {
      const card = openButton.closest('[data-companion-index]');
      openCompanionDialog(Number(card.dataset.companionIndex));
      return;
    }

    const removeButton = event.target.closest('[data-action="remove-companion"]');
    if (removeButton) {
      const card = removeButton.closest('[data-companion-index]');
      const companionIndex = Number(card.dataset.companionIndex);
      const entry = character.companions[companionIndex];
      if (!confirmCompanionDelete(entry)) return;
      character.companions.splice(companionIndex, 1);
      if (activeCompanionIndex !== null && activeCompanionIndex >= character.companions.length) activeCompanionIndex = null;
      renderAll();
      saveDebounced();
    }
  });

  function getActiveCompanion() {
    if (activeCompanionIndex === null) return null;
    return character.companions[activeCompanionIndex] || null;
  }

  function confirmCompanionDelete(entry) {
    const companionName = String(entry?.name || 'esta mini-ficha').trim() || 'esta mini-ficha';
    return window.confirm(`Excluir ${companionName}? Essa acao nao pode ser desfeita.`);
  }

  function openCompanionDialog(index) {
    activeCompanionIndex = index;
    renderCompanionDialog();
    companionUi.openDialog(refs.companionDialog);
  }

  function closeCompanionDialog() {
    companionUi.closeDialog(refs.companionDialog);
  }

  function renderCompanionSkills() {
    const entry = getActiveCompanion();
    if (!entry) return;
    companionUi.renderCompanionSkills(refs.companionSkillsList, entry, {
      mode: 'editable',
      removeAction: 'remove-companion-skill',
      emptyText: 'Nenhuma pericia cadastrada.'
    });
    return;
    refs.companionSkillsList.innerHTML = '';
    if (!entry.skills.length) {
      refs.companionSkillsList.innerHTML = '<div class="empty-state">Nenhuma pericia cadastrada.</div>';
      return;
    }
    entry.skills.forEach((skill, index) => {
      const row = document.createElement('div');
      row.className = 'info-card skill-inline-card companion-row-grid';
      row.dataset.companionSkillIndex = String(index);
      row.innerHTML = `
        <div class="skill-inline-head">
          <strong>Perícia ${index + 1}</strong>
          <div class="inline-actions">
            <span class="skill-total-badge" data-role="skill-total">${formatSigned(getCompanionSkillTotal(entry, skill))}</span>
            <button type="button" class="danger-button small-button" data-action="remove-companion-skill" aria-label="Remover perícia ${index + 1}">Remover</button>
          </div>
        </div>
        <label>
          Nome
          <input type="text" data-field="name" value="${escapeHtml(skill.name || '')}" />
        </label>
        <label>
          Valor
          <input type="number" min="0" max="99" data-field="value" value="${Number(skill.value || 0)}" />
        </label>
        <label>
          Atributo
          <select data-field="attribute">${getAttributeSelectOptions(skill.attribute || 'destreza')}</select>
        </label>
        <div class="skill-result-card">
          <span>Total</span>
          <strong data-role="skill-total-large">${formatSigned(getCompanionSkillTotal(entry, skill))}</strong>
        </div>
      `;
      refs.companionSkillsList.appendChild(row);
    });
  }

  function renderCompanionFacets() {
    const entry = getActiveCompanion();
    if (!entry) return;
    companionUi.renderCompanionFacets(refs.companionFacetsList, entry, {
      mode: 'editable',
      removeAction: 'remove-companion-facet',
      emptyText: 'Nenhuma faceta cadastrada.'
    });
    return;
    refs.companionFacetsList.innerHTML = '';
    if (!entry.facets.length) {
      refs.companionFacetsList.innerHTML = '<div class="empty-state">Nenhuma faceta cadastrada.</div>';
      return;
    }
    entry.facets.forEach((facet, index) => {
      const row = document.createElement('div');
      row.className = 'list-card-grid companion-facet-grid';
      row.dataset.companionFacetIndex = String(index);
      row.innerHTML = `
        <label>
          Faceta ${index + 1}
          <input type="text" data-field="name" value="${escapeHtml(facet.name || '')}" />
        </label>
        <label>
          Rank
          <input type="number" min="1" max="10" data-field="rank" value="${Number(facet.rank || 1)}" />
        </label>
        <label>
          XP
          <input type="number" min="0" max="999" data-field="xp" value="${Number(facet.xp || 0)}" />
        </label>
        <div class="card-actions-row compact-actions">
          <button type="button" class="danger-button small-button" data-action="remove-companion-facet" aria-label="Remover faceta ${index + 1}">Remover</button>
        </div>
      `;
      refs.companionFacetsList.appendChild(row);
    });
  }

  function renderCompanionDialog() {
    const entry = getActiveCompanion();
    if (!entry) return;
    companionUi.populateCompanionFields(companionDialogFieldRefs, entry);
    companionUi.syncCompanionSticky(companionDialogDisplayRefs, entry, {
      titlePrefix: 'Mini-ficha',
      squareAvatar: true
    });
    renderCompanionSkills();
    renderCompanionFacets();
  }

  refs.addCompanionSkillButton.addEventListener('click', () => {
    const entry = getActiveCompanion();
    if (!entry) return;
    blockExternalSync();
    entry.skills.push(createCompanionSkillEntry({ _draft: true }));
    renderCompanionDialog();
    saveDebounced();
  });

  refs.addCompanionFacetButton.addEventListener('click', () => {
    const entry = getActiveCompanion();
    if (!entry) return;
    blockExternalSync();
    entry.facets.push(createCompanionFacetEntry({ _draft: true }));
    renderCompanionDialog();
    saveDebounced();
  });

  function updateCompanionFromDialog() {
    blockExternalSync();
    const entry = getActiveCompanion();
    if (!entry) return;
    companionUi.applyCompanionFields(companionDialogFieldRefs, entry);
    refs.companionPvCurrentInput.value = entry.pvCurrent;
    companionUi.syncCompanionSticky(companionDialogDisplayRefs, entry, {
      titlePrefix: 'Mini-ficha',
      squareAvatar: true
    });
    refs.companionSkillsList.querySelectorAll('[data-companion-skill-index]').forEach((row) => {
      const skill = entry.skills[Number(row.dataset.companionSkillIndex)];
      refreshCompanionSkillRow(row, entry, skill);
    });
    renderCompanions();
    renderCombatView();
    syncOwnSheetResourcesToCombatDebounced();
    saveDebounced();
  }

  [
    refs.companionNameInput,
    refs.companionTypeInput,
    refs.companionStatusInput,
    refs.companionPvCurrentInput,
    refs.companionPvMaxInput,
    refs.companionArmorInput,
    refs.companionAttrForcaInput,
    refs.companionAttrDestrezaInput,
    refs.companionAttrSentidosInput,
    refs.companionAttrVigorInput,
    refs.companionAttrInteligenciaInput,
    refs.companionAttrNexoInput,
    refs.companionNotesInput
  ].forEach((element) => {
    element.addEventListener('input', updateCompanionFromDialog);
    element.addEventListener('change', updateCompanionFromDialog);
  });

  function refreshCompanionSkillRow(row, entry, skill) {
    companionUi.refreshCompanionSkillRow(row, entry, skill);
    return;
    if (!row || !entry || !skill) return;
    const signed = formatSigned(getCompanionSkillTotal(entry, skill));
    const small = row.querySelector('[data-role="skill-total"]');
    const large = row.querySelector('[data-role="skill-total-large"]');
    if (small) small.textContent = signed;
    if (large) large.textContent = signed;
  }

  function handleCompanionSkillUpdate(event) {
    const entry = getActiveCompanion();
    const row = event.target.closest('[data-companion-skill-index]');
    if (!entry || !row) return;
    const skill = entry.skills[Number(row.dataset.companionSkillIndex)];
    const field = event.target.dataset.field;
    if (field === 'value') {
      skill.value = Math.max(0, Number(event.target.value || 0));
      event.target.value = skill.value;
    } else if (field === 'attribute') {
      skill.attribute = event.target.value;
    } else {
      skill[field] = event.target.value;
    }
    if (hasCompanionSkillUserContent(skill)) delete skill._draft;
    refreshCompanionSkillRow(row, entry, skill);
    renderCompanions();
    saveDebounced();
  }

  refs.companionSkillsList.addEventListener('input', handleCompanionSkillUpdate);
  refs.companionSkillsList.addEventListener('change', handleCompanionSkillUpdate);
  refs.companionSkillsList.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action="remove-companion-skill"]');
    if (!button) return;
    const entry = getActiveCompanion();
    const row = button.closest('[data-companion-skill-index]');
    if (!entry || !row) return;
    blockExternalSync();
    entry.skills.splice(Number(row.dataset.companionSkillIndex), 1);
    renderCompanionDialog();
    renderCompanions();
    saveDebounced();
  });

  refs.companionFacetsList.addEventListener('input', (event) => {
    const entry = getActiveCompanion();
    const row = event.target.closest('[data-companion-facet-index]');
    if (!entry || !row) return;
    const facet = entry.facets[Number(row.dataset.companionFacetIndex)];
    const field = event.target.dataset.field;
    facet[field] = field === 'name' ? event.target.value : Math.max(field === 'rank' ? 1 : 0, Number(event.target.value || 0));
    if (field === 'rank') facet.rank = Math.min(10, facet.rank);
    if (hasCompanionFacetUserContent(facet)) delete facet._draft;
    renderCompanions();
    saveDebounced();
  });

  refs.companionFacetsList.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action="remove-companion-facet"]');
    if (!button) return;
    const entry = getActiveCompanion();
    const row = button.closest('[data-companion-facet-index]');
    if (!entry || !row) return;
    blockExternalSync();
    entry.facets.splice(Number(row.dataset.companionFacetIndex), 1);
    renderCompanionDialog();
    renderCompanions();
    saveDebounced();
  });

  refs.companionImageInput.addEventListener('change', async () => {
    const entry = getActiveCompanion();
    const file = refs.companionImageInput.files && refs.companionImageInput.files[0];
    if (!entry || !file) return;
    entry.image = await readFileAsOptimizedImage(file);
    refs.companionImageInput.value = '';
    renderCompanions();
    renderCompanionDialog();
    saveDebounced();
  });

  refs.removeCompanionImageButton.addEventListener('click', () => {
    const entry = getActiveCompanion();
    if (!entry) return;
    entry.image = '';
    renderCompanions();
    renderCompanionDialog();
    saveDebounced();
  });

  refs.deleteCompanionButton.addEventListener('click', () => {
    if (activeCompanionIndex === null) return;
    const entry = getActiveCompanion();
    if (!confirmCompanionDelete(entry)) return;
    character.companions.splice(activeCompanionIndex, 1);
    activeCompanionIndex = null;
    closeCompanionDialog();
    renderAll();
    saveDebounced();
  });

  refs.companionDialog.addEventListener('close', () => {
    activeCompanionIndex = null;
  });

  refs.combatControlList?.addEventListener('change', function (event) {
    const select = event.target.closest('[data-field="selectedCombatForm"]');
    if (select) {
      selectedCombatFormId = select.value || '';
      renderCombatView();
      return;
    }

    if (!event.target.closest('[data-combat-self-card], [data-combat-form-card], [data-combat-support-card]')) return;
    syncCombatControlFromPanel();
  });

  refs.combatControlList?.addEventListener('input', function (event) {
    if (!event.target.closest('[data-combat-self-card], [data-combat-form-card], [data-combat-support-card]')) return;
    syncCombatControlDebounced();
  });

  refs.combatControlList?.addEventListener('click', function (event) {
    if (event.target.closest('[data-action="leave-combat-self"]')) {
      requestCombatExit().catch(console.error);
      return;
    }

    const omnivitaStepButton = event.target.closest('[data-action="omnivita-step"]');
    if (omnivitaStepButton) {
      stepSelectedCombatForm(Number(omnivitaStepButton.dataset.direction || 0));
      return;
    }

    if (event.target.closest('[data-action="omnivita-main"]')) {
      handleOmnivitaMainAction().catch(console.error);
      return;
    }

    const omnivitaFormButton = event.target.closest('[data-action="omnivita-form-token"]');
    if (omnivitaFormButton) {
      handleOmnivitaTokenClick(omnivitaFormButton.dataset.companionId || '').catch(console.error);
      return;
    }

    const toggleFormButton = event.target.closest('[data-action="toggle-selected-form"]');
    if (toggleFormButton) {
      toggleSelectedCombatForm(toggleFormButton.dataset.nextActive === 'true').catch(console.error);
      return;
    }

    const openFormSheetButton = event.target.closest('[data-action="open-combat-form-sheet"], [data-action="open-selected-form-sheet"]');
    if (openFormSheetButton) {
      openCombatFormSheetById(openFormSheetButton.dataset.companionId || selectedCombatFormId);
      return;
    }

    const selectCombatFormButton = event.target.closest('[data-action="select-combat-form"]');
    if (selectCombatFormButton) {
      selectedCombatFormId = selectCombatFormButton.dataset.companionId || selectedCombatFormId;
      renderCombatView();
      const selectedCard = refs.combatControlList.querySelector('[data-combat-form-card]');
      if (selectedCard) {
        selectedCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    if (event.target.closest('[data-action="focus-combat-forms"]')) {
      const target = refs.combatControlList.querySelector('[data-combat-form-card], .combat-form-selector-card');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    if (event.target.closest('[data-action="jump-combat-overview"]')) {
      activateTab('overviewTab');
      return;
    }

    if (event.target.closest('[data-action="jump-combat-forms"]')) {
      activateTab('formsTab');
    }
  });

  function shouldIgnoreStorageUpdate(source, updatedCharacterId) {
    if (
      updatedCharacterId &&
      character &&
      character.id &&
      updatedCharacterId !== character.id &&
      source !== 'remote-refresh'
    ) {
      return true;
    }

    if (source === 'optimistic-save' || source === 'local-save') return true;
    if (source === 'remote-save' && updatedCharacterId === character.id) return true;

    return false;
  }

  function getPlayerCombatLiveSignature() {
    if (!character?.id) {
      return JSON.stringify(window.AppSystem.hydrateCombatSharedState(null));
    }

    return JSON.stringify(getCombatSharedState());
  }

  let playerRefreshInFlight = false;
  let playerCombatLiveSignature = getPlayerCombatLiveSignature();

  async function pullRemoteCombatState(source = 'poll') {
    if (playerRefreshInFlight) return;
    if (!window.AppStorage.fetchCharacterByIdDirect && !window.AppStorage.refresh) return;

    playerRefreshInFlight = true;

    try {
      let refreshedCharacter = null;
      let latestSharedState = null;

      if (window.AppStorage.fetchCharacterByIdDirect) {
        refreshedCharacter = await window.AppStorage.fetchCharacterByIdDirect(character.id);
      }

      if (!refreshedCharacter && window.AppStorage.fetchCharacterByOwnerUserIdDirect) {
        refreshedCharacter = await window.AppStorage.fetchCharacterByOwnerUserIdDirect(session.userId);
      }

      if (!refreshedCharacter && window.AppStorage.refresh) {
        await window.AppStorage.refresh(false);
        refreshedCharacter = window.AppStorage.getCharacterById(character.id)
          || window.AppStorage.getCharacterByOwnerUserId(session.userId)
          || null;
      }

      if (window.AppApi?.getCombatState) {
        try {
          const combatResponse = await window.AppApi.getCombatState();
          latestSharedState = window.AppSystem.hydrateCombatSharedState(combatResponse?.state || combatResponse || null);
          const latestTimestamp = getCombatStateTimestamp(latestSharedState);
          const currentTimestamp = getCombatStateTimestamp(liveCombatSharedState);
          if (latestTimestamp >= currentTimestamp) {
            liveCombatSharedState = latestSharedState;
            trackCombatVisualState(latestSharedState);
          }
        } catch (error) {
          console.error(error);
        }
      }

      if (refreshedCharacter && latestSharedState?.updatedAt) {
        refreshedCharacter.masterSession = window.AppSystem.hydrateMasterSession({
          ...(refreshedCharacter.masterSession || {}),
          combatShared: latestSharedState
        });
      } else if (!refreshedCharacter && latestSharedState?.updatedAt) {
        syncCharacterCombatSharedState(latestSharedState);
      }

      const nextSignature = JSON.stringify(getCombatSharedState());
      const changed = nextSignature !== playerCombatLiveSignature;

      if (changed) {
        playerCombatLiveSignature = nextSignature;
        if (refreshedCharacter) {
          character = refreshedCharacter;
          renderAll();
        } else {
          window.dispatchEvent(new CustomEvent('app-storage-updated', {
            detail: { source: 'remote-refresh-forced', characterId: character.id }
          }));
        }
        if (source === 'focus' || source === 'visible') {
          setSaveStatus('Ficha atualizada do banco.', 'neutral', { holdMs: 1200 });
        }
      } else if ((source === 'focus' || source === 'visible') && getCombatSharedState().active) {
        setSaveStatus('Sincronizado ao vivo.', 'neutral', { holdMs: 900 });
      }
    } catch (error) {
      console.error(error);
    } finally {
      playerRefreshInFlight = false;
    }
  }

  async function getLatestStoredCharacter() {
    return window.AppStorage.getCharacterById(character.id)
      || window.AppStorage.getCharacterByOwnerUserId(session.userId)
      || (window.AppStorage.fetchCharacterByIdDirect
        ? window.AppStorage.fetchCharacterByIdDirect(character.id)
        : null);
  }

  async function handleStorageUpdated(event) {
    try {
      const source = event && event.detail ? event.detail.source : '';
      const updatedCharacterId = event && event.detail ? event.detail.characterId : '';

      if (shouldIgnoreStorageUpdate(source, updatedCharacterId)) return;
      if (isExternalSyncBlocked() && (source === 'remote-refresh' || source === 'remote-save')) {
        setSaveStatus('Atualização externa detectada durante a edição.', 'warning', { sticky: true });
        return;
      }

      const refreshedCharacter = await getLatestStoredCharacter();
      if (!refreshedCharacter) return;
      character = refreshedCharacter;
      if (liveCombatSharedState?.updatedAt) {
        syncCharacterCombatSharedState(liveCombatSharedState);
      }
      if (combatStateMatchesPendingControl(getBaseCombatSharedState())) {
        clearPendingCombatControl();
      } else if (!pendingCombatControl) {
        localCombatControlSentAt = 0;
      }
      playerCombatLiveSignature = getPlayerCombatLiveSignature();
      renderAll();
      if (source === 'remote-refresh' || source === 'remote-refresh-forced') {
        setSaveStatus('Ficha atualizada do banco.', 'neutral', { holdMs: 1600 });
      }
    } catch (error) {
      console.error(error);
    }
  }

  function handleStorageError(event) {
    const message = event.detail && event.detail.message ? event.detail.message : 'Erro ao salvar no banco.';
    markSaveError(message);
  }

  window.addEventListener('app-storage-updated', handleStorageUpdated);

  window.addEventListener('app-storage-error', handleStorageError);

  window.AppCombatState?.subscribeState?.((state) => {
    const nextLiveState = window.AppSystem.hydrateCombatSharedState(state);
    const nextTimestamp = getCombatStateTimestamp(nextLiveState);
    const currentTimestamp = getCombatStateTimestamp(liveCombatSharedState);
    if (nextTimestamp < currentTimestamp) {
      return;
    }
    if (
      nextTimestamp === currentTimestamp
      && JSON.stringify(nextLiveState) === JSON.stringify(liveCombatSharedState)
    ) {
      return;
    }
    liveCombatSharedState = nextLiveState;
    trackCombatVisualState(nextLiveState);
    syncCharacterCombatSharedState(nextLiveState);
    if (combatStateMatchesPendingControl(nextLiveState)) {
      clearPendingCombatControl();
    } else if (!pendingCombatControl) {
      localCombatControlSentAt = 0;
    }
    playerCombatLiveSignature = getPlayerCombatLiveSignature();
    renderCombatView();
  });

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') {
      window.AppCombatState?.requestState?.({ requesterCharacterId: character.id, requesterUserId: session.userId });
      pullRemoteCombatState('visible');
    }
  });

  window.addEventListener('focus', function () {
    window.AppCombatState?.requestState?.({ requesterCharacterId: character.id, requesterUserId: session.userId });
    pullRemoteCombatState('focus');
  });

  const playerCombatPollTimer = window.setInterval(() => {
    if (document.visibilityState === 'visible') {
      window.AppCombatState?.requestState?.({ requesterCharacterId: character.id, requesterUserId: session.userId, reason: 'poll' });
      pullRemoteCombatState('poll');
    }
  }, 1600);

  window.addEventListener('pagehide', function () {
    window.clearInterval(playerCombatPollTimer);
  });

  window.AppCombatState?.requestState?.({ requesterCharacterId: character.id, requesterUserId: session.userId, reason: 'initial-load' });
  window.setTimeout(() => {
    window.AppCombatState?.requestState?.({ requesterCharacterId: character.id, requesterUserId: session.userId, reason: 'initial-retry' });
  }, 450);
  window.setTimeout(() => {
    window.AppCombatState?.requestState?.({ requesterCharacterId: character.id, requesterUserId: session.userId, reason: 'initial-retry-2' });
  }, 1400);

  bindSimpleInputs();
  createAttributeInputs();
  createSkillInputs();
  renderAll();
})();
/* ===== v28 polish: barras de recurso ===== */
(function () {
  function toNumber(value) {
    const parsed = Number(String(value ?? '').replace(/[^\d.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
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

  function enhanceMainResourceBars() {
    const specs = [
      { card: '#resourcesSection .resource-card:nth-child(1)', key: 'pv', input: '#pvCurrentInput', max: '#pvMaxLabel' },
      { card: '#resourcesSection .resource-card:nth-child(2)', key: 'pe', input: '#peCurrentInput', max: '#peMaxLabel' },
      { card: '#resourcesSection .resource-card:nth-child(3)', key: 'pd', input: '#pdCurrentInput', max: '#pdMaxLabel' }
    ];

    specs.forEach((spec) => {
      const card = document.querySelector(spec.card);
      if (!card) return;

      card.classList.add('resource-card-v28');

      let shell = card.querySelector('.resource-bar-shell');
      if (!shell) {
        shell = createBarShell(spec.key);
        const formula = card.querySelector('.formula-note');
        if (formula) {
          formula.insertAdjacentElement('beforebegin', shell);
        } else {
          card.appendChild(shell);
        }
      }

      updateShell(
        shell,
        toNumber(document.querySelector(spec.input)?.value),
        toNumber(document.querySelector(spec.max)?.textContent)
      );
    });
  }

  function enhanceCompanionCards() {
    const cards = document.querySelectorAll('#companionsList .companion-mini-card');

    cards.forEach((card) => {
      const pvTag = Array.from(card.querySelectorAll('.stat-tag')).find((tag) =>
        /^PV\s+/i.test(tag.textContent.trim())
      );
      if (!pvTag) return;

      const match = pvTag.textContent.trim().match(/PV\s+(\d+)\s*\/\s*(\d+)/i);
      if (!match) return;

      const current = Number(match[1]);
      const max = Number(match[2]);

      let shell = card.querySelector('.compact-resource-bar');
      if (!shell) {
        shell = createBarShell('pv');
        shell.classList.add('compact-resource-bar');

        const firstRow = card.querySelector('.card-stat-row');
        if (firstRow) {
          firstRow.insertAdjacentElement('afterend', shell);
        } else {
          card.appendChild(shell);
        }
      }

      updateShell(shell, current, max);
    });
  }

  let queued = false;
  function scheduleEnhance() {
    if (queued) return;
    queued = true;

    window.requestAnimationFrame(() => {
      queued = false;
      enhanceMainResourceBars();
      enhanceCompanionCards();
    });
  }

  window.addEventListener('load', () => setTimeout(scheduleEnhance, 160));
  window.addEventListener('app-storage-updated', () => setTimeout(scheduleEnhance, 120));

  document.addEventListener('input', (event) => {
    if (event.target.closest('#resourcesSection, #companionsList, #companionDialog')) {
      scheduleEnhance();
    }
  }, true);

  document.addEventListener('change', (event) => {
    if (event.target.closest('#resourcesSection, #companionsList, #companionDialog')) {
      scheduleEnhance();
    }
  }, true);

  const resourceSection = document.getElementById('resourcesSection');
  const companionsList = document.getElementById('companionsList');
  const observer = new MutationObserver(() => scheduleEnhance());

  if (resourceSection) observer.observe(resourceSection, { childList: true, subtree: true });
  if (companionsList) observer.observe(companionsList, { childList: true, subtree: true });

  scheduleEnhance();
})();
