import { useEffect } from 'react';
import { useTabletopStore } from '../../mapStore';
import type { MapTool } from '../../types';

const toolKeys: Record<string, MapTool> = {
  v: 'select',
  h: 'pan',
  t: 'token',
  f: 'fog',
  l: 'light',
  d: 'door',
  m: 'measure',
  p: 'ping',
  n: 'note'
};

export function useVttKeyboard({
  onToggleAssets,
  onToggleInspector,
  onOpenCommandPalette,
  onCloseFloating,
  onResetCamera
}: {
  onToggleAssets(): void;
  onToggleInspector(): void;
  onOpenCommandPalette(): void;
  onCloseFloating(): void;
  onResetCamera(): void;
}) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (shouldIgnore(event)) return;
      const key = event.key.toLowerCase();
      const meta = event.ctrlKey || event.metaKey;
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
      if (key === 'a') {
        const mode = useTabletopStore.getState().map.mode;
        if (mode === 'session') useTabletopStore.getState().setTool('template');
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
  }, [onCloseFloating, onOpenCommandPalette, onResetCamera, onToggleAssets, onToggleInspector]);
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
