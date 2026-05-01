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
  EraseMode,
  MapLayerKey,
  MapObject,
  MapPrefab,
  MapTool,
  OmniMap,
  SelectedTileCell,
  SnapMode,
  TabletopMode,
  TabletopToken,
  TileLayerKey
} from './types';

interface TabletopStore {
  map: OmniMap;
  tool: MapTool;
  selectedAssetId: string;
  selectedObjectId: string;
  selectedObjectIds: string[];
  selectedTileCells: SelectedTileCell[];
  selectedTokenId: string;
  placementRotation: number;
  zoom: number;
  snapMode: SnapMode;
  eraseMode: EraseMode;
  favoriteAssetIds: string[];
  recentAssetIds: string[];
  brushSize: number;
  showGrid: boolean;
  isTransforming: boolean;
  soloLayer: MapLayerKey | null;
  historyPast: OmniMap[];
  historyFuture: OmniMap[];
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
  setEraseMode(mode: EraseMode): void;
  rotatePlacement(delta: number): void;
  setBrushSize(size: number): void;
  toggleGrid(): void;
  setTransforming(value: boolean): void;
  setSoloLayer(layer: MapLayerKey | null): void;
  captureHistory(): void;
  undo(): void;
  redo(): void;
  clearDirty(): void;
  paintCell(x: number, y: number, layer?: MapLayerKey, assetId?: string): void;
  paintBrush(x: number, y: number, layer?: MapLayerKey, assetId?: string, size?: number): void;
  eraseBrush(x: number, y: number, size?: number): void;
  eraseBrushAtPoint(x: number, y: number, size?: number): void;
  eraseAt(x: number, y: number): void;
  addObject(assetId: string, x: number, y: number, parentId?: string): void;
  addDoor(x: number, y: number, assetId?: string, rotation?: number): void;
  updateObject(objectId: string, patch: Partial<MapObject>): void;
  removeObject(objectId: string): void;
  removeSelectedObjects(): void;
  duplicateSelectedObjects(): void;
  centerSelectedOnGrid(): void;
  resetSelectedRotation(): void;
  resetSelectedScale(): void;
  selectObject(objectId: string, additive?: boolean): void;
  selectObjects(objectIds: string[], additive?: boolean): void;
  selectObjectsInRect(rect: { x: number; y: number; width: number; height: number }, additive?: boolean): void;
  selectArea(rect: { x: number; y: number; width: number; height: number }, additive?: boolean): void;
  clearObjectSelection(): void;
  updateSelectedObjects(patch: Partial<MapObject>): void;
  moveSelectedObjects(deltaX: number, deltaY: number, snapOverride?: SnapMode | null): void;
  nudgeSelectedObjects(deltaX: number, deltaY: number): void;
  rotateSelectedObjects(delta: number): void;
  rotateSelectedTiles(delta: number): void;
  alignSelectedObjects(mode: 'top' | 'center'): void;
  distributeSelectedObjects(axis: 'horizontal' | 'vertical'): void;
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
  toggleActiveLayerLock(): void;
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
  selectedTileCells: [],
  selectedTokenId: '',
  placementRotation: 0,
  zoom: 1,
  snapMode: 'free',
  eraseMode: 'topVisible',
  favoriteAssetIds: readStoredList('omnivita-tabletop-favorite-assets'),
  recentAssetIds: readStoredList('omnivita-tabletop-recent-assets'),
  brushSize: 1,
  showGrid: true,
  isTransforming: false,
  soloLayer: null,
  historyPast: [],
  historyFuture: [],
  dirty: false,

  setMap(map) {
    set({
      map: normalizeMap(map),
      selectedObjectId: '',
      selectedObjectIds: [],
      selectedTileCells: [],
      selectedTokenId: '',
      soloLayer: null,
      historyPast: [],
      historyFuture: [],
      dirty: false
    });
  },

  newMap(name, width, height, gridSize) {
    set({
      map: createBlankMap(name, width, height, gridSize),
      tool: 'brush',
      selectedObjectId: '',
      selectedObjectIds: [],
      selectedTileCells: [],
      selectedTokenId: '',
      soloLayer: null,
      historyPast: [],
      historyFuture: [],
      dirty: true
    });
  },

  setMapMeta(patch) {
    set((state) => ({
      map: normalizeMap({ ...state.map, ...patch }),
      ...pushHistory(state),
      dirty: true
    }));
  },

  setMode(mode) {
    set((state) => ({ map: { ...state.map, mode }, tool: mode === 'build' ? state.tool : 'token', ...pushHistory(state), dirty: true }));
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
      const history = pushHistory(state);
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
        historyPast: history.historyPast,
        historyFuture: history.historyFuture,
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

  setEraseMode(mode) {
    set({ eraseMode: mode });
  },

  rotatePlacement(delta) {
    set((state) => ({ placementRotation: normalizeRotation45(state.placementRotation + delta) }));
  },

  setBrushSize(size) {
    const allowed = [1, 2, 3, 5];
    const closest = allowed.reduce((best, current) => Math.abs(current - size) < Math.abs(best - size) ? current : best, 1);
    set({ brushSize: closest });
  },

  toggleGrid() {
    set((state) => ({ showGrid: !state.showGrid }));
  },

  setTransforming(value) {
    set({ isTransforming: value });
  },

  setSoloLayer(layer) {
    set({ soloLayer: layer });
  },

  captureHistory() {
    set((state) => pushHistory(state));
  },

  undo() {
    set((state) => {
      const previous = state.historyPast[state.historyPast.length - 1];
      if (!previous) return state;
      return {
        map: cloneMap(previous),
        historyPast: state.historyPast.slice(0, -1),
        historyFuture: [cloneMap(state.map), ...state.historyFuture].slice(0, 80),
        selectedObjectId: '',
        selectedObjectIds: [],
        selectedTileCells: [],
        selectedTokenId: '',
        dirty: true
      };
    });
  },

  redo() {
    set((state) => {
      const nextHistory = state.historyFuture[0];
      if (!nextHistory) return state;
      return {
        map: cloneMap(nextHistory),
        historyPast: [...state.historyPast, cloneMap(state.map)].slice(-80),
        historyFuture: state.historyFuture.slice(1),
        selectedObjectId: '',
        selectedObjectIds: [],
        selectedTileCells: [],
        selectedTokenId: '',
        dirty: true
      };
    });
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
      if (targetLayer === 'floor' || targetLayer === 'walls' || targetLayer === 'doors' || targetLayer === 'collision') {
        if (next.tileLayers[targetLayer].locked || next.tileLayers[targetLayer].editable === false) return state;
        const asset = getAssetFromMap(next, selectedAsset);
        next.tileLayers[targetLayer].cells = setTileCell(next.tileLayers[targetLayer].cells, x, y, selectedAsset, state.placementRotation, asset?.gridFootprint);
        return { map: next, dirty: true };
      }
      return state;
    });
  },

  paintBrush(x, y, layer, assetId, size) {
    const targetLayer = layer || get().map.activeLayer;
    const selectedAsset = assetId || get().selectedAssetId;
    const brushSize = size || get().brushSize;
    if (!selectedAsset) return;
    set((state) => {
      const next = cloneMap(state.map);
      if (targetLayer === 'floor' || targetLayer === 'walls' || targetLayer === 'doors' || targetLayer === 'collision') {
        const target = next.tileLayers[targetLayer];
        if (target.locked || target.editable === false) return state;
        const asset = getAssetFromMap(next, selectedAsset);
        getBrushCells(x, y, brushSize).forEach((cell) => {
          if (!isInsideCell(next, cell.x, cell.y)) return;
          target.cells = setTileCell(target.cells, cell.x, cell.y, selectedAsset, state.placementRotation, asset?.gridFootprint);
        });
        return { map: next, dirty: true };
      }
      if (targetLayer === 'fog') {
        if (next.fogLayer.locked || next.fogLayer.editable === false) return state;
        const existing = new Set(next.fogLayer.revealedCells.map((cell) => `${cell.x}:${cell.y}`));
        getBrushCells(x, y, brushSize).forEach((cell) => {
          if (!isInsideCell(next, cell.x, cell.y)) return;
          const key = `${cell.x}:${cell.y}`;
          if (existing.has(key)) return;
          existing.add(key);
          next.fogLayer.revealedCells.push({ x: cell.x, y: cell.y });
        });
        return { map: next, dirty: true };
      }
      return state;
    });
  },

  eraseBrush(x, y, size) {
    const brushSize = size || get().brushSize;
    set((state) => {
      const next = cloneMap(state.map);
      eraseCells(next, x, y, brushSize, state.eraseMode);
      return { map: next, dirty: true, selectedObjectId: '', selectedObjectIds: [], selectedTileCells: [], selectedTokenId: '' };
    });
  },

  eraseBrushAtPoint(x, y, size) {
    const brushSize = size || get().brushSize;
    set((state) => {
      const next = cloneMap(state.map);
      erasePoint(next, x, y, brushSize, state.eraseMode);
      return { map: next, dirty: true, selectedObjectId: '', selectedObjectIds: [], selectedTileCells: [], selectedTokenId: '' };
    });
  },

  eraseAt(x, y) {
    set((state) => {
      const next = cloneMap(state.map);
      erasePoint(next, x, y, 1, state.eraseMode);
      return { map: next, dirty: true, selectedObjectId: '', selectedObjectIds: [], selectedTileCells: [], selectedTokenId: '' };
    });
  },

  addObject(assetId, x, y, parentId) {
    set((state) => {
      if (!isInsidePixel(state.map, x, y)) return state;
      const history = pushHistory(state);
      const next = cloneMap(state.map);
      const layer = getObjectTargetLayer(next, assetId);
      const object = buildMapObject(assetId, x, y, layer, getNextLayerZIndex(next, layer), next.tilesets);
      object.rotation = normalizeRotation45(state.placementRotation);
      const point = snapPoint(next, x, y, resolveObjectSnapMode(object, state.snapMode), parentId);
      object.x = point.x;
      object.y = point.y;
      if (parentId) {
        const parent = findObject(next, parentId);
        object.parentId = parentId;
        if (parent) object.zIndex = Math.max(object.zIndex, parent.zIndex + 1);
      }
      const target = getObjectLayer(next, object.layer);
      if (!target || target.locked || target.editable === false) return state;
      target.objects.push(object);
      return { map: next, selectedObjectId: object.id, selectedObjectIds: [object.id], selectedTileCells: [], selectedTokenId: '', historyPast: history.historyPast, historyFuture: history.historyFuture, dirty: true };
    });
  },

  addDoor(x, y, assetId, rotation) {
    const currentAssetId = assetId || get().selectedAssetId;
    const currentAsset = currentAssetId ? getAssetFromMap(get().map, currentAssetId) : null;
    const selectedAsset = currentAsset?.kind === 'door' || currentAsset?.defaultLayer === 'doors' ? currentAssetId : 'door-metal';
    if (!selectedAsset) return;
    set((state) => {
      if (!isInsideCell(state.map, x, y)) return state;
      const history = pushHistory(state);
      const next = cloneMap(state.map);
      const target = next.tileLayers.doors;
      if (target.locked || target.editable === false) return state;
      const asset = getAssetFromMap(next, selectedAsset);
      target.cells = setTileCell(
        target.cells,
        x,
        y,
        selectedAsset,
        normalizeRotation45(rotation ?? state.placementRotation),
        asset?.gridFootprint || { w: 1, h: 1 }
      );
      const selectedTileCells = [{ layer: 'doors' as TileLayerKey, x, y }];
      return {
        map: next,
        selectedObjectId: '',
        selectedObjectIds: [],
        selectedTileCells,
        selectedTokenId: '',
        historyPast: history.historyPast,
        historyFuture: history.historyFuture,
        dirty: true
      };
    });
  },

  updateObject(objectId, patch) {
    set((state) => {
      const history = pushHistory(state);
      const next = cloneMap(state.map);
      const object = findObject(next, objectId);
      if (!object) return state;
      const previousLayer = object.layer;
      const deltaX = patch.x !== undefined ? Number(patch.x) - object.x : 0;
      const deltaY = patch.y !== undefined ? Number(patch.y) - object.y : 0;
      Object.assign(object, patch);
      if (patch.rotation !== undefined) object.rotation = normalizeRotation45(Number(patch.rotation));
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
      if (deltaX || deltaY) {
        getSelectionWithChildren(next, [object.id])
          .filter((id) => id !== object.id)
          .forEach((childId) => {
            const child = findObject(next, childId);
            if (!child || child.locked) return;
            child.x += deltaX;
            child.y += deltaY;
            if (child.light) {
              child.light.x = child.x;
              child.light.y = child.y;
            }
          });
      }
      return { map: next, historyPast: history.historyPast, historyFuture: history.historyFuture, dirty: true };
    });
  },

  duplicateSelectedObjects() {
    set((state) => {
      if (!state.selectedObjectIds.length && !state.selectedTileCells.length) return state;
      const history = pushHistory(state);
      const next = cloneMap(state.map);
      const selected = state.selectedObjectIds
        .map((id) => findObject(next, id))
        .filter(Boolean) as MapObject[];
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
      const nextTileCells: SelectedTileCell[] = [];
      state.selectedTileCells.forEach((cell) => {
        const layer = next.tileLayers[cell.layer];
        if (!layer || layer.locked || layer.editable === false) return;
        const original = findTileAtCell(next, cell.layer, cell.x, cell.y);
        if (!original) return;
        const target = { layer: cell.layer, x: Math.min(next.width - 1, cell.x + 1), y: Math.min(next.height - 1, cell.y + 1) };
        layer.cells = setTileCell(layer.cells, target.x, target.y, original.assetId, original.rotation || 0, original.footprint);
        nextTileCells.push(target);
      });
      return {
        map: next,
        selectedObjectId: nextIds[nextIds.length - 1] || '',
        selectedObjectIds: nextIds,
        selectedTileCells: nextTileCells,
        historyPast: history.historyPast,
        historyFuture: history.historyFuture,
        dirty: true
      };
    });
  },

  removeObject(objectId) {
    set((state) => {
      const history = pushHistory(state);
      const next = cloneMap(state.map);
      removeObjectFromMap(next, objectId);
      const selectedObjectIds = state.selectedObjectIds.filter((id) => id !== objectId);
      return { map: next, selectedObjectId: selectedObjectIds[0] || '', selectedObjectIds, historyPast: history.historyPast, historyFuture: history.historyFuture, dirty: true };
    });
  },

  removeSelectedObjects() {
    set((state) => {
      if (!state.selectedObjectIds.length && !state.selectedTileCells.length) return state;
      const history = pushHistory(state);
      const next = cloneMap(state.map);
      state.selectedObjectIds.forEach((id) => removeObjectFromMap(next, id));
      state.selectedTileCells.forEach((cell) => {
        const layer = next.tileLayers[cell.layer];
        if (!layer || layer.locked || layer.editable === false) return;
        layer.cells = removeTileAtCell(next, cell.layer, cell.x, cell.y);
      });
      return { map: next, selectedObjectId: '', selectedObjectIds: [], selectedTileCells: [], historyPast: history.historyPast, historyFuture: history.historyFuture, dirty: true };
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
        selectedTileCells: [],
        selectedTokenId: ''
      };
    });
  },

  selectObjects(objectIds, additive = false) {
    set((state) => {
      const valid = objectIds.filter((id) => findObject(state.map, id));
      const selectedObjectIds = additive ? uniqueList([...state.selectedObjectIds, ...valid]) : uniqueList(valid);
      return {
        selectedObjectId: selectedObjectIds[selectedObjectIds.length - 1] || '',
        selectedObjectIds,
        selectedTileCells: [],
        selectedTokenId: ''
      };
    });
  },

  selectObjectsInRect(rect, additive = false) {
    get().selectArea(rect, additive);
  },

  selectArea(rect, additive = false) {
    set((state) => {
      const minX = Math.min(rect.x, rect.x + rect.width);
      const maxX = Math.max(rect.x, rect.x + rect.width);
      const minY = Math.min(rect.y, rect.y + rect.height);
      const maxY = Math.max(rect.y, rect.y + rect.height);
      const found = getSelectableObjects(state.map)
        .filter((object) => rectsIntersect({ x: object.x, y: object.y, width: object.width * (object.scale || 1), height: object.height * (object.scale || 1) }, { x: minX, y: minY, width: maxX - minX, height: maxY - minY }))
        .map((object) => object.id);
      const foundTiles = getSelectableTileCellsInRect(state.map, { x: minX, y: minY, width: maxX - minX, height: maxY - minY });
      const selectedObjectIds = additive ? uniqueList([...state.selectedObjectIds, ...found]) : uniqueList(found);
      const selectedTileCells = additive ? uniqueTileCells([...state.selectedTileCells, ...foundTiles]) : foundTiles;
      return {
        selectedObjectId: selectedObjectIds[selectedObjectIds.length - 1] || '',
        selectedObjectIds,
        selectedTileCells,
        selectedTokenId: ''
      };
    });
  },

  clearObjectSelection() {
    set({ selectedObjectId: '', selectedObjectIds: [], selectedTileCells: [], selectedTokenId: '' });
  },

  updateSelectedObjects(patch) {
    set((state) => {
      if (!state.selectedObjectIds.length) return state;
      const history = pushHistory(state);
      const next = cloneMap(state.map);
      state.selectedObjectIds.forEach((id) => {
        const object = findObject(next, id);
        if (!object || object.locked) return;
        const previousLayer = object.layer;
        Object.assign(object, patch);
        if (patch.rotation !== undefined) object.rotation = normalizeRotation45(Number(patch.rotation));
        if (patch.hiddenFromPlayers !== undefined) {
          object.hiddenFromPlayers = Boolean(patch.hiddenFromPlayers);
          object.visibleToPlayers = !object.hiddenFromPlayers;
        } else if (patch.visibleToPlayers !== undefined) {
          object.visibleToPlayers = Boolean(patch.visibleToPlayers);
          object.hiddenFromPlayers = !object.visibleToPlayers;
        }
        if (object.light) {
          object.light.x = object.x;
          object.light.y = object.y;
        }
        if (patch.layer && patch.layer !== previousLayer) moveObjectToLayer(next, object.id, patch.layer);
      });
      return { map: next, historyPast: history.historyPast, historyFuture: history.historyFuture, dirty: true };
    });
  },

  centerSelectedOnGrid() {
    set((state) => {
      if (!state.selectedObjectIds.length) return state;
      const history = pushHistory(state);
      const next = cloneMap(state.map);
      state.selectedObjectIds.forEach((id) => {
        const object = findObject(next, id);
        if (!object || object.locked) return;
        object.x = Math.round(object.x / next.gridSize) * next.gridSize;
        object.y = Math.round(object.y / next.gridSize) * next.gridSize;
        if (object.light) {
          object.light.x = object.x;
          object.light.y = object.y;
        }
      });
      return { map: next, historyPast: history.historyPast, historyFuture: history.historyFuture, dirty: true };
    });
  },

  resetSelectedRotation() {
    set((state) => {
      if (!state.selectedObjectIds.length) return state;
      const history = pushHistory(state);
      const next = cloneMap(state.map);
      state.selectedObjectIds.forEach((id) => {
        const object = findObject(next, id);
        if (object && !object.locked) object.rotation = 0;
      });
      return { map: next, historyPast: history.historyPast, historyFuture: history.historyFuture, dirty: true };
    });
  },

  resetSelectedScale() {
    set((state) => {
      if (!state.selectedObjectIds.length) return state;
      const history = pushHistory(state);
      const next = cloneMap(state.map);
      state.selectedObjectIds.forEach((id) => {
        const object = findObject(next, id);
        if (object && !object.locked) object.scale = 1;
      });
      return { map: next, historyPast: history.historyPast, historyFuture: history.historyFuture, dirty: true };
    });
  },

  moveSelectedObjects(deltaX, deltaY, snapOverride = null) {
    set((state) => {
      if (!state.selectedObjectIds.length && !state.selectedTileCells.length) return state;
      const history = pushHistory(state);
      const next = cloneMap(state.map);
      const moveIds = getSelectionWithChildren(next, state.selectedObjectIds);
      moveIds.forEach((id) => {
        const object = findObject(next, id);
        if (!object || object.locked) return;
        const point = snapPoint(next, object.x + deltaX, object.y + deltaY, snapOverride || resolveObjectSnapMode(object, state.snapMode), object.parentId);
        object.x = point.x;
        object.y = point.y;
        if (object.light) {
          object.light.x = object.x;
          object.light.y = object.y;
        }
      });
      const tileDelta = pixelsToCellDelta(next, deltaX, deltaY);
      const selectedTileCells = tileDelta.x || tileDelta.y
        ? moveSelectedTileCells(next, state.selectedTileCells, tileDelta.x, tileDelta.y)
        : state.selectedTileCells;
      return { map: next, selectedTileCells, historyPast: history.historyPast, historyFuture: history.historyFuture, dirty: true };
    });
  },

  nudgeSelectedObjects(deltaX, deltaY) {
    set((state) => {
      if (!state.selectedObjectIds.length && !state.selectedTileCells.length) return state;
      const history = pushHistory(state);
      const next = cloneMap(state.map);
      getSelectionWithChildren(next, state.selectedObjectIds).forEach((id) => {
        const object = findObject(next, id);
        if (!object || object.locked) return;
        object.x += deltaX;
        object.y += deltaY;
        if (object.light) {
          object.light.x = object.x;
          object.light.y = object.y;
        }
      });
      const tileDelta = pixelsToCellDelta(next, deltaX, deltaY);
      const selectedTileCells = tileDelta.x || tileDelta.y
        ? moveSelectedTileCells(next, state.selectedTileCells, tileDelta.x, tileDelta.y)
        : state.selectedTileCells;
      return { map: next, selectedTileCells, historyPast: history.historyPast, historyFuture: history.historyFuture, dirty: true };
    });
  },

  rotateSelectedObjects(delta) {
    set((state) => {
      if (!state.selectedObjectIds.length && !state.selectedTileCells.length) return state;
      const history = pushHistory(state);
      const next = cloneMap(state.map);
      state.selectedObjectIds.forEach((id) => {
        const object = findObject(next, id);
        if (object && !object.locked) object.rotation = normalizeRotation45(object.rotation + delta);
      });
      state.selectedTileCells.forEach((cell) => rotateTileCell(next, cell, delta));
      return { map: next, historyPast: history.historyPast, historyFuture: history.historyFuture, dirty: true };
    });
  },

  rotateSelectedTiles(delta) {
    set((state) => {
      if (!state.selectedTileCells.length) return state;
      const history = pushHistory(state);
      const next = cloneMap(state.map);
      state.selectedTileCells.forEach((cell) => rotateTileCell(next, cell, delta));
      return { map: next, historyPast: history.historyPast, historyFuture: history.historyFuture, dirty: true };
    });
  },

  alignSelectedObjects(mode) {
    set((state) => {
      if (state.selectedObjectIds.length < 2) return state;
      const history = pushHistory(state);
      const next = cloneMap(state.map);
      const objects = state.selectedObjectIds.map((id) => findObject(next, id)).filter(Boolean) as MapObject[];
      if (objects.length < 2) return state;
      if (mode === 'top') {
        const top = Math.min(...objects.map((object) => object.y));
        objects.forEach((object) => {
          if (!object.locked) object.y = top;
        });
      } else {
        const center = average(objects.map((object) => object.x + object.width / 2));
        objects.forEach((object) => {
          if (!object.locked) object.x = center - object.width / 2;
        });
      }
      return { map: next, historyPast: history.historyPast, historyFuture: history.historyFuture, dirty: true };
    });
  },

  distributeSelectedObjects(axis) {
    set((state) => {
      if (state.selectedObjectIds.length < 3) return state;
      const history = pushHistory(state);
      const next = cloneMap(state.map);
      const objects = state.selectedObjectIds.map((id) => findObject(next, id)).filter(Boolean) as MapObject[];
      const sorted = [...objects].sort((left, right) => axis === 'horizontal' ? left.x - right.x : left.y - right.y);
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const span = axis === 'horizontal' ? last.x - first.x : last.y - first.y;
      const step = span / (sorted.length - 1);
      sorted.forEach((object, index) => {
        if (object.locked || index === 0 || index === sorted.length - 1) return;
        if (axis === 'horizontal') object.x = first.x + step * index;
        else object.y = first.y + step * index;
      });
      return { map: next, historyPast: history.historyPast, historyFuture: history.historyFuture, dirty: true };
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
      const history = pushHistory(state);
      const next = cloneMap(state.map);
      state.selectedObjectIds.forEach((id) => {
        const object = findObject(next, id);
        if (!object) return;
        const currentIndex = OBJECT_LAYER_ORDER.indexOf(object.layer);
        const nextLayer = OBJECT_LAYER_ORDER[Math.max(0, Math.min(OBJECT_LAYER_ORDER.length - 1, currentIndex + direction))];
        if (nextLayer) moveObjectToLayer(next, object.id, nextLayer);
      });
      return { map: next, historyPast: history.historyPast, historyFuture: history.historyFuture, dirty: true };
    });
  },

  placeOnSelectedParent() {
    set((state) => {
      if (state.selectedObjectIds.length < 2) return state;
      const history = pushHistory(state);
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
      return { map: next, historyPast: history.historyPast, historyFuture: history.historyFuture, dirty: true };
    });
  },

  groupSelectedObjects() {
    set((state) => {
      if (state.selectedObjectIds.length < 2) return state;
      const history = pushHistory(state);
      const next = cloneMap(state.map);
      const groupId = createId('grp');
      state.selectedObjectIds.forEach((id) => {
        const object = findObject(next, id);
        if (object) object.groupId = groupId;
      });
      return { map: next, historyPast: history.historyPast, historyFuture: history.historyFuture, dirty: true };
    });
  },

  ungroupSelectedObjects() {
    set((state) => {
      const history = pushHistory(state);
      const next = cloneMap(state.map);
      state.selectedObjectIds.forEach((id) => {
        const object = findObject(next, id);
        if (object) object.groupId = undefined;
      });
      return { map: next, historyPast: history.historyPast, historyFuture: history.historyFuture, dirty: true };
    });
  },

  saveSelectionAsPrefab(name) {
    set((state) => {
      if (!state.selectedObjectIds.length) return state;
      const history = pushHistory(state);
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
      return { map: next, historyPast: history.historyPast, historyFuture: history.historyFuture, dirty: true };
    });
  },

  insertPrefab(prefabId, x, y) {
    set((state) => {
      const prefab = state.map.prefabs?.find((entry) => entry.id === prefabId);
      if (!prefab) return state;
      const history = pushHistory(state);
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
      return { map: next, selectedObjectId: nextIds[0] || '', selectedObjectIds: nextIds, historyPast: history.historyPast, historyFuture: history.historyFuture, dirty: true };
    });
  },

  removePrefab(prefabId) {
    set((state) => ({
      map: { ...state.map, prefabs: (state.map.prefabs || []).filter((prefab) => prefab.id !== prefabId) },
      ...pushHistory(state),
      dirty: true
    }));
  },

  addToken(source, x, y) {
    set((state) => {
      const history = pushHistory(state);
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
      return { map: next, selectedTokenId: token.id, selectedObjectId: '', selectedObjectIds: [], selectedTileCells: [], historyPast: history.historyPast, historyFuture: history.historyFuture, dirty: true };
    });
  },

  moveToken(tokenId, x, y) {
    set((state) => {
      const history = pushHistory(state);
      const next = cloneMap(state.map);
      const token = next.tokens.find((entry) => entry.id === tokenId);
      if (!token || token.locked) return state;
      token.x = Math.max(0, Math.min(next.width - 1, Math.round(x)));
      token.y = Math.max(0, Math.min(next.height - 1, Math.round(y)));
      return { map: next, historyPast: history.historyPast, historyFuture: history.historyFuture, dirty: true };
    });
  },

  updateToken(tokenId, patch) {
    set((state) => {
      const history = pushHistory(state);
      const next = cloneMap(state.map);
      const token = next.tokens.find((entry) => entry.id === tokenId);
      if (!token) return state;
      Object.assign(token, patch);
      return { map: next, historyPast: history.historyPast, historyFuture: history.historyFuture, dirty: true };
    });
  },

  removeToken(tokenId) {
    set((state) => {
      const history = pushHistory(state);
      const next = cloneMap(state.map);
      next.tokens = next.tokens.filter((entry) => entry.id !== tokenId);
      return { map: next, selectedTokenId: '', historyPast: history.historyPast, historyFuture: history.historyFuture, dirty: true };
    });
  },

  selectToken(tokenId) {
    set({ selectedTokenId: tokenId, selectedObjectId: '', selectedObjectIds: [], selectedTileCells: [] });
  },

  setLayerVisibility(layer, visible) {
    set((state) => ({ map: patchLayer(state.map, layer, { visible }), ...pushHistory(state), dirty: true }));
  },

  setLayerLocked(layer, locked) {
    set((state) => ({ map: patchLayer(state.map, layer, { locked }), ...pushHistory(state), dirty: true }));
  },

  setLayerOpacity(layer, opacity) {
    set((state) => ({ map: patchLayer(state.map, layer, { opacity: Math.max(0, Math.min(1, opacity)) }), ...pushHistory(state), dirty: true }));
  },

  toggleActiveLayerLock() {
    set((state) => {
      const current = getLayerState(state.map, state.map.activeLayer);
      if (!('locked' in current)) return state;
      return { map: patchLayer(state.map, state.map.activeLayer, { locked: !current.locked }), ...pushHistory(state), dirty: true };
    });
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
  const history = pushHistory(state);
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
  return { map: next, historyPast: history.historyPast, historyFuture: history.historyFuture, dirty: true };
}

function pushHistory(state: TabletopStore) {
  return {
    historyPast: [...state.historyPast, cloneMap(state.map)].slice(-80),
    historyFuture: []
  };
}

function getBrushCells(x: number, y: number, size: number) {
  const normalized = Math.max(1, Math.round(size));
  const offset = Math.floor(normalized / 2);
  const cells: Array<{ x: number; y: number }> = [];
  for (let dy = 0; dy < normalized; dy += 1) {
    for (let dx = 0; dx < normalized; dx += 1) {
      cells.push({ x: x + dx - offset, y: y + dy - offset });
    }
  }
  return cells;
}

function isInsideCell(map: OmniMap, x: number, y: number) {
  return x >= 0 && y >= 0 && x < map.width && y < map.height;
}

function isInsidePixel(map: OmniMap, x: number, y: number) {
  return x >= 0 && y >= 0 && x < map.width * map.gridSize && y < map.height * map.gridSize;
}

function eraseCells(map: OmniMap, x: number, y: number, size: number, mode: EraseMode) {
  const cells = getBrushCells(x, y, size).filter((cell) => isInsideCell(map, cell.x, cell.y));
  if (!cells.length) return;
  if (mode === 'activeLayer') {
    eraseLayerCells(map, map.activeLayer, cells);
    return;
  }
  if (mode === 'allUnlocked') {
    const allLayers: MapLayerKey[] = ['floor', 'walls', 'doors', 'collision', 'decoration', 'objects', 'details', 'lighting', 'mechanics', 'notes', 'fog'];
    allLayers.forEach((layer) => eraseLayerCells(map, layer, cells));
    const keys = new Set(cells.map((cell) => `${cell.x}:${cell.y}`));
    map.tokens = map.tokens.filter((token) => token.locked || !keys.has(`${token.x}:${token.y}`));
    return;
  }
  cells.forEach((cell) => eraseTopVisibleCell(map, cell));
}

function erasePoint(map: OmniMap, x: number, y: number, size: number, mode: EraseMode) {
  const cell = {
    x: Math.floor(x / map.gridSize),
    y: Math.floor(y / map.gridSize)
  };
  if (!isInsideCell(map, cell.x, cell.y)) return;
  if (mode === 'topVisible') {
    eraseTopVisiblePoint(map, x, y, cell);
    return;
  }
  if (mode === 'activeLayer' && isObjectLayerKey(map.activeLayer)) {
    eraseObjectLayerAtPoint(map, map.activeLayer, x, y);
    return;
  }
  if (mode === 'allUnlocked') {
    eraseCells(map, cell.x, cell.y, size, mode);
    ['notes', 'mechanics', 'lighting', 'details', 'objects', 'decoration'].forEach((layer) => eraseObjectLayerAtPoint(map, layer as MapLayerKey, x, y));
    return;
  }
  eraseCells(map, cell.x, cell.y, size, mode);
}

function eraseLayerCells(map: OmniMap, layer: MapLayerKey, cells: Array<{ x: number; y: number }>) {
  if (layer === 'floor' || layer === 'walls' || layer === 'doors' || layer === 'collision') {
    const target = map.tileLayers[layer];
    if (!target.visible || target.locked || target.editable === false) return;
    cells.forEach((cell) => {
      target.cells = removeTileAtCell(map, layer, cell.x, cell.y);
    });
    return;
  }
  if (layer === 'fog') {
    if (!map.fogLayer.visible || map.fogLayer.locked || map.fogLayer.editable === false) return;
    const keys = new Set(cells.map((cell) => `${cell.x}:${cell.y}`));
    map.fogLayer.revealedCells = map.fogLayer.revealedCells.filter((cell) => !keys.has(`${cell.x}:${cell.y}`));
    return;
  }
  const objectLayer = getObjectLayer(map, layer);
  if (!objectLayer || !objectLayer.visible || objectLayer.locked || objectLayer.editable === false) return;
  const points = cells.map((cell) => cellCenter(map, cell));
  objectLayer.objects = objectLayer.objects.filter((object) => object.locked || !points.some((point) => objectContainsPoint(object, point.x, point.y)));
}

function eraseTopVisibleCell(map: OmniMap, cell: { x: number; y: number }) {
  const point = cellCenter(map, cell);
  eraseTopVisiblePoint(map, point.x, point.y, cell);
}

function eraseTopVisiblePoint(map: OmniMap, x: number, y: number, cell: { x: number; y: number }) {
  const token = [...map.tokens].reverse().find((entry) => entry.x === cell.x && entry.y === cell.y && !entry.locked);
  if (token) {
    map.tokens = map.tokens.filter((entry) => entry.id !== token.id);
    return;
  }
  const noteLayer = getObjectLayer(map, 'notes');
  if (noteLayer && noteLayer.visible && !noteLayer.locked && noteLayer.editable !== false) {
    const noteHit = [...noteLayer.objects]
      .sort((left, right) => right.zIndex - left.zIndex)
      .find((object) => !object.locked && objectContainsPoint(object, x, y));
    if (noteHit) {
      removeObjectFromMap(map, noteHit.id);
      return;
    }
  }
  if (map.fogLayer.visible && !map.fogLayer.locked && map.fogLayer.editable !== false) {
    const before = map.fogLayer.revealedCells.length;
    map.fogLayer.revealedCells = map.fogLayer.revealedCells.filter((entry) => entry.x !== cell.x || entry.y !== cell.y);
    if (map.fogLayer.revealedCells.length !== before) return;
  }
  const objectOrder: MapLayerKey[] = ['mechanics', 'lighting', 'details', 'objects', 'decoration'];
  for (const layerKey of objectOrder) {
    const layer = getObjectLayer(map, layerKey);
    if (!layer || !layer.visible || layer.locked || layer.editable === false) continue;
    const hit = [...layer.objects]
      .sort((left, right) => right.zIndex - left.zIndex)
      .find((object) => !object.locked && objectContainsPoint(object, x, y));
    if (hit) {
      removeObjectFromMap(map, hit.id);
      return;
    }
  }
  const tileOrder: TileLayerKey[] = ['doors', 'walls', 'collision', 'floor'];
  for (const layerKey of tileOrder) {
    const layer = map.tileLayers[layerKey];
    if (!layer.visible || layer.locked || layer.editable === false) continue;
    if (!findTileAtCell(map, layerKey, cell.x, cell.y)) continue;
    layer.cells = removeTileAtCell(map, layerKey, cell.x, cell.y);
    return;
  }
}

function eraseObjectLayerAtPoint(map: OmniMap, layerKey: MapLayerKey, x: number, y: number) {
  const layer = getObjectLayer(map, layerKey);
  if (!layer || !layer.visible || layer.locked || layer.editable === false) return;
  const hit = [...layer.objects]
    .sort((left, right) => right.zIndex - left.zIndex)
    .find((object) => !object.locked && objectContainsPoint(object, x, y));
  if (hit) removeObjectFromMap(map, hit.id);
}

function isObjectLayerKey(layer: MapLayerKey) {
  return layer === 'decoration' || layer === 'objects' || layer === 'details' || layer === 'lighting' || layer === 'mechanics' || layer === 'notes';
}

function cellCenter(map: OmniMap, cell: { x: number; y: number }) {
  return {
    x: cell.x * map.gridSize + map.gridSize / 2,
    y: cell.y * map.gridSize + map.gridSize / 2
  };
}

function objectContainsPoint(object: MapObject, x: number, y: number) {
  const width = object.width * (object.scale || 1);
  const height = object.height * (object.scale || 1);
  return x >= object.x && x <= object.x + width && y >= object.y && y <= object.y + height;
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

function resolveObjectSnapMode(object: MapObject, globalSnapMode: SnapMode): SnapMode {
  if (globalSnapMode === 'grid' || globalSnapMode === 'fine' || globalSnapMode === 'object') return globalSnapMode;
  return object.snapMode || 'free';
}

function getObjectTargetLayer(map: OmniMap, assetId: string): MapLayerKey | undefined {
  const asset = getAssetFromMap(map, assetId);
  const assetLayer = asset?.defaultLayer;
  const active = map.activeLayer;
  const objectLayers: MapLayerKey[] = ['details', 'decoration', 'objects', 'lighting', 'mechanics', 'notes'];
  if (objectLayers.includes(active)) return active;
  if (assetLayer && objectLayers.includes(assetLayer)) return assetLayer;
  return undefined;
}

function getAssetFromMap(map: OmniMap, assetId: string | undefined) {
  if (!assetId) return null;
  return map.tilesets.flatMap((tileset) => tileset.assets).find((entry) => entry.id === assetId) || null;
}

function getNextLayerZIndex(map: OmniMap, layer?: MapLayerKey) {
  const objects = layer ? getObjectLayer(map, layer)?.objects || [] : getAllMapObjects(map);
  return Math.max(0, ...objects.map((object) => object.zIndex)) + 1;
}

function getSelectionWithChildren(map: OmniMap, selectedIds: string[]) {
  const ids = new Set(selectedIds);
  let changed = true;
  while (changed) {
    changed = false;
    getAllMapObjects(map).forEach((object) => {
      if (object.parentId && ids.has(object.parentId) && !ids.has(object.id)) {
        ids.add(object.id);
        changed = true;
      }
    });
  }
  return Array.from(ids);
}

function getSelectableObjects(map: OmniMap) {
  return [map.decorationLayer, map.objectLayer, map.detailLayer, map.lightingLayer, map.mechanicalLayer, map.notesLayer]
    .filter((layer) => layer.visible && !layer.locked && layer.selectable !== false)
    .flatMap((layer) => layer.objects.filter((object) => !object.locked));
}

function getSelectableTileCellsInRect(map: OmniMap, rect: { x: number; y: number; width: number; height: number }): SelectedTileCell[] {
  const layers: TileLayerKey[] = ['floor', 'walls', 'doors', 'collision'];
  return layers.flatMap((layerKey) => {
    const layer = map.tileLayers[layerKey];
    if (!layer.visible || layer.locked || layer.selectable === false) return [];
    return layer.cells
      .filter((cell) => rectsIntersect(getTileBounds(map, cell), rect))
      .map((cell) => ({ layer: layerKey, x: cell.x, y: cell.y }));
  });
}

function rectsIntersect(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number }
) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function getTileBounds(map: OmniMap, cell: { x: number; y: number; footprint?: { w: number; h: number }; rotation?: number }) {
  const footprint = resolveFootprint(cell.footprint, cell.rotation || 0);
  return {
    x: cell.x * map.gridSize,
    y: cell.y * map.gridSize,
    width: footprint.w * map.gridSize,
    height: footprint.h * map.gridSize
  };
}

function findTileAtCell(map: OmniMap, layerKey: TileLayerKey, x: number, y: number) {
  return map.tileLayers[layerKey].cells.find((cell) => {
    const footprint = resolveFootprint(cell.footprint, cell.rotation || 0);
    return x >= cell.x && x < cell.x + footprint.w && y >= cell.y && y < cell.y + footprint.h;
  }) || null;
}

function removeTileAtCell(map: OmniMap, layerKey: TileLayerKey, x: number, y: number) {
  const hit = findTileAtCell(map, layerKey, x, y);
  if (!hit) return map.tileLayers[layerKey].cells;
  return removeTileCell(map.tileLayers[layerKey].cells, hit.x, hit.y);
}

function rotateTileCell(map: OmniMap, selected: SelectedTileCell, delta: number) {
  const layer = map.tileLayers[selected.layer];
  if (!layer || layer.locked || layer.editable === false) return;
  const cell = findTileAtCell(map, selected.layer, selected.x, selected.y);
  if (!cell) return;
  cell.rotation = normalizeRotation45((cell.rotation || 0) + delta);
}

function moveSelectedTileCells(map: OmniMap, selected: SelectedTileCell[], dx: number, dy: number) {
  const originals = uniqueTileCells(selected).map((cell) => {
    const layer = map.tileLayers[cell.layer];
    if (!layer || layer.locked || layer.editable === false) return null;
    const original = findTileAtCell(map, cell.layer, cell.x, cell.y);
    if (!original) return null;
    return { layerKey: cell.layer, original: { ...original } };
  }).filter(Boolean) as Array<{ layerKey: TileLayerKey; original: NonNullable<ReturnType<typeof findTileAtCell>> }>;
  const moved: SelectedTileCell[] = [];
  originals.forEach(({ layerKey, original }) => {
    const layer = map.tileLayers[layerKey];
    layer.cells = removeTileCell(layer.cells, original.x, original.y);
  });
  originals.forEach(({ layerKey, original }) => {
    const layer = map.tileLayers[layerKey];
    const nextX = Math.max(0, Math.min(map.width - 1, original.x + dx));
    const nextY = Math.max(0, Math.min(map.height - 1, original.y + dy));
    layer.cells = setTileCell(layer.cells, nextX, nextY, original.assetId, original.rotation || 0, original.footprint);
    moved.push({ layer: layerKey, x: nextX, y: nextY });
  });
  return uniqueTileCells(moved);
}

function pixelsToCellDelta(map: OmniMap, deltaX: number, deltaY: number) {
  return {
    x: Math.trunc(deltaX / map.gridSize),
    y: Math.trunc(deltaY / map.gridSize)
  };
}

function resolveFootprint(footprint: { w: number; h: number } | undefined, rotation: number) {
  const base = footprint || { w: 1, h: 1 };
  const normalized = normalizeRotation45(rotation);
  return normalized === 90 || normalized === 270 ? { w: base.h, h: base.w } : base;
}

function uniqueTileCells(values: SelectedTileCell[]) {
  const seen = new Set<string>();
  return values.filter((cell) => {
    const key = `${cell.layer}:${cell.x}:${cell.y}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function uniqueList(values: string[]) {
  return Array.from(new Set(values));
}

function normalizeRotation45(value: number) {
  const snapped = Math.round(value / 45) * 45;
  const normalized = snapped % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
}

function patchLayer(map: OmniMap, layer: MapLayerKey, patch: { visible?: boolean; locked?: boolean; opacity?: number }) {
  const next = cloneMap(map);
  if (layer === 'floor' || layer === 'walls' || layer === 'doors' || layer === 'collision') {
    Object.assign(next.tileLayers[layer], patch);
  } else if (layer === 'fog') {
    Object.assign(next.fogLayer, patch);
  } else {
    const objectLayer = getObjectLayer(next, layer);
    if (objectLayer) Object.assign(objectLayer, patch);
  }
  return next;
}

function getLayerState(map: OmniMap, layer: MapLayerKey) {
  if (layer === 'floor' || layer === 'walls' || layer === 'doors' || layer === 'collision') return map.tileLayers[layer];
  if (layer === 'objects') return map.objectLayer;
  if (layer === 'decoration') return map.decorationLayer;
  if (layer === 'details') return map.detailLayer;
  if (layer === 'lighting') return map.lightingLayer;
  if (layer === 'mechanics') return map.mechanicalLayer;
  if (layer === 'notes') return map.notesLayer;
  if (layer === 'fog') return map.fogLayer;
  return { visible: true, locked: false, opacity: 1 };
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
