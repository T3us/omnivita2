import { useCallback, useRef, useState } from 'react';

export type Point = { x: number; y: number };
export type CameraState = { x: number; y: number; zoom: number };

export function useCameraController({
  zoom,
  setZoom
}: {
  zoom: number;
  setZoom(zoom: number): void;
}) {
  const [camera, setCamera] = useState<Point>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ pointer: Point; camera: Point } | null>(null);

  const screenToWorld = useCallback((point: Point) => ({
    x: (point.x - camera.x) / zoom,
    y: (point.y - camera.y) / zoom
  }), [camera.x, camera.y, zoom]);

  const worldToScreen = useCallback((point: Point) => ({
    x: point.x * zoom + camera.x,
    y: point.y * zoom + camera.y
  }), [camera.x, camera.y, zoom]);

  const startPan = useCallback((pointer: Point) => {
    panStartRef.current = { pointer, camera };
    setIsPanning(true);
  }, [camera]);

  const updatePan = useCallback((pointer: Point) => {
    if (!panStartRef.current) return false;
    const dx = pointer.x - panStartRef.current.pointer.x;
    const dy = pointer.y - panStartRef.current.pointer.y;
    setCamera({
      x: panStartRef.current.camera.x + dx,
      y: panStartRef.current.camera.y + dy
    });
    return true;
  }, []);

  const endPan = useCallback(() => {
    panStartRef.current = null;
    setIsPanning(false);
  }, []);

  const panBy = useCallback((dx: number, dy: number) => {
    setCamera((current) => ({ x: current.x + dx, y: current.y + dy }));
  }, []);

  const zoomAt = useCallback((screenPoint: Point, nextZoom: number) => {
    const clamped = Math.max(0.35, Math.min(2.75, nextZoom));
    const worldBefore = {
      x: (screenPoint.x - camera.x) / zoom,
      y: (screenPoint.y - camera.y) / zoom
    };
    setZoom(clamped);
    setCamera({
      x: screenPoint.x - worldBefore.x * clamped,
      y: screenPoint.y - worldBefore.y * clamped
    });
  }, [camera.x, camera.y, setZoom, zoom]);

  const resetCamera = useCallback(() => {
    setCamera({ x: 0, y: 0 });
    setZoom(1);
  }, [setZoom]);

  const focusWorldRect = useCallback((rect: { x: number; y: number; width: number; height: number }, viewport: { width: number; height: number }) => {
    const safeWidth = Math.max(1, rect.width);
    const safeHeight = Math.max(1, rect.height);
    const nextZoom = Math.max(0.35, Math.min(2.2, Math.min(viewport.width / safeWidth, viewport.height / safeHeight) * 0.72));
    setZoom(nextZoom);
    setCamera({
      x: viewport.width / 2 - (rect.x + safeWidth / 2) * nextZoom,
      y: viewport.height / 2 - (rect.y + safeHeight / 2) * nextZoom
    });
  }, [setZoom]);

  return {
    camera,
    cameraState: { ...camera, zoom } satisfies CameraState,
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
    focusWorldRect
  };
}
