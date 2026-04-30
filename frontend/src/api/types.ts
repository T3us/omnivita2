export type UserRole = 'master' | 'player';

export interface SessionUser {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  characterId: string;
  mustResetPassword?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthSession {
  token: string;
  expiresAt: string;
  user: SessionUser;
}

export interface CharacterIdentity {
  name: string;
  age?: string | number;
  className: string;
  level: number;
  concept?: string;
  summary?: string;
  manifestationOrigin?: string;
  links?: string;
  appearance?: string;
  image?: string;
}

export interface CharacterResources {
  pvCurrent: number | null;
  peCurrent: number | null;
  pdCurrent: number | null;
  instability: number;
  armorBonus: number;
  armorEquipment?: string;
  blockMode: 'vigor' | 'forca';
  status: string;
}

export interface CompanionSheet {
  id: string;
  name: string;
  type: string;
  image?: string;
  omnivitaSilhouette?: string;
  isHidden?: boolean;
  pvCurrent: number;
  pvMax: number;
  armor: number;
  status: string;
  notes?: string;
  attributes?: Record<string, number>;
  skills?: Array<Record<string, unknown>>;
  facets?: Array<Record<string, unknown>>;
}

export interface CharacterSheet {
  id: string;
  ownerUserId?: string;
  ownerUsername?: string;
  identity: CharacterIdentity;
  attributes: Record<string, number>;
  resources: CharacterResources;
  progression: Record<string, number | string>;
  skills: Record<string, number>;
  skillAttributes?: Record<string, string>;
  aptitudes: Array<Record<string, unknown>>;
  manifestation?: Record<string, unknown>;
  facets: Array<Record<string, unknown>>;
  companions: CompanionSheet[];
  equipment?: Record<string, unknown>;
  notes?: string;
  masterNotes?: string;
  masterSession?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface Combatant {
  order: number;
  instanceId: string;
  combatantType: 'enemy' | 'character' | 'companion';
  name: string;
  subtitle?: string;
  status: string;
  initiativeTotal: number;
  sourceCharacterId?: string;
  sourceCompanionId?: string;
  ownerName?: string;
  image?: string;
  pvCurrent: number;
  pvMax: number;
  armor: number;
  dodge: number;
  block: number;
  isForm?: boolean;
  isCurrentTurn?: boolean;
}

export interface CombatState {
  active: boolean;
  round: number;
  currentInstanceId: string;
  updatedAt: string;
  combatants: Combatant[];
}

export interface ScenarioState {
  session?: Record<string, unknown>;
  scenarios?: Array<Record<string, unknown>>;
  npcs?: Array<Record<string, unknown>>;
  events?: Array<Record<string, unknown>>;
  clues?: Array<Record<string, unknown>>;
  clocks?: Array<Record<string, unknown>>;
  arcEvents?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

export interface MasterData {
  scenarios?: ScenarioState | null;
  [key: string]: unknown;
}

export interface BootstrapPayload {
  session: {
    expiresAt: string;
    user: SessionUser;
  };
  characters: CharacterSheet[];
  combatState: CombatState;
  masterData: MasterData;
}

export interface OmnivitaCodeEvaluationResponse {
  matched: boolean;
  action?: 'master-control' | 'unlock-form';
  codeId?: string;
  targetCompanionId?: string;
  message?: string;
  character?: CharacterSheet | null;
}

export interface ApiError extends Error {
  status?: number;
  payload?: unknown;
}
