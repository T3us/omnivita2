import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../../../api/client';
import { subscribeTabletopSessionBoard } from '../../../api/socket';
import type { CharacterSheet, Combatant, DoorState, MapBounds, OmniMap, SessionBoard, SessionDoorState, SessionFogState, SessionLightingState } from '../../../api/types';
import { useAuth } from '../../../auth/auth-context';
import { hydrateCharacter } from '../../../domain/system';
import { useBootstrap } from '../../../hooks/useBootstrap';
import { getDefaultSavedMap, seedDefaultSavedMaps, isDefaultSavedMap } from '../defaultMaps';
import { createBlankMap } from '../mapFactory';
import { useTabletopStore } from '../mapStore';
import type { AvailableTabletopToken } from '../types';
import { VttShell } from './VttShell';
import type { SaveAreaMeta } from './VttSaveAreaModal';

const CUSTOM_TOKENS_KEY = 'omnivita_vtt_custom_tokens_v1';
const ACTIVE_SESSION_BOARD_QUERY_KEY = ['active-session-board'] as const;
const SYNC_POLL_MS = 1200;
const SESSION_AUTOSAVE_MS = 850;

export function VttPage({ playerMode = false }: { playerMode?: boolean } = {}) {
  const queryClient = useQueryClient();
  const location = useLocation();
  const { session } = useAuth();
  const bootstrap = useBootstrap();
  const map = useTabletopStore((state) => state.map);
  const dirty = useTabletopStore((state) => state.dirty);
  const setMap = useTabletopStore((state) => state.setMap);
  const clearDirty = useTabletopStore((state) => state.clearDirty);
  const [activeSessionBoardId, setActiveSessionBoardId] = useState('');
  const activeSessionBoardIdRef = useRef('');
  const [, setMessage] = useState('Tabletop dedicado pronto.');
  const [customTokens, setCustomTokens] = useState<AvailableTabletopToken[]>(() => readCustomTokens());
  const [lastSavedAt, setLastSavedAt] = useState('');
  const [lastFetchedAt, setLastFetchedAt] = useState('');
  const [lastSyncEvent, setLastSyncEvent] = useState('');
  const [syncSource, setSyncSource] = useState<'backend' | 'socket' | 'local' | 'none'>('none');
  const [autosaving, setAutosaving] = useState(false);
  const applyingRemoteRef = useRef(false);
  const autosaveTimerRef = useRef<number | null>(null);
  const autosavingRef = useRef(false);
  const debugSync = useMemo(() => new URLSearchParams(location.search).get('debugSync') === '1', [location.search]);
  const shouldUseActiveSession = playerMode || location.pathname === '/tabletop' || location.pathname.endsWith('/session');

  useEffect(() => {
    activeSessionBoardIdRef.current = activeSessionBoardId;
  }, [activeSessionBoardId]);

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, []);

  useEffect(() => {
    if (playerMode) {
      useTabletopStore.getState().setMode('session');
      return;
    }
    if (location.pathname.endsWith('/session')) useTabletopStore.getState().setMode('session');
    if (location.pathname.endsWith('/build')) useTabletopStore.getState().setMode('build');
  }, [location.pathname, playerMode]);

  const ownedCharacterIds = useMemo(() => buildOwnedCharacterIds(session?.user.characterId || '', session?.user.id || '', bootstrap.data?.characters || []), [bootstrap.data?.characters, session?.user.characterId, session?.user.id]);

  useEffect(() => {
    useTabletopStore.getState().setTabletopIdentity(playerMode ? 'player' : 'gm', session?.user.id || '', ownedCharacterIds);
  }, [ownedCharacterIds, playerMode, session?.user.id]);

  const mapsQuery = useQuery({
    queryKey: ['maps'],
    queryFn: () => api.listMaps(),
    enabled: !playerMode
  });
  const activeBoardQuery = useQuery({
    queryKey: ACTIVE_SESSION_BOARD_QUERY_KEY,
    queryFn: () => api.getActiveSessionBoard(),
    enabled: shouldUseActiveSession,
    refetchInterval: playerMode ? SYNC_POLL_MS : false,
    refetchIntervalInBackground: playerMode,
    refetchOnWindowFocus: true,
    staleTime: 0
  });
  const savedMaps = useMemo(() => seedDefaultSavedMaps(mapsQuery.data?.maps || []), [mapsQuery.data?.maps]);

  const availableTokens = useMemo(() => buildAvailableTokens(
    bootstrap.data?.characters || [],
    bootstrap.data?.combatState?.combatants || []
  ), [bootstrap.data?.characters, bootstrap.data?.combatState?.combatants]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const state = useTabletopStore.getState();
      if (state.map.mode === 'session') {
        const board = buildSessionBoardFromMap(state.map, activeSessionBoardId);
        return activeSessionBoardId
          ? api.updateSessionBoard(activeSessionBoardId, board).then((result) => ({ kind: 'session' as const, board: result.board }))
          : api.createSessionBoard(board).then((result) => ({ kind: 'session' as const, board: result.board }));
      }
      return api.createMap(stripSessionStateForMap(state.map)).then((result) => ({ kind: 'map' as const, map: result.map }));
    },
    onSuccess: (result) => {
      if (result.kind === 'session') {
        setActiveSessionBoardId(result.board.id);
        activeSessionBoardIdRef.current = result.board.id;
        setLastSavedAt(new Date().toISOString());
        setLastSyncEvent('manual-save');
        setSyncSource('backend');
        queryClient.setQueryData(ACTIVE_SESSION_BOARD_QUERY_KEY, { board: result.board });
        queryClient.invalidateQueries({ queryKey: ACTIVE_SESSION_BOARD_QUERY_KEY });
        setMessage('Sessao salva.');
        queryClient.invalidateQueries({ queryKey: ['session-boards'] });
      } else {
        setMap({ ...result.map, mode: 'build' });
        setActiveSessionBoardId('');
        setMessage('Mapa salvo.');
        queryClient.invalidateQueries({ queryKey: ['maps'] });
      }
      clearDirty();
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : 'Falha ao salvar.')
  });

  useEffect(() => {
    if (!shouldUseActiveSession) return;
    const board = activeBoardQuery.data?.board;
    setLastFetchedAt(new Date().toISOString());
    if (!board?.activeMap) {
      setSyncSource('backend');
      return;
    }
    setActiveSessionBoardId(board.id);
    activeSessionBoardIdRef.current = board.id;
    setSyncSource('backend');
    setLastSyncEvent(playerMode ? 'poll-player' : 'poll-gm');

    const store = useTabletopStore.getState();
    if (!playerMode && store.dirty) return;
    applyingRemoteRef.current = true;
    setMap({ ...board.activeMap, mode: 'session' });
    clearDirty();
    window.setTimeout(() => {
      applyingRemoteRef.current = false;
    }, 0);
  }, [activeBoardQuery.data?.board?.id, activeBoardQuery.data?.board?.updatedAt, activeBoardQuery.data?.board, clearDirty, playerMode, setMap, shouldUseActiveSession]);

  useEffect(() => {
    if (!shouldUseActiveSession) return undefined;
    return subscribeTabletopSessionBoard((board, meta) => {
      setLastFetchedAt(new Date().toISOString());
      setLastSyncEvent(String(meta?.reason || 'socket'));
      setSyncSource('socket');
      if (!board?.activeMap) return;
      queryClient.setQueryData(ACTIVE_SESSION_BOARD_QUERY_KEY, { board });
      setActiveSessionBoardId(board.id);
      activeSessionBoardIdRef.current = board.id;
      if (!playerMode && useTabletopStore.getState().dirty) return;
      applyingRemoteRef.current = true;
      setMap({ ...board.activeMap, mode: 'session' });
      clearDirty();
      window.setTimeout(() => {
        applyingRemoteRef.current = false;
      }, 0);
    });
  }, [clearDirty, playerMode, queryClient, setMap, shouldUseActiveSession]);

  useEffect(() => {
    if (playerMode) return undefined;
    const unsubscribe = useTabletopStore.subscribe((state, previous) => {
      if (applyingRemoteRef.current || autosavingRef.current) return;
      if (state.tabletopRole !== 'gm' || state.map.mode !== 'session' || !state.dirty) return;
      if (state.map === previous.map && state.dirty === previous.dirty) return;
      if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = window.setTimeout(async () => {
        const current = useTabletopStore.getState();
        if (applyingRemoteRef.current || current.tabletopRole !== 'gm' || current.map.mode !== 'session' || !current.dirty) return;
        autosavingRef.current = true;
        setAutosaving(true);
        const board = buildSessionBoardFromMap(current.map, activeSessionBoardIdRef.current);
        try {
          const wasExistingBoard = Boolean(activeSessionBoardIdRef.current);
          const result = activeSessionBoardIdRef.current
            ? await api.updateSessionBoard(activeSessionBoardIdRef.current, board)
            : await api.createSessionBoard(board);
          setActiveSessionBoardId(result.board.id);
          activeSessionBoardIdRef.current = result.board.id;
          setLastSavedAt(new Date().toISOString());
          setLastSyncEvent(wasExistingBoard ? 'autosave-update' : 'autosave-create');
          setSyncSource('backend');
          queryClient.setQueryData(ACTIVE_SESSION_BOARD_QUERY_KEY, { board: result.board });
          queryClient.invalidateQueries({ queryKey: ACTIVE_SESSION_BOARD_QUERY_KEY });
          queryClient.invalidateQueries({ queryKey: ['session-boards'] });
          clearDirty();
        } catch (error) {
          console.warn('[OmniVita tabletop] Falha no autosave da sessao.', error);
          setLastSyncEvent('autosave-error');
        } finally {
          autosavingRef.current = false;
          setAutosaving(false);
        }
      }, SESSION_AUTOSAVE_MS);
    });
    return () => {
      unsubscribe();
      if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
    };
  }, [clearDirty, playerMode, queryClient]);

  useEffect(() => {
    if (!playerMode) return undefined;
    const timers = new Map<string, number>();
    const unsubscribe = useTabletopStore.subscribe((state, previous) => {
      if (applyingRemoteRef.current || state.tabletopRole !== 'player') return;
      state.map.tokens.forEach((token) => {
        const previousToken = previous.map.tokens.find((entry) => entry.id === token.id);
        if (!previousToken || previousToken.x === token.x && previousToken.y === token.y) return;
        const existingTimer = timers.get(token.id);
        if (existingTimer) window.clearTimeout(existingTimer);
        timers.set(token.id, window.setTimeout(() => {
          api.moveActiveSessionToken(token.id, { x: token.x, y: token.y }).catch((error) => {
            console.warn('[OmniVita tabletop] Falha ao sincronizar movimento de token.', error);
            activeBoardQuery.refetch();
          });
        }, 250));
      });
    });
    return () => {
      unsubscribe();
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [activeBoardQuery, playerMode]);

  async function handleLoadMap(mapId: string, mode: OmniMap['mode']) {
    try {
      const defaultMap = getDefaultSavedMap(mapId);
      const result = defaultMap ? { map: defaultMap } : await api.getMap(mapId);
      setMap({ ...stripSessionStateForMap(result.map), mode });
      setActiveSessionBoardId('');
      clearDirty();
      setMessage(mode === 'build' ? 'Mapa carregado.' : 'Mapa adicionado a sessao.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Falha ao carregar mapa.');
    }
  }

  async function handleAddMap(mapId: string, placement?: { x: number; y: number }) {
    try {
      const defaultMap = getDefaultSavedMap(mapId);
      const result = defaultMap ? { map: defaultMap } : await api.getMap(mapId);
      const state = useTabletopStore.getState();
      const offset = (state.map.sessionMapInstances?.length || 0) * state.map.gridSize * 4;
      const cleanMap = stripSessionStateForMap(result.map);
      state.addSessionMapInstance(cleanMap, placement?.x ?? offset, placement?.y ?? 0);
      state.setMode('session');
      setMessage('Mapa adicionado ao board.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Falha ao adicionar mapa.');
    }
  }

  async function handlePrepareMap(mapId: string) {
    const defaultMap = getDefaultSavedMap(mapId);
    if (defaultMap) return stripSessionStateForMap(defaultMap);
    const result = await api.getMap(mapId);
    return stripSessionStateForMap(result.map);
  }

  async function handleSaveMapArea(bounds: MapBounds, meta: SaveAreaMeta) {
    const state = useTabletopStore.getState();
    const payload = stripSessionStateForMap({
      ...state.map,
      id: createLocalId('map'),
      name: meta.name || 'Novo mapa',
      description: meta.description,
      theme: meta.theme,
      tags: meta.tags,
      gridSize: meta.gridSize || state.map.gridSize,
      bounds
    });
    await api.createMap(payload);
    queryClient.invalidateQueries({ queryKey: ['maps'] });
    setMessage(`Mapa "${payload.name}" salvo.`);
  }

  async function handleRenameMap(mapId: string, name: string) {
    if (isDefaultSavedMap(mapId)) {
      setMessage('Mapas padrao sao presets. Duplique para renomear.');
      return;
    }
    const result = await api.getMap(mapId);
    await api.updateMap(mapId, { ...result.map, name });
    queryClient.invalidateQueries({ queryKey: ['maps'] });
    if (useTabletopStore.getState().map.id === mapId) useTabletopStore.getState().setMapMeta({ name });
  }

  async function handleDuplicateMap(mapId: string) {
    const defaultMap = getDefaultSavedMap(mapId);
    const result = defaultMap ? { map: defaultMap } : await api.getMap(mapId);
    await api.createMap({ ...result.map, id: createLocalId('map'), name: `${result.map.name || 'Mapa'} copia` });
    queryClient.invalidateQueries({ queryKey: ['maps'] });
  }

  async function handleDeleteMap(mapId: string) {
    if (isDefaultSavedMap(mapId)) {
      setMessage('Mapas padrao nao podem ser excluidos.');
      return;
    }
    await api.deleteMap(mapId);
    queryClient.invalidateQueries({ queryKey: ['maps'] });
  }

  return (
    <>
      {playerMode && !activeBoardQuery.data?.board?.activeMap ? (
        <PlayerSessionWaiting loading={activeBoardQuery.isLoading} onRefresh={() => activeBoardQuery.refetch()} />
      ) : (
        <VttShell
          maps={savedMaps}
          tokens={availableTokens}
          customTokens={customTokens}
          loadingMaps={mapsQuery.isLoading}
          saving={saveMutation.isPending || autosaving}
          onSave={() => saveMutation.mutate()}
          onSaveMapArea={handleSaveMapArea}
          onLoadMap={handleLoadMap}
          onAddMap={handleAddMap}
          onPrepareMap={handlePrepareMap}
          onRenameMap={handleRenameMap}
          onDuplicateMap={handleDuplicateMap}
          onDeleteMap={handleDeleteMap}
          onCreateToken={(token) => {
            setCustomTokens((current) => {
              const next = [token, ...current.filter((entry) => entry.id !== token.id)];
              writeCustomTokens(next);
              return next;
            });
            setMessage(`${token.name} salvo na biblioteca.`);
          }}
          playerMode={playerMode}
        />
      )}
      {debugSync ? (
        <VttSyncDebug
          playerMode={playerMode}
          activeSessionBoardId={activeSessionBoardId}
          board={activeBoardQuery.data?.board || null}
          dirty={dirty}
          lastSavedAt={lastSavedAt}
          lastFetchedAt={lastFetchedAt}
          syncSource={syncSource}
          pollingEnabled={playerMode}
          lastSyncEvent={lastSyncEvent}
          fetching={activeBoardQuery.isFetching}
          autosaving={autosaving}
        />
      ) : null}
    </>
  );
}

function PlayerSessionWaiting({ loading, onRefresh }: { loading: boolean; onRefresh(): void }) {
  return (
    <main className="fixed inset-0 grid place-items-center bg-[#07040d] px-4 text-textMain">
      <div className="w-[min(420px,calc(100vw-32px))] rounded-xl border border-white/10 bg-[#12101a]/92 p-5 text-center shadow-soft">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-vitaMuted">Tabletop Player</p>
        <h1 className="mt-3 text-xl font-black text-white">
          {loading ? 'Carregando sessao...' : 'Aguardando o mestre iniciar uma sessao.'}
        </h1>
        <p className="mt-2 text-sm font-semibold text-vitaMuted">
          Quando o mestre salvar ou atualizar a cena ativa, ela aparece aqui automaticamente.
        </p>
        <button
          type="button"
          onClick={onRefresh}
          className="mt-4 rounded-lg border border-vita/40 bg-vita/15 px-3 py-2 text-sm font-bold text-white hover:bg-vita/25"
        >
          Atualizar
        </button>
      </div>
    </main>
  );
}

function VttSyncDebug({
  playerMode,
  activeSessionBoardId,
  board,
  dirty,
  lastSavedAt,
  lastFetchedAt,
  syncSource,
  pollingEnabled,
  lastSyncEvent,
  fetching,
  autosaving
}: {
  playerMode: boolean;
  activeSessionBoardId: string;
  board: SessionBoard | null;
  dirty: boolean;
  lastSavedAt: string;
  lastFetchedAt: string;
  syncSource: string;
  pollingEnabled: boolean;
  lastSyncEvent: string;
  fetching: boolean;
  autosaving: boolean;
}) {
  const currentMap = useTabletopStore((state) => state.map);
  const tokenCount = currentMap.tokens.length;
  const mapInstanceCount = currentMap.sessionMapInstances?.length || 0;
  return (
    <div className="pointer-events-none fixed right-4 top-[54px] z-[70] w-80 rounded-xl border border-cyan-300/25 bg-[#100c18]/92 p-3 text-[11px] font-semibold text-vitaMuted shadow-soft backdrop-blur">
      <div className="mb-1 text-xs font-black uppercase tracking-wide text-cyan-100">Sync Debug</div>
      <div className="grid grid-cols-[128px_1fr] gap-x-2 gap-y-1">
        <span>Route</span><span className="text-white">{playerMode ? 'player' : currentMap.mode === 'session' ? 'gm/session' : 'gm/build'}</span>
        <span>Board id</span><span className="truncate text-white">{activeSessionBoardId || board?.id || '-'}</span>
        <span>Board title</span><span className="truncate text-white">{board?.name || '-'}</span>
        <span>Board updated</span><span className="truncate text-white">{board?.updatedAt || '-'}</span>
        <span>Dirty</span><span className={dirty ? 'text-amber-200' : 'text-emerald-200'}>{String(dirty)}</span>
        <span>Autosave</span><span className={autosaving ? 'text-amber-200' : 'text-white'}>{String(autosaving)}</span>
        <span>Last saved</span><span className="truncate text-white">{lastSavedAt || '-'}</span>
        <span>Last fetched</span><span className="truncate text-white">{lastFetchedAt || '-'}</span>
        <span>Source</span><span className="text-white">{syncSource}</span>
        <span>Maps</span><span className="text-white">{mapInstanceCount}</span>
        <span>Tokens</span><span className="text-white">{tokenCount}</span>
        <span>Polling</span><span className="text-white">{String(pollingEnabled)}</span>
        <span>Socket</span><span className="text-white">best-effort</span>
        <span>Room</span><span className="truncate text-white">{activeSessionBoardId ? `session:${activeSessionBoardId}` : 'active-session'}</span>
        <span>Fetching</span><span className="text-white">{String(fetching)}</span>
        <span>Last event</span><span className="truncate text-white">{lastSyncEvent || '-'}</span>
      </div>
    </div>
  );
}

function readCustomTokens(): AvailableTabletopToken[] {
  try {
    const raw = window.localStorage.getItem(CUSTOM_TOKENS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AvailableTabletopToken[];
    return Array.isArray(parsed) ? parsed.filter((entry) => entry?.id && entry?.name) : [];
  } catch {
    return [];
  }
}

function writeCustomTokens(tokens: AvailableTabletopToken[]) {
  try {
    window.localStorage.setItem(CUSTOM_TOKENS_KEY, JSON.stringify(tokens));
  } catch {
    // Local storage can be unavailable; the token still works for this session.
  }
}

function buildAvailableTokens(characters: CharacterSheet[], combatants: Combatant[]): AvailableTabletopToken[] {
  const characterTokens = characters.map((sheet) => {
    const character = hydrateCharacter(sheet);
    return {
    id: `char-${character.id}`,
    sourceId: character.id,
    definitionId: `def-char-${character.id}`,
    ownerUserId: sheet.ownerUserId,
    ownerCharacterId: character.id,
    sourceSheetId: character.id,
    isPlayerToken: true,
    kind: 'character' as const,
    name: character.identity.name || 'Personagem',
    image: character.identity.image,
    hpCurrent: Number(character.resources.pvCurrent || 0),
    hpMax: 0,
    subtitle: `${character.identity.className || 'Player'} Nv ${character.identity.level || 1}`,
    visibleToPlayers: true,
    blocksMovement: false
  };
  });

  const combatTokens = combatants.map((combatant) => ({
    id: `combat-${combatant.instanceId}`,
    sourceId: combatant.instanceId,
    definitionId: `def-combat-${combatant.instanceId}`,
    kind: combatant.combatantType === 'enemy' ? 'enemy' as const : combatant.combatantType === 'character' ? 'character' as const : 'companion' as const,
    name: combatant.name || 'Combatente',
    image: combatant.image,
    hpCurrent: Number(combatant.pvCurrent || 0),
    hpMax: Number(combatant.pvMax || 0),
    subtitle: combatant.subtitle || combatant.combatantType,
    visibleToPlayers: combatant.combatantType !== 'enemy',
    blocksMovement: false
  }));

  const byId = new Map<string, AvailableTabletopToken>();
  [...combatTokens, ...characterTokens].forEach((token) => byId.set(token.id, token));
  return Array.from(byId.values());
}

function buildOwnedCharacterIds(sessionCharacterId: string, userId: string, characters: CharacterSheet[]) {
  const ids = new Set<string>();
  if (sessionCharacterId) ids.add(sessionCharacterId);
  characters.forEach((character) => {
    if (character.ownerUserId && userId && character.ownerUserId === userId) ids.add(character.id);
  });
  return Array.from(ids);
}

function stripSessionStateForMap(sourceMap: OmniMap): OmniMap {
  const source = clonePlain(sourceMap);
  const bounds = source.bounds || { x: 0, y: 0, width: source.width, height: source.height };
  const gridSize = source.gridSize || 32;
  const pixelBounds = {
    x: bounds.x * gridSize,
    y: bounds.y * gridSize,
    width: bounds.width * gridSize,
    height: bounds.height * gridSize
  };
  const next = clonePlain(source);
  return {
    ...next,
    name: next.name || 'Novo mapa',
    width: bounds.width,
    height: bounds.height,
    bounds: { x: 0, y: 0, width: bounds.width, height: bounds.height },
    mode: 'build',
    tileLayers: {
      floor: shiftTileLayer(next.tileLayers.floor, bounds),
      walls: shiftTileLayer(next.tileLayers.walls, bounds),
      doors: shiftTileLayer(next.tileLayers.doors, bounds),
      collision: shiftTileLayer(next.tileLayers.collision, bounds)
    },
    objectLayer: shiftObjectLayer(next.objectLayer, pixelBounds),
    decorationLayer: shiftObjectLayer(next.decorationLayer, pixelBounds),
    detailLayer: shiftObjectLayer(next.detailLayer, pixelBounds),
    lightingLayer: shiftObjectLayer(next.lightingLayer, pixelBounds),
    mechanicalLayer: shiftObjectLayer(next.mechanicalLayer, pixelBounds),
    notesLayer: shiftObjectLayer(next.notesLayer, pixelBounds),
    tokens: [],
    fogLayer: {
      ...next.fogLayer,
      revealedCells: (next.fogLayer.revealedCells || [])
        .filter((cell) => cellInsideBounds(cell.x, cell.y, bounds))
        .map((cell) => ({ ...cell, x: cell.x - bounds.x, y: cell.y - bounds.y }))
    },
    lightingRegions: shiftLightingRegions(next.lightingRegions || [], pixelBounds),
    sessionLighting: next.sessionLighting ? {
      ...next.sessionLighting,
      regions: shiftLightingRegions(next.sessionLighting.regions || [], pixelBounds)
    } : next.sessionLighting,
    areaTemplates: shiftTemplates(next.areaTemplates || [], pixelBounds),
    sessionMapInstances: []
  };
}

function shiftTileLayer(layer: OmniMap['tileLayers']['floor'], bounds: NonNullable<OmniMap['bounds']>) {
  return {
    ...layer,
    cells: (layer.cells || [])
      .filter((cell) => cellInsideBounds(cell.x, cell.y, bounds))
      .map((cell) => ({ ...cell, x: cell.x - bounds.x, y: cell.y - bounds.y }))
  };
}

function shiftObjectLayer(layer: OmniMap['objectLayer'], bounds: { x: number; y: number; width: number; height: number }) {
  return {
    ...layer,
    objects: (layer.objects || [])
      .filter((object) => rectsIntersect(
        { x: object.x, y: object.y, width: object.width * (object.scale || 1), height: object.height * (object.scale || 1) },
        bounds
      ))
      .map((object) => ({ ...object, x: object.x - bounds.x, y: object.y - bounds.y }))
  };
}

function shiftLightingRegions(regions: NonNullable<OmniMap['lightingRegions']>, bounds: { x: number; y: number; width: number; height: number }) {
  return regions
    .filter((region) => (region.points || []).some((point) => pointInsideRect(point.x, point.y, bounds)))
    .map((region) => ({
      ...region,
      points: region.points.map((point) => ({ x: point.x - bounds.x, y: point.y - bounds.y }))
    }));
}

function shiftTemplates(templates: NonNullable<OmniMap['areaTemplates']>, bounds: { x: number; y: number; width: number; height: number }) {
  return templates
    .filter((template) => pointInsideRect(template.x, template.y, bounds))
    .map((template) => ({ ...template, x: template.x - bounds.x, y: template.y - bounds.y }));
}

function cellInsideBounds(x: number, y: number, bounds: NonNullable<OmniMap['bounds']>) {
  return x >= bounds.x && y >= bounds.y && x < bounds.x + bounds.width && y < bounds.y + bounds.height;
}

function pointInsideRect(x: number, y: number, rect: { x: number; y: number; width: number; height: number }) {
  return x >= rect.x && y >= rect.y && x <= rect.x + rect.width && y <= rect.y + rect.height;
}

function rectsIntersect(a: { x: number; y: number; width: number; height: number }, b: { x: number; y: number; width: number; height: number }) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function buildSessionBoardFromMap(sourceMap: OmniMap, boardId?: string): SessionBoard {
  const activeMap = clonePlain(sourceMap);
  activeMap.mode = 'session';
  const lighting = buildSessionLighting(activeMap);
  return {
    id: boardId || createLocalId('session'),
    name: `Sessao - ${activeMap.name || 'OmniVita'}`,
    sourceMapId: activeMap.id,
    sourceMapName: activeMap.name,
    activeMap,
    mapInstances: activeMap.sessionMapInstances || [],
    activeMapInstanceId: activeMap.sessionMapInstances?.[0]?.id || '',
    tokens: activeMap.tokens || [],
    doorStates: extractDoorStates(activeMap),
    fog: buildSessionFog(activeMap),
    lighting,
    camera: { x: 0, y: 0, zoom: 1 },
    templates: activeMap.areaTemplates || [],
    combatStateId: '',
    playerPreviewEnabled: useTabletopStore.getState().sessionViewMode === 'player-preview',
    metersPerCell: activeMap.metersPerCell || 1.5,
    viewMode: useTabletopStore.getState().sessionViewMode
  };
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
  const current = map.sessionLighting;
  const regions = current?.regions || map.lightingRegions || [];
  return {
    globalIllumination: current?.globalIllumination ?? true,
    darkness: current?.darkness ?? useTabletopStore.getState().sessionGlobalDarkness,
    ambientColor: current?.ambientColor || '#d8e6ff',
    ambientIntensity: current?.ambientIntensity ?? 1,
    playerVisible: current?.playerVisible ?? false,
    regions
  };
}

function clonePlain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value || createBlankMap('Sessao'))) as T;
}

function createLocalId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
