import { useCallback, useRef, useState } from 'react';

export type VttPoint = { x: number; y: number };
export type VttCamera = { x: number; y: number; zoom: number };

export function useVttCamera() {
  const [camera, setCamera] = useState<VttCamera>({ x: 0, y: 0, zoom: 1 });
  const panStartRef = useRef<{ pointer: VttPoint; camera: VttCamera } | null>(null);
  const [isPanning, setIsPanning] = useState(false);

  const screenToWorld = useCallback((point: VttPoint) => ({
    x: (point.x - camera.x) / camera.zoom,
    y: (point.y - camera.y) / camera.zoom
  }), [camera.x, camera.y, camera.zoom]);

  const worldToScreen = useCallback((point: VttPoint) => ({
    x: point.x * camera.zoom + camera.x,
    y: point.y * camera.zoom + camera.y
  }), [camera.x, camera.y, camera.zoom]);

  const startPan = useCallback((pointer: VttPoint) => {
    panStartRef.current = { pointer, camera };
    setIsPanning(true);
  }, [camera]);

  const updatePan = useCallback((pointer: VttPoint) => {
    const start = panStartRef.current;
    if (!start) return false;
    setCamera({
      ...start.camera,
      x: start.camera.x + pointer.x - start.pointer.x,
      y: start.camera.y + pointer.y - start.pointer.y
    });
    return true;
  }, []);

  const endPan = useCallback(() => {
    panStartRef.current = null;
    setIsPanning(false);
  }, []);

  const zoomAt = useCallback((screenPoint: VttPoint, nextZoom: number) => {
    const zoom = Math.max(0.25, Math.min(3.5, nextZoom));
    const worldBefore = {
      x: (screenPoint.x - camera.x) / camera.zoom,
      y: (screenPoint.y - camera.y) / camera.zoom
    };
    setCamera({
      x: screenPoint.x - worldBefore.x * zoom,
      y: screenPoint.y - worldBefore.y * zoom,
      zoom
    });
  }, [camera.x, camera.y, camera.zoom]);

  const panBy = useCallback((dx: number, dy: number) => {
    setCamera((current) => ({ ...current, x: current.x + dx, y: current.y + dy }));
  }, []);

  const resetCamera = useCallback(() => {
    setCamera({ x: 0, y: 0, zoom: 1 });
  }, []);

  const focusRect = useCallback((rect: { x: number; y: number; width: number; height: number }, viewport: { width: number; height: number }) => {
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    const zoom = Math.max(0.25, Math.min(2.5, Math.min(viewport.width / width, viewport.height / height) * 0.72));
    setCamera({
      x: viewport.width / 2 - (rect.x + width / 2) * zoom,
      y: viewport.height / 2 - (rect.y + height / 2) * zoom,
      zoom
    });
  }, []);

  return {
    camera,
    setCamera,
    isPanning,
    isPanningRef: panStartRef,
    screenToWorld,
    worldToScreen,
    startPan,
    updatePan,
    endPan,
    panBy,
    zoomAt,
    resetCamera,
    focusRect
  };
}
