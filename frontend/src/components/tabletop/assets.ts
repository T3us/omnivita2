import type { Asset, AssetTheme, AssetTypeCategory, MapLayerKey, SnapMode, Tileset } from './types';

const ASSET_PATH = '/tabletop-assets';

type AssetInput = {
  id: string;
  name: string;
  typeCategory: AssetTypeCategory;
  theme?: AssetTheme;
  image: string;
  layer: MapLayerKey;
  width: number;
  height: number;
  kind?: Asset['kind'];
  snapMode?: SnapMode;
  gridFootprint?: Asset['gridFootprint'];
  orientations?: number[];
  tags?: string[];
  blocksMovement?: boolean;
  blocksVision?: boolean;
  givesCover?: boolean;
  interactable?: boolean;
  opacity?: number;
  color?: string;
  stroke?: string;
};

export const ASSET_TYPE_LABELS: Record<AssetTypeCategory, string> = {
  floor: 'Pisos',
  wall: 'Paredes',
  door: 'Portas',
  window: 'Janelas',
  'door-window': 'Portas e Janelas',
  furniture: 'Moveis',
  prop: 'Props',
  detail: 'Detalhes',
  light: 'Luzes',
  mechanic: 'Mecanica',
  note: 'Notas',
  fog: 'Fog'
};

export const ASSET_THEME_LABELS: Record<AssetTheme, string> = {
  'cidade-baixo': 'Cidade de Baixo',
  instituto: 'Instituto',
  'laboratorio-canal': 'Laboratorio do Canal',
  'zona-profunda': 'Zona Profunda',
  urbano: 'Urbano',
  alienigena: 'Alienigena',
  generico: 'Generico',
  escola: 'Escola',
  esgoto: 'Esgoto'
};

function asset(input: AssetInput): Asset {
  const imageUrl = `${ASSET_PATH}/${input.image}`;
  return {
    id: input.id,
    name: input.name,
    category: ASSET_TYPE_LABELS[input.typeCategory],
    typeCategory: input.typeCategory,
    theme: input.theme || 'generico',
    tags: input.tags || [],
    imageUrl,
    thumbnailUrl: imageUrl,
    defaultLayer: input.layer,
    defaultWidth: input.width,
    defaultHeight: input.height,
    defaultBlocksMovement: Boolean(input.blocksMovement),
    defaultBlocksVision: Boolean(input.blocksVision),
    defaultGivesCover: Boolean(input.givesCover),
    defaultInteractable: Boolean(input.interactable),
    defaultSnapMode: input.snapMode || inferSnapFromType(input.typeCategory),
    gridFootprint: input.gridFootprint,
    orientations: input.orientations,
    defaultOpacity: input.opacity,
    kind: input.kind,
    color: input.color,
    stroke: input.stroke,
    blocksMovement: Boolean(input.blocksMovement),
    blocksVision: Boolean(input.blocksVision),
    givesCover: Boolean(input.givesCover),
    interactable: Boolean(input.interactable)
  };
}

export const DEFAULT_ASSETS: Asset[] = [
  asset({ id: 'floor-baixo-asphalt', name: 'Asfalto umido', typeCategory: 'floor', theme: 'cidade-baixo', image: 'floor-baixo-asphalt.png', layer: 'floor', width: 64, height: 64, kind: 'floor', tags: ['rua', 'escuro', 'chao'], color: '#24232b', stroke: '#3f3d4b' }),
  asset({ id: 'floor-baixo-alley', name: 'Beco manchado', typeCategory: 'floor', theme: 'cidade-baixo', image: 'floor-baixo-alley.png', layer: 'floor', width: 64, height: 64, kind: 'floor', tags: ['rua', 'sujo', 'chao'], color: '#30313a', stroke: '#5b5d69' }),
  asset({ id: 'floor-instituto-tile', name: 'Piso instituto', typeCategory: 'floor', theme: 'instituto', image: 'floor-instituto-tile.png', layer: 'floor', width: 64, height: 64, kind: 'floor', tags: ['limpo', 'interior', 'chao'], color: '#344050', stroke: '#75859e' }),
  asset({ id: 'floor-lab-metal', name: 'Grade metalica', typeCategory: 'floor', theme: 'laboratorio-canal', image: 'floor-lab-metal.png', layer: 'floor', width: 64, height: 64, kind: 'floor', tags: ['metal', 'canal', 'chao'], color: '#1f2937', stroke: '#64748b' }),
  asset({ id: 'floor-profunda-stone', name: 'Rocha profunda', typeCategory: 'floor', theme: 'zona-profunda', image: 'floor-profunda-stone.png', layer: 'floor', width: 64, height: 64, kind: 'floor', tags: ['rocha', 'zona', 'chao'], color: '#202026', stroke: '#47404e' }),
  asset({ id: 'floor-urban-concrete', name: 'Concreto', typeCategory: 'floor', theme: 'urbano', image: 'floor-urban-concrete.png', layer: 'floor', width: 64, height: 64, kind: 'floor', tags: ['urbano', 'base', 'chao'], color: '#5a5664', stroke: '#8c8799' }),

  asset({ id: 'wall-brick', name: 'Parede tijolo', typeCategory: 'wall', theme: 'urbano', image: 'wall-brick.png', layer: 'walls', width: 64, height: 64, kind: 'wall', tags: ['parede'], blocksMovement: true, blocksVision: true, color: '#462b48', stroke: '#a78bfa' }),
  asset({ id: 'wall-institute', name: 'Parede instituto', typeCategory: 'wall', theme: 'instituto', image: 'wall-institute.png', layer: 'walls', width: 64, height: 64, kind: 'wall', tags: ['parede', 'interior'], blocksMovement: true, blocksVision: true, color: '#252334', stroke: '#8b8daa' }),
  asset({ id: 'wall-canal', name: 'Parede do canal', typeCategory: 'wall', theme: 'laboratorio-canal', image: 'wall-canal.png', layer: 'walls', width: 64, height: 64, kind: 'wall', tags: ['parede', 'canal'], blocksMovement: true, blocksVision: true, color: '#1b2430', stroke: '#38bdf8' }),

  asset({ id: 'table-metal', name: 'Mesa metalica', typeCategory: 'furniture', theme: 'instituto', image: 'table-metal.png', layer: 'objects', width: 128, height: 80, kind: 'prop', tags: ['movel', 'mesa'], snapMode: 'free', blocksMovement: true, givesCover: true, color: '#3a3347', stroke: '#c4b5fd' }),
  asset({ id: 'bench-lab', name: 'Bancada', typeCategory: 'furniture', theme: 'laboratorio-canal', image: 'bench-lab.png', layer: 'objects', width: 144, height: 64, kind: 'prop', tags: ['movel', 'bancada'], snapMode: 'free', blocksMovement: true, givesCover: true, color: '#293241', stroke: '#67e8f9' }),
  asset({ id: 'crate-urban', name: 'Caixa', typeCategory: 'prop', theme: 'urbano', image: 'crate-urban.png', layer: 'objects', width: 72, height: 72, kind: 'prop', tags: ['prop', 'cobertura'], snapMode: 'free', blocksMovement: true, givesCover: true, color: '#76523a', stroke: '#d3a36f' }),
  asset({ id: 'chair-dark', name: 'Cadeira', typeCategory: 'furniture', theme: 'generico', image: 'chair-dark.png', layer: 'objects', width: 48, height: 48, kind: 'prop', tags: ['movel', 'cadeira'], snapMode: 'free', blocksMovement: true, color: '#393041', stroke: '#a78bfa' }),
  asset({ id: 'terminal-purple', name: 'Terminal', typeCategory: 'mechanic', theme: 'instituto', image: 'terminal-purple.png', layer: 'mechanics', width: 72, height: 64, kind: 'terminal', tags: ['tecnologia', 'interacao'], snapMode: 'free', blocksMovement: true, interactable: true, color: '#27124a', stroke: '#a855f7' }),
  asset({ id: 'door-metal', name: 'Porta metalica 2x1', typeCategory: 'door', theme: 'urbano', image: 'door-metal.png', layer: 'doors', width: 64, height: 32, kind: 'door', tags: ['porta', 'metal', 'entrada'], snapMode: 'grid', gridFootprint: { w: 2, h: 1 }, orientations: [0, 90, 180, 270], blocksMovement: true, blocksVision: true, interactable: true, color: '#262330', stroke: '#ddd6fe' }),
  asset({ id: 'door-metal-single', name: 'Porta metalica 1x1', typeCategory: 'door', theme: 'instituto', image: 'door-metal.png', layer: 'doors', width: 32, height: 32, kind: 'door', tags: ['porta', 'metal', 'pequena'], snapMode: 'grid', gridFootprint: { w: 1, h: 1 }, orientations: [0, 90, 180, 270], blocksMovement: true, blocksVision: true, interactable: true, color: '#262330', stroke: '#ddd6fe' }),
  asset({ id: 'cover-low', name: 'Cobertura baixa', typeCategory: 'mechanic', theme: 'urbano', image: 'crate-urban.png', layer: 'mechanics', width: 96, height: 40, kind: 'cover', tags: ['combate', 'cobertura'], snapMode: 'free', blocksMovement: true, givesCover: true, color: '#4a3c56', stroke: '#f59e0b' }),
  asset({ id: 'tube-canal', name: 'Tubo do canal', typeCategory: 'prop', theme: 'laboratorio-canal', image: 'tube-canal.png', layer: 'objects', width: 96, height: 40, kind: 'prop', tags: ['tubo', 'maquina', 'canal'], snapMode: 'free', blocksMovement: true, blocksVision: false, givesCover: true, color: '#0f172a', stroke: '#67e8f9' }),

  asset({ id: 'paper-scattered', name: 'Papeis soltos', typeCategory: 'detail', theme: 'generico', image: 'paper-scattered.png', layer: 'details', width: 48, height: 36, kind: 'decal', tags: ['papel', 'detalhe', 'mesa'], snapMode: 'free' }),
  asset({ id: 'book-open', name: 'Livro aberto', typeCategory: 'detail', theme: 'generico', image: 'book-open.png', layer: 'details', width: 48, height: 40, kind: 'decal', tags: ['livro', 'mesa', 'detalhe'], snapMode: 'free' }),
  asset({ id: 'symbol-violet', name: 'Simbolo violeta', typeCategory: 'detail', theme: 'alienigena', image: 'symbol-violet.png', layer: 'details', width: 64, height: 64, kind: 'decal', tags: ['simbolo', 'anomalia'], snapMode: 'free', opacity: 0.82, color: '#6d28d9', stroke: '#ddd6fe' }),
  asset({ id: 'stain-dark', name: 'Mancha escura', typeCategory: 'detail', theme: 'generico', image: 'stain-dark.png', layer: 'details', width: 80, height: 52, kind: 'decal', tags: ['sujeira', 'mancha'], snapMode: 'free', opacity: 0.72, color: '#100a14', stroke: '#352241' }),
  asset({ id: 'shadow-soft', name: 'Sombra suave', typeCategory: 'detail', theme: 'generico', image: 'shadow-soft.png', layer: 'details', width: 128, height: 72, kind: 'shadow', tags: ['sombra'], snapMode: 'free', opacity: 0.42, color: '#05030a', stroke: '#05030a' }),

  asset({ id: 'light-violet', name: 'Luz violeta', typeCategory: 'light', theme: 'alienigena', image: 'light-violet.png', layer: 'lighting', width: 96, height: 96, kind: 'light', tags: ['luz', 'omnivita'], snapMode: 'free', opacity: 0.9, color: '#8b5cf6', stroke: '#ddd6fe' }),
  asset({ id: 'light-cold', name: 'Luz fria', typeCategory: 'light', theme: 'instituto', image: 'light-cold.png', layer: 'lighting', width: 96, height: 96, kind: 'light', tags: ['luz', 'fria'], snapMode: 'free', opacity: 0.84, color: '#67e8f9', stroke: '#cffafe' }),
  asset({ id: 'zone-danger', name: 'Zona de risco', typeCategory: 'mechanic', theme: 'zona-profunda', image: 'zone-danger.png', layer: 'mechanics', width: 96, height: 96, kind: 'zone', tags: ['zona', 'perigo'], snapMode: 'free', opacity: 0.24, color: '#7f1d1d', stroke: '#fb7185' }),
  asset({ id: 'note-master', name: 'Nota secreta', typeCategory: 'note', theme: 'generico', image: 'note-master.png', layer: 'notes', width: 48, height: 48, kind: 'note', tags: ['mestre', 'nota'], snapMode: 'free', color: '#31284a', stroke: '#c4b5fd' }),
  asset({ id: 'fog-cover', name: 'Fog manual', typeCategory: 'fog', theme: 'generico', image: 'fog-cover.png', layer: 'fog', width: 64, height: 64, kind: 'fog', tags: ['fog'], color: '#05030a', stroke: '#31284a' })
];

const categories = Object.values(ASSET_TYPE_LABELS);

export const DEFAULT_TILESETS: Tileset[] = categories.map((category) => ({
  id: normalizeId(category),
  name: category,
  assets: DEFAULT_ASSETS.filter((assetEntry) => assetEntry.category === category)
}));

export function getAsset(assetId: string | undefined, tilesets = DEFAULT_TILESETS): Asset | null {
  if (!assetId) return null;
  for (const tileset of tilesets) {
    const found = tileset.assets.find((entry) => entry.id === assetId);
    if (found) return normalizeAsset(found);
  }
  return normalizeAsset(DEFAULT_ASSETS.find((entry) => entry.id === assetId) || null);
}

export function getAllAssets(tilesets = DEFAULT_TILESETS): Asset[] {
  const seen = new Set<string>();
  return tilesets.flatMap((tileset) => tileset.assets).map(normalizeAsset).filter((assetEntry): assetEntry is Asset => {
    if (!assetEntry || seen.has(assetEntry.id)) return false;
    seen.add(assetEntry.id);
    return true;
  });
}

export function getAssetsByCategory(category: string, tilesets = DEFAULT_TILESETS): Asset[] {
  return getAllAssets(tilesets).filter((assetEntry) => assetEntry.category === category);
}

export function normalizeAsset(input: Partial<Asset> | null | undefined): Asset | null {
  if (!input?.id) return null;
  const kind = input.kind || inferKindFromLayer(input.defaultLayer);
  const defaultLayer = input.defaultLayer || inferLayerFromKind(kind);
  const typeCategory = normalizeTypeCategory(input.typeCategory, input.category, defaultLayer, kind);
  const theme = normalizeTheme(input.theme, input.category);
  const imageUrl = input.imageUrl || input.thumbnailUrl || input.thumbnail || '';
  return {
    id: String(input.id),
    name: String(input.name || 'Asset'),
    category: ASSET_TYPE_LABELS[typeCategory] || String(input.category || 'Customizados'),
    typeCategory,
    theme,
    tags: Array.isArray(input.tags) ? input.tags.map(String) : [],
    imageUrl,
    thumbnailUrl: input.thumbnailUrl || imageUrl,
    defaultLayer,
    defaultWidth: Number(input.defaultWidth || 64),
    defaultHeight: Number(input.defaultHeight || 64),
    defaultBlocksMovement: Boolean(input.defaultBlocksMovement ?? input.blocksMovement),
    defaultBlocksVision: Boolean(input.defaultBlocksVision ?? input.blocksVision),
    defaultGivesCover: Boolean(input.defaultGivesCover ?? input.givesCover),
    defaultInteractable: Boolean(input.defaultInteractable ?? input.interactable),
    defaultSnapMode: normalizeSnapMode(input.defaultSnapMode) || inferSnapFromType(typeCategory),
    gridFootprint: input.gridFootprint,
    orientations: input.orientations,
    defaultOpacity: input.defaultOpacity,
    kind,
    color: input.color,
    stroke: input.stroke,
    icon: input.icon,
    thumbnail: input.thumbnail,
    blocksMovement: Boolean(input.blocksMovement ?? input.defaultBlocksMovement),
    blocksVision: Boolean(input.blocksVision ?? input.defaultBlocksVision),
    givesCover: Boolean(input.givesCover ?? input.defaultGivesCover),
    interactable: Boolean(input.interactable ?? input.defaultInteractable)
  };
}

export function makeCustomAsset(input: Omit<Asset, 'id'> & { id?: string }): Asset {
  return normalizeAsset({
    ...input,
    id: input.id || `asset-custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
  }) as Asset;
}

function inferKindFromLayer(layer?: MapLayerKey): Asset['kind'] {
  if (layer === 'floor') return 'floor';
  if (layer === 'walls') return 'wall';
  if (layer === 'doors') return 'door';
  if (layer === 'lighting') return 'light';
  if (layer === 'notes') return 'note';
  if (layer === 'details') return 'decal';
  if (layer === 'fog') return 'fog';
  return 'prop';
}

function inferLayerFromKind(kind?: Asset['kind']): MapLayerKey {
  if (kind === 'floor') return 'floor';
  if (kind === 'wall') return 'walls';
  if (kind === 'door') return 'doors';
  if (kind === 'decal' || kind === 'shadow') return 'details';
  if (kind === 'light') return 'lighting';
  if (kind === 'note') return 'notes';
  if (kind === 'zone') return 'mechanics';
  if (kind === 'fog') return 'fog';
  return 'objects';
}

function inferSnapFromType(typeCategory: AssetTypeCategory): SnapMode {
  if (typeCategory === 'floor' || typeCategory === 'wall' || typeCategory === 'door' || typeCategory === 'window' || typeCategory === 'door-window' || typeCategory === 'fog') return 'grid';
  return 'free';
}

function normalizeSnapMode(value: unknown): SnapMode | null {
  return value === 'grid' || value === 'fine' || value === 'free' || value === 'object' ? value : null;
}

function normalizeTypeCategory(
  value: unknown,
  legacyCategory: unknown,
  layer: MapLayerKey,
  kind?: Asset['kind']
): AssetTypeCategory {
  if (isAssetTypeCategory(value)) return value;
  const legacy = String(legacyCategory || '').toLowerCase();
  if (legacy.includes('piso')) return 'floor';
  if (legacy.includes('parede')) return 'wall';
  if (legacy.includes('porta')) return 'door';
  if (legacy.includes('janela')) return 'window';
  if (legacy.includes('move')) return 'furniture';
  if (legacy.includes('luz')) return 'light';
  if (legacy.includes('nota')) return 'note';
  if (legacy.includes('fog')) return 'fog';
  if (legacy.includes('decal') || legacy.includes('detalhe')) return 'detail';
  if (kind === 'floor' || layer === 'floor') return 'floor';
  if (kind === 'wall' || layer === 'walls') return 'wall';
  if (kind === 'door' || layer === 'doors') return 'door';
  if (kind === 'light' || layer === 'lighting') return 'light';
  if (kind === 'note' || layer === 'notes') return 'note';
  if (kind === 'fog' || layer === 'fog') return 'fog';
  if (kind === 'decal' || kind === 'shadow' || layer === 'details') return 'detail';
  if (kind === 'zone' || layer === 'mechanics') return 'mechanic';
  return 'prop';
}

function normalizeTheme(value: unknown, legacyCategory: unknown): AssetTheme {
  if (isAssetTheme(value)) return value;
  const legacy = String(legacyCategory || '').toLowerCase();
  if (legacy.includes('baixo')) return 'cidade-baixo';
  if (legacy.includes('instituto')) return 'instituto';
  if (legacy.includes('canal') || legacy.includes('laboratorio')) return 'laboratorio-canal';
  if (legacy.includes('profunda')) return 'zona-profunda';
  if (legacy.includes('urbano')) return 'urbano';
  if (legacy.includes('alien')) return 'alienigena';
  return 'generico';
}

function isAssetTypeCategory(value: unknown): value is AssetTypeCategory {
  return typeof value === 'string' && Object.keys(ASSET_TYPE_LABELS).includes(value);
}

function isAssetTheme(value: unknown): value is AssetTheme {
  return typeof value === 'string' && Object.keys(ASSET_THEME_LABELS).includes(value);
}

function normalizeId(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
