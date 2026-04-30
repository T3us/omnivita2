import { DEFAULT_TILESETS, getAsset } from './assets';
import type {
  FogLayer,
  MapLayerKey,
  MapObject,
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
    objects: []
  };
}

function createFogLayer(): FogLayer {
  return {
    id: 'fog',
    name: 'Fog',
    visible: true,
    opacity: 0.72,
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
      collision: createTileLayer('collision', 'Colisao')
    },
    objectLayer: createObjectLayer('objects', 'Objetos'),
    decorationLayer: createObjectLayer('decoration', 'Decoracao'),
    lightingLayer: createObjectLayer('lighting', 'Luzes'),
    notesLayer: createObjectLayer('notes', 'Notas'),
    fogLayer: createFogLayer(),
    tokens: []
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
    tilesets: Array.isArray(input?.tilesets) && input?.tilesets.length ? input.tilesets : DEFAULT_TILESETS,
    tileLayers: {
      floor: normalizeTileLayer(input?.tileLayers?.floor, base.tileLayers.floor),
      walls: normalizeTileLayer(input?.tileLayers?.walls, base.tileLayers.walls),
      collision: normalizeTileLayer(input?.tileLayers?.collision, base.tileLayers.collision)
    },
    objectLayer: normalizeObjectLayer(input?.objectLayer, base.objectLayer),
    decorationLayer: normalizeObjectLayer(input?.decorationLayer, base.decorationLayer),
    lightingLayer: normalizeObjectLayer(input?.lightingLayer, base.lightingLayer),
    notesLayer: normalizeObjectLayer(input?.notesLayer, base.notesLayer),
    fogLayer: normalizeFogLayer(input?.fogLayer, base.fogLayer),
    tokens: Array.isArray(input?.tokens) ? input.tokens.map(normalizeToken).filter(Boolean) as TabletopToken[] : []
  };

  return next;
}

export function cloneMap(map: OmniMap): OmniMap {
  return normalizeMap(JSON.parse(JSON.stringify(map)) as OmniMap);
}

export function setTileCell(cells: TileCell[], x: number, y: number, assetId: string) {
  const key = `${x}:${y}`;
  const next = cells.filter((cell) => `${cell.x}:${cell.y}` !== key);
  if (assetId) next.push({ x, y, assetId });
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

export function buildMapObject(assetId: string, x: number, y: number): MapObject {
  const asset = getAsset(assetId);
  const kind = asset?.kind === 'floor' || asset?.kind === 'wall' || asset?.kind === 'fog'
    ? 'prop'
    : asset?.kind || 'prop';
  const isLight = kind === 'light';
  return {
    id: createId('obj'),
    kind,
    name: asset?.name || 'Objeto',
    assetId,
    x,
    y,
    width: isLight ? 1 : 2,
    height: isLight ? 1 : 2,
    rotation: 0,
    visibleToPlayers: kind !== 'note',
    locked: false,
    color: asset?.color,
    note: '',
    light: isLight
      ? { id: createId('light'), x, y, radius: 5, intensity: 0.55, color: asset?.color || '#8b5cf6' }
      : undefined
  };
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
    objects: Array.isArray(layer?.objects) ? layer.objects.map(normalizeObject).filter(Boolean) as MapObject[] : []
  };
}

function normalizeFogLayer(layer: Partial<FogLayer> | undefined, fallback: FogLayer): FogLayer {
  return {
    ...fallback,
    ...layer,
    id: 'fog',
    name: String(layer?.name || fallback.name),
    visible: layer?.visible !== false,
    opacity: clampNumber(layer?.opacity, 0, 1, fallback.opacity),
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
    rotation: Number(cell.rotation || 0)
  };
}

function normalizeObject(object: Partial<MapObject>) {
  if (!object?.id) return null;
  const kind = String(object.kind || 'prop') as MapObject['kind'];
  return {
    id: String(object.id),
    kind,
    name: String(object.name || 'Objeto'),
    assetId: String(object.assetId || 'prop-crate'),
    x: Number(object.x || 0),
    y: Number(object.y || 0),
    width: clampNumber(object.width, 0.25, 40, 2),
    height: clampNumber(object.height, 0.25, 40, 2),
    rotation: Number(object.rotation || 0),
    visibleToPlayers: object.visibleToPlayers !== false,
    locked: Boolean(object.locked),
    color: object.color ? String(object.color) : undefined,
    note: object.note ? String(object.note) : '',
    light: object.light
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
  const valid: MapLayerKey[] = ['floor', 'walls', 'objects', 'decoration', 'lighting', 'collision', 'fog', 'notes', 'tokens'];
  return valid.includes(value as MapLayerKey) ? value as MapLayerKey : 'floor';
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
