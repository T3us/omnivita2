export const OMNIVITA_MANIFESTATION_STATES = ['Parcial', 'Completa', 'Alem'];

export const OMNIVITA_MASTER_CONTROL_CODE = {
  id: 'master-control',
  name: 'Controle mestre',
  message: 'Controle mestre liberado.',
  sequence: ['up', 'up', 'down', 'up']
};

export function normalizeOmnivitaDirection(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'up' || normalized === 'cima') return 'up';
  if (normalized === 'down' || normalized === 'baixo') return 'down';
  return null;
}

export function normalizeOmnivitaManifestationState(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'completa') return 'Completa';
  if (normalized === 'alem' || normalized === 'além') return 'Alem';
  return 'Parcial';
}

export function getOmnivitaManifestationStateRank(value) {
  return OMNIVITA_MANIFESTATION_STATES.indexOf(normalizeOmnivitaManifestationState(value));
}

export function manifestationStateMeetsRequirement(currentState, requiredState) {
  return getOmnivitaManifestationStateRank(currentState) >= getOmnivitaManifestationStateRank(requiredState);
}

export function matchesOmnivitaSequence(trail, sequence) {
  if (!Array.isArray(trail) || !Array.isArray(sequence) || !sequence.length || sequence.length > trail.length) return false;
  return sequence.every((step, index) => step === trail[trail.length - sequence.length + index]);
}

export function normalizeOmnivitaUnlockCode(raw = {}) {
  const record = raw && typeof raw === 'object' ? raw : {};
  const sequence = Array.isArray(record.sequence)
    ? record.sequence.map((entry) => normalizeOmnivitaDirection(entry)).filter(Boolean)
    : [];

  return {
    id: String(record.id || `ovc-${Math.random().toString(36).slice(2, 10)}`),
    name: String(record.name || ''),
    sequence,
    requiredState: normalizeOmnivitaManifestationState(record.requiredState),
    targetCompanionId: String(record.targetCompanionId || ''),
    enabled: record.enabled === undefined ? true : Boolean(record.enabled)
  };
}

export function normalizeOmnivitaCodeConfig(raw) {
  const record = raw && typeof raw === 'object' ? raw : {};
  const masterRaw = record.masterControl && typeof record.masterControl === 'object'
    ? record.masterControl
    : {};

  return {
    masterControl: {
      id: 'master-control',
      name: OMNIVITA_MASTER_CONTROL_CODE.name,
      sequence: Array.isArray(masterRaw.sequence)
        ? masterRaw.sequence.map((entry) => normalizeOmnivitaDirection(entry)).filter(Boolean)
        : [...OMNIVITA_MASTER_CONTROL_CODE.sequence],
      requiredState: normalizeOmnivitaManifestationState(masterRaw.requiredState),
      enabled: masterRaw.enabled === undefined ? true : Boolean(masterRaw.enabled)
    },
    unlockCodes: Array.isArray(record.unlockCodes)
      ? record.unlockCodes.map((entry) => normalizeOmnivitaUnlockCode(entry))
      : []
  };
}
