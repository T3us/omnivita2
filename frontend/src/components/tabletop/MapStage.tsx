import { Circle, Group, Image as KonvaImage, Layer, Line, Rect, Stage, Text, Transformer } from 'react-konva';
import type Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { DragEvent, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { getAsset } from './assets';
import { useTabletopStore } from './mapStore';
import type { MapLayerKey, MapObject, MapTool, ObjectLayer, OmniMap, SelectedTileCell, SnapMode, TabletopToken, TileLayer } from './types';

const GRID_LINE = 'rgba(196,181,253,0.13)';

type PointerContext = {
  pointer: { x: number; y: number };
  cell: { x: number; y: number } | null;
};

export function MapStage() {
  const map = useTabletopStore((state) => state.map);
  const tool = useTabletopStore((state) => state.tool);
  const zoom = useTabletopStore((state) => state.zoom);
  const setZoom = useTabletopStore((state) => state.setZoom);
  const selectedAssetId = useTabletopStore((state) => state.selectedAssetId);
  const selectedObjectIds = useTabletopStore((state) => state.selectedObjectIds);
  const selectedTileCells = useTabletopStore((state) => state.selectedTileCells);
  const selectedTokenId = useTabletopStore((state) => state.selectedTokenId);
  const placementRotation = useTabletopStore((state) => state.placementRotation);
  const snapMode = useTabletopStore((state) => state.snapMode);
  const brushSize = useTabletopStore((state) => state.brushSize);
  const showGrid = useTabletopStore((state) => state.showGrid);
  const isTransforming = useTabletopStore((state) => state.isTransforming);
  const soloLayer = useTabletopStore((state) => state.soloLayer);
  const paintBrush = useTabletopStore((state) => state.paintBrush);
  const eraseBrush = useTabletopStore((state) => state.eraseBrush);
  const eraseBrushAtPoint = useTabletopStore((state) => state.eraseBrushAtPoint);
  const addObject = useTabletopStore((state) => state.addObject);
  const addDoor = useTabletopStore((state) => state.addDoor);
  const updateObject = useTabletopStore((state) => state.updateObject);
  const selectObject = useTabletopStore((state) => state.selectObject);
  const selectArea = useTabletopStore((state) => state.selectArea);
  const clearObjectSelection = useTabletopStore((state) => state.clearObjectSelection);
  const moveSelectedObjects = useTabletopStore((state) => state.moveSelectedObjects);
  const moveToken = useTabletopStore((state) => state.moveToken);
  const selectToken = useTabletopStore((state) => state.selectToken);
  const captureHistory = useTabletopStore((state) => state.captureHistory);
  const setTransforming = useTabletopStore((state) => state.setTransforming);
  const viewportRef = useRef<HTMLDivElement>(null);
  const paintingRef = useRef(false);
  const selectionStartRef = useRef<{ x: number; y: number } | null>(null);
  const spacePressedRef = useRef(false);
  const panStartRef = useRef<{ pointer: { x: number; y: number }; camera: { x: number; y: number } } | null>(null);
  const wallLineModeRef = useRef(false);
  const strokeStartRef = useRef<{ x: number; y: number } | null>(null);
  const strokeCellsRef = useRef(new Set<string>());
  const [viewport, setViewport] = useState({ width: 1100, height: 620 });
  const [camera, setCamera] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [hoverCell, setHoverCell] = useState<{ x: number; y: number } | null>(null);
  const [hoverPoint, setHoverPoint] = useState<{ x: number; y: number } | null>(null);
  const [selectionBox, setSelectionBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return;
    const update = () => {
      const rect = element.getBoundingClientRect();
      setViewport({
        width: Math.max(320, Math.round(rect.width)),
        height: Math.max(520, Math.round(rect.height || 620))
      });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isEditableTarget(event.target)) return;
      if (event.code !== 'Space') return;
      event.preventDefault();
      spacePressedRef.current = true;
    }
    function handleKeyUp(event: KeyboardEvent) {
      if (event.code === 'Space') spacePressedRef.current = false;
    }
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  function handlePointerDown(event: KonvaEventObject<MouseEvent | TouchEvent | PointerEvent>) {
    if (isTransforming || isTransformerTarget(event.target)) return;
    const screenPointer = getStagePointer(event.target.getStage());
    if (!screenPointer) return;
    const shouldPan = spacePressedRef.current
      || getEventButton(event.evt) === 1
      || (tool === 'select' && isEmptySelectionTarget(event.target) && getEventButton(event.evt) === 0 && !isAdditiveEvent(event.evt));
    if (shouldPan) {
      event.evt.preventDefault();
      if (tool === 'select' && getEventButton(event.evt) === 0 && isEmptySelectionTarget(event.target)) clearObjectSelection();
      panStartRef.current = { pointer: screenPointer, camera };
      setIsPanning(true);
      capturePointer(event);
      return;
    }
    const pointer = screenToWorld(screenPointer, camera, zoom);
    if (!pointer) return;
    const cell = pointerToCell(pointer, map);
    setHoverPoint(pointer);
    setHoverCell(cell);

    if (map.mode !== 'build') return;

    const context = { pointer, cell };
    if (tool === 'select') handleSelectPointerDown(event, context);
    else if (tool === 'erase') handleErasePointerDown(context);
    else if (tool === 'door' || isPlaceTool(tool)) handlePlacePointerDown(event, context);
    else if (isGridTool(tool)) handlePaintPointerDown(event, context);
  }

  function handleSelectPointerDown(event: KonvaEventObject<MouseEvent | TouchEvent | PointerEvent>, context: PointerContext) {
    if (!isEmptySelectionTarget(event.target)) return;
    if (!isAdditiveEvent(event.evt)) clearObjectSelection();
    selectionStartRef.current = context.pointer;
    setSelectionBox({ x: context.pointer.x, y: context.pointer.y, width: 0, height: 0 });
  }

  function handlePaintPointerDown(event: KonvaEventObject<MouseEvent | TouchEvent | PointerEvent>, context: PointerContext) {
    if (!context.cell) return;
    captureHistory();
    paintingRef.current = true;
    strokeStartRef.current = context.cell;
    wallLineModeRef.current = tool === 'wall' && isAdditiveEvent(event.evt);
    strokeCellsRef.current = new Set();
    paintStrokeCell(context.cell, context.pointer);
  }

  function handleErasePointerDown(context: PointerContext) {
    if (!context.cell) return;
    captureHistory();
    paintingRef.current = true;
    strokeStartRef.current = context.cell;
    wallLineModeRef.current = false;
    strokeCellsRef.current = new Set();
    paintStrokeCell(context.cell, context.pointer);
  }

  function handlePlacePointerDown(event: KonvaEventObject<MouseEvent | TouchEvent | PointerEvent>, context: PointerContext) {
    if (tool === 'door') {
      if (context.cell) addDoor(context.cell.x, context.cell.y, selectedAssetId, placementRotation);
      return;
    }
    const parentId = 'altKey' in event.evt && event.evt.altKey ? getObjectIdFromTarget(event.target) : undefined;
    addObject(selectedAssetId, context.pointer.x, context.pointer.y, parentId);
  }

  function handlePointerMove(event: KonvaEventObject<MouseEvent | TouchEvent | PointerEvent>) {
    if (isTransforming) return;
    const screenPointer = getStagePointer(event.target.getStage());
    if (!screenPointer) return;
    if (panStartRef.current) {
      const dx = screenPointer.x - panStartRef.current.pointer.x;
      const dy = screenPointer.y - panStartRef.current.pointer.y;
      setCamera({ x: panStartRef.current.camera.x + dx, y: panStartRef.current.camera.y + dy });
      return;
    }
    const pointer = screenToWorld(screenPointer, camera, zoom);
    if (!pointer) return;
    const cell = pointerToCell(pointer, map);
    setHoverPoint(pointer);
    setHoverCell(cell);
    if (tool === 'select' && selectionStartRef.current) {
      setSelectionBox({
        x: selectionStartRef.current.x,
        y: selectionStartRef.current.y,
        width: pointer.x - selectionStartRef.current.x,
        height: pointer.y - selectionStartRef.current.y
      });
      return;
    }
    if (!paintingRef.current || !cell) return;
    if (wallLineModeRef.current && strokeStartRef.current) {
      getAxisLockedLineCells(strokeStartRef.current, cell).forEach((entry) => paintStrokeCell(entry));
      return;
    }
    paintStrokeCell(cell, pointer);
  }

  function handlePointerUp(event: KonvaEventObject<MouseEvent | TouchEvent | PointerEvent>) {
    releasePointer(event);
    if (tool === 'select' && selectionStartRef.current && selectionBox) {
      const isTiny = Math.abs(selectionBox.width) < 4 && Math.abs(selectionBox.height) < 4;
      if (!isTiny) {
        selectArea(selectionBox, isAdditiveEvent(event.evt));
      }
    }
    selectionStartRef.current = null;
    panStartRef.current = null;
    setIsPanning(false);
    setSelectionBox(null);
    paintingRef.current = false;
    wallLineModeRef.current = false;
    strokeStartRef.current = null;
    strokeCellsRef.current.clear();
  }

  function paintStrokeCell(cell: { x: number; y: number }, pointer?: { x: number; y: number }) {
    const targetLayer = getPaintLayer(tool, map.activeLayer);
    const cells = getBrushCells(cell.x, cell.y, brushSize);
    const newCells = cells.filter((entry) => {
      const key = `${targetLayer}:${entry.x}:${entry.y}`;
      if (strokeCellsRef.current.has(key)) return false;
      strokeCellsRef.current.add(key);
      return true;
    });
    if (!newCells.length) return;
    newCells.forEach((entry) => {
      if (tool === 'erase') {
        if (pointer && newCells.length === 1) eraseBrushAtPoint(pointer.x, pointer.y, 1);
        else eraseBrush(entry.x, entry.y, 1);
      }
      else paintBrush(entry.x, entry.y, targetLayer, selectedAssetId, 1);
    });
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (map.mode !== 'build') return;
    const assetId = event.dataTransfer.getData('application/x-omnivita-asset');
    if (!assetId || !viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left - camera.x) / zoom;
    const y = (event.clientY - rect.top - camera.y) / zoom;
    const asset = getAsset(assetId, map.tilesets);
    const cell = pointerToCell({ x, y }, map);
    if ((asset?.defaultLayer === 'floor' || asset?.defaultLayer === 'walls') && cell) {
      captureHistory();
      paintBrush(cell.x, cell.y, asset.defaultLayer, assetId, brushSize);
      return;
    }
    if (asset?.defaultLayer === 'doors' && cell) {
      addDoor(cell.x, cell.y, assetId, placementRotation);
      return;
    }
    addObject(assetId, x, y, undefined);
  }

  function handleWheel(event: KonvaEventObject<WheelEvent>) {
    event.evt.preventDefault();
    const screenPointer = getStagePointer(event.target.getStage());
    if (!screenPointer) return;
    const worldBefore = screenToWorld(screenPointer, camera, zoom);
    const direction = event.evt.deltaY > 0 ? -1 : 1;
    const nextZoom = Math.max(0.5, Math.min(2.5, zoom * (direction > 0 ? 1.08 : 0.92)));
    setZoom(nextZoom);
    setCamera({
      x: screenPointer.x - worldBefore.x * nextZoom,
      y: screenPointer.y - worldBefore.y * nextZoom
    });
  }

  function resetCamera() {
    setCamera({ x: 0, y: 0 });
    setZoom(1);
  }

  function centerMap() {
    setCamera({
      x: viewport.width / 2 - (map.width * map.gridSize * zoom) / 2,
      y: viewport.height / 2 - (map.height * map.gridSize * zoom) / 2
    });
  }

  return (
    <div
      ref={viewportRef}
      className="relative h-[clamp(520px,calc(100vh-360px),760px)] min-h-0 select-none overflow-hidden rounded-lg border border-line bg-black/40 touch-none"
      style={{ cursor: isPanning ? 'grabbing' : tool === 'select' ? 'grab' : undefined }}
      onDragOver={(event) => {
        if (map.mode === 'build') event.preventDefault();
      }}
      onDrop={handleDrop}
    >
      <Stage
        width={viewport.width}
        height={viewport.height}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onWheel={handleWheel}
      >
        <Layer x={camera.x} y={camera.y} scaleX={zoom} scaleY={zoom}>
          <MapBackground map={map} />
          {isLayerVisible('floor', soloLayer) ? <TileLayerView layer={map.tileLayers.floor} map={map} /> : null}
          {isLayerVisible('walls', soloLayer) ? <TileLayerView layer={map.tileLayers.walls} map={map} wall /> : null}
          {isLayerVisible('doors', soloLayer) ? <TileLayerView layer={map.tileLayers.doors} map={map} door /> : null}
          {isLayerVisible('decoration', soloLayer) ? <ObjectLayerView layer={map.decorationLayer} map={map} tool={tool} selectedObjectIds={selectedObjectIds} onSelect={selectObject} onUpdate={updateObject} onMoveSelected={moveSelectedObjects} setTransforming={setTransforming} /> : null}
          {isLayerVisible('objects', soloLayer) ? <ObjectLayerView layer={map.objectLayer} map={map} tool={tool} selectedObjectIds={selectedObjectIds} onSelect={selectObject} onUpdate={updateObject} onMoveSelected={moveSelectedObjects} setTransforming={setTransforming} /> : null}
          {isLayerVisible('details', soloLayer) ? <ObjectLayerView layer={map.detailLayer} map={map} tool={tool} selectedObjectIds={selectedObjectIds} onSelect={selectObject} onUpdate={updateObject} onMoveSelected={moveSelectedObjects} setTransforming={setTransforming} /> : null}
          {isLayerVisible('lighting', soloLayer) ? <ObjectLayerView layer={map.lightingLayer} map={map} tool={tool} selectedObjectIds={selectedObjectIds} onSelect={selectObject} onUpdate={updateObject} onMoveSelected={moveSelectedObjects} setTransforming={setTransforming} /> : null}
          {isLayerVisible('mechanics', soloLayer) ? <ObjectLayerView layer={map.mechanicalLayer} map={map} tool={tool} selectedObjectIds={selectedObjectIds} onSelect={selectObject} onUpdate={updateObject} onMoveSelected={moveSelectedObjects} setTransforming={setTransforming} /> : null}
          {isLayerVisible('collision', soloLayer) ? <TileLayerView layer={map.tileLayers.collision} map={map} collision /> : null}
          {isLayerVisible('fog', soloLayer) ? <FogView map={map} /> : null}
          {isLayerVisible('notes', soloLayer) ? <ObjectLayerView layer={map.notesLayer} map={map} tool={tool} selectedObjectIds={selectedObjectIds} onSelect={selectObject} onUpdate={updateObject} onMoveSelected={moveSelectedObjects} setTransforming={setTransforming} /> : null}
          {isLayerVisible('tokens', soloLayer) ? (
            <TokenLayerView
              map={map}
              selectedTokenId={selectedTokenId}
              onSelect={selectToken}
              onMove={moveToken}
            />
          ) : null}
          {showGrid ? <Grid map={map} /> : null}
          <SelectedTileOverlay map={map} selectedTileCells={selectedTileCells} />
          <SelectedGroupBounds map={map} selectedObjectIds={selectedObjectIds} selectedTileCells={selectedTileCells} />
          <BrushPreview map={map} tool={tool} cell={hoverCell} brushSize={brushSize} />
          <PlacementPreview map={map} tool={tool} point={hoverPoint} cell={hoverCell} assetId={selectedAssetId} rotation={placementRotation} snapMode={snapMode} />
          {selectionBox ? <SelectionBox box={selectionBox} /> : null}
        </Layer>
      </Stage>
      <div className="pointer-events-auto absolute right-3 top-3 flex flex-wrap gap-2 rounded-lg border border-line bg-panel/95 p-2 text-xs text-textMuted">
        <button type="button" className="rounded-lg border border-line bg-white/5 px-2 py-1 font-bold text-textMain" onClick={resetCamera}>Reset camera</button>
        <button type="button" className="rounded-lg border border-line bg-white/5 px-2 py-1 font-bold text-textMain" onClick={centerMap}>Centralizar mapa</button>
      </div>
    </div>
  );
}

function MapBackground({ map }: { map: OmniMap }) {
  return (
    <Rect
      name="map-background"
      x={0}
      y={0}
      width={map.width * map.gridSize}
      height={map.height * map.gridSize}
      fill="rgba(8,4,15,0.18)"
      stroke="rgba(196,181,253,0.18)"
      strokeWidth={1}
    />
  );
}

function TileLayerView({ layer, map, wall = false, door = false, collision = false }: { layer: TileLayer; map: OmniMap; wall?: boolean; door?: boolean; collision?: boolean }) {
  if (!layer.visible) return null;
  return (
    <>
      {layer.cells.map((cell) => {
        const asset = getAsset(cell.assetId, map.tilesets);
        const size = map.gridSize;
        return (
          <TileCellView
            key={`${layer.key}-${cell.x}-${cell.y}`}
            assetImage={collision ? '' : asset?.imageUrl}
            x={cell.x * size}
            y={cell.y * size}
            size={size}
            footprint={cell.footprint || asset?.gridFootprint}
            rotation={cell.rotation || 0}
            fill={collision ? 'rgba(251,113,133,0.22)' : asset?.color || '#2a2035'}
            stroke={wall || door || collision ? asset?.stroke || '#a78bfa' : asset?.stroke || 'rgba(255,255,255,0.08)'}
            strokeWidth={wall || door ? 2 : 1}
            opacity={layer.opacity}
          />
        );
      })}
    </>
  );
}

function ObjectLayerView({
  layer,
  map,
  tool,
  selectedObjectIds,
  onSelect,
  onUpdate,
  onMoveSelected,
  setTransforming
}: {
  layer: ObjectLayer;
  map: OmniMap;
  tool: MapTool;
  selectedObjectIds: string[];
  onSelect(objectId: string, additive?: boolean): void;
  onUpdate(objectId: string, patch: Partial<MapObject>): void;
  onMoveSelected(deltaX: number, deltaY: number, snapOverride?: SnapMode | null): void;
  setTransforming(value: boolean): void;
}) {
  if (!layer.visible) return null;
  return (
    <>
      {[...layer.objects].sort((left, right) => left.zIndex - right.zIndex).map((object) => (
        <MapObjectShape
          key={object.id}
          map={map}
          object={object}
          tool={tool}
          selected={selectedObjectIds.includes(object.id)}
          selectable={layer.selectable !== false}
          draggable={tool === 'select' && layer.selectable !== false && layer.editable !== false && !layer.locked && !object.locked && map.mode === 'build'}
          canTransform={selectedObjectIds.length === 1}
          opacity={layer.opacity}
          onSelect={onSelect}
          onUpdate={onUpdate}
          onMoveSelected={onMoveSelected}
          setTransforming={setTransforming}
        />
      ))}
    </>
  );
}

function MapObjectShape({
  map,
  object,
  tool,
  selected,
  selectable,
  draggable,
  canTransform,
  opacity,
  onSelect,
  onUpdate,
  onMoveSelected,
  setTransforming
}: {
  map: OmniMap;
  object: MapObject;
  tool: MapTool;
  selected: boolean;
  selectable: boolean;
  draggable: boolean;
  canTransform: boolean;
  opacity: number;
  onSelect(objectId: string, additive?: boolean): void;
  onUpdate(objectId: string, patch: Partial<MapObject>): void;
  onMoveSelected(deltaX: number, deltaY: number, snapOverride?: SnapMode | null): void;
  setTransforming(value: boolean): void;
}) {
  const asset = getAsset(object.assetId, map.tilesets);
  const groupRef = useRef<Konva.Group>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const image = useAssetImage(asset?.imageUrl);
  const width = object.width * (object.scale || 1);
  const height = object.height * (object.scale || 1);
  const fill = object.color || asset?.color || '#2d2437';
  const stroke = selected ? '#f5f3ff' : asset?.stroke || '#8b5cf6';

  useEffect(() => {
    if (tool !== 'select' || !selected || !canTransform || !transformerRef.current || !groupRef.current) return;
    transformerRef.current.nodes([groupRef.current]);
    transformerRef.current.getLayer()?.batchDraw();
  }, [selected, canTransform, tool]);

  return (
    <>
      <Group
        name="map-object"
        id={object.id}
        ref={groupRef}
        x={object.x}
        y={object.y}
        rotation={object.rotation}
        draggable={draggable}
        opacity={opacity * object.opacity}
        onMouseDown={(event) => {
          if (tool !== 'select') return;
          event.cancelBubble = true;
          if (!selectable) return;
          onSelect(object.id, Boolean('shiftKey' in event.evt && event.evt.shiftKey));
        }}
        onTouchStart={(event) => {
          if (tool !== 'select') return;
          event.cancelBubble = true;
          if (!selectable) return;
          onSelect(object.id);
        }}
        onDragEnd={(event) => {
          if (selected) {
            onMoveSelected(
              event.target.x() - object.x,
              event.target.y() - object.y,
              'shiftKey' in event.evt && event.evt.shiftKey ? 'grid' : null
            );
            event.target.position({ x: object.x, y: object.y });
          } else {
            onUpdate(object.id, { x: event.target.x(), y: event.target.y() });
          }
        }}
        onTransformEnd={() => {
          const node = groupRef.current;
          if (!node) return;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          node.scaleX(1);
          node.scaleY(1);
          onUpdate(object.id, {
            x: node.x(),
            y: node.y(),
            width: Math.max(4, width * scaleX),
            height: Math.max(4, height * scaleY),
            rotation: normalizeRotation45(node.rotation()),
            scale: 1
          });
          setTransforming(false);
        }}
      >
        {object.kind === 'light' ? (
          <Circle x={width / 2} y={height / 2} radius={object.light?.radius || Math.max(width, height)} fill={fill} opacity={(object.light?.intensity || 0.55) * 0.16} />
        ) : null}
        {image ? (
          <KonvaImage image={image} width={width} height={height} opacity={object.kind === 'zone' ? 0.75 : 1} />
        ) : (
          <Rect
            width={width}
            height={height}
            fill={fill}
            stroke={stroke}
            strokeWidth={selected ? 2 : 1}
            cornerRadius={4}
            opacity={object.kind === 'zone' ? 0.24 : 1}
            dash={object.kind === 'zone' ? [8, 5] : undefined}
          />
        )}
        {object.interactable ? <Circle x={width - 8} y={8} radius={4} fill="#f5f3ff" opacity={0.75} /> : null}
        {selected ? <Rect x={-4} y={-4} width={width + 8} height={height + 8} stroke="#c4b5fd" strokeWidth={1} dash={[4, 4]} listening={false} /> : null}
      </Group>
      {tool === 'select' && selected && canTransform && draggable ? (
        <Transformer
          ref={transformerRef}
          onMouseDown={(event) => {
            event.cancelBubble = true;
          }}
          onTouchStart={(event) => {
            event.cancelBubble = true;
          }}
          onTransformStart={() => setTransforming(true)}
          onTransformEnd={() => setTransforming(false)}
          rotateEnabled
          anchorStroke="#c4b5fd"
          anchorFill="#12091f"
          borderStroke="#c4b5fd"
          borderDash={[4, 4]}
          rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
          rotationSnapTolerance={18}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 8 || newBox.height < 8) return oldBox;
            return newBox;
          }}
        />
      ) : null}
    </>
  );
}

function TileCellView({
  assetImage,
  x,
  y,
  size,
  footprint,
  rotation,
  fill,
  stroke,
  strokeWidth,
  opacity
}: {
  assetImage?: string;
  x: number;
  y: number;
  size: number;
  footprint?: { w: number; h: number };
  rotation: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
}) {
  const image = useAssetImage(assetImage);
  const baseFootprint = footprint || { w: 1, h: 1 };
  const renderedFootprint = resolveFootprint(baseFootprint, rotation);
  const width = renderedFootprint.w * size;
  const height = renderedFootprint.h * size;
  const imageWidth = baseFootprint.w * size;
  const imageHeight = baseFootprint.h * size;
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const normalizedRotation = normalizeRotation45(rotation);
  return (
    <>
      <Group x={centerX} y={centerY} rotation={normalizedRotation} listening={false}>
        {image ? (
          <KonvaImage image={image} x={-imageWidth / 2} y={-imageHeight / 2} width={imageWidth} height={imageHeight} opacity={opacity} />
        ) : (
          <Rect x={-imageWidth / 2} y={-imageHeight / 2} width={imageWidth} height={imageHeight} fill={fill} opacity={opacity} />
        )}
      </Group>
      <Rect x={x} y={y} width={width} height={height} stroke={stroke} strokeWidth={strokeWidth} opacity={opacity * 0.8} listening={false} />
    </>
  );
}

function BrushPreview({
  map,
  tool,
  cell,
  brushSize
}: {
  map: OmniMap;
  tool: MapTool;
  cell: { x: number; y: number } | null;
  brushSize: number;
}) {
  if (!cell || (!isGridTool(tool) && tool !== 'erase')) return null;
  const offset = Math.floor(brushSize / 2);
  const x = (cell.x - offset) * map.gridSize;
  const y = (cell.y - offset) * map.gridSize;
  const size = brushSize * map.gridSize;
  const tone = tool === 'erase' ? '#fb7185' : tool === 'fog' ? '#05030a' : tool === 'collision' ? '#f59e0b' : tool === 'wall' ? '#c4b5fd' : '#8b5cf6';
  return (
    <Rect
      x={x}
      y={y}
      width={size}
      height={size}
      fill={tone}
      opacity={0.16}
      stroke={tone}
      strokeWidth={2}
      dash={[6, 4]}
      listening={false}
    />
  );
}

function PlacementPreview({
  map,
  tool,
  point,
  cell,
  assetId,
  rotation,
  snapMode
}: {
  map: OmniMap;
  tool: MapTool;
  point: { x: number; y: number } | null;
  cell: { x: number; y: number } | null;
  assetId: string;
  rotation: number;
  snapMode: SnapMode;
}) {
  const selectedAsset = getAsset(assetId, map.tilesets);
  const asset = tool === 'door' && selectedAsset?.kind !== 'door' && selectedAsset?.defaultLayer !== 'doors'
    ? getAsset('door-metal', map.tilesets)
    : selectedAsset;
  const image = useAssetImage(asset?.imageUrl);
  if (!point || !asset || (!isPlaceTool(tool) && tool !== 'door')) return null;
  const targetLayer = tool === 'door' ? 'doors' : getPlacementTargetLayer(map, asset.defaultLayer);
  const editable = isPlacementLayerEditable(map, targetLayer);
  if (tool === 'door') {
    if (!cell) return null;
    const footprint = resolveFootprint(asset.gridFootprint || { w: 1, h: 1 }, rotation);
    return (
      <Rect
        x={cell.x * map.gridSize}
        y={cell.y * map.gridSize}
        width={footprint.w * map.gridSize}
        height={footprint.h * map.gridSize}
        fill={editable ? asset.color || '#8b5cf6' : '#fb7185'}
        opacity={0.22}
        stroke={editable ? '#f5f3ff' : '#fb7185'}
        strokeWidth={2}
        dash={[5, 4]}
        listening={false}
      />
    );
  }
  const width = asset.defaultWidth || 64;
  const height = asset.defaultHeight || 64;
  const previewPoint = resolvePreviewPoint(map, point, snapMode);
  const stroke = editable ? '#f5f3ff' : '#fb7185';
  const opacity = editable ? 0.48 : 0.32;
  if (image) {
    return (
      <Group x={previewPoint.x} y={previewPoint.y} rotation={normalizeRotation45(rotation)} opacity={opacity} listening={false}>
        <KonvaImage image={image} width={width} height={height} />
        <Rect width={width} height={height} stroke={stroke} strokeWidth={2} dash={[4, 4]} />
      </Group>
    );
  }
  return <Rect x={previewPoint.x} y={previewPoint.y} width={width} height={height} rotation={normalizeRotation45(rotation)} fill={editable ? asset.color || '#8b5cf6' : '#fb7185'} opacity={0.28} stroke={stroke} dash={[4, 4]} listening={false} />;
}

function SelectionBox({ box }: { box: { x: number; y: number; width: number; height: number } }) {
  const x = Math.min(box.x, box.x + box.width);
  const y = Math.min(box.y, box.y + box.height);
  return (
    <Rect
      x={x}
      y={y}
      width={Math.abs(box.width)}
      height={Math.abs(box.height)}
      fill="#8b5cf6"
      opacity={0.1}
      stroke="#c4b5fd"
      strokeWidth={1}
      dash={[6, 4]}
      listening={false}
    />
  );
}

function SelectedTileOverlay({ map, selectedTileCells }: { map: OmniMap; selectedTileCells: SelectedTileCell[] }) {
  if (!selectedTileCells.length) return null;
  return (
    <>
      {selectedTileCells.map((cell) => {
        const tile = map.tileLayers[cell.layer]?.cells.find((entry) => entry.x === cell.x && entry.y === cell.y);
        const footprint = resolveFootprint(tile?.footprint, tile?.rotation || 0);
        return (
          <Rect
            key={`${cell.layer}-${cell.x}-${cell.y}`}
            x={cell.x * map.gridSize}
            y={cell.y * map.gridSize}
            width={footprint.w * map.gridSize}
            height={footprint.h * map.gridSize}
            fill="#8b5cf6"
            opacity={0.14}
            stroke="#ddd6fe"
            strokeWidth={2}
            dash={[4, 4]}
            listening={false}
          />
        );
      })}
    </>
  );
}

function SelectedGroupBounds({ map, selectedObjectIds, selectedTileCells }: { map: OmniMap; selectedObjectIds: string[]; selectedTileCells: SelectedTileCell[] }) {
  const boxes: Array<{ x: number; y: number; width: number; height: number }> = [];
  if (selectedObjectIds.length + selectedTileCells.length < 2) return null;
  const selected = new Set(selectedObjectIds);
  getAllObjects(map).forEach((object) => {
    if (!selected.has(object.id)) return;
    boxes.push({ x: object.x, y: object.y, width: object.width * (object.scale || 1), height: object.height * (object.scale || 1) });
  });
  selectedTileCells.forEach((cell) => {
    const tile = map.tileLayers[cell.layer]?.cells.find((entry) => entry.x === cell.x && entry.y === cell.y);
    const footprint = resolveFootprint(tile?.footprint, tile?.rotation || 0);
    boxes.push({ x: cell.x * map.gridSize, y: cell.y * map.gridSize, width: footprint.w * map.gridSize, height: footprint.h * map.gridSize });
  });
  if (!boxes.length) return null;
  const minX = Math.min(...boxes.map((box) => box.x));
  const minY = Math.min(...boxes.map((box) => box.y));
  const maxX = Math.max(...boxes.map((box) => box.x + box.width));
  const maxY = Math.max(...boxes.map((box) => box.y + box.height));
  return <Rect x={minX - 4} y={minY - 4} width={maxX - minX + 8} height={maxY - minY + 8} stroke="#c4b5fd" strokeWidth={1} dash={[8, 5]} listening={false} />;
}

function FogView({ map }: { map: OmniMap }) {
  if (!map.fogLayer.visible || map.mode === 'build') return null;
  const revealed = new Set(map.fogLayer.revealedCells.map((cell) => `${cell.x}:${cell.y}`));
  const cells: ReactNode[] = [];
  for (let y = 0; y < map.height; y += 1) {
    for (let x = 0; x < map.width; x += 1) {
      if (revealed.has(`${x}:${y}`)) continue;
      cells.push(
        <Rect
          key={`fog-${x}-${y}`}
          x={x * map.gridSize}
          y={y * map.gridSize}
          width={map.gridSize}
          height={map.gridSize}
          fill="#030108"
          opacity={map.fogLayer.opacity}
        />
      );
    }
  }
  return <>{cells}</>;
}

function TokenLayerView({
  map,
  selectedTokenId,
  onSelect,
  onMove
}: {
  map: OmniMap;
  selectedTokenId: string;
  onSelect(tokenId: string): void;
  onMove(tokenId: string, x: number, y: number): void;
}) {
  if (map.activeLayer === 'tokens' && map.mode === 'build') return null;
  return (
    <>
      {map.tokens.map((token) => (
        <TokenShape
          key={token.id}
          token={token}
          map={map}
          selected={selectedTokenId === token.id}
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
  selected,
  onSelect,
  onMove
}: {
  token: TabletopToken;
  map: OmniMap;
  selected: boolean;
  onSelect(tokenId: string): void;
  onMove(tokenId: string, x: number, y: number): void;
}) {
  const size = map.gridSize;
  const tone = token.kind === 'enemy' ? '#fb7185' : token.kind === 'character' ? '#34d399' : '#8b5cf6';
  const draggable = map.mode === 'session' && !token.locked;
  const visualSize = size * Math.max(0.5, token.size || 1);

  return (
    <Group
      name="map-token"
      x={token.x * size}
      y={token.y * size}
      draggable={draggable}
      opacity={token.hidden ? 0.45 : 1}
      onMouseDown={(event) => {
        event.cancelBubble = true;
        onSelect(token.id);
      }}
      onTouchStart={(event) => {
        event.cancelBubble = true;
        onSelect(token.id);
      }}
      onDragEnd={(event) => onMove(token.id, event.target.x() / size, event.target.y() / size)}
    >
      <Circle
        x={visualSize / 2}
        y={visualSize / 2}
        radius={visualSize * 0.42}
        fill="#16101f"
        stroke={selected ? '#f5f3ff' : token.auraColor || tone}
        strokeWidth={selected ? 3 : 2}
      />
      <Text
        x={0}
        y={visualSize / 2 - 8}
        width={visualSize}
        align="center"
        text={token.name.slice(0, 1).toUpperCase()}
        fill="#f5f3ff"
        fontStyle="bold"
        fontSize={Math.max(12, visualSize * 0.42)}
      />
      <Text
        x={-visualSize * 0.5}
        y={visualSize + 2}
        width={visualSize * 2}
        align="center"
        text={token.status ? `${token.name} - ${token.status}` : token.name}
        fill="#ddd6fe"
        fontSize={10}
      />
    </Group>
  );
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

function Grid({ map }: { map: OmniMap }) {
  const lines = [];
  for (let x = 0; x <= map.width; x += 1) {
    lines.push(<Line key={`gx-${x}`} points={[x * map.gridSize, 0, x * map.gridSize, map.height * map.gridSize]} stroke={GRID_LINE} strokeWidth={1} />);
  }
  for (let y = 0; y <= map.height; y += 1) {
    lines.push(<Line key={`gy-${y}`} points={[0, y * map.gridSize, map.width * map.gridSize, y * map.gridSize]} stroke={GRID_LINE} strokeWidth={1} />);
  }
  return <>{lines}</>;
}

function getStagePointer(stage: Konva.Stage | null) {
  const pointer = stage?.getPointerPosition();
  if (!pointer) return null;
  return { x: pointer.x, y: pointer.y };
}

function screenToWorld(pointer: { x: number; y: number }, camera: { x: number; y: number }, zoom: number) {
  return {
    x: (pointer.x - camera.x) / zoom,
    y: (pointer.y - camera.y) / zoom
  };
}

function pointerToCell(pointer: { x: number; y: number }, map: OmniMap) {
  const x = Math.floor(pointer.x / map.gridSize);
  const y = Math.floor(pointer.y / map.gridSize);
  if (x < 0 || y < 0 || x >= map.width || y >= map.height) return null;
  return { x, y };
}

function isGridTool(tool: MapTool) {
  return tool === 'brush' || tool === 'wall' || tool === 'collision' || tool === 'fog';
}

function isPlaceTool(tool: MapTool) {
  return tool === 'object' || tool === 'cover' || tool === 'terminal' || tool === 'light' || tool === 'zone' || tool === 'note';
}

function isLayerVisible(layer: MapLayerKey, soloLayer: MapLayerKey | null) {
  return !soloLayer || soloLayer === layer;
}

function getPaintLayer(tool: MapTool, activeLayer: MapLayerKey): MapLayerKey {
  if (tool === 'brush') return 'floor';
  if (tool === 'wall') return 'walls';
  if (tool === 'collision') return 'collision';
  if (tool === 'fog') return 'fog';
  return activeLayer;
}

function resolvePreviewPoint(map: OmniMap, point: { x: number; y: number }, snapMode: SnapMode) {
  if (snapMode === 'grid') {
    return {
      x: Math.round(point.x / map.gridSize) * map.gridSize,
      y: Math.round(point.y / map.gridSize) * map.gridSize
    };
  }
  if (snapMode === 'fine') {
    return {
      x: Math.round(point.x / 4) * 4,
      y: Math.round(point.y / 4) * 4
    };
  }
  return point;
}

function isPlacementLayerEditable(map: OmniMap, layer: MapLayerKey) {
  if (layer === 'floor' || layer === 'walls' || layer === 'doors' || layer === 'collision') {
    const target = map.tileLayers[layer];
    return target.visible && !target.locked && target.editable !== false;
  }
  if (layer === 'fog') return map.fogLayer.visible && !map.fogLayer.locked && map.fogLayer.editable !== false;
  const objectLayer = getObjectLayerState(map, layer);
  return Boolean(objectLayer?.visible && !objectLayer.locked && objectLayer.editable !== false);
}

function getObjectLayerState(map: OmniMap, layer: MapLayerKey): ObjectLayer | null {
  if (layer === 'objects') return map.objectLayer;
  if (layer === 'decoration') return map.decorationLayer;
  if (layer === 'details') return map.detailLayer;
  if (layer === 'lighting') return map.lightingLayer;
  if (layer === 'mechanics') return map.mechanicalLayer;
  if (layer === 'notes') return map.notesLayer;
  return null;
}

function getPlacementTargetLayer(map: OmniMap, assetLayer: MapLayerKey): MapLayerKey {
  const objectLayers: MapLayerKey[] = ['decoration', 'objects', 'details', 'lighting', 'mechanics', 'notes'];
  if (objectLayers.includes(map.activeLayer)) return map.activeLayer;
  return assetLayer;
}

function getBrushCells(x: number, y: number, brushSize: number) {
  const offset = Math.floor(brushSize / 2);
  const cells: Array<{ x: number; y: number }> = [];
  for (let dy = 0; dy < brushSize; dy += 1) {
    for (let dx = 0; dx < brushSize; dx += 1) {
      cells.push({ x: x + dx - offset, y: y + dy - offset });
    }
  }
  return cells;
}

function getAxisLockedLineCells(start: { x: number; y: number }, end: { x: number; y: number }) {
  const horizontal = Math.abs(end.x - start.x) >= Math.abs(end.y - start.y);
  const cells: Array<{ x: number; y: number }> = [];
  if (horizontal) {
    const min = Math.min(start.x, end.x);
    const max = Math.max(start.x, end.x);
    for (let x = min; x <= max; x += 1) cells.push({ x, y: start.y });
  } else {
    const min = Math.min(start.y, end.y);
    const max = Math.max(start.y, end.y);
    for (let y = min; y <= max; y += 1) cells.push({ x: start.x, y });
  }
  return cells;
}

function isEmptySelectionTarget(node: Konva.Node) {
  return !isTransformerTarget(node) && !hasNamedAncestor(node, 'map-object') && !hasNamedAncestor(node, 'map-token');
}

function getEventButton(event: MouseEvent | TouchEvent | PointerEvent) {
  return 'button' in event ? event.button : 0;
}

function isAdditiveEvent(event: MouseEvent | TouchEvent | PointerEvent) {
  return 'shiftKey' in event && event.shiftKey;
}

function capturePointer(event: KonvaEventObject<MouseEvent | TouchEvent | PointerEvent>) {
  if (!('pointerId' in event.evt)) return;
  const container = event.target.getStage()?.container();
  if (!container?.setPointerCapture) return;
  try {
    container.setPointerCapture(event.evt.pointerId);
  } catch {
    // Pointer capture can already be released by the browser.
  }
}

function releasePointer(event: KonvaEventObject<MouseEvent | TouchEvent | PointerEvent>) {
  if (!('pointerId' in event.evt)) return;
  const container = event.target.getStage()?.container();
  if (!container?.releasePointerCapture) return;
  try {
    container.releasePointerCapture(event.evt.pointerId);
  } catch {
    // Best-effort cleanup.
  }
}

function getObjectIdFromTarget(node: Konva.Node) {
  let current: Konva.Node | null = node;
  while (current) {
    if (current.name() === 'map-object') return current.id() || undefined;
    current = current.getParent();
  }
  return undefined;
}

function isTransformerTarget(node: Konva.Node) {
  let current: Konva.Node | null = node;
  while (current) {
    if (current.getClassName() === 'Transformer') return true;
    current = current.getParent();
  }
  return false;
}

function hasNamedAncestor(node: Konva.Node, name: string) {
  let current: Konva.Node | null = node;
  while (current) {
    if (current.name() === name) return true;
    current = current.getParent();
  }
  return false;
}

function isEditableTarget(target: EventTarget | null) {
  const element = target as HTMLElement | null;
  if (!element) return false;
  const tag = element.tagName?.toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select' || element.isContentEditable;
}

function normalizeRotation45(value: number) {
  const snapped = Math.round(value / 45) * 45;
  const normalized = snapped % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

function resolveFootprint(footprint: { w: number; h: number } | undefined, rotation = 0) {
  const base = footprint || { w: 1, h: 1 };
  const normalized = normalizeRotation45(rotation);
  return normalized === 90 || normalized === 270 ? { w: base.h, h: base.w } : base;
}

function getAllObjects(map: OmniMap) {
  return [map.decorationLayer, map.objectLayer, map.detailLayer, map.lightingLayer, map.mechanicalLayer, map.notesLayer]
    .flatMap((layer) => layer.objects);
}
