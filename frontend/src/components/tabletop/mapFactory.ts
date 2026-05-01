import { DEFAULT_TILESETS, getAsset, normalizeAsset } from './assets';
import type {
  FogLayer,
  MapLayerKey,
  MapObject,
  MapPrefab,
  ObjectLayer,
  OmniMap,
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

export function createBlankMap(name = 'Novo mapa', width = DEFAULT_WIDTH, height = DEFAULT_HEIGHT, gridSize = DEFAULT_GRID): OmniMap {
  return {
    id: createId('map'),
    name,
    width: clampInteger(width, 8, 120),
    height: clampInteger(height, 8, 120),
    gridSize: clampInteger(gridSize, 24, 96),
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
    prefabs: []
  };
}

export function normalizeMap(input: Partial<OmniMap> | null | undefined): OmniMap {
  const base = createBlankMap(input?.name || 'Novo mapa', input?.width, input?.height, input?.gridSize);
  const next: OmniMap = {
    ...base,
    ...input,
    id: String(input?.id || base.id),
    name: String(input?.name || base.name),
    width: clampInteger(input?.width, 8, 120),
    height: clampInteger(input?.height, 8, 120),
    gridSize: clampInteger(input?.gridSize, 24, 96),
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
    prefabs: Array.isArray(input?.prefabs) ? input.prefabs.map(normalizePrefab).filter(Boolean) as MapPrefab[] : []
  };

  return next;
}

export function cloneMap(map: OmniMap): OmniMap {
  return normalizeMap(JSON.parse(JSON.stringify(map)) as OmniMap);
}

export function setTileCell(cells: TileCell[], x: number, y: number, assetId: string, rotation = 0, footprint?: TileCell['footprint']) {
  const key = `${x}:${y}`;
  const next = cells.filter((cell) => `${cell.x}:${cell.y}` !== key);
  if (assetId) next.push({ x, y, assetId, rotation: normalizeRotation(rotation), footprint });
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
    zIndex,
    snapMode: asset?.defaultSnapMode || 'free',
    opacity: asset?.defaultOpacity ?? 1,
    visibleToPlayers: kind !== 'note',
    hiddenFromPlayers: kind === 'note',
    locked: false,
    blocksMovement: Boolean(asset?.defaultBlocksMovement ?? asset?.blocksMovement),
    blocksVision: Boolean(asset?.defaultBlocksVision ?? asset?.blocksVision),
    givesCover: Boolean(asset?.defaultGivesCover ?? asset?.givesCover),
    interactable: Boolean((asset?.defaultInteractable ?? asset?.interactable) || kind === 'door' || kind === 'terminal'),
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
      ? layer.revealedCells.map((cell) => ({ x: clampInteger(cell.x, 0, 999), y: clampInteger(cell.y, 0, 999) }))
      : []
  };
}

function normalizeTileCell(cell: Partial<TileCell>) {
  if (!cell || !cell.assetId) return null;
  return {
    x: clampInteger(cell.x, 0, 999),
    y: clampInteger(cell.y, 0, 999),
    assetId: String(cell.assetId),
    rotation: normalizeRotation(Number(cell.rotation || 0)),
    footprint: cell.footprint ? { w: clampInteger(cell.footprint.w, 1, 10), h: clampInteger(cell.footprint.h, 1, 10) } : undefined
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
    givesCover: Boolean(object.givesCover),
    interactable: Boolean(object.interactable),
    color: object.color ? String(object.color) : undefined,
    note: object.note ? String(object.note) : '',
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
    kind: token.kind || 'npc',
    name: String(token.name || 'Token'),
    image: token.image ? String(token.image) : undefined,
    x: Number(token.x || 0),
    y: Number(token.y || 0),
    hpCurrent: token.hpCurrent === undefined ? undefined : Number(token.hpCurrent || 0),
    hpMax: token.hpMax === undefined ? undefined : Number(token.hpMax || 0),
    visibleToPlayers: token.visibleToPlayers !== false,
    locked: Boolean(token.locked)
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
