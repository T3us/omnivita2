import type { KonvaEventObject } from 'konva/lib/Node';
import type { DragEvent, ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Circle, Group, Image as KonvaImage, Layer, Line, Rect, Stage, Text } from 'react-konva';
import { getAsset } from '../assets';
import { useTabletopStore } from '../mapStore';
import type { AreaTemplate, AvailableTabletopToken, LightingRegion, MapLayerKey, MapObject, MapTool, ObjectLayer, OmniMap, SessionMapInstance, TabletopToken, TileCell, TileLayer } from '../types';
import { SelectionOverlay } from './SelectionOverlay';
import { useCameraController } from './useCameraController';
import { useSessionInputController } from './useSessionInputController';

const GRID_LINE = 'rgba(196,181,253,0.14)';
const VISION_BLOCKERS: Array<'walls' | 'doors'> = ['walls', 'doors'];

export function SessionStage() {
  const map = useTabletopStore((state) => state.map);
  const tool = useTabletopStore((state) => state.tool);
  const zoom = useTabletopStore((state) => state.zoom);
  const setZoom = useTabletopStore((state) => state.setZoom);
  const showGrid = useTabletopStore((state) => state.showGrid);
  const selectedObjectIds = useTabletopStore((state) => state.selectedObjectIds);
  const selectedTokenIds = useTabletopStore((state) => state.selectedTokenIds);
  const selectedTileCells = useTabletopStore((state) => state.selectedTileCells);
  const selectedMapInstanceIds = useTabletopStore((state) => state.selectedMapInstanceIds);
  const selectedRegionIds = useTabletopStore((state) => state.selectedRegionIds);
  const selectedEntities = useTabletopStore((state) => state.selectedEntities);
  const sessionViewMode = useTabletopStore((state) => state.sessionViewMode);
  const sessionDynamicVision = useTabletopStore((state) => state.sessionDynamicVision);
  const sessionFogEnabled = useTabletopStore((state) => state.sessionFogEnabled);
  const sessionGlobalDarkness = useTabletopStore((state) => state.sessionGlobalDarkness);
  const selectToken = useTabletopStore((state) => state.selectToken);
  const selectObject = useTabletopStore((state) => state.selectObject);
  const selectSessionArea = useTabletopStore((state) => state.selectSessionArea);
  const moveToken = useTabletopStore((state) => state.moveToken);
  const moveSelectedLightingRegions = useTabletopStore((state) => state.moveSelectedLightingRegions);
  const selectMapInstance = useTabletopStore((state) => state.selectMapInstance);
  const updateSessionMapInstance = useTabletopStore((state) => state.updateSessionMapInstance);
  const selectLightingRegion = useTabletopStore((state) => state.selectLightingRegion);
  const toggleDoorAt = useTabletopStore((state) => state.toggleDoorAt);
  const captureHistory = useTabletopStore((state) => state.captureHistory);

  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ width: 1100, height: 650 });
  const cameraController = useCameraController({ zoom, setZoom });
  const {
    camera,
    setCamera,
    isPanning,
    screenToWorld,
    startPan,
    updatePan,
    endPan,
    isPanningRef,
    zoomAt,
    resetCamera,
    focusWorldRect
  } = cameraController;
  const input = useSessionInputController({
    map,
    tool,
    viewMode: sessionViewMode,
    camera,
    zoom,
    screenToWorld,
    startPan,
    updatePan,
    endPan,
    isPanningRef,
    captureHistory
  });

  const visibleCells = useMemo(
    () => sessionDynamicVision ? computeVisibleCells(map, sessionViewMode) : new Set<string>(),
    [map, sessionDynamicVision, sessionViewMode]
  );

  const selectedTokenSet = useMemo(() => new Set(selectedTokenIds), [selectedTokenIds]);
  const selectedMapInstanceSet = useMemo(() => new Set(selectedMapInstanceIds), [selectedMapInstanceIds]);
  const selectedRegionSet = useMemo(() => new Set(selectedRegionIds), [selectedRegionIds]);
  const selectedTemplateSet = useMemo(
    () => new Set(selectedEntities.filter((entity) => entity.type === 'template').map((entity) => entity.id)),
    [selectedEntities]
  );
  const effectiveDarkness = map.sessionLighting?.globalIllumination
    ? Math.max(0, sessionGlobalDarkness - (map.sessionLighting.ambientIntensity || 1))
    : sessionGlobalDarkness;

  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return;
    const update = () => {
      const rect = element.getBoundingClientRect();
      setViewport({
        width: Math.max(320, Math.round(rect.width)),
        height: Math.max(520, Math.round(rect.height || 650))
      });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  function handleWheel(event: KonvaEventObject<WheelEvent>) {
    event.evt.preventDefault();
    const stage = event.target.getStage();
    const screenPointer = stage?.getPointerPosition();
    if (!screenPointer) return;
    const direction = event.evt.deltaY > 0 ? -1 : 1;
    const multiplier = event.evt.ctrlKey || event.evt.metaKey ? 1.035 : 1.08;
    zoomAt(screenPointer, zoom * (direction > 0 ? multiplier : 1 / multiplier));
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const point = input.getWorldPointFromClient(event.clientX, event.clientY, viewportRef.current);
    if (!point) return;
    const state = useTabletopStore.getState();
    const tokenPayload = event.dataTransfer.getData('application/x-omnivita-token');
    if (tokenPayload) {
      try {
        const token = JSON.parse(tokenPayload) as AvailableTabletopToken;
        const size = map.gridSize * Math.max(0.5, token.size || 1);
        state.addToken(token, point.x - size / 2, point.y - size / 2);
        state.setTool('select');
        return;
      } catch {
        return;
      }
    }
    const assetId = event.dataTransfer.getData('application/x-omnivita-asset');
    if (assetId) {
      state.addObject(assetId, point.x, point.y);
      state.setTool('select');
    }
  }

  return (
    <div
      ref={viewportRef}
      className="relative h-[calc(100vh-190px)] min-h-[560px] select-none overflow-hidden rounded-lg border border-line bg-black/50 touch-none"
      style={{ cursor: isPanning ? 'grabbing' : tool === 'pan' ? 'grab' : tool === 'select' ? 'crosshair' : undefined }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <Stage
        width={viewport.width}
        height={viewport.height}
        onPointerDown={input.handlePointerDown}
        onPointerMove={input.handlePointerMove}
        onPointerUp={input.handlePointerUp}
        onPointerCancel={input.handlePointerUp}
        onMouseLeave={input.handlePointerUp}
        onContextMenu={input.handleContextMenu}
        onWheel={handleWheel}
      >
        <Layer x={camera.x} y={camera.y} scaleX={zoom} scaleY={zoom}>
          {showGrid ? <InfiniteGrid viewport={viewport} camera={camera} zoom={zoom} gridSize={map.gridSize} /> : null}
          <MapBackground map={map} />
          <SessionMapInstanceLayer
            instances={map.sessionMapInstances || []}
            selectedIds={selectedMapInstanceSet}
            viewMode={sessionViewMode}
            tool={tool}
            onSelect={selectMapInstance}
            onMove={(instanceId, x, y) => updateSessionMapInstance(instanceId, { x, y })}
          />
          <TileLayerView layer={map.tileLayers.floor} map={map} viewMode={sessionViewMode} />
          <TileLayerView layer={map.tileLayers.walls} map={map} wall viewMode={sessionViewMode} />
          <TileLayerView layer={map.tileLayers.doors} map={map} door viewMode={sessionViewMode} onDoorClick={(cell, additive) => selectSessionArea(getCellRect(map, cell), additive)} onDoorToggle={(cell) => toggleDoorAt(cell.x, cell.y)} tool={tool} />
          <SessionObjectLayer layer={map.decorationLayer} map={map} tool={tool} selectedObjectIds={selectedObjectIds} viewMode={sessionViewMode} onSelect={selectObject} />
          <SessionObjectLayer layer={map.objectLayer} map={map} tool={tool} selectedObjectIds={selectedObjectIds} viewMode={sessionViewMode} onSelect={selectObject} />
          <SessionObjectLayer layer={map.detailLayer} map={map} tool={tool} selectedObjectIds={selectedObjectIds} viewMode={sessionViewMode} onSelect={selectObject} />
          <SessionObjectLayer layer={map.lightingLayer} map={map} tool={tool} selectedObjectIds={selectedObjectIds} viewMode={sessionViewMode} onSelect={selectObject} />
          <SessionObjectLayer layer={map.mechanicalLayer} map={map} tool={tool} selectedObjectIds={selectedObjectIds} viewMode={sessionViewMode} onSelect={selectObject} />
          <SessionObjectLayer layer={map.notesLayer} map={map} tool={tool} selectedObjectIds={selectedObjectIds} viewMode={sessionViewMode} onSelect={selectObject} />
          <LightAuraLayer map={map} viewMode={sessionViewMode} />
          <LightingRegionLayer map={map} viewMode={sessionViewMode} tool={tool} selectedIds={selectedRegionSet} onSelect={selectLightingRegion} onMove={moveSelectedLightingRegions} />
          <TokenLayerView map={map} tool={tool} selectedTokenIds={selectedTokenSet} viewMode={sessionViewMode} onSelect={selectToken} onMove={moveToken} />
          <TemplateLayer map={map} viewMode={sessionViewMode} tool={tool} selectedIds={selectedTemplateSet} />
          <SelectedDoorOverlay map={map} selectedTileCells={selectedTileCells} />
          <SessionFogOverlay map={map} enabled={sessionFogEnabled} viewMode={sessionViewMode} dynamic={sessionDynamicVision} visibleCells={visibleCells} darkness={effectiveDarkness} viewport={viewport} camera={camera} zoom={zoom} />
          {input.selectionBox ? <SelectionOverlay box={input.selectionBox} /> : null}
          {input.regionDraft ? <SelectionOverlay box={input.regionDraft} /> : null}
          {input.pinnedRulers.map((ruler) => <RulerView key={ruler.id} map={map} ruler={ruler} />)}
          {input.rulerFinal ? <RulerView map={map} ruler={input.rulerFinal} /> : null}
          {input.activeRulerDraft ? <RulerView map={map} ruler={input.activeRulerDraft} /> : null}
          <PingLayer pings={input.pings} />
          {input.hoverCell && tool === 'fog' ? <Rect x={input.hoverCell.x * map.gridSize} y={input.hoverCell.y * map.gridSize} width={map.gridSize} height={map.gridSize} fill="#8b5cf6" opacity={0.14} stroke="#c4b5fd" dash={[4, 4]} /> : null}
        </Layer>
      </Stage>
      <div className="pointer-events-auto absolute right-3 top-3 flex flex-wrap gap-2 rounded-lg border border-line bg-panel/95 p-2 text-xs text-textMuted">
        <button type="button" className="rounded-lg border border-line bg-white/5 px-2 py-1 font-bold text-textMain" onClick={resetCamera}>Reset camera</button>
        <button type="button" className="rounded-lg border border-line bg-white/5 px-2 py-1 font-bold text-textMain" onClick={() => focusWorldRect({ x: 0, y: 0, width: map.width * map.gridSize, height: map.height * map.gridSize }, viewport)}>Centralizar mapa</button>
        <label className="flex items-center gap-1 rounded-lg border border-line bg-white/5 px-2 py-1">
          <input type="checkbox" checked={input.keepLastRuler} onChange={(event) => input.setKeepLastRuler(event.target.checked)} />
          Fixar regua
        </label>
      </div>
    </div>
  );
}

function MapBackground({ map }: { map: OmniMap }) {
  return (
    <Rect
      name="session-background"
      x={0}
      y={0}
      width={map.width * map.gridSize}
      height={map.height * map.gridSize}
      fill="rgba(8,4,15,0.035)"
      stroke="rgba(196,181,253,0.18)"
      strokeWidth={1}
      dash={[10, 8]}
      listening={false}
    />
  );
}

function SessionMapInstanceLayer({
  instances,
  selectedIds,
  viewMode,
  tool,
  onSelect,
  onMove
}: {
  instances: SessionMapInstance[];
  selectedIds: Set<string>;
  viewMode: 'gm' | 'player-preview';
  tool: MapTool;
  onSelect(instanceId: string, additive?: boolean): void;
  onMove(instanceId: string, x: number, y: number): void;
}) {
  return (
    <>
      {[...instances]
        .filter(isValidSessionMapInstance)
        .filter((instance) => viewMode === 'gm' || instance.visibleToPlayers !== false)
        .sort((left, right) => Number(left.zIndex || 0) - Number(right.zIndex || 0))
        .map((instance) => (
          <SessionMapInstanceView
            key={instance.id}
            instance={instance}
            selected={selectedIds.has(instance.id)}
            viewMode={viewMode}
            tool={tool}
            onSelect={onSelect}
            onMove={onMove}
          />
        ))}
    </>
  );
}

function SessionMapInstanceView({
  instance,
  selected,
  viewMode,
  tool,
  onSelect,
  onMove
}: {
  instance: SessionMapInstance;
  selected: boolean;
  viewMode: 'gm' | 'player-preview';
  tool: MapTool;
  onSelect(instanceId: string, additive?: boolean): void;
  onMove(instanceId: string, x: number, y: number): void;
}) {
  const instanceMap = instance.data;
  const width = instance.width * instance.gridSize;
  const height = instance.height * instance.gridSize;
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  if (!instanceMap) {
    return (
      <Group
        x={instance.x}
        y={instance.y}
        draggable={tool === 'select' && !instance.locked}
        opacity={instance.opacity ?? 1}
        onMouseDown={(event) => {
          if (tool !== 'select' || !isPrimaryPointer(event.evt)) return;
          event.cancelBubble = true;
          const additive = Boolean('shiftKey' in event.evt && event.evt.shiftKey);
          const state = useTabletopStore.getState();
          const keepCurrentSelection = selected && !additive && getSessionSelectionCount(state) > 1;
          if (!keepCurrentSelection) onSelect(instance.id, additive);
        }}
        onDragStart={() => {
          dragStartRef.current = { x: instance.x, y: instance.y };
          if (!selected) onSelect(instance.id);
        }}
        onDragEnd={(event) => {
          const start = dragStartRef.current || { x: instance.x, y: instance.y };
          const deltaX = event.target.x() - start.x;
          const deltaY = event.target.y() - start.y;
          const state = useTabletopStore.getState();
          const shouldMoveSelection = state.selectedMapInstanceIds.includes(instance.id)
            && (state.selectedMapInstanceIds.length > 1 || state.selectedTokenIds.length || state.selectedObjectIds.length || state.selectedRegionIds.length);
          if (shouldMoveSelection) state.moveSelectedSessionItems(deltaX, deltaY);
          else onMove(instance.id, event.target.x(), event.target.y());
          dragStartRef.current = null;
        }}
      >
        <Rect width={width} height={height} fill="#08040f" stroke={selected ? '#60a5fa' : '#7c3aed'} strokeWidth={selected ? 3 : 1} dash={selected ? [7, 5] : undefined} listening={!instance.locked} />
        <Text x={12} y={12} text={instance.name} fill="#ddd6fe" fontStyle="bold" fontSize={14} />
      </Group>
    );
  }
  return (
    <Group
      x={instance.x}
      y={instance.y}
      rotation={instance.rotation}
      draggable={tool === 'select' && !instance.locked}
      opacity={instance.opacity ?? 1}
      onMouseDown={(event) => {
        if (tool !== 'select' || !isPrimaryPointer(event.evt)) return;
        event.cancelBubble = true;
        const additive = Boolean('shiftKey' in event.evt && event.evt.shiftKey);
        const state = useTabletopStore.getState();
        const keepCurrentSelection = selected && !additive && getSessionSelectionCount(state) > 1;
        if (!keepCurrentSelection) onSelect(instance.id, additive);
      }}
      onDragStart={() => {
        dragStartRef.current = { x: instance.x, y: instance.y };
        if (!selected) onSelect(instance.id);
      }}
      onDragEnd={(event) => {
        const start = dragStartRef.current || { x: instance.x, y: instance.y };
        const deltaX = event.target.x() - start.x;
        const deltaY = event.target.y() - start.y;
        const state = useTabletopStore.getState();
        const shouldMoveSelection = state.selectedMapInstanceIds.includes(instance.id)
          && (state.selectedMapInstanceIds.length > 1 || state.selectedTokenIds.length || state.selectedObjectIds.length || state.selectedRegionIds.length);
        if (shouldMoveSelection) state.moveSelectedSessionItems(deltaX, deltaY);
        else onMove(instance.id, event.target.x(), event.target.y());
        dragStartRef.current = null;
      }}
    >
      <MapBackground map={instanceMap} />
      <TileLayerView layer={instanceMap.tileLayers.floor} map={instanceMap} viewMode={viewMode} />
      <TileLayerView layer={instanceMap.tileLayers.walls} map={instanceMap} wall viewMode={viewMode} />
      <TileLayerView layer={instanceMap.tileLayers.doors} map={instanceMap} door viewMode={viewMode} />
      <SessionObjectLayer layer={instanceMap.decorationLayer} map={instanceMap} tool="brush" selectedObjectIds={[]} viewMode={viewMode} onSelect={() => undefined} />
      <SessionObjectLayer layer={instanceMap.objectLayer} map={instanceMap} tool="brush" selectedObjectIds={[]} viewMode={viewMode} onSelect={() => undefined} />
      <SessionObjectLayer layer={instanceMap.detailLayer} map={instanceMap} tool="brush" selectedObjectIds={[]} viewMode={viewMode} onSelect={() => undefined} />
      <SessionObjectLayer layer={instanceMap.lightingLayer} map={instanceMap} tool="brush" selectedObjectIds={[]} viewMode={viewMode} onSelect={() => undefined} />
      <Rect width={width} height={height} fill="rgba(0,0,0,0.01)" stroke={selected ? '#60a5fa' : instance.locked ? 'rgba(196,181,253,0.35)' : 'rgba(139,92,246,0.28)'} strokeWidth={selected ? 3 : 1} dash={selected || instance.locked ? [7, 5] : undefined} listening={!instance.locked} />
      <Text x={8} y={8} text={`${instance.name}${instance.locked ? ' / travado' : ''}`} fill="#ddd6fe" fontStyle="bold" fontSize={12} />
    </Group>
  );
}

function TileLayerView({
  layer,
  map,
  wall = false,
  door = false,
  viewMode,
  tool,
  onDoorClick,
  onDoorToggle
}: {
  layer: TileLayer;
  map: OmniMap;
  wall?: boolean;
  door?: boolean;
  viewMode: 'gm' | 'player-preview';
  tool?: MapTool;
  onDoorClick?(cell: TileCell, additive: boolean): void;
  onDoorToggle?(cell: TileCell): void;
}) {
  if (!layer.visible) return null;
  return (
    <>
      {layer.cells
        .filter((cell) => viewMode === 'gm' || !cell.secret)
        .map((cell) => {
          const asset = getAsset(cell.assetId, map.tilesets);
          const size = map.gridSize;
          const stateFill = door && cell.doorState === 'open' ? 'rgba(52,211,153,0.28)' : door && cell.doorState === 'locked' ? 'rgba(251,113,133,0.28)' : asset?.color || '#2a2035';
          return (
            <TileCellShape
              key={`${layer.key}-${cell.x}-${cell.y}`}
              cell={cell}
              map={map}
              assetImage={asset?.imageUrl}
              x={cell.x * size}
              y={cell.y * size}
              size={size}
              fill={stateFill}
              stroke={door ? '#ddd6fe' : wall ? asset?.stroke || '#a78bfa' : asset?.stroke || 'rgba(255,255,255,0.08)'}
              strokeWidth={wall || door ? 2 : 1}
              opacity={layer.opacity}
              listening={door}
              onMouseDown={(event) => {
                if (!door || !isPrimaryPointer(event.evt)) return;
                if (tool === 'door') {
                  event.cancelBubble = true;
                  onDoorToggle?.(cell);
                  return;
                }
                if (tool === 'select' || tool === 'token') {
                  event.cancelBubble = true;
                  onDoorClick?.(cell, Boolean('shiftKey' in event.evt && event.evt.shiftKey));
                }
              }}
              onDblClick={(event) => {
                if (!door) return;
                event.cancelBubble = true;
                onDoorToggle?.(cell);
              }}
            />
          );
        })}
    </>
  );
}

function TileCellShape({
  cell,
  map,
  assetImage,
  x,
  y,
  size,
  fill,
  stroke,
  strokeWidth,
  opacity,
  listening,
  onMouseDown,
  onDblClick
}: {
  cell: TileCell;
  map: OmniMap;
  assetImage?: string;
  x: number;
  y: number;
  size: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  listening?: boolean;
  onMouseDown?(event: KonvaEventObject<MouseEvent | TouchEvent>): void;
  onDblClick?(event: KonvaEventObject<MouseEvent | TouchEvent>): void;
}) {
  const image = useAssetImage(assetImage);
  const baseFootprint = cell.footprint || { w: 1, h: 1 };
  const renderedFootprint = resolveFootprint(baseFootprint, cell.rotation || 0);
  const width = renderedFootprint.w * size;
  const height = renderedFootprint.h * size;
  const imageWidth = baseFootprint.w * size;
  const imageHeight = baseFootprint.h * size;
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  return (
    <Group listening={listening} onMouseDown={onMouseDown} onTouchStart={onMouseDown} onDblClick={onDblClick}>
      <Group x={centerX} y={centerY} rotation={normalizeRotation45(cell.rotation || 0)} listening={false}>
        {image ? (
          <KonvaImage image={image} x={-imageWidth / 2} y={-imageHeight / 2} width={imageWidth} height={imageHeight} opacity={opacity} />
        ) : (
          <Rect x={-imageWidth / 2} y={-imageHeight / 2} width={imageWidth} height={imageHeight} fill={fill} opacity={opacity} />
        )}
      </Group>
      <Rect x={x} y={y} width={width} height={height} stroke={stroke} strokeWidth={strokeWidth} opacity={opacity * 0.9} fill={image ? undefined : fill} listening={false} />
      {cell.doorState ? <Text x={x} y={y + 2} width={width} align="center" text={cell.doorState === 'open' ? 'aberta' : cell.doorState === 'locked' ? 'trancada' : 'fechada'} fill="#f5f3ff" fontSize={9} listening={false} /> : null}
    </Group>
  );
}

function SessionObjectLayer({
  layer,
  map,
  tool,
  selectedObjectIds,
  viewMode,
  onSelect
}: {
  layer: ObjectLayer;
  map: OmniMap;
  tool: MapTool;
  selectedObjectIds: string[];
  viewMode: 'gm' | 'player-preview';
  onSelect(objectId: string, additive?: boolean): void;
}) {
  if (!layer.visible) return null;
  return (
    <>
      {[...layer.objects]
        .filter(isValidMapObject)
        .filter((object) => viewMode === 'gm' || object.visibleToPlayers !== false)
        .sort((left, right) => left.zIndex - right.zIndex)
        .map((object) => (
          <SessionObjectShape
            key={object.id}
            object={object}
            map={map}
            tool={tool}
            selected={selectedObjectIds.includes(object.id)}
            opacity={layer.opacity}
            selectable={layer.selectable !== false && !layer.locked}
            onSelect={onSelect}
          />
        ))}
    </>
  );
}

function SessionObjectShape({
  object,
  map,
  tool,
  selected,
  opacity,
  selectable,
  onSelect
}: {
  object: MapObject;
  map: OmniMap;
  tool: MapTool;
  selected: boolean;
  opacity: number;
  selectable: boolean;
  onSelect(objectId: string, additive?: boolean): void;
}) {
  const asset = getAsset(object.assetId, map.tilesets);
  const image = useAssetImage(asset?.imageUrl);
  const width = object.width * (object.scale || 1);
  const height = object.height * (object.scale || 1);
  const canSelect = selectable && (object.interactable || object.kind === 'light' || object.kind === 'note' || object.kind === 'zone' || object.kind === 'terminal' || object.kind === 'cover');
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  return (
    <Group
      name="session-object"
      x={object.x}
      y={object.y}
      rotation={object.rotation}
      draggable={tool === 'select' && canSelect && !object.locked}
      opacity={opacity * object.opacity * (object.hiddenFromPlayers ? 0.55 : 1)}
      onMouseDown={(event) => {
        if (tool !== 'select' || !canSelect || !isPrimaryPointer(event.evt)) return;
        event.cancelBubble = true;
        const additive = Boolean('shiftKey' in event.evt && event.evt.shiftKey);
        const state = useTabletopStore.getState();
        const keepCurrentSelection = selected && !additive && getSessionSelectionCount(state) > 1;
        if (!keepCurrentSelection) onSelect(object.id, additive);
      }}
      onTouchStart={(event) => {
        if (tool !== 'select' || !canSelect) return;
        event.cancelBubble = true;
        onSelect(object.id);
      }}
      onDragStart={() => {
        dragStartRef.current = { x: object.x, y: object.y };
        if (!selected) onSelect(object.id);
      }}
      onDragEnd={(event) => {
        const start = dragStartRef.current || { x: object.x, y: object.y };
        const deltaX = event.target.x() - start.x;
        const deltaY = event.target.y() - start.y;
        useTabletopStore.getState().moveSelectedSessionItems(deltaX, deltaY);
        dragStartRef.current = null;
      }}
    >
      {image ? (
        <KonvaImage image={image} width={width} height={height} />
      ) : (
        <Rect width={width} height={height} fill={object.color || asset?.color || '#2d2437'} stroke={asset?.stroke || '#8b5cf6'} cornerRadius={4} />
      )}
      {object.interactable ? <Circle x={width - 8} y={8} radius={4} fill="#f5f3ff" opacity={0.75} /> : null}
      {selected ? <Rect x={-4} y={-4} width={width + 8} height={height + 8} stroke="#60a5fa" strokeWidth={2} dash={[5, 4]} listening={false} /> : null}
    </Group>
  );
}

function TokenLayerView({
  map,
  tool,
  selectedTokenIds,
  viewMode,
  onSelect,
  onMove
}: {
  map: OmniMap;
  tool: MapTool;
  selectedTokenIds: Set<string>;
  viewMode: 'gm' | 'player-preview';
  onSelect(tokenId: string, additive?: boolean): void;
  onMove(tokenId: string, x: number, y: number): void;
}) {
  return (
    <>
      {map.tokens
        .filter((token) => viewMode === 'gm' || (token.visibleToPlayers && !token.hidden))
        .map((token) => (
          <TokenShape
            key={token.id}
            token={token}
            map={map}
            tool={tool}
            selected={selectedTokenIds.has(token.id)}
            selectedCount={selectedTokenIds.size}
            onSelect={onSelect}
            onMove={onMove}
          />
        ))}
    </>
  );
}

function TokenShape({
  token,
  map,
  tool,
  selected,
  selectedCount,
  onSelect,
  onMove
}: {
  token: TabletopToken;
  map: OmniMap;
  tool: MapTool;
  selected: boolean;
  selectedCount: number;
  onSelect(tokenId: string, additive?: boolean): void;
  onMove(tokenId: string, x: number, y: number): void;
}) {
  const image = useAssetImage(token.image);
  const size = map.gridSize;
  const visualSize = size * Math.max(0.5, token.size || 1);
  const tone = token.kind === 'enemy' ? '#fb7185' : token.kind === 'character' ? '#34d399' : '#8b5cf6';
  const draggable = tool === 'select' && !token.locked;
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  return (
    <Group
      x={token.x}
      y={token.y}
      draggable={draggable}
      opacity={token.hidden ? 0.45 : 1}
      onMouseDown={(event) => {
        if (tool !== 'select' || !isPrimaryPointer(event.evt)) return;
        event.cancelBubble = true;
        const additive = Boolean('shiftKey' in event.evt && event.evt.shiftKey);
        const state = useTabletopStore.getState();
        if (!selected || additive || getSessionSelectionCount(state) <= 1) onSelect(token.id, additive);
      }}
      onTouchStart={(event) => {
        if (tool !== 'select') return;
        event.cancelBubble = true;
        onSelect(token.id);
      }}
      onDragStart={() => {
        dragStartRef.current = { x: token.x, y: token.y };
        if (!selected) onSelect(token.id);
      }}
      onDragEnd={(event) => {
        const start = dragStartRef.current || { x: token.x, y: token.y };
        const nextX = event.target.x();
        const nextY = event.target.y();
        const deltaX = nextX - start.x;
        const deltaY = nextY - start.y;
        const stateBefore = useTabletopStore.getState();
        const before = stateBefore.map.tokens.find((entry) => entry.id === token.id);
        const activeSelection = stateBefore.selectedTokenIds;
        if (activeSelection.includes(token.id) && getSessionSelectionCount(stateBefore) > 1) {
          stateBefore.moveSelectedSessionItems(deltaX, deltaY);
        } else {
          onMove(token.id, nextX, nextY);
        }
        const after = useTabletopStore.getState().map.tokens.find((entry) => entry.id === token.id);
        if (before && after && before.x === after.x && before.y === after.y) {
          event.target.position({ x: start.x, y: start.y });
        }
        dragStartRef.current = null;
      }}
    >
      <Circle x={visualSize / 2} y={visualSize / 2} radius={visualSize * 0.48} fill="#130d1d" stroke={selected ? '#60a5fa' : token.auraColor || tone} strokeWidth={selected ? 4 : 2} />
      {image ? (
        <KonvaImage image={image} x={visualSize * 0.1} y={visualSize * 0.1} width={visualSize * 0.8} height={visualSize * 0.8} cornerRadius={8} />
      ) : (
        <Text x={0} y={visualSize / 2 - 9} width={visualSize} align="center" text={token.name.slice(0, 1).toUpperCase()} fill="#f5f3ff" fontStyle="bold" fontSize={Math.max(12, visualSize * 0.42)} />
      )}
      {token.hpMax ? <Rect x={visualSize * 0.12} y={visualSize - 6} width={visualSize * 0.76 * Math.max(0, Math.min(1, Number(token.hpCurrent || 0) / Math.max(1, token.hpMax)))} height={4} fill="#fb7185" cornerRadius={2} /> : null}
      <Text x={-visualSize * 0.6} y={visualSize + 2} width={visualSize * 2.2} align="center" text={token.name} fill="#ddd6fe" fontSize={10} />
      {token.statusMarkers?.length ? <Text x={-visualSize * 0.3} y={-13} width={visualSize * 1.6} align="center" text={token.statusMarkers.slice(0, 3).join(' ')} fill="#fbbf24" fontSize={9} /> : null}
    </Group>
  );
}

function LightAuraLayer({ map, viewMode }: { map: OmniMap; viewMode: 'gm' | 'player-preview' }) {
  return (
    <>
      {[...map.lightingLayer.objects, ...map.objectLayer.objects, ...map.mechanicalLayer.objects]
        .filter((object) => object.light && (viewMode === 'gm' || object.visibleToPlayers !== false))
        .map((object) => {
          const light = object.light;
          if (!light) return null;
          return (
            <Circle
              key={`light-aura-${object.id}`}
              x={object.x + object.width / 2}
              y={object.y + object.height / 2}
              radius={light.radius}
              fill={light.color}
              opacity={Math.max(0.04, light.intensity * 0.14)}
              listening={false}
            />
          );
        })}
    </>
  );
}

function LightingRegionLayer({
  map,
  viewMode,
  tool,
  selectedIds,
  onSelect,
  onMove
}: {
  map: OmniMap;
  viewMode: 'gm' | 'player-preview';
  tool: MapTool;
  selectedIds: Set<string>;
  onSelect(regionId: string, additive?: boolean): void;
  onMove(deltaX: number, deltaY: number): void;
}) {
  const regions = map.sessionLighting?.regions || map.lightingRegions || [];
  return (
    <>
      {regions
        .filter(isValidLightingRegion)
        .filter((region) => viewMode === 'gm' ? region.visibleToGM !== false : region.visibleToPlayers !== false)
        .map((region) => (
          <LightingRegionShape
            key={region.id}
            region={region}
            selected={selectedIds.has(region.id)}
            tool={tool}
            onSelect={onSelect}
            onMove={onMove}
          />
        ))}
    </>
  );
}

function LightingRegionShape({
  region,
  selected,
  tool,
  onSelect,
  onMove
}: {
  region: LightingRegion;
  selected: boolean;
  tool: MapTool;
  onSelect(regionId: string, additive?: boolean): void;
  onMove(deltaX: number, deltaY: number): void;
}) {
  const [start, end] = region.points;
  if (!start) return null;
  const bounds = getRegionBounds(region);
  const opacity = region.darknessMode === 'override'
    ? Math.max(0.08, region.darkness * 0.42)
    : Math.max(0.06, region.intensity * 0.18);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const content = (() => {
  if (region.shape === 'circle') {
    const radius = end ? Math.max(24, Math.hypot(end.x - start.x, end.y - start.y) / 2) : 96;
    return <Circle x={start.x + radius} y={start.y + radius} radius={radius} fill={region.color} opacity={opacity} listening={false} />;
  }
  if (region.shape === 'polygon' && region.points.length >= 3) {
    return <Line points={region.points.flatMap((point) => [point.x, point.y])} closed fill={region.color} opacity={opacity} listening={false} />;
  }
  const width = Math.max(4, Math.abs((end?.x || start.x + 96) - start.x));
  const height = Math.max(4, Math.abs((end?.y || start.y + 96) - start.y));
  return <Rect x={start.x} y={start.y} width={width} height={height} fill={region.color} opacity={opacity} listening={false} />;
  })();
  return (
    <Group
      draggable={tool === 'select'}
      onMouseDown={(event) => {
        if (tool !== 'select' || !isPrimaryPointer(event.evt)) return;
        event.cancelBubble = true;
        const additive = Boolean('shiftKey' in event.evt && event.evt.shiftKey);
        const state = useTabletopStore.getState();
        const keepCurrentSelection = selected && !additive && getSessionSelectionCount(state) > 1;
        if (!keepCurrentSelection) onSelect(region.id, additive);
      }}
      onDragStart={() => {
        dragStartRef.current = { x: 0, y: 0 };
        if (!selected) onSelect(region.id);
      }}
      onDragEnd={(event) => {
        const start = dragStartRef.current || { x: 0, y: 0 };
        const deltaX = event.target.x() - start.x;
        const deltaY = event.target.y() - start.y;
        const state = useTabletopStore.getState();
        const shouldMoveSelection = state.selectedRegionIds.includes(region.id)
          && (state.selectedRegionIds.length > 1 || state.selectedTokenIds.length || state.selectedObjectIds.length || state.selectedMapInstanceIds.length);
        if (shouldMoveSelection) state.moveSelectedSessionItems(deltaX, deltaY);
        else onMove(deltaX, deltaY);
        event.target.position({ x: 0, y: 0 });
        dragStartRef.current = null;
      }}
    >
      {content}
      {selected ? <Rect x={bounds.x - 4} y={bounds.y - 4} width={bounds.width + 8} height={bounds.height + 8} stroke="#60a5fa" strokeWidth={2} dash={[6, 4]} listening={false} /> : null}
    </Group>
  );
}

function TemplateLayer({
  map,
  viewMode,
  tool,
  selectedIds
}: {
  map: OmniMap;
  viewMode: 'gm' | 'player-preview';
  tool: MapTool;
  selectedIds: Set<string>;
}) {
  const templates = map.areaTemplates || [];
  return (
    <>
      {templates
        .filter((template) => viewMode === 'gm' || template.visibleToPlayers !== false)
        .map((template) => <TemplateShape key={template.id} template={template} tool={tool} selected={selectedIds.has(template.id)} />)}
    </>
  );
}

function TemplateShape({ template, tool, selected }: { template: AreaTemplate; tool: MapTool; selected: boolean }) {
  const stroke = template.color || '#67e8f9';
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const bounds = getTemplateBounds(template);
  const shape = (() => {
  if (template.shape === 'line') {
    return <Line points={[template.x, template.y, template.x + template.width, template.y + template.height]} stroke={stroke} strokeWidth={4} opacity={0.8} listening={false} />;
  }
  if (template.shape === 'rect' || template.shape === 'zone') {
    return <Rect x={template.x - template.width / 2} y={template.y - template.height / 2} width={template.width} height={template.height} fill={stroke} opacity={template.opacity} stroke={stroke} dash={[8, 5]} listening={false} />;
  }
  if (template.shape === 'cone') {
    return <Line points={[template.x, template.y, template.x + template.width, template.y - template.height / 2, template.x + template.width, template.y + template.height / 2]} closed fill={stroke} opacity={template.opacity} stroke={stroke} listening={false} />;
  }
  const radius = template.radius || Math.max(template.width, template.height) / 2;
  return <Circle x={template.x} y={template.y} radius={radius} fill={stroke} opacity={template.opacity} stroke={stroke} dash={[8, 5]} listening={false} />;
  })();

  return (
    <Group
      draggable={tool === 'select'}
      onMouseDown={(event) => {
        if (tool !== 'select' || !isPrimaryPointer(event.evt)) return;
        event.cancelBubble = true;
        const additive = Boolean('shiftKey' in event.evt && event.evt.shiftKey);
        const state = useTabletopStore.getState();
        const keepCurrentSelection = selected && !additive && state.getSelectionSummary().total > 1;
        if (!keepCurrentSelection) state.selectEntity({ type: 'template', id: template.id }, additive);
      }}
      onDragStart={() => {
        dragStartRef.current = { x: 0, y: 0 };
        if (!selected) useTabletopStore.getState().selectEntity({ type: 'template', id: template.id });
      }}
      onDragEnd={(event) => {
        const start = dragStartRef.current || { x: 0, y: 0 };
        useTabletopStore.getState().moveSelectedSessionItems(event.target.x() - start.x, event.target.y() - start.y);
        event.target.position({ x: 0, y: 0 });
        dragStartRef.current = null;
      }}
    >
      {shape}
      <Rect x={bounds.x} y={bounds.y} width={bounds.width} height={bounds.height} fill="rgba(255,255,255,0.01)" opacity={0.01} />
      {selected ? <Rect x={bounds.x - 4} y={bounds.y - 4} width={bounds.width + 8} height={bounds.height + 8} stroke="#60a5fa" strokeWidth={2} dash={[6, 4]} listening={false} /> : null}
    </Group>
  );
}

function getTemplateBounds(template: AreaTemplate) {
  if (template.radius) {
    return {
      x: template.x - template.radius,
      y: template.y - template.radius,
      width: template.radius * 2,
      height: template.radius * 2
    };
  }
  if (template.shape === 'line') {
    const x = Math.min(template.x, template.x + template.width);
    const y = Math.min(template.y, template.y + template.height);
    return {
      x,
      y,
      width: Math.max(8, Math.abs(template.width)),
      height: Math.max(8, Math.abs(template.height))
    };
  }
  return {
    x: template.x - Math.abs(template.width) / 2,
    y: template.y - Math.abs(template.height) / 2,
    width: Math.max(8, Math.abs(template.width)),
    height: Math.max(8, Math.abs(template.height))
  };
}

function SessionFogOverlay({
  map,
  enabled,
  viewMode,
  dynamic,
  visibleCells,
  darkness,
  viewport,
  camera,
  zoom
}: {
  map: OmniMap;
  enabled: boolean;
  viewMode: 'gm' | 'player-preview';
  dynamic: boolean;
  visibleCells: Set<string>;
  darkness: number;
  viewport: { width: number; height: number };
  camera: { x: number; y: number };
  zoom: number;
}) {
  const revealed = new Set(map.fogLayer.revealedCells.map((cell) => `${cell.x}:${cell.y}`));
  const cells: ReactNode[] = [];
  const visibleWorld = {
    x: -camera.x / zoom,
    y: -camera.y / zoom,
    width: viewport.width / zoom,
    height: viewport.height / zoom
  };
  if (!enabled) {
    if (darkness <= 0) return null;
    return <Rect {...visibleWorld} fill="#030108" opacity={viewMode === 'gm' ? darkness * 0.22 : darkness * 0.42} listening={false} />;
  }
  for (let y = 0; y < map.height; y += 1) {
    for (let x = 0; x < map.width; x += 1) {
      const key = `${x}:${y}`;
      const currentlyVisible = dynamic && visibleCells.has(key);
      if (currentlyVisible) continue;
      const explored = revealed.has(key);
      const cellDarkness = getRegionAdjustedDarkness(map, x, y, darkness, viewMode);
      const opacity = viewMode === 'gm'
        ? explored ? 0.12 + cellDarkness * 0.1 : 0.28 + cellDarkness * 0.16
        : explored ? 0.42 + cellDarkness * 0.14 : 0.82 + cellDarkness * 0.12;
      cells.push(
        <Rect
          key={`session-fog-${key}`}
          x={x * map.gridSize}
          y={y * map.gridSize}
          width={map.gridSize}
          height={map.gridSize}
          fill="#030108"
          opacity={Math.min(0.96, opacity)}
          listening={false}
        />
      );
    }
  }
  return <>{cells}</>;
}

function SelectedDoorOverlay({ map, selectedTileCells }: { map: OmniMap; selectedTileCells: Array<{ layer: string; x: number; y: number }> }) {
  return (
    <>
      {selectedTileCells.filter((cell) => cell.layer === 'doors').map((cell) => {
        const tile = findTileAtCell(map, 'doors', cell.x, cell.y);
        const footprint = resolveFootprint(tile?.footprint, tile?.rotation || 0);
        return <Rect key={`sel-door-${cell.x}-${cell.y}`} x={cell.x * map.gridSize} y={cell.y * map.gridSize} width={footprint.w * map.gridSize} height={footprint.h * map.gridSize} stroke="#60a5fa" strokeWidth={3} dash={[5, 4]} listening={false} />;
      })}
    </>
  );
}

function getRegionAdjustedDarkness(map: OmniMap, cellX: number, cellY: number, baseDarkness: number, viewMode: 'gm' | 'player-preview') {
  const point = {
    x: cellX * map.gridSize + map.gridSize / 2,
    y: cellY * map.gridSize + map.gridSize / 2
  };
  let darkness = baseDarkness;
  (map.sessionLighting?.regions || map.lightingRegions || []).forEach((region) => {
    if (viewMode === 'player-preview' && region.visibleToPlayers === false) return;
    if (viewMode === 'gm' && region.visibleToGM === false) return;
    if (!pointInLightingRegion(region, point)) return;
    if (region.darknessMode === 'override') darkness = region.darkness;
    else if (region.darknessMode === 'subtract') darkness -= region.darkness;
    else darkness += region.darkness;
  });
  return Math.max(0, Math.min(1, darkness));
}

function pointInLightingRegion(region: LightingRegion, point: { x: number; y: number }) {
  const [start, end] = region.points;
  if (!start) return false;
  if (region.shape === 'circle') {
    const radius = end ? Math.max(1, Math.hypot(end.x - start.x, end.y - start.y) / 2) : 96;
    const center = { x: start.x + radius, y: start.y + radius };
    return Math.hypot(point.x - center.x, point.y - center.y) <= radius;
  }
  if (region.shape === 'polygon' && region.points.length >= 3) {
    return pointInPolygon(point, region.points);
  }
  const x = Math.min(start.x, end?.x || start.x);
  const y = Math.min(start.y, end?.y || start.y);
  const width = Math.abs((end?.x || start.x) - start.x);
  const height = Math.abs((end?.y || start.y) - start.y);
  return point.x >= x && point.x <= x + width && point.y >= y && point.y <= y + height;
}

function getRegionBounds(region: LightingRegion) {
  if (!region.points.length) return { x: 0, y: 0, width: 1, height: 1 };
  const xs = region.points.map((point) => point.x);
  const ys = region.points.map((point) => point.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  return { x: minX, y: minY, width: Math.max(1, maxX - minX), height: Math.max(1, maxY - minY) };
}

function pointInPolygon(point: { x: number; y: number }, polygon: Array<{ x: number; y: number }>) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const a = polygon[i];
    const b = polygon[j];
    const intersects = ((a.y > point.y) !== (b.y > point.y))
      && (point.x < ((b.x - a.x) * (point.y - a.y)) / ((b.y - a.y) || 1) + a.x);
    if (intersects) inside = !inside;
  }
  return inside;
}

function RulerView({ map, ruler }: { map: OmniMap; ruler: { start: { x: number; y: number }; end: { x: number; y: number } } }) {
  const dx = ruler.end.x - ruler.start.x;
  const dy = ruler.end.y - ruler.start.y;
  const cells = Math.sqrt(dx * dx + dy * dy) / map.gridSize;
  const meters = cells * (map.metersPerCell || 1.5);
  return (
    <>
      <Line points={[ruler.start.x, ruler.start.y, ruler.end.x, ruler.end.y]} stroke="#67e8f9" strokeWidth={3} dash={[8, 5]} listening={false} />
      <Text x={(ruler.start.x + ruler.end.x) / 2 + 8} y={(ruler.start.y + ruler.end.y) / 2 + 8} text={`${meters.toFixed(1)} m / ${cells.toFixed(1)} cel`} fill="#cffafe" fontStyle="bold" fontSize={13} listening={false} />
    </>
  );
}

function PingLayer({ pings }: { pings: Array<{ id: string; x: number; y: number; createdAt: number }> }) {
  return (
    <>
      {pings.map((ping) => (
        <Group key={ping.id} x={ping.x} y={ping.y} listening={false}>
          <Circle radius={26} stroke="#f5f3ff" strokeWidth={2} opacity={0.75} />
          <Circle radius={10} fill="#8b5cf6" opacity={0.8} />
          <Line points={[-34, 0, -12, 0, 12, 0, 34, 0]} stroke="#f5f3ff" strokeWidth={2} opacity={0.8} />
          <Line points={[0, -34, 0, -12, 0, 12, 0, 34]} stroke="#f5f3ff" strokeWidth={2} opacity={0.8} />
        </Group>
      ))}
    </>
  );
}

function InfiniteGrid({
  viewport,
  camera,
  zoom,
  gridSize
}: {
  viewport: { width: number; height: number };
  camera: { x: number; y: number };
  zoom: number;
  gridSize: number;
}) {
  const minX = Math.floor((-camera.x / zoom) / gridSize) * gridSize - gridSize * 2;
  const maxX = Math.ceil(((viewport.width - camera.x) / zoom) / gridSize) * gridSize + gridSize * 2;
  const minY = Math.floor((-camera.y / zoom) / gridSize) * gridSize - gridSize * 2;
  const maxY = Math.ceil(((viewport.height - camera.y) / zoom) / gridSize) * gridSize + gridSize * 2;
  const lines: ReactNode[] = [];

  for (let x = minX; x <= maxX; x += gridSize) {
    const major = Math.round(x / gridSize) % 5 === 0;
    lines.push(<Line key={`igx-${x}`} points={[x, minY, x, maxY]} stroke={GRID_LINE} strokeWidth={major ? 1.3 : 1} opacity={major ? 0.9 : 0.65} listening={false} />);
  }
  for (let y = minY; y <= maxY; y += gridSize) {
    const major = Math.round(y / gridSize) % 5 === 0;
    lines.push(<Line key={`igy-${y}`} points={[minX, y, maxX, y]} stroke={GRID_LINE} strokeWidth={major ? 1.3 : 1} opacity={major ? 0.9 : 0.65} listening={false} />);
  }
  return <>{lines}</>;
}

function computeVisibleCells(map: OmniMap, viewMode: 'gm' | 'player-preview') {
  const visible = new Set<string>();
  const tokens = map.tokens.filter((token) => token.visionEnabled !== false && !token.hidden && (viewMode === 'gm' || token.visibleToPlayers));
  tokens.forEach((token) => {
    const visualSize = map.gridSize * Math.max(0.5, token.size || 1);
    const cell = {
      x: Math.floor((token.x + visualSize / 2) / map.gridSize),
      y: Math.floor((token.y + visualSize / 2) / map.gridSize)
    };
    addVisionCircle(map, visible, cell, Math.max(1, token.visionRadius || 6));
    if (token.lightRadius) addVisionCircle(map, visible, cell, Math.max(1, Math.round(token.lightRadius)));
  });
  [map.lightingLayer, map.objectLayer, map.mechanicalLayer].flatMap((layer) => layer.objects).forEach((object) => {
    if (!object.light || (viewMode !== 'gm' && object.visibleToPlayers === false)) return;
    const origin = {
      x: Math.floor((object.x + object.width / 2) / map.gridSize),
      y: Math.floor((object.y + object.height / 2) / map.gridSize)
    };
    addVisionCircle(map, visible, origin, Math.max(1, Math.round(object.light.radius / map.gridSize)));
  });
  return visible;
}

function addVisionCircle(map: OmniMap, visible: Set<string>, origin: { x: number; y: number }, radius: number) {
  for (let y = origin.y - radius; y <= origin.y + radius; y += 1) {
    for (let x = origin.x - radius; x <= origin.x + radius; x += 1) {
      if (!isInsideCell(map, x, y)) continue;
      const distance = Math.hypot(x - origin.x, y - origin.y);
      if (distance > radius) continue;
      if (!hasLineOfSight(map, origin, { x, y })) continue;
      visible.add(`${x}:${y}`);
    }
  }
}

function hasLineOfSight(map: OmniMap, start: { x: number; y: number }, end: { x: number; y: number }) {
  const cells = bresenham(start.x, start.y, end.x, end.y);
  for (const cell of cells.slice(1, -1)) {
    if (blocksVisionAt(map, cell.x, cell.y)) return false;
  }
  return true;
}

function blocksVisionAt(map: OmniMap, x: number, y: number) {
  for (const layer of VISION_BLOCKERS) {
    const tile = findTileAtCell(map, layer, x, y);
    if (!tile) continue;
    if (layer === 'doors' && tile.doorState === 'open') continue;
    if (tile.blocksVision !== false) return true;
  }
  const point = cellCenter(map, { x, y });
  return [map.objectLayer, map.decorationLayer, map.detailLayer, map.mechanicalLayer]
    .flatMap((layer) => layer.objects)
    .some((object) => object.blocksVision && objectContainsPoint(object, point.x, point.y));
}

function bresenham(x0: number, y0: number, x1: number, y1: number) {
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
    const e2 = 2 * error;
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

function useAssetImage(src?: string) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    if (!src) {
      setImage(null);
      return;
    }
    let active = true;
    const nextImage = new window.Image();
    nextImage.crossOrigin = 'anonymous';
    nextImage.onload = () => {
      if (active) setImage(nextImage);
    };
    nextImage.onerror = () => {
      if (active) setImage(null);
    };
    nextImage.src = src;
    return () => {
      active = false;
    };
  }, [src]);
  return image;
}

function getCellRect(map: OmniMap, cell: TileCell) {
  const footprint = resolveFootprint(cell.footprint, cell.rotation || 0);
  return {
    x: cell.x * map.gridSize,
    y: cell.y * map.gridSize,
    width: footprint.w * map.gridSize,
    height: footprint.h * map.gridSize
  };
}

function findTileAtCell(map: OmniMap, layerKey: 'floor' | 'walls' | 'doors' | 'collision', x: number, y: number) {
  return map.tileLayers[layerKey].cells.find((cell) => {
    const footprint = resolveFootprint(cell.footprint, cell.rotation || 0);
    return x >= cell.x && x < cell.x + footprint.w && y >= cell.y && y < cell.y + footprint.h;
  }) || null;
}

function resolveFootprint(footprint: TileCell['footprint'], rotation = 0) {
  const base = footprint || { w: 1, h: 1 };
  const normalized = normalizeRotation45(rotation);
  return normalized === 90 || normalized === 270 ? { w: base.h, h: base.w } : base;
}

function normalizeRotation45(value: number) {
  const snapped = Math.round(value / 45) * 45;
  const normalized = snapped % 360;
  return normalized < 0 ? normalized + 360 : normalized;
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

function isInsideCell(map: OmniMap, x: number, y: number) {
  return x >= 0 && y >= 0 && x < map.width && y < map.height;
}

function isPrimaryPointer(event: MouseEvent | TouchEvent | PointerEvent) {
  return !('button' in event) || event.button === 0;
}

function getSessionSelectionCount(state: {
  selectedTokenIds: string[];
  selectedObjectIds: string[];
  selectedMapInstanceIds: string[];
  selectedRegionIds: string[];
  selectedTileCells: unknown[];
}) {
  return state.selectedTokenIds.length
    + state.selectedObjectIds.length
    + state.selectedMapInstanceIds.length
    + state.selectedRegionIds.length
    + state.selectedTileCells.length;
}

function isValidSessionMapInstance(instance: SessionMapInstance) {
  return Boolean(
    instance.id
    && Number.isFinite(instance.x)
    && Number.isFinite(instance.y)
    && Number.isFinite(instance.width)
    && Number.isFinite(instance.height)
    && Number.isFinite(instance.gridSize)
    && instance.width > 0
    && instance.height > 0
    && instance.gridSize > 0
    && instance.opacity !== 0
  );
}

function isValidMapObject(object: MapObject) {
  return Boolean(
    object.id
    && Number.isFinite(object.x)
    && Number.isFinite(object.y)
    && Number.isFinite(object.width)
    && Number.isFinite(object.height)
    && object.width > 0
    && object.height > 0
    && object.opacity !== 0
  );
}

function isValidLightingRegion(region: LightingRegion) {
  return Boolean(
    region.id
    && region.shape
    && region.points.length
    && region.points.every((point) => Number.isFinite(point.x) && Number.isFinite(point.y))
  );
}
