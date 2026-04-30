import type { PointerEvent } from 'react';
import { useRef } from 'react';
import { useTabletopStore } from './mapStore';

export function GridControls({ zoom }: { zoom: number }) {
  const mode = useTabletopStore((state) => state.currentMode);
  const gridWidth = useTabletopStore((state) => state.gridWidth);
  const gridHeight = useTabletopStore((state) => state.gridHeight);
  const paintCell = useTabletopStore((state) => state.paintCell);
  const eraseCell = useTabletopStore((state) => state.eraseCell);
  const paintingRef = useRef(false);
  const erasingRef = useRef(false);

  if (mode !== 'edit') return null;

  function getCell(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / (rect.width / gridWidth));
    const y = Math.floor((event.clientY - rect.top) / (rect.height / gridHeight));
    return {
      x: Math.max(0, Math.min(gridWidth - 1, x)),
      y: Math.max(0, Math.min(gridHeight - 1, y))
    };
  }

  function apply(event: PointerEvent<HTMLDivElement>) {
    const cell = getCell(event);
    if (erasingRef.current) eraseCell(cell.x, cell.y);
    else paintCell(cell.x, cell.y);
  }

  return (
    <div
      className="absolute inset-0 z-30 cursor-crosshair touch-none"
      style={{ ['--tabletop-zoom' as string]: zoom }}
      onContextMenu={(event) => event.preventDefault()}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        paintingRef.current = true;
        erasingRef.current = event.button === 2 || event.altKey;
        apply(event);
      }}
      onPointerMove={(event) => {
        if (!paintingRef.current) return;
        apply(event);
      }}
      onPointerUp={(event) => {
        paintingRef.current = false;
        erasingRef.current = false;
        event.currentTarget.releasePointerCapture(event.pointerId);
      }}
      onPointerCancel={() => {
        paintingRef.current = false;
        erasingRef.current = false;
      }}
    />
  );
}
