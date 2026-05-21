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
export type MapLayerKey = 'floor' | 'walls' | 'doors' | 'objects' | 'decoration' | 'details' | 'lighting' | 'mechanics' | 'collision' | 'fog' | 'notes' | 'tokens';
export type MapTool = 'select' | 'pan' | 'brush' | 'wall' | 'collision' | 'erase' | 'object' | 'door' | 'cover' | 'terminal' | 'light' | 'zone' | 'note' | 'fog' | 'measure' | 'ping' | 'token' | 'template' | 'frame';
export type MapObjectKind = 'prop' | 'decal' | 'shadow' | 'wall' | 'door' | 'cover' | 'terminal' | 'light' | 'zone' | 'note';
export type TabletopTokenKind = 'character' | 'companion' | 'enemy' | 'npc' | 'object';
export type SnapMode = 'grid' | 'fine' | 'free' | 'object';
export type EraseMode = 'activeLayer' | 'topVisible' | 'allUnlocked';
export type DoorState = 'open' | 'closed' | 'locked';
export type FogMode = 'manual' | 'dynamic';
export type SessionViewMode = 'gm' | 'player-preview';
export type AssetTypeCategory = 'floor' | 'wall' | 'door' | 'window' | 'door-window' | 'furniture' | 'prop' | 'detail' | 'light' | 'mechanic' | 'note' | 'fog';
export type AssetTheme = 'cidade-baixo' | 'instituto' | 'laboratorio-canal' | 'zona-profunda' | 'urbano' | 'alienigena' | 'generico' | 'escola' | 'esgoto';
export type TileLayerKey = 'floor' | 'walls' | 'doors' | 'collision';

export interface GridFootprint {
  w: number;
  h: number;
}

export interface SelectedTileCell {
  layer: TileLayerKey;
  x: number;
  y: number;
}

export interface MapBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AssetDefinition {
  id: string;
  name: string;
  category: string;
  typeCategory?: AssetTypeCategory;
  theme?: AssetTheme;
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
  defaultSnapMode?: SnapMode;
  gridFootprint?: GridFootprint;
  orientations?: number[];
  zIndexDefault?: number;
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
  footprint?: GridFootprint;
  doorState?: DoorState;
  blocksMovement?: boolean;
  blocksVision?: boolean;
  blocksSound?: boolean;
  interactable?: boolean;
  secret?: boolean;
  note?: string;
}

export interface TileLayer {
  id: string;
  name: string;
  key: MapLayerKey;
  visible: boolean;
  locked: boolean;
  opacity: number;
  order?: number;
  selectable?: boolean;
  editable?: boolean;
  cells: TileCell[];
}

export interface LightSource {
  id: string;
  x: number;
  y: number;
  radius: number;
  intensity: number;
  color: string;
  visibleToPlayers?: boolean;
  affectsFog?: boolean;
  affectsVision?: boolean;
  attachedToTokenId?: string;
  attachedToObjectId?: string;
  coneAngle?: number;
  coneDirection?: number;
  gmOnly?: boolean;
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
  snapMode?: SnapMode;
  opacity: number;
  locked: boolean;
  hiddenFromPlayers: boolean;
  parentId?: string;
  blocksMovement: boolean;
  blocksVision: boolean;
  blocksSound?: boolean;
  givesCover: boolean;
  coverLevel?: 'low' | 'high';
  interactable: boolean;
  note?: string;
  difficulty?: string;
  kind: MapObjectKind;
  name: string;
  groupId?: string;
  attachedToMapInstanceId?: string;
  scale: number;
  visibleToPlayers: boolean;
  color?: string;
  light?: LightSource;
  tokenState?: string;
  zoneEffect?: string;
}

export interface ObjectLayer {
  id: string;
  name: string;
  key: MapLayerKey;
  visible: boolean;
  locked: boolean;
  opacity: number;
  order?: number;
  selectable?: boolean;
  editable?: boolean;
  objects: MapObject[];
}

export interface FogLayer {
  id: string;
  name: string;
  visible: boolean;
  locked?: boolean;
  opacity: number;
  order?: number;
  selectable?: boolean;
  editable?: boolean;
  revealedCells: Array<{ x: number; y: number }>;
}

export interface TabletopToken {
  id: string;
  sourceId: string;
  characterId?: string;
  combatantId?: string;
  kind: TabletopTokenKind;
  name: string;
  image?: string;
  x: number;
  y: number;
  controlledBy?: string;
  hpCurrent?: number;
  hpMax?: number;
  peCurrent?: number;
  peMax?: number;
  pdCurrent?: number;
  pdMax?: number;
  visibleToPlayers: boolean;
  locked: boolean;
  status?: string;
  statusMarkers?: string[];
  size?: number;
  visionEnabled?: boolean;
  visionRadius?: number;
  dimVisionRadius?: number;
  brightVisionRadius?: number;
  lightRadius?: number;
  auraColor?: string;
  instability?: number;
  hidden?: boolean;
  attachedToMapInstanceId?: string;
}

export type SavedMap = OmniMap;
export type TemplateShape = 'circle' | 'cone' | 'line' | 'rect' | 'aura' | 'zone';
export type LightingRegionShape = 'rect' | 'circle' | 'polygon';
export type LightingDarknessMode = 'add' | 'subtract' | 'override';

export interface SessionMapInstance {
  id: string;
  sourceMapId: string;
  sourceMapName?: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  gridSize: number;
  rotation: number;
  locked: boolean;
  visibleToPlayers: boolean;
  opacity?: number;
  zIndex?: number;
  attachedObjectIds?: string[];
  data?: OmniMap;
}

export interface SessionToken extends TabletopToken {
  sessionId?: string;
}

export interface SessionDoorState {
  id: string;
  x: number;
  y: number;
  state: DoorState;
  locked?: boolean;
  secret?: boolean;
  blocksMovement: boolean;
  blocksVision: boolean;
  blocksSound?: boolean;
  updatedAt?: string;
}

export interface SessionFogState {
  enabled: boolean;
  mode: FogMode;
  unexploredOpacity: number;
  exploredOpacity: number;
  visibleOpacity: number;
  exploredCells: Array<{ x: number; y: number }>;
  manualHiddenCells: Array<{ x: number; y: number }>;
  manualRevealedCells: Array<{ x: number; y: number }>;
}

export interface FogState extends SessionFogState {}

export interface LightingRegion {
  id: string;
  name: string;
  type?: 'light' | 'darkness' | 'fog' | 'difficultTerrain' | 'hazard' | 'cover' | 'trigger' | 'note';
  shape: LightingRegionShape;
  points: Array<{ x: number; y: number }>;
  darknessMode: LightingDarknessMode;
  darkness: number;
  color: string;
  intensity: number;
  blocksGlobalIllumination: boolean;
  visibleToPlayers: boolean;
  visibleToGM: boolean;
  affectsVision?: boolean;
  affectsFog?: boolean;
  attachedToMapInstanceId?: string;
  note?: string;
}

export interface SessionLightingState {
  globalIllumination: boolean;
  darkness: number;
  ambientColor: string;
  ambientIntensity: number;
  playerVisible: boolean;
  regions: LightingRegion[];
}

export interface SessionCameraState {
  x: number;
  y: number;
  zoom: number;
  playerPreview?: {
    x: number;
    y: number;
    zoom: number;
  };
}

export interface AreaTemplate {
  id: string;
  name: string;
  shape: TemplateShape;
  x: number;
  y: number;
  width: number;
  height: number;
  radius?: number;
  angle?: number;
  color: string;
  opacity: number;
  visibleToPlayers: boolean;
  attachedToMapInstanceId?: string;
  createdAt?: string;
}

export interface AssetPack {
  id: string;
  name: string;
  theme: string;
  description: string;
  assets: AssetDefinition[];
  prefabs: PrefabDefinition[];
}

export interface PrefabDefinition {
  id: string;
  name: string;
  theme: string;
  category: string;
  objects: MapPrefabObject[];
  tags: string[];
}

export interface SessionBoard {
  id: string;
  name: string;
  sourceMapId: string;
  sourceMapName?: string;
  activeMap?: OmniMap;
  mapInstances: SessionMapInstance[];
  maps?: SessionMapInstance[];
  activeMapInstanceId?: string;
  tokens: SessionToken[];
  doorStates: SessionDoorState[];
  fog: SessionFogState;
  lighting: SessionLightingState;
  camera: SessionCameraState;
  templates: AreaTemplate[];
  combatStateId?: string;
  playerPreviewEnabled: boolean;
  metersPerCell: number;
  globalDarkness?: number;
  ambientLight?: number;
  fogEnabled?: boolean;
  dynamicVisionEnabled?: boolean;
  viewMode: SessionViewMode;
  createdAt?: string;
  updatedAt?: string;
}

export interface SessionBoardSummary {
  id: string;
  name: string;
  sourceMapId: string;
  sourceMapName?: string;
  activeMapInstanceId?: string;
  tokens: number;
  exploredCells: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface OmniMap {
  id: string;
  name: string;
  description?: string;
  theme?: string;
  tags?: string[];
  thumbnail?: string;
  width: number;
  height: number;
  gridSize: number;
  bounds?: MapBounds;
  mode: TabletopMode;
  activeLayer: MapLayerKey;
  tilesets: Tileset[];
  tileLayers: Record<TileLayerKey, TileLayer>;
  objectLayer: ObjectLayer;
  decorationLayer: ObjectLayer;
  detailLayer: ObjectLayer;
  lightingLayer: ObjectLayer;
  mechanicalLayer: ObjectLayer;
  notesLayer: ObjectLayer;
  fogLayer: FogLayer;
  tokens: TabletopToken[];
  prefabs?: MapPrefab[];
  metersPerCell?: number;
  lightingRegions?: LightingRegion[];
  sessionLighting?: SessionLightingState;
  areaTemplates?: AreaTemplate[];
  assetPacks?: AssetPack[];
  sessionMapInstances?: SessionMapInstance[];
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

export interface BackupSummary {
  schema: string;
  version: number;
  exportedAt: string;
  users: number;
  characters: number;
  combatState: number;
  masterData: number;
  maps: number;
  sessionBoards: number;
  customAssets: number;
  tabletopSettings: number;
}

export interface BackupImportResult {
  dryRun: boolean;
  message: string;
  summary: BackupSummary;
}
