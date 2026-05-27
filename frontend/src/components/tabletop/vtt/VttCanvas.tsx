import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Circle, Group, Image as KonvaImage, Layer, Line, Rect, Stage, Text } from 'react-konva';
import type { Asset, AvailableTabletopToken, MapObject, OmniMap, SessionMapInstance, SessionSelectedEntity, TabletopToken, TileLayer } from '../types';
import { getAsset } from '../assets';
import { useTabletopStore, type TokenMoveCheck } from '../mapStore';
import { useVttCamera, type VttCamera, type VttPoint } from './hooks/useVttCamera';
import { useVttHitTesting, type VttRect } from './hooks/useVttHitTesting';
import { useVttInputController } from './hooks/useVttInputController';
import type { PointerIntent } from './hooks/useVttInputController';
import { useVttSelection } from './hooks/useVttSelection';
import { ProceduralObject, ProceduralTile, type ProceduralRenderQuality } from './assetRenderer';

const EMPTY_SELECTED_KEYS = new Set<string>();
const TILE_CHUNK_SIZE = 8;

type TileChunkData = {
  key: string;
  bounds: VttRect;
  cells: TileLayer['cells'];
};

export interface VttCanvasControls {
  camera: VttCamera;
  resetCamera(): void;
  focusSelection(): void;
  panBy(dx: number, dy: number): void;
}

interface VttCanvasProps {
  heldAssetId: string;
  heldToken: AvailableTabletopToken | null;
  heldMapData: OmniMap | null;
  clearHeld(): void;
  onPlaceHeldMap?(x: number, y: number): void;
  onMapCapture?(bounds: NonNullable<OmniMap['bounds']>): void;
  onControlsReady?(controls: VttCanvasControls): void;
  onCursorWorldChange?(point: VttPoint): void;
  onInputStateChange?(state: { pointerIntent: PointerIntent; isPointerDown: boolean; activePointerId: number | null }): void;
}

export function VttCanvas({ heldAssetId, heldToken, heldMapData, clearHeld, onPlaceHeldMap, onMapCapture, onControlsReady, onCursorWorldChange, onInputStateChange }: VttCanvasProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [viewport, setViewport] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [inputDebugOpen, setInputDebugOpen] = useState(false);
  const map = useTabletopStore((state) => state.map);
  const tool = useTabletopStore((state) => state.tool);
  const viewMode = useTabletopStore((state) => state.sessionViewMode);
  const gridVisible = useTabletopStore((state) => state.showGrid);
  const sessionFogEnabled = useTabletopStore((state) => state.sessionFogEnabled);
  const sessionGlobalDarkness = useTabletopStore((state) => state.sessionGlobalDarkness);
  const selectedEntities = useTabletopStore((state) => state.selectedEntities);
  const lastTokenMoveCheck = useTabletopStore((state) => state.lastTokenMoveCheck);
  const { selectedKeys } = useVttSelection();
  const debugPerf = useMemo(() => new URLSearchParams(window.location.search).get('debugPerf') === '1', []);
  const debugCollision = useMemo(() => new URLSearchParams(window.location.search).get('debugCollision') === '1', []);
  const debugToken = useMemo(() => new URLSearchParams(window.location.search).get('debugToken') === '1', []);
  const camera = useVttCamera();
  const hitTesting = useVttHitTesting(map, viewMode);
  const input = useVttInputController({
    map,
    tool,
    viewMode,
    hitTesting,
    screenToWorld: camera.screenToWorld,
    startPan: camera.startPan,
    updatePan: camera.updatePan,
    endPan: camera.endPan,
    isPanningRef: camera.isPanningRef,
    heldAssetId,
    heldToken,
    heldMapData,
    publishPointerState: inputDebugOpen || debugPerf || debugCollision || debugToken || Boolean(onCursorWorldChange),
    clearHeld,
    onPlaceHeldMap,
    onMapCapture
  });

  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return undefined;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setViewport({ width: Math.max(1, width), height: Math.max(1, height) });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const focusSelection = useCallback(() => {
    const bounds = combineRects(selectedEntities.map((entry) => hitTesting.getEntityBounds(entry)).filter(Boolean) as VttRect[]);
    if (bounds) camera.focusRect(bounds, viewport);
  }, [camera, hitTesting, selectedEntities, viewport]);

  useEffect(() => {
    onControlsReady?.({
      camera: camera.camera,
      resetCamera: camera.resetCamera,
      focusSelection,
      panBy: camera.panBy
    });
  }, [camera.camera, camera.panBy, camera.resetCamera, focusSelection, onControlsReady]);

  useEffect(() => {
    onCursorWorldChange?.(input.cursorWorld);
  }, [input.cursorWorld, onCursorWorldChange]);

  useEffect(() => {
    onInputStateChange?.({ pointerIntent: input.pointerIntent, isPointerDown: input.isPointerDown, activePointerId: input.activePointerId });
  }, [input.activePointerId, input.isPointerDown, input.pointerIntent, onInputStateChange]);

  const gridLines = useMemo(() => buildGridLines(camera.camera, viewport, map.gridSize), [camera.camera, viewport, map.gridSize]);
  const viewportWorldBounds = useMemo(() => getViewportWorldBounds(camera.camera, viewport, map.gridSize), [camera.camera, viewport, map.gridSize]);
  const selectionRects = selectedEntities
    .map((entity) => ({ entity, rect: hitTesting.getEntityBounds(entity) }))
    .filter((entry): entry is { entity: SessionSelectedEntity; rect: VttRect } => Boolean(entry.rect));
  const sortedMapInstances = useMemo(() => (
    (map.sessionMapInstances || [])
      .filter((instance) => viewMode === 'gm' || instance.visibleToPlayers !== false)
      .slice()
      .sort((left, right) => Number(left.zIndex || 0) - Number(right.zIndex || 0))
  ), [map.sessionMapInstances, viewMode]);
  const visibleMapInstances = useMemo(() => sortedMapInstances.filter((instance) => {
    if (selectedKeys.has(`map:${instance.id}`)) return true;
    return rectsIntersect(getMapInstanceWorldBounds(instance), viewportWorldBounds);
  }), [selectedKeys, sortedMapInstances, viewportWorldBounds]);
  const showBaseMap = map.mode === 'build' || !(map.sessionMapInstances || []).length || mapHasRenderableTiles(map);
  const tileQuality: ProceduralRenderQuality = camera.camera.zoom < 0.85 || map.mode === 'session' ? 'fast' : 'quality';
  const fps = useApproxFps(debugPerf);
  const renderStats = useMemo(() => debugPerf ? buildRenderStats(map, showBaseMap, visibleMapInstances, viewportWorldBounds) : null, [debugPerf, map, showBaseMap, visibleMapInstances, viewportWorldBounds]);

  return (
    <div
      ref={viewportRef}
      className="absolute inset-0 overflow-hidden bg-[#07040d]"
      style={{ userSelect: 'none', touchAction: 'none' }}
    >
      <Stage
        width={viewport.width}
        height={viewport.height}
        onPointerDown={input.handlePointerDown}
        onPointerMove={input.handlePointerMove}
        onPointerUp={input.handlePointerUp}
        onPointerCancel={input.handlePointerCancel}
        onMouseLeave={(event) => {
          if (event.evt.buttons === 0 && !input.isPointerDown) input.cancelPointerAction();
        }}
        onContextMenu={input.handleContextMenu}
        onWheel={(event) => {
          event.evt.preventDefault();
          const pointer = event.target.getStage()?.getPointerPosition();
          if (!pointer) return;
          const multiplier = event.evt.deltaY > 0 ? 0.9 : 1.1;
          camera.zoomAt(pointer, camera.camera.zoom * multiplier);
        }}
        className={input.pointerIntent === 'panningCamera' || camera.isPanning ? 'cursor-grabbing' : tool === 'pan' ? 'cursor-grab' : tool === 'move-token' ? 'cursor-pointer' : tool === 'frame' || heldAssetId || heldToken || heldMapData ? 'cursor-crosshair' : 'cursor-default'}
      >
        <Layer listening={false}>
          <Rect x={0} y={0} width={viewport.width} height={viewport.height} fill="#07040d" />
          <Group x={camera.camera.x} y={camera.camera.y} scaleX={camera.camera.zoom} scaleY={camera.camera.zoom}>
            {gridVisible ? gridLines.minor.map((line) => (
              <Line key={line.key} points={line.points} stroke="#211936" strokeWidth={1 / camera.camera.zoom} listening={false} />
            )) : null}
            {gridVisible ? gridLines.major.map((line) => (
              <Line key={line.key} points={line.points} stroke="#3b2b63" strokeWidth={1.4 / camera.camera.zoom} opacity={0.72} listening={false} />
            )) : null}
          </Group>
        </Layer>

        <Layer>
          <Group x={camera.camera.x} y={camera.camera.y} scaleX={camera.camera.zoom} scaleY={camera.camera.zoom}>
            {showBaseMap ? <MapBody map={map} origin={{ x: 0, y: 0 }} selected={selectedKeys.has('map:base-map')} viewportBounds={viewportWorldBounds} keyPrefix="base" quality={tileQuality} /> : null}
            {map.mode === 'build' && map.bounds ? <MapFrameOverlay map={map} zoom={camera.camera.zoom} /> : null}
            {visibleMapInstances.map((instance) => (
              <MapInstanceNode
                key={instance.id}
                instance={instance}
                selected={selectedKeys.has(`map:${instance.id}`)}
                viewportBounds={viewportWorldBounds}
                previewPosition={input.dragPreview.mapPositions[instance.id]}
                quality={tileQuality}
              />
            ))}
            <ObjectLayer map={map} selectedKeys={selectedKeys} viewportBounds={viewportWorldBounds} keyPrefix="base-object" />
            <TemplateLayer map={map} selectedKeys={selectedKeys} />
            <TokenLayer map={map} viewMode={viewMode} selectedKeys={selectedKeys} viewportBounds={viewportWorldBounds} previewPositions={input.dragPreview.tokenPositions} />
            {selectionRects.map(({ entity, rect }) => (
              <Rect
                key={`selection-${entity.type}-${entity.id}`}
                x={rect.x}
                y={rect.y}
                width={rect.width}
                height={rect.height}
                stroke="#8b5cf6"
                strokeWidth={2 / camera.camera.zoom}
                dash={[8 / camera.camera.zoom, 5 / camera.camera.zoom]}
                cornerRadius={4 / camera.camera.zoom}
                listening={false}
              />
            ))}
            {input.selectionBox ? (
              <Rect
                {...normalizeRect(input.selectionBox)}
                fill="rgba(139,92,246,0.14)"
                stroke="#c4b5fd"
                strokeWidth={1.5 / camera.camera.zoom}
                dash={[6 / camera.camera.zoom, 4 / camera.camera.zoom]}
                listening={false}
              />
            ) : null}
            <RulerLayer rulers={[...input.pinnedRulers, ...(input.rulerDraft ? [input.rulerDraft] : [])]} zoom={camera.camera.zoom} metersPerCell={map.metersPerCell || 1.5} gridSize={map.gridSize} />
            {input.pings.map((ping) => (
              <Circle key={ping.id} x={ping.x} y={ping.y} radius={18} stroke="#60a5fa" strokeWidth={3 / camera.camera.zoom} fill="rgba(96,165,250,0.2)" listening={false} />
            ))}
            {heldMapData ? <HeldMapPreview map={heldMapData} point={snapPointToGrid(input.cursorWorld, heldMapData.gridSize || map.gridSize)} zoom={camera.camera.zoom} /> : null}
          </Group>
        </Layer>

        <Layer listening={false}>
          {viewMode === 'player-preview' && sessionFogEnabled ? (
            <>
              <Rect x={0} y={0} width={viewport.width} height={viewport.height} fill="#020106" opacity={0.88} />
              <Group x={camera.camera.x} y={camera.camera.y} scaleX={camera.camera.zoom} scaleY={camera.camera.zoom}>
                {(map.fogLayer.revealedCells || []).map((cell) => (
                  <Rect
                    key={`fog-cut-${cell.x}-${cell.y}`}
                    x={cell.x * map.gridSize}
                    y={cell.y * map.gridSize}
                    width={map.gridSize}
                    height={map.gridSize}
                    fill="#000"
                    globalCompositeOperation="destination-out"
                  />
                ))}
              </Group>
            </>
          ) : null}
          {(map.sessionLighting?.darkness ?? sessionGlobalDarkness) > 0 && viewMode !== 'gm' ? (
            <Rect x={0} y={0} width={viewport.width} height={viewport.height} fill="#020106" opacity={Math.min(0.85, map.sessionLighting?.darkness ?? sessionGlobalDarkness)} />
          ) : null}
        </Layer>
      </Stage>
      {debugPerf && renderStats ? <VttPerfDebug stats={renderStats} fps={fps} viewportBounds={viewportWorldBounds} /> : null}
      {(debugCollision || debugToken) && lastTokenMoveCheck ? <VttCollisionDebug check={lastTokenMoveCheck} /> : null}
      <div className="pointer-events-auto fixed left-[76px] top-[54px] z-40">
        <button
          type="button"
          onClick={() => setInputDebugOpen((value) => !value)}
          className="rounded-lg border border-white/10 bg-[#100c18]/80 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-vitaMuted shadow-soft backdrop-blur hover:border-vita/40 hover:text-white"
        >
          Input
        </button>
        {inputDebugOpen ? (
          <div className="mt-2 w-64 rounded-xl border border-vita/25 bg-[#100c18]/92 p-3 text-[11px] font-semibold text-vitaMuted shadow-soft backdrop-blur">
            <div className="grid grid-cols-[88px_1fr] gap-x-2 gap-y-1">
              <span>Mode</span><span className="text-white">{input.debug.mode}</span>
              <span>Tool</span><span className="text-white">{input.debug.tool}</span>
              <span>Intent</span><span className="text-white">{input.debug.pointerIntent}</span>
              <span>Down</span><span className="text-white">{String(input.debug.isPointerDown)}</span>
              <span>Buttons</span><span className="text-white">{input.debug.buttons}</span>
              <span>Target</span><span className="text-white">{input.debug.targetEntity}</span>
              <span>Cell</span><span className="text-white">{input.debug.cell.x}, {input.debug.cell.y}</span>
              <span>Stroke</span><span className="text-white">{input.debug.paintStrokeCellCount}</span>
              <span>Drag</span><span className="text-white">{input.debug.dragCommitCount}</span>
              <span>Measure</span><span className="text-white">{String(input.debug.measureActive)}</span>
              <span>Box</span><span className="text-white">{String(input.debug.boxSelectActive)}</span>
              <span>Camera</span><span className="text-white">{Math.round(camera.camera.x)}, {Math.round(camera.camera.y)} / {camera.camera.zoom.toFixed(2)}</span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function VttCollisionDebug({ check }: { check: TokenMoveCheck }) {
  return (
    <div className="pointer-events-none fixed right-4 top-[54px] z-50 w-72 rounded-xl border border-amber-300/25 bg-[#100c18]/92 p-3 text-[11px] font-semibold text-vitaMuted shadow-soft backdrop-blur">
      <div className="mb-1 text-xs font-black uppercase tracking-wide text-amber-100">Collision</div>
      <div className="grid grid-cols-[108px_1fr] gap-x-2 gap-y-1">
        <span>OK</span><span className={check.ok ? 'text-emerald-200' : 'text-red-200'}>{String(check.ok)}</span>
        <span>Motivo</span><span className="text-white">{check.reason || '-'}</span>
        <span>Token</span><span className="truncate text-white">{check.tokenName || check.tokenId || '-'}</span>
        <span>Role</span><span className="text-white">{check.userRole || '-'}</span>
        <span>Tabletop</span><span className="text-white">{check.tabletopRole || '-'}</span>
        <span>View</span><span className="text-white">{check.viewMode || '-'}</span>
        <span>Origem</span><span className="text-white">{check.currentCell ? `${check.currentCell.x}, ${check.currentCell.y}` : '-'}</span>
        <span>Destino</span><span className="text-white">{check.targetCell ? `${check.targetCell.x}, ${check.targetCell.y}` : '-'}</span>
        <span>Controla</span><span className="text-white">{check.canControl === undefined ? '-' : String(check.canControl)}</span>
        <span>Travado</span><span className="text-white">{String(Boolean(check.locked))}</span>
        <span>Bloqueios</span><span className="truncate text-white">{check.blockers?.join(', ') || '-'}</span>
      </div>
    </div>
  );
}

const MapInstanceNode = memo(function MapInstanceNode({ instance, selected, viewportBounds, previewPosition, quality }: { instance: SessionMapInstance; selected: boolean; viewportBounds: VttRect; previewPosition?: VttPoint; quality: ProceduralRenderQuality }) {
  const data = instance.data;
  const strokeWidth = selected ? 2.5 : 0;
  const x = previewPosition?.x ?? instance.x;
  const y = previewPosition?.y ?? instance.y;
  useEffect(() => {
    if (isVttDebugEnabled() && data && !mapHasRenderableTiles(data)) {
      console.debug('[OmniVita VTT] Mapa de sessao sem tiles renderizaveis.', { id: instance.id, name: instance.name });
    }
  }, [data, instance.id, instance.name]);
  return (
    <Group x={x} y={y} rotation={instance.rotation || 0} opacity={instance.opacity ?? 1} listening={false}>
      {data ? (
        <MapBody
          map={data}
          origin={{ x: 0, y: 0 }}
          selected={selected}
          viewportBounds={translateRect(viewportBounds, -x, -y)}
          keyPrefix={`instance:${instance.id}`}
          quality={quality}
          includeObjects
        />
      ) : null}
      {selected ? (
        <>
          <Rect
            x={0}
            y={0}
            width={instance.width * instance.gridSize}
            height={instance.height * instance.gridSize}
            stroke={instance.locked ? '#fbbf24' : '#c4b5fd'}
            strokeWidth={strokeWidth}
            dash={instance.locked ? [10, 5] : undefined}
            listening={false}
          />
          <Text
            x={8}
            y={8}
            text={`${instance.locked ? 'LOCK ' : ''}${instance.name}`}
            fill="#f4efff"
            fontSize={12}
            fontStyle="bold"
            padding={5}
            listening={false}
          />
        </>
      ) : null}
    </Group>
  );
});

function HeldMapPreview({ map, point, zoom }: { map: OmniMap; point: VttPoint; zoom: number }) {
  return (
    <Group x={point.x} y={point.y} opacity={0.66} listening={false}>
      <MapBody map={map} origin={{ x: 0, y: 0 }} selected={false} keyPrefix="held-map" quality="fast" includeObjects />
      <Rect
        x={0}
        y={0}
        width={map.width * map.gridSize}
        height={map.height * map.gridSize}
        stroke="#93c5fd"
        strokeWidth={2 / zoom}
        dash={[8 / zoom, 5 / zoom]}
        fill="rgba(147,197,253,0.08)"
        listening={false}
      />
      <Text
        x={8 / zoom}
        y={8 / zoom}
        text={map.name}
        fill="#e0f2fe"
        fontSize={12 / zoom}
        fontStyle="bold"
        listening={false}
      />
    </Group>
  );
}

function mapHasRenderableTiles(map: OmniMap) {
  return Boolean(
    map.tileLayers.floor.cells.length
    || map.tileLayers.walls.cells.length
    || map.tileLayers.doors.cells.length
    || map.tileLayers.collision.cells.length
  );
}

function isVttDebugEnabled() {
  try {
    return window.localStorage.getItem('omnivita-vtt-debug') === '1';
  } catch {
    return false;
  }
}

function snapPointToGrid(point: VttPoint, gridSize: number) {
  const size = Math.max(1, gridSize);
  return {
    x: Math.round(point.x / size) * size,
    y: Math.round(point.y / size) * size
  };
}

const MapBody = memo(function MapBody({ map, origin, selected, viewportBounds, keyPrefix, quality, includeObjects = false }: { map: OmniMap; origin: VttPoint; selected: boolean; viewportBounds?: VttRect; keyPrefix: string; quality: ProceduralRenderQuality; includeObjects?: boolean }) {
  void selected;
  return (
    <Group x={origin.x} y={origin.y} listening={false}>
      <TileLayerNode layer={map.tileLayers.floor} map={map} viewportBounds={viewportBounds} opacity={0.94} keyPrefix={keyPrefix} quality={quality} />
      <TileLayerNode layer={map.tileLayers.walls} map={map} viewportBounds={viewportBounds} opacity={1} keyPrefix={keyPrefix} quality={quality} />
      <TileLayerNode layer={map.tileLayers.doors} map={map} viewportBounds={viewportBounds} opacity={1} keyPrefix={keyPrefix} quality={quality} />
      <TileLayerNode layer={map.tileLayers.collision} map={map} viewportBounds={viewportBounds} opacity={0.35} keyPrefix={keyPrefix} quality="fast" />
      {includeObjects ? <ObjectLayer map={map} selectedKeys={EMPTY_SELECTED_KEYS} viewportBounds={viewportBounds} keyPrefix={`${keyPrefix}:object`} /> : null}
    </Group>
  );
});

function MapFrameOverlay({ map, zoom }: { map: OmniMap; zoom: number }) {
  const bounds = map.bounds || { x: 0, y: 0, width: map.width, height: map.height };
  const x = bounds.x * map.gridSize;
  const y = bounds.y * map.gridSize;
  const width = Math.max(1, bounds.width) * map.gridSize;
  const height = Math.max(1, bounds.height) * map.gridSize;
  const handle = Math.max(7 / zoom, 3);
  const handles = [
    [x, y],
    [x + width, y],
    [x, y + height],
    [x + width, y + height]
  ];
  return (
    <Group listening={false}>
      <Rect
        x={x}
        y={y}
        width={width}
        height={height}
        stroke="#8b5cf6"
        strokeWidth={2 / zoom}
        dash={[10 / zoom, 6 / zoom]}
        fill="rgba(139,92,246,0.035)"
      />
      {handles.map(([hx, hy], index) => (
        <Rect
          key={`frame-handle-${index}`}
          x={hx - handle / 2}
          y={hy - handle / 2}
          width={handle}
          height={handle}
          fill="#c4b5fd"
          stroke="#28183e"
          strokeWidth={1 / zoom}
          cornerRadius={2 / zoom}
        />
      ))}
    </Group>
  );
}

const TileLayerNode = memo(function TileLayerNode({ layer, map, viewportBounds, opacity, keyPrefix, quality }: { layer: TileLayer; map: OmniMap; viewportBounds?: VttRect; opacity: number; keyPrefix: string; quality: ProceduralRenderQuality }) {
  const chunks = useMemo(() => buildTileChunks(layer, map), [layer, map]);
  const visibleChunks = useMemo(() => (
    viewportBounds ? chunks.filter((chunk) => rectsIntersect(chunk.bounds, viewportBounds)) : chunks
  ), [chunks, viewportBounds]);
  if (!layer.visible) return null;
  return (
    <Group opacity={(layer.opacity ?? 1) * opacity} listening={false}>
      {visibleChunks.map((chunk) => (
        <TileChunk key={`${keyPrefix}:${layer.key}:${chunk.key}`} chunk={chunk} layer={layer} map={map} keyPrefix={keyPrefix} quality={quality} />
      ))}
    </Group>
  );
});

const TileChunk = memo(function TileChunk({ chunk, layer, map, keyPrefix, quality }: { chunk: TileChunkData; layer: TileLayer; map: OmniMap; keyPrefix: string; quality: ProceduralRenderQuality }) {
  return (
    <Group listening={false}>
      {chunk.cells.map((cell) => {
        const asset = getAsset(cell.assetId, map.tilesets);
        const width = (cell.footprint?.w || asset?.gridFootprint?.w || 1) * map.gridSize;
        const height = (cell.footprint?.h || asset?.gridFootprint?.h || 1) * map.gridSize;
        return (
          <ProceduralTile
            key={`${keyPrefix}:${layer.key}:${cell.x}:${cell.y}:${cell.assetId}`}
            asset={asset || fallbackAsset(layer.key, cell.assetId, width, height)}
            x={cell.x * map.gridSize}
            y={cell.y * map.gridSize}
            width={width}
            height={height}
            rotation={cell.rotation || 0}
            strokeWidth={layer.key === 'walls' ? 2 : 1}
            quality={quality}
          />
        );
      })}
    </Group>
  );
});

function buildTileChunks(layer: TileLayer, map: OmniMap): TileChunkData[] {
  const chunks = new Map<string, TileChunkData>();
  layer.cells.forEach((cell) => {
    const asset = getAsset(cell.assetId, map.tilesets);
    const widthCells = cell.footprint?.w || asset?.gridFootprint?.w || 1;
    const heightCells = cell.footprint?.h || asset?.gridFootprint?.h || 1;
    const chunkX = Math.floor(cell.x / TILE_CHUNK_SIZE);
    const chunkY = Math.floor(cell.y / TILE_CHUNK_SIZE);
    const key = `${chunkX}:${chunkY}`;
    const cellBounds = {
      x: cell.x * map.gridSize,
      y: cell.y * map.gridSize,
      width: widthCells * map.gridSize,
      height: heightCells * map.gridSize
    };
    const existing = chunks.get(key);
    if (!existing) {
      chunks.set(key, { key, bounds: cellBounds, cells: [cell] });
      return;
    }
    existing.cells.push(cell);
    existing.bounds = combineTwoRects(existing.bounds, cellBounds);
  });
  return Array.from(chunks.values());
}

function fallbackAsset(layerKey: TileLayer['key'], assetId: string, width: number, height: number): Asset {
  return {
    id: assetId || `${layerKey}-fallback`,
    name: layerKey,
    category: layerKey,
    typeCategory: layerKey === 'floor' ? 'floor' : layerKey === 'walls' ? 'wall' : layerKey === 'doors' ? 'door' : 'prop',
    tags: [],
    imageUrl: '',
    thumbnailUrl: '',
    defaultLayer: layerKey,
    defaultWidth: width,
    defaultHeight: height,
    defaultBlocksMovement: layerKey === 'walls',
    defaultBlocksVision: layerKey === 'walls',
    defaultGivesCover: false,
    color: layerColor(layerKey),
    stroke: layerStroke(layerKey)
  };
}

const ObjectLayer = memo(function ObjectLayer({ map, selectedKeys, viewportBounds, keyPrefix }: { map: OmniMap; selectedKeys: Set<string>; viewportBounds?: VttRect; keyPrefix: string }) {
  const objects = useMemo(() => (
    getAllObjects(map)
      .filter((object) => isFiniteNumber(object.x) && isFiniteNumber(object.y))
      .filter((object) => !viewportBounds || rectsIntersect(getObjectRect(object), viewportBounds))
      .sort((left, right) => Number(left.zIndex || 0) - Number(right.zIndex || 0))
  ), [map, viewportBounds]);
  return (
    <>
      {objects.map((object) => (
        <ObjectNode
          key={`${keyPrefix}:${object.id}`}
          object={object}
          asset={getAsset(object.assetId, map.tilesets)}
          selected={selectedKeys.has(`${object.kind === 'light' ? 'light' : 'object'}:${object.id}`)}
        />
      ))}
    </>
  );
});

const ObjectNode = memo(function ObjectNode({ object, asset, selected }: { object: MapObject; asset: Asset | null; selected: boolean }) {
  const image = useLoadedImage(asset?.imageUrl || asset?.thumbnailUrl);
  const width = object.width * (object.scale || 1);
  const height = object.height * (object.scale || 1);
  return (
    <Group x={object.x} y={object.y} rotation={object.rotation || 0} opacity={object.opacity ?? asset?.defaultOpacity ?? 1} listening={false}>
      {image ? (
        <KonvaImage image={image} width={width} height={height} cornerRadius={6} />
      ) : (
        <ProceduralObject asset={asset} width={width} height={height} selected={selected} strokeWidth={selected ? 2 : 1} />
      )}
      {object.kind === 'light' ? <Circle x={width / 2} y={height / 2} radius={Math.max(width, height) * 0.55} fill={asset?.color || '#fef3c7'} opacity={0.16} /> : null}
    </Group>
  );
});

function TokenLayer({ map, viewMode, selectedKeys, viewportBounds, previewPositions }: { map: OmniMap; viewMode: 'gm' | 'player-preview'; selectedKeys: Set<string>; viewportBounds: VttRect; previewPositions: Record<string, { x: number; y: number }> }) {
  return (
    <>
      {map.tokens
        .filter((token) => viewMode === 'gm' || (token.visibleToPlayers && !token.hidden))
        .filter((token) => selectedKeys.has(`token:${token.id}`) || rectsIntersect(tokenBounds(map, token, previewPositions[token.id]), viewportBounds))
        .map((token) => <TokenNode key={token.id} token={token} map={map} selected={selectedKeys.has(`token:${token.id}`)} previewPosition={previewPositions[token.id]} />)}
    </>
  );
}

function TokenNode({ token, map, selected, previewPosition }: { token: TabletopToken; map: OmniMap; selected: boolean; previewPosition?: { x: number; y: number } }) {
  const image = useLoadedImage(token.image);
  const size = map.gridSize * Math.max(0.5, token.size || 1);
  const x = (previewPosition?.x ?? token.x) * map.gridSize;
  const y = (previewPosition?.y ?? token.y) * map.gridSize;
  const color = token.color || (token.kind === 'enemy' ? '#fb7185' : token.kind === 'npc' ? '#fbbf24' : token.kind === 'creature' ? '#a78bfa' : '#60a5fa');
  return (
    <Group x={x} y={y} listening={false}>
      {image ? (
        <KonvaImage image={image} width={size} height={size} cornerRadius={size / 2} />
      ) : (
        <>
          <Circle x={size / 2} y={size / 2} radius={size / 2 - 2} fill="#151024" stroke={color} strokeWidth={3} />
          <Text x={0} y={size / 2 - 8} width={size} align="center" text={(token.name || '?').slice(0, 1).toUpperCase()} fill="#f7f2ff" fontSize={18} fontStyle="bold" />
        </>
      )}
      <Circle x={size / 2} y={size / 2} radius={size / 2 - 1} stroke={selected ? '#ffffff' : color} strokeWidth={selected ? 4 : 2} />
      {token.hidden ? <Circle x={size - 8} y={8} radius={5} fill="#f87171" /> : null}
    </Group>
  );
}

function TemplateLayer({ map, selectedKeys }: { map: OmniMap; selectedKeys: Set<string> }) {
  return (
    <>
      {(map.areaTemplates || []).map((template) => {
        const selected = selectedKeys.has(`template:${template.id}`);
        if (template.shape === 'circle' || template.shape === 'aura' || template.radius) {
          return <Circle key={template.id} x={template.x} y={template.y} radius={template.radius || Math.max(template.width, template.height) / 2} fill={template.color} opacity={template.opacity || 0.22} stroke={selected ? '#ffffff' : template.color} strokeWidth={selected ? 3 : 1.5} listening={false} />;
        }
        if (template.shape === 'line') {
          return <Line key={template.id} points={[template.x, template.y, template.x + template.width, template.y + template.height]} stroke={selected ? '#ffffff' : template.color} strokeWidth={Math.max(8, template.opacity ? template.opacity * 20 : 10)} opacity={template.opacity || 0.28} listening={false} />;
        }
        return <Rect key={template.id} x={template.x - template.width / 2} y={template.y - template.height / 2} width={template.width} height={template.height} fill={template.color} opacity={template.opacity || 0.22} stroke={selected ? '#ffffff' : template.color} strokeWidth={selected ? 3 : 1.5} listening={false} />;
      })}
    </>
  );
}

function RulerLayer({ rulers, zoom, metersPerCell, gridSize }: { rulers: Array<{ id: string; start: VttPoint; end: VttPoint }>; zoom: number; metersPerCell: number; gridSize: number }) {
  return (
    <>
      {rulers.map((ruler) => {
        const distanceCells = Math.hypot(ruler.end.x - ruler.start.x, ruler.end.y - ruler.start.y) / gridSize;
        return (
          <Group key={ruler.id} listening={false}>
            <Line points={[ruler.start.x, ruler.start.y, ruler.end.x, ruler.end.y]} stroke="#93c5fd" strokeWidth={3 / zoom} dash={[10 / zoom, 6 / zoom]} />
            <Text
              x={(ruler.start.x + ruler.end.x) / 2 + 8 / zoom}
              y={(ruler.start.y + ruler.end.y) / 2 - 20 / zoom}
              text={`${distanceCells.toFixed(1)} cel / ${(distanceCells * metersPerCell).toFixed(1)}m`}
              fill="#e0f2fe"
              fontSize={13 / zoom}
              fontStyle="bold"
            />
          </Group>
        );
      })}
    </>
  );
}

function buildGridLines(camera: VttCamera, viewport: { width: number; height: number }, gridSize: number) {
  const left = (0 - camera.x) / camera.zoom;
  const top = (0 - camera.y) / camera.zoom;
  const right = (viewport.width - camera.x) / camera.zoom;
  const bottom = (viewport.height - camera.y) / camera.zoom;
  const startX = Math.floor(left / gridSize) * gridSize;
  const endX = Math.ceil(right / gridSize) * gridSize;
  const startY = Math.floor(top / gridSize) * gridSize;
  const endY = Math.ceil(bottom / gridSize) * gridSize;
  const minor: Array<{ key: string; points: number[] }> = [];
  const major: Array<{ key: string; points: number[] }> = [];
  for (let x = startX; x <= endX; x += gridSize) {
    const target = Math.round(x / gridSize) % 5 === 0 ? major : minor;
    target.push({ key: `vx-${x}`, points: [x, top, x, bottom] });
  }
  for (let y = startY; y <= endY; y += gridSize) {
    const target = Math.round(y / gridSize) % 5 === 0 ? major : minor;
    target.push({ key: `hy-${y}`, points: [left, y, right, y] });
  }
  return { minor, major };
}

function getAllObjects(map: OmniMap): MapObject[] {
  return [
    ...map.decorationLayer.objects,
    ...map.objectLayer.objects,
    ...map.detailLayer.objects,
    ...map.lightingLayer.objects,
    ...map.mechanicalLayer.objects,
    ...map.notesLayer.objects
  ];
}

function useLoadedImage(src?: string) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    if (!src) {
      setImage(null);
      return undefined;
    }
    let active = true;
    const next = new window.Image();
    next.crossOrigin = 'anonymous';
    next.onload = () => active && setImage(next);
    next.onerror = () => active && setImage(null);
    next.src = src;
    return () => {
      active = false;
    };
  }, [src]);
  return image;
}

function normalizeRect(rect: VttRect): VttRect {
  const x = Math.min(rect.x, rect.x + rect.width);
  const y = Math.min(rect.y, rect.y + rect.height);
  return { x, y, width: Math.abs(rect.width), height: Math.abs(rect.height) };
}

function combineRects(rects: VttRect[]) {
  if (!rects.length) return null;
  const left = Math.min(...rects.map((rect) => rect.x));
  const top = Math.min(...rects.map((rect) => rect.y));
  const right = Math.max(...rects.map((rect) => rect.x + rect.width));
  const bottom = Math.max(...rects.map((rect) => rect.y + rect.height));
  return { x: left, y: top, width: right - left, height: bottom - top };
}

function combineTwoRects(left: VttRect, right: VttRect): VttRect {
  const x = Math.min(left.x, right.x);
  const y = Math.min(left.y, right.y);
  const maxX = Math.max(left.x + left.width, right.x + right.width);
  const maxY = Math.max(left.y + left.height, right.y + right.height);
  return { x, y, width: maxX - x, height: maxY - y };
}

function getViewportWorldBounds(camera: VttCamera, viewport: { width: number; height: number }, gridSize: number): VttRect {
  const margin = Math.max(gridSize * 4, 128 / Math.max(0.1, camera.zoom));
  const left = (0 - camera.x) / camera.zoom - margin;
  const top = (0 - camera.y) / camera.zoom - margin;
  const right = (viewport.width - camera.x) / camera.zoom + margin;
  const bottom = (viewport.height - camera.y) / camera.zoom + margin;
  return { x: left, y: top, width: right - left, height: bottom - top };
}

function getMapInstanceWorldBounds(instance: SessionMapInstance): VttRect {
  return {
    x: instance.x,
    y: instance.y,
    width: Math.max(1, instance.width) * Math.max(1, instance.gridSize),
    height: Math.max(1, instance.height) * Math.max(1, instance.gridSize)
  };
}

function getObjectRect(object: MapObject): VttRect {
  return {
    x: object.x,
    y: object.y,
    width: object.width * (object.scale || 1),
    height: object.height * (object.scale || 1)
  };
}

function tokenBounds(map: OmniMap, token: TabletopToken, previewPosition?: { x: number; y: number }): VttRect {
  const size = map.gridSize * Math.max(0.5, token.size || 1);
  return {
    x: (previewPosition?.x ?? token.x) * map.gridSize,
    y: (previewPosition?.y ?? token.y) * map.gridSize,
    width: size,
    height: size
  };
}

function translateRect(rect: VttRect, dx: number, dy: number): VttRect {
  return { x: rect.x + dx, y: rect.y + dy, width: rect.width, height: rect.height };
}

function rectsIntersect(a: VttRect, b: VttRect) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function countVisibleTiles(map: OmniMap, viewportBounds: VttRect) {
  return [
    map.tileLayers.floor,
    map.tileLayers.walls,
    map.tileLayers.doors,
    map.tileLayers.collision
  ].reduce((total, layer) => {
    if (!layer.visible) return total;
    return total + layer.cells.filter((cell) => {
      const asset = getAsset(cell.assetId, map.tilesets);
      const width = (cell.footprint?.w || asset?.gridFootprint?.w || 1) * map.gridSize;
      const height = (cell.footprint?.h || asset?.gridFootprint?.h || 1) * map.gridSize;
      return rectsIntersect({ x: cell.x * map.gridSize, y: cell.y * map.gridSize, width, height }, viewportBounds);
    }).length;
  }, 0);
}

function countVisibleTileChunks(map: OmniMap, viewportBounds: VttRect) {
  return [
    map.tileLayers.floor,
    map.tileLayers.walls,
    map.tileLayers.doors,
    map.tileLayers.collision
  ].reduce((total, layer) => {
    if (!layer.visible) return total;
    return total + buildTileChunks(layer, map).filter((chunk) => rectsIntersect(chunk.bounds, viewportBounds)).length;
  }, 0);
}

function countVisibleObjects(map: OmniMap, viewportBounds: VttRect) {
  return getAllObjects(map).filter((object) => rectsIntersect(getObjectRect(object), viewportBounds)).length;
}

function countVisibleTokens(map: OmniMap, viewportBounds: VttRect) {
  return map.tokens.filter((token) => rectsIntersect(tokenBounds(map, token), viewportBounds)).length;
}

function buildRenderStats(map: OmniMap, showBaseMap: boolean, visibleInstances: SessionMapInstance[], viewportBounds: VttRect) {
  const baseTiles = showBaseMap ? countVisibleTiles(map, viewportBounds) : 0;
  const baseChunks = showBaseMap ? countVisibleTileChunks(map, viewportBounds) : 0;
  const baseObjects = countVisibleObjects(map, viewportBounds);
  const instanceTiles = visibleInstances.reduce((total, instance) => {
    if (!instance.data) return total;
    return total + countVisibleTiles(instance.data, translateRect(viewportBounds, -instance.x, -instance.y));
  }, 0);
  const instanceChunks = visibleInstances.reduce((total, instance) => {
    if (!instance.data) return total;
    return total + countVisibleTileChunks(instance.data, translateRect(viewportBounds, -instance.x, -instance.y));
  }, 0);
  const instanceObjects = visibleInstances.reduce((total, instance) => {
    if (!instance.data) return total;
    return total + countVisibleObjects(instance.data, translateRect(viewportBounds, -instance.x, -instance.y));
  }, 0);
  return {
    sessionMapInstances: map.sessionMapInstances?.length || 0,
    visibleMapInstances: visibleInstances.length,
    renderedTiles: baseTiles + instanceTiles,
    renderedChunks: baseChunks + instanceChunks,
    renderedObjects: baseObjects + instanceObjects,
    renderedTokens: countVisibleTokens(map, viewportBounds),
    konvaLayers: 3,
    cacheEnabled: false,
    cullingEnabled: true
  };
}

function useApproxFps(enabled: boolean) {
  const [fps, setFps] = useState(0);
  useEffect(() => {
    if (!enabled) return undefined;
    let frame = 0;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      frame += 1;
      if (now - last >= 750) {
        setFps(Math.round((frame * 1000) / (now - last)));
        frame = 0;
        last = now;
      }
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [enabled]);
  return fps;
}

function VttPerfDebug({ stats, fps, viewportBounds }: { stats: ReturnType<typeof buildRenderStats>; fps: number; viewportBounds: VttRect }) {
  return (
    <div className="pointer-events-none fixed right-4 top-[54px] z-40 w-64 rounded-xl border border-sky-300/20 bg-[#100c18]/90 p-3 text-[11px] font-semibold text-vitaMuted shadow-soft backdrop-blur">
      <div className="mb-1 text-xs font-black uppercase tracking-wide text-sky-100">Perf</div>
      <div className="grid grid-cols-[118px_1fr] gap-x-2 gap-y-1">
        <span>FPS</span><span className="text-white">{fps || '-'}</span>
        <span>Mapas</span><span className="text-white">{stats.sessionMapInstances}</span>
        <span>Visiveis</span><span className="text-white">{stats.visibleMapInstances}</span>
        <span>Tiles</span><span className="text-white">{stats.renderedTiles}</span>
        <span>Chunks</span><span className="text-white">{stats.renderedChunks}</span>
        <span>Objetos</span><span className="text-white">{stats.renderedObjects}</span>
        <span>Tokens</span><span className="text-white">{stats.renderedTokens}</span>
        <span>Layers</span><span className="text-white">{stats.konvaLayers}</span>
        <span>Cache</span><span className="text-white">{stats.cacheEnabled ? 'sim' : 'nao'}</span>
        <span>Culling</span><span className="text-white">{stats.cullingEnabled ? 'sim' : 'nao'}</span>
        <span>Viewport</span><span className="text-white">{Math.round(viewportBounds.x)}, {Math.round(viewportBounds.y)}</span>
      </div>
    </div>
  );
}

function layerColor(layer: string) {
  if (layer === 'walls') return '#35204a';
  if (layer === 'doors') return '#5b3b24';
  if (layer === 'collision') return '#7f1d1d';
  return '#1d1a27';
}

function layerStroke(layer: string) {
  if (layer === 'walls') return '#a78bfa';
  if (layer === 'doors') return '#fbbf24';
  if (layer === 'collision') return '#fb7185';
  return '#3a3347';
}

function isFiniteNumber(value: number) {
  return Number.isFinite(value);
}
