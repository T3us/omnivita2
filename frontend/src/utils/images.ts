import type { CharacterSheet } from '../api/types';
import { hydrateCharacter } from '../domain/system';

const IMAGE_OPTIMIZATION = {
  maxDimension: 768,
  outputType: 'image/webp',
  preferredQuality: 0.84,
  minimumQuality: 0.62,
  maxStoredLength: 180_000
};

export interface CharacterImageOptimizationResult {
  character: CharacterSheet;
  changed: boolean;
  optimizedImages: number;
  bytesSaved: number;
}

export async function readFileAsOptimizedDataUrl(file: File): Promise<string> {
  const dataUrl = await readFileAsDataUrl(file);
  return optimizeImageDataUrl(dataUrl);
}

export async function optimizeCharacterImages(character: CharacterSheet): Promise<CharacterImageOptimizationResult> {
  const nextCharacter = hydrateCharacter(clonePlain(character));
  let changed = false;
  let optimizedImages = 0;
  let bytesSaved = 0;

  async function applyOptimizedImage(target: { image?: string; omnivitaSilhouette?: string }, field: 'image' | 'omnivitaSilhouette' = 'image') {
    const current = String(target[field] || '');
    if (!current.startsWith('data:image/')) return;
    const optimized = await optimizeImageDataUrl(current);
    if (optimized === current) return;
    target[field] = optimized;
    changed = true;
    optimizedImages += 1;
    bytesSaved += Math.max(0, current.length - optimized.length);
  }

  await applyOptimizedImage(nextCharacter.identity);
  for (const companion of nextCharacter.companions) {
    await applyOptimizedImage(companion);
    await applyOptimizedImage(companion, 'omnivitaSilhouette');
  }

  return {
    character: nextCharacter,
    changed,
    optimizedImages,
    bytesSaved
  };
}

export async function optimizeImageDataUrl(dataUrl: string): Promise<string> {
  const rawDataUrl = String(dataUrl || '');
  if (!rawDataUrl.startsWith('data:image/')) return rawDataUrl;
  if (rawDataUrl.length <= IMAGE_OPTIMIZATION.maxStoredLength) return rawDataUrl;

  const image = await loadImageFromDataUrl(rawDataUrl);
  let { width, height } = normalizeImageDimensions(image.naturalWidth, image.naturalHeight, IMAGE_OPTIMIZATION.maxDimension);
  let quality = IMAGE_OPTIMIZATION.preferredQuality;
  let bestAttempt = rawDataUrl;

  while (width >= 128 && height >= 128) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { alpha: true });
    if (!context) break;

    context.clearRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    while (quality >= IMAGE_OPTIMIZATION.minimumQuality) {
      const attempt = canvas.toDataURL(IMAGE_OPTIMIZATION.outputType, quality);
      if (attempt.length < bestAttempt.length) bestAttempt = attempt;
      if (attempt.length <= IMAGE_OPTIMIZATION.maxStoredLength) return attempt;
      quality = Math.round((quality - 0.06) * 100) / 100;
    }

    width = Math.round(width * 0.82);
    height = Math.round(height * 0.82);
    quality = IMAGE_OPTIMIZATION.preferredQuality;
  }

  return bestAttempt;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('Nao foi possivel ler a imagem selecionada.'));
    reader.readAsDataURL(file);
  });
}

function loadImageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Nao foi possivel processar a imagem selecionada.'));
    image.src = dataUrl;
  });
}

function normalizeImageDimensions(width: number, height: number, maxDimension: number) {
  const safeWidth = Math.max(1, Number(width || 0));
  const safeHeight = Math.max(1, Number(height || 0));
  const ratio = Math.min(1, maxDimension / Math.max(safeWidth, safeHeight));
  return {
    width: Math.max(1, Math.round(safeWidth * ratio)),
    height: Math.max(1, Math.round(safeHeight * ratio))
  };
}

function clonePlain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value || null)) as T;
}
