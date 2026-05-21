import { useRef } from 'react';
import { useTabletopStore } from '../../mapStore';
import type { SessionSelectedEntity } from '../../types';
import type { VttPoint } from './useVttCamera';

export type VttDragSnapshot = {
  pointerStart: VttPoint;
  lastWorld: VttPoint;
  appliedDelta: VttPoint;
  selectedEntities: SessionSelectedEntity[];
  activeEntity: SessionSelectedEntity;
  moved: boolean;
};

export function useVttDragController() {
  const snapshotRef = useRef<VttDragSnapshot | null>(null);

  function start(activeEntity: SessionSelectedEntity, world: VttPoint) {
    const state = useTabletopStore.getState();
    snapshotRef.current = {
      pointerStart: world,
      lastWorld: world,
      appliedDelta: { x: 0, y: 0 },
      selectedEntities: state.selectedEntities,
      activeEntity,
      moved: false
    };
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
    const dx = targetDelta.x - snapshot.appliedDelta.x;
    const dy = targetDelta.y - snapshot.appliedDelta.y;
    if (dx || dy) useTabletopStore.getState().moveSelectedSessionItems(dx, dy);
    snapshot.appliedDelta = targetDelta;
    snapshot.lastWorld = world;
    snapshot.moved = true;
    return true;
  }

  function finish() {
    const moved = Boolean(snapshotRef.current?.moved);
    snapshotRef.current = null;
    return moved;
  }

  function cancel() {
    snapshotRef.current = null;
  }

  return { snapshotRef, start, update, finish, cancel };
}
