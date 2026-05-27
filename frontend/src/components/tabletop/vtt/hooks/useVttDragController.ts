import { useRef, useState } from 'react';
import { useTabletopStore } from '../../mapStore';
import type { SessionSelectedEntity } from '../../types';
import type { VttPoint } from './useVttCamera';

export type VttDragPreview = {
  delta: VttPoint;
  tokenPositions: Record<string, { x: number; y: number }>;
  mapPositions: Record<string, { x: number; y: number }>;
  commitCount: number;
};

export type VttDragSnapshot = {
  pointerStart: VttPoint;
  lastWorld: VttPoint;
  appliedDelta: VttPoint;
  selectedEntities: SessionSelectedEntity[];
  activeEntity: SessionSelectedEntity;
  tokenStarts: Record<string, { x: number; y: number }>;
  mapStarts: Record<string, { x: number; y: number }>;
  moved: boolean;
};

const EMPTY_PREVIEW: VttDragPreview = {
  delta: { x: 0, y: 0 },
  tokenPositions: {},
  mapPositions: {},
  commitCount: 0
};

export function useVttDragController() {
  const snapshotRef = useRef<VttDragSnapshot | null>(null);
  const [preview, setPreview] = useState<VttDragPreview>(EMPTY_PREVIEW);

  function start(activeEntity: SessionSelectedEntity, world: VttPoint) {
    const state = useTabletopStore.getState();
    const activeKey = entityKey(activeEntity);
    const activeIsSelected = state.selectedEntities.some((entity) => entityKey(entity) === activeKey);
    const selectedEntities = activeIsSelected && state.selectedEntities.length ? state.selectedEntities : [activeEntity];
    const selectedTokenIds = new Set(selectedEntities.filter((entity) => entity.type === 'token').map((entity) => entity.id));
    const selectedMapIds = new Set(selectedEntities.filter((entity) => entity.type === 'map').map((entity) => entity.id));
    snapshotRef.current = {
      pointerStart: world,
      lastWorld: world,
      appliedDelta: { x: 0, y: 0 },
      selectedEntities,
      activeEntity,
      tokenStarts: Object.fromEntries(state.map.tokens
        .filter((token) => selectedTokenIds.has(token.id))
        .map((token) => [token.id, { x: token.x, y: token.y }])),
      mapStarts: Object.fromEntries((state.map.sessionMapInstances || [])
        .filter((instance) => selectedMapIds.has(instance.id))
        .map((instance) => [instance.id, { x: instance.x, y: instance.y }])),
      moved: false
    };
    setPreview(EMPTY_PREVIEW);
  }

  function update(world: VttPoint, threshold = 4) {
    const snapshot = snapshotRef.current;
    if (!snapshot) return false;
    const totalDx = world.x - snapshot.pointerStart.x;
    const totalDy = world.y - snapshot.pointerStart.y;
    if (!snapshot.moved && Math.hypot(totalDx, totalDy) < threshold) return false;
    const state = useTabletopStore.getState();
    const gridSize = Math.max(1, state.map.gridSize);
    const snapsToGrid = snapshot.selectedEntities.some((entity) => entity.type === 'token');
    const targetDelta = snapsToGrid
      ? { x: Math.round(totalDx / gridSize) * gridSize, y: Math.round(totalDy / gridSize) * gridSize }
      : { x: totalDx, y: totalDy };
    if (targetDelta.x === snapshot.appliedDelta.x && targetDelta.y === snapshot.appliedDelta.y) return snapshot.moved;
    snapshot.appliedDelta = targetDelta;
    snapshot.lastWorld = world;
    snapshot.moved = true;
    setPreview(buildPreview(snapshot, gridSize));
    return true;
  }

  function finish() {
    const snapshot = snapshotRef.current;
    const moved = Boolean(snapshot?.moved);
    if (snapshot?.moved && (snapshot.appliedDelta.x || snapshot.appliedDelta.y)) {
      useTabletopStore.getState().moveSelectedSessionItems(snapshot.appliedDelta.x, snapshot.appliedDelta.y);
    }
    snapshotRef.current = null;
    setPreview(EMPTY_PREVIEW);
    return moved;
  }

  function cancel() {
    snapshotRef.current = null;
    setPreview(EMPTY_PREVIEW);
  }

  return { snapshotRef, preview, start, update, finish, cancel };
}

function entityKey(entity: SessionSelectedEntity) {
  return `${entity.type}:${entity.id}`;
}

function buildPreview(snapshot: VttDragSnapshot, gridSize: number): VttDragPreview {
  const tokenDeltaCells = {
    x: Math.round(snapshot.appliedDelta.x / Math.max(1, gridSize)),
    y: Math.round(snapshot.appliedDelta.y / Math.max(1, gridSize))
  };
  const tokenPositions = Object.fromEntries(Object.entries(snapshot.tokenStarts).map(([id, point]) => [
    id,
    {
      x: Math.round(point.x + tokenDeltaCells.x),
      y: Math.round(point.y + tokenDeltaCells.y)
    }
  ]));
  const mapPositions = Object.fromEntries(Object.entries(snapshot.mapStarts).map(([id, point]) => [
    id,
    {
      x: point.x + snapshot.appliedDelta.x,
      y: point.y + snapshot.appliedDelta.y
    }
  ]));
  return {
    delta: snapshot.appliedDelta,
    tokenPositions,
    mapPositions,
    commitCount: Object.keys(tokenPositions).length + Object.keys(mapPositions).length
  };
}
