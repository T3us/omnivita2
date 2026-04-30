import { create } from 'zustand';
import type { TabletopAvailableToken, TabletopLayerKey, TabletopMapState, TabletopMode, TabletopTileDefinition, TabletopToken } from './types';
import { TABLETOP_DEFAULT_HEIGHT, TABLETOP_DEFAULT_WIDTH, TABLETOP_ERASER_TILE, TABLETOP_TILE_SIZE } from './types';
import { getTileDefinition } from './tilesets';

type TabletopStore = TabletopMapState & {
  currentMode: TabletopMode;
  selectedTile: string;
  currentTileset: string;
  activeLayer: TabletopLayerKey;
  setMode(mode: TabletopMode): void;
  setMapName(name: string): void;
  setSelectedTile(tileId: string): void;
  setCurrentTileset(tileset: string): void;
  setActiveLayer(layer: TabletopLayerKey): void;
  paintCell(x: number, y: number): void;
  eraseCell(x: number, y: number): void;
  addToken(source: TabletopAvailableToken, x: number, y: number): void;
  moveToken(tokenId: string, x: number, y: number): void;
  removeToken(tokenId: string): void;
  updateTokenHp(tokenId: string, hp: number): void;
  addCustomTile(tile: Omit<TabletopTileDefinition, 'id' | 'tileset' | 'pattern'> & { imageSrc: string }): void;
  newMap(name?: string, width?: number, height?: number): void;
  setMap(map: TabletopMapState): void;
};

export const useTabletopStore = create<TabletopStore>((set, get) => ({
  ...createDefaultTabletopMap('Mapa de teste'),
  currentMode: 'view',
  selectedTile: 'forest.grass',
  currentTileset: 'forest',
  activeLayer: 'ground',

  setMode: (mode) => set({ currentMode: mode }),
  setMapName: (name) => set({ name, updatedAt: new Date().toISOString() }),
  setSelectedTile: (tileId) => set({ selectedTile: tileId }),
  setCurrentTileset: (tileset) => set({ currentTileset: tileset }),
  setActiveLayer: (layer) => set({ activeLayer: layer }),

  paintCell: (x, y) => {
    const state = get();
    if (!isInside(state, x, y)) return;
    if (state.selectedTile === TABLETOP_ERASER_TILE) {
      get().eraseCell(x, y);
      return;
    }

    const layers = cloneLayers(state.layers);
    if (state.activeLayer === 'collision') {
      layers.collision[y][x] = true;
    } else if (state.activeLayer === 'objects') {
      layers.objects[y][x] = state.selectedTile;
    } else {
      layers.ground[y][x] = state.selectedTile;
    }
    const tile = getTileDefinition(state.selectedTile, state.customTiles);
    if (tile?.blocksMovement) layers.collision[y][x] = true;
    set({ layers, updatedAt: new Date().toISOString() });
  },

  eraseCell: (x, y) => {
    const state = get();
    if (!isInside(state, x, y)) return;
    const layers = cloneLayers(state.layers);
    if (state.activeLayer === 'collision') {
      layers.collision[y][x] = false;
    } else if (state.activeLayer === 'objects') {
      layers.objects[y][x] = null;
    } else {
      layers.ground[y][x] = 'forest.grass';
    }
    set({ layers, updatedAt: new Date().toISOString() });
  },

  addToken: (source, x, y) => {
    const state = get();
    const safe = clampCell(state, x, y);
    if (state.layers.collision[safe.y]?.[safe.x]) return;
    const token: TabletopToken = {
      id: `token-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      npcId: source.npcId,
      x: safe.x,
      y: safe.y,
      name: source.name,
      hp: Number(source.hp || source.maxHp || 1),
      maxHp: Math.max(1, Number(source.maxHp || source.hp || 1)),
      image: source.image || '',
      kind: source.kind
    };
    set({ tokens: [...state.tokens, token], updatedAt: new Date().toISOString() });
  },

  moveToken: (tokenId, x, y) => {
    const state = get();
    const safe = clampCell(state, x, y);
    if (state.layers.collision[safe.y]?.[safe.x]) return;
    set({
      tokens: state.tokens.map((token) => token.id === tokenId ? { ...token, x: safe.x, y: safe.y } : token),
      updatedAt: new Date().toISOString()
    });
  },

  removeToken: (tokenId) => {
    const state = get();
    set({ tokens: state.tokens.filter((token) => token.id !== tokenId), updatedAt: new Date().toISOString() });
  },

  updateTokenHp: (tokenId, hp) => {
    const state = get();
    set({
      tokens: state.tokens.map((token) => token.id === tokenId ? { ...token, hp: Math.max(0, Math.min(token.maxHp, Math.round(Number(hp || 0)))) } : token),
      updatedAt: new Date().toISOString()
    });
  },

  addCustomTile: (tile) => {
    const id = `custom.${Date.now()}.${Math.random().toString(36).slice(2, 7)}`;
    const customTile: TabletopTileDefinition = {
      ...tile,
      id,
      tileset: 'custom',
      pattern: 'custom'
    };
    set({
      customTiles: [...get().customTiles, customTile],
      currentTileset: 'custom',
      selectedTile: id,
      activeLayer: tile.layer,
      updatedAt: new Date().toISOString()
    });
  },

  newMap: (name = 'Novo mapa', width = TABLETOP_DEFAULT_WIDTH, height = TABLETOP_DEFAULT_HEIGHT) => {
    set({
      ...createDefaultTabletopMap(name, width, height),
      currentMode: 'edit',
      selectedTile: 'forest.grass',
      currentTileset: 'forest',
      activeLayer: 'ground'
    });
  },

  setMap: (map) => {
    set({
      ...normalizeTabletopMap(map),
      currentMode: 'view',
      selectedTile: 'forest.grass',
      currentTileset: 'forest',
      activeLayer: 'ground'
    });
  }
}));

export function createDefaultTabletopMap(name = 'Mapa de teste', width = TABLETOP_DEFAULT_WIDTH, height = TABLETOP_DEFAULT_HEIGHT): TabletopMapState {
  const layers = createEmptyLayers(width, height);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if ((y >= Math.floor(height / 2) - 1 && y <= Math.floor(height / 2)) || (x === Math.floor(width * 0.62) && y > 4)) {
        layers.ground[y][x] = 'forest.path';
      }
      if ((x > 2 && x < 7 && y > 2 && y < 5) || (x > 20 && y > 1 && y < 6)) {
        layers.ground[y][x] = 'city.stone';
      }
      if (x > 9 && x < 13 && y > 2 && y < 5) {
        layers.objects[y][x] = y === 3 ? 'city.roof' : 'city.wall';
        layers.collision[y][x] = true;
      }
      if (x > 3 && x < 6 && y > 3 && y < 6) {
        layers.ground[y][x] = 'forest.water';
        layers.collision[y][x] = true;
      }
      if ((x < 4 && y < 3) || (x > 15 && y < 3) || (x > 6 && x < 10 && y > 15)) {
        layers.ground[y][x] = 'forest.deep-grass';
      }
    }
  }

  [
    [1, 1, 'forest.tree'],
    [2, 1, 'forest.tree'],
    [18, 1, 'forest.tree'],
    [19, 1, 'forest.tree'],
    [7, 5, 'forest.rock'],
    [10, 8, 'forest.fence'],
    [11, 8, 'forest.fence'],
    [16, 7, 'forest.fence'],
    [5, 10, 'forest.bush'],
    [24, 8, 'city.light'],
    [20, 12, 'dungeon.anomaly']
  ].forEach(([x, y, tileId]) => {
    if (typeof x !== 'number' || typeof y !== 'number' || typeof tileId !== 'string') return;
    if (!layers.objects[y]?.[x]) layers.objects[y][x] = tileId;
    layers.collision[y][x] = tileId !== 'city.light' && tileId !== 'dungeon.anomaly';
  });

  return {
    version: 1,
    id: `map-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    gridWidth: width,
    gridHeight: height,
    tileSize: TABLETOP_TILE_SIZE,
    layers,
    tokens: [],
    customTiles: [],
    updatedAt: new Date().toISOString()
  };
}

export function normalizeTabletopMap(map: Partial<TabletopMapState>): TabletopMapState {
  const width = clampDimension(map.gridWidth, TABLETOP_DEFAULT_WIDTH);
  const height = clampDimension(map.gridHeight, TABLETOP_DEFAULT_HEIGHT);
  return {
    version: 1,
    id: String(map.id || `map-${Date.now()}`),
    name: String(map.name || 'Mapa sem nome'),
    gridWidth: width,
    gridHeight: height,
    tileSize: Math.max(16, Math.min(64, Math.round(Number(map.tileSize || TABLETOP_TILE_SIZE)))),
    layers: {
      ground: normalizeStringGrid(map.layers?.ground, width, height, 'forest.grass'),
      objects: normalizeNullableGrid(map.layers?.objects, width, height),
      collision: normalizeBooleanGrid(map.layers?.collision, width, height)
    },
    tokens: Array.isArray(map.tokens) ? map.tokens.map(normalizeToken).filter(Boolean) as TabletopToken[] : [],
    customTiles: Array.isArray(map.customTiles) ? map.customTiles.map(normalizeCustomTile).filter(Boolean) as TabletopTileDefinition[] : [],
    updatedAt: String(map.updatedAt || new Date().toISOString())
  };
}

function createEmptyLayers(width: number, height: number) {
  return {
    ground: Array.from({ length: height }, () => Array.from({ length: width }, () => 'forest.grass')),
    objects: Array.from({ length: height }, () => Array.from({ length: width }, () => null as string | null)),
    collision: Array.from({ length: height }, () => Array.from({ length: width }, () => false))
  };
}

function cloneLayers(layers: TabletopMapState['layers']) {
  return {
    ground: layers.ground.map((row) => row.slice()),
    objects: layers.objects.map((row) => row.slice()),
    collision: layers.collision.map((row) => row.slice())
  };
}

function isInside(state: Pick<TabletopMapState, 'gridWidth' | 'gridHeight'>, x: number, y: number) {
  return x >= 0 && y >= 0 && x < state.gridWidth && y < state.gridHeight;
}

function clampCell(state: Pick<TabletopMapState, 'gridWidth' | 'gridHeight'>, x: number, y: number) {
  return {
    x: Math.max(0, Math.min(state.gridWidth - 1, Math.round(Number(x || 0)))),
    y: Math.max(0, Math.min(state.gridHeight - 1, Math.round(Number(y || 0))))
  };
}

function clampDimension(value: unknown, fallback: number) {
  return Math.max(8, Math.min(100, Math.round(Number(value || fallback))));
}

function normalizeStringGrid(grid: unknown, width: number, height: number, fallback: string) {
  return Array.from({ length: height }, (_, y) => (
    Array.from({ length: width }, (_, x) => String((grid as string[][] | undefined)?.[y]?.[x] || fallback))
  ));
}

function normalizeNullableGrid(grid: unknown, width: number, height: number) {
  return Array.from({ length: height }, (_, y) => (
    Array.from({ length: width }, (_, x) => {
      const value = (grid as (string | null)[][] | undefined)?.[y]?.[x];
      return value ? String(value) : null;
    })
  ));
}

function normalizeBooleanGrid(grid: unknown, width: number, height: number) {
  return Array.from({ length: height }, (_, y) => (
    Array.from({ length: width }, (_, x) => Boolean((grid as boolean[][] | undefined)?.[y]?.[x]))
  ));
}

function normalizeToken(raw: Partial<TabletopToken>) {
  if (!raw || typeof raw !== 'object') return null;
  return {
    id: String(raw.id || `token-${Date.now()}`),
    npcId: String(raw.npcId || raw.id || ''),
    x: Math.max(0, Math.round(Number(raw.x || 0))),
    y: Math.max(0, Math.round(Number(raw.y || 0))),
    name: String(raw.name || 'Token'),
    hp: Math.max(0, Math.round(Number(raw.hp || 1))),
    maxHp: Math.max(1, Math.round(Number(raw.maxHp || raw.hp || 1))),
    image: String(raw.image || ''),
    kind: raw.kind === 'enemy' || raw.kind === 'player' ? raw.kind : 'npc'
  };
}

function normalizeCustomTile(raw: Partial<TabletopTileDefinition>) {
  if (!raw || typeof raw !== 'object' || !raw.imageSrc) return null;
  return {
    id: String(raw.id || `custom.${Date.now()}`),
    name: String(raw.name || 'Tile customizado'),
    tileset: 'custom',
    layer: raw.layer === 'objects' ? 'objects' : 'ground',
    colors: Array.isArray(raw.colors) && raw.colors.length >= 3 ? raw.colors as [string, string, string] : ['#8b5cf6', '#2f164f', '#e9d5ff'],
    pattern: 'custom' as const,
    blocksMovement: Boolean(raw.blocksMovement),
    imageSrc: String(raw.imageSrc)
  };
}
