export const TABLETOP_TILE_SIZE = 32;
export const TABLETOP_DEFAULT_WIDTH = 30;
export const TABLETOP_DEFAULT_HEIGHT = 22;

export type TabletopMode = 'view' | 'edit';
export type TabletopLayerKey = 'ground' | 'objects' | 'collision';
export type TabletopTokenKind = 'player' | 'npc' | 'enemy';

export interface TabletopTileDefinition {
  id: string;
  name: string;
  tileset: string;
  layer: Exclude<TabletopLayerKey, 'collision'>;
  colors: [string, string, string];
  pattern: 'flat' | 'grass' | 'stone' | 'wood' | 'water' | 'wall' | 'object' | 'roof' | 'custom';
  blocksMovement?: boolean;
  imageSrc?: string;
}

export interface TabletopTileset {
  id: string;
  name: string;
  tiles: TabletopTileDefinition[];
}

export interface TabletopLayers {
  ground: string[][];
  objects: (string | null)[][];
  collision: boolean[][];
}

export interface TabletopToken {
  id: string;
  npcId: string;
  x: number;
  y: number;
  name: string;
  hp: number;
  maxHp: number;
  image: string;
  kind: TabletopTokenKind;
}

export interface TabletopAvailableToken {
  npcId: string;
  name: string;
  hp: number;
  maxHp: number;
  image: string;
  kind: TabletopTokenKind;
}

export interface TabletopMapState {
  version: 1;
  id: string;
  name: string;
  gridWidth: number;
  gridHeight: number;
  tileSize: number;
  layers: TabletopLayers;
  tokens: TabletopToken[];
  customTiles: TabletopTileDefinition[];
  updatedAt: string;
}

export const TABLETOP_ERASER_TILE = '__eraser__';
