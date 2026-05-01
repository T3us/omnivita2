import { create } from 'zustand';
import { normalizeAsset } from './assets';
import {
  buildMapObject,
  cloneMap,
  createBlankMap,
  createId,
  getAllMapObjects,
  getObjectLayer,
  normalizeMap,
  removeTileCell,
  setTileCell
} from './mapFactory';
import type {
  AssetDefinition,
  AvailableTabletopToken,
  MapLayerKey,
  MapObject,
  MapPrefab,
  MapTool,
  OmniMap,
  SnapMode,
  TabletopMode,
  TabletopToken
} from './types';

interface TabletopStore {
  map: OmniMap;
  tool: MapTool;
  selectedAssetId: string;
  selectedObjectId: string;
  selectedObjectIds: string[];
  selectedTokenId: string;
  zoom: number;
  snapMode: SnapMode;
  favoriteAssetIds: string[];
  recentAssetIds: string[];
  dirty: boolean;
  setMap(map: Partial<OmniMap>): void;
  newMap(name: string, width: number, height: number, gridSize: number): void;
  setMapMeta(patch: Pick<OmniMap, 'name' | 'width' | 'height' | 'gridSize'>): void;
  setMode(mode: TabletopMode): void;
  setTool(tool: MapTool): void;
  setActiveLayer(layer: MapLayerKey): void;
  setSelectedAsset(assetId: string): void;
  toggleFavoriteAsset(assetId: string): void;
  addCustomAsset(asset: AssetDefinition): void;
  setZoom(zoom: number): void;
  setSnapMode(mode: SnapMode): void;
  clearDirty(): void;
  paintCell(x: number, y: number, layer?: MapLayerKey, assetId?: string): void;
  eraseAt(x: number, y: number): void;
  addObject(assetId: string, x: number, y: number, parentId?: string): void;
  updateObject(objectId: string, patch: Partial<MapObject>): void;
  removeObject(objectId: string): void;
  duplicateSelectedObjects(): void;
  selectObject(objectId: string, additive?: boolean): void;
  clearObjectSelection(): void;
  moveSelectedObjects(deltaX: number, deltaY: number): void;
  bringForward(): void;
  sendBackward(): void;
  moveLayer(direction: -1 | 1): void;
  placeOnSelectedParent(): void;
  groupSelectedObjects(): void;
  ungroupSelectedObjects(): void;
  saveSelectionAsPrefab(name: string): void;
  insertPrefab(prefabId: string, x: number, y: number): void;
  removePrefab(prefabId: string): void;
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

const OBJECT_LAYER_ORDER: MapLayerKey[] = ['decoration', 'objects', 'details', 'lighting', 'mechanics', 'notes'];

export const useTabletopStore = create<TabletopStore>((set, get) => ({
  map: createBlankMap('Mapa da sessao'),
  tool: 'brush',
  selectedAssetId: 'floor-baixo-asphalt',
  selectedObjectId: '',
  selectedObjectIds: [],
  selectedTokenId: '',
  zoom: 1,
  snapMode: 'grid',
  favoriteAssetIds: readStoredList('omnivita-tabletop-favorite-assets'),
  recentAssetIds: readStoredList('omnivita-tabletop-recent-assets'),
  dirty: false,

  setMap(map) {
    set({
      map: normalizeMap(map),
      selectedObjectId: '',
      selectedObjectIds: [],
      selectedTokenId: '',
      dirty: false
    });
  },

  newMap(name, width, height, gridSize) {
    set({
      map: createBlankMap(name, width, height, gridSize),
      tool: 'brush',
      selectedObjectId: '',
      selectedObjectIds: [],
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
    const recentAssetIds = [assetId, ...get().recentAssetIds.filter((id) => id !== assetId)].slice(0, 12);
    writeStoredList('omnivita-tabletop-recent-assets', recentAssetIds);
    set({ selectedAssetId: assetId, recentAssetIds });
  },

  toggleFavoriteAsset(assetId) {
    const favoriteAssetIds = get().favoriteAssetIds.includes(assetId)
      ? get().favoriteAssetIds.filter((id) => id !== assetId)
      : [assetId, ...get().favoriteAssetIds].slice(0, 32);
    writeStoredList('omnivita-tabletop-favorite-assets', favoriteAssetIds);
    set({ favoriteAssetIds });
  },

  addCustomAsset(asset) {
    const normalized = normalizeAsset(asset);
    if (!normalized) return;
    const recentAssetIds = [normalized.id, ...get().recentAssetIds.filter((id) => id !== normalized.id)].slice(0, 12);
    writeStoredList('omnivita-tabletop-recent-assets', recentAssetIds);
    set((state) => {
      const next = cloneMap(state.map);
      const customTilesetIndex = next.tilesets.findIndex((tileset) => tileset.id === 'custom-assets');
      if (customTilesetIndex >= 0) {
        const customTileset = next.tilesets[customTilesetIndex];
        customTileset.assets = [normalized, ...customTileset.assets.filter((entry) => entry.id !== normalized.id)];
      } else {
        next.tilesets = [{ id: 'custom-assets', name: 'Customizados', assets: [normalized] }, ...next.tilesets];
      }
      return {
        map: next,
        selectedAssetId: normalized.id,
        recentAssetIds,
        dirty: true
      };
    });
  },

  setZoom(zoom) {
    set({ zoom: Math.max(0.5, Math.min(2.5, zoom)) });
  },

  setSnapMode(mode) {
    set({ snapMode: mode });
  },

  clearDirty() {
    set({ dirty: false });
  },

  paintCell(x, y, layer, assetId) {
    const targetLayer = layer || get().map.activeLayer;
    const selectedAsset = assetId || get().selectedAssetId;
    if (!selectedAsset) return;
    set((state) => {
      if (!isInsideCell(state.map, x, y)) return state;
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
      const next = cloneMap(state.map);
      const layer = next.activeLayer;
      if (layer === 'floor' || layer === 'walls' || layer === 'collision') {
        if (!isInsideCell(next, x, y)) return state;
        next.tileLayers[layer].cells = removeTileCell(next.tileLayers[layer].cells, x, y);
      } else {
        removeObjectsAt(next, x, y);
      }
      return { map: next, dirty: true, selectedObjectId: '', selectedObjectIds: [], selectedTokenId: '' };
    });
  },

  addObject(assetId, x, y, parentId) {
    set((state) => {
      if (!isInsidePixel(state.map, x, y)) return state;
      const next = cloneMap(state.map);
      const point = snapPoint(next, x, y, state.snapMode, parentId || state.selectedObjectId);
      const layer = next.activeLayer === 'details' || next.activeLayer === 'decoration' || next.activeLayer === 'objects' || next.activeLayer === 'lighting' || next.activeLayer === 'mechanics' || next.activeLayer === 'notes'
        ? next.activeLayer
        : undefined;
      const object = buildMapObject(assetId, point.x, point.y, layer, getNextZIndex(next), next.tilesets);
      if (state.snapMode === 'object' && parentId) object.parentId = parentId;
      const target = getObjectLayer(next, object.layer);
      if (!target || target.locked) return state;
      target.objects.push(object);
      return { map: next, selectedObjectId: object.id, selectedObjectIds: [object.id], selectedTokenId: '', dirty: true };
    });
  },

  updateObject(objectId, patch) {
    set((state) => {
      const next = cloneMap(state.map);
      const object = findObject(next, objectId);
      if (!object) return state;
      const previousLayer = object.layer;
      Object.assign(object, patch);
      if (patch.hiddenFromPlayers !== undefined) {
        object.hiddenFromPlayers = Boolean(patch.hiddenFromPlayers);
        object.visibleToPlayers = !object.hiddenFromPlayers;
      } else if (patch.visibleToPlayers !== undefined) {
        object.visibleToPlayers = Boolean(patch.visibleToPlayers);
        object.hiddenFromPlayers = !object.visibleToPlayers;
      } else {
        object.hiddenFromPlayers = Boolean(object.hiddenFromPlayers);
        object.visibleToPlayers = !object.hiddenFromPlayers;
      }
      if (object.light) {
        object.light.x = object.x;
        object.light.y = object.y;
      }
      if (patch.layer && patch.layer !== previousLayer) {
        moveObjectToLayer(next, object.id, patch.layer);
      }
      return { map: next, dirty: true };
    });
  },

  duplicateSelectedObjects() {
    set((state) => {
      if (!state.selectedObjectIds.length) return state;
      const next = cloneMap(state.map);
      const selected = state.selectedObjectIds
        .map((id) => findObject(next, id))
        .filter(Boolean) as MapObject[];
      if (!selected.length) return state;
      const idMap = new Map<string, string>();
      const groupMap = new Map<string, string>();
      selected.forEach((object) => idMap.set(object.id, createId('obj')));
      const nextIds: string[] = [];
      const baseZ = getNextZIndex(next);
      selected.forEach((object, index) => {
        const clonedGroupId = object.groupId
          ? groupMap.get(object.groupId) || createId('grp')
          : undefined;
        if (object.groupId && clonedGroupId) groupMap.set(object.groupId, clonedGroupId);
        const clone: MapObject = {
          ...object,
          id: idMap.get(object.id) || createId('obj'),
          parentId: object.parentId ? idMap.get(object.parentId) || object.parentId : undefined,
          groupId: clonedGroupId,
          x: object.x + 16,
          y: object.y + 16,
          zIndex: baseZ + index
        };
        if (clone.light) {
          clone.light = { ...clone.light, id: createId('light'), x: clone.x, y: clone.y };
        }
        const layer = getObjectLayer(next, clone.layer);
        if (!layer) return;
        layer.objects.push(clone);
        nextIds.push(clone.id);
      });
      return {
        map: next,
        selectedObjectId: nextIds[nextIds.length - 1] || '',
        selectedObjectIds: nextIds,
        dirty: true
      };
    });
  },

  removeObject(objectId) {
    set((state) => {
      const next = cloneMap(state.map);
      removeObjectFromMap(next, objectId);
      const selectedObjectIds = state.selectedObjectIds.filter((id) => id !== objectId);
      return { map: next, selectedObjectId: selectedObjectIds[0] || '', selectedObjectIds, dirty: true };
    });
  },

  selectObject(objectId, additive = false) {
    set((state) => {
      const selectedObject = findObject(state.map, objectId);
      const groupIds = !additive && selectedObject?.groupId
        ? getAllMapObjects(state.map).filter((object) => object.groupId === selectedObject.groupId).map((object) => object.id)
        : null;
      const selectedObjectIds = additive
        ? toggleListValue(state.selectedObjectIds, objectId)
        : groupIds?.length ? groupIds : [objectId];
      return {
        selectedObjectId: selectedObjectIds[selectedObjectIds.length - 1] || '',
        selectedObjectIds,
        selectedTokenId: ''
      };
    });
  },

  clearObjectSelection() {
    set({ selectedObjectId: '', selectedObjectIds: [] });
  },

  moveSelectedObjects(deltaX, deltaY) {
    set((state) => {
      if (!state.selectedObjectIds.length) return state;
      const next = cloneMap(state.map);
      state.selectedObjectIds.forEach((id) => {
        const object = findObject(next, id);
        if (!object || object.locked) return;
        const point = snapPoint(next, object.x + deltaX, object.y + deltaY, state.snapMode, object.parentId);
        object.x = point.x;
        object.y = point.y;
        if (object.light) {
          object.light.x = object.x;
          object.light.y = object.y;
        }
      });
      return { map: next, dirty: true };
    });
  },

  bringForward() {
    set((state) => patchSelectedZ(state, 1));
  },

  sendBackward() {
    set((state) => patchSelectedZ(state, -1));
  },

  moveLayer(direction) {
    set((state) => {
      if (!state.selectedObjectIds.length) return state;
      const next = cloneMap(state.map);
      state.selectedObjectIds.forEach((id) => {
        const object = findObject(next, id);
        if (!object) return;
        const currentIndex = OBJECT_LAYER_ORDER.indexOf(object.layer);
        const nextLayer = OBJECT_LAYER_ORDER[Math.max(0, Math.min(OBJECT_LAYER_ORDER.length - 1, currentIndex + direction))];
        if (nextLayer) moveObjectToLayer(next, object.id, nextLayer);
      });
      return { map: next, dirty: true };
    });
  },

  placeOnSelectedParent() {
    set((state) => {
      if (state.selectedObjectIds.length < 2) return state;
      const next = cloneMap(state.map);
      const parentId = state.selectedObjectIds[0];
      const parent = findObject(next, parentId);
      if (!parent) return state;
      state.selectedObjectIds.slice(1).forEach((id, index) => {
        const child = findObject(next, id);
        if (!child) return;
        child.parentId = parent.id;
        child.x = parent.x + 8 + index * 8;
        child.y = parent.y + 8 + index * 8;
        child.zIndex = Math.max(parent.zIndex + 1, child.zIndex);
      });
      return { map: next, dirty: true };
    });
  },

  groupSelectedObjects() {
    set((state) => {
      if (state.selectedObjectIds.length < 2) return state;
      const next = cloneMap(state.map);
      const groupId = createId('grp');
      state.selectedObjectIds.forEach((id) => {
        const object = findObject(next, id);
        if (object) object.groupId = groupId;
      });
      return { map: next, dirty: true };
    });
  },

  ungroupSelectedObjects() {
    set((state) => {
      const next = cloneMap(state.map);
      state.selectedObjectIds.forEach((id) => {
        const object = findObject(next, id);
        if (object) object.groupId = undefined;
      });
      return { map: next, dirty: true };
    });
  },

  saveSelectionAsPrefab(name) {
    set((state) => {
      if (!state.selectedObjectIds.length) return state;
      const next = cloneMap(state.map);
      const objects = state.selectedObjectIds.map((id) => findObject(next, id)).filter(Boolean) as MapObject[];
      if (!objects.length) return state;
      const originX = Math.min(...objects.map((object) => object.x));
      const originY = Math.min(...objects.map((object) => object.y));
      const prefab: MapPrefab = {
        id: createId('prefab'),
        name: name.trim() || 'Prefab',
        createdAt: new Date().toISOString(),
        objects: objects.map((object) => ({
          object,
          offsetX: object.x - originX,
          offsetY: object.y - originY
        }))
      };
      next.prefabs = [prefab, ...(next.prefabs || [])].slice(0, 40);
      return { map: next, dirty: true };
    });
  },

  insertPrefab(prefabId, x, y) {
    set((state) => {
      const prefab = state.map.prefabs?.find((entry) => entry.id === prefabId);
      if (!prefab) return state;
      const next = cloneMap(state.map);
      const nextIds: string[] = [];
      const groupMap = new Map<string, string>();
      const idMap = new Map<string, string>();
      prefab.objects.forEach((entry) => idMap.set(entry.object.id, createId('obj')));
      prefab.objects.forEach((entry) => {
        const nextGroupId = entry.object.groupId
          ? groupMap.get(entry.object.groupId) || createId('grp')
          : undefined;
        if (entry.object.groupId && nextGroupId) groupMap.set(entry.object.groupId, nextGroupId);
        const nextId = idMap.get(entry.object.id) || createId('obj');
        const object = {
          ...entry.object,
          id: nextId,
          parentId: entry.object.parentId ? idMap.get(entry.object.parentId) : undefined,
          groupId: nextGroupId,
          x: x + entry.offsetX,
          y: y + entry.offsetY
        };
        const layer = getObjectLayer(next, object.layer);
        if (!layer) return;
        layer.objects.push(object);
        nextIds.push(object.id);
      });
      return { map: next, selectedObjectId: nextIds[0] || '', selectedObjectIds: nextIds, dirty: true };
    });
  },

  removePrefab(prefabId) {
    set((state) => ({
      map: { ...state.map, prefabs: (state.map.prefabs || []).filter((prefab) => prefab.id !== prefabId) },
      dirty: true
    }));
  },

  addToken(source, x, y) {
    set((state) => {
      const next = cloneMap(state.map);
      const token: TabletopToken = {
        id: createId('tok'),
        sourceId: source.sourceId,
        kind: source.kind,
        name: source.name,
        image: source.image,
        hpCurrent: source.hpCurrent,
        hpMax: source.hpMax,
        x: Math.max(0, Math.min(next.width - 1, Math.round(x))),
        y: Math.max(0, Math.min(next.height - 1, Math.round(y))),
        visibleToPlayers: true,
        locked: false
      };
      next.tokens.push(token);
      return { map: next, selectedTokenId: token.id, selectedObjectId: '', selectedObjectIds: [], dirty: true };
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
    set({ selectedTokenId: tokenId, selectedObjectId: '', selectedObjectIds: [] });
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
      if (!isInsideCell(state.map, x, y)) return state;
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

function patchSelectedZ(state: TabletopStore, direction: -1 | 1) {
  if (!state.selectedObjectIds.length) return state;
  const next = cloneMap(state.map);
  const all = getAllMapObjects(next);
  const selected = state.selectedObjectIds
    .map((id) => findObject(next, id))
    .filter(Boolean) as MapObject[];
  if (!selected.length) return state;
  const frontBase = Math.max(0, ...all.map((object) => object.zIndex)) + 1;
  const backBase = Math.max(0, Math.min(0, ...all.map((object) => object.zIndex)) - selected.length);
  state.selectedObjectIds.forEach((id, index) => {
    const object = findObject(next, id);
    if (!object) return;
    object.zIndex = direction > 0 ? frontBase + index : backBase + index;
  });
  return { map: next, dirty: true };
}

function isInsideCell(map: OmniMap, x: number, y: number) {
  return x >= 0 && y >= 0 && x < map.width && y < map.height;
}

function isInsidePixel(map: OmniMap, x: number, y: number) {
  return x >= 0 && y >= 0 && x < map.width * map.gridSize && y < map.height * map.gridSize;
}

function snapPoint(map: OmniMap, x: number, y: number, snapMode: SnapMode, alignObjectId?: string) {
  if (snapMode === 'free') return { x, y };
  if (snapMode === 'fine') return { x: Math.round(x / 4) * 4, y: Math.round(y / 4) * 4 };
  if (snapMode === 'object' && alignObjectId) {
    const object = findObject(map, alignObjectId);
    if (object) return { x: object.x, y: object.y };
  }
  return {
    x: Math.round(x / map.gridSize) * map.gridSize,
    y: Math.round(y / map.gridSize) * map.gridSize
  };
}

function patchLayer(map: OmniMap, layer: MapLayerKey, patch: { visible?: boolean; locked?: boolean; opacity?: number }) {
  const next = cloneMap(map);
  if (layer === 'floor' || layer === 'walls' || layer === 'collision') {
    Object.assign(next.tileLayers[layer], patch);
  } else if (layer === 'fog') {
    Object.assign(next.fogLayer, patch);
  } else {
    const objectLayer = getObjectLayer(next, layer);
    if (objectLayer) Object.assign(objectLayer, patch);
  }
  return next;
}

function findObject(map: OmniMap, objectId: string) {
  return getAllMapObjects(map).find((object) => object.id === objectId) || null;
}

function moveObjectToLayer(map: OmniMap, objectId: string, nextLayer: MapLayerKey) {
  const object = findObject(map, objectId);
  const target = getObjectLayer(map, nextLayer);
  if (!object || !target) return;
  removeObjectFromMap(map, objectId);
  object.layer = nextLayer;
  target.objects.push(object);
}

function removeObjectFromMap(map: OmniMap, objectId: string) {
  for (const layer of [map.objectLayer, map.decorationLayer, map.detailLayer, map.lightingLayer, map.mechanicalLayer, map.notesLayer]) {
    layer.objects = layer.objects.filter((object) => object.id !== objectId);
  }
  getAllMapObjects(map).forEach((object) => {
    if (object.parentId === objectId) object.parentId = undefined;
  });
}

function removeObjectsAt(map: OmniMap, x: number, y: number) {
  const hit = getAllMapObjects(map)
    .sort((left, right) => right.zIndex - left.zIndex)
    .find((object) => {
      const width = object.width * object.scale;
      const height = object.height * object.scale;
      return x >= object.x && x <= object.x + width && y >= object.y && y <= object.y + height;
    });
  if (hit) removeObjectFromMap(map, hit.id);
}

function getNextZIndex(map: OmniMap) {
  return Math.max(0, ...getAllMapObjects(map).map((object) => object.zIndex)) + 1;
}

function toggleListValue(values: string[], value: string) {
  return values.includes(value) ? values.filter((entry) => entry !== value) : [...values, value];
}

function readStoredList(key: string) {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || '[]') as unknown;
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function writeStoredList(key: string, values: string[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(values));
  } catch {
    // Local preferences are optional.
  }
}
