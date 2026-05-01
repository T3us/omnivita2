import { Circle, Group, Image as KonvaImage, Layer, Line, Rect, Stage, Text, Transformer } from 'react-konva';
import type Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { DragEvent, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { getAsset } from './assets';
import { useTabletopStore } from './mapStore';
import type { MapLayerKey, MapObject, MapTool, ObjectLayer, OmniMap, SnapMode, TabletopToken, TileLayer } from './types';

const GRID_LINE = 'rgba(196,181,253,0.13)';

export function MapStage() {
  const map = useTabletopStore((state) => state.map);
  const tool = useTabletopStore((state) => state.tool);
  const zoom = useTabletopStore((state) => state.zoom);
  const selectedAssetId = useTabletopStore((state) => state.selectedAssetId);
  const selectedObjectIds = useTabletopStore((state) => state.selectedObjectIds);
  const selectedTokenId = useTabletopStore((state) => state.selectedTokenId);
  const brushSize = useTabletopStore((state) => state.brushSize);
  const showGrid = useTabletopStore((state) => state.showGrid);
  const isTransforming = useTabletopStore((state) => state.isTransforming);
  const soloLayer = useTabletopStore((state) => state.soloLayer);
  const paintBrush = useTabletopStore((state) => state.paintBrush);
  const eraseBrush = useTabletopStore((state) => state.eraseBrush);
  const eraseBrushAtPoint = useTabletopStore((state) => state.eraseBrushAtPoint);
  const addObject = useTabletopStore((state) => state.addObject);
  const updateObject = useTabletopStore((state) => state.updateObject);
  const selectObject = useTabletopStore((state) => state.selectObject);
  const selectObjectsInRect = useTabletopStore((state) => state.selectObjectsInRect);
  const clearObjectSelection = useTabletopStore((state) => state.clearObjectSelection);
  const moveSelectedObjects = useTabletopStore((state) => state.moveSelectedObjects);
  const moveToken = useTabletopStore((state) => state.moveToken);
  const selectToken = useTabletopStore((state) => state.selectToken);
  const captureHistory = useTabletopStore((state) => state.captureHistory);
  const setTransforming = useTabletopStore((state) => state.setTransforming);
  const viewportRef = useRef<HTMLDivElement>(null);
  const paintingRef = useRef(false);
  const selectionStartRef = useRef<{ x: number; y: number } | null>(null);
  const wallLineModeRef = useRef(false);
  const strokeStartRef = useRef<{ x: number; y: number } | null>(null);
  const strokeCellsRef = useRef(new Set<string>());
  const [hoverCell, setHoverCell] = useState<{ x: number; y: number } | null>(null);
  const [hoverPoint, setHoverPoint] = useState<{ x: number; y: number } | null>(null);
  const [selectionBox, setSelectionBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  const stageWidth = map.width * map.gridSize * zoom;
  const stageHeight = map.height * map.gridSize * zoom;

  function handlePointerDown(event: KonvaEventObject<MouseEvent | TouchEvent>) {
    if (isTransforming || isTransformerTarget(event.target)) return;
    const pointer = getPointer(event.target.getStage(), zoom);
    if (!pointer) return;
    const cell = pointerToCell(pointer, map);
    setHoverPoint(pointer);
    setHoverCell(cell);

    if (map.mode !== 'build') return;

    if (tool === 'select') {
      if (isEmptySelectionTarget(event.target)) {
        if (!('shiftKey' in event.evt && event.evt.shiftKey)) clearObjectSelection();
        selectionStartRef.current = pointer;
        setSelectionBox({ x: pointer.x, y: pointer.y, width: 0, height: 0 });
      }
      return;
    }

    if (isGridTool(tool) && cell) {
      captureHistory();
      paintingRef.current = true;
      strokeStartRef.current = cell;
      wallLineModeRef.current = tool === 'wall' && Boolean('shiftKey' in event.evt && event.evt.shiftKey);
      strokeCellsRef.current = new Set();
      paintStrokeCell(cell, pointer);
      return;
    }

    if (isPlaceTool(tool)) {
      const parentId = 'altKey' in event.evt && event.evt.altKey ? getObjectIdFromTarget(event.target) : undefined;
      addObject(selectedAssetId, pointer.x, pointer.y, parentId);
    }
  }

  function handlePointerMove(event: KonvaEventObject<MouseEvent | TouchEvent>) {
    if (isTransforming) return;
    const pointer = getPointer(event.target.getStage(), zoom);
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

  function handlePointerUp(event: KonvaEventObject<MouseEvent | TouchEvent>) {
    if (tool === 'select' && selectionStartRef.current && selectionBox) {
      const isTiny = Math.abs(selectionBox.width) < 4 && Math.abs(selectionBox.height) < 4;
      if (!isTiny) {
        selectObjectsInRect(selectionBox, Boolean('shiftKey' in event.evt && event.evt.shiftKey));
      }
    }
    selectionStartRef.current = null;
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
    const x = (event.clientX - rect.left + viewportRef.current.scrollLeft) / zoom;
    const y = (event.clientY - rect.top + viewportRef.current.scrollTop) / zoom;
    const asset = getAsset(assetId, map.tilesets);
    const cell = pointerToCell({ x, y }, map);
    if ((asset?.defaultLayer === 'floor' || asset?.defaultLayer === 'walls') && cell) {
      captureHistory();
      paintBrush(cell.x, cell.y, asset.defaultLayer, assetId, brushSize);
      return;
    }
    addObject(assetId, x, y, undefined);
  }

  return (
    <div
      ref={viewportRef}
      className="min-h-[560px] overflow-auto rounded-lg border border-line bg-black/40"
      onDragOver={(event) => {
        if (map.mode === 'build') event.preventDefault();
      }}
      onDrop={handleDrop}
    >
      <Stage
        width={stageWidth}
        height={stageHeight}
        onMouseDown={handlePointerDown}
        onTouchStart={handlePointerDown}
        onMouseMove={handlePointerMove}
        onTouchMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onTouchEnd={handlePointerUp}
        onMouseLeave={handlePointerUp}
      >
        <Layer scaleX={zoom} scaleY={zoom}>
          <MapBackground map={map} />
          {isLayerVisible('floor', soloLayer) ? <TileLayerView layer={map.tileLayers.floor} map={map} /> : null}
          {isLayerVisible('walls', soloLayer) ? <TileLayerView layer={map.tileLayers.walls} map={map} wall /> : null}
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
          <BrushPreview map={map} tool={tool} cell={hoverCell} brushSize={brushSize} />
          <PlacementPreview map={map} tool={tool} point={hoverPoint} assetId={selectedAssetId} />
          {selectionBox ? <SelectionBox box={selectionBox} /> : null}
        </Layer>
      </Stage>
    </div>
  );
}

function MapBackground({ map }: { map: OmniMap }) {
  return (
    <Rect
      x={0}
      y={0}
      width={map.width * map.gridSize}
      height={map.height * map.gridSize}
      fill="#08040f"
    />
  );
}

function TileLayerView({ layer, map, wall = false, collision = false }: { layer: TileLayer; map: OmniMap; wall?: boolean; collision?: boolean }) {
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
            fill={collision ? 'rgba(251,113,133,0.22)' : asset?.color || '#2a2035'}
            stroke={wall || collision ? asset?.stroke || '#a78bfa' : asset?.stroke || 'rgba(255,255,255,0.08)'}
            strokeWidth={wall ? 2 : 1}
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
            rotation: node.rotation(),
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
  fill,
  stroke,
  strokeWidth,
  opacity
}: {
  assetImage?: string;
  x: number;
  y: number;
  size: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
}) {
  const image = useAssetImage(assetImage);
  return (
    <>
      {image ? (
        <KonvaImage image={image} x={x} y={y} width={size} height={size} opacity={opacity} />
      ) : (
        <Rect x={x} y={y} width={size} height={size} fill={fill} opacity={opacity} />
      )}
      <Rect x={x} y={y} width={size} height={size} stroke={stroke} strokeWidth={strokeWidth} opacity={opacity * 0.8} listening={false} />
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
  if (!cell || !isGridTool(tool)) return null;
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
  assetId
}: {
  map: OmniMap;
  tool: MapTool;
  point: { x: number; y: number } | null;
  assetId: string;
}) {
  const asset = getAsset(assetId, map.tilesets);
  const image = useAssetImage(asset?.imageUrl);
  if (!point || !asset || !isPlaceTool(tool)) return null;
  const width = asset.defaultWidth || 64;
  const height = asset.defaultHeight || 64;
  if (image) {
    return <KonvaImage image={image} x={point.x} y={point.y} width={width} height={height} opacity={0.42} listening={false} />;
  }
  return <Rect x={point.x} y={point.y} width={width} height={height} fill={asset.color || '#8b5cf6'} opacity={0.28} stroke="#f5f3ff" dash={[4, 4]} listening={false} />;
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

  return (
    <Group
      x={token.x * size}
      y={token.y * size}
      draggable={draggable}
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
        x={size / 2}
        y={size / 2}
        radius={size * 0.42}
        fill="#16101f"
        stroke={selected ? '#f5f3ff' : tone}
        strokeWidth={selected ? 3 : 2}
      />
      <Text
        x={0}
        y={size / 2 - 8}
        width={size}
        align="center"
        text={token.name.slice(0, 1).toUpperCase()}
        fill="#f5f3ff"
        fontStyle="bold"
        fontSize={Math.max(12, size * 0.42)}
      />
      <Text
        x={-size * 0.5}
        y={size + 2}
        width={size * 2}
        align="center"
        text={token.name}
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

function getPointer(stage: Konva.Stage | null, zoom: number) {
  const pointer = stage?.getPointerPosition();
  if (!pointer) return null;
  return { x: pointer.x / zoom, y: pointer.y / zoom };
}

function pointerToCell(pointer: { x: number; y: number }, map: OmniMap) {
  const x = Math.floor(pointer.x / map.gridSize);
  const y = Math.floor(pointer.y / map.gridSize);
  if (x < 0 || y < 0 || x >= map.width || y >= map.height) return null;
  return { x, y };
}

function isGridTool(tool: MapTool) {
  return tool === 'brush' || tool === 'wall' || tool === 'collision' || tool === 'fog' || tool === 'erase';
}

function isPlaceTool(tool: MapTool) {
  return tool === 'object' || tool === 'door' || tool === 'cover' || tool === 'terminal' || tool === 'light' || tool === 'zone' || tool === 'note';
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
  return !isTransformerTarget(node) && !hasNamedAncestor(node, 'map-object');
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
