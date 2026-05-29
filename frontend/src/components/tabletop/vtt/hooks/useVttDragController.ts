import { useRef, useState } from 'react';
import { useTabletopStore } from '../../mapStore';
import type { SessionSelectedEntity } from '../../types';
import type { VttPoint } from './useVttCamera';

export type VttDragPreview = {
  delta: VttPoint;
  tokenPositions: Record<string, { x: number; y: number }>;
  mapPositions: Record<string, { x: number; y: number }>;
  commitCount: number;
  draggedTokenId: string | null;
  lastMoveCommitted: boolean;
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
  commitCount: 0,
  draggedTokenId: null,
  lastMoveCommitted: false
};

export function useVttDragController() {
  const snapshotRef = useRef<VttDragSnapshot | null>(null);
  const [preview, setPreview] = useState<VttDragPreview>(EMPTY_PREVIEW);
  const [lastMoveCommitted, setLastMoveCommitted] = useState(false);

  function start(activeEntity: SessionSelectedEntity, world: VttPoint) {
    const state = useTabletopStore.getState();
    const activeKey = entityKey(activeEntity);
    const activeIsSelected = state.selectedEntities.some((entity) => entityKey(entity) === activeKey);
    const selectedEntities = getDragSelection(activeEntity, activeIsSelected ? state.selectedEntities : []);
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
    setLastMoveCommitted(false);
    setPreview({ ...EMPTY_PREVIEW, draggedTokenId: activeEntity.type === 'token' ? activeEntity.id : null });
  }

  function update(world: VttPoint, threshold = 4) {
    const snapshot = snapshotRef.current;
    if (!snapshot) return false;
    const totalDx = world.x - snapshot.pointerStart.x;
    const totalDy = world.y - snapshot.pointerStart.y;
    if (!snapshot.moved && Math.hypot(totalDx, totalDy) < threshold) return false;
    const targetDelta = { x: totalDx, y: totalDy };
    if (targetDelta.x === snapshot.appliedDelta.x && targetDelta.y === snapshot.appliedDelta.y) return snapshot.moved;
    snapshot.appliedDelta = targetDelta;
    snapshot.lastWorld = world;
    snapshot.moved = true;
    setPreview(buildPreview(snapshot));
    return true;
  }

  function finish() {
    const snapshot = snapshotRef.current;
    const moved = Boolean(snapshot?.moved);
    let committed = false;
    if (snapshot?.moved && (snapshot.appliedDelta.x || snapshot.appliedDelta.y)) {
      const state = useTabletopStore.getState();
      const finalPreview = buildPreview(snapshot);
      if (snapshot.activeEntity.type === 'token' && Object.keys(finalPreview.tokenPositions).length) {
        state.moveTokensTo(finalPreview.tokenPositions);
        committed = true;
      } else {
        state.moveSelectedSessionItems(snapshot.appliedDelta.x, snapshot.appliedDelta.y);
        committed = true;
      }
    }
    snapshotRef.current = null;
    setPreview(EMPTY_PREVIEW);
    setLastMoveCommitted(committed);
    return moved;
  }

  function cancel() {
    snapshotRef.current = null;
    setPreview(EMPTY_PREVIEW);
  }

  return { snapshotRef, preview, lastMoveCommitted, start, update, finish, cancel };
}

function entityKey(entity: SessionSelectedEntity) {
  return `${entity.type}:${entity.id}`;
}

function getDragSelection(activeEntity: SessionSelectedEntity, selectedEntities: SessionSelectedEntity[]) {
  if (activeEntity.type === 'token') {
    const selectedTokens = selectedEntities.filter((entity) => entity.type === 'token');
    return selectedTokens.some((entity) => entity.id === activeEntity.id) ? selectedTokens : [activeEntity];
  }
  return selectedEntities.length ? selectedEntities : [activeEntity];
}

function buildPreview(snapshot: VttDragSnapshot): VttDragPreview {
  const tokenPositions = Object.fromEntries(Object.entries(snapshot.tokenStarts).map(([id, point]) => [
    id,
    {
      x: point.x + snapshot.appliedDelta.x,
      y: point.y + snapshot.appliedDelta.y
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
    commitCount: Object.keys(tokenPositions).length + Object.keys(mapPositions).length,
    draggedTokenId: snapshot.activeEntity.type === 'token' ? snapshot.activeEntity.id : null,
    lastMoveCommitted: false
  };
}
