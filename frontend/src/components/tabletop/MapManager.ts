import { normalizeTabletopMap } from './mapStore';
import type { TabletopMapState } from './types';

const TABLETOP_STORAGE_KEY = 'omnivita-tabletop-maps-v1';

export interface SavedTabletopMapSummary {
  id: string;
  name: string;
  updatedAt: string;
  gridWidth: number;
  gridHeight: number;
}

export function loadSavedTabletopMaps(): SavedTabletopMapSummary[] {
  const records = readStorage();
  return Object.values(records)
    .map((map) => ({
      id: map.id,
      name: map.name,
      updatedAt: map.updatedAt,
      gridWidth: map.gridWidth,
      gridHeight: map.gridHeight
    }))
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function saveTabletopMap(map: TabletopMapState, name = map.name) {
  const records = readStorage();
  const normalized = normalizeTabletopMap({
    ...map,
    name,
    updatedAt: new Date().toISOString()
  });
  records[normalized.id] = normalized;
  writeStorage(records);
  return normalized;
}

export function loadTabletopMap(id: string) {
  const map = readStorage()[id];
  return map ? normalizeTabletopMap(map) : null;
}

export function deleteTabletopMap(id: string) {
  const records = readStorage();
  delete records[id];
  writeStorage(records);
}

export function exportTabletopMap(map: TabletopMapState) {
  const safeName = (map.name || 'mapa')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'mapa';
  const blob = new Blob([JSON.stringify(normalizeTabletopMap(map), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `omnivita-tabletop-${safeName}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function readTabletopMapFile(file: File) {
  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('JSON de mapa invalido.');
  }
  return validateImportedMap(parsed);
}

export function validateImportedMap(value: unknown) {
  if (!value || typeof value !== 'object') throw new Error('Arquivo sem mapa valido.');
  const candidate = value as Partial<TabletopMapState>;
  if (!candidate.layers || !candidate.gridWidth || !candidate.gridHeight) {
    throw new Error('Arquivo nao parece ser um mapa de mesa do OmniVita.');
  }
  return normalizeTabletopMap(candidate);
}

function readStorage(): Record<string, TabletopMapState> {
  try {
    const raw = localStorage.getItem(TABLETOP_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, Partial<TabletopMapState>>;
    return Object.fromEntries(Object.entries(parsed).map(([id, map]) => [id, normalizeTabletopMap(map)]));
  } catch {
    return {};
  }
}

function writeStorage(records: Record<string, TabletopMapState>) {
  localStorage.setItem(TABLETOP_STORAGE_KEY, JSON.stringify(records));
}
