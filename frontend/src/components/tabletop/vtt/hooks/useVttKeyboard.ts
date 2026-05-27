import { useEffect } from 'react';
import { useTabletopStore } from '../../mapStore';
import type { MapTool } from '../../types';

const toolKeys: Record<string, MapTool> = {
  v: 'select',
  h: 'move-token',
  t: 'token',
  f: 'fog',
  l: 'light',
  m: 'measure',
  p: 'ping',
  n: 'note'
};

export function useVttKeyboard({
  onToggleAssets,
  onToggleInspector,
  onOpenCommandPalette,
  onCloseFloating,
  onResetCamera,
  onPanBy
}: {
  onToggleAssets(): void;
  onToggleInspector(): void;
  onOpenCommandPalette(): void;
  onCloseFloating(): void;
  onResetCamera(): void;
  onPanBy(dx: number, dy: number): void;
}) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (shouldIgnore(event)) return;
      const key = event.key.toLowerCase();
      const meta = event.ctrlKey || event.metaKey;
      const pan = keyboardPanDelta(event);
      if (pan) {
        event.preventDefault();
        onPanBy(pan.x, pan.y);
        return;
      }
      if (meta && key === 'k') {
        event.preventDefault();
        onOpenCommandPalette();
        return;
      }
      if (event.key === 'Escape') {
        onCloseFloating();
        useTabletopStore.getState().clearSelection();
        return;
      }
      if (key === 'b') {
        onToggleAssets();
        return;
      }
      if (key === 'i') {
        onToggleInspector();
        return;
      }
      if (key === 'g') {
        useTabletopStore.getState().toggleGrid();
        return;
      }
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        deleteSelection();
        return;
      }
      if (meta && key === 'z') {
        event.preventDefault();
        if (event.shiftKey) useTabletopStore.getState().redo();
        else useTabletopStore.getState().undo();
        return;
      }
      if (key === '0') {
        onResetCamera();
        return;
      }
      const tool = toolKeys[key];
      if (tool) useTabletopStore.getState().setTool(tool);
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCloseFloating, onOpenCommandPalette, onPanBy, onResetCamera, onToggleAssets, onToggleInspector]);
}

function keyboardPanDelta(event: KeyboardEvent) {
  const key = event.key.toLowerCase();
  const fast = event.shiftKey ? 2.2 : 1;
  const slow = event.ctrlKey || event.metaKey ? 0.35 : 1;
  const step = Math.round(64 * fast * slow);
  if (key === 'arrowleft' || key === 'a') return { x: step, y: 0 };
  if (key === 'arrowright' || key === 'd') return { x: -step, y: 0 };
  if (key === 'arrowup' || key === 'w') return { x: 0, y: step };
  if (key === 'arrowdown' || key === 's') return { x: 0, y: -step };
  return null;
}

function deleteSelection() {
  const state = useTabletopStore.getState();
  state.selectedTokenIds.forEach((id) => state.removeToken(id));
  state.selectedObjectIds.forEach((id) => state.removeObject(id));
  state.selectedRegionIds.forEach((id) => state.removeLightingRegion(id));
  state.selectedMapInstanceIds.forEach((id) => state.removeSessionMapInstance(id));
  state.clearSelection();
}

function shouldIgnore(event: KeyboardEvent) {
  const target = event.target as HTMLElement | null;
  if (!target) return false;
  const tag = target.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable;
}
