import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../../api/client';
import type { CharacterSheet, Combatant } from '../../api/types';
import { hydrateCharacter } from '../../domain/system';
import { Badge, Button, Card } from '../Ui';
import { ASSET_TYPE_LABELS, getAsset } from './assets';
import { AssetPalette } from './AssetPalette';
import { LayerPanel } from './LayerPanel';
import { MapListPanel } from './MapListPanel';
import { MapStage } from './MapStage';
import { MapToolbar } from './MapToolbar';
import { createBlankMap } from './mapFactory';
import { useTabletopStore } from './mapStore';
import { ObjectInspector } from './ObjectInspector';
import { SessionModeView } from './session/SessionModeView';
import { TokenPanel } from './TokenPanel';
import type {
  AvailableTabletopToken,
  DoorState,
  EraseMode,
  MapLayerKey,
  MapTool,
  OmniMap,
  SessionBoard,
  SessionDoorState,
  SessionFogState,
  SessionLightingState,
  SnapMode
} from './types';

export function TabletopPage({
  characters,
  combatants
}: {
  characters: CharacterSheet[];
  combatants: Array<Combatant & Record<string, unknown>>;
}) {
  const queryClient = useQueryClient();
  const map = useTabletopStore((state) => state.map);
  const setMap = useTabletopStore((state) => state.setMap);
  const newMap = useTabletopStore((state) => state.newMap);
  const setMapMeta = useTabletopStore((state) => state.setMapMeta);
  const clearDirty = useTabletopStore((state) => state.clearDirty);
  const insertPrefab = useTabletopStore((state) => state.insertPrefab);
  const removePrefab = useTabletopStore((state) => state.removePrefab);
  const tool = useTabletopStore((state) => state.tool);
  const brushSize = useTabletopStore((state) => state.brushSize);
  const eraseMode = useTabletopStore((state) => state.eraseMode);
  const snapMode = useTabletopStore((state) => state.snapMode);
  const placementRotation = useTabletopStore((state) => state.placementRotation);
  const selectedObjectIds = useTabletopStore((state) => state.selectedObjectIds);
  const selectedTileCells = useTabletopStore((state) => state.selectedTileCells);
  const selectedAssetId = useTabletopStore((state) => state.selectedAssetId);
  const dirty = useTabletopStore((state) => state.dirty);
  const [message, setMessage] = useState('');
  const [activeSessionBoardId, setActiveSessionBoardId] = useState('');
  const [sessionSaveStatus, setSessionSaveStatus] = useState<'saved' | 'dirty' | 'saving' | 'error'>('saved');
  const [leftTab, setLeftTab] = useState<'map' | 'assets' | 'tools'>('assets');
  const [rightTab, setRightTab] = useState<'layers' | 'inspector' | 'selection' | 'session'>('layers');
  const autosaveTimerRef = useRef<number | null>(null);
  const availableTokens = useMemo(() => buildAvailableTokens(characters, combatants), [characters, combatants]);
  const selectedAsset = getAsset(selectedAssetId, map.tilesets);

  const mapsQuery = useQuery({
    queryKey: ['maps'],
    queryFn: () => api.listMaps()
  });

  const sessionBoardsQuery = useQuery({
    queryKey: ['session-boards'],
    queryFn: () => api.listSessionBoards()
  });

  const saveMutation = useMutation({
    mutationFn: (nextMap: OmniMap) => api.createMap(stripSessionStateForMap(nextMap)),
    onSuccess: (result) => {
      setMap(result.map);
      setActiveSessionBoardId('');
      clearDirty();
      setMessage('Mapa salvo.');
      queryClient.invalidateQueries({ queryKey: ['maps'] });
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : 'Falha ao salvar mapa.');
    }
  });

  const loadMutation = useMutation({
    mutationFn: ({ mapId, mode = 'build' }: { mapId: string; mode?: OmniMap['mode'] }) => api.getMap(mapId).then((result) => ({ ...result, mode })),
    onSuccess: (result) => {
      setMap({ ...stripSessionStateForMap(result.map), mode: result.mode });
      if (result.mode === 'build') setActiveSessionBoardId('');
      setMessage('Mapa carregado.');
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : 'Falha ao carregar mapa.');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (mapId: string) => api.deleteMap(mapId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maps'] });
      newMap('Novo mapa', 28, 18, 32);
      setMessage('Mapa removido.');
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : 'Falha ao remover mapa.');
    }
  });

  const createSessionMutation = useMutation({
    mutationFn: async (sourceMap: OmniMap) => api.createSessionBoard(createSessionBoardFromMap(sourceMap)),
    onSuccess: (result) => {
      setActiveSessionBoardId(result.board.id);
      setMap(mapFromSessionBoard(result.board));
      clearDirty();
      setSessionSaveStatus('saved');
      setMessage('Sessao limpa criada.');
      queryClient.invalidateQueries({ queryKey: ['session-boards'] });
    },
    onError: (error) => {
      setSessionSaveStatus('error');
      setMessage(error instanceof Error ? error.message : 'Falha ao criar sessao.');
    }
  });

  const loadSessionMutation = useMutation({
    mutationFn: (boardId: string) => api.getSessionBoard(boardId),
    onSuccess: (result) => {
      setActiveSessionBoardId(result.board.id);
      setMap(mapFromSessionBoard(result.board));
      const state = useTabletopStore.getState();
      state.setSessionViewMode(result.board.viewMode || 'gm');
      state.setSessionFogEnabled(result.board.fog?.enabled ?? false);
      state.setSessionDynamicVision(result.board.fog?.mode !== 'manual');
      state.setSessionGlobalDarkness(result.board.lighting?.darkness ?? result.board.globalDarkness ?? state.sessionGlobalDarkness);
      clearDirty();
      setSessionSaveStatus('saved');
      setMessage('Sessao carregada.');
    },
    onError: (error) => {
      setSessionSaveStatus('error');
      setMessage(error instanceof Error ? error.message : 'Falha ao carregar sessao.');
    }
  });

  const saveSessionMutation = useMutation({
    mutationFn: ({ board, boardId }: { board: SessionBoard; boardId: string }) => (
      boardId ? api.updateSessionBoard(boardId, board) : api.createSessionBoard(board)
    ),
    onMutate: () => {
      setSessionSaveStatus('saving');
    },
    onSuccess: (result) => {
      setActiveSessionBoardId(result.board.id);
      clearDirty();
      setSessionSaveStatus('saved');
      setMessage('Sessao salva.');
      queryClient.invalidateQueries({ queryKey: ['session-boards'] });
    },
    onError: (error) => {
      setSessionSaveStatus('error');
      setMessage(error instanceof Error ? error.message : 'Falha ao salvar sessao.');
    }
  });

  const deleteSessionMutation = useMutation({
    mutationFn: (boardId: string) => api.deleteSessionBoard(boardId),
    onSuccess: (_result, boardId) => {
      queryClient.invalidateQueries({ queryKey: ['session-boards'] });
      if (boardId === activeSessionBoardId) {
        setActiveSessionBoardId('');
        useTabletopStore.getState().setMode('build');
      }
      setMessage('Sessao removida.');
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : 'Falha ao remover sessao.');
    }
  });

  function handleNew() {
    const ok = window.confirm('Criar um mapa novo? Alteracoes locais nao salvas serao descartadas.');
    if (!ok) return;
    setActiveSessionBoardId('');
    newMap('Novo mapa', 28, 18, 32);
    setMessage('Mapa novo criado.');
  }

  function handleSave() {
    if (map.mode === 'session') {
      handleSaveSession();
      return;
    }
    saveMutation.mutate(map);
  }

  function handleDelete() {
    const ok = window.confirm(`Excluir "${map.name}"?`);
    if (!ok) return;
    deleteMutation.mutate(map.id);
  }

  function handleSaveSession() {
    const state = useTabletopStore.getState();
    const board = createSessionBoardFromMap(state.map, {
      id: activeSessionBoardId,
      sourceMapId: activeSessionBoardId ? undefined : state.map.id
    });
    saveSessionMutation.mutate({ board, boardId: activeSessionBoardId });
  }

  async function handleCreateSessionFromMap(mapId: string) {
    try {
      const result = await api.getMap(mapId);
      createSessionMutation.mutate(stripSessionStateForMap(result.map));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Falha ao abrir mapa base.');
    }
  }

  async function handleAddMapInstance(mapId: string) {
    try {
      const result = await api.getMap(mapId);
      const state = useTabletopStore.getState();
      const offset = (state.map.sessionMapInstances?.length || 0) + 1;
      state.addSessionMapInstance(stripSessionStateForMap(result.map), offset * state.map.gridSize * 4, 0);
      setMessage('Mapa adicionado ao board.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Falha ao adicionar mapa ao board.');
    }
  }

  function handleModeChange(mode: OmniMap['mode']) {
    if (mode === 'build') {
      useTabletopStore.getState().setMode('build');
      return;
    }
    createSessionMutation.mutate(stripSessionStateForMap(map));
  }

  async function handleBackToBuild() {
    const state = useTabletopStore.getState();
    const selectedInstanceId = state.selectedMapInstanceIds[0];
    const selectedInstance = selectedInstanceId
      ? state.map.sessionMapInstances?.find((instance) => instance.id === selectedInstanceId)
      : null;
    const sourceMapId = selectedInstance?.sourceMapId || state.map.id;
    const fallbackMap = stripSessionStateForMap(selectedInstance?.data || state.map);
    setMessage('Abrindo modo construcao...');
    try {
      const result = await api.getMap(sourceMapId);
      setMap({ ...stripSessionStateForMap(result.map), mode: 'build' });
      setMessage('Modo construcao aberto.');
    } catch (error) {
      setMap({ ...fallbackMap, id: sourceMapId || fallbackMap.id, mode: 'build' });
      setMessage(error instanceof Error ? `Mapa base indisponivel. Abrindo copia local: ${error.message}` : 'Mapa base indisponivel. Abrindo copia local.');
    }
  }

  function handleDeleteSessionBoard(boardId: string) {
    const ok = window.confirm('Excluir esta sessao salva? O mapa base nao sera removido.');
    if (!ok) return;
    deleteSessionMutation.mutate(boardId);
  }

  useEffect(() => {
    if (map.mode !== 'session') return;
    if (!dirty) return;
    setSessionSaveStatus('dirty');
    if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = window.setTimeout(() => {
      const state = useTabletopStore.getState();
      const board = createSessionBoardFromMap(state.map, {
        id: activeSessionBoardId,
        sourceMapId: activeSessionBoardId ? undefined : state.map.id
      });
      saveSessionMutation.mutate({ board, boardId: activeSessionBoardId });
    }, 900);
    return () => {
      if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
    };
  }, [activeSessionBoardId, dirty, map]);

  const maps = mapsQuery.data?.maps || [];
  const sessions = sessionBoardsQuery.data?.boards || [];
  const saving = saveMutation.isPending
    || loadMutation.isPending
    || deleteMutation.isPending
    || createSessionMutation.isPending
    || loadSessionMutation.isPending
    || saveSessionMutation.isPending
    || deleteSessionMutation.isPending;

  return (
    <div className="grid min-h-0 gap-4">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <span className="text-xs font-black uppercase text-violet">Mesa</span>
            <h2 className="mt-2 text-2xl font-black text-textMain">Criador de mapas</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge tone={map.mode === 'build' ? 'accent' : 'neutral'}>{map.mode === 'build' ? 'Modo construcao' : 'Modo sessao'}</Badge>
              <Badge>{map.width}x{map.height}</Badge>
              <Badge>Grid {map.gridSize}</Badge>
            </div>
          </div>
          {message ? <Badge tone={message.includes('Falha') ? 'danger' : 'good'}>{message}</Badge> : null}
        </div>
      </Card>

      {map.mode === 'session' ? (
        <SessionModeView
          tokens={availableTokens}
          maps={maps}
          mapsLoading={mapsQuery.isLoading || sessionBoardsQuery.isLoading || loadMutation.isPending || loadSessionMutation.isPending}
          sessions={sessions}
          activeSessionBoardId={activeSessionBoardId}
          saving={saving}
          saveStatus={sessionSaveStatus}
          onSave={handleSave}
          onBackToBuild={handleBackToBuild}
          onCreateSessionFromMap={handleCreateSessionFromMap}
          onAddMapInstance={handleAddMapInstance}
          onLoadSessionBoard={(boardId) => loadSessionMutation.mutate(boardId)}
          onDeleteSessionBoard={handleDeleteSessionBoard}
        />
      ) : (
        <>
          <MapToolbar saving={saving} onNew={handleNew} onSave={handleSave} onDelete={handleDelete} onModeChange={handleModeChange} />

          <div className="grid min-h-0 gap-4 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
        <div className="grid min-h-0 content-start gap-4">
          <PanelTabs
            value={leftTab}
            onChange={(value) => setLeftTab(value as typeof leftTab)}
            tabs={[
              { id: 'map', label: 'Mapa' },
              { id: 'assets', label: 'Assets' },
              { id: 'tools', label: 'Ferramentas' }
            ]}
          />
          {leftTab === 'map' ? (
            <>
              <MapSettings map={map} onChange={setMapMeta} />
              <MapListPanel
                maps={maps}
                activeMapId={map.id}
                loading={mapsQuery.isLoading || loadMutation.isPending}
                onLoad={(mapId) => loadMutation.mutate({ mapId, mode: 'build' })}
              />
            </>
          ) : null}
          {leftTab === 'assets' && map.mode === 'build' ? (
            <>
              <AssetPalette />
              <PrefabPanel
                map={map}
                onInsert={(prefabId) => insertPrefab(prefabId, map.gridSize * 2, map.gridSize * 2)}
                onRemove={removePrefab}
              />
            </>
          ) : null}
          {leftTab === 'assets' && map.mode !== 'build' ? <TokenPanel tokens={availableTokens} /> : null}
          {leftTab === 'tools' ? <ShortcutPanel /> : null}
        </div>

        <div className="grid min-h-0 content-start gap-2">
          <MapStage />
          <StatusBar
            tool={tool}
            layer={map.activeLayer}
            assetName={selectedAsset?.name || '-'}
            assetType={selectedAsset?.typeCategory ? ASSET_TYPE_LABELS[selectedAsset.typeCategory] : '-'}
            brushSize={brushSize}
            eraseMode={eraseMode}
            snapMode={snapMode}
            rotation={placementRotation}
            selectedCount={selectedObjectIds.length + selectedTileCells.length}
          />
        </div>

        <div className="grid min-h-0 content-start gap-4">
          <PanelTabs
            value={rightTab}
            onChange={(value) => setRightTab(value as typeof rightTab)}
            tabs={[
              { id: 'layers', label: 'Camadas' },
              { id: 'inspector', label: 'Inspetor' },
              { id: 'selection', label: 'Selecao' },
              { id: 'session', label: 'Sessao' }
            ]}
          />
          {rightTab === 'layers' ? <LayerPanel /> : null}
          {rightTab === 'inspector' ? <ObjectInspector /> : null}
          {rightTab === 'selection' ? (
            <>
              <SelectionReadout objects={selectedObjectIds.length} cells={selectedTileCells.length} />
              <ObjectInspector />
            </>
          ) : null}
          {rightTab === 'session' ? (
            <>
              <SessionReadout map={map} />
            </>
          ) : null}
        </div>
      </div>
        </>
      )}
    </div>
  );
}

function createLocalId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function clonePlain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function stripSessionStateForMap(sourceMap: OmniMap): OmniMap {
  const next = clonePlain(sourceMap);
  return {
    ...next,
    mode: 'build',
    tokens: [],
    fogLayer: {
      ...next.fogLayer,
      revealedCells: []
    },
    areaTemplates: [],
    sessionMapInstances: []
  };
}

function createSessionMapFromBase(sourceMap: OmniMap): OmniMap {
  const base = stripSessionStateForMap(sourceMap);
  return {
    ...base,
    mode: 'session',
    sessionLighting: {
      globalIllumination: base.sessionLighting?.globalIllumination ?? true,
      darkness: base.sessionLighting?.darkness ?? 0,
      ambientColor: base.sessionLighting?.ambientColor || '#d8e6ff',
      ambientIntensity: base.sessionLighting?.ambientIntensity ?? 1,
      playerVisible: base.sessionLighting?.playerVisible ?? false,
      regions: base.sessionLighting?.regions || base.lightingRegions || []
    },
    lightingRegions: base.lightingRegions || base.sessionLighting?.regions || []
  };
}

function createSessionBoardFromMap(sourceMap: OmniMap, options: { id?: string; sourceMapId?: string; name?: string } = {}): SessionBoard {
  const store = useTabletopStore.getState();
  const activeMap = sourceMap.mode === 'session' ? clonePlain(sourceMap) : createSessionMapFromBase(sourceMap);
  const sourceMapId = options.sourceMapId || activeMap.id;
  const sourceMapName = sourceMap.name || activeMap.name || 'Mapa';
  const lighting = buildSessionLighting(activeMap);
  activeMap.mode = 'session';
  activeMap.sessionLighting = lighting;
  activeMap.lightingRegions = lighting.regions;
  const mainInstance = {
    id: 'main',
    sourceMapId,
    sourceMapName,
    name: sourceMapName,
    x: 0,
    y: 0,
    width: activeMap.width,
    height: activeMap.height,
    gridSize: activeMap.gridSize,
    rotation: 0,
    locked: true,
    visibleToPlayers: true,
    opacity: 1,
    zIndex: 0
  };
  const mapInstances = activeMap.sessionMapInstances?.length ? activeMap.sessionMapInstances : [mainInstance];

  return {
    id: options.id || createLocalId('session'),
    name: options.name || `Sessao - ${sourceMapName}`,
    sourceMapId,
    sourceMapName,
    activeMap,
    mapInstances,
    activeMapInstanceId: mapInstances[0]?.id || 'main',
    tokens: activeMap.tokens || [],
    doorStates: extractDoorStates(activeMap),
    fog: buildSessionFog(activeMap),
    lighting,
    camera: {
      x: 0,
      y: 0,
      zoom: store.zoom
    },
    templates: activeMap.areaTemplates || [],
    combatStateId: '',
    playerPreviewEnabled: store.sessionViewMode === 'player-preview',
    metersPerCell: activeMap.metersPerCell || 1.5,
    viewMode: store.sessionViewMode
  };
}

function mapFromSessionBoard(board: SessionBoard): OmniMap {
  const fallback = createBlankMap(board.sourceMapName || board.name || 'Sessao');
  const activeMap = clonePlain(board.activeMap || fallback);
  const next: OmniMap = {
    ...activeMap,
    mode: 'session',
    tokens: board.tokens || activeMap.tokens || [],
    fogLayer: {
      ...(activeMap.fogLayer || fallback.fogLayer),
      revealedCells: board.fog?.exploredCells || activeMap.fogLayer?.revealedCells || []
    },
    sessionLighting: board.lighting || activeMap.sessionLighting,
    lightingRegions: board.lighting?.regions || activeMap.lightingRegions || [],
    areaTemplates: board.templates || activeMap.areaTemplates || [],
    sessionMapInstances: (board.mapInstances || activeMap.sessionMapInstances || []).filter((instance) => instance.id !== 'main'),
    metersPerCell: board.metersPerCell || activeMap.metersPerCell || 1.5
  };

  const doorStates = new Map((board.doorStates || []).map((door) => [`${door.x}:${door.y}`, door]));
  next.tileLayers.doors.cells = next.tileLayers.doors.cells.map((cell) => {
    const door = doorStates.get(`${cell.x}:${cell.y}`);
    if (!door) return cell;
    return {
      ...cell,
      doorState: door.state,
      blocksMovement: door.state !== 'open',
      blocksVision: door.state !== 'open',
      blocksSound: door.blocksSound,
      secret: door.secret
    };
  });

  return next;
}

function extractDoorStates(map: OmniMap): SessionDoorState[] {
  return map.tileLayers.doors.cells.map((cell) => {
    const state = (cell.doorState || 'closed') as DoorState;
    return {
      id: `door-${cell.x}-${cell.y}`,
      x: cell.x,
      y: cell.y,
      state,
      locked: state === 'locked',
      secret: Boolean(cell.secret),
      blocksMovement: state !== 'open',
      blocksVision: state !== 'open',
      blocksSound: cell.blocksSound,
      updatedAt: new Date().toISOString()
    };
  });
}

function buildSessionFog(map: OmniMap): SessionFogState {
  const store = useTabletopStore.getState();
  const cells = map.fogLayer.revealedCells || [];
  return {
    enabled: store.sessionFogEnabled,
    mode: store.sessionDynamicVision ? 'dynamic' : 'manual',
    unexploredOpacity: 0.92,
    exploredOpacity: 0.42,
    visibleOpacity: 0,
    exploredCells: cells,
    manualHiddenCells: [],
    manualRevealedCells: cells
  };
}

function buildSessionLighting(map: OmniMap): SessionLightingState {
  const store = useTabletopStore.getState();
  const current = map.sessionLighting;
  const regions = current?.regions || map.lightingRegions || [];
  return {
    globalIllumination: current?.globalIllumination ?? true,
    darkness: store.sessionGlobalDarkness,
    ambientColor: current?.ambientColor || '#d8e6ff',
    ambientIntensity: current?.ambientIntensity ?? 1,
    playerVisible: current?.playerVisible ?? false,
    regions
  };
}

function MapSettings({
  map,
  onChange
}: {
  map: OmniMap;
  onChange(patch: Partial<Pick<OmniMap, 'name' | 'width' | 'height' | 'gridSize' | 'metersPerCell'>>): void;
}) {
  return (
    <section className="rounded-lg border border-line bg-panel/90 p-3">
      <p className="text-xs font-black uppercase text-violet">Mapa</p>
      <div className="mt-3 grid gap-3">
        <label className="text-sm font-semibold text-textMuted">
          Nome
          <input
            className="mt-1 w-full rounded-lg border border-line bg-white/5 px-3 py-2 text-textMain"
            value={map.name}
            onChange={(event) => onChange({ name: event.target.value, width: map.width, height: map.height, gridSize: map.gridSize })}
          />
        </label>
        <div className="grid grid-cols-3 gap-2">
          <NumberField label="Largura" value={map.width} min={8} max={120} onChange={(width) => onChange({ name: map.name, width, height: map.height, gridSize: map.gridSize })} />
          <NumberField label="Altura" value={map.height} min={8} max={120} onChange={(height) => onChange({ name: map.name, width: map.width, height, gridSize: map.gridSize })} />
          <NumberField label="Grid" value={map.gridSize} min={24} max={96} onChange={(gridSize) => onChange({ name: map.name, width: map.width, height: map.height, gridSize })} />
        </div>
        <NumberField label="m/cel" value={map.metersPerCell || 1.5} min={0.5} max={10} step={0.5} onChange={(metersPerCell) => onChange({ metersPerCell })} />
      </div>
    </section>
  );
}

function NumberField({ label, value, min, max, step = 1, onChange }: { label: string; value: number; min: number; max: number; step?: number; onChange(value: number): void }) {
  return (
    <label className="text-xs font-semibold text-textMuted">
      {label}
      <input
        className="mt-1 w-full rounded-lg border border-line bg-white/5 px-2 py-2 text-textMain"
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function PanelTabs<T extends string>({
  value,
  tabs,
  onChange
}: {
  value: T;
  tabs: Array<{ id: T; label: string }>;
  onChange(value: T): void;
}) {
  return (
    <div className="grid gap-2 rounded-lg border border-line bg-panel/90 p-2" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`rounded-lg border px-2 py-2 text-sm font-black transition ${value === tab.id ? 'border-vita/60 bg-vita/20 text-textMain' : 'border-line bg-white/5 text-textMuted hover:bg-white/10'}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function StatusBar({
  tool,
  layer,
  assetName,
  assetType,
  brushSize,
  eraseMode,
  snapMode,
  rotation,
  selectedCount
}: {
  tool: MapTool;
  layer: MapLayerKey;
  assetName: string;
  assetType: string;
  brushSize: number;
  eraseMode: EraseMode;
  snapMode: SnapMode;
  rotation: number;
  selectedCount: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-panel/90 px-3 py-2 text-sm text-textMuted">
      <StatusPill label="Ferramenta" value={tool} />
      <StatusPill label="Camada" value={layer} />
      <StatusPill label="Asset" value={`${assetName} (${assetType})`} />
      <StatusPill label="Rotacao" value={`${rotation}°`} />
      <StatusPill label="Selecao" value={String(selectedCount)} />
      <StatusPill label="Brush" value={`${brushSize}x${brushSize}`} />
      <StatusPill label="Apagar" value={eraseModeLabel(eraseMode)} />
      <StatusPill label="Snap" value={snapMode === 'fine' ? 'Fino' : snapMode === 'grid' ? 'Grid' : 'Livre'} />
    </div>
  );
}

function StatusPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-lg border border-line bg-white/5 px-2 py-1">
      <span className="font-bold text-violet">{label}: </span>
      <span className="text-textMain">{value}</span>
    </span>
  );
}

function eraseModeLabel(mode: EraseMode) {
  if (mode === 'activeLayer') return 'Camada ativa';
  if (mode === 'allUnlocked') return 'Todas livres';
  return 'Topo visivel';
}

function ShortcutPanel() {
  const lines = [
    'V selecionar, B piso, W parede, O objeto',
    'D porta, L luz, N nota, F fog, C colisao, E apagar',
    'M regua, P ping',
    'Delete remove, Ctrl+D duplica, Ctrl+Z desfaz',
    'R gira +45, Shift+R gira -45',
    'Setas movem 1px, Alt+setas 4px, Shift+setas 1 celula',
    '[ e ] mudam brush, G alterna grid, Shift+L trava camada, Esc limpa selecao'
  ];
  return (
    <section className="rounded-lg border border-line bg-panel/90 p-3">
      <p className="text-xs font-black uppercase text-violet">Comandos</p>
      <div className="mt-3 grid gap-2 text-sm text-textMuted">
        {lines.map((line) => <p key={line}>{line}</p>)}
      </div>
    </section>
  );
}

function SessionReadout({ map }: { map: OmniMap }) {
  const visibleTokens = map.tokens.filter((token) => token.visibleToPlayers).length;
  const hiddenTokens = map.tokens.length - visibleTokens;
  return (
    <section className="rounded-lg border border-line bg-panel/90 p-3">
      <p className="text-xs font-black uppercase text-violet">Sessao</p>
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <MiniStat label="Tokens" value={map.tokens.length} />
        <MiniStat label="Ocultos" value={hiddenTokens} />
        <MiniStat label="Objetos" value={map.objectLayer.objects.length + map.decorationLayer.objects.length + map.detailLayer.objects.length} />
        <MiniStat label="Fog" value={map.fogLayer.revealedCells.length} />
      </div>
    </section>
  );
}

function SelectionReadout({ objects, cells }: { objects: number; cells: number }) {
  return (
    <section className="rounded-lg border border-line bg-panel/90 p-3">
      <p className="text-xs font-black uppercase text-violet">Selecao</p>
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <MiniStat label="Objetos" value={objects} />
        <MiniStat label="Celulas" value={cells} />
      </div>
      <p className="mt-2 text-xs text-textMuted">Use V para selecionar, Shift+clique para somar e arraste no vazio para selecionar area.</p>
    </section>
  );
}

function PrefabPanel({
  map,
  onInsert,
  onRemove
}: {
  map: OmniMap;
  onInsert(prefabId: string): void;
  onRemove(prefabId: string): void;
}) {
  return (
    <section className="rounded-lg border border-line bg-panel/90 p-3">
      <p className="text-xs font-black uppercase text-violet">Prefabs</p>
      <div className="mt-3 grid gap-2">
        {(map.prefabs || []).map((prefab) => (
          <div key={prefab.id} className="rounded-lg border border-line bg-white/5 p-2">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <strong className="block truncate text-sm text-textMain">{prefab.name}</strong>
                <span className="text-xs text-textMuted">{prefab.objects.length} objeto(s)</span>
              </div>
              <div className="flex gap-1">
                <Button type="button" onClick={() => onInsert(prefab.id)}>+</Button>
                <Button type="button" tone="danger" onClick={() => onRemove(prefab.id)}>x</Button>
              </div>
            </div>
          </div>
        ))}
        {!map.prefabs?.length ? <p className="text-sm text-textMuted">Selecione objetos e salve uma composicao no inspetor.</p> : null}
      </div>
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-line bg-white/5 p-2">
      <span className="block text-xs text-textMuted">{label}</span>
      <strong className="text-lg text-textMain">{value}</strong>
    </div>
  );
}

function buildAvailableTokens(characters: CharacterSheet[], combatants: Array<Combatant & Record<string, unknown>>): AvailableTabletopToken[] {
  const characterTokens = characters.map(hydrateCharacter).map((character) => ({
    id: `char-${character.id}`,
    sourceId: character.id,
    kind: 'character' as const,
    name: character.identity.name || 'Personagem',
    image: character.identity.image,
    hpCurrent: Number(character.resources.pvCurrent || 0),
    hpMax: 0,
    subtitle: `${character.identity.className || 'Player'} Nv ${character.identity.level || 1}`
  }));

  const combatTokens = combatants.map((combatant) => ({
    id: `combat-${combatant.instanceId}`,
    sourceId: combatant.instanceId,
    kind: combatant.combatantType === 'enemy' ? 'enemy' as const : combatant.combatantType === 'character' ? 'character' as const : 'companion' as const,
    name: combatant.name || 'Combatente',
    image: combatant.image,
    hpCurrent: Number(combatant.pvCurrent || 0),
    hpMax: Number(combatant.pvMax || 0),
    subtitle: combatant.subtitle || combatant.combatantType
  }));

  const byId = new Map<string, AvailableTabletopToken>();
  [...combatTokens, ...characterTokens].forEach((token) => byId.set(token.id, token));
  return Array.from(byId.values());
}
