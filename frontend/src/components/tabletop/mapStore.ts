import { create } from 'zustand';
import { buildMapObject, cloneMap, createBlankMap, createId, normalizeMap, removeTileCell, setTileCell } from './mapFactory';
import type {
  AvailableTabletopToken,
  MapLayerKey,
  MapObject,
  MapTool,
  OmniMap,
  TabletopMode,
  TabletopToken
} from './types';

interface TabletopStore {
  map: OmniMap;
  tool: MapTool;
  selectedAssetId: string;
  selectedObjectId: string;
  selectedTokenId: string;
  zoom: number;
  dirty: boolean;
  setMap(map: Partial<OmniMap>): void;
  newMap(name: string, width: number, height: number, gridSize: number): void;
  setMapMeta(patch: Pick<OmniMap, 'name' | 'width' | 'height' | 'gridSize'>): void;
  setMode(mode: TabletopMode): void;
  setTool(tool: MapTool): void;
  setActiveLayer(layer: MapLayerKey): void;
  setSelectedAsset(assetId: string): void;
  setZoom(zoom: number): void;
  clearDirty(): void;
  paintCell(x: number, y: number, layer?: MapLayerKey, assetId?: string): void;
  eraseAt(x: number, y: number): void;
  addObject(assetId: string, x: number, y: number): void;
  updateObject(objectId: string, patch: Partial<MapObject>): void;
  removeObject(objectId: string): void;
  selectObject(objectId: string): void;
  addToken(source: AvailableTabletopToken, x: number, y: number): void;
  moveToken(tokenId: string, x: number, y: number): void;
  updateToken(tokenId: string, patch: Partial<TabletopToken>): void;
  removeToken(tokenId: string): void;
  selectToken(tokenId: string): void;
  setLayerVisibility(layer: MapLayerKey, visible: boolean): void;
  setLayerLocked(layer: MapLayerKey, locked: boolean): void;
  setLayerOpacity(layer: MapLayerKey, opacity: number): void;
  revealFogCell(x: number, y: number): void;
  hideFogCell(x: number, y: number): void;
}

export const useTabletopStore = create<TabletopStore>((set, get) => ({
  map: createBlankMap('Mapa da sessao'),
  tool: 'brush',
  selectedAssetId: 'floor-grass',
  selectedObjectId: '',
  selectedTokenId: '',
  zoom: 1,
  dirty: false,

  setMap(map) {
    set({
      map: normalizeMap(map),
      selectedObjectId: '',
      selectedTokenId: '',
      dirty: false
    });
  },

  newMap(name, width, height, gridSize) {
    set({
      map: createBlankMap(name, width, height, gridSize),
      tool: 'brush',
      selectedObjectId: '',
      selectedTokenId: '',
      dirty: true
    });
  },

  setMapMeta(patch) {
    set((state) => ({
      map: normalizeMap({ ...state.map, ...patch }),
      dirty: true
    }));
  },

  setMode(mode) {
    set((state) => ({ map: { ...state.map, mode }, tool: mode === 'build' ? state.tool : 'token', dirty: true }));
  },

  setTool(tool) {
    set({ tool });
  },

  setActiveLayer(layer) {
    set((state) => ({ map: { ...state.map, activeLayer: layer }, dirty: true }));
  },

  setSelectedAsset(assetId) {
    set({ selectedAssetId: assetId });
  },

  setZoom(zoom) {
    set({ zoom: Math.max(0.5, Math.min(2.5, zoom)) });
  },

  clearDirty() {
    set({ dirty: false });
  },

  paintCell(x, y, layer, assetId) {
    const targetLayer = layer || get().map.activeLayer;
    const selectedAsset = assetId || get().selectedAssetId;
    if (!selectedAsset) return;
    set((state) => {
      if (!isInside(state.map, x, y)) return state;
      const next = cloneMap(state.map);
      if (targetLayer === 'floor' || targetLayer === 'walls' || targetLayer === 'collision') {
        if (next.tileLayers[targetLayer].locked) return state;
        next.tileLayers[targetLayer].cells = setTileCell(next.tileLayers[targetLayer].cells, x, y, selectedAsset);
        return { map: next, dirty: true };
      }
      return state;
    });
  },

  eraseAt(x, y) {
    set((state) => {
      if (!isInside(state.map, x, y)) return state;
      const next = cloneMap(state.map);
      const layer = next.activeLayer;
      if (layer === 'floor' || layer === 'walls' || layer === 'collision') {
        next.tileLayers[layer].cells = removeTileCell(next.tileLayers[layer].cells, x, y);
      } else {
        removeObjectsAt(next, x, y);
      }
      return { map: next, dirty: true, selectedObjectId: '', selectedTokenId: '' };
    });
  },

  addObject(assetId, x, y) {
    set((state) => {
      if (!isInside(state.map, x, y)) return state;
      const next = cloneMap(state.map);
      const object = buildMapObject(assetId, x, y);
      const target = object.kind === 'light'
        ? next.lightingLayer
        : object.kind === 'note'
          ? next.notesLayer
          : object.kind === 'prop'
            ? next.decorationLayer
            : next.objectLayer;
      if (target.locked) return state;
      target.objects.push(object);
      return { map: next, selectedObjectId: object.id, selectedTokenId: '', dirty: true };
    });
  },

  updateObject(objectId, patch) {
    set((state) => {
      const next = cloneMap(state.map);
      const object = findObject(next, objectId);
      if (!object) return state;
      Object.assign(object, patch);
      if (object.light) {
        object.light.x = object.x;
        object.light.y = object.y;
      }
      return { map: next, dirty: true };
    });
  },

  removeObject(objectId) {
    set((state) => {
      const next = cloneMap(state.map);
      for (const layer of [next.objectLayer, next.decorationLayer, next.lightingLayer, next.notesLayer]) {
        layer.objects = layer.objects.filter((object) => object.id !== objectId);
      }
      return { map: next, selectedObjectId: '', dirty: true };
    });
  },

  selectObject(objectId) {
    set({ selectedObjectId: objectId, selectedTokenId: '' });
  },

  addToken(source, x, y) {
    set((state) => {
      if (!isInside(state.map, x, y)) return state;
      const next = cloneMap(state.map);
      const token: TabletopToken = {
        id: createId('tok'),
        sourceId: source.sourceId,
        kind: source.kind,
        name: source.name,
        image: source.image,
        hpCurrent: source.hpCurrent,
        hpMax: source.hpMax,
        x,
        y,
        visibleToPlayers: true,
        locked: false
      };
      next.tokens.push(token);
      return { map: next, selectedTokenId: token.id, selectedObjectId: '', dirty: true };
    });
  },

  moveToken(tokenId, x, y) {
    set((state) => {
      const next = cloneMap(state.map);
      const token = next.tokens.find((entry) => entry.id === tokenId);
      if (!token || token.locked) return state;
      token.x = Math.max(0, Math.min(next.width - 1, Math.round(x)));
      token.y = Math.max(0, Math.min(next.height - 1, Math.round(y)));
      return { map: next, dirty: true };
    });
  },

  updateToken(tokenId, patch) {
    set((state) => {
      const next = cloneMap(state.map);
      const token = next.tokens.find((entry) => entry.id === tokenId);
      if (!token) return state;
      Object.assign(token, patch);
      return { map: next, dirty: true };
    });
  },

  removeToken(tokenId) {
    set((state) => {
      const next = cloneMap(state.map);
      next.tokens = next.tokens.filter((entry) => entry.id !== tokenId);
      return { map: next, selectedTokenId: '', dirty: true };
    });
  },

  selectToken(tokenId) {
    set({ selectedTokenId: tokenId, selectedObjectId: '' });
  },

  setLayerVisibility(layer, visible) {
    set((state) => ({ map: patchLayer(state.map, layer, { visible }), dirty: true }));
  },

  setLayerLocked(layer, locked) {
    set((state) => ({ map: patchLayer(state.map, layer, { locked }), dirty: true }));
  },

  setLayerOpacity(layer, opacity) {
    set((state) => ({ map: patchLayer(state.map, layer, { opacity: Math.max(0, Math.min(1, opacity)) }), dirty: true }));
  },

  revealFogCell(x, y) {
    set((state) => {
      if (!isInside(state.map, x, y)) return state;
      const key = `${x}:${y}`;
      if (state.map.fogLayer.revealedCells.some((cell) => `${cell.x}:${cell.y}` === key)) return state;
      return {
        map: {
          ...state.map,
          fogLayer: {
            ...state.map.fogLayer,
            revealedCells: [...state.map.fogLayer.revealedCells, { x, y }]
          }
        },
        dirty: true
      };
    });
  },

  hideFogCell(x, y) {
    set((state) => ({
      map: {
        ...state.map,
        fogLayer: {
          ...state.map.fogLayer,
          revealedCells: state.map.fogLayer.revealedCells.filter((cell) => cell.x !== x || cell.y !== y)
        }
      },
      dirty: true
    }));
  }
}));

function isInside(map: OmniMap, x: number, y: number) {
  return x >= 0 && y >= 0 && x < map.width && y < map.height;
}

function patchLayer(map: OmniMap, layer: MapLayerKey, patch: { visible?: boolean; locked?: boolean; opacity?: number }) {
  const next = cloneMap(map);
  if (layer === 'floor' || layer === 'walls' || layer === 'collision') {
    Object.assign(next.tileLayers[layer], patch);
  } else if (layer === 'objects') {
    Object.assign(next.objectLayer, patch);
  } else if (layer === 'decoration') {
    Object.assign(next.decorationLayer, patch);
  } else if (layer === 'lighting') {
    Object.assign(next.lightingLayer, patch);
  } else if (layer === 'notes') {
    Object.assign(next.notesLayer, patch);
  } else if (layer === 'fog') {
    Object.assign(next.fogLayer, patch);
  }
  return next;
}

function findObject(map: OmniMap, objectId: string) {
  return [map.objectLayer, map.decorationLayer, map.lightingLayer, map.notesLayer]
    .flatMap((layer) => layer.objects)
    .find((object) => object.id === objectId) || null;
}

function removeObjectsAt(map: OmniMap, x: number, y: number) {
  for (const layer of [map.objectLayer, map.decorationLayer, map.lightingLayer, map.notesLayer]) {
    layer.objects = layer.objects.filter((object) => {
      const withinX = x >= object.x && x <= object.x + object.width;
      const withinY = y >= object.y && y <= object.y + object.height;
      return !(withinX && withinY);
    });
  }
}
