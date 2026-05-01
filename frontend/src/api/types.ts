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

export type TabletopMode = 'build' | 'session';
export type MapLayerKey = 'floor' | 'walls' | 'objects' | 'decoration' | 'details' | 'lighting' | 'mechanics' | 'collision' | 'fog' | 'notes' | 'tokens';
export type MapTool = 'select' | 'brush' | 'wall' | 'erase' | 'object' | 'door' | 'cover' | 'terminal' | 'light' | 'zone' | 'note' | 'fog' | 'token';
export type MapObjectKind = 'prop' | 'decal' | 'shadow' | 'wall' | 'door' | 'cover' | 'terminal' | 'light' | 'zone' | 'note';
export type TabletopTokenKind = 'character' | 'companion' | 'enemy' | 'npc' | 'object';
export type SnapMode = 'grid' | 'fine' | 'free' | 'object';

export interface AssetDefinition {
  id: string;
  name: string;
  category: string;
  tags: string[];
  imageUrl: string;
  thumbnailUrl: string;
  defaultLayer: MapLayerKey;
  defaultWidth: number;
  defaultHeight: number;
  defaultBlocksMovement: boolean;
  defaultBlocksVision: boolean;
  defaultGivesCover: boolean;
  kind?: MapObjectKind | 'floor' | 'wall' | 'fog';
  defaultOpacity?: number;
  defaultInteractable?: boolean;
  color?: string;
  stroke?: string;
  icon?: string;
  thumbnail?: string;
  blocksMovement?: boolean;
  blocksVision?: boolean;
  givesCover?: boolean;
  interactable?: boolean;
}

export type Asset = AssetDefinition;

export interface Tileset {
  id: string;
  name: string;
  assets: Asset[];
}

export interface TileCell {
  x: number;
  y: number;
  assetId: string;
  rotation?: number;
}

export interface TileLayer {
  id: string;
  name: string;
  key: MapLayerKey;
  visible: boolean;
  locked: boolean;
  opacity: number;
  cells: TileCell[];
}

export interface LightSource {
  id: string;
  x: number;
  y: number;
  radius: number;
  intensity: number;
  color: string;
}

export interface MapPrefabObject {
  object: MapObject;
  offsetX: number;
  offsetY: number;
}

export interface MapPrefab {
  id: string;
  name: string;
  objects: MapPrefabObject[];
  createdAt: string;
}

export interface MapObject {
  id: string;
  assetId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  layer: MapLayerKey;
  opacity: number;
  locked: boolean;
  hiddenFromPlayers: boolean;
  parentId?: string;
  blocksMovement: boolean;
  blocksVision: boolean;
  givesCover: boolean;
  interactable: boolean;
  note?: string;
  kind: MapObjectKind;
  name: string;
  groupId?: string;
  scale: number;
  visibleToPlayers: boolean;
  color?: string;
  light?: LightSource;
}

export interface ObjectLayer {
  id: string;
  name: string;
  key: MapLayerKey;
  visible: boolean;
  locked: boolean;
  opacity: number;
  objects: MapObject[];
}

export interface FogLayer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  revealedCells: Array<{ x: number; y: number }>;
}

export interface TabletopToken {
  id: string;
  sourceId: string;
  kind: TabletopTokenKind;
  name: string;
  image?: string;
  x: number;
  y: number;
  hpCurrent?: number;
  hpMax?: number;
  visibleToPlayers: boolean;
  locked: boolean;
}

export interface OmniMap {
  id: string;
  name: string;
  width: number;
  height: number;
  gridSize: number;
  mode: TabletopMode;
  activeLayer: MapLayerKey;
  tilesets: Tileset[];
  tileLayers: Record<'floor' | 'walls' | 'collision', TileLayer>;
  objectLayer: ObjectLayer;
  decorationLayer: ObjectLayer;
  detailLayer: ObjectLayer;
  lightingLayer: ObjectLayer;
  mechanicalLayer: ObjectLayer;
  notesLayer: ObjectLayer;
  fogLayer: FogLayer;
  tokens: TabletopToken[];
  prefabs?: MapPrefab[];
  createdAt?: string;
  updatedAt?: string;
}

export interface MapSummary {
  id: string;
  name: string;
  width: number;
  height: number;
  gridSize: number;
  mode: TabletopMode;
  tokens: number;
  objects: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiError extends Error {
  status?: number;
  payload?: unknown;
}
