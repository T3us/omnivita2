import { useEffect, useRef, useState } from 'react';
import { getTileDefinition } from './tilesets';
import type { TabletopTileDefinition } from './types';
import { useTabletopStore } from './mapStore';

export function MapCanvas({ showGrid }: { showGrid: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const [imageRevision, setImageRevision] = useState(0);
  const gridWidth = useTabletopStore((state) => state.gridWidth);
  const gridHeight = useTabletopStore((state) => state.gridHeight);
  const tileSize = useTabletopStore((state) => state.tileSize);
  const layers = useTabletopStore((state) => state.layers);
  const customTiles = useTabletopStore((state) => state.customTiles);

  useEffect(() => {
    customTiles.forEach((tile) => {
      if (!tile.imageSrc || imageCacheRef.current.has(tile.id)) return;
      const image = new Image();
      image.onload = () => setImageRevision((current) => current + 1);
      image.src = tile.imageSrc;
      imageCacheRef.current.set(tile.id, image);
    });
  }, [customTiles]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return undefined;

    canvas.width = gridWidth * tileSize;
    canvas.height = gridHeight * tileSize;

    const frame = requestAnimationFrame(() => {
      context.imageSmoothingEnabled = false;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = '#0a0611';
      context.fillRect(0, 0, canvas.width, canvas.height);

      for (let y = 0; y < gridHeight; y += 1) {
        for (let x = 0; x < gridWidth; x += 1) {
          const tile = getTileDefinition(layers.ground[y]?.[x], customTiles);
          drawTile(context, tile, x * tileSize, y * tileSize, tileSize, imageCacheRef.current);
        }
      }

      for (let y = 0; y < gridHeight; y += 1) {
        for (let x = 0; x < gridWidth; x += 1) {
          const tile = getTileDefinition(layers.objects[y]?.[x], customTiles);
          if (tile) drawTile(context, tile, x * tileSize, y * tileSize, tileSize, imageCacheRef.current);
          if (layers.collision[y]?.[x]) drawCollision(context, x * tileSize, y * tileSize, tileSize);
        }
      }

      if (showGrid) drawGrid(context, gridWidth, gridHeight, tileSize);
    });

    return () => cancelAnimationFrame(frame);
  }, [customTiles, gridHeight, gridWidth, imageRevision, layers, showGrid, tileSize]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full bg-black [image-rendering:pixelated]"
      aria-label="Mapa pixelado da mesa"
    />
  );
}

function drawTile(
  context: CanvasRenderingContext2D,
  tile: TabletopTileDefinition | null,
  x: number,
  y: number,
  size: number,
  imageCache: Map<string, HTMLImageElement>
) {
  const safeTile = tile || {
    id: 'fallback',
    name: 'Vazio',
    tileset: 'fallback',
    layer: 'ground' as const,
    colors: ['#4aa86b', '#2f7a45', '#9ee58d'] as [string, string, string],
    pattern: 'grass' as const
  };

  if (safeTile.pattern === 'custom' && safeTile.imageSrc) {
    const image = imageCache.get(safeTile.id);
    if (image?.complete) {
      context.drawImage(image, x, y, size, size);
      return;
    }
  }

  const [base, shadow, light] = safeTile.colors;
  context.fillStyle = base;
  context.fillRect(x, y, size, size);

  if (safeTile.pattern === 'grass') drawGrass(context, x, y, size, shadow, light);
  if (safeTile.pattern === 'stone') drawStone(context, x, y, size, shadow, light);
  if (safeTile.pattern === 'wood') drawWood(context, x, y, size, shadow, light);
  if (safeTile.pattern === 'water') drawWater(context, x, y, size, shadow, light);
  if (safeTile.pattern === 'wall') drawWall(context, x, y, size, shadow, light);
  if (safeTile.pattern === 'roof') drawRoof(context, x, y, size, shadow, light);
  if (safeTile.pattern === 'object') drawObject(context, x, y, size, shadow, light, base);
  if (safeTile.pattern === 'flat') drawNoise(context, x, y, size, shadow, light);
}

function drawGrass(context: CanvasRenderingContext2D, x: number, y: number, size: number, shadow: string, light: string) {
  drawNoise(context, x, y, size, shadow, light);
  context.fillStyle = light;
  for (let i = 0; i < 5; i += 1) {
    context.fillRect(x + ((i * 7) % size), y + ((i * 11) % size), 3, 5);
  }
}

function drawStone(context: CanvasRenderingContext2D, x: number, y: number, size: number, shadow: string, light: string) {
  context.fillStyle = shadow;
  context.fillRect(x + 2, y + 8, size - 4, 2);
  context.fillRect(x + 10, y + 18, size - 12, 2);
  context.fillStyle = light;
  context.fillRect(x + 4, y + 3, 7, 3);
  context.fillRect(x + 18, y + 13, 8, 3);
}

function drawWood(context: CanvasRenderingContext2D, x: number, y: number, size: number, shadow: string, light: string) {
  context.fillStyle = shadow;
  for (let line = 6; line < size; line += 8) context.fillRect(x, y + line, size, 2);
  context.fillStyle = light;
  context.fillRect(x + 5, y + 4, 3, size - 8);
  context.fillRect(x + 20, y + 5, 2, size - 10);
}

function drawWater(context: CanvasRenderingContext2D, x: number, y: number, size: number, shadow: string, light: string) {
  context.fillStyle = shadow;
  context.fillRect(x, y + size - 7, size, 7);
  context.fillStyle = light;
  context.fillRect(x + 4, y + 8, 10, 3);
  context.fillRect(x + 17, y + 18, 9, 3);
}

function drawWall(context: CanvasRenderingContext2D, x: number, y: number, size: number, shadow: string, light: string) {
  context.fillStyle = shadow;
  context.fillRect(x, y + size - 8, size, 8);
  context.fillStyle = light;
  context.fillRect(x + 3, y + 3, size - 8, 4);
  context.fillRect(x + 8, y + 14, size - 12, 3);
}

function drawRoof(context: CanvasRenderingContext2D, x: number, y: number, size: number, shadow: string, light: string) {
  context.fillStyle = shadow;
  context.fillRect(x, y + size - 6, size, 6);
  context.fillStyle = light;
  for (let line = 4; line < size - 4; line += 7) context.fillRect(x + line, y + 3, 3, size - 10);
}

function drawObject(context: CanvasRenderingContext2D, x: number, y: number, size: number, shadow: string, light: string, base: string) {
  const pad = Math.max(3, Math.floor(size * 0.15));
  context.fillStyle = shadow;
  context.fillRect(x + pad, y + pad * 2, size - pad * 2, size - pad * 2);
  context.fillStyle = base;
  context.fillRect(x + pad * 2, y + pad, size - pad * 3, size - pad * 2);
  context.fillStyle = light;
  context.fillRect(x + pad * 2, y + pad * 2, Math.max(3, size / 4), Math.max(3, size / 5));
}

function drawNoise(context: CanvasRenderingContext2D, x: number, y: number, size: number, shadow: string, light: string) {
  context.fillStyle = shadow;
  context.fillRect(x + 3, y + 5, 4, 4);
  context.fillRect(x + size - 9, y + 12, 3, 3);
  context.fillRect(x + 10, y + size - 8, 5, 3);
  context.fillStyle = light;
  context.fillRect(x + 13, y + 4, 3, 3);
  context.fillRect(x + size - 8, y + size - 9, 4, 4);
}

function drawCollision(context: CanvasRenderingContext2D, x: number, y: number, size: number) {
  context.fillStyle = 'rgba(255, 95, 122, 0.18)';
  context.fillRect(x, y, size, size);
  context.strokeStyle = 'rgba(255, 95, 122, 0.55)';
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(x + 5, y + 5);
  context.lineTo(x + size - 5, y + size - 5);
  context.moveTo(x + size - 5, y + 5);
  context.lineTo(x + 5, y + size - 5);
  context.stroke();
}

function drawGrid(context: CanvasRenderingContext2D, width: number, height: number, size: number) {
  context.strokeStyle = 'rgba(7, 4, 14, 0.38)';
  context.lineWidth = 1;
  for (let x = 0; x <= width; x += 1) {
    context.beginPath();
    context.moveTo(x * size + 0.5, 0);
    context.lineTo(x * size + 0.5, height * size);
    context.stroke();
  }
  for (let y = 0; y <= height; y += 1) {
    context.beginPath();
    context.moveTo(0, y * size + 0.5);
    context.lineTo(width * size, y * size + 0.5);
    context.stroke();
  }
}
