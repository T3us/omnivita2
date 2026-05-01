import { Circle, Group, Image as KonvaImage, Layer, Line, Rect, Stage, Text, Transformer } from 'react-konva';
import type Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { getAsset } from './assets';
import { useTabletopStore } from './mapStore';
import type { MapObject, ObjectLayer, OmniMap, TabletopToken, TileLayer } from './types';

const GRID_LINE = 'rgba(196,181,253,0.13)';

export function MapStage() {
  const map = useTabletopStore((state) => state.map);
  const tool = useTabletopStore((state) => state.tool);
  const zoom = useTabletopStore((state) => state.zoom);
  const selectedAssetId = useTabletopStore((state) => state.selectedAssetId);
  const selectedObjectId = useTabletopStore((state) => state.selectedObjectId);
  const selectedObjectIds = useTabletopStore((state) => state.selectedObjectIds);
  const selectedTokenId = useTabletopStore((state) => state.selectedTokenId);
  const paintCell = useTabletopStore((state) => state.paintCell);
  const eraseAt = useTabletopStore((state) => state.eraseAt);
  const addObject = useTabletopStore((state) => state.addObject);
  const updateObject = useTabletopStore((state) => state.updateObject);
  const selectObject = useTabletopStore((state) => state.selectObject);
  const moveSelectedObjects = useTabletopStore((state) => state.moveSelectedObjects);
  const moveToken = useTabletopStore((state) => state.moveToken);
  const selectToken = useTabletopStore((state) => state.selectToken);
  const revealFogCell = useTabletopStore((state) => state.revealFogCell);
  const hideFogCell = useTabletopStore((state) => state.hideFogCell);
  const viewportRef = useRef<HTMLDivElement>(null);

  const stageWidth = map.width * map.gridSize * zoom;
  const stageHeight = map.height * map.gridSize * zoom;

  function handleStagePointer(event: KonvaEventObject<MouseEvent | TouchEvent>) {
    const pointer = getPointer(event.target.getStage(), zoom);
    if (!pointer) return;
    const cell = pointerToCell(pointer, map);

    if (map.mode === 'build') {
      if (tool === 'brush' && cell) paintCell(cell.x, cell.y, 'floor', selectedAssetId);
      if (tool === 'wall' && cell) paintCell(cell.x, cell.y, 'walls', selectedAssetId);
      if (tool === 'erase') eraseAt(pointer.x, pointer.y);
      if (['object', 'door', 'cover', 'terminal', 'light', 'zone', 'note'].includes(tool)) addObject(selectedAssetId, pointer.x, pointer.y, selectedObjectId);
      if (tool === 'fog' && cell) revealFogCell(cell.x, cell.y);
      return;
    }

    if (tool === 'fog' && cell) {
      const hidden = map.fogLayer.revealedCells.some((entry) => entry.x === cell.x && entry.y === cell.y);
      if (hidden) hideFogCell(cell.x, cell.y);
      else revealFogCell(cell.x, cell.y);
    }
  }

  return (
    <div
      ref={viewportRef}
      className="min-h-[560px] overflow-auto rounded-lg border border-line bg-black/40"
      onDragOver={(event) => {
        if (map.mode === 'build') event.preventDefault();
      }}
      onDrop={(event) => {
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
          paintCell(cell.x, cell.y, asset.defaultLayer, assetId);
          return;
        }
        addObject(assetId, x, y, selectedObjectId);
      }}
    >
      <Stage
        width={stageWidth}
        height={stageHeight}
        onMouseDown={handleStagePointer}
        onTouchStart={handleStagePointer}
      >
        <Layer scaleX={zoom} scaleY={zoom}>
          <MapBackground map={map} />
          <TileLayerView layer={map.tileLayers.floor} map={map} />
          <TileLayerView layer={map.tileLayers.walls} map={map} wall />
          <ObjectLayerView layer={map.decorationLayer} map={map} selectedObjectIds={selectedObjectIds} onSelect={selectObject} onUpdate={updateObject} onMoveSelected={moveSelectedObjects} />
          <ObjectLayerView layer={map.objectLayer} map={map} selectedObjectIds={selectedObjectIds} onSelect={selectObject} onUpdate={updateObject} onMoveSelected={moveSelectedObjects} />
          <ObjectLayerView layer={map.detailLayer} map={map} selectedObjectIds={selectedObjectIds} onSelect={selectObject} onUpdate={updateObject} onMoveSelected={moveSelectedObjects} />
          <ObjectLayerView layer={map.lightingLayer} map={map} selectedObjectIds={selectedObjectIds} onSelect={selectObject} onUpdate={updateObject} onMoveSelected={moveSelectedObjects} />
          <ObjectLayerView layer={map.mechanicalLayer} map={map} selectedObjectIds={selectedObjectIds} onSelect={selectObject} onUpdate={updateObject} onMoveSelected={moveSelectedObjects} />
          <TileLayerView layer={map.tileLayers.collision} map={map} collision />
          <FogView map={map} />
          <ObjectLayerView layer={map.notesLayer} map={map} selectedObjectIds={selectedObjectIds} onSelect={selectObject} onUpdate={updateObject} onMoveSelected={moveSelectedObjects} />
          <TokenLayerView
            map={map}
            selectedTokenId={selectedTokenId}
            onSelect={selectToken}
            onMove={moveToken}
          />
          <Grid map={map} />
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
  selectedObjectIds,
  onSelect,
  onUpdate,
  onMoveSelected
}: {
  layer: ObjectLayer;
  map: OmniMap;
  selectedObjectIds: string[];
  onSelect(objectId: string, additive?: boolean): void;
  onUpdate(objectId: string, patch: Partial<MapObject>): void;
  onMoveSelected(deltaX: number, deltaY: number): void;
}) {
  if (!layer.visible) return null;
  return (
    <>
      {[...layer.objects].sort((left, right) => left.zIndex - right.zIndex).map((object) => (
        <MapObjectShape
          key={object.id}
          map={map}
          object={object}
          selected={selectedObjectIds.includes(object.id)}
          draggable={!layer.locked && !object.locked && map.mode === 'build'}
          canTransform={selectedObjectIds.length === 1}
          opacity={layer.opacity}
          onSelect={onSelect}
          onUpdate={onUpdate}
          onMoveSelected={onMoveSelected}
        />
      ))}
    </>
  );
}

function MapObjectShape({
  map,
  object,
  selected,
  draggable,
  canTransform,
  opacity,
  onSelect,
  onUpdate,
  onMoveSelected
}: {
  map: OmniMap;
  object: MapObject;
  selected: boolean;
  draggable: boolean;
  canTransform: boolean;
  opacity: number;
  onSelect(objectId: string, additive?: boolean): void;
  onUpdate(objectId: string, patch: Partial<MapObject>): void;
  onMoveSelected(deltaX: number, deltaY: number): void;
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
    if (!selected || !canTransform || !transformerRef.current || !groupRef.current) return;
    transformerRef.current.nodes([groupRef.current]);
    transformerRef.current.getLayer()?.batchDraw();
  }, [selected, canTransform]);

  return (
    <>
      <Group
        ref={groupRef}
        x={object.x}
        y={object.y}
        rotation={object.rotation}
        draggable={draggable}
        opacity={opacity * object.opacity}
        onMouseDown={(event) => {
          event.cancelBubble = true;
          onSelect(object.id, Boolean('shiftKey' in event.evt && event.evt.shiftKey));
        }}
        onTouchStart={(event) => {
          event.cancelBubble = true;
          onSelect(object.id);
        }}
        onDragEnd={(event) => {
          if (selected) {
            onMoveSelected(event.target.x() - object.x, event.target.y() - object.y);
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
      {selected && canTransform && draggable ? (
        <Transformer
          ref={transformerRef}
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
