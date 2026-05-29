import type Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import { useEffect, useRef, useState, type MutableRefObject } from 'react';
import { useTabletopStore } from '../../mapStore';
import type { AreaTemplate, AvailableTabletopToken, MapBounds, MapTool, OmniMap, SessionSelectedEntity } from '../../types';
import type { VttPoint } from './useVttCamera';
import { useVttDragController } from './useVttDragController';
import type { createVttHitTesting } from './useVttHitTesting';

export type PointerIntent =
  | 'idle'
  | 'panningCamera'
  | 'paintingTiles'
  | 'draggingToken'
  | 'draggingMap'
  | 'draggingObject'
  | 'boxSelecting'
  | 'placingAsset'
  | 'measuring'
  | 'savingArea'
  | 'drawingFog'
  | 'drawingTemplate';

type Ruler = { id: string; start: VttPoint; end: VttPoint };
type Cell = { x: number; y: number };

type PointerState = {
  id: number | null;
  button: number;
  startScreen: VttPoint;
  startWorld: VttPoint;
  lastWorld: VttPoint;
  additive: boolean;
  boxVisible: boolean;
  moved: boolean;
  targetEntity: SessionSelectedEntity | null;
};

type PaintStroke = {
  tool: 'brush' | 'wall' | 'collision' | 'erase' | 'fog';
  cells: Set<string>;
  startCell: Cell;
  lastCell: Cell;
};

export function useVttInputController({
  map,
  tool,
  viewMode,
  hitTesting,
  screenToWorld,
  startPan,
  updatePan,
  endPan,
  isPanningRef,
  heldAssetId,
  heldToken,
  heldMapData,
  publishPointerState,
  clearHeld,
  onPlaceHeldMap,
  onMapCapture
}: {
  map: OmniMap;
  tool: MapTool;
  viewMode: 'gm' | 'player-preview';
  hitTesting: ReturnType<typeof createVttHitTesting>;
  screenToWorld(point: VttPoint): VttPoint;
  startPan(point: VttPoint): void;
  updatePan(point: VttPoint): boolean;
  endPan(): void;
  isPanningRef: MutableRefObject<unknown>;
  heldAssetId: string;
  heldToken: AvailableTabletopToken | null;
  heldMapData: OmniMap | null;
  publishPointerState?: boolean;
  clearHeld(): void;
  onPlaceHeldMap?(x: number, y: number): void;
  onMapCapture?(bounds: MapBounds): void;
}) {
  const intentRef = useRef<PointerIntent>('idle');
  const pointerStateRef = useRef<PointerState | null>(null);
  const spacePressedRef = useRef(false);
  const paintStrokeRef = useRef<PaintStroke | null>(null);
  const selectionBoxRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const rulerDraftRef = useRef<Ruler | null>(null);
  const mapCaptureStartRef = useRef<VttPoint | null>(null);
  const drag = useVttDragController();

  const [selectionBox, setSelectionBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [pointerIntent, setPointerIntent] = useState<PointerIntent>('idle');
  const [isPointerDown, setIsPointerDown] = useState(false);
  const [rulerDraft, setRulerDraft] = useState<Ruler | null>(null);
  const [pinnedRulers, setPinnedRulers] = useState<Ruler[]>([]);
  const [keepRuler, setKeepRuler] = useState(false);
  const [pings, setPings] = useState<Array<{ id: string; x: number; y: number }>>([]);
  const [cursorWorld, setCursorWorld] = useState<VttPoint>({ x: 0, y: 0 });
  const [lastButtons, setLastButtons] = useState(0);
  const [targetEntityLabel, setTargetEntityLabel] = useState('none');
  const [paintStrokeCellCount, setPaintStrokeCellCount] = useState(0);
  const [boxSelectMode, setBoxSelectMode] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (isTextInputEvent(event)) return;
      if (event.code === 'Space') {
        spacePressedRef.current = true;
        return;
      }
      if (event.key.toLowerCase() === 'x' && tool === 'select') {
        setBoxSelectMode(true);
        return;
      }
      if (event.code === 'Escape') {
        setBoxSelectMode(false);
        setMeasureDraft(null);
        mapCaptureStartRef.current = null;
        cancelPointerAction();
      }
    }

    function onKeyUp(event: KeyboardEvent) {
      if (event.code !== 'Space') return;
      spacePressedRef.current = false;
      if (intentRef.current === 'panningCamera') cancelPointerAction();
    }

    function onBlur() {
      cancelPointerAction();
    }

    function onPointerUp() {
      if (pointerStateRef.current) completePointerAction(pointerStateRef.current.lastWorld);
    }

    function onPointerCancel() {
      cancelPointerAction();
    }

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerCancel);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerCancel);
    };
  });

  useEffect(() => {
    cancelPointerAction();
    setMeasureDraft(null);
    setSelectionRect(null);
    mapCaptureStartRef.current = null;
    setBoxSelectMode(false);
  }, [map.mode, tool]);

  function handlePointerDown(event: KonvaEventObject<MouseEvent | TouchEvent | PointerEvent>) {
    const screen = getStagePointer(event.target.getStage());
    if (!screen) return;

    const eventButton = getButton(event.evt);
    if (eventButton !== 0 && eventButton !== 1 && eventButton !== 2) return;

    const world = screenToWorld(screen);
    const hit = getActionableHit(world);
    const pointerState: PointerState = {
      id: getPointerId(event.evt),
      button: eventButton,
      startScreen: screen,
      startWorld: world,
      lastWorld: world,
      additive: isAdditive(event.evt),
      boxVisible: false,
      moved: false,
      targetEntity: hit
    };

    event.evt.preventDefault();
    publishPointerDebugState(world, getButtons(event.evt), true);
    pointerStateRef.current = pointerState;
    setIsPointerDown(true);
    setTargetEntityLabel(hit ? entityKey(hit) : 'grid');
    capturePointer(event);

    if (shouldStartCameraPan(eventButton)) {
      beginPan(screen);
      return;
    }

    if (heldToken) {
      placeHeldToken(world);
      finishPointerAction();
      return;
    }

    if (heldMapData) {
      placeHeldMap(world);
      finishPointerAction();
      return;
    }

    if (heldAssetId) {
      placeHeldAsset(world);
      finishPointerAction();
      return;
    }

    if (tool === 'move-token') {
      handleMoveTokenPointerDown(hit, pointerState);
      return;
    }

    if (tool === 'frame' && map.mode === 'build') {
      if (mapCaptureStartRef.current) {
        const rect = rectFromPoints(mapCaptureStartRef.current, world);
        mapCaptureStartRef.current = null;
        if (Math.abs(rect.width) > map.gridSize / 2 && Math.abs(rect.height) > map.gridSize / 2) {
          onMapCapture?.(rectToCellBounds(rect, map.gridSize));
        }
        finishPointerAction();
        return;
      }
      setSelectionRect(null);
      setIntent('savingArea');
      return;
    }

    if (map.mode === 'build' && isBuildPaintTool(tool)) {
      beginPaintStroke(tool, world);
      return;
    }

    if (tool === 'select') {
      handleSelectPointerDown(hit, pointerState, screen);
      return;
    }

    if (tool === 'measure') {
      beginMeasure(world);
      return;
    }

    if (tool === 'fog') {
      beginFogStroke(world, pointerState.additive);
      return;
    }

    if (tool === 'ping' && map.mode === 'session') {
      addPing(world);
      finishPointerAction();
      return;
    }

    if (tool === 'template' && map.mode === 'session') {
      setIntent('drawingTemplate');
      return;
    }

    if (tool === 'door') {
      useDoorTool(world);
      finishPointerAction();
      return;
    }

    if (map.mode === 'build' && isBuildPlaceTool(tool)) {
      applyBuildPlaceTool(world);
      finishPointerAction();
      return;
    }

    beginPan(screen);
  }

  function handlePointerMove(event: KonvaEventObject<MouseEvent | TouchEvent | PointerEvent>) {
    const screen = getStagePointer(event.target.getStage());
    if (!screen) return;

    const world = screenToWorld(screen);
    publishPointerDebugState(world, getButtons(event.evt));

    const pointerState = pointerStateRef.current;
    if (!pointerState) {
      updateTwoClickDrafts(world);
      return;
    }

    if (!shouldContinuePointerAction(event.evt, pointerState, intentRef.current)) {
      return;
    }

    pointerState.moved = pointerState.moved || pointerDistance(screen, pointerState.startScreen) >= 4;

    if (intentRef.current === 'panningCamera') {
      if (isPanningRef.current) updatePan(screen);
      pointerState.lastWorld = world;
      return;
    }

    if (intentRef.current === 'paintingTiles') {
      continuePaintStroke(world);
      pointerState.lastWorld = world;
      return;
    }

    if (isDraggingIntent(intentRef.current)) {
      drag.update(world);
      pointerState.lastWorld = world;
      return;
    }

    if (intentRef.current === 'boxSelecting') {
      updateSelectionRect(pointerState, screen, world);
      pointerState.lastWorld = world;
      return;
    }

    if (intentRef.current === 'savingArea') {
      updateSelectionRect(pointerState, screen, world);
      pointerState.lastWorld = world;
      return;
    }

    if (intentRef.current === 'measuring') {
      setMeasureDraft(rulerDraftRef.current ? { ...rulerDraftRef.current, end: world } : null);
      pointerState.lastWorld = world;
      return;
    }

    if (intentRef.current === 'drawingFog') {
      continueFogStroke(world, pointerState.additive);
      pointerState.lastWorld = world;
      return;
    }

    if (intentRef.current === 'drawingTemplate') {
      setSelectionRect({
        x: pointerState.startWorld.x,
        y: pointerState.startWorld.y,
        width: world.x - pointerState.startWorld.x,
        height: world.y - pointerState.startWorld.y
      });
      pointerState.lastWorld = world;
    }
  }

  function handlePointerUp(event: KonvaEventObject<MouseEvent | TouchEvent | PointerEvent>) {
    const screen = getStagePointer(event.target.getStage());
    const world = screen ? screenToWorld(screen) : pointerStateRef.current?.lastWorld;
    releasePointer(event);
    completePointerAction(world);
  }

  function handlePointerCancel(event: KonvaEventObject<MouseEvent | TouchEvent | PointerEvent>) {
    releasePointer(event);
    cancelPointerAction();
  }

  function handleContextMenu(event: KonvaEventObject<PointerEvent>) {
    event.evt.preventDefault();
    cancelPointerAction();
    setMeasureDraft(null);
    setSelectionRect(null);
  }

  function handleSelectPointerDown(hit: SessionSelectedEntity | null, pointerState: PointerState, screen: VttPoint) {
    const state = useTabletopStore.getState();

    if (hit) {
      const alreadySelected = state.selectedEntities.some((entry) => entityKey(entry) === entityKey(hit));
      if (pointerState.additive) {
        state.toggleSelection(hit);
      } else if (!alreadySelected) {
        state.selectEntity(hit, false);
      }

      if (hit.type === 'map') {
        const instance = map.sessionMapInstances?.find((entry) => entry.id === hit.id);
        if (instance?.locked) {
          beginPan(screen);
          return;
        }
        drag.start(hit, pointerState.startWorld);
        setIntent('draggingMap');
        return;
      }

      drag.start(hit, pointerState.startWorld);
      setIntent(hit.type === 'token' ? 'draggingToken' : 'draggingObject');
      return;
    }

    if (pointerState.additive || boxSelectMode) {
      setSelectionRect(null);
      setIntent('boxSelecting');
      return;
    }

    beginPan(screen);
  }

  function handleMoveTokenPointerDown(hit: SessionSelectedEntity | null, pointerState: PointerState) {
    if (hit?.type !== 'token') {
      if (!pointerState.additive) useTabletopStore.getState().clearSelection();
      finishPointerAction();
      return;
    }
    const state = useTabletopStore.getState();
    state.selectEntity(hit, pointerState.additive);
    drag.start(hit, pointerState.startWorld);
    setIntent('draggingToken');
  }

  function beginPan(screen: VttPoint) {
    setSelectionRect(null);
    setIntent('panningCamera');
    startPan(screen);
  }

  function beginPaintStroke(activeTool: PaintStroke['tool'], world: VttPoint) {
    const cell = worldToCell(world, map.gridSize);
    paintStrokeRef.current = {
      tool: activeTool,
      cells: new Set(),
      startCell: cell,
      lastCell: cell
    };
    setPaintStrokeCellCount(0);
    useTabletopStore.getState().captureHistory();
    setIntent('paintingTiles');
    paintBuildCells([cell]);
  }

  function continuePaintStroke(world: VttPoint) {
    const stroke = paintStrokeRef.current;
    if (!stroke) return;
    const cell = worldToCell(world, map.gridSize);
    const cells = bresenhamCells(stroke.lastCell, cell);
    paintBuildCells(cells);
    stroke.lastCell = cell;
  }

  function paintBuildCells(cells: Cell[]) {
    const stroke = paintStrokeRef.current;
    if (!stroke) return;
    const state = useTabletopStore.getState();
    const nextCells: Cell[] = [];
    cells.forEach((cell) => {
      const key = `${cell.x}:${cell.y}`;
      if (stroke.cells.has(key)) return;
      stroke.cells.add(key);
      nextCells.push(cell);
    });
    if (!nextCells.length) return;
    if (stroke.tool === 'brush') state.paintBrushCells(nextCells, 'floor');
    if (stroke.tool === 'wall') state.paintBrushCells(nextCells, 'walls');
    if (stroke.tool === 'collision') state.paintBrushCells(nextCells, 'collision', 'wall-brick');
    if (stroke.tool === 'erase') state.eraseBrushCells(nextCells);
    if (stroke.tool === 'fog') state.paintBrushCells(nextCells, 'fog');
    setPaintStrokeCellCount(stroke.cells.size);
  }

  function applyBuildPlaceTool(world: VttPoint) {
    const state = useTabletopStore.getState();
    const cell = worldToCell(world, map.gridSize);
    if (tool === 'door') {
      state.addDoor(cell.x, cell.y);
      return;
    }
    state.addObject(state.selectedAssetId, world.x, world.y);
  }

  function beginFogStroke(world: VttPoint, hide: boolean) {
    if (map.mode === 'build') {
      beginPaintStroke('fog', world);
      return;
    }
    paintStrokeRef.current = {
      tool: 'fog',
      cells: new Set(),
      startCell: worldToCell(world, map.gridSize),
      lastCell: worldToCell(world, map.gridSize)
    };
    setPaintStrokeCellCount(0);
    setIntent('drawingFog');
    paintFogCells([worldToCell(world, map.gridSize)], hide);
  }

  function continueFogStroke(world: VttPoint, hide: boolean) {
    const stroke = paintStrokeRef.current;
    if (!stroke) return;
    const cell = worldToCell(world, map.gridSize);
    paintFogCells(bresenhamCells(stroke.lastCell, cell), hide);
    stroke.lastCell = cell;
  }

  function paintFogCells(cells: Cell[], hide: boolean) {
    const stroke = paintStrokeRef.current;
    if (!stroke) return;
    const state = useTabletopStore.getState();
    cells.forEach((cell) => {
      const key = `${cell.x}:${cell.y}`;
      if (stroke.cells.has(key)) return;
      stroke.cells.add(key);
      if (hide) state.hideFogCell(cell.x, cell.y);
      else state.revealFogCell(cell.x, cell.y);
    });
    setPaintStrokeCellCount(stroke.cells.size);
  }

  function beginMeasure(world: VttPoint) {
    setSelectionRect(null);
    if (rulerDraftRef.current) {
      finishMeasure(world);
      finishPointerAction();
      return;
    }
    setMeasureDraft({ id: `ruler-${Date.now()}`, start: world, end: world });
    setIntent('measuring');
  }

  function finishMeasure(world?: VttPoint) {
    const draft = rulerDraftRef.current;
    if (!draft) return;
    const final = { ...draft, end: world || draft.end };
    if (keepRuler && rulerDistance(final) > 2) {
      setPinnedRulers((current) => [...current, final].slice(-8));
    }
    setMeasureDraft(null);
  }

  function useDoorTool(world: VttPoint) {
    const cell = worldToCell(world, map.gridSize);
    if (map.mode === 'build') useTabletopStore.getState().addDoor(cell.x, cell.y);
    else useTabletopStore.getState().toggleDoorAt(cell.x, cell.y);
  }

  function placeHeldToken(world: VttPoint) {
    if (!heldToken) return;
    const size = map.gridSize * Math.max(0.5, heldToken.size || 1);
    useTabletopStore.getState().addToken(heldToken, world.x - size / 2, world.y - size / 2);
    clearHeld();
  }

  function placeHeldAsset(world: VttPoint) {
    if (!heldAssetId) return;
    useTabletopStore.getState().addObject(heldAssetId, world.x, world.y);
    clearHeld();
  }

  function placeHeldMap(world: VttPoint) {
    if (!heldMapData) return;
    const point = snapPointToGrid(world, heldMapData.gridSize || map.gridSize);
    onPlaceHeldMap?.(point.x, point.y);
    clearHeld();
  }

  function addPing(world: VttPoint) {
    const id = `ping-${Date.now()}`;
    setPings((current) => [...current, { id, x: world.x, y: world.y }]);
    window.setTimeout(() => setPings((current) => current.filter((ping) => ping.id !== id)), 1600);
  }

  function finishTemplate(world?: VttPoint) {
    const pointerState = pointerStateRef.current;
    if (!pointerState || map.mode !== 'session') return;
    const end = world || pointerState.lastWorld;
    const template = createTemplate(pointerState.startWorld, end, map.gridSize);
    useTabletopStore.getState().addAreaTemplate(template);
    useTabletopStore.getState().selectEntity({ type: 'template', id: template.id }, false);
  }

  function completePointerAction(world?: VttPoint) {
    const pointerState = pointerStateRef.current;
    const intent = intentRef.current;

    if (intent === 'boxSelecting') {
      const rect = selectionBoxRef.current;
      if (rect && pointerState?.boxVisible) {
        const entities = hitTesting.boxSelect(rect);
        if (pointerState.additive) useTabletopStore.getState().addToSelection(entities);
        else useTabletopStore.getState().setSelection(entities);
      }
    }

    if (intent === 'panningCamera' && pointerState && !pointerState.moved && !pointerState.additive && tool === 'select' && !pointerState.targetEntity) {
      useTabletopStore.getState().clearSelection();
    }

    if (intent === 'savingArea') {
      if (pointerState?.boxVisible && selectionBoxRef.current) {
        mapCaptureStartRef.current = null;
        onMapCapture?.(rectToCellBounds(selectionBoxRef.current, map.gridSize));
      } else if (pointerState) {
        mapCaptureStartRef.current = pointerState.startWorld;
        setSelectionRect({ x: pointerState.startWorld.x, y: pointerState.startWorld.y, width: 0, height: 0 });
      }
    }

    if (isDraggingIntent(intent)) drag.finish();
    if (intent === 'measuring' && pointerState?.moved) finishMeasure(world);
    if (intent === 'drawingTemplate') finishTemplate(world);

    finishPointerAction();
  }

  function finishPointerAction() {
    endPan();
    drag.cancel();
    setIntent('idle');
    pointerStateRef.current = null;
    paintStrokeRef.current = null;
    setIsPointerDown(false);
    if (!mapCaptureStartRef.current) setSelectionRect(null);
    setPaintStrokeCellCount(0);
    setLastButtons(0);
    setTargetEntityLabel('none');
    if (boxSelectMode && intentRef.current !== 'boxSelecting') setBoxSelectMode(false);
  }

  function cancelPointerAction() {
    endPan();
    drag.cancel();
    setIntent('idle');
    pointerStateRef.current = null;
    paintStrokeRef.current = null;
    mapCaptureStartRef.current = null;
    setIsPointerDown(false);
    setSelectionRect(null);
    setPaintStrokeCellCount(0);
    setLastButtons(0);
    setTargetEntityLabel('none');
  }

  function updateTwoClickDrafts(world: VttPoint) {
    if (tool === 'measure' && rulerDraftRef.current) {
      setMeasureDraft({ ...rulerDraftRef.current, end: world });
      return;
    }
    if (tool === 'frame' && mapCaptureStartRef.current) {
      setSelectionRect(rectFromPoints(mapCaptureStartRef.current, world));
    }
  }

  function updateSelectionRect(pointerState: PointerState, screen: VttPoint, world: VttPoint) {
    const distance = pointerDistance(screen, pointerState.startScreen);
    if (!pointerState.boxVisible && distance < 4) return;
    pointerState.boxVisible = true;
    setSelectionRect({
      x: pointerState.startWorld.x,
      y: pointerState.startWorld.y,
      width: world.x - pointerState.startWorld.x,
      height: world.y - pointerState.startWorld.y
    });
  }

  function getActionableHit(world: VttPoint) {
    const hit = hitTesting.hitTest(world);
    if (!hit) return null;
    if (hit.type === 'map' && hit.id === 'base-map') return null;
    return hit;
  }

  function shouldStartCameraPan(eventButton: number) {
    return spacePressedRef.current || tool === 'pan' || eventButton === 1 || eventButton === 2;
  }

  function setIntent(next: PointerIntent) {
    intentRef.current = next;
    setPointerIntent(next);
  }

  function setSelectionRect(rect: { x: number; y: number; width: number; height: number } | null) {
    selectionBoxRef.current = rect;
    setSelectionBox(rect);
  }

  function setMeasureDraft(draft: Ruler | null) {
    rulerDraftRef.current = draft;
    setRulerDraft(draft);
  }

  function publishPointerDebugState(world: VttPoint, buttons: number, force = false) {
    if (!force && !publishPointerState && !heldAssetId && !heldToken && !heldMapData && !rulerDraftRef.current && !mapCaptureStartRef.current) return;
    setCursorWorld(world);
    setLastButtons(buttons);
  }

  return {
    selectionBox,
    pointerIntent,
    isPointerDown,
    activePointerId: pointerStateRef.current?.id ?? null,
    rulerDraft,
    pinnedRulers,
    keepRuler,
    setKeepRuler,
    pings,
    cursorWorld,
    dragPreview: drag.preview,
    debug: {
      mode: map.mode,
      tool,
      pointerIntent,
      isPointerDown,
      activePointerId: pointerStateRef.current?.id ?? null,
      buttons: lastButtons,
      targetEntity: targetEntityLabel,
      cell: worldToCell(cursorWorld, map.gridSize),
      paintStrokeCellCount,
      dragCommitCount: drag.preview.commitCount,
      draggedTokenId: drag.preview.draggedTokenId,
      lastMoveCommitted: drag.lastMoveCommitted,
      measureActive: Boolean(rulerDraft),
      boxSelectActive: Boolean(selectionBox)
    },
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    handleContextMenu,
    cancelPointerAction
  };
}

function getStagePointer(stage: Konva.Stage | null) {
  const pointer = stage?.getPointerPosition();
  return pointer ? { x: pointer.x, y: pointer.y } : null;
}

function getButton(event: MouseEvent | TouchEvent | PointerEvent) {
  return 'button' in event ? event.button : 0;
}

function getButtons(event: MouseEvent | TouchEvent | PointerEvent) {
  return 'buttons' in event ? event.buttons : 1;
}

function getPointerId(event: MouseEvent | TouchEvent | PointerEvent) {
  return 'pointerId' in event ? event.pointerId : null;
}

function shouldContinuePointerAction(event: MouseEvent | TouchEvent | PointerEvent, pointerState: PointerState, intent: PointerIntent) {
  if (intent === 'idle') return false;
  if ('pointerId' in event && pointerState.id !== null && event.pointerId !== pointerState.id) return false;
  return true;
}

function isAdditive(event: MouseEvent | TouchEvent | PointerEvent) {
  return 'shiftKey' in event && (event.shiftKey || event.ctrlKey || event.metaKey);
}

function capturePointer(event: KonvaEventObject<MouseEvent | TouchEvent | PointerEvent>) {
  if (!('pointerId' in event.evt)) return;
  try {
    event.target.getStage()?.container().setPointerCapture(event.evt.pointerId);
  } catch {
    // Pointer capture is best effort.
  }
}

function releasePointer(event: KonvaEventObject<MouseEvent | TouchEvent | PointerEvent>) {
  if (!('pointerId' in event.evt)) return;
  try {
    event.target.getStage()?.container().releasePointerCapture(event.evt.pointerId);
  } catch {
    // It may already be released.
  }
}

function worldToCell(world: VttPoint, gridSize: number): Cell {
  return { x: Math.floor(world.x / gridSize), y: Math.floor(world.y / gridSize) };
}

function pointerDistance(a: VttPoint, b: VttPoint) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function rectFromPoints(start: VttPoint, end: VttPoint) {
  return { x: start.x, y: start.y, width: end.x - start.x, height: end.y - start.y };
}

function snapPointToGrid(point: VttPoint, gridSize: number) {
  const size = Math.max(1, gridSize);
  return {
    x: Math.round(point.x / size) * size,
    y: Math.round(point.y / size) * size
  };
}

function rulerDistance(ruler: Ruler) {
  return Math.hypot(ruler.end.x - ruler.start.x, ruler.end.y - ruler.start.y);
}

function createTemplate(start: VttPoint, end: VttPoint, gridSize: number): AreaTemplate {
  const radius = Math.max(gridSize, Math.hypot(end.x - start.x, end.y - start.y));
  return {
    id: `template-${Date.now()}`,
    name: 'Template',
    shape: 'circle',
    x: start.x,
    y: start.y,
    width: radius * 2,
    height: radius * 2,
    radius,
    color: '#67e8f9',
    opacity: 0.22,
    visibleToPlayers: true,
    createdAt: new Date().toISOString()
  };
}

function rectToCellBounds(rect: { x: number; y: number; width: number; height: number }, gridSize: number): MapBounds {
  const normalized = {
    x: Math.min(rect.x, rect.x + rect.width),
    y: Math.min(rect.y, rect.y + rect.height),
    width: Math.abs(rect.width),
    height: Math.abs(rect.height)
  };
  const x = Math.floor(normalized.x / gridSize);
  const y = Math.floor(normalized.y / gridSize);
  const right = Math.ceil((normalized.x + normalized.width) / gridSize);
  const bottom = Math.ceil((normalized.y + normalized.height) / gridSize);
  return {
    x,
    y,
    width: Math.max(1, right - x),
    height: Math.max(1, bottom - y)
  };
}

function entityKey(entity: SessionSelectedEntity) {
  return entity.type === 'door' ? `${entity.type}:${entity.x}:${entity.y}` : `${entity.type}:${entity.id}`;
}

function isDraggingIntent(intent: PointerIntent) {
  return intent === 'draggingToken' || intent === 'draggingMap' || intent === 'draggingObject';
}

function isBuildPaintTool(tool: MapTool): tool is 'brush' | 'wall' | 'collision' | 'erase' {
  return tool === 'brush' || tool === 'wall' || tool === 'collision' || tool === 'erase';
}

function isBuildPlaceTool(tool: MapTool) {
  return tool === 'object' || tool === 'cover' || tool === 'terminal' || tool === 'light' || tool === 'zone' || tool === 'note';
}

function bresenhamCells(start: Cell, end: Cell): Cell[] {
  const cells: Cell[] = [];
  let x0 = start.x;
  let y0 = start.y;
  const x1 = end.x;
  const y1 = end.y;
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  while (true) {
    cells.push({ x: x0, y: y0 });
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x0 += sx;
    }
    if (e2 < dx) {
      err += dx;
      y0 += sy;
    }
  }

  return cells;
}

function isTextInputEvent(event: KeyboardEvent) {
  const target = event.target as HTMLElement | null;
  if (!target) return false;
  return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable;
}
