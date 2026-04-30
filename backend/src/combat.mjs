import { query } from './db.mjs';
import { cloneJson } from './serializers.mjs';

function clampNumber(value, min, max) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return min;
  return Math.min(max, Math.max(min, numeric));
}

function normalizeCombatStatus(value, fallback = 'Vivo') {
  const normalized = String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  if (!normalized) return fallback;
  if (normalized.includes('morto') || normalized.includes('derrotado')) return 'Morto';
  if (normalized.includes('morrendo') || normalized.includes('agonizando')) return 'Morrendo';
  return 'Vivo';
}

function normalizeStatusForPv(currentStatus, pvCurrent) {
  const status = normalizeCombatStatus(currentStatus, 'Vivo');
  const pv = Number(pvCurrent || 0);
  if (pv <= 0) return status === 'Morto' ? 'Morto' : 'Morrendo';
  if (status === 'Morrendo') return 'Vivo';
  return status;
}

function normalizeLookup(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

const CLASS_CONFIG = {
  Alterado: { pvBase: 16, peBase: 6, pdBase: 15, armorBase: 0, pvGrowth: 2, peGrowth: 3, pdGrowth: 5 },
  Especialista: { pvBase: 19, peBase: 4, pdBase: 12, armorBase: 0, pvGrowth: 3, peGrowth: 2, pdGrowth: 4 },
  Combatente: { pvBase: 25, peBase: 2, pdBase: 10, armorBase: 1, pvGrowth: 4, peGrowth: 1, pdGrowth: 3 }
};

const APTITUDE_AUTO_EFFECTS = {
  'sangue-frio': { initiativeBonus: 2 },
  'folego-extra': { maxPvBonus: 5 },
  'reserva-mental': { maxPdBonus: 5 },
  'reserva-tecnica': { maxPeBonus: 4 },
  'leitura-de-gente': { skillBonuses: { intuicao: 2 } },
  'presenca-dificil': { chosenSkillBonus: 3, optionKey: 'effectChoice', defaultOption: 'intimidacao' },
  'casca-dura': { armorBonus: 1 },
  preparado: { initiativeBonus: 2 },
  'guarda-fechada': { blockBonus: 2 },
  'guarda-fechada-ii': { blockBonusOverride: 4 },
  'ossos-de-concreto': { armorBonus: 1 },
  'corpo-de-cerco': { armorBonus: 2 },
  'presenca-inquebravel': { skillBonuses: { intimidacao: 4 } }
};

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function floorHalf(value) {
  return Math.floor(toNumber(value) / 2);
}

function getClassConfig(className) {
  return CLASS_CONFIG[String(className || '')] || CLASS_CONFIG.Especialista;
}

function calculateAptitudeBonuses(character) {
  const bonuses = {
    maxPvBonus: 0,
    maxPeBonus: 0,
    maxPdBonus: 0,
    armorBonus: 0,
    initiativeBonus: 0,
    blockBonus: 0,
    skillBonuses: {}
  };

  const aptitudes = Array.isArray(character?.aptitudes) ? character.aptitudes : [];
  for (const aptitude of aptitudes) {
    const catalogId = String(aptitude?.catalogId || '');
    const config = APTITUDE_AUTO_EFFECTS[catalogId] || {};
    bonuses.maxPvBonus += toNumber(config.maxPvBonus);
    bonuses.maxPeBonus += toNumber(config.maxPeBonus);
    bonuses.maxPdBonus += toNumber(config.maxPdBonus);
    bonuses.armorBonus += toNumber(config.armorBonus);
    bonuses.initiativeBonus += toNumber(config.initiativeBonus);

    if (config.blockBonusOverride) {
      bonuses.blockBonus = toNumber(config.blockBonusOverride);
    } else {
      bonuses.blockBonus = Math.max(bonuses.blockBonus, toNumber(config.blockBonus));
    }

    Object.entries(config.skillBonuses || {}).forEach(([skillKey, bonus]) => {
      bonuses.skillBonuses[skillKey] = toNumber(bonuses.skillBonuses[skillKey]) + toNumber(bonus);
    });

    if (config.chosenSkillBonus) {
      const optionKey = config.optionKey || 'effectChoice';
      const effectKey = String(aptitude?.[optionKey] || config.defaultOption || '');
      if (effectKey) {
        bonuses.skillBonuses[effectKey] = toNumber(bonuses.skillBonuses[effectKey]) + toNumber(config.chosenSkillBonus);
      }
    }
  }

  return bonuses;
}

function calculateDerived(character) {
  const identity = character?.identity || {};
  const attributes = character?.attributes || {};
  const skills = character?.skills || {};
  const resources = character?.resources || {};
  const classConfig = getClassConfig(identity.className);
  const level = Math.max(1, toNumber(identity.level, 1));
  const growthLevels = Math.max(0, level - 1);
  const aptitudeBonuses = calculateAptitudeBonuses(character);
  const fortitudeTotal = toNumber(skills.fortitude) + toNumber(aptitudeBonuses.skillBonuses.fortitude);
  const reflexosTotal = toNumber(skills.reflexos) + toNumber(aptitudeBonuses.skillBonuses.reflexos);
  const iniciativaTotal = toNumber(skills.iniciativa) + toNumber(aptitudeBonuses.skillBonuses.iniciativa);
  const manifestacaoTotal = toNumber(skills.manifestacao) + toNumber(aptitudeBonuses.skillBonuses.manifestacao);
  const blockMode = resources.blockMode === 'forca' ? 'forca' : 'vigor';

  return {
    maxPv: classConfig.pvBase + (growthLevels * classConfig.pvGrowth) + (toNumber(attributes.vigor) * 3) + aptitudeBonuses.maxPvBonus,
    maxPe: classConfig.peBase + (growthLevels * classConfig.peGrowth) + (toNumber(attributes.nexo) * 3) + aptitudeBonuses.maxPeBonus,
    maxPd: classConfig.pdBase + (growthLevels * classConfig.pdGrowth) + (toNumber(attributes.inteligencia) * 2) + aptitudeBonuses.maxPdBonus,
    armor: classConfig.armorBase + toNumber(resources.armorBonus) + aptitudeBonuses.armorBonus,
    esquivaMod: reflexosTotal + floorHalf(attributes.destreza),
    blockForce: 10 + fortitudeTotal + floorHalf(attributes.forca) + aptitudeBonuses.blockBonus,
    blockVigor: 10 + fortitudeTotal + floorHalf(attributes.vigor) + aptitudeBonuses.blockBonus,
    selectedBlock: 10 + fortitudeTotal + floorHalf(attributes[blockMode]) + aptitudeBonuses.blockBonus,
    initiativeMod: iniciativaTotal + floorHalf(attributes.destreza) + aptitudeBonuses.initiativeBonus,
    manifestationMod: manifestacaoTotal + floorHalf(attributes.nexo)
  };
}

function getCompanionSkillTotal(companion, skill) {
  const attributeKey = String(skill?.attribute || 'destreza');
  return toNumber(skill?.value) + floorHalf(companion?.attributes?.[attributeKey]);
}

function getCompanionNamedSkillTotal(companion, skillNames = []) {
  const wanted = new Set(skillNames.map((value) => normalizeLookup(value)).filter(Boolean));
  return (Array.isArray(companion?.skills) ? companion.skills : []).reduce((best, skill) => {
    if (!wanted.has(normalizeLookup(skill?.name))) return best;
    return Math.max(best, getCompanionSkillTotal(companion, skill));
  }, 0);
}

function calculateCompanionDerived(companion) {
  const attributes = companion?.attributes || {};
  const forca = toNumber(attributes.forca);
  const destreza = toNumber(attributes.destreza);
  const vigor = toNumber(attributes.vigor);
  const reflexos = getCompanionNamedSkillTotal(companion, ['reflexos']);
  const fortitude = getCompanionNamedSkillTotal(companion, ['fortitude']);

  return {
    dodge: Math.max(reflexos, floorHalf(destreza)),
    block: 10 + Math.max(fortitude, floorHalf(Math.max(forca, vigor)))
  };
}

function isCompanionForm(companion) {
  const typeLookup = normalizeLookup(companion?.type);
  if (!typeLookup) return false;
  return typeLookup.includes('forma') || typeLookup.includes('alien');
}

function buildCharacterCombatant(character, overrides = {}) {
  const identity = character?.identity || {};
  const resources = character?.resources || {};
  const level = Math.max(1, Number(identity.level || 1));
  const derived = calculateDerived(character);

  return {
    order: Math.max(1, Number(overrides.order || 1)),
    instanceId: String(overrides.instanceId || `char-${character?.id || 'player'}`),
    combatantType: 'character',
    typeLabel: String(overrides.typeLabel || 'Player'),
    name: String(overrides.name || identity.name || 'Personagem'),
    subtitle: String(
      overrides.subtitle
      || `${identity.className || 'Personagem'} | Nv ${level}`
    ),
    status: normalizeCombatStatus(overrides.status || resources.status, 'Vivo'),
    pvCurrent: clampNumber(overrides.pvCurrent ?? resources.pvCurrent ?? derived.maxPv, 0, 9999),
    pvMax: clampNumber(overrides.pvMax ?? derived.maxPv, 0, 9999),
    armor: clampNumber(overrides.armor ?? derived.armor, 0, 999),
    dodge: clampNumber(overrides.dodge ?? derived.esquivaMod, 0, 999),
    block: clampNumber(overrides.block ?? derived.selectedBlock, 0, 999),
    initiativeTotal: clampNumber(overrides.initiativeTotal ?? 0, -99, 999),
    sourceCharacterId: String(overrides.sourceCharacterId || character?.id || ''),
    sourceCompanionId: '',
    ownerName: '',
    image: String(overrides.image || identity.image || ''),
    isForm: false,
    isCurrentTurn: Boolean(overrides.isCurrentTurn)
  };
}

function buildCompanionCombatant(character, companion, overrides = {}) {
  const identity = character?.identity || {};
  const isForm = isCompanionForm(companion);
  const typeLabel = isForm ? 'Forma' : 'Mini-ficha';
  const companionType = String(companion?.type || typeLabel);
  const characterDerived = calculateDerived(character);
  const companionDerived = calculateCompanionDerived(companion);
  const initiativeFallback = isForm ? characterDerived.initiativeMod : 0;

  return {
    order: Math.max(1, Number(overrides.order || 1)),
    instanceId: String(
      overrides.instanceId
      || `cmp-${character?.id || 'player'}-${companion?.id || 'companion'}`
    ),
    combatantType: 'companion',
    typeLabel: String(overrides.typeLabel || typeLabel),
    name: String(overrides.name || companion?.name || 'Mini-ficha'),
    subtitle: String(
      overrides.subtitle
      || `${companionType} | ${identity.name || 'Sem dono'}`
    ),
    status: normalizeCombatStatus(overrides.status || companion?.status, 'Vivo'),
    pvCurrent: clampNumber(overrides.pvCurrent ?? companion?.pvCurrent ?? 0, 0, 9999),
    pvMax: clampNumber(overrides.pvMax ?? companion?.pvMax ?? companion?.pvCurrent ?? 0, 0, 9999),
    armor: clampNumber(overrides.armor ?? companion?.armor ?? 0, 0, 999),
    dodge: clampNumber(overrides.dodge ?? companionDerived.dodge, 0, 999),
    block: clampNumber(overrides.block ?? companionDerived.block, 0, 999),
    initiativeTotal: clampNumber(overrides.initiativeTotal ?? initiativeFallback, -99, 999),
    sourceCharacterId: String(overrides.sourceCharacterId || character?.id || ''),
    sourceCompanionId: String(overrides.sourceCompanionId || companion?.id || ''),
    ownerName: String(overrides.ownerName || identity.name || ''),
    image: String(overrides.image || companion?.image || ''),
    isForm,
    isCurrentTurn: Boolean(overrides.isCurrentTurn)
  };
}

function getCombatantSourceKey(entry) {
  if (String(entry?.combatantType || '') === 'character') {
    return `character:${String(entry?.sourceCharacterId || '')}`;
  }

  if (String(entry?.combatantType || '') === 'companion') {
    return `companion:${String(entry?.sourceCharacterId || '')}:${String(entry?.sourceCompanionId || '')}`;
  }

  return String(entry?.instanceId || '');
}

function getEmptyCombatState() {
  return {
    active: false,
    round: 1,
    currentInstanceId: '',
    updatedAt: '',
    combatants: []
  };
}

export { getEmptyCombatState };

export function normalizeCombatState(state, options = {}) {
  const safe = cloneJson(state || getEmptyCombatState()) || getEmptyCombatState();
  const nextState = {
    ...getEmptyCombatState(),
    ...safe,
    active: Boolean(safe.active && Array.isArray(safe.combatants) && safe.combatants.length),
    round: Math.max(1, Number(safe.round || 1)),
    currentInstanceId: String(safe.currentInstanceId || ''),
    updatedAt: options.updatedAt || String(safe.updatedAt || new Date().toISOString()),
    combatants: Array.isArray(safe.combatants) ? safe.combatants : []
  };

  nextState.combatants = nextState.combatants.map((entry, index) => ({
    ...entry,
    order: Math.max(1, Number(entry?.order || index + 1)),
    instanceId: String(entry?.instanceId || `enc-${index + 1}`),
    combatantType: ['enemy', 'character', 'companion'].includes(String(entry?.combatantType || ''))
      ? String(entry.combatantType)
      : 'enemy',
    sourceCharacterId: String(entry?.sourceCharacterId || ''),
    sourceCompanionId: String(entry?.sourceCompanionId || ''),
    name: String(entry?.name || 'Combatente'),
    subtitle: String(entry?.subtitle || ''),
    status: normalizeCombatStatus(entry?.status, 'Vivo'),
    typeLabel: String(entry?.typeLabel || ''),
    ownerName: String(entry?.ownerName || ''),
    image: String(entry?.image || ''),
    pvCurrent: clampNumber(entry?.pvCurrent ?? 0, 0, 9999),
    pvMax: clampNumber(entry?.pvMax ?? 0, 0, 9999),
    armor: clampNumber(entry?.armor ?? 0, 0, 999),
    dodge: clampNumber(entry?.dodge ?? 0, 0, 999),
    block: clampNumber(entry?.block ?? 0, 0, 999),
    initiativeTotal: clampNumber(entry?.initiativeTotal ?? 0, -99, 999),
    isForm: Boolean(entry?.isForm),
    isCurrentTurn: Boolean(entry?.isCurrentTurn)
  }));

  return nextState;
}

function sortCombatants(combatants) {
  return combatants
    .slice()
    .sort((left, right) => {
      const initiativeDelta = Number(right?.initiativeTotal || 0) - Number(left?.initiativeTotal || 0);
      if (initiativeDelta) return initiativeDelta;
      return Number(left?.order || 0) - Number(right?.order || 0);
    })
    .map((entry, index) => ({
      ...entry,
      order: index + 1
    }));
}

function finalizeCombatState(state, options = {}) {
  const previousState = normalizeCombatState(state);
  const sortedCombatants = sortCombatants(previousState.combatants);
  const currentInstanceId = sortedCombatants.some((entry) => entry.instanceId === previousState.currentInstanceId)
    ? previousState.currentInstanceId
    : (sortedCombatants[0]?.instanceId || '');

  return normalizeCombatState({
    ...previousState,
    active: sortedCombatants.length > 0,
    currentInstanceId,
    combatants: sortedCombatants.map((entry) => ({
      ...entry,
      isCurrentTurn: Boolean(currentInstanceId && entry.instanceId === currentInstanceId)
    }))
  }, {
    updatedAt: options.updatedAt || new Date().toISOString()
  });
}

function getSharedActorEntries(combatants, characterId) {
  return combatants.filter((entry) => {
    const sameCharacter = String(entry?.sourceCharacterId || '') === String(characterId || '');
    if (!sameCharacter) return false;
    return entry?.combatantType === 'character' || Boolean(entry?.isForm);
  });
}

function getSharedInitiativeTotal(combatants, characterId, fallback = 0) {
  const sharedActor = getSharedActorEntries(combatants, characterId)[0];
  return sharedActor ? Number(sharedActor.initiativeTotal || 0) : Number(fallback || 0);
}

function getSharedActorStatus(combatants, character, fallback = 'Vivo') {
  const sharedActor = getSharedActorEntries(combatants, character?.id)[0];
  return normalizeCombatStatus(
    sharedActor?.status || character?.resources?.status,
    fallback
  );
}

function removeCombatants(combatants, predicate) {
  return combatants.filter((entry) => !predicate(entry));
}

function upsertCombatant(combatants, combatant) {
  const sourceKey = getCombatantSourceKey(combatant);
  const index = combatants.findIndex((entry) => getCombatantSourceKey(entry) === sourceKey);

  if (index >= 0) {
    combatants.splice(index, 1, {
      ...combatants[index],
      ...combatant
    });
    return combatants[index];
  }

  combatants.push(combatant);
  return combatant;
}

function applyCombatantOverrides(baseCombatant, control) {
  const nextCombatant = {
    ...baseCombatant
  };

  if (control && control.initiativeTotal !== null && control.initiativeTotal !== undefined) {
    nextCombatant.initiativeTotal = clampNumber(control.initiativeTotal, -99, 999);
  }

  if (control && control.pvCurrent !== null && control.pvCurrent !== undefined) {
    nextCombatant.pvCurrent = clampNumber(control.pvCurrent, 0, Number(nextCombatant.pvMax || 9999));
    nextCombatant.status = normalizeStatusForPv(nextCombatant.status, nextCombatant.pvCurrent);
  }

  return nextCombatant;
}

export function applyCombatControlToState(state, character, controlState) {
  const stateDraft = normalizeCombatState(state);
  const control = controlState && typeof controlState === 'object'
    ? controlState
    : {};
  const selfControl = control.self && typeof control.self === 'object' ? control.self : null;
  const companionControls = Array.isArray(control.companions) ? control.companions : [];
  const companions = Array.isArray(character?.companions) ? character.companions : [];
  const forms = companions.filter(isCompanionForm);
  const formIds = new Set(forms.map((entry) => String(entry?.id || '')));
  const previousCurrent = stateDraft.combatants.find((entry) => entry.instanceId === stateDraft.currentInstanceId) || null;
  const hadSharedActor = getSharedActorEntries(stateDraft.combatants, character?.id).length > 0;
  const selfExitRequested = Boolean(selfControl && selfControl.inEncounter === false);
  const activeFormControls = companionControls.filter((entry) => formIds.has(String(entry?.companionId || '')) && entry?.inEncounter === true);
  const explicitFormControls = companionControls.filter((entry) => {
    return formIds.has(String(entry?.companionId || '')) && typeof entry?.inEncounter === 'boolean';
  });
  const selectedFormControl = activeFormControls.length ? activeFormControls[activeFormControls.length - 1] : null;
  const selectedForm = selectedFormControl
    ? forms.find((entry) => String(entry?.id || '') === String(selectedFormControl.companionId || '')) || null
    : null;
  const sharedInitiativeTotal = selfControl && selfControl.initiativeTotal !== null && selfControl.initiativeTotal !== undefined
    ? Number(selfControl.initiativeTotal || 0)
    : getSharedInitiativeTotal(stateDraft.combatants, character?.id, 0);
  const sharedActorStatus = getSharedActorStatus(stateDraft.combatants, character, 'Vivo');
  const canSwapSharedActor = sharedActorStatus === 'Vivo';
  const returnToCharacterRequested = Boolean(
    hadSharedActor
    && !selectedForm
    && !selfExitRequested
    && explicitFormControls.length
  );

  let combatants = stateDraft.combatants.slice();

  const removeSharedActorEntries = () => {
    combatants = removeCombatants(combatants, (entry) => {
      const sameCharacter = String(entry?.sourceCharacterId || '') === String(character?.id || '');
      if (!sameCharacter) return false;
      return entry?.combatantType === 'character' || Boolean(entry?.isForm);
    });
  };

  if (selfExitRequested) {
    removeSharedActorEntries();
  } else if (hadSharedActor && !canSwapSharedActor) {
    // Keep the current shared actor while dying/dead to avoid revive-by-swap.
  } else if (selectedForm) {
    removeSharedActorEntries();
    upsertCombatant(
      combatants,
      applyCombatantOverrides(
        buildCompanionCombatant(character, selectedForm, {
          initiativeTotal: sharedInitiativeTotal,
          status: sharedActorStatus
        }),
        selectedFormControl
      )
    );
  } else if (returnToCharacterRequested) {
    removeSharedActorEntries();
    upsertCombatant(
      combatants,
      applyCombatantOverrides(
        buildCharacterCombatant(character, {
          initiativeTotal: sharedInitiativeTotal,
          status: sharedActorStatus
        }),
        selfControl
      )
    );
  }

  companionControls
    .filter((entry) => !formIds.has(String(entry?.companionId || '')))
    .forEach((entry) => {
      const companion = companions.find((item) => String(item?.id || '') === String(entry?.companionId || ''));
      if (!companion) return;

      const sourceKey = `companion:${String(character?.id || '')}:${String(companion?.id || '')}`;
      if (entry?.inEncounter === false) {
        combatants = removeCombatants(combatants, (combatant) => getCombatantSourceKey(combatant) === sourceKey);
        return;
      }

      const existing = combatants.find((combatant) => getCombatantSourceKey(combatant) === sourceKey);
      const baseCombatant = existing || buildCompanionCombatant(character, companion, {
        initiativeTotal: entry?.initiativeTotal ?? 0
      });
      upsertCombatant(combatants, applyCombatantOverrides(baseCombatant, entry));
    });

  if (
    selfControl
    && (
      (selfControl.initiativeTotal !== null && selfControl.initiativeTotal !== undefined)
      || (selfControl.pvCurrent !== null && selfControl.pvCurrent !== undefined)
    )
  ) {
    combatants = combatants.map((entry) => {
      const sameCharacter = String(entry?.sourceCharacterId || '') === String(character?.id || '');
      const sameSharedActor = sameCharacter && (entry?.combatantType === 'character' || Boolean(entry?.isForm));
      if (!sameSharedActor) return entry;

      // Iniciativa e presenca sao compartilhadas entre personagem e forma, mas PV nao.
      // Se uma forma esta ativa, o PV dela precisa vir da propria mini-ficha.
      if (entry?.combatantType === 'character') {
        return applyCombatantOverrides(entry, selfControl);
      }

      return applyCombatantOverrides(entry, {
        ...selfControl,
        pvCurrent: null
      });
    });
  }

  let nextCurrentInstanceId = String(stateDraft.currentInstanceId || '');
  if (previousCurrent && String(previousCurrent.sourceCharacterId || '') === String(character?.id || '')) {
    if (selfExitRequested) {
      nextCurrentInstanceId = '';
    } else {
      const replacement = combatants.find((entry) => {
        const sameCharacter = String(entry?.sourceCharacterId || '') === String(character?.id || '');
        return sameCharacter && (entry?.combatantType === 'character' || Boolean(entry?.isForm));
      });
      nextCurrentInstanceId = replacement ? String(replacement.instanceId || '') : '';
    }
  }

  return finalizeCombatState({
    ...stateDraft,
    currentInstanceId: nextCurrentInstanceId,
    combatants
  });
}

export async function getCombatState(client) {
  const result = await query(
    'SELECT id, state, updated_at FROM combat_state WHERE id = $1 LIMIT 1',
    ['global'],
    client
  );

  const row = result.rows[0];
  if (!row) {
    return getEmptyCombatState();
  }

  return normalizeCombatState(row.state, {
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined
  });
}

export async function saveCombatState(state, client) {
  const normalized = finalizeCombatState(state, { updatedAt: new Date().toISOString() });

  const result = await query(
    `
      INSERT INTO combat_state (id, state, updated_at)
      VALUES ('global', $1, now())
      ON CONFLICT (id)
      DO UPDATE SET
        state = EXCLUDED.state,
        updated_at = now()
      RETURNING id, state, updated_at
    `,
    [normalized],
    client
  );

  const row = result.rows[0];
  return normalizeCombatState(row.state, {
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : normalized.updatedAt
  });
}

export function scopeCombatStateForUser(user, state) {
  const safeState = normalizeCombatState(state);
  if (user.role === 'master') return safeState;

  const ownsCombat = safeState.combatants.some((entry) => {
    return String(entry?.sourceCharacterId || '') === String(user.characterId || '');
  });

  if (ownsCombat) {
    return normalizeCombatState({
      ...safeState,
      combatants: safeState.combatants.map((entry) => {
        const isOwn = String(entry?.sourceCharacterId || '') === String(user.characterId || '');
        if (isOwn) return entry;

        const {
          pvCurrent,
          pvMax,
          armor,
          dodge,
          block,
          ...publicEntry
        } = entry;

        return publicEntry;
      })
    }, {
      updatedAt: safeState.updatedAt
    });
  }

  return normalizeCombatState({
    ...getEmptyCombatState(),
    round: safeState.round,
    updatedAt: safeState.updatedAt
  }, {
    updatedAt: safeState.updatedAt
  });
}
