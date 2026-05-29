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
  AreaTemplate,
  AssetDefinition,
  AvailableTabletopToken,
  EraseMode,
  LightingRegion,
  MapLayerKey,
  MapObject,
  MapPrefab,
  MapTool,
  OmniMap,
  SelectedTileCell,
  SessionSelectedEntity,
  SessionLightingState,
  SessionMapInstance,
  SnapMode,
  TabletopMode,
  TabletopToken,
  TileCell,
  TileLayerKey
} from './types';

export type TabletopRole = 'gm' | 'player';

export type TokenMoveCheck = {
  ok: boolean;
  reason?: 'wall' | 'door' | 'collision' | 'token' | 'object' | 'locked' | 'permission';
  blockers?: string[];
  tokenId?: string;
  tokenName?: string;
  currentCell?: { x: number; y: number };
  targetCell?: { x: number; y: number };
  canControl?: boolean;
  locked?: boolean;
  userRole?: string;
  tabletopRole?: string;
  viewMode?: string;
};

interface TabletopStore {
  map: OmniMap;
  tabletopRole: TabletopRole;
  currentUserId: string;
  currentCharacterId: string;
  ownedCharacterIds: string[];
  lastTokenMoveCheck: TokenMoveCheck | null;
  tool: MapTool;
  selectedAssetId: string;
  selectedObjectId: string;
  selectedObjectIds: string[];
  selectedTileCells: SelectedTileCell[];
  selectedMapInstanceIds: string[];
  selectedRegionIds: string[];
  selectedEntities: SessionSelectedEntity[];
  selectedTokenId: string;
  selectedTokenIds: string[];
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
  sessionViewMode: 'gm' | 'player-preview';
  sessionDynamicVision: boolean;
  sessionFogEnabled: boolean;
  sessionIgnoreCollision: boolean;
  sessionGlobalDarkness: number;
  sessionRegionPreset: 'light' | 'dark' | 'gm' | 'fog' | null;
  historyPast: OmniMap[];
  historyFuture: OmniMap[];
  dirty: boolean;
  setTabletopIdentity(role: TabletopRole, userId?: string, characterIds?: string[]): void;
  setMap(map: Partial<OmniMap>): void;
  newMap(name: string, width: number, height: number, gridSize: number): void;
  setMapMeta(patch: Partial<Pick<OmniMap, 'name' | 'description' | 'theme' | 'tags' | 'thumbnail' | 'width' | 'height' | 'gridSize' | 'metersPerCell' | 'bounds'>>): void;
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
  resetPlacementRotation(): void;
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
  paintBrushCells(cells: Array<{ x: number; y: number }>, layer?: MapLayerKey, assetId?: string, size?: number): void;
  eraseBrush(x: number, y: number, size?: number): void;
  eraseBrushCells(cells: Array<{ x: number; y: number }>, size?: number): void;
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
  setSelection(entities: SessionSelectedEntity[]): void;
  addToSelection(entities: SessionSelectedEntity[]): void;
  toggleSelection(entity: SessionSelectedEntity): void;
  clearSelection(): void;
  selectEntity(entity: SessionSelectedEntity, additive?: boolean): void;
  getSelectionSummary(): { tokens: number; maps: number; objects: number; regions: number; templates: number; doors: number; total: number };
  selectObjects(objectIds: string[], additive?: boolean): void;
  selectObjectsInRect(rect: { x: number; y: number; width: number; height: number }, additive?: boolean): void;
  selectArea(rect: { x: number; y: number; width: number; height: number }, additive?: boolean): void;
  selectSessionArea(rect: { x: number; y: number; width: number; height: number }, additive?: boolean): void;
  clearObjectSelection(): void;
  clearSessionSelection(): void;
  updateSelectedTiles(patch: Partial<TileCell>): void;
  updateSelectedObjects(patch: Partial<MapObject>): void;
  moveSelectedObjects(deltaX: number, deltaY: number, snapOverride?: SnapMode | null): void;
  moveSelectedSessionItems(deltaX: number, deltaY: number): void;
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
  moveTokensTo(positions: Record<string, { x: number; y: number }>): void;
  moveSelectedTokens(deltaX: number, deltaY: number): void;
  updateToken(tokenId: string, patch: Partial<TabletopToken>): void;
  updateSelectedTokens(patch: Partial<TabletopToken>): void;
  removeToken(tokenId: string): void;
  removeSelectedTokens(): void;
  selectToken(tokenId: string, additive?: boolean): void;
  selectTokens(tokenIds: string[], additive?: boolean): void;
  setSessionViewMode(mode: 'gm' | 'player-preview'): void;
  setSessionDynamicVision(value: boolean): void;
  setSessionFogEnabled(value: boolean): void;
  setSessionIgnoreCollision(value: boolean): void;
  setSessionGlobalDarkness(value: number): void;
  setSessionRegionPreset(preset: TabletopStore['sessionRegionPreset']): void;
  updateSessionLighting(patch: Partial<SessionLightingState>): void;
  addLightingRegion(region: LightingRegion): void;
  updateLightingRegion(regionId: string, patch: Partial<LightingRegion>): void;
  removeLightingRegion(regionId: string): void;
  selectLightingRegion(regionId: string, additive?: boolean): void;
  moveSelectedLightingRegions(deltaX: number, deltaY: number): void;
  removeSelectedLightingRegions(): void;
  addAreaTemplate(template: AreaTemplate): void;
  addSessionMapInstance(sourceMap: OmniMap, x?: number, y?: number, options?: { locked?: boolean; rotation?: number; name?: string }): void;
  updateSessionMapInstance(instanceId: string, patch: Partial<SessionMapInstance>): void;
  removeSessionMapInstance(instanceId: string): void;
  duplicateSessionMapInstance(instanceId: string): void;
  selectMapInstance(instanceId: string, additive?: boolean): void;
  moveSelectedMapInstances(deltaX: number, deltaY: number): void;
  toggleDoorAt(x: number, y: number): void;
  setDoorStateAt(x: number, y: number, state: NonNullable<TileCell['doorState']>): void;
  setLayerVisibility(layer: MapLayerKey, visible: boolean): void;
  setLayerLocked(layer: MapLayerKey, locked: boolean): void;
  setLayerOpacity(layer: MapLayerKey, opacity: number): void;
  toggleActiveLayerLock(): void;
  revealFogCell(x: number, y: number): void;
  hideFogCell(x: number, y: number): void;
  revealAllFog(): void;
  hideAllFog(): void;
}

const OBJECT_LAYER_ORDER: MapLayerKey[] = ['decoration', 'objects', 'details', 'lighting', 'mechanics', 'notes'];
const PLAYER_TOOLS = new Set<MapTool>(['select', 'move-token', 'pan', 'measure', 'ping', 'token']);
type MovementBlock = { reason: NonNullable<TokenMoveCheck['reason']>; blockers: string[] };
type MovementIndex = {
  blocksByCell: Map<string, MovementBlock>;
  tokensByCell: Map<string, string[]>;
};
const movementIndexCache = new WeakMap<OmniMap, MovementIndex>();

export const useTabletopStore = create<TabletopStore>((set, get) => ({
  map: createBlankMap('Novo mapa'),
  tabletopRole: 'gm',
  currentUserId: '',
  currentCharacterId: '',
  ownedCharacterIds: [],
  lastTokenMoveCheck: null,
  tool: 'brush',
  selectedAssetId: 'floor-baixo-asphalt',
  selectedObjectId: '',
  selectedObjectIds: [],
  selectedTileCells: [],
  selectedMapInstanceIds: [],
  selectedRegionIds: [],
  selectedEntities: [],
  selectedTokenId: '',
  selectedTokenIds: [],
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
  sessionViewMode: 'gm',
  sessionDynamicVision: true,
  sessionFogEnabled: false,
  sessionIgnoreCollision: false,
  sessionGlobalDarkness: 0,
  sessionRegionPreset: null,
  historyPast: [],
  historyFuture: [],
  dirty: false,

  setTabletopIdentity(role, userId = '', characterIds = []) {
    const ownedCharacterIds = uniqueList(characterIds.map(String).filter(Boolean));
    set((state) => ({
      tabletopRole: role,
      currentUserId: userId,
      currentCharacterId: ownedCharacterIds[0] || '',
      ownedCharacterIds,
      sessionViewMode: role === 'player' ? 'player-preview' : 'gm',
      tool: role === 'player' && !PLAYER_TOOLS.has(state.tool) ? 'select' : normalizeToolForMode(state.tool, state.map.mode, role)
    }));
  },

  setMap(map) {
    const normalized = normalizeMap(map);
    set({
      map: normalized,
      selectedObjectId: '',
      selectedObjectIds: [],
      selectedTileCells: [],
      selectedMapInstanceIds: [],
      selectedRegionIds: [],
      selectedEntities: [],
      selectedTokenId: '',
      selectedTokenIds: [],
      soloLayer: null,
      sessionGlobalDarkness: normalized.sessionLighting?.darkness ?? get().sessionGlobalDarkness,
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
      selectedMapInstanceIds: [],
      selectedRegionIds: [],
      selectedEntities: [],
      selectedTokenId: '',
      selectedTokenIds: [],
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
    set((state) => {
      const nextMode = state.tabletopRole === 'player' ? 'session' : mode;
      return { map: { ...state.map, mode: nextMode }, tool: normalizeToolForMode(state.tool, nextMode, state.tabletopRole), selectedObjectId: '', selectedObjectIds: [], selectedTileCells: [], selectedMapInstanceIds: [], selectedRegionIds: [], selectedEntities: [], selectedTokenId: '', selectedTokenIds: [], ...pushHistory(state), dirty: true };
    });
  },

  setTool(tool) {
    set((state) => ({ tool: normalizeToolForMode(tool, state.map.mode, state.tabletopRole) }));
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

  resetPlacementRotation() {
    set({ placementRotation: 0 });
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
        selectedMapInstanceIds: [],
        selectedRegionIds: [],
        selectedEntities: [],
        selectedTokenId: '',
        selectedTokenIds: [],
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
        selectedMapInstanceIds: [],
        selectedRegionIds: [],
        selectedEntities: [],
        selectedTokenId: '',
        selectedTokenIds: [],
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
      const next = cloneMap(state.map);
      if (targetLayer === 'floor' || targetLayer === 'walls' || targetLayer === 'doors' || targetLayer === 'collision') {
        if (next.tileLayers[targetLayer].locked || next.tileLayers[targetLayer].editable === false) return state;
        const asset = getAssetFromMap(next, selectedAsset);
        next.tileLayers[targetLayer].cells = setTileCell(next.tileLayers[targetLayer].cells, x, y, selectedAsset, state.placementRotation, asset?.gridFootprint, getTileMetaForAsset(asset, targetLayer));
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
          target.cells = setTileCell(target.cells, cell.x, cell.y, selectedAsset, state.placementRotation, asset?.gridFootprint, getTileMetaForAsset(asset, targetLayer));
        });
        return { map: next, dirty: true };
      }
      if (targetLayer === 'fog') {
        if (next.fogLayer.locked || next.fogLayer.editable === false) return state;
        const existing = new Set(next.fogLayer.revealedCells.map((cell) => `${cell.x}:${cell.y}`));
        getBrushCells(x, y, brushSize).forEach((cell) => {
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

  paintBrushCells(cells, layer, assetId, size) {
    if (!cells.length) return;
    const targetLayer = layer || get().map.activeLayer;
    const selectedAsset = assetId || get().selectedAssetId;
    const brushSize = size || get().brushSize;
    if (!selectedAsset && targetLayer !== 'fog') return;
    set((state) => {
      const next = cloneMap(state.map);
      if (targetLayer === 'floor' || targetLayer === 'walls' || targetLayer === 'doors' || targetLayer === 'collision') {
        const target = next.tileLayers[targetLayer];
        if (target.locked || target.editable === false) return state;
        const paintAssetId = resolvePaintAssetId(next, selectedAsset, targetLayer);
        if (!paintAssetId) return state;
        const asset = getAssetFromMap(next, paintAssetId);
        const visited = new Set<string>();
        cells.forEach((center) => {
          getBrushCells(center.x, center.y, brushSize).forEach((cell) => {
            const key = `${cell.x}:${cell.y}`;
            if (visited.has(key)) return;
            visited.add(key);
            target.cells = setTileCell(target.cells, cell.x, cell.y, paintAssetId, state.placementRotation, asset?.gridFootprint, getTileMetaForAsset(asset, targetLayer));
          });
        });
        return { map: next, dirty: true };
      }
      if (targetLayer === 'fog') {
        if (next.fogLayer.locked || next.fogLayer.editable === false) return state;
        const existing = new Set(next.fogLayer.revealedCells.map((cell) => `${cell.x}:${cell.y}`));
        cells.forEach((center) => {
          getBrushCells(center.x, center.y, brushSize).forEach((cell) => {
            const key = `${cell.x}:${cell.y}`;
            if (existing.has(key)) return;
            existing.add(key);
            next.fogLayer.revealedCells.push({ x: cell.x, y: cell.y });
          });
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
      return { map: next, dirty: true, selectedObjectId: '', selectedObjectIds: [], selectedTileCells: [], selectedMapInstanceIds: [], selectedRegionIds: [], selectedEntities: [], selectedTokenId: '', selectedTokenIds: [] };
    });
  },

  eraseBrushCells(cells, size) {
    if (!cells.length) return;
    const brushSize = size || get().brushSize;
    set((state) => {
      const next = cloneMap(state.map);
      const visited = new Set<string>();
      cells.forEach((center) => {
        getBrushCells(center.x, center.y, brushSize).forEach((cell) => {
          const key = `${cell.x}:${cell.y}`;
          if (visited.has(key)) return;
          visited.add(key);
          eraseCells(next, cell.x, cell.y, 1, state.eraseMode);
        });
      });
      return { map: next, dirty: true, selectedObjectId: '', selectedObjectIds: [], selectedTileCells: [], selectedMapInstanceIds: [], selectedRegionIds: [], selectedEntities: [], selectedTokenId: '', selectedTokenIds: [] };
    });
  },

  eraseBrushAtPoint(x, y, size) {
    const brushSize = size || get().brushSize;
    set((state) => {
      const next = cloneMap(state.map);
      erasePoint(next, x, y, brushSize, state.eraseMode);
      return { map: next, dirty: true, selectedObjectId: '', selectedObjectIds: [], selectedTileCells: [], selectedMapInstanceIds: [], selectedRegionIds: [], selectedEntities: [], selectedTokenId: '', selectedTokenIds: [] };
    });
  },

  eraseAt(x, y) {
    set((state) => {
      const next = cloneMap(state.map);
      erasePoint(next, x, y, 1, state.eraseMode);
      return { map: next, dirty: true, selectedObjectId: '', selectedObjectIds: [], selectedTileCells: [], selectedMapInstanceIds: [], selectedRegionIds: [], selectedEntities: [], selectedTokenId: '', selectedTokenIds: [] };
    });
  },

  addObject(assetId, x, y, parentId) {
    set((state) => {
      const allowBoardPlacement = state.map.mode === 'build' || state.map.mode === 'session' || Boolean(state.map.sessionMapInstances?.length);
      if (!allowBoardPlacement && !isInsidePixel(state.map, x, y)) return state;
      const history = pushHistory(state);
      const next = cloneMap(state.map);
      const layer = getObjectTargetLayer(next, assetId);
      const object = buildMapObject(assetId, x, y, layer, getNextLayerZIndex(next, layer), next.tilesets);
      object.rotation = normalizeRotation45(state.placementRotation);
      if (object.zIndex < 1) object.zIndex = getNextLayerZIndex(next, layer);
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
      return { map: next, selectedObjectId: object.id, selectedObjectIds: [object.id], selectedEntities: [{ type: 'object' as const, id: object.id }], selectedTileCells: [], selectedTokenId: '', selectedTokenIds: [], historyPast: history.historyPast, historyFuture: history.historyFuture, dirty: true };
    });
  },

  addDoor(x, y, assetId, rotation) {
    const currentAssetId = assetId || get().selectedAssetId;
    const currentAsset = currentAssetId ? getAssetFromMap(get().map, currentAssetId) : null;
    const selectedAsset = currentAsset?.kind === 'door' || currentAsset?.defaultLayer === 'doors' ? currentAssetId : 'door-metal';
    if (!selectedAsset) return;
    set((state) => {
      const history = pushHistory(state);
      const next = cloneMap(state.map);
      const target = next.tileLayers.doors;
      if (target.locked || target.editable === false) return state;
      const asset = getAssetFromMap(next, selectedAsset);
      const doorState = 'closed';
      target.cells = setTileCell(
        target.cells,
        x,
        y,
        selectedAsset,
        normalizeRotation45(rotation ?? state.placementRotation),
        asset?.gridFootprint || { w: 1, h: 1 },
        {
          doorState,
          blocksMovement: Boolean(asset?.defaultBlocksMovement ?? asset?.blocksMovement ?? true),
          blocksVision: Boolean(asset?.defaultBlocksVision ?? asset?.blocksVision ?? true),
          interactable: true
        }
      );
      const selectedTileCells = [{ layer: 'doors' as TileLayerKey, x, y }];
      return {
        map: next,
        selectedObjectId: '',
        selectedObjectIds: [],
        selectedTileCells,
        selectedEntities: [{ type: 'door' as const, id: `door-${x}-${y}`, x, y }],
        selectedTokenId: '',
        selectedTokenIds: [],
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
        layer.cells = setTileCell(layer.cells, target.x, target.y, original.assetId, original.rotation || 0, original.footprint, copyTileMeta(original));
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
      return { map: next, selectedObjectId: '', selectedObjectIds: [], selectedTileCells: [], selectedMapInstanceIds: [], selectedRegionIds: [], selectedEntities: [], selectedTokenId: '', selectedTokenIds: [], historyPast: history.historyPast, historyFuture: history.historyFuture, dirty: true };
    });
  },

  setSelection(entities) {
    set((state) => selectionPatchFromEntities(state, entities));
  },

  addToSelection(entities) {
    set((state) => selectionPatchFromEntities(state, [...state.selectedEntities, ...entities]));
  },

  toggleSelection(entity) {
    set((state) => {
      const key = selectionEntityKey(entity);
      const exists = state.selectedEntities.some((entry) => selectionEntityKey(entry) === key);
      const entities = exists
        ? state.selectedEntities.filter((entry) => selectionEntityKey(entry) !== key)
        : [...state.selectedEntities, entity];
      return selectionPatchFromEntities(state, entities);
    });
  },

  clearSelection() {
    get().clearSessionSelection();
  },

  selectEntity(entity, additive = false) {
    set((state) => {
      const entities = additive ? toggleSelectionList(state.selectedEntities, entity) : [entity];
      return selectionPatchFromEntities(state, entities);
    });
  },

  getSelectionSummary() {
    const state = get();
    const tokens = state.selectedTokenIds.length;
    const maps = state.selectedMapInstanceIds.length;
    const objects = state.selectedObjectIds.length;
    const regions = state.selectedRegionIds.length;
    const templates = state.selectedEntities.filter((entry) => entry.type === 'template').length;
    const doors = state.selectedTileCells.length;
    return { tokens, maps, objects, regions, templates, doors, total: tokens + maps + objects + regions + templates + doors };
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
        selectedMapInstanceIds: [],
        selectedRegionIds: [],
        selectedEntities: [
          ...(additive ? state.selectedEntities.filter((entry) => entry.type !== 'object') : []),
          ...selectedObjectIds.map((id) => ({ type: 'object' as const, id }))
        ],
        selectedTokenId: '',
        selectedTokenIds: []
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
        selectedMapInstanceIds: [],
        selectedRegionIds: [],
        selectedEntities: [
          ...(additive ? state.selectedEntities.filter((entry) => entry.type !== 'object') : []),
          ...selectedObjectIds.map((id) => ({ type: 'object' as const, id }))
        ],
        selectedTokenId: '',
        selectedTokenIds: []
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
        selectedTokenId: '',
        selectedTokenIds: []
      };
    });
  },

  selectSessionArea(rect, additive = false) {
    set((state) => {
      const minX = Math.min(rect.x, rect.x + rect.width);
      const maxX = Math.max(rect.x, rect.x + rect.width);
      const minY = Math.min(rect.y, rect.y + rect.height);
      const maxY = Math.max(rect.y, rect.y + rect.height);
      const area = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
      const tokenIds = state.map.tokens
        .filter((token) => !token.hidden || state.sessionViewMode === 'gm')
        .filter((token) => rectsIntersect(getTokenBounds(state.map, token), area))
        .map((token) => token.id);
      const objectIds = getSessionSelectableObjects(state.map)
        .filter((object) => rectsIntersect({ x: object.x, y: object.y, width: object.width * (object.scale || 1), height: object.height * (object.scale || 1) }, area))
        .map((object) => object.id);
      const doors = getSelectableTileCellsInRect(state.map, area).filter((cell) => cell.layer === 'doors');
      const mapInstanceIds = (state.map.sessionMapInstances || [])
        .filter((instance) => rectsIntersect(getMapInstanceBounds(instance), area))
        .map((instance) => instance.id);
      const selectedTokenIds = additive ? uniqueList([...state.selectedTokenIds, ...tokenIds]) : uniqueList(tokenIds);
      const selectedObjectIds = additive ? uniqueList([...state.selectedObjectIds, ...objectIds]) : uniqueList(objectIds);
      const selectedTileCells = additive ? uniqueTileCells([...state.selectedTileCells, ...doors]) : doors;
      const selectedMapInstanceIds = additive ? uniqueList([...state.selectedMapInstanceIds, ...mapInstanceIds]) : uniqueList(mapInstanceIds);
      const regionIds = (state.map.sessionLighting?.regions || state.map.lightingRegions || [])
        .filter((region) => rectsIntersect(getLightingRegionBounds(region), area))
        .map((region) => region.id);
      const selectedRegionIds = additive ? uniqueList([...state.selectedRegionIds, ...regionIds]) : uniqueList(regionIds);
      const selectedEntities: SessionSelectedEntity[] = [
        ...selectedTokenIds.map((id) => ({ type: 'token' as const, id })),
        ...selectedObjectIds.map((id) => ({ type: 'object' as const, id })),
        ...selectedMapInstanceIds.map((id) => ({ type: 'map' as const, id })),
        ...selectedRegionIds.map((id) => ({ type: 'region' as const, id })),
        ...selectedTileCells.map((cell) => ({ type: 'door' as const, id: `door-${cell.x}-${cell.y}`, x: cell.x, y: cell.y }))
      ];
      return {
        selectedTokenId: selectedTokenIds[selectedTokenIds.length - 1] || '',
        selectedTokenIds,
        selectedObjectId: selectedObjectIds[selectedObjectIds.length - 1] || '',
        selectedObjectIds,
        selectedMapInstanceIds,
        selectedRegionIds,
        selectedTileCells,
        selectedEntities
      };
    });
  },

  clearObjectSelection() {
    set({ selectedObjectId: '', selectedObjectIds: [], selectedTileCells: [], selectedMapInstanceIds: [], selectedRegionIds: [], selectedEntities: [], selectedTokenId: '', selectedTokenIds: [] });
  },

  clearSessionSelection() {
    set({ selectedObjectId: '', selectedObjectIds: [], selectedTileCells: [], selectedMapInstanceIds: [], selectedRegionIds: [], selectedEntities: [], selectedTokenId: '', selectedTokenIds: [] });
  },

  updateSelectedTiles(patch) {
    set((state) => {
      if (!state.selectedTileCells.length) return state;
      const history = pushHistory(state);
      const next = cloneMap(state.map);
      state.selectedTileCells.forEach((selected) => {
        const layer = next.tileLayers[selected.layer];
        if (!layer || layer.locked || layer.editable === false) return;
        const tile = findTileAtCell(next, selected.layer, selected.x, selected.y);
        if (!tile) return;
        Object.assign(tile, patch);
        if (patch.rotation !== undefined) tile.rotation = normalizeRotation45(Number(patch.rotation));
        if (patch.doorState) {
          tile.doorState = patch.doorState;
          if (patch.doorState === 'open') {
            tile.blocksMovement = false;
            tile.blocksVision = false;
          } else {
            tile.blocksMovement = true;
            tile.blocksVision = true;
          }
          tile.interactable = true;
        }
      });
      return { map: next, historyPast: history.historyPast, historyFuture: history.historyFuture, dirty: true };
    });
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
        definitionId: source.definitionId || source.id,
        characterId: source.kind === 'character' ? source.sourceId : undefined,
        combatantId: source.id.startsWith('combat-') ? source.sourceId : undefined,
        ownerUserId: source.ownerUserId,
        ownerCharacterId: source.ownerCharacterId || (source.kind === 'character' ? source.sourceId : undefined),
        controlledByUserIds: source.controlledByUserIds || (source.ownerUserId ? [source.ownerUserId] : []),
        formOwnerCharacterId: source.formOwnerCharacterId,
        sourceSheetId: source.sourceSheetId,
        sourceFormId: source.sourceFormId,
        isPlayerToken: source.isPlayerToken || source.kind === 'character' || source.kind === 'companion',
        isFormToken: Boolean(source.isFormToken),
        isMiniSheetToken: Boolean(source.isMiniSheetToken),
        isSummonToken: Boolean(source.isSummonToken),
        blocksMovement: source.blocksMovement ?? false,
        kind: source.kind,
        name: source.name,
        image: source.image,
        color: source.color,
        hpCurrent: source.hpCurrent,
        hpMax: source.hpMax,
        peCurrent: undefined,
        peMax: undefined,
        pdCurrent: undefined,
        pdMax: undefined,
        x: Number(x) || 0,
        y: Number(y) || 0,
        positionMode: 'world',
        visibleToPlayers: source.visibleToPlayers !== false,
        locked: Boolean(source.locked),
        hidden: Boolean(source.hidden),
        status: source.status,
        size: source.size || 1,
        visionEnabled: source.visionEnabled !== false,
        visionRadius: source.visionRadius ?? 6,
        dimVisionRadius: source.dimVisionRadius ?? 8,
        brightVisionRadius: source.brightVisionRadius ?? 4,
        lightRadius: source.lightRadius ?? 0,
        auraColor: source.auraColor,
        statusMarkers: source.statusMarkers || [],
        attachedToMapInstanceId: findMapInstanceAtWorldPoint(
          next,
          (Number(x) || 0) + next.gridSize * Math.max(0.5, source.size || 1) / 2,
          (Number(y) || 0) + next.gridSize * Math.max(0.5, source.size || 1) / 2
        )?.id
      };
      next.tokens.push(token);
      markExploredAroundToken(next, token);
      return { map: next, selectedTokenId: token.id, selectedTokenIds: [token.id], selectedEntities: [{ type: 'token' as const, id: token.id }], selectedObjectId: '', selectedObjectIds: [], selectedTileCells: [], selectedMapInstanceIds: [], selectedRegionIds: [], historyPast: history.historyPast, historyFuture: history.historyFuture, dirty: true };
    });
  },

  moveToken(tokenId, x, y) {
    set((state) => {
      const history = pushHistory(state);
      const next = cloneMap(state.map);
      const token = next.tokens.find((entry) => entry.id === tokenId);
      if (!token) return state;
      const nextX = Number.isFinite(Number(x)) ? Number(x) : token.x;
      const nextY = Number.isFinite(Number(y)) ? Number(y) : token.y;
      const check = canMoveTokenToState(state, next, token, nextX, nextY);
      if (!check.ok) return { ...state, lastTokenMoveCheck: check };
      token.x = nextX;
      token.y = nextY;
      token.positionMode = 'world';
      markExploredAroundToken(next, token);
      return { map: next, lastTokenMoveCheck: check, historyPast: history.historyPast, historyFuture: history.historyFuture, dirty: true };
    });
  },

  moveTokensTo(positions) {
    const entries = Object.entries(positions);
    if (!entries.length) return;
    set((state) => {
      const history = pushHistory(state);
      const next = cloneMap(state.map);
      let moved = false;
      let lastTokenMoveCheck: TokenMoveCheck | null = null;

      entries.forEach(([tokenId, point]) => {
        const token = next.tokens.find((entry) => entry.id === tokenId);
        if (!token) return;
        const nextX = Number.isFinite(Number(point.x)) ? Number(point.x) : token.x;
        const nextY = Number.isFinite(Number(point.y)) ? Number(point.y) : token.y;
        const check = canMoveTokenToState(state, next, token, nextX, nextY);
        lastTokenMoveCheck = check;
        if (!check.ok) return;
        if (token.x === nextX && token.y === nextY) return;
        token.x = nextX;
        token.y = nextY;
        token.positionMode = 'world';
        moved = true;
        markExploredAroundToken(next, token);
      });

      if (!moved) return lastTokenMoveCheck ? { ...state, lastTokenMoveCheck } : state;
      return {
        map: next,
        lastTokenMoveCheck,
        historyPast: history.historyPast,
        historyFuture: history.historyFuture,
        dirty: true
      };
    });
  },

  moveSelectedTokens(deltaX, deltaY) {
    set((state) => {
      if (!state.selectedTokenIds.length) return state;
      const history = pushHistory(state);
      const next = cloneMap(state.map);
      let lastTokenMoveCheck: TokenMoveCheck | null = null;
      state.selectedTokenIds.forEach((tokenId) => {
        const token = next.tokens.find((entry) => entry.id === tokenId);
        if (!token) return;
        const nextX = token.x + deltaX;
        const nextY = token.y + deltaY;
        const check = canMoveTokenToState(state, next, token, nextX, nextY);
        if (!check.ok) {
          lastTokenMoveCheck = check;
          return;
        }
        lastTokenMoveCheck = check;
        token.x = nextX;
        token.y = nextY;
        markExploredAroundToken(next, token);
      });
      return { map: next, lastTokenMoveCheck, historyPast: history.historyPast, historyFuture: history.historyFuture, dirty: true };
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

  updateSelectedTokens(patch) {
    set((state) => {
      if (!state.selectedTokenIds.length) return state;
      const history = pushHistory(state);
      const next = cloneMap(state.map);
      state.selectedTokenIds.forEach((tokenId) => {
        const token = next.tokens.find((entry) => entry.id === tokenId);
        if (token && !token.locked) Object.assign(token, patch);
      });
      return { map: next, historyPast: history.historyPast, historyFuture: history.historyFuture, dirty: true };
    });
  },

  removeToken(tokenId) {
    set((state) => {
      const history = pushHistory(state);
      const next = cloneMap(state.map);
      next.tokens = next.tokens.filter((entry) => entry.id !== tokenId);
      const selectedTokenIds = state.selectedTokenIds.filter((id) => id !== tokenId);
      return {
        map: next,
        selectedTokenId: selectedTokenIds[selectedTokenIds.length - 1] || '',
        selectedTokenIds,
        selectedEntities: state.selectedEntities.filter((entry) => !(entry.type === 'token' && entry.id === tokenId)),
        historyPast: history.historyPast,
        historyFuture: history.historyFuture,
        dirty: true
      };
    });
  },

  removeSelectedTokens() {
    set((state) => {
      if (!state.selectedTokenIds.length) return state;
      const history = pushHistory(state);
      const selected = new Set(state.selectedTokenIds);
      const next = cloneMap(state.map);
      next.tokens = next.tokens.filter((entry) => !selected.has(entry.id) || entry.locked);
      return { map: next, selectedTokenId: '', selectedTokenIds: [], selectedEntities: state.selectedEntities.filter((entry) => entry.type !== 'token'), historyPast: history.historyPast, historyFuture: history.historyFuture, dirty: true };
    });
  },

  selectToken(tokenId, additive = false) {
    set((state) => {
      const token = state.map.tokens.find((entry) => entry.id === tokenId);
      const valid = token && canControlTokenInState(state, token);
      if (!valid) return state;
      const selectedTokenIds = additive ? toggleListValue(state.selectedTokenIds, tokenId) : [tokenId];
      return {
        selectedTokenId: selectedTokenIds[selectedTokenIds.length - 1] || '',
        selectedTokenIds,
        selectedEntities: [
          ...(additive ? state.selectedEntities.filter((entry) => entry.type !== 'token') : []),
          ...selectedTokenIds.map((id) => ({ type: 'token' as const, id }))
        ],
        selectedObjectId: additive ? state.selectedObjectId : '',
        selectedObjectIds: additive ? state.selectedObjectIds : [],
        selectedTileCells: additive ? state.selectedTileCells : [],
        selectedMapInstanceIds: additive ? state.selectedMapInstanceIds : [],
        selectedRegionIds: additive ? state.selectedRegionIds : []
      };
    });
  },

  selectTokens(tokenIds, additive = false) {
    set((state) => {
      const valid = tokenIds.filter((tokenId) => {
        const token = state.map.tokens.find((entry) => entry.id === tokenId);
        return Boolean(token && canControlTokenInState(state, token));
      });
      const selectedTokenIds = additive ? uniqueList([...state.selectedTokenIds, ...valid]) : uniqueList(valid);
      return {
        selectedTokenId: selectedTokenIds[selectedTokenIds.length - 1] || '',
        selectedTokenIds,
        selectedEntities: [
          ...(additive ? state.selectedEntities.filter((entry) => entry.type !== 'token') : []),
          ...selectedTokenIds.map((id) => ({ type: 'token' as const, id }))
        ],
        selectedObjectId: additive ? state.selectedObjectId : '',
        selectedObjectIds: additive ? state.selectedObjectIds : [],
        selectedTileCells: additive ? state.selectedTileCells : [],
        selectedMapInstanceIds: additive ? state.selectedMapInstanceIds : [],
        selectedRegionIds: additive ? state.selectedRegionIds : []
      };
    });
  },

  setSessionViewMode(mode) {
    set({ sessionViewMode: mode, dirty: true });
  },

  setSessionDynamicVision(value) {
    set({ sessionDynamicVision: value, dirty: true });
  },

  setSessionFogEnabled(value) {
    set({ sessionFogEnabled: value, dirty: true });
  },

  setSessionIgnoreCollision(value) {
    set({ sessionIgnoreCollision: value });
  },

  setSessionGlobalDarkness(value) {
    const nextDarkness = Math.max(0, Math.min(1, value));
    set((state) => ({
      sessionGlobalDarkness: nextDarkness,
      map: {
        ...state.map,
        sessionLighting: {
          globalIllumination: state.map.sessionLighting?.globalIllumination ?? true,
          darkness: nextDarkness,
          ambientColor: state.map.sessionLighting?.ambientColor || '#d8e6ff',
          ambientIntensity: state.map.sessionLighting?.ambientIntensity ?? 1,
          playerVisible: state.map.sessionLighting?.playerVisible ?? false,
          regions: state.map.sessionLighting?.regions || state.map.lightingRegions || []
        }
      },
      dirty: true
    }));
  },

  setSessionRegionPreset(preset) {
    set({ sessionRegionPreset: preset });
  },

  updateSessionLighting(patch) {
    set((state) => {
      const current = getSessionLighting(state.map);
      const next = {
        ...current,
        ...patch,
        regions: patch.regions || current.regions
      };
      return {
        sessionGlobalDarkness: next.darkness,
        map: {
          ...state.map,
          sessionLighting: next,
          lightingRegions: next.regions
        },
        dirty: true
      };
    });
  },

  addLightingRegion(region) {
    set((state) => {
      const current = getSessionLighting(state.map);
      const next = {
        ...current,
        regions: [region, ...current.regions.filter((entry) => entry.id !== region.id)]
      };
      return {
        map: {
          ...state.map,
          sessionLighting: next,
          lightingRegions: next.regions
        },
        dirty: true
      };
    });
  },

  updateLightingRegion(regionId, patch) {
    set((state) => {
      const current = getSessionLighting(state.map);
      const next = {
        ...current,
        regions: current.regions.map((region) => region.id === regionId ? { ...region, ...patch } : region)
      };
      return {
        map: { ...state.map, sessionLighting: next, lightingRegions: next.regions },
        dirty: true
      };
    });
  },

  removeLightingRegion(regionId) {
    set((state) => {
      const current = getSessionLighting(state.map);
      const next = {
        ...current,
        regions: current.regions.filter((entry) => entry.id !== regionId)
      };
      return {
        map: {
          ...state.map,
          sessionLighting: next,
          lightingRegions: next.regions
        },
        dirty: true
      };
    });
  },

  selectLightingRegion(regionId, additive = false) {
    set((state) => {
      const exists = (state.map.sessionLighting?.regions || state.map.lightingRegions || []).some((region) => region.id === regionId);
      if (!exists) return state;
      const selectedRegionIds = additive ? toggleListValue(state.selectedRegionIds, regionId) : [regionId];
      return {
        selectedRegionIds,
        selectedEntities: [
          ...(additive ? state.selectedEntities.filter((entry) => entry.type !== 'region') : []),
          ...selectedRegionIds.map((id) => ({ type: 'region' as const, id }))
        ],
        selectedObjectId: additive ? state.selectedObjectId : '',
        selectedObjectIds: additive ? state.selectedObjectIds : [],
        selectedTileCells: additive ? state.selectedTileCells : [],
        selectedMapInstanceIds: additive ? state.selectedMapInstanceIds : [],
        selectedTokenId: additive ? state.selectedTokenId : '',
        selectedTokenIds: additive ? state.selectedTokenIds : []
      };
    });
  },

  moveSelectedLightingRegions(deltaX, deltaY) {
    set((state) => {
      if (!state.selectedRegionIds.length) return state;
      const history = pushHistory(state);
      const selected = new Set(state.selectedRegionIds);
      const current = getSessionLighting(state.map);
      const next = {
        ...current,
        regions: current.regions.map((region) => (
          selected.has(region.id)
            ? { ...region, points: region.points.map((point) => ({ x: point.x + deltaX, y: point.y + deltaY })) }
            : region
        ))
      };
      return {
        map: { ...state.map, sessionLighting: next, lightingRegions: next.regions },
        historyPast: history.historyPast,
        historyFuture: history.historyFuture,
        dirty: true
      };
    });
  },

  removeSelectedLightingRegions() {
    set((state) => {
      if (!state.selectedRegionIds.length) return state;
      const selected = new Set(state.selectedRegionIds);
      const current = getSessionLighting(state.map);
      const next = {
        ...current,
        regions: current.regions.filter((region) => !selected.has(region.id))
      };
      return {
        map: { ...state.map, sessionLighting: next, lightingRegions: next.regions },
        selectedRegionIds: [],
        dirty: true
      };
    });
  },

  addAreaTemplate(template) {
    set((state) => ({
      map: {
        ...state.map,
        areaTemplates: [template, ...(state.map.areaTemplates || []).filter((entry) => entry.id !== template.id)]
      },
      dirty: true
    }));
  },

  addSessionMapInstance(sourceMap, x = 0, y = 0, options = {}) {
    set((state) => {
      const base = cloneMap(sourceMap);
      const width = Math.max(1, base.bounds?.width || base.width);
      const height = Math.max(1, base.bounds?.height || base.height);
      const similarInstances = (state.map.sessionMapInstances || []).filter((entry) => entry.sourceMapId === base.id || entry.sourceMapName === base.name).length;
      const instanceName = options.name || (similarInstances > 0 ? `${base.name} #${similarInstances + 1}` : base.name);
      const instance: SessionMapInstance = {
        id: createId('map-instance'),
        sourceMapId: base.id,
        sourceMapName: base.name,
        name: instanceName,
        x,
        y,
        width,
        height,
        gridSize: base.gridSize,
        rotation: options.rotation || 0,
        locked: options.locked ?? false,
        visibleToPlayers: true,
        opacity: 1,
        zIndex: Math.max(0, ...(state.map.sessionMapInstances || []).map((entry) => entry.zIndex || 0)) + 1,
        data: cloneMap({
          ...base,
          width,
          height,
          bounds: { x: 0, y: 0, width, height },
          mode: 'build',
          tokens: [],
          fogLayer: { ...base.fogLayer, revealedCells: [] },
          sessionMapInstances: []
        })
      };
      return {
        map: {
          ...state.map,
          sessionMapInstances: [...(state.map.sessionMapInstances || []), instance]
        },
        selectedMapInstanceIds: [instance.id],
        selectedEntities: [{ type: 'map' as const, id: instance.id }],
        selectedObjectId: '',
        selectedObjectIds: [],
        selectedTileCells: [],
        selectedRegionIds: [],
        selectedTokenId: '',
        selectedTokenIds: [],
        dirty: true
      };
    });
  },

  updateSessionMapInstance(instanceId, patch) {
    set((state) => {
      const history = pushHistory(state);
      return {
        map: {
          ...state.map,
          sessionMapInstances: (state.map.sessionMapInstances || []).map((instance) => (
            instance.id === instanceId ? { ...instance, ...patch } : instance
          ))
        },
        historyPast: history.historyPast,
        historyFuture: history.historyFuture,
        dirty: true
      };
    });
  },

  removeSessionMapInstance(instanceId) {
    set((state) => ({
      map: {
        ...state.map,
        sessionMapInstances: (state.map.sessionMapInstances || []).filter((instance) => instance.id !== instanceId)
      },
      selectedMapInstanceIds: state.selectedMapInstanceIds.filter((id) => id !== instanceId),
      selectedEntities: state.selectedEntities.filter((entry) => !(entry.type === 'map' && entry.id === instanceId)),
      dirty: true
    }));
  },

  duplicateSessionMapInstance(instanceId) {
    set((state) => {
      const source = (state.map.sessionMapInstances || []).find((instance) => instance.id === instanceId);
      if (!source) return state;
      const clone: SessionMapInstance = {
        ...JSON.parse(JSON.stringify(source)),
        id: createId('map-instance'),
        name: `${source.name} copia`,
        x: source.x + source.gridSize * 2,
        y: source.y + source.gridSize * 2,
        locked: false,
        zIndex: Math.max(0, ...(state.map.sessionMapInstances || []).map((entry) => entry.zIndex || 0)) + 1
      };
      return {
        map: {
          ...state.map,
          sessionMapInstances: [...(state.map.sessionMapInstances || []), clone]
        },
        selectedMapInstanceIds: [clone.id],
        selectedEntities: [{ type: 'map' as const, id: clone.id }],
        dirty: true
      };
    });
  },

  selectMapInstance(instanceId, additive = false) {
    set((state) => {
      const exists = (state.map.sessionMapInstances || []).some((instance) => instance.id === instanceId);
      if (!exists) return state;
      const selectedMapInstanceIds = additive ? toggleListValue(state.selectedMapInstanceIds, instanceId) : [instanceId];
      return {
        selectedMapInstanceIds,
        selectedEntities: [
          ...(additive ? state.selectedEntities.filter((entry) => entry.type !== 'map') : []),
          ...selectedMapInstanceIds.map((id) => ({ type: 'map' as const, id }))
        ],
        selectedObjectId: additive ? state.selectedObjectId : '',
        selectedObjectIds: additive ? state.selectedObjectIds : [],
        selectedTileCells: additive ? state.selectedTileCells : [],
        selectedTokenId: additive ? state.selectedTokenId : '',
        selectedTokenIds: additive ? state.selectedTokenIds : [],
        selectedRegionIds: additive ? state.selectedRegionIds : []
      };
    });
  },

  moveSelectedMapInstances(deltaX, deltaY) {
    set((state) => {
      if (!state.selectedMapInstanceIds.length) return state;
      const history = pushHistory(state);
      const selected = new Set(state.selectedMapInstanceIds);
      return {
        map: {
          ...state.map,
          sessionMapInstances: (state.map.sessionMapInstances || []).map((instance) => (
            selected.has(instance.id) && !instance.locked
              ? { ...instance, x: instance.x + deltaX, y: instance.y + deltaY }
              : instance
          ))
        },
        historyPast: history.historyPast,
        historyFuture: history.historyFuture,
        dirty: true
      };
    });
  },

  moveSelectedSessionItems(deltaX, deltaY) {
    set((state) => {
      const hasSelection = state.selectedTokenIds.length
        || state.selectedMapInstanceIds.length
        || state.selectedObjectIds.length
        || state.selectedRegionIds.length
        || state.selectedEntities.some((entity) => entity.type === 'template');
      if (!hasSelection) return state;

      const history = pushHistory(state);
      const next = cloneMap(state.map);
      const selectedMapInstances = new Set(state.selectedMapInstanceIds);
      const selectedObjects = new Set(state.selectedObjectIds);
      const selectedRegions = new Set(state.selectedRegionIds);
      const selectedTokens = new Set(state.selectedTokenIds);
      const selectedTemplates = new Set(state.selectedEntities.filter((entity) => entity.type === 'template').map((entity) => entity.id));
      let lastTokenMoveCheck: TokenMoveCheck | null = null;

      next.sessionMapInstances = (next.sessionMapInstances || []).map((instance) => (
        state.tabletopRole === 'gm' && selectedMapInstances.has(instance.id) && !instance.locked
          ? { ...instance, x: instance.x + deltaX, y: instance.y + deltaY }
          : instance
      ));

      getAllMapObjects(next).forEach((object) => {
        const attachedToMovedMap = Boolean(object.attachedToMapInstanceId && selectedMapInstances.has(object.attachedToMapInstanceId));
        if (!selectedObjects.has(object.id) && !attachedToMovedMap) return;
        if (object.locked) return;
        object.x += deltaX;
        object.y += deltaY;
        if (object.light) {
          object.light.x = object.x;
          object.light.y = object.y;
        }
      });

      if (selectedRegions.size || selectedMapInstances.size) {
        const current = getSessionLighting(next);
        const lighting = {
          ...current,
          regions: current.regions.map((region) => {
            const attachedToMovedMap = Boolean(region.attachedToMapInstanceId && selectedMapInstances.has(region.attachedToMapInstanceId));
            return selectedRegions.has(region.id) || attachedToMovedMap
              ? { ...region, points: region.points.map((point) => ({ x: point.x + deltaX, y: point.y + deltaY })) }
              : region;
          })
        };
        next.sessionLighting = lighting;
        next.lightingRegions = lighting.regions;
      }

      if (selectedTemplates.size || selectedMapInstances.size) {
        next.areaTemplates = (next.areaTemplates || []).map((template) => {
          const attachedToMovedMap = Boolean(template.attachedToMapInstanceId && selectedMapInstances.has(template.attachedToMapInstanceId));
          return selectedTemplates.has(template.id) || attachedToMovedMap
            ? { ...template, x: template.x + deltaX, y: template.y + deltaY }
            : template;
        });
      }

      if (deltaX || deltaY) {
        next.tokens.forEach((token) => {
          const attachedToMovedMap = Boolean(token.attachedToMapInstanceId && selectedMapInstances.has(token.attachedToMapInstanceId));
          if (!selectedTokens.has(token.id) && !attachedToMovedMap) return;
          const target = {
            x: token.x + deltaX,
            y: token.y + deltaY
          };
          const check = canMoveTokenToState(state, next, token, target.x, target.y);
          if (!check.ok) {
            lastTokenMoveCheck = check;
            return;
          }
          lastTokenMoveCheck = check;
          token.x = target.x;
          token.y = target.y;
          markExploredAroundToken(next, token);
        });
      }

      return {
        map: next,
        lastTokenMoveCheck,
        historyPast: history.historyPast,
        historyFuture: history.historyFuture,
        dirty: true
      };
    });
  },

  toggleDoorAt(x, y) {
    set((state) => {
      const door = findTileAtCell(state.map, 'doors', x, y);
      if (!door) return state;
      const nextState: NonNullable<TileCell['doorState']> = door.doorState === 'open' ? 'closed' : door.doorState === 'locked' ? 'locked' : 'open';
      const history = pushHistory(state);
      const next = cloneMap(state.map);
      const nextDoor = findTileAtCell(next, 'doors', x, y);
      if (nextDoor) applyDoorState(nextDoor, nextState);
      return { map: next, selectedTileCells: [{ layer: 'doors', x: door.x, y: door.y }], historyPast: history.historyPast, historyFuture: history.historyFuture, dirty: true };
    });
  },

  setDoorStateAt(x, y, doorState) {
    set((state) => {
      const door = findTileAtCell(state.map, 'doors', x, y);
      if (!door) return state;
      const history = pushHistory(state);
      const next = cloneMap(state.map);
      const nextDoor = findTileAtCell(next, 'doors', x, y);
      if (nextDoor) applyDoorState(nextDoor, doorState);
      return { map: next, selectedTileCells: [{ layer: 'doors', x: door.x, y: door.y }], historyPast: history.historyPast, historyFuture: history.historyFuture, dirty: true };
    });
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
  },

  revealAllFog() {
    set((state) => {
      const revealedCells: Array<{ x: number; y: number }> = [];
      for (let y = 0; y < state.map.height; y += 1) {
        for (let x = 0; x < state.map.width; x += 1) revealedCells.push({ x, y });
      }
      return {
        map: { ...state.map, fogLayer: { ...state.map.fogLayer, revealedCells } },
        dirty: true
      };
    });
  },

  hideAllFog() {
    set((state) => ({
      map: { ...state.map, fogLayer: { ...state.map.fogLayer, revealedCells: [] } },
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

const BUILD_TOOLS = new Set<MapTool>(['select', 'move-token', 'pan', 'brush', 'wall', 'collision', 'erase', 'object', 'door', 'cover', 'terminal', 'light', 'zone', 'note', 'fog', 'measure', 'token', 'frame']);
const SESSION_TOOLS = new Set<MapTool>(['select', 'move-token', 'pan', 'token', 'fog', 'light', 'door', 'measure', 'ping', 'template', 'note']);

function normalizeToolForMode(tool: MapTool, mode: TabletopMode, role: TabletopRole = 'gm'): MapTool {
  if (role === 'player') return PLAYER_TOOLS.has(tool) ? tool : 'select';
  return (mode === 'build' ? BUILD_TOOLS : SESSION_TOOLS).has(tool) ? tool : 'select';
}

export function canControlTokenForUser(token: TabletopToken, user: { role?: string; id?: string; characterId?: string; characterIds?: string[] }) {
  if (user.role === 'gm' || user.role === 'master') return true;
  if (token.locked) return false;
  if (token.visibleToPlayers === false || token.hidden) return false;
  // TODO(player-permissions): restrict players to owned tokens/forms/mini sheets once the Player Tabletop flow is stable.
  if (temporaryPlayerTokenMoveUnlocked()) return true;
  const userId = String(user.id || '');
  const characterIds = new Set([user.characterId, ...(user.characterIds || [])].map((entry) => String(entry || '')).filter(Boolean));
  if (token.ownerUserId && token.ownerUserId === userId) return true;
  if (token.controlledByUserIds?.includes(userId)) return true;
  if (token.ownerCharacterId && characterIds.has(token.ownerCharacterId)) return true;
  if (token.formOwnerCharacterId && characterIds.has(token.formOwnerCharacterId)) return true;
  if (token.sourceSheetId && characterIds.has(token.sourceSheetId)) return true;
  if (token.characterId && characterIds.has(token.characterId)) return true;
  return false;
}

function temporaryPlayerTokenMoveUnlocked() {
  return true;
}

function canControlTokenInState(state: TabletopStore, token: TabletopToken) {
  return canControlTokenForUser(token, {
    role: state.tabletopRole,
    id: state.currentUserId,
    characterId: state.currentCharacterId,
    characterIds: state.ownedCharacterIds
  });
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

function resolvePaintAssetId(map: OmniMap, selectedAssetId: string, layer: MapLayerKey) {
  const selected = getAssetFromMap(map, selectedAssetId);
  if (layer === 'floor') return selected?.defaultLayer === 'floor' ? selectedAssetId : 'floor-baixo-asphalt';
  if (layer === 'walls') return selected?.defaultLayer === 'walls' ? selectedAssetId : 'wall-brick';
  if (layer === 'doors') return selected?.defaultLayer === 'doors' ? selectedAssetId : 'door-metal';
  if (layer === 'collision') return selectedAssetId || 'wall-brick';
  return selectedAssetId;
}

function isInsideCell(map: OmniMap, x: number, y: number) {
  return x >= 0 && y >= 0 && x < map.width && y < map.height;
}

function isInsidePixel(map: OmniMap, x: number, y: number) {
  return x >= 0 && y >= 0 && x < map.width * map.gridSize && y < map.height * map.gridSize;
}

function eraseCells(map: OmniMap, x: number, y: number, size: number, mode: EraseMode) {
  const cells = getBrushCells(x, y, size);
  if (!cells.length) return;
  if (mode === 'activeLayer') {
    eraseLayerCells(map, map.activeLayer, cells);
    return;
  }
  if (mode === 'allUnlocked') {
    const allLayers: MapLayerKey[] = ['floor', 'walls', 'doors', 'collision', 'decoration', 'objects', 'details', 'lighting', 'mechanics', 'notes', 'fog'];
    allLayers.forEach((layer) => eraseLayerCells(map, layer, cells));
    const keys = new Set(cells.map((cell) => `${cell.x}:${cell.y}`));
    map.tokens = map.tokens.filter((token) => {
      if (token.locked) return true;
      const bounds = getTokenBounds(map, token);
      const cellX = Math.floor((bounds.x + bounds.width / 2) / map.gridSize);
      const cellY = Math.floor((bounds.y + bounds.height / 2) / map.gridSize);
      return !keys.has(`${cellX}:${cellY}`);
    });
    return;
  }
  cells.forEach((cell) => eraseTopVisibleCell(map, cell));
}

function erasePoint(map: OmniMap, x: number, y: number, size: number, mode: EraseMode) {
  const cell = {
    x: Math.floor(x / map.gridSize),
    y: Math.floor(y / map.gridSize)
  };
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

function getTileMetaForAsset(asset: AssetDefinition | null, layer: MapLayerKey): Partial<TileCell> {
  if (layer !== 'doors') return {};
  return {
    doorState: 'closed',
    blocksMovement: Boolean(asset?.defaultBlocksMovement ?? asset?.blocksMovement ?? true),
    blocksVision: Boolean(asset?.defaultBlocksVision ?? asset?.blocksVision ?? true),
    interactable: true
  };
}

function copyTileMeta(tile: TileCell): Partial<TileCell> {
  return {
    doorState: tile.doorState,
    blocksMovement: tile.blocksMovement,
    blocksVision: tile.blocksVision,
    blocksSound: tile.blocksSound,
    interactable: tile.interactable,
    secret: tile.secret,
    note: tile.note
  };
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
  if (globalSnapMode === 'grid' || globalSnapMode === 'fine' || globalSnapMode === 'free' || globalSnapMode === 'object') return globalSnapMode;
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

function getSessionSelectableObjects(map: OmniMap) {
  return [map.decorationLayer, map.objectLayer, map.detailLayer, map.lightingLayer, map.mechanicalLayer, map.notesLayer]
    .filter((layer) => layer.visible && !layer.locked && layer.selectable !== false)
    .flatMap((layer) => layer.objects)
    .filter((object) => !object.locked && (object.interactable || object.kind === 'light' || object.kind === 'note' || object.kind === 'zone' || object.kind === 'terminal' || object.kind === 'cover'));
}

function getTokenBounds(map: OmniMap, token: TabletopToken) {
  const size = map.gridSize * Math.max(0.5, Number(token.size || 1));
  return {
    x: token.x,
    y: token.y,
    width: size,
    height: size
  };
}

function getMapInstanceBounds(instance: SessionMapInstance) {
  return {
    x: instance.x,
    y: instance.y,
    width: instance.width * instance.gridSize,
    height: instance.height * instance.gridSize
  };
}

function getLightingRegionBounds(region: LightingRegion) {
  if (!region.points.length) return { x: 0, y: 0, width: 1, height: 1 };
  const xs = region.points.map((point) => point.x);
  const ys = region.points.map((point) => point.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs, minX);
  const maxY = Math.max(...ys, minY);
  return { x: minX, y: minY, width: Math.max(1, maxX - minX), height: Math.max(1, maxY - minY) };
}

function getSessionLighting(map: OmniMap): SessionLightingState {
  return {
    globalIllumination: map.sessionLighting?.globalIllumination ?? true,
    darkness: map.sessionLighting?.darkness ?? 0,
    ambientColor: map.sessionLighting?.ambientColor || '#d8e6ff',
    ambientIntensity: map.sessionLighting?.ambientIntensity ?? 1,
    playerVisible: map.sessionLighting?.playerVisible ?? false,
    regions: map.sessionLighting?.regions || map.lightingRegions || []
  };
}

function isTokenMoveBlocked(map: OmniMap, token: TabletopToken, x: number, y: number) {
  return !canMoveTokenTo(map, token, x, y, { ignoreTokenId: token.id }).ok;
}

function canMoveTokenToState(state: TabletopStore, map: OmniMap, token: TabletopToken, x: number, y: number): TokenMoveCheck {
  const isGm = state.tabletopRole === 'gm' || state.sessionViewMode === 'gm';
  const canControl = canControlTokenInState(state, token);
  const context = {
    tokenName: token.name,
    userRole: state.tabletopRole,
    tabletopRole: state.tabletopRole,
    viewMode: state.sessionViewMode
  };
  if (!canControl) {
    return { ...buildTokenMoveCheck(token, x, y, false, 'permission'), ...context, canControl: false };
  }
  // Temporary movement rule: all token drags ignore collision while token movement is being stabilized.
  const ignoreCollision = true;
  const check = canMoveTokenTo(map, token, x, y, {
    ignoreTokenId: token.id,
    ignoreCollision,
    ignoreLocked: isGm,
    checkOtherTokens: true
  });
  return { ...check, ...context, canControl: true };
}

export function canMoveTokenTo(
  map: OmniMap,
  token: TabletopToken,
  x: number,
  y: number,
  options: { ignoreTokenId?: string; ignoreCollision?: boolean; ignoreLocked?: boolean; checkOtherTokens?: boolean } = {}
): TokenMoveCheck {
  if (token.locked && !options.ignoreLocked) return buildTokenMoveCheck(token, x, y, false, 'locked');
  const nextX = Number.isFinite(Number(x)) ? Number(x) : token.x;
  const nextY = Number.isFinite(Number(y)) ? Number(y) : token.y;
  if (options.ignoreCollision) return buildTokenMoveCheck(token, nextX, nextY, true);
  const path = canMoveTokenAlongBoardPath(map, token, { x: token.x, y: token.y }, { x: nextX, y: nextY }, options);
  if (!path.valid) {
    return {
      ...buildTokenMoveCheck(token, nextX, nextY, false, path.reason || 'collision'),
      blockers: path.blockers,
      targetCell: path.blockedAt || { x: nextX, y: nextY }
    };
  }
  return buildTokenMoveCheck(token, nextX, nextY, true);
}

function buildTokenMoveCheck(token: TabletopToken, x: number, y: number, ok: boolean, reason?: TokenMoveCheck['reason']): TokenMoveCheck {
  return {
    ok,
    reason,
    tokenId: token.id,
    currentCell: { x: token.x, y: token.y },
    targetCell: { x, y },
    locked: Boolean(token.locked)
  };
}

function canMoveTokenAlongBoardPath(
  map: OmniMap,
  token: TabletopToken,
  from: { x: number; y: number },
  to: { x: number; y: number },
  options: { ignoreTokenId?: string; checkOtherTokens?: boolean } = {}
) {
  const path = bresenhamCells(Math.round(from.x), Math.round(from.y), Math.round(to.x), Math.round(to.y));
  let lastValidCell = { x: Math.round(from.x), y: Math.round(from.y) };
  for (const cell of path) {
    if (isOriginalTokenFootprint(token, cell.x, cell.y)) {
      lastValidCell = cell;
      continue;
    }
    const blocked = getTokenFootprintBlockOnBoard(map, token, cell.x, cell.y, options);
    if (blocked) {
      return {
        valid: false,
        lastValidCell,
        blockedAt: cell,
        reason: blocked.reason,
        blockers: blocked.blockers
      };
    }
    lastValidCell = cell;
  }
  return { valid: true, lastValidCell };
}

function isTokenFootprintBlockedOnBoard(map: OmniMap, token: TabletopToken, x: number, y: number) {
  return Boolean(getTokenFootprintBlockOnBoard(map, token, x, y, { ignoreTokenId: token.id }));
}

function getTokenFootprintBlockOnBoard(map: OmniMap, token: TabletopToken, x: number, y: number, options: { ignoreTokenId?: string; checkOtherTokens?: boolean } = {}) {
  const size = Math.max(1, Number(token.size || 1));
  for (let dy = 0; dy < size; dy += 1) {
    for (let dx = 0; dx < size; dx += 1) {
      const cellX = x + dx;
      const cellY = y + dy;
      if (isOriginalTokenFootprint(token, cellX, cellY)) continue;
      const block = getBlockingAtWorldCell(map, cellX, cellY);
      if (block) return block;
    }
  }
  if (options.checkOtherTokens) {
    const index = getMovementIndex(map);
    const blockers = new Set<string>();
    for (let dy = 0; dy < size; dy += 1) {
      for (let dx = 0; dx < size; dx += 1) {
        const entries = index.tokensByCell.get(cellKey(x + dx, y + dy)) || [];
        entries.forEach((id) => {
          if (id !== options.ignoreTokenId) blockers.add(id);
        });
      }
    }
    if (blockers.size) return { reason: 'token' as const, blockers: Array.from(blockers) };
  }
  return null;
}

function getBlockingAtWorldCell(map: OmniMap, x: number, y: number) {
  const baseBlock = getMovementBlockCell(map, x, y);
  if (baseBlock) return baseBlock;

  const worldPoint = cellCenter(map, { x, y });
  const instances = getMapInstancesAtWorldPoint(map, worldPoint.x, worldPoint.y).filter((instance) => instance.data);

  for (const instance of instances) {
    const local = worldToMapInstanceCell(instance, worldPoint.x, worldPoint.y);
    if (!local || !instance.data) continue;
    const block = getMovementBlockCell(instance.data, local.x, local.y);
    if (block) return { ...block, blockers: block.blockers?.map((entry) => `${instance.id}:${entry}`) };
  }

  return null;
}

function isOriginalTokenFootprint(token: TabletopToken, x: number, y: number) {
  const size = Math.max(1, Number(token.size || 1));
  return x >= token.x && x < token.x + size && y >= token.y && y < token.y + size;
}

function findMapInstanceAtWorldPoint(map: OmniMap, worldX: number, worldY: number) {
  return getMapInstancesAtWorldPoint(map, worldX, worldY)[0] || null;
}

function getMapInstancesAtWorldPoint(map: OmniMap, worldX: number, worldY: number) {
  return [...(map.sessionMapInstances || [])]
    .filter((instance) => pointInsideMapInstance(instance, worldX, worldY))
    .sort((left, right) => Number(right.zIndex || 0) - Number(left.zIndex || 0));
}

function worldToMapInstanceCell(instance: SessionMapInstance, worldX: number, worldY: number) {
  if (!pointInsideMapInstance(instance, worldX, worldY)) return null;
  const gridSize = Math.max(1, instance.gridSize);
  return {
    x: Math.floor((worldX - instance.x) / gridSize),
    y: Math.floor((worldY - instance.y) / gridSize)
  };
}

function pointInsideMapInstance(instance: SessionMapInstance, worldX: number, worldY: number) {
  const width = instance.width * instance.gridSize;
  const height = instance.height * instance.gridSize;
  return worldX >= instance.x && worldY >= instance.y && worldX < instance.x + width && worldY < instance.y + height;
}

function isMovementBlockedCell(map: OmniMap, x: number, y: number) {
  return Boolean(getMovementBlockCell(map, x, y));
}

function getMovementBlockCell(map: OmniMap, x: number, y: number): MovementBlock | null {
  if (!isInsideCell(map, x, y)) return null;
  return getMovementIndex(map).blocksByCell.get(cellKey(x, y)) || null;
}

function getMovementIndex(map: OmniMap): MovementIndex {
  const cached = movementIndexCache.get(map);
  if (cached) return cached;
  const index: MovementIndex = {
    blocksByCell: new Map(),
    tokensByCell: new Map()
  };

  map.tileLayers.walls.cells.forEach((cell) => {
    if (cell.blocksMovement === false) return;
    addTileBlock(index, map, cell, 'wall', `wall:${cell.x}:${cell.y}`);
  });
  map.tileLayers.collision.cells.forEach((cell) => {
    if (cell.blocksMovement === false) return;
    addTileBlock(index, map, cell, 'collision', `collision:${cell.x}:${cell.y}`);
  });
  map.tileLayers.doors.cells.forEach((cell) => {
    if (!doorBlocksMovement(cell)) return;
    addTileBlock(index, map, cell, 'door', `door:${cell.x}:${cell.y}`);
  });
  getAllMapObjects(map).forEach((object) => {
    if (!object.blocksMovement) return;
    const minX = Math.floor(object.x / map.gridSize);
    const minY = Math.floor(object.y / map.gridSize);
    const maxX = Math.ceil((object.x + object.width * (object.scale || 1)) / map.gridSize) - 1;
    const maxY = Math.ceil((object.y + object.height * (object.scale || 1)) / map.gridSize) - 1;
    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        mergeMovementBlock(index.blocksByCell, cellKey(x, y), { reason: 'object', blockers: [object.id] });
      }
    }
  });
  map.tokens.forEach((token) => {
    if (token.hidden || token.visibleToPlayers === false || !token.blocksMovement) return;
    const bounds = getTokenBounds(map, token);
    const minX = Math.floor(bounds.x / map.gridSize);
    const minY = Math.floor(bounds.y / map.gridSize);
    const maxX = Math.ceil((bounds.x + bounds.width) / map.gridSize) - 1;
    const maxY = Math.ceil((bounds.y + bounds.height) / map.gridSize) - 1;
    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        const key = cellKey(x, y);
        index.tokensByCell.set(key, [...(index.tokensByCell.get(key) || []), token.id]);
      }
    }
  });

  movementIndexCache.set(map, index);
  return index;
}

function addTileBlock(index: MovementIndex, map: OmniMap, tile: TileCell, reason: MovementBlock['reason'], blockerId: string) {
  const footprint = resolveFootprint(tile.footprint, tile.rotation || 0);
  for (let y = tile.y; y < tile.y + footprint.h; y += 1) {
    for (let x = tile.x; x < tile.x + footprint.w; x += 1) {
      if (!isInsideCell(map, x, y)) continue;
      mergeMovementBlock(index.blocksByCell, cellKey(x, y), { reason, blockers: [blockerId] });
    }
  }
}

function mergeMovementBlock(target: Map<string, MovementBlock>, key: string, block: MovementBlock) {
  const existing = target.get(key);
  if (!existing) {
    target.set(key, block);
    return;
  }
  target.set(key, {
    reason: existing.reason,
    blockers: uniqueList([...existing.blockers, ...block.blockers])
  });
}

function cellKey(x: number, y: number) {
  return `${x}:${y}`;
}

function bresenhamCells(x0: number, y0: number, x1: number, y1: number) {
  const cells: Array<{ x: number; y: number }> = [];
  let dx = Math.abs(x1 - x0);
  let dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let error = dx + dy;
  let x = x0;
  let y = y0;

  while (true) {
    cells.push({ x, y });
    if (x === x1 && y === y1) break;
    const e2 = error * 2;
    if (e2 >= dy) {
      error += dy;
      x += sx;
    }
    if (e2 <= dx) {
      error += dx;
      y += sy;
    }
  }

  return cells;
}

function doorBlocksMovement(door: TileCell) {
  if (door.doorState === 'open') return false;
  if (door.doorState === 'closed' || door.doorState === 'locked') return true;
  return door.blocksMovement !== false;
}

function applyDoorState(door: TileCell, doorState: NonNullable<TileCell['doorState']>) {
  door.doorState = doorState;
  door.interactable = true;
  if (doorState === 'open') {
    door.blocksMovement = false;
    door.blocksVision = false;
  } else {
    door.blocksMovement = true;
    door.blocksVision = true;
  }
}

function markExploredAroundToken(map: OmniMap, token: TabletopToken) {
  if (token.visionEnabled === false || token.hidden) return;
  const radius = Math.max(1, Math.round(token.visionRadius || 6));
  const bounds = getTokenBounds(map, token);
  const center = {
    x: Math.floor((bounds.x + bounds.width / 2) / map.gridSize),
    y: Math.floor((bounds.y + bounds.height / 2) / map.gridSize)
  };
  const explored = new Set(map.fogLayer.revealedCells.map((cell) => `${cell.x}:${cell.y}`));
  for (let y = center.y - radius; y <= center.y + radius; y += 1) {
    for (let x = center.x - radius; x <= center.x + radius; x += 1) {
      if (!isInsideCell(map, x, y)) continue;
      if (Math.hypot(x - center.x, y - center.y) > radius) continue;
      const key = `${x}:${y}`;
      if (explored.has(key)) continue;
      explored.add(key);
      map.fogLayer.revealedCells.push({ x, y });
    }
  }
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
    layer.cells = setTileCell(layer.cells, nextX, nextY, original.assetId, original.rotation || 0, original.footprint, copyTileMeta(original));
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

function selectionEntityKey(entity: SessionSelectedEntity) {
  if (entity.type === 'door') return `${entity.type}:${entity.x}:${entity.y}`;
  return `${entity.type}:${entity.id}`;
}

function toggleSelectionList(values: SessionSelectedEntity[], entity: SessionSelectedEntity) {
  const key = selectionEntityKey(entity);
  return values.some((entry) => selectionEntityKey(entry) === key)
    ? values.filter((entry) => selectionEntityKey(entry) !== key)
    : [...values, entity];
}

function selectionPatchFromEntities(state: TabletopStore, entities: SessionSelectedEntity[]) {
  const unique = Array.from(new Map(entities.map((entity) => [selectionEntityKey(entity), entity])).values())
    .filter((entity) => {
      if (state.tabletopRole === 'gm') return true;
      if (entity.type !== 'token') return false;
      const token = state.map.tokens.find((entry) => entry.id === entity.id);
      return Boolean(token && canControlTokenInState(state, token));
    });
  const selectedTokenIds = unique.filter((entity): entity is { type: 'token'; id: string } => entity.type === 'token').map((entity) => entity.id);
  const selectedObjectIds = unique
    .filter((entity): entity is { type: 'object'; id: string } | { type: 'light'; id: string } => entity.type === 'object' || entity.type === 'light')
    .map((entity) => entity.id);
  const selectedMapInstanceIds = unique.filter((entity): entity is { type: 'map'; id: string } => entity.type === 'map').map((entity) => entity.id);
  const selectedRegionIds = unique.filter((entity): entity is { type: 'region'; id: string } => entity.type === 'region').map((entity) => entity.id);
  const selectedTileCells = unique
    .filter((entity): entity is { type: 'door'; id: string; x: number; y: number } => entity.type === 'door')
    .map((entity) => ({ layer: 'doors' as TileLayerKey, x: entity.x, y: entity.y }));
  return {
    selectedEntities: unique,
    selectedTokenId: selectedTokenIds[selectedTokenIds.length - 1] || '',
    selectedTokenIds,
    selectedObjectId: selectedObjectIds[selectedObjectIds.length - 1] || '',
    selectedObjectIds,
    selectedMapInstanceIds,
    selectedRegionIds,
    selectedTileCells
  };
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
