import { DEFAULT_TILESETS, getAsset, normalizeAsset } from './assets';
import type {
  AreaTemplate,
  AssetPack,
  FogLayer,
  LightingRegion,
  MapBounds,
  MapLayerKey,
  MapObject,
  MapPrefab,
  ObjectLayer,
  OmniMap,
  SessionLightingState,
  SessionMapInstance,
  TabletopMode,
  TabletopToken,
  TileCell,
  TileLayer,
  TileLayerKey
} from './types';

const DEFAULT_WIDTH = 28;
const DEFAULT_HEIGHT = 18;
const DEFAULT_GRID = 32;
const LAYER_ORDER: Partial<Record<MapLayerKey, number>> = {
  floor: 10,
  collision: 15,
  walls: 20,
  doors: 25,
  decoration: 30,
  objects: 40,
  details: 50,
  lighting: 60,
  mechanics: 70,
  fog: 90,
  notes: 100,
  tokens: 110
};

export function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function createTileLayer(key: TileLayerKey, name: string): TileLayer {
  return {
    id: key,
    key,
    name,
    visible: true,
    locked: false,
    opacity: key === 'collision' ? 0.32 : 1,
    order: LAYER_ORDER[key] || 0,
    selectable: true,
    editable: true,
    cells: []
  };
}

function createObjectLayer(key: ObjectLayer['key'], name: string): ObjectLayer {
  return {
    id: key,
    key,
    name,
    visible: true,
    locked: false,
    opacity: 1,
    order: LAYER_ORDER[key] || 0,
    selectable: true,
    editable: true,
    objects: []
  };
}

function createFogLayer(): FogLayer {
  return {
    id: 'fog',
    name: 'Fog',
    visible: true,
    locked: false,
    opacity: 0.72,
    order: LAYER_ORDER.fog,
    selectable: false,
    editable: true,
    revealedCells: []
  };
}

function createDefaultSessionLighting(): SessionLightingState {
  return {
    globalIllumination: true,
    darkness: 0,
    ambientColor: '#d8e6ff',
    ambientIntensity: 1,
    playerVisible: false,
    regions: []
  };
}

export function createBlankMap(name = 'Novo mapa', width = DEFAULT_WIDTH, height = DEFAULT_HEIGHT, gridSize = DEFAULT_GRID): OmniMap {
  const normalizedWidth = clampInteger(width, 8, 120);
  const normalizedHeight = clampInteger(height, 8, 120);
  const normalizedGridSize = clampInteger(gridSize, 24, 96);
  return {
    id: createId('map'),
    name,
    description: '',
    theme: '',
    tags: [],
    thumbnail: '',
    width: normalizedWidth,
    height: normalizedHeight,
    gridSize: normalizedGridSize,
    mode: 'build',
    activeLayer: 'floor',
    tilesets: DEFAULT_TILESETS,
    tileLayers: {
      floor: createTileLayer('floor', 'Piso'),
      walls: createTileLayer('walls', 'Paredes'),
      doors: createTileLayer('doors', 'Portas'),
      collision: createTileLayer('collision', 'Colisao')
    },
    objectLayer: createObjectLayer('objects', 'Objetos'),
    decorationLayer: createObjectLayer('decoration', 'Decoracao'),
    detailLayer: createObjectLayer('details', 'Detalhes'),
    lightingLayer: createObjectLayer('lighting', 'Luzes'),
    mechanicalLayer: createObjectLayer('mechanics', 'Mecanica'),
    notesLayer: createObjectLayer('notes', 'Notas'),
    fogLayer: createFogLayer(),
    tokens: [],
    prefabs: [],
    metersPerCell: 1.5,
    lightingRegions: [],
    sessionLighting: createDefaultSessionLighting(),
    areaTemplates: [],
    assetPacks: [],
    sessionMapInstances: []
  };
}

export function normalizeMap(input: Partial<OmniMap> | null | undefined): OmniMap {
  const base = createBlankMap(input?.name || 'Novo mapa', input?.width, input?.height, input?.gridSize);
  const next: OmniMap = {
    ...base,
    ...input,
    id: String(input?.id || base.id),
    name: String(input?.name || base.name),
    description: input?.description ? String(input.description) : '',
    theme: input?.theme ? String(input.theme) : '',
    tags: Array.isArray(input?.tags) ? input.tags.map(String) : [],
    thumbnail: input?.thumbnail ? String(input.thumbnail) : '',
    width: clampInteger(input?.width, 8, 120),
    height: clampInteger(input?.height, 8, 120),
    gridSize: clampInteger(input?.gridSize, 24, 96),
    bounds: input?.bounds ? normalizeMapBounds(input.bounds, input?.width, input?.height) : undefined,
    mode: normalizeMode(input?.mode),
    activeLayer: normalizeLayer(input?.activeLayer),
    tilesets: normalizeTilesets(input?.tilesets),
    tileLayers: {
      floor: normalizeTileLayer(input?.tileLayers?.floor, base.tileLayers.floor),
      walls: normalizeTileLayer(input?.tileLayers?.walls, base.tileLayers.walls),
      doors: normalizeTileLayer(input?.tileLayers?.doors, base.tileLayers.doors),
      collision: normalizeTileLayer(input?.tileLayers?.collision, base.tileLayers.collision)
    },
    objectLayer: normalizeObjectLayer(input?.objectLayer, base.objectLayer),
    decorationLayer: normalizeObjectLayer(input?.decorationLayer, base.decorationLayer),
    detailLayer: normalizeObjectLayer(input?.detailLayer, base.detailLayer),
    lightingLayer: normalizeObjectLayer(input?.lightingLayer, base.lightingLayer),
    mechanicalLayer: normalizeObjectLayer(input?.mechanicalLayer, base.mechanicalLayer),
    notesLayer: normalizeObjectLayer(input?.notesLayer, base.notesLayer),
    fogLayer: normalizeFogLayer(input?.fogLayer, base.fogLayer),
    tokens: Array.isArray(input?.tokens) ? input.tokens.map(normalizeToken).filter(Boolean) as TabletopToken[] : [],
    prefabs: Array.isArray(input?.prefabs) ? input.prefabs.map(normalizePrefab).filter(Boolean) as MapPrefab[] : [],
    metersPerCell: clampNumber(input?.metersPerCell, 0.5, 10, 1.5),
    lightingRegions: Array.isArray(input?.lightingRegions) ? input.lightingRegions.map(normalizeLightingRegion).filter(Boolean) as LightingRegion[] : [],
    sessionLighting: normalizeSessionLighting(input?.sessionLighting),
    areaTemplates: Array.isArray(input?.areaTemplates) ? input.areaTemplates.map(normalizeAreaTemplate).filter(Boolean) as AreaTemplate[] : [],
    assetPacks: Array.isArray(input?.assetPacks) ? input.assetPacks as AssetPack[] : [],
    sessionMapInstances: Array.isArray(input?.sessionMapInstances) ? input.sessionMapInstances.map(normalizeSessionMapInstance).filter(Boolean) as SessionMapInstance[] : []
  };

  return next;
}

export function cloneMap(map: OmniMap): OmniMap {
  return normalizeMap(JSON.parse(JSON.stringify(map)) as OmniMap);
}

export function setTileCell(cells: TileCell[], x: number, y: number, assetId: string, rotation = 0, footprint?: TileCell['footprint'], meta: Partial<TileCell> = {}) {
  const key = `${x}:${y}`;
  const next = cells.filter((cell) => `${cell.x}:${cell.y}` !== key);
  if (assetId) next.push({ ...meta, x, y, assetId, rotation: normalizeRotation(rotation), footprint });
  return next;
}

export function removeTileCell(cells: TileCell[], x: number, y: number) {
  const key = `${x}:${y}`;
  return cells.filter((cell) => `${cell.x}:${cell.y}` !== key);
}

export function getTileCell(cells: TileCell[], x: number, y: number) {
  const key = `${x}:${y}`;
  return cells.find((cell) => `${cell.x}:${cell.y}` === key) || null;
}

export function buildMapObject(assetId: string, x: number, y: number, layer?: MapLayerKey, zIndex = 0, tilesets?: OmniMap['tilesets']): MapObject {
  const asset = getAsset(assetId, tilesets);
  const kind = asset?.kind === 'floor' || asset?.kind === 'wall' || asset?.kind === 'fog'
    ? 'prop'
    : asset?.kind || 'prop';
  const isLight = kind === 'light';
  const objectLayer = layer || asset?.defaultLayer || getDefaultObjectLayer(kind);
  return {
    id: createId('obj'),
    kind,
    name: asset?.name || 'Objeto',
    assetId,
    layer: objectLayer,
    x,
    y,
    width: asset?.defaultWidth || (isLight ? 96 : 64),
    height: asset?.defaultHeight || (isLight ? 96 : 64),
    rotation: 0,
    scale: 1,
    zIndex: zIndex || asset?.zIndexDefault || 0,
    snapMode: asset?.defaultSnapMode || 'free',
    opacity: asset?.defaultOpacity ?? 1,
    visibleToPlayers: kind !== 'note',
    hiddenFromPlayers: kind === 'note',
    locked: false,
    blocksMovement: Boolean(asset?.defaultBlocksMovement ?? asset?.blocksMovement),
    blocksVision: Boolean(asset?.defaultBlocksVision ?? asset?.blocksVision),
    blocksSound: false,
    givesCover: Boolean(asset?.defaultGivesCover ?? asset?.givesCover),
    coverLevel: asset?.defaultGivesCover || asset?.givesCover ? 'low' : undefined,
    interactable: Boolean((asset?.defaultInteractable ?? asset?.interactable) || kind === 'door' || kind === 'terminal'),
    difficulty: '',
    tokenState: '',
    zoneEffect: kind === 'zone' ? 'Zona especial' : '',
    color: asset?.color,
    note: '',
    light: isLight
      ? { id: createId('light'), x, y, radius: Math.max(asset?.defaultWidth || 96, asset?.defaultHeight || 96) * 1.3, intensity: 0.55, color: asset?.color || '#8b5cf6' }
      : undefined
  };
}

export function getDefaultObjectLayer(kind: MapObject['kind']): MapLayerKey {
  if (kind === 'decal' || kind === 'shadow') return 'details';
  if (kind === 'light') return 'lighting';
  if (kind === 'note') return 'notes';
  if (kind === 'zone') return 'mechanics';
  return 'objects';
}

export function getObjectLayer(map: OmniMap, layer: MapLayerKey): ObjectLayer | null {
  if (layer === 'objects') return map.objectLayer;
  if (layer === 'decoration') return map.decorationLayer;
  if (layer === 'details') return map.detailLayer;
  if (layer === 'lighting') return map.lightingLayer;
  if (layer === 'mechanics') return map.mechanicalLayer;
  if (layer === 'notes') return map.notesLayer;
  return null;
}

export function getAllMapObjects(map: OmniMap) {
  return [map.decorationLayer, map.objectLayer, map.detailLayer, map.lightingLayer, map.mechanicalLayer, map.notesLayer]
    .flatMap((layer) => layer.objects)
    .sort((left, right) => left.zIndex - right.zIndex);
}

function normalizeTileLayer(layer: Partial<TileLayer> | undefined, fallback: TileLayer): TileLayer {
  return {
    ...fallback,
    ...layer,
    id: String(layer?.id || fallback.id),
    key: fallback.key,
    name: String(layer?.name || fallback.name),
    visible: layer?.visible !== false,
    locked: Boolean(layer?.locked),
    opacity: clampNumber(layer?.opacity, 0, 1, fallback.opacity),
    order: Number(layer?.order ?? fallback.order ?? 0),
    selectable: layer?.selectable ?? fallback.selectable ?? false,
    editable: layer?.editable ?? fallback.editable ?? true,
    cells: Array.isArray(layer?.cells) ? layer.cells.map(normalizeTileCell).filter(Boolean) as TileCell[] : []
  };
}

function normalizeObjectLayer(layer: Partial<ObjectLayer> | undefined, fallback: ObjectLayer): ObjectLayer {
  return {
    ...fallback,
    ...layer,
    id: String(layer?.id || fallback.id),
    key: fallback.key,
    name: String(layer?.name || fallback.name),
    visible: layer?.visible !== false,
    locked: Boolean(layer?.locked),
    opacity: clampNumber(layer?.opacity, 0, 1, fallback.opacity),
    order: Number(layer?.order ?? fallback.order ?? 0),
    selectable: layer?.selectable ?? fallback.selectable ?? true,
    editable: layer?.editable ?? fallback.editable ?? true,
    objects: Array.isArray(layer?.objects) ? layer.objects.map(normalizeObject).filter(Boolean) as MapObject[] : []
  };
}

function normalizeTilesets(tilesets: OmniMap['tilesets'] | undefined): OmniMap['tilesets'] {
  const byId = new Map(DEFAULT_TILESETS.map((tileset) => [tileset.id, {
    ...tileset,
    assets: tileset.assets.map((asset) => ({ ...asset }))
  }]));
  if (Array.isArray(tilesets)) {
    tilesets.forEach((tileset) => {
      const normalizedAssets = Array.isArray(tileset.assets)
        ? tileset.assets.map((entry) => {
          const normalized = normalizeAsset(entry);
          const defaultVersion = getAsset(entry.id, DEFAULT_TILESETS);
          return normalized?.imageUrl ? normalized : defaultVersion || normalized;
        }).filter(Boolean) as OmniMap['tilesets'][number]['assets']
        : [];
      normalizedAssets.forEach((asset) => {
        const id = String(tileset.id || normalizeTilesetId(asset.category));
        const existing = byId.get(id) || { id, name: String(tileset.name || asset.category || 'Tileset'), assets: [] };
        existing.assets = [asset, ...existing.assets.filter((entry) => entry.id !== asset.id)];
        byId.set(id, existing);
      });
    });
  }
  return Array.from(byId.values()).filter((tileset) => tileset.assets.length);
}

function normalizeFogLayer(layer: Partial<FogLayer> | undefined, fallback: FogLayer): FogLayer {
  return {
    ...fallback,
    ...layer,
    id: 'fog',
    name: String(layer?.name || fallback.name),
    visible: layer?.visible !== false,
    locked: Boolean(layer?.locked),
    opacity: clampNumber(layer?.opacity, 0, 1, fallback.opacity),
    order: Number(layer?.order ?? fallback.order ?? 0),
    selectable: layer?.selectable ?? fallback.selectable ?? false,
    editable: layer?.editable ?? fallback.editable ?? true,
    revealedCells: Array.isArray(layer?.revealedCells)
      ? layer.revealedCells.map((cell) => ({ x: clampInteger(cell.x, -9999, 9999), y: clampInteger(cell.y, -9999, 9999) }))
      : []
  };
}

function normalizeTileCell(cell: Partial<TileCell>) {
  if (!cell || !cell.assetId) return null;
  return {
    x: clampInteger(cell.x, -9999, 9999),
    y: clampInteger(cell.y, -9999, 9999),
    assetId: String(cell.assetId),
    rotation: normalizeRotation(Number(cell.rotation || 0)),
    footprint: cell.footprint ? { w: clampInteger(cell.footprint.w, 1, 10), h: clampInteger(cell.footprint.h, 1, 10) } : undefined,
    doorState: cell.doorState === 'open' || cell.doorState === 'locked' ? cell.doorState : cell.doorState === 'closed' ? 'closed' : undefined,
    blocksMovement: cell.blocksMovement === undefined ? undefined : Boolean(cell.blocksMovement),
    blocksVision: cell.blocksVision === undefined ? undefined : Boolean(cell.blocksVision),
    blocksSound: cell.blocksSound === undefined ? undefined : Boolean(cell.blocksSound),
    interactable: cell.interactable === undefined ? undefined : Boolean(cell.interactable),
    secret: cell.secret === undefined ? undefined : Boolean(cell.secret),
    note: cell.note ? String(cell.note) : undefined
  };
}

function normalizeObject(object: Partial<MapObject>) {
  if (!object?.id) return null;
  const asset = getAsset(object.assetId);
  const kind = String(object.kind || (asset?.kind === 'floor' || asset?.kind === 'wall' || asset?.kind === 'fog' ? 'prop' : asset?.kind) || 'prop') as MapObject['kind'];
  const layer = normalizeLayer(object.layer || asset?.defaultLayer || getDefaultObjectLayer(kind));
  const width = clampNumber(object.width, 4, 4000, 64);
  const hasModernFields = object.scale !== undefined || object.zIndex !== undefined || object.opacity !== undefined || object.layer !== undefined;
  const legacyLooksLikeGrid = !hasModernFields && Number(object.width || 0) <= 40 && Number(object.height || 0) <= 40 && Number(object.x || 0) < 200 && Number(object.y || 0) < 200;
  const hiddenFromPlayers = Boolean(object.hiddenFromPlayers || object.visibleToPlayers === false || kind === 'note');
  return {
    id: String(object.id),
    kind,
    name: String(object.name || asset?.name || 'Objeto'),
    assetId: String(object.assetId || asset?.id || 'crate-urban'),
    layer,
    snapMode: object.snapMode || asset?.defaultSnapMode || 'free',
    parentId: object.parentId ? String(object.parentId) : undefined,
    groupId: object.groupId ? String(object.groupId) : undefined,
    x: legacyLooksLikeGrid ? Number(object.x || 0) * DEFAULT_GRID : Number(object.x || 0),
    y: legacyLooksLikeGrid ? Number(object.y || 0) * DEFAULT_GRID : Number(object.y || 0),
    width: legacyLooksLikeGrid ? width * DEFAULT_GRID : width,
    height: legacyLooksLikeGrid ? clampNumber(object.height, 4, 4000, 64) * DEFAULT_GRID : clampNumber(object.height, 4, 4000, 64),
    rotation: normalizeRotation(Number(object.rotation || 0)),
    scale: clampNumber(object.scale, 0.1, 8, 1),
    zIndex: Number(object.zIndex || 0),
    opacity: clampNumber(object.opacity, 0, 1, 1),
    visibleToPlayers: !hiddenFromPlayers,
    hiddenFromPlayers,
    locked: Boolean(object.locked),
    blocksMovement: Boolean(object.blocksMovement),
    blocksVision: Boolean(object.blocksVision),
    blocksSound: Boolean(object.blocksSound),
    givesCover: Boolean(object.givesCover),
    coverLevel: object.coverLevel === 'high' ? 'high' : object.coverLevel === 'low' ? 'low' : undefined,
    interactable: Boolean(object.interactable),
    color: object.color ? String(object.color) : undefined,
    note: object.note ? String(object.note) : '',
    difficulty: object.difficulty ? String(object.difficulty) : undefined,
    tokenState: object.tokenState ? String(object.tokenState) : undefined,
    zoneEffect: object.zoneEffect ? String(object.zoneEffect) : undefined,
    light: object.light
  };
}

function normalizePrefab(prefab: Partial<MapPrefab>) {
  if (!prefab?.id) return null;
  return {
    id: String(prefab.id),
    name: String(prefab.name || 'Prefab'),
    createdAt: String(prefab.createdAt || new Date().toISOString()),
    objects: Array.isArray(prefab.objects)
      ? prefab.objects.map((entry) => {
        const normalized = normalizeObject(entry.object || {});
        if (!normalized) return null;
        return {
          object: normalized,
          offsetX: Number(entry.offsetX || 0),
          offsetY: Number(entry.offsetY || 0)
        };
      }).filter(Boolean) as MapPrefab['objects']
      : []
  };
}

function normalizeToken(token: Partial<TabletopToken>) {
  if (!token?.id) return null;
  return {
    id: String(token.id),
    sourceId: String(token.sourceId || token.id),
    definitionId: token.definitionId ? String(token.definitionId) : undefined,
    characterId: token.characterId ? String(token.characterId) : undefined,
    combatantId: token.combatantId ? String(token.combatantId) : undefined,
    ownerUserId: token.ownerUserId ? String(token.ownerUserId) : undefined,
    ownerCharacterId: token.ownerCharacterId ? String(token.ownerCharacterId) : undefined,
    controlledByUserIds: Array.isArray(token.controlledByUserIds) ? token.controlledByUserIds.map(String).filter(Boolean) : [],
    formOwnerCharacterId: token.formOwnerCharacterId ? String(token.formOwnerCharacterId) : undefined,
    sourceSheetId: token.sourceSheetId ? String(token.sourceSheetId) : undefined,
    sourceFormId: token.sourceFormId ? String(token.sourceFormId) : undefined,
    isPlayerToken: Boolean(token.isPlayerToken),
    isFormToken: Boolean(token.isFormToken),
    isSummonToken: Boolean(token.isSummonToken),
    blocksMovement: Boolean(token.blocksMovement),
    kind: token.kind || 'npc',
    name: String(token.name || 'Token'),
    nameOverride: token.nameOverride ? String(token.nameOverride) : undefined,
    image: token.image ? String(token.image) : undefined,
    color: token.color ? String(token.color) : undefined,
    x: Number(token.x || 0),
    y: Number(token.y || 0),
    controlledBy: token.controlledBy ? String(token.controlledBy) : undefined,
    hpCurrent: token.hpCurrent === undefined ? undefined : Number(token.hpCurrent || 0),
    hpMax: token.hpMax === undefined ? undefined : Number(token.hpMax || 0),
    peCurrent: token.peCurrent === undefined ? undefined : Number(token.peCurrent || 0),
    peMax: token.peMax === undefined ? undefined : Number(token.peMax || 0),
    pdCurrent: token.pdCurrent === undefined ? undefined : Number(token.pdCurrent || 0),
    pdMax: token.pdMax === undefined ? undefined : Number(token.pdMax || 0),
    status: token.status ? String(token.status) : undefined,
    statusMarkers: Array.isArray(token.statusMarkers) ? token.statusMarkers.map(String) : [],
    size: token.size === undefined ? undefined : Number(token.size || 1),
    visionEnabled: token.visionEnabled !== false,
    visionRadius: token.visionRadius === undefined ? 6 : Number(token.visionRadius || 0),
    dimVisionRadius: token.dimVisionRadius === undefined ? 8 : Number(token.dimVisionRadius || 0),
    brightVisionRadius: token.brightVisionRadius === undefined ? 4 : Number(token.brightVisionRadius || 0),
    lightRadius: token.lightRadius === undefined ? 0 : Number(token.lightRadius || 0),
    auraColor: token.auraColor ? String(token.auraColor) : undefined,
    instability: token.instability === undefined ? undefined : Number(token.instability || 0),
    hidden: Boolean(token.hidden),
    visibleToPlayers: token.visibleToPlayers !== false,
    locked: Boolean(token.locked)
  };
}

function normalizeSessionLighting(lighting: Partial<SessionLightingState> | undefined): SessionLightingState {
  const fallback = createDefaultSessionLighting();
  return {
    globalIllumination: Boolean(lighting?.globalIllumination),
    darkness: clampNumber(lighting?.darkness, 0, 1, fallback.darkness),
    ambientColor: String(lighting?.ambientColor || fallback.ambientColor),
    ambientIntensity: clampNumber(lighting?.ambientIntensity, 0, 2, fallback.ambientIntensity),
    playerVisible: Boolean(lighting?.playerVisible),
    regions: Array.isArray(lighting?.regions) ? lighting.regions.map(normalizeLightingRegion).filter(Boolean) as LightingRegion[] : []
  };
}

function normalizeLightingRegion(region: Partial<LightingRegion>) {
  if (!region?.id) return null;
  return {
    id: String(region.id),
    name: String(region.name || 'Regiao de luz'),
    shape: region.shape === 'circle' || region.shape === 'polygon' ? region.shape : 'rect',
    points: Array.isArray(region.points)
      ? region.points.map((point) => ({ x: Number(point.x || 0), y: Number(point.y || 0) }))
      : [],
    darknessMode: region.darknessMode === 'subtract' || region.darknessMode === 'override' ? region.darknessMode : 'add',
    darkness: clampNumber(region.darkness, 0, 1, 0.4),
    color: String(region.color || '#111827'),
    intensity: clampNumber(region.intensity, 0, 2, 0.8),
    blocksGlobalIllumination: Boolean(region.blocksGlobalIllumination),
    visibleToPlayers: region.visibleToPlayers !== false,
    visibleToGM: region.visibleToGM !== false,
    affectsVision: region.affectsVision !== false,
    affectsFog: region.affectsFog !== false,
    type: region.type,
    note: region.note ? String(region.note) : undefined
  };
}

function normalizeMapBounds(bounds: Partial<MapBounds> | undefined, width?: number, height?: number): MapBounds {
  const fallbackWidth = clampInteger(width, 8, 120);
  const fallbackHeight = clampInteger(height, 8, 120);
  const nextWidth = Number(bounds?.width);
  const nextHeight = Number(bounds?.height);
  return {
    x: Math.round(Number(bounds?.x ?? 0)),
    y: Math.round(Number(bounds?.y ?? 0)),
    width: Number.isFinite(nextWidth) ? Math.max(1, Math.min(240, Math.round(nextWidth))) : fallbackWidth,
    height: Number.isFinite(nextHeight) ? Math.max(1, Math.min(240, Math.round(nextHeight))) : fallbackHeight
  };
}

function normalizeAreaTemplate(template: Partial<AreaTemplate>) {
  if (!template?.id) return null;
  const shape = ['circle', 'cone', 'line', 'rect', 'aura', 'zone'].includes(String(template.shape))
    ? template.shape as AreaTemplate['shape']
    : 'circle';
  return {
    id: String(template.id),
    name: String(template.name || 'Template'),
    shape,
    x: Number(template.x || 0),
    y: Number(template.y || 0),
    width: clampNumber(template.width, 1, 4000, 96),
    height: clampNumber(template.height, 1, 4000, 96),
    radius: template.radius === undefined ? undefined : clampNumber(template.radius, 1, 4000, 96),
    angle: template.angle === undefined ? undefined : Number(template.angle || 0),
    color: String(template.color || '#8b5cf6'),
    opacity: clampNumber(template.opacity, 0, 1, 0.28),
    visibleToPlayers: template.visibleToPlayers !== false,
    createdAt: template.createdAt ? String(template.createdAt) : undefined
  };
}

function normalizeSessionMapInstance(instance: Partial<SessionMapInstance>) {
  if (!instance?.id) return null;
  const data = instance.data ? normalizeMap(instance.data) : undefined;
  return {
    id: String(instance.id),
    sourceMapId: String(instance.sourceMapId || data?.id || instance.id),
    sourceMapName: instance.sourceMapName ? String(instance.sourceMapName) : data?.name,
    name: String(instance.name || data?.name || 'Mapa sem nome'),
    x: Number(instance.x || 0),
    y: Number(instance.y || 0),
    width: Number(instance.width || data?.width || 1),
    height: Number(instance.height || data?.height || 1),
    gridSize: Number(instance.gridSize || data?.gridSize || 32),
    rotation: normalizeRotation(Number(instance.rotation || 0)),
    locked: Boolean(instance.locked),
    visibleToPlayers: instance.visibleToPlayers !== false,
    opacity: clampNumber(instance.opacity, 0, 1, 1),
    zIndex: Number(instance.zIndex || 0),
    attachedObjectIds: Array.isArray(instance.attachedObjectIds) ? instance.attachedObjectIds.map(String) : [],
    data
  };
}

function normalizeMode(value: unknown): TabletopMode {
  return value === 'session' ? 'session' : 'build';
}

function normalizeLayer(value: unknown): MapLayerKey {
  const valid: MapLayerKey[] = ['floor', 'walls', 'doors', 'objects', 'decoration', 'details', 'lighting', 'mechanics', 'collision', 'fog', 'notes', 'tokens'];
  return valid.includes(value as MapLayerKey) ? value as MapLayerKey : 'floor';
}

function normalizeTilesetId(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'custom-assets';
}

function clampInteger(value: unknown, min: number, max: number) {
  const number = Math.round(Number(value || 0));
  if (!Number.isFinite(number)) return min;
  return Math.max(min, Math.min(max, number));
}

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}

function normalizeRotation(value: number) {
  const snapped = Math.round(value / 45) * 45;
  const normalized = snapped % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}
