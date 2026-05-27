import { buildMapObject, createBlankMap, normalizeMap, setTileCell } from './mapFactory';
import type { MapObject, MapSummary, OmniMap, TileLayerKey } from './types';

type BlueprintTileLayer = 'floor' | 'detail' | 'wall' | 'object';
type BlueprintObjectLayer = 'object' | 'detail' | 'light';

export type MapBlueprint = {
  id: string;
  name: string;
  description?: string;
  width: number;
  height: number;
  gridSize: number;
  tags: string[];
  tiles: Array<{ asset: string; x: number; y: number; w?: number; h?: number; layer?: BlueprintTileLayer; rotation?: number }>;
  walls?: Array<{ asset: string; x: number; y: number; w?: number; h?: number; blocksMovement?: boolean; blocksVision?: boolean }>;
  doors?: Array<{ asset: string; x: number; y: number; w?: number; h?: number; open?: boolean; locked?: boolean; blocksMovement?: boolean; blocksVision?: boolean }>;
  props?: Array<{ asset: string; x: number; y: number; w?: number; h?: number; rotation?: number; layer?: BlueprintObjectLayer }>;
  lights?: Array<{ preset: string; x: number; y: number; radius: number; color?: string; gmOnly?: boolean }>;
  notes?: Array<{ title: string; text: string; x: number; y: number; gmOnly?: boolean }>;
};

export const DEFAULT_MAP_BLUEPRINTS: MapBlueprint[] = [
  {
    id: 'default-whitechapel-street',
    name: 'Rua de Whitechapel',
    description: 'Rua molhada de paralelepipedo, calcadas laterais, sarjeta central, postes de gas e lixo de rua.',
    width: 24,
    height: 12,
    gridSize: 32,
    tags: ['london', '1888', 'whitechapel', 'rua', 'exterior'],
    tiles: [
      rect('london-1888-cobblestone-wet', 0, 2, 24, 8),
      rect('london-1888-sidewalk-light', 0, 0, 24, 2),
      rect('london-1888-sidewalk-light', 0, 10, 24, 2),
      rect('london-1888-gutter', 0, 5, 24, 1),
      one('london-1888-water-puddle', 6, 6, 2, 1),
      one('london-1888-water-puddle', 14, 4, 2, 1),
      one('london-1888-rain-blood', 19, 7, 2, 1),
      one('london-1888-newspaper-ground', 9, 3),
      one('london-1888-newspaper-ground', 17, 8)
    ],
    props: [
      prop('london-1888-gas-lamp-post', 3, 1),
      prop('london-1888-gas-lamp-post', 20, 10),
      prop('london-1888-crate', 2, 9),
      prop('london-1888-barrel', 22, 2),
      prop('london-1888-street-sign', 11, 1)
    ],
    lights: [
      light('london-1888-gas-lamp-yellow', 3, 1, 144, '#facc15'),
      light('london-1888-gas-lamp-yellow', 20, 10, 144, '#facc15')
    ]
  },
  {
    id: 'default-whitechapel-alley',
    name: 'Beco de Whitechapel',
    description: 'Beco estreito vertical com paredes de tijolo umido, lixo, caixas e luz fraca.',
    width: 8,
    height: 18,
    gridSize: 32,
    tags: ['london', '1888', 'beco', 'whitechapel', 'escuro'],
    tiles: [rect('london-1888-street-mud', 1, 0, 6, 18), one('london-1888-water-puddle', 3, 8, 2, 1), one('london-1888-newspaper-ground', 4, 13)],
    walls: [wall('london-1888-wet-brick', 0, 0, 1, 18), wall('london-1888-wet-brick', 7, 0, 1, 18)],
    props: [prop('london-1888-crate', 2, 5), prop('london-1888-crate', 5, 10), prop('london-1888-barrel', 1, 14), prop('london-1888-gas-lamp-post', 4, 9)],
    lights: [light('london-1888-gas-lamp-yellow', 4, 9, 104, '#f8d67a')],
    notes: [note('Marcas de arrasto', 'Ha marcas de arrasto no chao, seguindo para o fundo do beco.', 3, 12)]
  },
  {
    id: 'default-victorian-pub',
    name: 'Pub Vitoriano',
    description: 'Interior de pub com balcao, mesas, lareira e entrada dupla.',
    width: 16,
    height: 12,
    gridSize: 32,
    tags: ['london', '1888', 'pub', 'interior'],
    tiles: [rect('london-1888-old-planks', 1, 1, 14, 10)],
    walls: [wall('london-1888-poor-wood-wall', 0, 0, 16, 1), wall('london-1888-poor-wood-wall', 0, 11, 16, 1), wall('london-1888-red-brick', 0, 0, 1, 12), wall('london-1888-red-brick', 15, 0, 1, 12)],
    doors: [door('london-1888-double-victorian-door', 7, 11, 2, 1, true)],
    props: [
      prop('london-1888-pub-counter', 10, 2, 4, 1),
      prop('london-1888-small-table', 3, 3), prop('london-1888-simple-chair', 3, 2), prop('london-1888-simple-chair', 4, 3),
      prop('london-1888-small-table', 5, 8), prop('london-1888-simple-chair', 4, 8), prop('london-1888-simple-chair', 6, 8),
      prop('london-1888-small-table', 8, 6), prop('london-1888-simple-chair', 8, 5), prop('london-1888-simple-chair', 9, 6),
      prop('london-1888-barrel', 13, 4), prop('london-1888-barrel', 14, 4)
    ],
    lights: [light('london-1888-fireplace-light', 1, 1, 160, '#fb923c'), light('london-1888-candle', 8, 6, 96, '#fef3c7')],
    notes: [note('Livro do caixa', 'A gaveta atras do balcao tem uma carta nao enviada.', 12, 3)]
  },
  {
    id: 'default-cheap-lodging',
    name: 'Hospedaria Barata',
    description: 'Common lodging house pobre, com corredor, quartos pequenos e camas simples.',
    width: 14,
    height: 14,
    gridSize: 32,
    tags: ['london', '1888', 'lodging', 'hospedaria', 'interior'],
    tiles: [rect('london-1888-old-planks', 1, 1, 12, 12), rect('london-1888-cobblestone-dry', 6, 1, 2, 12)],
    walls: [wall('london-1888-poor-wood-wall', 0, 0, 14, 1), wall('london-1888-poor-wood-wall', 0, 13, 14, 1), wall('london-1888-poor-wood-wall', 0, 0, 1, 14), wall('london-1888-poor-wood-wall', 13, 0, 1, 14), wall('london-1888-poor-wood-wall', 5, 1, 1, 12), wall('london-1888-poor-wood-wall', 8, 1, 1, 12)],
    doors: [door('london-1888-poor-wood-door', 5, 3), door('london-1888-poor-wood-door', 8, 4), door('london-1888-poor-wood-door', 5, 9), door('london-1888-poor-wood-door', 8, 10)],
    props: [prop('london-1888-simple-bed', 2, 2, 2, 2), prop('london-1888-simple-bed', 10, 2, 2, 2), prop('london-1888-simple-bed', 2, 8, 2, 2), prop('london-1888-simple-bed', 10, 8, 2, 2), prop('london-1888-small-table', 3, 5), prop('london-1888-small-table', 10, 11), prop('london-1888-open-letter', 11, 9)],
    lights: [light('london-1888-candle', 7, 6, 96, '#fef3c7')],
    notes: [note('Diario escondido', 'Diario escondido sob o colchao do quarto leste.', 10, 9)]
  },
  {
    id: 'default-institute-corridor',
    name: 'Corredor do Instituto',
    description: 'Corredor limpo e frio de instituto, com portas para salas de pesquisa.',
    width: 20,
    height: 8,
    gridSize: 32,
    tags: ['instituto', 'laboratorio', 'interior', 'omnivita'],
    tiles: [rect('london-1888-laboratory-floor', 1, 1, 18, 6)],
    walls: [wall('london-1888-iron-bars', 0, 0, 20, 1), wall('london-1888-iron-bars', 0, 7, 20, 1)],
    doors: [door('london-1888-iron-door', 3, 0, 1, 1, false, true), door('london-1888-iron-door', 9, 0), door('london-1888-iron-door', 15, 7)],
    props: [prop('london-1888-street-sign', 4, 1), prop('london-1888-street-sign', 10, 6), prop('london-1888-street-sign', 16, 6)],
    lights: [light('light-cold', 4, 4, 128, '#67e8f9'), light('light-cold', 10, 4, 128, '#67e8f9'), light('light-cold', 16, 4, 128, '#67e8f9')],
    notes: [note('Porta trancada', 'A fechadura vibra com uma frequencia muito baixa.', 3, 1)]
  },
  {
    id: 'default-institute-lab',
    name: 'Laboratorio do Instituto',
    description: 'Sala de laboratorio com bancadas, frascos, maca e luz anomala.',
    width: 16,
    height: 14,
    gridSize: 32,
    tags: ['instituto', 'laboratorio', 'ciencia', 'omnivita'],
    tiles: [rect('london-1888-laboratory-floor', 1, 1, 14, 12)],
    walls: [wall('london-1888-iron-bars', 0, 0, 16, 1), wall('london-1888-iron-bars', 0, 13, 16, 1), wall('london-1888-iron-bars', 0, 0, 1, 14), wall('london-1888-iron-bars', 15, 0, 1, 14)],
    doors: [door('london-1888-iron-door', 7, 13)],
    props: [prop('london-1888-chem-bench', 2, 2, 3, 1), prop('london-1888-chem-bench', 11, 2, 3, 1), prop('london-1888-lab-table', 6, 6, 4, 2), prop('london-1888-bookcase', 13, 8, 1, 2), prop('london-1888-open-letter', 8, 7)],
    lights: [light('light-cold', 4, 4, 128, '#67e8f9'), light('london-1888-gas-lamp-yellow', 8, 7, 180, '#55f6c8')],
    notes: [note('Energia residual', 'A energia residual nao parece eletrica.', 8, 7)]
  },
  {
    id: 'default-investigation-office',
    name: 'Escritorio Investigativo',
    description: 'Escritorio vitoriano com mesa, estante, mapa de Londres e pistas.',
    width: 12,
    height: 10,
    gridSize: 32,
    tags: ['london', '1888', 'escritorio', 'investigacao'],
    tiles: [rect('london-1888-old-planks', 1, 1, 10, 8), rect('london-1888-dark-red-carpet', 4, 3, 4, 3)],
    walls: [wall('london-1888-victorian-wallpaper', 0, 0, 12, 1), wall('london-1888-victorian-wallpaper', 0, 9, 12, 1), wall('london-1888-victorian-wallpaper', 0, 0, 1, 10), wall('london-1888-victorian-wallpaper', 11, 0, 1, 10)],
    doors: [door('london-1888-double-victorian-door', 5, 9, 2, 1, true)],
    props: [prop('london-1888-small-table', 5, 4, 2, 1), prop('london-1888-simple-chair', 5, 6), prop('london-1888-bookcase', 1, 1, 1, 2), prop('london-1888-bookcase', 10, 1, 1, 2), prop('london-1888-open-letter', 6, 4), prop('london-1888-newspaper-ground', 7, 4), prop('london-1888-street-sign', 2, 1)],
    lights: [light('london-1888-candle', 6, 4, 104, '#fef3c7')]
  },
  {
    id: 'default-slum-court',
    name: 'Patio Interno / Court',
    description: 'Patio interno pobre entre predios, com chao sujo, portas, janelas e lixo.',
    width: 16,
    height: 16,
    gridSize: 32,
    tags: ['london', '1888', 'court', 'slum', 'exterior'],
    tiles: [rect('london-1888-street-mud', 2, 2, 12, 12), one('london-1888-water-puddle', 4, 9, 2, 1), one('london-1888-rain-blood', 11, 6, 2, 1)],
    walls: [wall('london-1888-wet-brick', 0, 0, 16, 1), wall('london-1888-wet-brick', 0, 15, 16, 1), wall('london-1888-wet-brick', 0, 0, 1, 16), wall('london-1888-wet-brick', 15, 0, 1, 16)],
    doors: [door('london-1888-poor-wood-door', 3, 0), door('london-1888-poor-wood-door', 12, 15), door('london-1888-poor-wood-door', 0, 7), door('london-1888-poor-wood-door', 15, 8)],
    props: [prop('london-1888-broken-window', 6, 0), prop('london-1888-broken-window', 10, 15), prop('london-1888-crate', 3, 12), prop('london-1888-barrel', 12, 3), prop('london-1888-newspaper-ground', 8, 8), prop('london-1888-gas-lamp-post', 8, 2)],
    lights: [light('london-1888-gas-lamp-yellow', 8, 2, 112, '#f8d67a')]
  }
];

const DEFAULT_MAPS = DEFAULT_MAP_BLUEPRINTS.map(blueprintToSavedMap);

export function seedDefaultSavedMaps(existing: MapSummary[] = []): MapSummary[] {
  const existingIds = new Set(existing.map((entry) => entry.id));
  const defaults = DEFAULT_MAPS.filter((map) => !existingIds.has(map.id)).map(mapToSummary);
  return [...defaults, ...existing];
}

export function getDefaultSavedMap(mapId: string): OmniMap | null {
  const map = DEFAULT_MAPS.find((entry) => entry.id === mapId);
  return map ? JSON.parse(JSON.stringify(map)) as OmniMap : null;
}

export function isDefaultSavedMap(mapId: string) {
  return DEFAULT_MAPS.some((entry) => entry.id === mapId);
}

export function blueprintToSavedMap(blueprint: MapBlueprint): OmniMap {
  const map = createBlankMap(blueprint.name, blueprint.width, blueprint.height, blueprint.gridSize);
  map.id = blueprint.id;
  map.description = blueprint.description;
  map.tags = blueprint.tags;
  map.bounds = { x: 0, y: 0, width: blueprint.width, height: blueprint.height };
  map.thumbnail = createBlueprintThumbnail(blueprint);
  map.mode = 'build';

  blueprint.tiles.forEach((entry) => applyTile(map, entry.asset, entry.x, entry.y, entry.w, entry.h, resolveTileLayer(entry.layer), entry.rotation));
  blueprint.walls?.forEach((entry) => applyTile(map, entry.asset, entry.x, entry.y, entry.w, entry.h, 'walls', 0, {
    blocksMovement: entry.blocksMovement ?? true,
    blocksVision: entry.blocksVision ?? true
  }));
  blueprint.doors?.forEach((entry) => applyTile(map, entry.asset, entry.x, entry.y, entry.w, entry.h, 'doors', 0, {
    doorState: entry.locked ? 'locked' : entry.open ? 'open' : 'closed',
    blocksMovement: entry.blocksMovement ?? !entry.open,
    blocksVision: entry.blocksVision ?? !entry.open,
    interactable: true
  }));
  blueprint.props?.forEach((entry, index) => {
    const object = buildBlueprintObject(map, entry.asset, entry.x, entry.y, entry.w, entry.h, entry.layer || 'object', index);
    object.rotation = entry.rotation || 0;
    pushObject(map, object);
  });
  blueprint.lights?.forEach((entry, index) => {
    const object = buildBlueprintObject(map, entry.preset, entry.x, entry.y, 1, 1, 'light', 500 + index);
    object.light = {
      id: `light-${blueprint.id}-${index}`,
      x: object.x,
      y: object.y,
      radius: entry.radius,
      intensity: 0.65,
      color: entry.color || object.color || '#facc15',
      visibleToPlayers: !entry.gmOnly,
      gmOnly: Boolean(entry.gmOnly)
    };
    object.visibleToPlayers = !entry.gmOnly;
    object.hiddenFromPlayers = Boolean(entry.gmOnly);
    pushObject(map, object);
  });
  blueprint.notes?.forEach((entry, index) => {
    const object = buildBlueprintObject(map, 'note-master', entry.x, entry.y, 1, 1, 'detail', 800 + index);
    object.kind = 'note';
    object.layer = 'notes';
    object.name = entry.title;
    object.note = entry.text;
    object.visibleToPlayers = !entry.gmOnly;
    object.hiddenFromPlayers = entry.gmOnly !== false;
    pushObject(map, object);
  });

  return normalizeMap(map);
}

function applyTile(map: OmniMap, assetId: string, x: number, y: number, w = 1, h = 1, layer: TileLayerKey, rotation = 0, meta: Partial<ReturnType<typeof setTileCell>[number]> = {}) {
  const safeAsset = validateAsset(map, assetId, layer === 'walls' ? 'wall-brick' : layer === 'doors' ? 'door-metal' : 'london-1888-cobblestone-dry');
  for (let yy = y; yy < y + Math.max(1, h); yy += 1) {
    for (let xx = x; xx < x + Math.max(1, w); xx += 1) {
      if (xx < 0 || yy < 0 || xx >= map.width || yy >= map.height) continue;
      map.tileLayers[layer].cells = setTileCell(map.tileLayers[layer].cells, xx, yy, safeAsset, rotation, { w: 1, h: 1 }, meta);
    }
  }
}

function buildBlueprintObject(map: OmniMap, assetId: string, x: number, y: number, w = 1, h = 1, layer: BlueprintObjectLayer, zIndex = 0) {
  const safeAsset = validateAsset(map, assetId, layer === 'light' ? 'light-cold' : 'crate-urban');
  const objectLayer = layer === 'detail' ? 'details' : layer === 'light' ? 'lighting' : 'objects';
  const object = buildMapObject(safeAsset, x * map.gridSize, y * map.gridSize, objectLayer, zIndex, map.tilesets);
  object.width = Math.max(1, w) * map.gridSize;
  object.height = Math.max(1, h) * map.gridSize;
  return object;
}

function pushObject(map: OmniMap, object: MapObject) {
  if (object.layer === 'lighting') map.lightingLayer.objects.push(object);
  else if (object.layer === 'details') map.detailLayer.objects.push(object);
  else if (object.layer === 'notes') map.notesLayer.objects.push(object);
  else map.objectLayer.objects.push(object);
}

function validateAsset(map: OmniMap, assetId: string, fallback: string) {
  const exists = map.tilesets.some((tileset) => tileset.assets.some((asset) => asset.id === assetId));
  if (!exists) {
    console.warn(`[OmniVita tabletop] Asset de blueprint nao encontrado: ${assetId}. Usando ${fallback}.`);
    return fallback;
  }
  return assetId;
}

function mapToSummary(map: OmniMap): MapSummary & { tags?: string[]; description?: string; thumbnail?: string; isDefault?: boolean } {
  return {
    id: map.id,
    name: map.name,
    width: map.width,
    height: map.height,
    gridSize: map.gridSize,
    mode: 'build',
    tokens: 0,
    objects: map.objectLayer.objects.length + map.detailLayer.objects.length + map.lightingLayer.objects.length + map.notesLayer.objects.length,
    tags: map.tags,
    description: map.description,
    thumbnail: map.thumbnail,
    isDefault: true
  };
}

function resolveTileLayer(layer?: BlueprintTileLayer): TileLayerKey {
  if (layer === 'wall') return 'walls';
  return 'floor';
}

function createBlueprintThumbnail(blueprint: MapBlueprint) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 64"><rect width="96" height="64" fill="#0a0611"/><rect x="6" y="6" width="84" height="52" rx="7" fill="#171020" stroke="#8b5cf6" stroke-opacity=".55"/><text x="48" y="34" fill="#c4b5fd" font-family="Arial" font-size="10" font-weight="700" text-anchor="middle">${escapeSvg(blueprint.name.slice(0, 18))}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function escapeSvg(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[char] || char));
}

function rect(asset: string, x: number, y: number, w: number, h: number, layer?: BlueprintTileLayer) {
  return { asset, x, y, w, h, layer };
}

function one(asset: string, x: number, y: number, w = 1, h = 1, layer?: BlueprintTileLayer) {
  return { asset, x, y, w, h, layer };
}

function wall(asset: string, x: number, y: number, w = 1, h = 1) {
  return { asset, x, y, w, h, blocksMovement: true, blocksVision: true };
}

function door(asset: string, x: number, y: number, w = 1, h = 1, open = false, locked = false) {
  return { asset, x, y, w, h, open, locked, blocksMovement: !open, blocksVision: !open };
}

function prop(asset: string, x: number, y: number, w = 1, h = 1, layer: BlueprintObjectLayer = 'object') {
  return { asset, x, y, w, h, layer };
}

function light(preset: string, x: number, y: number, radius: number, color?: string, gmOnly = false) {
  return { preset, x, y, radius, color, gmOnly };
}

function note(title: string, text: string, x: number, y: number, gmOnly = true) {
  return { title, text, x, y, gmOnly };
}
