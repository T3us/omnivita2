import type { TabletopTileDefinition, TabletopTileset } from './types';

// Tilesets locais de teste. Quando voce tiver spritesheets definitivos, este arquivo
// pode virar um loader JSON que aponta cada tile para uma imagem PNG/spritesheet.
const forestTiles: TabletopTileDefinition[] = [
  { id: 'forest.grass', name: 'Grama', tileset: 'forest', layer: 'ground', colors: ['#4aa86b', '#2f7a45', '#9ee58d'], pattern: 'grass' },
  { id: 'forest.deep-grass', name: 'Grama densa', tileset: 'forest', layer: 'ground', colors: ['#2f7a45', '#204e32', '#6fc772'], pattern: 'grass' },
  { id: 'forest.path', name: 'Terra clara', tileset: 'forest', layer: 'ground', colors: ['#d4b574', '#a77b46', '#efd08d'], pattern: 'flat' },
  { id: 'forest.water', name: 'Agua', tileset: 'forest', layer: 'ground', colors: ['#4c9bc8', '#2d5f96', '#8fdcff'], pattern: 'water', blocksMovement: true },
  { id: 'forest.tree', name: 'Arvore', tileset: 'forest', layer: 'objects', colors: ['#2c7b38', '#6f4a2c', '#89d46f'], pattern: 'object', blocksMovement: true },
  { id: 'forest.bush', name: 'Moita', tileset: 'forest', layer: 'objects', colors: ['#3d9a56', '#245c35', '#95e083'], pattern: 'object', blocksMovement: true },
  { id: 'forest.rock', name: 'Rocha', tileset: 'forest', layer: 'objects', colors: ['#9da1ad', '#686b78', '#d5d8e2'], pattern: 'object', blocksMovement: true },
  { id: 'forest.flower', name: 'Flores', tileset: 'forest', layer: 'objects', colors: ['#ff9ccf', '#60a86a', '#ffe082'], pattern: 'object' },
  { id: 'forest.fence', name: 'Cerca', tileset: 'forest', layer: 'objects', colors: ['#b77854', '#6f3e2c', '#f0b37f'], pattern: 'object', blocksMovement: true }
];

const cityTiles: TabletopTileDefinition[] = [
  { id: 'city.stone', name: 'Calcada', tileset: 'city', layer: 'ground', colors: ['#b5bac8', '#82889a', '#dce0ec'], pattern: 'stone' },
  { id: 'city.road', name: 'Asfalto', tileset: 'city', layer: 'ground', colors: ['#4f5361', '#2c2f3a', '#7c8291'], pattern: 'stone' },
  { id: 'city.floor', name: 'Piso', tileset: 'city', layer: 'ground', colors: ['#af8f6a', '#806343', '#dbc08e'], pattern: 'flat' },
  { id: 'city.roof', name: 'Telhado', tileset: 'city', layer: 'objects', colors: ['#c36b78', '#7e3545', '#ef9aa0'], pattern: 'roof', blocksMovement: true },
  { id: 'city.wall', name: 'Parede', tileset: 'city', layer: 'objects', colors: ['#8c8fa3', '#585b70', '#c2c6d4'], pattern: 'wall', blocksMovement: true },
  { id: 'city.table', name: 'Mesa', tileset: 'city', layer: 'objects', colors: ['#9d6b43', '#533728', '#d39a62'], pattern: 'object', blocksMovement: true },
  { id: 'city.crate', name: 'Caixote', tileset: 'city', layer: 'objects', colors: ['#a46c3d', '#5d3a24', '#df9f5f'], pattern: 'object', blocksMovement: true },
  { id: 'city.light', name: 'Luz', tileset: 'city', layer: 'objects', colors: ['#f5d36b', '#8b6d2a', '#fff6ad'], pattern: 'object' }
];

const dungeonTiles: TabletopTileDefinition[] = [
  { id: 'dungeon.floor', name: 'Pedra', tileset: 'dungeon', layer: 'ground', colors: ['#6d6678', '#383341', '#a59fb2'], pattern: 'stone' },
  { id: 'dungeon.dark-floor', name: 'Pedra escura', tileset: 'dungeon', layer: 'ground', colors: ['#3d3848', '#211d29', '#676070'], pattern: 'stone' },
  { id: 'dungeon.wood', name: 'Madeira', tileset: 'dungeon', layer: 'ground', colors: ['#8a5a3e', '#4d3328', '#c28c5a'], pattern: 'wood' },
  { id: 'dungeon.wall', name: 'Muralha', tileset: 'dungeon', layer: 'objects', colors: ['#514c5f', '#282431', '#827c91'], pattern: 'wall', blocksMovement: true },
  { id: 'dungeon.corner', name: 'Canto', tileset: 'dungeon', layer: 'objects', colors: ['#6c6474', '#302c37', '#a29ba8'], pattern: 'wall', blocksMovement: true },
  { id: 'dungeon.chest', name: 'Bau', tileset: 'dungeon', layer: 'objects', colors: ['#b97736', '#4d2e1f', '#ffd071'], pattern: 'object', blocksMovement: true },
  { id: 'dungeon.torch', name: 'Tocha', tileset: 'dungeon', layer: 'objects', colors: ['#f47b3f', '#70402d', '#ffe27a'], pattern: 'object' },
  { id: 'dungeon.anomaly', name: 'Fenda', tileset: 'dungeon', layer: 'objects', colors: ['#8b5cf6', '#160824', '#e9d5ff'], pattern: 'object' }
];

export const DEFAULT_TILESETS: TabletopTileset[] = [
  { id: 'forest', name: 'Floresta', tiles: forestTiles },
  { id: 'city', name: 'Cidade', tiles: cityTiles },
  { id: 'dungeon', name: 'Masmorra', tiles: dungeonTiles }
];

export function getTilesetById(id: string) {
  return DEFAULT_TILESETS.find((tileset) => tileset.id === id) || DEFAULT_TILESETS[0];
}

export function getTileDefinition(id: string | null | undefined, customTiles: TabletopTileDefinition[] = []) {
  if (!id) return null;
  return [...DEFAULT_TILESETS.flatMap((tileset) => tileset.tiles), ...customTiles].find((tile) => tile.id === id) || null;
}

export function getAllTileDefinitions(customTiles: TabletopTileDefinition[] = []) {
  return [...DEFAULT_TILESETS.flatMap((tileset) => tileset.tiles), ...customTiles];
}
