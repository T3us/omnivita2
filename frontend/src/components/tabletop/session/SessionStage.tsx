import type Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Circle, Group, Image as KonvaImage, Layer, Line, Rect, Stage, Text } from 'react-konva';
import { getAsset } from '../assets';
import { useTabletopStore } from '../mapStore';
import type { MapLayerKey, MapObject, MapTool, ObjectLayer, OmniMap, TabletopToken, TileCell, TileLayer } from '../types';

const GRID_LINE = 'rgba(196,181,253,0.14)';
const VISION_BLOCKERS: Array<'walls' | 'doors'> = ['walls', 'doors'];

export function SessionStage() {
  const map = useTabletopStore((state) => state.map);
  const tool = useTabletopStore((state) => state.tool);
  const zoom = useTabletopStore((state) => state.zoom);
  const showGrid = useTabletopStore((state) => state.showGrid);
  const selectedObjectIds = useTabletopStore((state) => state.selectedObjectIds);
  const selectedTokenIds = useTabletopStore((state) => state.selectedTokenIds);
  const selectedTileCells = useTabletopStore((state) => state.selectedTileCells);
  const sessionViewMode = useTabletopStore((state) => state.sessionViewMode);
  const sessionDynamicVision = useTabletopStore((state) => state.sessionDynamicVision);
  const sessionFogEnabled = useTabletopStore((state) => state.sessionFogEnabled);
  const sessionGlobalDarkness = useTabletopStore((state) => state.sessionGlobalDarkness);
  const selectedAssetId = useTabletopStore((state) => state.selectedAssetId);
  const placementRotation = useTabletopStore((state) => state.placementRotation);
  const selectToken = useTabletopStore((state) => state.selectToken);
  const selectObject = useTabletopStore((state) => state.selectObject);
  const selectSessionArea = useTabletopStore((state) => state.selectSessionArea);
  const clearSessionSelection = useTabletopStore((state) => state.clearSessionSelection);
  const moveToken = useTabletopStore((state) => state.moveToken);
  const moveSelectedTokens = useTabletopStore((state) => state.moveSelectedTokens);
  const addObject = useTabletopStore((state) => state.addObject);
  const revealFogCell = useTabletopStore((state) => state.revealFogCell);
  const hideFogCell = useTabletopStore((state) => state.hideFogCell);
  const toggleDoorAt = useTabletopStore((state) => state.toggleDoorAt);
  const captureHistory = useTabletopStore((state) => state.captureHistory);

  const viewportRef = useRef<HTMLDivElement>(null);
  const selectionStartRef = useRef<{ x: number; y: number } | null>(null);
  const fogStrokeRef = useRef(false);
  const fogCellsRef = useRef(new Set<string>());
  const [selectionBox, setSelectionBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [ruler, setRuler] = useState<{ start: { x: number; y: number }; end: { x: number; y: number } } | null>(null);
  const [pings, setPings] = useState<Array<{ id: string; x: number; y: number; createdAt: number }>>([]);
  const [hoverCell, setHoverCell] = useState<{ x: number; y: number } | null>(null);

  const visibleCells = useMemo(
    () => sessionDynamicVision ? computeVisibleCells(map, sessionViewMode) : new Set<string>(),
    [map, sessionDynamicVision, sessionViewMode]
  );

  const stageWidth = map.width * map.gridSize * zoom;
  const stageHeight = map.height * map.gridSize * zoom;
  const selectedTokenSet = useMemo(() => new Set(selectedTokenIds), [selectedTokenIds]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isEditableTarget(event.target)) return;
      const key = event.key.toLowerCase();
      if (event.key === 'Escape') {
        event.preventDefault();
        clearSessionSelection();
        return;
      }
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        useTabletopStore.getState().removeSelectedTokens();
        useTabletopStore.getState().removeSelectedObjects();
        return;
      }
      if (event.key.startsWith('Arrow') && selectedTokenIds.length) {
        event.preventDefault();
        const step = event.shiftKey ? Math.max(1, Math.round(map.gridSize / map.gridSize)) : 1;
        const delta = arrowDelta(event.key, step);
        moveSelectedTokens(delta.x, delta.y);
        return;
      }
      const toolByKey: Partial<Record<string, MapTool>> = {
        v: 'select',
        t: 'token',
        m: 'measure',
        p: 'ping',
        f: 'fog',
        d: 'door',
        l: 'light',
        n: 'note'
      };
      if (toolByKey[key]) {
        event.preventDefault();
        useTabletopStore.getState().setTool(toolByKey[key]);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [clearSessionSelection, map.gridSize, moveSelectedTokens, selectedTokenIds.length]);

  function handlePointerDown(event: KonvaEventObject<MouseEvent | TouchEvent>) {
    const pointer = getPointer(event.target.getStage(), zoom);
    if (!pointer) return;
    const cell = pointerToCell(pointer, map);
    setHoverCell(cell);

    if (tool === 'select') {
      if (!isStageTarget(event.target)) return;
      if (!('shiftKey' in event.evt && event.evt.shiftKey)) clearSessionSelection();
      selectionStartRef.current = pointer;
      setSelectionBox({ x: pointer.x, y: pointer.y, width: 0, height: 0 });
      return;
    }

    if (tool === 'fog') {
      if (!cell) return;
      captureHistory();
      fogStrokeRef.current = true;
      fogCellsRef.current = new Set();
      paintFogCell(cell, Boolean('shiftKey' in event.evt && event.evt.shiftKey));
      return;
    }

    if (tool === 'measure') {
      setRuler({ start: pointer, end: pointer });
      return;
    }

    if (tool === 'ping') {
      addPing(pointer);
      return;
    }

    if (tool === 'door') {
      if (cell) toggleDoorAt(cell.x, cell.y);
      return;
    }

    if (isSessionPlaceTool(tool)) {
      addObject(selectedAssetId, pointer.x, pointer.y);
    }
  }

  function handlePointerMove(event: KonvaEventObject<MouseEvent | TouchEvent>) {
    const pointer = getPointer(event.target.getStage(), zoom);
    if (!pointer) return;
    const cell = pointerToCell(pointer, map);
    setHoverCell(cell);
    if (selectionStartRef.current && tool === 'select') {
      setSelectionBox({
        x: selectionStartRef.current.x,
        y: selectionStartRef.current.y,
        width: pointer.x - selectionStartRef.current.x,
        height: pointer.y - selectionStartRef.current.y
      });
      return;
    }
    if (fogStrokeRef.current && cell) {
      paintFogCell(cell, Boolean('shiftKey' in event.evt && event.evt.shiftKey));
      return;
    }
    if (ruler && tool === 'measure') {
      setRuler({ ...ruler, end: pointer });
    }
  }

  function handlePointerUp(event: KonvaEventObject<MouseEvent | TouchEvent>) {
    if (selectionStartRef.current && selectionBox) {
      const tiny = Math.abs(selectionBox.width) < 4 && Math.abs(selectionBox.height) < 4;
      if (!tiny) selectSessionArea(selectionBox, Boolean('shiftKey' in event.evt && event.evt.shiftKey));
    }
    selectionStartRef.current = null;
    setSelectionBox(null);
    fogStrokeRef.current = false;
    fogCellsRef.current.clear();
  }

  function paintFogCell(cell: { x: number; y: number }, hide: boolean) {
    const key = `${cell.x}:${cell.y}`;
    if (fogCellsRef.current.has(key)) return;
    fogCellsRef.current.add(key);
    if (hide) hideFogCell(cell.x, cell.y);
    else revealFogCell(cell.x, cell.y);
  }

  function addPing(point: { x: number; y: number }) {
    const id = `ping-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setPings((current) => [...current, { id, x: point.x, y: point.y, createdAt: Date.now() }]);
    window.setTimeout(() => {
      setPings((current) => current.filter((ping) => ping.id !== id));
    }, 1800);
  }

  return (
    <div ref={viewportRef} className="min-h-[650px] overflow-auto rounded-lg border border-line bg-black/50">
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
          <TokenLayerView map={map} tool={tool} selectedTokenIds={selectedTokenSet} viewMode={sessionViewMode} onSelect={selectToken} onMove={moveToken} onMoveSelected={moveSelectedTokens} />
          {showGrid ? <Grid map={map} /> : null}
          <SelectedDoorOverlay map={map} selectedTileCells={selectedTileCells} />
          <SessionFogOverlay map={map} enabled={sessionFogEnabled} viewMode={sessionViewMode} dynamic={sessionDynamicVision} visibleCells={visibleCells} darkness={sessionGlobalDarkness} />
          {selectionBox ? <SelectionBox box={selectionBox} /> : null}
          {ruler ? <RulerView map={map} ruler={ruler} /> : null}
          <PingLayer pings={pings} />
          {hoverCell && tool === 'fog' ? <Rect x={hoverCell.x * map.gridSize} y={hoverCell.y * map.gridSize} width={map.gridSize} height={map.gridSize} fill="#8b5cf6" opacity={0.14} stroke="#c4b5fd" dash={[4, 4]} /> : null}
        </Layer>
      </Stage>
    </div>
  );
}

function MapBackground({ map }: { map: OmniMap }) {
  return <Rect x={0} y={0} width={map.width * map.gridSize} height={map.height * map.gridSize} fill="#08040f" />;
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
                if (!door) return;
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

  return (
    <Group
      name="session-object"
      x={object.x}
      y={object.y}
      rotation={object.rotation}
      opacity={opacity * object.opacity * (object.hiddenFromPlayers ? 0.55 : 1)}
      onMouseDown={(event) => {
        if (tool !== 'select' || !canSelect) return;
        event.cancelBubble = true;
        onSelect(object.id, Boolean('shiftKey' in event.evt && event.evt.shiftKey));
      }}
      onTouchStart={(event) => {
        if (tool !== 'select' || !canSelect) return;
        event.cancelBubble = true;
        onSelect(object.id);
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
  onMove,
  onMoveSelected
}: {
  map: OmniMap;
  tool: MapTool;
  selectedTokenIds: Set<string>;
  viewMode: 'gm' | 'player-preview';
  onSelect(tokenId: string, additive?: boolean): void;
  onMove(tokenId: string, x: number, y: number): void;
  onMoveSelected(deltaX: number, deltaY: number): void;
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
            onMoveSelected={onMoveSelected}
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
  onMove,
  onMoveSelected
}: {
  token: TabletopToken;
  map: OmniMap;
  tool: MapTool;
  selected: boolean;
  selectedCount: number;
  onSelect(tokenId: string, additive?: boolean): void;
  onMove(tokenId: string, x: number, y: number): void;
  onMoveSelected(deltaX: number, deltaY: number): void;
}) {
  const image = useAssetImage(token.image);
  const size = map.gridSize;
  const visualSize = size * Math.max(0.5, token.size || 1);
  const tone = token.kind === 'enemy' ? '#fb7185' : token.kind === 'character' ? '#34d399' : '#8b5cf6';
  const draggable = (tool === 'select' || tool === 'token') && !token.locked;

  return (
    <Group
      x={token.x * size}
      y={token.y * size}
      draggable={draggable}
      opacity={token.hidden ? 0.45 : 1}
      onMouseDown={(event) => {
        if (tool !== 'select' && tool !== 'token') return;
        event.cancelBubble = true;
        onSelect(token.id, Boolean('shiftKey' in event.evt && event.evt.shiftKey));
      }}
      onTouchStart={(event) => {
        if (tool !== 'select' && tool !== 'token') return;
        event.cancelBubble = true;
        onSelect(token.id);
      }}
      onDragEnd={(event) => {
        const nextX = Math.round(event.target.x() / size);
        const nextY = Math.round(event.target.y() / size);
        if (selected && selectedCount > 1) {
          onMoveSelected(nextX - token.x, nextY - token.y);
        } else {
          onMove(token.id, nextX, nextY);
        }
        event.target.position({ x: token.x * size, y: token.y * size });
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

function SessionFogOverlay({
  map,
  enabled,
  viewMode,
  dynamic,
  visibleCells,
  darkness
}: {
  map: OmniMap;
  enabled: boolean;
  viewMode: 'gm' | 'player-preview';
  dynamic: boolean;
  visibleCells: Set<string>;
  darkness: number;
}) {
  const revealed = new Set(map.fogLayer.revealedCells.map((cell) => `${cell.x}:${cell.y}`));
  const cells: ReactNode[] = [];
  if (!enabled) {
    if (darkness <= 0) return null;
    return <Rect x={0} y={0} width={map.width * map.gridSize} height={map.height * map.gridSize} fill="#030108" opacity={viewMode === 'gm' ? darkness * 0.22 : darkness * 0.42} listening={false} />;
  }
  for (let y = 0; y < map.height; y += 1) {
    for (let x = 0; x < map.width; x += 1) {
      const key = `${x}:${y}`;
      const currentlyVisible = dynamic && visibleCells.has(key);
      if (currentlyVisible) continue;
      const explored = revealed.has(key);
      const opacity = viewMode === 'gm'
        ? explored ? 0.12 + darkness * 0.1 : 0.28 + darkness * 0.16
        : explored ? 0.42 + darkness * 0.14 : 0.82 + darkness * 0.12;
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

function SelectionBox({ box }: { box: { x: number; y: number; width: number; height: number } }) {
  const x = Math.min(box.x, box.x + box.width);
  const y = Math.min(box.y, box.y + box.height);
  return <Rect x={x} y={y} width={Math.abs(box.width)} height={Math.abs(box.height)} fill="#60a5fa" opacity={0.14} stroke="#93c5fd" strokeWidth={1} dash={[6, 4]} listening={false} />;
}

function RulerView({ map, ruler }: { map: OmniMap; ruler: { start: { x: number; y: number }; end: { x: number; y: number } } }) {
  const dx = ruler.end.x - ruler.start.x;
  const dy = ruler.end.y - ruler.start.y;
  const cells = Math.sqrt(dx * dx + dy * dy) / map.gridSize;
  const meters = cells * 1.5;
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

function Grid({ map }: { map: OmniMap }) {
  const lines = [];
  for (let x = 0; x <= map.width; x += 1) {
    lines.push(<Line key={`gx-${x}`} points={[x * map.gridSize, 0, x * map.gridSize, map.height * map.gridSize]} stroke={GRID_LINE} strokeWidth={1} listening={false} />);
  }
  for (let y = 0; y <= map.height; y += 1) {
    lines.push(<Line key={`gy-${y}`} points={[0, y * map.gridSize, map.width * map.gridSize, y * map.gridSize]} stroke={GRID_LINE} strokeWidth={1} listening={false} />);
  }
  return <>{lines}</>;
}

function computeVisibleCells(map: OmniMap, viewMode: 'gm' | 'player-preview') {
  const visible = new Set<string>();
  const tokens = map.tokens.filter((token) => token.visionEnabled !== false && !token.hidden && (viewMode === 'gm' || token.visibleToPlayers));
  tokens.forEach((token) => {
    addVisionCircle(map, visible, { x: token.x, y: token.y }, Math.max(1, token.visionRadius || 6));
    if (token.lightRadius) addVisionCircle(map, visible, { x: token.x, y: token.y }, Math.max(1, Math.round(token.lightRadius)));
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

function getPointer(stage: Konva.Stage | null, zoom: number) {
  const pointer = stage?.getPointerPosition();
  if (!pointer) return null;
  return { x: pointer.x / zoom, y: pointer.y / zoom };
}

function pointerToCell(pointer: { x: number; y: number }, map: OmniMap) {
  const x = Math.floor(pointer.x / map.gridSize);
  const y = Math.floor(pointer.y / map.gridSize);
  if (!isInsideCell(map, x, y)) return null;
  return { x, y };
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

function isStageTarget(node: Konva.Node) {
  return node.getClassName() === 'Stage' || node.getClassName() === 'Rect';
}

function isSessionPlaceTool(tool: MapTool) {
  return tool === 'object' || tool === 'cover' || tool === 'terminal' || tool === 'light' || tool === 'zone' || tool === 'note';
}

function arrowDelta(key: string, step: number) {
  if (key === 'ArrowLeft') return { x: -step, y: 0 };
  if (key === 'ArrowRight') return { x: step, y: 0 };
  if (key === 'ArrowUp') return { x: 0, y: -step };
  return { x: 0, y: step };
}

function isEditableTarget(target: EventTarget | null) {
  const element = target as HTMLElement | null;
  if (!element) return false;
  const tag = element.tagName?.toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select' || element.isContentEditable;
}
