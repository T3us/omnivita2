export type OmnivitaSecretDirection = 'up' | 'down';
export type OmnivitaManifestationState = 'Parcial' | 'Completa' | 'Alem';

export interface OmnivitaMasterControlConfig {
  id: 'master-control';
  name: string;
  sequence: OmnivitaSecretDirection[];
  requiredState: OmnivitaManifestationState;
  enabled: boolean;
}

export interface OmnivitaUnlockCodeConfig {
  id: string;
  name: string;
  sequence: OmnivitaSecretDirection[];
  requiredState: OmnivitaManifestationState;
  targetCompanionId: string;
  enabled: boolean;
}

export interface OmnivitaCodeConfig {
  masterControl: OmnivitaMasterControlConfig;
  unlockCodes: OmnivitaUnlockCodeConfig[];
}

export const OMNIVITA_MANIFESTATION_STATES: OmnivitaManifestationState[] = ['Parcial', 'Completa', 'Alem'];

export const OMNIVITA_MASTER_CONTROL_CODE = {
  id: 'master-control',
  name: 'Controle mestre',
  message: 'Controle mestre liberado.',
  sequence: ['up', 'up', 'down', 'up'] as OmnivitaSecretDirection[]
};

export const OMNIVITA_MASTER_SCAN_LOOPS = 2;
export const OMNIVITA_MASTER_SCAN_SPEED_MULTIPLIER = 2;

export function normalizeOmnivitaDirection(value: unknown): OmnivitaSecretDirection | null {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'up' || normalized === 'cima') return 'up';
  if (normalized === 'down' || normalized === 'baixo') return 'down';
  return null;
}

export function normalizeOmnivitaManifestationState(value: unknown): OmnivitaManifestationState {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'completa') return 'Completa';
  if (normalized === 'alem' || normalized === 'além') return 'Alem';
  return 'Parcial';
}

export function getOmnivitaManifestationStateRank(value: unknown) {
  const normalized = normalizeOmnivitaManifestationState(value);
  return OMNIVITA_MANIFESTATION_STATES.indexOf(normalized);
}

export function manifestationStateMeetsRequirement(currentState: unknown, requiredState: unknown) {
  return getOmnivitaManifestationStateRank(currentState) >= getOmnivitaManifestationStateRank(requiredState);
}

export function createOmnivitaUnlockCode(overrides: Partial<OmnivitaUnlockCodeConfig> = {}): OmnivitaUnlockCodeConfig {
  return normalizeOmnivitaUnlockCode({
    id: `ovc-${Math.random().toString(36).slice(2, 10)}`,
    name: '',
    sequence: [],
    requiredState: 'Parcial',
    targetCompanionId: '',
    enabled: true,
    ...overrides
  });
}

export function normalizeOmnivitaUnlockCode(raw: Partial<OmnivitaUnlockCodeConfig> | Record<string, unknown>): OmnivitaUnlockCodeConfig {
  const record = (raw || {}) as Record<string, unknown>;
  const sequence = Array.isArray(record.sequence)
    ? record.sequence.map((entry) => normalizeOmnivitaDirection(entry)).filter(Boolean) as OmnivitaSecretDirection[]
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

export function normalizeOmnivitaCodeConfig(raw: unknown): OmnivitaCodeConfig {
  const record = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
  const masterRaw = record.masterControl && typeof record.masterControl === 'object'
    ? record.masterControl as Record<string, unknown>
    : {};
  const unlockCodes = Array.isArray(record.unlockCodes)
    ? record.unlockCodes.map((entry) => normalizeOmnivitaUnlockCode(entry as Record<string, unknown>))
    : [];

  return {
    masterControl: {
      id: 'master-control',
      name: OMNIVITA_MASTER_CONTROL_CODE.name,
      sequence: Array.isArray(masterRaw.sequence)
        ? masterRaw.sequence.map((entry) => normalizeOmnivitaDirection(entry)).filter(Boolean) as OmnivitaSecretDirection[]
        : [...OMNIVITA_MASTER_CONTROL_CODE.sequence],
      requiredState: normalizeOmnivitaManifestationState(masterRaw.requiredState),
      enabled: masterRaw.enabled === undefined ? true : Boolean(masterRaw.enabled)
    },
    unlockCodes
  };
}

export function formatOmnivitaSequence(sequence: OmnivitaSecretDirection[]) {
  if (!sequence.length) return 'Sem sequencia.';
  return sequence.map((entry) => entry === 'up' ? 'Cima' : 'Baixo').join(', ');
}

export function matchesOmnivitaSequence(trail: OmnivitaSecretDirection[], sequence: OmnivitaSecretDirection[]) {
  if (!sequence.length || sequence.length > trail.length) return false;
  return sequence.every((step, index) => step === trail[trail.length - sequence.length + index]);
}

export function getOmnivitaStepDuration(speedMultiplier = 1, reducedMotion = false) {
  const safeMultiplier = Math.max(0.25, Number(speedMultiplier) || 1);
  const baseDuration = reducedMotion ? 190 : 735;
  return Math.max(90, Math.round(baseDuration / safeMultiplier));
}
