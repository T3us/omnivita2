import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Circle, Group, Image as KonvaImage, Layer, Line, Rect, Stage, Text } from 'react-konva';
import type { Asset, AvailableTabletopToken, MapObject, OmniMap, SessionMapInstance, SessionSelectedEntity, TabletopToken, TileLayer } from '../types';
import { getAsset } from '../assets';
import { useTabletopStore } from '../mapStore';
import { useVttCamera, type VttCamera, type VttPoint } from './hooks/useVttCamera';
import { useVttHitTesting, type VttRect } from './hooks/useVttHitTesting';
import { useVttInputController } from './hooks/useVttInputController';
import type { PointerIntent } from './hooks/useVttInputController';
import { useVttSelection } from './hooks/useVttSelection';

export interface VttCanvasControls {
  camera: VttCamera;
  resetCamera(): void;
  focusSelection(): void;
}

interface VttCanvasProps {
  heldAssetId: string;
  heldToken: AvailableTabletopToken | null;
  clearHeld(): void;
  onMapCapture?(bounds: NonNullable<OmniMap['bounds']>): void;
  onControlsReady?(controls: VttCanvasControls): void;
  onCursorWorldChange?(point: VttPoint): void;
  onInputStateChange?(state: { pointerIntent: PointerIntent; isPointerDown: boolean; activePointerId: number | null }): void;
}

export function VttCanvas({ heldAssetId, heldToken, clearHeld, onMapCapture, onControlsReady, onCursorWorldChange, onInputStateChange }: VttCanvasProps) {
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
  const { selectedKeys } = useVttSelection();
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
    clearHeld,
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
      focusSelection
    });
  }, [camera.camera, camera.resetCamera, focusSelection, onControlsReady]);

  useEffect(() => {
    onCursorWorldChange?.(input.cursorWorld);
  }, [input.cursorWorld, onCursorWorldChange]);

  useEffect(() => {
    onInputStateChange?.({ pointerIntent: input.pointerIntent, isPointerDown: input.isPointerDown, activePointerId: input.activePointerId });
  }, [input.activePointerId, input.isPointerDown, input.pointerIntent, onInputStateChange]);

  const gridLines = useMemo(() => buildGridLines(camera.camera, viewport, map.gridSize), [camera.camera, viewport, map.gridSize]);
  const selectionRects = selectedEntities
    .map((entity) => ({ entity, rect: hitTesting.getEntityBounds(entity) }))
    .filter((entry): entry is { entity: SessionSelectedEntity; rect: VttRect } => Boolean(entry.rect));
  const showBaseMap = map.mode === 'build' || !(map.sessionMapInstances || []).length;

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
          if (event.evt.buttons === 0) input.cancelPointerAction();
        }}
        onContextMenu={input.handleContextMenu}
        onWheel={(event) => {
          event.evt.preventDefault();
          const pointer = event.target.getStage()?.getPointerPosition();
          if (!pointer) return;
          const multiplier = event.evt.deltaY > 0 ? 0.9 : 1.1;
          camera.zoomAt(pointer, camera.camera.zoom * multiplier);
        }}
        className={input.pointerIntent === 'panningCamera' || camera.isPanning ? 'cursor-grabbing' : tool === 'pan' ? 'cursor-grab' : tool === 'frame' || heldAssetId || heldToken ? 'cursor-crosshair' : 'cursor-default'}
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
            {showBaseMap ? <MapBody map={map} origin={{ x: 0, y: 0 }} selected={selectedKeys.has('map:base-map')} /> : null}
            {map.mode === 'build' && map.bounds ? <MapFrameOverlay map={map} zoom={camera.camera.zoom} /> : null}
            {(map.sessionMapInstances || [])
              .slice()
              .sort((left, right) => Number(left.zIndex || 0) - Number(right.zIndex || 0))
              .map((instance) => <MapInstanceNode key={instance.id} instance={instance} selected={selectedKeys.has(`map:${instance.id}`)} />)}
            <ObjectLayer map={map} selectedKeys={selectedKeys} />
            <TemplateLayer map={map} selectedKeys={selectedKeys} />
            <TokenLayer map={map} viewMode={viewMode} selectedKeys={selectedKeys} />
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

function MapInstanceNode({ instance, selected }: { instance: SessionMapInstance; selected: boolean }) {
  const data = instance.data;
  return (
    <Group opacity={instance.opacity ?? 1}>
      {data ? <MapBody map={data} origin={{ x: instance.x, y: instance.y }} selected={selected} /> : null}
      <Rect
        x={instance.x}
        y={instance.y}
        width={instance.width * instance.gridSize}
        height={instance.height * instance.gridSize}
        stroke={selected ? '#c4b5fd' : instance.locked ? '#4c3d66' : '#6d5a90'}
        strokeWidth={selected ? 3 : 1.4}
        dash={instance.locked ? [10, 5] : undefined}
        listening={false}
      />
      <Text
        x={instance.x + 8}
        y={instance.y + 8}
        text={`${instance.locked ? 'LOCK ' : ''}${instance.name}`}
        fill="#f4efff"
        fontSize={12}
        fontStyle="bold"
        padding={5}
        listening={false}
      />
    </Group>
  );
}

function MapBody({ map, origin, selected }: { map: OmniMap; origin: VttPoint; selected: boolean }) {
  void selected;
  return (
    <Group>
      <TileLayerNode layer={map.tileLayers.floor} map={map} origin={origin} opacity={0.94} />
      <TileLayerNode layer={map.tileLayers.walls} map={map} origin={origin} opacity={1} />
      <TileLayerNode layer={map.tileLayers.doors} map={map} origin={origin} opacity={1} />
      <TileLayerNode layer={map.tileLayers.collision} map={map} origin={origin} opacity={0.35} />
    </Group>
  );
}

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

function TileLayerNode({ layer, map, origin, opacity }: { layer: TileLayer; map: OmniMap; origin: VttPoint; opacity: number }) {
  if (!layer.visible) return null;
  return (
    <Group opacity={(layer.opacity ?? 1) * opacity} listening={false}>
      {layer.cells.map((cell) => {
        const asset = getAsset(cell.assetId, map.tilesets);
        const width = (cell.footprint?.w || asset?.gridFootprint?.w || 1) * map.gridSize;
        const height = (cell.footprint?.h || asset?.gridFootprint?.h || 1) * map.gridSize;
        return (
          <Rect
            key={`${layer.key}-${cell.x}-${cell.y}-${cell.assetId}`}
            x={origin.x + cell.x * map.gridSize}
            y={origin.y + cell.y * map.gridSize}
            width={width}
            height={height}
            fill={asset?.color || layerColor(layer.key)}
            stroke={asset?.stroke || layerStroke(layer.key)}
            strokeWidth={layer.key === 'walls' ? 2 : 1}
            rotation={cell.rotation || 0}
          />
        );
      })}
    </Group>
  );
}

function ObjectLayer({ map, selectedKeys }: { map: OmniMap; selectedKeys: Set<string> }) {
  return (
    <>
      {getAllObjects(map)
        .filter((object) => isFiniteNumber(object.x) && isFiniteNumber(object.y))
        .sort((left, right) => Number(left.zIndex || 0) - Number(right.zIndex || 0))
        .map((object) => <ObjectNode key={object.id} object={object} asset={getAsset(object.assetId, map.tilesets)} selected={selectedKeys.has(`${object.kind === 'light' ? 'light' : 'object'}:${object.id}`)} />)}
    </>
  );
}

function ObjectNode({ object, asset, selected }: { object: MapObject; asset: Asset | null; selected: boolean }) {
  const image = useLoadedImage(asset?.imageUrl || asset?.thumbnailUrl);
  const width = object.width * (object.scale || 1);
  const height = object.height * (object.scale || 1);
  return (
    <Group x={object.x} y={object.y} rotation={object.rotation || 0} opacity={object.opacity ?? asset?.defaultOpacity ?? 1} listening={false}>
      {image ? (
        <KonvaImage image={image} width={width} height={height} cornerRadius={6} />
      ) : (
        <Rect width={width} height={height} fill={asset?.color || '#2b213d'} stroke={selected ? '#c4b5fd' : asset?.stroke || '#7c6aa7'} strokeWidth={selected ? 2 : 1} cornerRadius={6} />
      )}
      {object.kind === 'light' ? <Circle x={width / 2} y={height / 2} radius={Math.max(width, height) * 0.55} fill={asset?.color || '#fef3c7'} opacity={0.16} /> : null}
    </Group>
  );
}

function TokenLayer({ map, viewMode, selectedKeys }: { map: OmniMap; viewMode: 'gm' | 'player-preview'; selectedKeys: Set<string> }) {
  return (
    <>
      {map.tokens
        .filter((token) => viewMode === 'gm' || (token.visibleToPlayers && !token.hidden))
        .map((token) => <TokenNode key={token.id} token={token} map={map} selected={selectedKeys.has(`token:${token.id}`)} />)}
    </>
  );
}

function TokenNode({ token, map, selected }: { token: TabletopToken; map: OmniMap; selected: boolean }) {
  const image = useLoadedImage(token.image);
  const size = map.gridSize * Math.max(0.5, token.size || 1);
  const x = token.x * map.gridSize;
  const y = token.y * map.gridSize;
  const color = token.kind === 'enemy' ? '#fb7185' : token.kind === 'npc' ? '#fbbf24' : '#60a5fa';
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
