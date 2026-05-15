import type Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { MutableRefObject } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useTabletopStore } from '../mapStore';
import type { AreaTemplate, LightingRegion, MapTool, OmniMap } from '../types';
import type { Point } from './useCameraController';
import { createSessionHitTesting } from './useSessionHitTesting';

type Ruler = { id: string; start: Point; end: Point };

export function useSessionInputController({
  map,
  tool,
  viewMode,
  camera,
  zoom,
  screenToWorld,
  startPan,
  updatePan,
  endPan,
  isPanningRef,
  captureHistory
}: {
  map: OmniMap;
  tool: MapTool;
  viewMode: 'gm' | 'player-preview';
  camera: Point;
  zoom: number;
  screenToWorld(point: Point): Point;
  startPan(point: Point): void;
  updatePan(point: Point): boolean;
  endPan(): void;
  isPanningRef: MutableRefObject<unknown>;
  captureHistory(): void;
}) {
  const selectionStartRef = useRef<Point | null>(null);
  const regionStartRef = useRef<Point | null>(null);
  const fogStrokeRef = useRef(false);
  const fogCellsRef = useRef(new Set<string>());
  const spacePressedRef = useRef(false);
  const [selectionBox, setSelectionBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [regionDraft, setRegionDraft] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [activeRulerDraft, setActiveRulerDraft] = useState<Ruler | null>(null);
  const [rulerFinal, setRulerFinal] = useState<Ruler | null>(null);
  const [pinnedRulers, setPinnedRulers] = useState<Ruler[]>([]);
  const [keepLastRuler, setKeepLastRuler] = useState(false);
  const [pings, setPings] = useState<Array<{ id: string; x: number; y: number; createdAt: number }>>([]);
  const [hoverCell, setHoverCell] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (tool === 'measure') return;
    setActiveRulerDraft(null);
    setRulerFinal(null);
  }, [tool]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isEditableTarget(event.target)) return;
      const key = event.key.toLowerCase();
      if (event.code === 'Space') {
        spacePressedRef.current = true;
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        setActiveRulerDraft(null);
        setRulerFinal(null);
        setSelectionBox(null);
        setRegionDraft(null);
        useTabletopStore.getState().clearSessionSelection();
        return;
      }
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        const state = useTabletopStore.getState();
        state.removeSelectedTokens();
        state.removeSelectedObjects();
        state.removeSelectedLightingRegions();
        return;
      }
      if (event.key.startsWith('Arrow')) {
        const state = useTabletopStore.getState();
        const selectedCount = state.selectedTokenIds.length + state.selectedMapInstanceIds.length + state.selectedRegionIds.length + state.selectedObjectIds.length;
        if (!selectedCount) return;
        event.preventDefault();
        const step = event.shiftKey ? state.map.gridSize : event.altKey ? 4 : 1;
        const delta = arrowDelta(event.key, step);
        state.moveSelectedSessionItems(delta.x, delta.y);
        return;
      }
      if (key === 'm' && event.shiftKey) {
        event.preventDefault();
        setKeepLastRuler((value) => !value);
        return;
      }
      const toolByKey: Partial<Record<string, MapTool>> = {
        v: 'select',
        h: 'pan',
        t: 'token',
        m: 'measure',
        p: 'ping',
        f: 'fog',
        d: 'door',
        l: 'light',
        n: 'note',
        a: 'template'
      };
      if (toolByKey[key]) {
        event.preventDefault();
        useTabletopStore.getState().setTool(toolByKey[key]);
      }
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
    const screenPointer = getStagePointer(event.target.getStage());
    if (!screenPointer) return;
    const shouldPan = spacePressedRef.current
      || tool === 'pan'
      || getEventButton(event.evt) === 1
      || getEventButton(event.evt) === 2;
    if (shouldPan) {
      event.evt.preventDefault();
      startPan(screenPointer);
      capturePointer(event);
      return;
    }

    const pointer = screenToWorld(screenPointer);
    const cell = pointerToCell(pointer, map);
    setHoverCell(cell);

    if (tool === 'select') {
      if (!isStageTarget(event.target)) return;
      if (!isAdditiveEvent(event.evt)) useTabletopStore.getState().clearSessionSelection();
      selectionStartRef.current = pointer;
      setSelectionBox({ x: pointer.x, y: pointer.y, width: 0, height: 0 });
      return;
    }

    if (tool === 'fog') {
      if (!cell) return;
      captureHistory();
      fogStrokeRef.current = true;
      fogCellsRef.current = new Set();
      paintFogCell(cell, isAdditiveEvent(event.evt));
      return;
    }

    if (tool === 'measure') {
      if (activeRulerDraft) {
        const final = { ...activeRulerDraft, end: pointer };
        setRulerFinal(keepLastRuler ? final : null);
        setPinnedRulers((current) => keepLastRuler ? [...current, final].slice(-6) : current);
        setActiveRulerDraft(null);
        return;
      }
      setRulerFinal(null);
      setActiveRulerDraft({ id: createStageId('ruler'), start: pointer, end: pointer });
      return;
    }

    if (tool === 'ping') {
      addPing(pointer);
      return;
    }

    if (tool === 'template') {
      const regionPreset = useTabletopStore.getState().sessionRegionPreset;
      if (regionPreset) {
        regionStartRef.current = pointer;
        setRegionDraft({ x: pointer.x, y: pointer.y, width: 0, height: 0 });
        return;
      }
      useTabletopStore.getState().addAreaTemplate(createTemplateAtPoint(map, pointer));
      return;
    }

    if (tool === 'door') {
      if (cell && isStageTarget(event.target)) useTabletopStore.getState().toggleDoorAt(cell.x, cell.y);
      return;
    }

    if (tool === 'token') {
      return;
    }

    if (isSessionPlaceTool(tool)) {
      useTabletopStore.getState().addObject(useTabletopStore.getState().selectedAssetId, pointer.x, pointer.y);
    }
  }

  function handlePointerMove(event: KonvaEventObject<MouseEvent | TouchEvent | PointerEvent>) {
    const screenPointer = getStagePointer(event.target.getStage());
    if (!screenPointer) return;
    if (isPanningRef.current && updatePan(screenPointer)) return;

    const pointer = screenToWorld(screenPointer);
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
    if (regionStartRef.current && tool === 'template' && useTabletopStore.getState().sessionRegionPreset) {
      setRegionDraft({
        x: regionStartRef.current.x,
        y: regionStartRef.current.y,
        width: pointer.x - regionStartRef.current.x,
        height: pointer.y - regionStartRef.current.y
      });
      return;
    }
    if (fogStrokeRef.current && cell) {
      paintFogCell(cell, isAdditiveEvent(event.evt));
      return;
    }
    if (activeRulerDraft && tool === 'measure') {
      setActiveRulerDraft({ ...activeRulerDraft, end: pointer });
    }
  }

  function handlePointerUp(event: KonvaEventObject<MouseEvent | TouchEvent | PointerEvent>) {
    releasePointer(event);
    if (selectionStartRef.current && selectionBox) {
      const tiny = Math.abs(selectionBox.width) < 4 && Math.abs(selectionBox.height) < 4;
      if (!tiny) {
        const state = useTabletopStore.getState();
        const entities = createSessionHitTesting(map, viewMode).boxSelect(selectionBox);
        if (isAdditiveEvent(event.evt)) state.addToSelection(entities);
        else state.setSelection(entities);
      }
    }
    const regionPreset = useTabletopStore.getState().sessionRegionPreset;
    if (regionStartRef.current && regionDraft && regionPreset) {
      const tiny = Math.abs(regionDraft.width) < 8 && Math.abs(regionDraft.height) < 8;
      if (!tiny) useTabletopStore.getState().addLightingRegion(createLightingRegionFromBox(regionDraft, regionPreset));
      regionStartRef.current = null;
      setRegionDraft(null);
      useTabletopStore.getState().setSessionRegionPreset(null);
    }
    selectionStartRef.current = null;
    endPan();
    setSelectionBox(null);
    fogStrokeRef.current = false;
    fogCellsRef.current.clear();
  }

  function handleContextMenu(event: KonvaEventObject<PointerEvent>) {
    event.evt.preventDefault();
    if (tool === 'measure') {
      setActiveRulerDraft(null);
      setRulerFinal(null);
    }
  }

  function paintFogCell(cell: { x: number; y: number }, hide: boolean) {
    const key = `${cell.x}:${cell.y}`;
    if (fogCellsRef.current.has(key)) return;
    fogCellsRef.current.add(key);
    const state = useTabletopStore.getState();
    if (hide) state.hideFogCell(cell.x, cell.y);
    else state.revealFogCell(cell.x, cell.y);
  }

  function addPing(point: Point) {
    const id = `ping-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setPings((current) => [...current, { id, x: point.x, y: point.y, createdAt: Date.now() }]);
    window.setTimeout(() => {
      setPings((current) => current.filter((ping) => ping.id !== id));
    }, 1800);
  }

  function getWorldPointFromClient(clientX: number, clientY: number, container: HTMLElement | null) {
    if (!container) return null;
    const rect = container.getBoundingClientRect();
    return {
      x: (clientX - rect.left - camera.x) / zoom,
      y: (clientY - rect.top - camera.y) / zoom
    };
  }

  return {
    selectionBox,
    regionDraft,
    activeRulerDraft,
    rulerFinal,
    pinnedRulers,
    keepLastRuler,
    setKeepLastRuler,
    pings,
    hoverCell,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleContextMenu,
    getWorldPointFromClient
  };
}

function createStageId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function createTemplateAtPoint(map: OmniMap, point: Point): AreaTemplate {
  const radius = map.gridSize * 3;
  return {
    id: `template-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: 'Area circular',
    shape: 'circle',
    x: point.x,
    y: point.y,
    width: radius * 2,
    height: radius * 2,
    radius,
    color: '#67e8f9',
    opacity: 0.22,
    visibleToPlayers: true,
    createdAt: new Date().toISOString()
  };
}

function createLightingRegionFromBox(box: { x: number; y: number; width: number; height: number }, preset: 'light' | 'dark' | 'gm' | 'fog'): LightingRegion {
  const x = Math.min(box.x, box.x + box.width);
  const y = Math.min(box.y, box.y + box.height);
  const width = Math.max(8, Math.abs(box.width));
  const height = Math.max(8, Math.abs(box.height));
  const base = {
    id: createStageId(`${preset}-region`),
    shape: 'rect' as const,
    points: [{ x, y }, { x: x + width, y: y + height }],
    visibleToGM: true,
    affectsVision: true,
    affectsFog: true
  };
  if (preset === 'light') {
    return {
      ...base,
      name: 'Area clara',
      darknessMode: 'subtract',
      darkness: 0.8,
      color: '#d8e6ff',
      intensity: 0.75,
      blocksGlobalIllumination: false,
      visibleToPlayers: true
    };
  }
  if (preset === 'gm') {
    return {
      ...base,
      name: 'Luz GM-only',
      darknessMode: 'subtract',
      darkness: 0.8,
      color: '#8b5cf6',
      intensity: 0.65,
      blocksGlobalIllumination: false,
      visibleToPlayers: false
    };
  }
  if (preset === 'fog') {
    return {
      ...base,
      name: 'Nevoa',
      darknessMode: 'add',
      darkness: 0.55,
      color: '#94a3b8',
      intensity: 0.55,
      blocksGlobalIllumination: false,
      visibleToPlayers: true
    };
  }
  return {
    ...base,
    name: 'Sala escura',
    darknessMode: 'override',
    darkness: 0.88,
    color: '#030108',
    intensity: 0.9,
    blocksGlobalIllumination: true,
    visibleToPlayers: true
  };
}

function getStagePointer(stage: Konva.Stage | null) {
  const pointer = stage?.getPointerPosition();
  if (!pointer) return null;
  return { x: pointer.x, y: pointer.y };
}

function pointerToCell(pointer: Point, map: OmniMap) {
  const x = Math.floor(pointer.x / map.gridSize);
  const y = Math.floor(pointer.y / map.gridSize);
  if (!isInsideCell(map, x, y)) return null;
  return { x, y };
}

function isInsideCell(map: OmniMap, x: number, y: number) {
  return x >= 0 && y >= 0 && x < map.width && y < map.height;
}

function isStageTarget(node: Konva.Node) {
  return node.getClassName() === 'Stage' || node.name() === 'session-background';
}

function getEventButton(event: MouseEvent | TouchEvent | PointerEvent) {
  return 'button' in event ? event.button : 0;
}

function isAdditiveEvent(event: MouseEvent | TouchEvent | PointerEvent) {
  return 'shiftKey' in event && (event.shiftKey || event.ctrlKey || event.metaKey);
}

function capturePointer(event: KonvaEventObject<MouseEvent | TouchEvent | PointerEvent>) {
  if (!('pointerId' in event.evt)) return;
  const container = event.target.getStage()?.container();
  if (!container?.setPointerCapture) return;
  try {
    container.setPointerCapture(event.evt.pointerId);
  } catch {
    // Pointer capture is a convenience, not a hard dependency.
  }
}

function releasePointer(event: KonvaEventObject<MouseEvent | TouchEvent | PointerEvent>) {
  if (!('pointerId' in event.evt)) return;
  const container = event.target.getStage()?.container();
  if (!container?.releasePointerCapture) return;
  try {
    container.releasePointerCapture(event.evt.pointerId);
  } catch {
    // The browser may have already released it.
  }
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
