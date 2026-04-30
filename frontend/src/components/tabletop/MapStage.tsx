import { Circle, Group, Layer, Line, Rect, Stage, Text } from 'react-konva';
import type Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { ReactNode } from 'react';
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
  const selectedTokenId = useTabletopStore((state) => state.selectedTokenId);
  const paintCell = useTabletopStore((state) => state.paintCell);
  const eraseAt = useTabletopStore((state) => state.eraseAt);
  const addObject = useTabletopStore((state) => state.addObject);
  const updateObject = useTabletopStore((state) => state.updateObject);
  const selectObject = useTabletopStore((state) => state.selectObject);
  const moveToken = useTabletopStore((state) => state.moveToken);
  const selectToken = useTabletopStore((state) => state.selectToken);
  const revealFogCell = useTabletopStore((state) => state.revealFogCell);
  const hideFogCell = useTabletopStore((state) => state.hideFogCell);

  const stageWidth = map.width * map.gridSize * zoom;
  const stageHeight = map.height * map.gridSize * zoom;

  function handleStagePointer(event: KonvaEventObject<MouseEvent | TouchEvent>) {
    const cell = getPointerCell(event.target.getStage(), map, zoom);
    if (!cell) return;

    if (map.mode === 'build') {
      if (tool === 'brush') paintCell(cell.x, cell.y, 'floor', selectedAssetId);
      if (tool === 'wall') paintCell(cell.x, cell.y, 'walls', selectedAssetId);
      if (tool === 'erase') eraseAt(cell.x, cell.y);
      if (['object', 'door', 'cover', 'terminal', 'light', 'zone', 'note'].includes(tool)) addObject(selectedAssetId, cell.x, cell.y);
      if (tool === 'fog') revealFogCell(cell.x, cell.y);
      return;
    }

    if (tool === 'fog') {
      const hidden = map.fogLayer.revealedCells.some((entry) => entry.x === cell.x && entry.y === cell.y);
      if (hidden) hideFogCell(cell.x, cell.y);
      else revealFogCell(cell.x, cell.y);
    }
  }

  return (
    <div className="min-h-[560px] overflow-auto rounded-lg border border-line bg-black/40">
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
          <ObjectLayerView layer={map.decorationLayer} map={map} selectedObjectId={selectedObjectId} onSelect={selectObject} onUpdate={updateObject} />
          <ObjectLayerView layer={map.objectLayer} map={map} selectedObjectId={selectedObjectId} onSelect={selectObject} onUpdate={updateObject} />
          <ObjectLayerView layer={map.lightingLayer} map={map} selectedObjectId={selectedObjectId} onSelect={selectObject} onUpdate={updateObject} />
          <TileLayerView layer={map.tileLayers.collision} map={map} collision />
          <FogView map={map} />
          <ObjectLayerView layer={map.notesLayer} map={map} selectedObjectId={selectedObjectId} onSelect={selectObject} onUpdate={updateObject} />
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
          <Rect
            key={`${layer.key}-${cell.x}-${cell.y}`}
            x={cell.x * size}
            y={cell.y * size}
            width={size}
            height={size}
            fill={collision ? 'rgba(251,113,133,0.22)' : asset?.color || '#2a2035'}
            stroke={wall || collision ? asset?.stroke || '#a78bfa' : asset?.stroke || 'rgba(255,255,255,0.08)'}
            strokeWidth={wall ? 3 : 1}
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
  selectedObjectId,
  onSelect,
  onUpdate
}: {
  layer: ObjectLayer;
  map: OmniMap;
  selectedObjectId: string;
  onSelect(objectId: string): void;
  onUpdate(objectId: string, patch: Partial<MapObject>): void;
}) {
  if (!layer.visible) return null;
  return (
    <>
      {layer.objects.map((object) => (
        <MapObjectShape
          key={object.id}
          map={map}
          object={object}
          selected={selectedObjectId === object.id}
          draggable={!layer.locked && !object.locked && map.mode === 'build'}
          opacity={layer.opacity}
          onSelect={onSelect}
          onUpdate={onUpdate}
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
  opacity,
  onSelect,
  onUpdate
}: {
  map: OmniMap;
  object: MapObject;
  selected: boolean;
  draggable: boolean;
  opacity: number;
  onSelect(objectId: string): void;
  onUpdate(objectId: string, patch: Partial<MapObject>): void;
}) {
  const asset = getAsset(object.assetId, map.tilesets);
  const size = map.gridSize;
  const width = object.width * size;
  const height = object.height * size;
  const fill = object.color || asset?.color || '#2d2437';
  const stroke = selected ? '#f5f3ff' : asset?.stroke || '#8b5cf6';
  const icon = asset?.icon || object.name.slice(0, 1).toUpperCase();

  return (
    <Group
      x={object.x * size}
      y={object.y * size}
      rotation={object.rotation}
      draggable={draggable}
      opacity={opacity}
      onMouseDown={(event) => {
        event.cancelBubble = true;
        onSelect(object.id);
      }}
      onTouchStart={(event) => {
        event.cancelBubble = true;
        onSelect(object.id);
      }}
      onDragEnd={(event) => {
        onUpdate(object.id, {
          x: roundToQuarter(event.target.x() / size),
          y: roundToQuarter(event.target.y() / size)
        });
      }}
    >
      {object.kind === 'light' ? (
        <>
          <Circle x={width / 2} y={height / 2} radius={(object.light?.radius || 5) * size} fill={fill} opacity={0.14} />
          <Circle x={width / 2} y={height / 2} radius={Math.max(8, size * 0.42)} fill={fill} stroke={stroke} strokeWidth={2} />
        </>
      ) : object.kind === 'zone' ? (
        <Rect width={width} height={height} fill={fill} opacity={0.22} stroke={stroke} strokeWidth={2} dash={[8, 5]} />
      ) : (
        <Rect width={width} height={height} fill={fill} stroke={stroke} strokeWidth={selected ? 3 : 2} cornerRadius={4} />
      )}
      <Text
        x={0}
        y={Math.max(0, height / 2 - 8)}
        width={width}
        align="center"
        text={icon}
        fill="#f5f3ff"
        fontStyle="bold"
        fontSize={Math.max(12, Math.min(18, size * 0.48))}
      />
      {selected ? <Rect x={-4} y={-4} width={width + 8} height={height + 8} stroke="#c4b5fd" strokeWidth={1} dash={[4, 4]} /> : null}
    </Group>
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

function getPointerCell(stage: Konva.Stage | null, map: OmniMap, zoom: number) {
  const pointer = stage?.getPointerPosition();
  if (!pointer) return null;
  const x = Math.floor(pointer.x / zoom / map.gridSize);
  const y = Math.floor(pointer.y / zoom / map.gridSize);
  if (x < 0 || y < 0 || x >= map.width || y >= map.height) return null;
  return { x, y };
}

function roundToQuarter(value: number) {
  return Math.round(value * 4) / 4;
}
