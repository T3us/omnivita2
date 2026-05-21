import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../../../api/client';
import type { CharacterSheet, Combatant, DoorState, MapBounds, OmniMap, SessionBoard, SessionDoorState, SessionFogState, SessionLightingState } from '../../../api/types';
import { hydrateCharacter } from '../../../domain/system';
import { useBootstrap } from '../../../hooks/useBootstrap';
import { createBlankMap } from '../mapFactory';
import { useTabletopStore } from '../mapStore';
import type { AvailableTabletopToken } from '../types';
import { VttShell } from './VttShell';
import type { SaveAreaMeta } from './VttSaveAreaModal';

const CUSTOM_TOKENS_KEY = 'omnivita_vtt_custom_tokens_v1';

export function VttPage() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const bootstrap = useBootstrap();
  const map = useTabletopStore((state) => state.map);
  const setMap = useTabletopStore((state) => state.setMap);
  const clearDirty = useTabletopStore((state) => state.clearDirty);
  const [activeSessionBoardId, setActiveSessionBoardId] = useState('');
  const [, setMessage] = useState('Tabletop dedicado pronto.');
  const [customTokens, setCustomTokens] = useState<AvailableTabletopToken[]>(() => readCustomTokens());

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
    if (location.pathname.endsWith('/session')) useTabletopStore.getState().setMode('session');
    if (location.pathname.endsWith('/build')) useTabletopStore.getState().setMode('build');
  }, [location.pathname]);

  const mapsQuery = useQuery({
    queryKey: ['maps'],
    queryFn: () => api.listMaps()
  });

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

  async function handleLoadMap(mapId: string, mode: OmniMap['mode']) {
    try {
      const result = await api.getMap(mapId);
      setMap({ ...stripSessionStateForMap(result.map), mode });
      setActiveSessionBoardId('');
      clearDirty();
      setMessage(mode === 'build' ? 'Mapa carregado.' : 'Mapa adicionado a sessao.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Falha ao carregar mapa.');
    }
  }

  async function handleAddMap(mapId: string) {
    try {
      const result = await api.getMap(mapId);
      const state = useTabletopStore.getState();
      const offset = (state.map.sessionMapInstances?.length || 0) * state.map.gridSize * 4;
      state.addSessionMapInstance(stripSessionStateForMap(result.map), offset, 0);
      state.setMode('session');
      setMessage('Mapa adicionado ao board.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Falha ao adicionar mapa.');
    }
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
    const result = await api.getMap(mapId);
    await api.updateMap(mapId, { ...result.map, name });
    queryClient.invalidateQueries({ queryKey: ['maps'] });
    if (useTabletopStore.getState().map.id === mapId) useTabletopStore.getState().setMapMeta({ name });
  }

  async function handleDuplicateMap(mapId: string) {
    const result = await api.getMap(mapId);
    await api.createMap({ ...result.map, id: createLocalId('map'), name: `${result.map.name || 'Mapa'} copia` });
    queryClient.invalidateQueries({ queryKey: ['maps'] });
  }

  async function handleDeleteMap(mapId: string) {
    await api.deleteMap(mapId);
    queryClient.invalidateQueries({ queryKey: ['maps'] });
  }

  return (
    <VttShell
      maps={mapsQuery.data?.maps || []}
      tokens={availableTokens}
      customTokens={customTokens}
      loadingMaps={mapsQuery.isLoading}
      saving={saveMutation.isPending}
      onSave={() => saveMutation.mutate()}
      onSaveMapArea={handleSaveMapArea}
      onLoadMap={handleLoadMap}
      onAddMap={handleAddMap}
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
    />
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
  const characterTokens = characters.map(hydrateCharacter).map((character) => ({
    id: `char-${character.id}`,
    sourceId: character.id,
    kind: 'character' as const,
    name: character.identity.name || 'Personagem',
    image: character.identity.image,
    hpCurrent: Number(character.resources.pvCurrent || 0),
    hpMax: 0,
    subtitle: `${character.identity.className || 'Player'} Nv ${character.identity.level || 1}`,
    visibleToPlayers: true
  }));

  const combatTokens = combatants.map((combatant) => ({
    id: `combat-${combatant.instanceId}`,
    sourceId: combatant.instanceId,
    kind: combatant.combatantType === 'enemy' ? 'enemy' as const : combatant.combatantType === 'character' ? 'character' as const : 'companion' as const,
    name: combatant.name || 'Combatente',
    image: combatant.image,
    hpCurrent: Number(combatant.pvCurrent || 0),
    hpMax: Number(combatant.pvMax || 0),
    subtitle: combatant.subtitle || combatant.combatantType,
    visibleToPlayers: combatant.combatantType !== 'enemy'
  }));

  const byId = new Map<string, AvailableTabletopToken>();
  [...combatTokens, ...characterTokens].forEach((token) => byId.set(token.id, token));
  return Array.from(byId.values());
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
