import type { Asset, AssetTheme, AssetTypeCategory, MapLayerKey, SnapMode, Tileset } from './types';

const ASSET_PATH = '/tabletop-assets';

type AssetInput = {
  id: string;
  name: string;
  typeCategory: AssetTypeCategory;
  theme?: AssetTheme;
  image?: string;
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
  zIndexDefault?: number;
  proceduralKind?: string;
  pattern?: string;
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
  const imageUrl = input.image ? `${ASSET_PATH}/${input.image}` : '';
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
    zIndexDefault: input.zIndexDefault,
    defaultOpacity: input.opacity,
    proceduralKind: input.proceduralKind,
    pattern: input.pattern,
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

  asset({ id: 'table-metal', name: 'Mesa metalica', typeCategory: 'furniture', theme: 'instituto', image: 'table-metal.png', layer: 'objects', width: 128, height: 80, kind: 'prop', tags: ['movel', 'mesa'], snapMode: 'fine', blocksMovement: true, givesCover: true, color: '#3a3347', stroke: '#c4b5fd' }),
  asset({ id: 'bench-lab', name: 'Bancada', typeCategory: 'furniture', theme: 'laboratorio-canal', image: 'bench-lab.png', layer: 'objects', width: 144, height: 64, kind: 'prop', tags: ['movel', 'bancada'], snapMode: 'fine', blocksMovement: true, givesCover: true, color: '#293241', stroke: '#67e8f9' }),
  asset({ id: 'crate-urban', name: 'Caixa', typeCategory: 'prop', theme: 'urbano', image: 'crate-urban.png', layer: 'objects', width: 72, height: 72, kind: 'prop', tags: ['prop', 'cobertura'], snapMode: 'fine', blocksMovement: true, givesCover: true, color: '#76523a', stroke: '#d3a36f' }),
  asset({ id: 'chair-dark', name: 'Cadeira', typeCategory: 'furniture', theme: 'generico', image: 'chair-dark.png', layer: 'objects', width: 48, height: 48, kind: 'prop', tags: ['movel', 'cadeira'], snapMode: 'fine', blocksMovement: true, color: '#393041', stroke: '#a78bfa' }),
  asset({ id: 'terminal-purple', name: 'Terminal', typeCategory: 'mechanic', theme: 'instituto', image: 'terminal-purple.png', layer: 'mechanics', width: 72, height: 64, kind: 'terminal', tags: ['tecnologia', 'interacao'], snapMode: 'fine', blocksMovement: true, interactable: true, color: '#27124a', stroke: '#a855f7' }),
  asset({ id: 'door-metal', name: 'Porta metalica 2x1', typeCategory: 'door', theme: 'urbano', image: 'door-metal.png', layer: 'doors', width: 64, height: 32, kind: 'door', tags: ['porta', 'metal', 'entrada'], snapMode: 'grid', gridFootprint: { w: 2, h: 1 }, orientations: [0, 90, 180, 270], blocksMovement: true, blocksVision: true, interactable: true, color: '#262330', stroke: '#ddd6fe' }),
  asset({ id: 'door-metal-single', name: 'Porta metalica 1x1', typeCategory: 'door', theme: 'instituto', image: 'door-metal.png', layer: 'doors', width: 32, height: 32, kind: 'door', tags: ['porta', 'metal', 'pequena'], snapMode: 'grid', gridFootprint: { w: 1, h: 1 }, orientations: [0, 90, 180, 270], blocksMovement: true, blocksVision: true, interactable: true, color: '#262330', stroke: '#ddd6fe' }),
  asset({ id: 'door-baixo-scrap', name: 'Porta improvisada 1x1', typeCategory: 'door', theme: 'cidade-baixo', image: 'door-metal.png', layer: 'doors', width: 32, height: 32, kind: 'door', tags: ['porta', 'sucata', 'beco'], snapMode: 'grid', gridFootprint: { w: 1, h: 1 }, orientations: [0, 90, 180, 270], blocksMovement: true, blocksVision: true, interactable: true, color: '#3b2636', stroke: '#f59e0b' }),
  asset({ id: 'cover-low', name: 'Cobertura baixa', typeCategory: 'mechanic', theme: 'urbano', image: 'crate-urban.png', layer: 'mechanics', width: 96, height: 40, kind: 'cover', tags: ['combate', 'cobertura'], snapMode: 'free', blocksMovement: true, givesCover: true, color: '#4a3c56', stroke: '#f59e0b' }),
  asset({ id: 'tube-canal', name: 'Tubo do canal', typeCategory: 'prop', theme: 'laboratorio-canal', image: 'tube-canal.png', layer: 'objects', width: 96, height: 40, kind: 'prop', tags: ['tubo', 'maquina', 'canal'], snapMode: 'fine', blocksMovement: true, blocksVision: false, givesCover: true, color: '#0f172a', stroke: '#67e8f9' }),

  asset({ id: 'paper-scattered', name: 'Papeis soltos', typeCategory: 'detail', theme: 'generico', image: 'paper-scattered.png', layer: 'details', width: 48, height: 36, kind: 'decal', tags: ['papel', 'detalhe', 'mesa'], snapMode: 'free' }),
  asset({ id: 'book-open', name: 'Livro aberto', typeCategory: 'detail', theme: 'generico', image: 'book-open.png', layer: 'details', width: 48, height: 40, kind: 'decal', tags: ['livro', 'mesa', 'detalhe'], snapMode: 'free' }),
  asset({ id: 'symbol-violet', name: 'Simbolo violeta', typeCategory: 'detail', theme: 'alienigena', image: 'symbol-violet.png', layer: 'details', width: 64, height: 64, kind: 'decal', tags: ['simbolo', 'anomalia'], snapMode: 'free', opacity: 0.82, color: '#6d28d9', stroke: '#ddd6fe' }),
  asset({ id: 'stain-dark', name: 'Mancha escura', typeCategory: 'detail', theme: 'generico', image: 'stain-dark.png', layer: 'details', width: 80, height: 52, kind: 'decal', tags: ['sujeira', 'mancha'], snapMode: 'free', opacity: 0.72, color: '#100a14', stroke: '#352241' }),
  asset({ id: 'shadow-soft', name: 'Sombra suave', typeCategory: 'detail', theme: 'generico', image: 'shadow-soft.png', layer: 'details', width: 128, height: 72, kind: 'shadow', tags: ['sombra'], snapMode: 'free', opacity: 0.42, color: '#05030a', stroke: '#05030a' }),

  asset({ id: 'light-violet', name: 'Luz violeta', typeCategory: 'light', theme: 'alienigena', image: 'light-violet.png', layer: 'lighting', width: 96, height: 96, kind: 'light', tags: ['luz', 'omnivita'], snapMode: 'free', opacity: 0.9, color: '#8b5cf6', stroke: '#ddd6fe' }),
  asset({ id: 'light-cold', name: 'Luz fria', typeCategory: 'light', theme: 'instituto', image: 'light-cold.png', layer: 'lighting', width: 96, height: 96, kind: 'light', tags: ['luz', 'fria'], snapMode: 'free', opacity: 0.84, color: '#67e8f9', stroke: '#cffafe' }),
  asset({ id: 'zone-danger', name: 'Zona de risco', typeCategory: 'mechanic', theme: 'zona-profunda', image: 'zone-danger.png', layer: 'mechanics', width: 96, height: 96, kind: 'zone', tags: ['zona', 'perigo'], snapMode: 'free', opacity: 0.24, color: '#7f1d1d', stroke: '#fb7185' }),
  asset({ id: 'note-master', name: 'Nota secreta', typeCategory: 'note', theme: 'generico', image: 'note-master.png', layer: 'notes', width: 48, height: 48, kind: 'note', tags: ['mestre', 'nota'], snapMode: 'free', color: '#31284a', stroke: '#c4b5fd' }),
  asset({ id: 'fog-cover', name: 'Fog manual', typeCategory: 'fog', theme: 'generico', image: 'fog-cover.png', layer: 'fog', width: 64, height: 64, kind: 'fog', tags: ['fog'], color: '#05030a', stroke: '#31284a' }),
  ...createLondon1888Assets()
];

type LondonAssetSpec = {
  id: string;
  name: string;
  typeCategory: AssetTypeCategory;
  layer: MapLayerKey;
  kind?: Asset['kind'];
  tags: string[];
  color: string;
  stroke: string;
  footprint?: { w: number; h: number };
  snapMode?: SnapMode;
  blocksMovement?: boolean;
  blocksVision?: boolean;
  givesCover?: boolean;
  interactable?: boolean;
  opacity?: number;
  proceduralKind?: string;
  pattern?: string;
};

function createLondon1888Assets(): Asset[] {
  const streetTags = ['london', 'londres', '1888', 'victorian', 'vitoriano', 'whitechapel'];
  const floors: AssetInput[] = [
    londonFloor('cobblestone-dry', 'Paralelepipedo seco', '#4a4650', '#716b76', ['rua', 'street', 'paralelepipedo']),
    londonFloor('cobblestone-wet', 'Paralelepipedo molhado', '#24232b', '#5f6574', ['rua', 'street', 'molhado', 'chuva']),
    londonFloor('cobblestone-dark', 'Paralelepipedo escuro', '#191820', '#4a4354', ['rua', 'street', 'escuro']),
    londonFloor('street-mud', 'Lama de rua', '#4b3828', '#7a593b', ['rua', 'lama']),
    londonFloor('mud-straw', 'Lama com palha', '#5a4328', '#b08a4d', ['rua', 'lama', 'palha']),
    londonFloor('packed-dirt', 'Rua de terra batida', '#5b4935', '#8a7358', ['rua', 'terra']),
    londonFloor('sidewalk-light', 'Calcada de pedra clara', '#6b6871', '#a9a4ae', ['calcada', 'sidewalk']),
    londonFloor('sidewalk-dark', 'Calcada de pedra escura', '#38363f', '#77727f', ['calcada', 'sidewalk']),
    londonFloor('curbstone', 'Meio-fio', '#56515b', '#b5acba', ['calcada', 'meio-fio']),
    londonFloor('gutter', 'Sarjeta', '#222029', '#5d5563', ['sarjeta', 'rua']),
    londonFloor('drain-grate', 'Bueiro/vazao', '#1c1b20', '#8c8794', ['bueiro', 'drenagem'], { w: 1, h: 1 }),
    londonFloor('carriage-ruts', 'Trilho de carruagem na lama', '#493421', '#8b6b43', ['carruagem', 'lama']),
    londonFloor('train-track-straight-h', 'Trilho reto horizontal', '#2f2b26', '#a7a7a7', ['trilho', 'rail', 'train_track', 'industrial'], { w: 2, h: 1 }, 'train_track_h'),
    londonFloor('train-track-straight-v', 'Trilho reto vertical', '#2f2b26', '#a7a7a7', ['trilho', 'rail', 'train_track', 'industrial'], { w: 1, h: 2 }, 'train_track_v'),
    londonFloor('train-track-curve', 'Trilho curva', '#2f2b26', '#a7a7a7', ['trilho', 'rail', 'train_track', 'industrial', 'curva'], { w: 2, h: 2 }, 'train_track_curve'),
    londonFloor('train-track-crossing', 'Trilho cruzamento', '#2f2b26', '#b9b9b9', ['trilho', 'rail', 'train_track', 'industrial', 'cruzamento'], { w: 2, h: 2 }, 'train_track_cross'),
    londonFloor('train-track-broken', 'Trilho quebrado', '#332a22', '#8d8d8d', ['trilho', 'rail', 'train_track', 'quebrado'], { w: 2, h: 1 }, 'train_track_broken'),
    londonFloor('loose-sleepers', 'Dormentes soltos', '#3a2a1f', '#9b6b45', ['trilho', 'rail', 'dormentes'], { w: 1, h: 1 }, 'rail_sleepers'),
    londonFloor('wet-train-track', 'Trilho molhado', '#24262a', '#c0c7cc', ['trilho', 'rail', 'train_track', 'molhado'], { w: 2, h: 1 }, 'train_track_wet'),
    londonFloor('street-tram-track', 'Trilho de rua/tram', '#343038', '#b3b5bd', ['trilho', 'rail', 'tram', 'rua'], { w: 2, h: 1 }, 'tram_track'),
    londonFloor('water-puddle', 'Poca d agua', '#18212b', '#5b9db3', ['poca', 'chuva'], { w: 2, h: 1 }),
    londonFloor('oil-puddle', 'Poca oleosa', '#111116', '#5c4d87', ['poca', 'oleo'], { w: 2, h: 1 }),
    londonFloor('rain-blood', 'Sangue diluido na chuva', '#321016', '#8f2a33', ['pista', 'sangue', 'chuva'], { w: 2, h: 1 }),
    londonFloor('alley-irregular-stone', 'Pedra irregular de beco', '#3a3440', '#746a79', ['beco', 'alley']),
    londonFloor('broken-slab', 'Laje quebrada', '#46414a', '#9a909c', ['beco', 'quebrado']),
    londonFloor('dirty-alley-floor', 'Chao sujo de beco', '#28232a', '#5a4d55', ['beco', 'sujo']),
    londonFloor('trash-floor', 'Chao com lixo', '#352a26', '#76624b', ['beco', 'lixo']),
    londonFloor('old-newspaper-floor', 'Chao com jornal velho', '#403d34', '#b1a77f', ['beco', 'jornal']),
    londonFloor('inner-courtyard', 'Chao de patio interno', '#3f3941', '#756d74', ['courtyard', 'cortico']),
    londonFloor('tenement-courtyard', 'Chao de courtyard/cortico', '#342f2d', '#6d6257', ['courtyard', 'cortico']),
    londonFloor('old-planks', 'Tabua de madeira velha', '#49321f', '#8a6137', ['interior', 'madeira']),
    londonFloor('wet-dark-planks', 'Tabua escura umida', '#241b18', '#5b4034', ['interior', 'madeira', 'umido']),
    londonFloor('broken-planks', 'Tabua quebrada', '#3b281c', '#9b6a3d', ['interior', 'madeira', 'quebrado']),
    londonFloor('cheap-room-floor', 'Piso de quarto barato', '#402b20', '#7d5739', ['quarto', 'hospedaria']),
    londonFloor('lodging-floor', 'Piso de hospedaria', '#35251e', '#704d37', ['lodging', 'hospedaria']),
    londonFloor('poor-kitchen-floor', 'Piso de cozinha pobre', '#3f372f', '#746554', ['cozinha', 'pobre']),
    londonFloor('torn-rug', 'Tapete rasgado', '#512b35', '#9a5e6a', ['tapete', 'interior'], { w: 2, h: 2 }),
    londonFloor('simple-linoleum', 'Linoleo antigo simples', '#4f5147', '#858878', ['interior', 'linoleo']),
    londonFloor('polished-wood', 'Madeira polida', '#5b341d', '#c58a4d', ['interior', 'rico']),
    londonFloor('dark-red-carpet', 'Carpete vermelho escuro', '#4b1022', '#9f4560', ['carpete', 'rico']),
    londonFloor('dark-green-carpet', 'Carpete verde escuro', '#163b2a', '#5f8d70', ['carpete', 'rico']),
    londonFloor('dark-blue-carpet', 'Carpete azul escuro', '#17264b', '#5a74ac', ['carpete', 'rico']),
    londonFloor('black-white-marble', 'Marmore preto/branco', '#d4d0c8', '#242126', ['marmore', 'rico']),
    londonFloor('victorian-tile', 'Ladrilho vitoriano', '#5b2738', '#d9c088', ['ladrilho', 'victorian']),
    londonFloor('hospital-tile', 'Ladrilho hospitalar', '#c9d2cf', '#6f8985', ['hospital', 'instituto']),
    londonFloor('laboratory-floor', 'Piso de laboratorio', '#26323a', '#82a6b8', ['laboratorio', 'lab']),
    londonFloor('office-floor', 'Piso de escritorio', '#3f2c22', '#8d6950', ['escritorio']),
    londonFloor('wet-dock-wood', 'Madeira molhada de cais', '#2c211b', '#6f5948', ['doca', 'dock']),
    londonFloor('dock-stone', 'Pedra de doca', '#343941', '#69727f', ['doca', 'dock']),
    londonFloor('wet-tunnel-brick', 'Tijolo de tunel umido', '#2f2624', '#72544d', ['esgoto', 'sewer', 'tunel']),
    londonFloor('sewer-sludge', 'Lodo de esgoto', '#24311f', '#536d3f', ['esgoto', 'sewer']),
    londonFloor('dark-water', 'Agua escura', '#0d1d25', '#2d6673', ['agua', 'esgoto'], { w: 2, h: 2 }),
    londonFloor('shallow-canal', 'Canal raso', '#122832', '#3b7d8f', ['canal', 'agua'], { w: 2, h: 2 }),
    londonFloor('drain-grid', 'Grelha de drenagem', '#18191d', '#6d7480', ['drenagem', 'esgoto'])
  ];

  const walls: AssetInput[] = [
    londonWall('red-brick', 'Parede de tijolo vermelho', '#5d2f2a', '#b65d50'),
    londonWall('dark-brick', 'Parede de tijolo escuro', '#2b2225', '#67515a'),
    londonWall('wet-brick', 'Parede de tijolo molhado', '#312729', '#7c6268'),
    londonWall('broken-brick', 'Parede de tijolo quebrado', '#4a2927', '#c47a68'),
    londonWall('stone-wall', 'Parede de pedra', '#4a4650', '#8f8995'),
    londonWall('wet-stone-wall', 'Parede de pedra umida', '#33363c', '#6e7a83'),
    londonWall('poor-wood-wall', 'Parede de madeira pobre', '#3a291f', '#8a6344'),
    londonWall('noble-wood-wall', 'Parede de madeira nobre', '#4e2b18', '#c07a3e'),
    londonWall('victorian-wallpaper', 'Parede com papel de parede vitoriano', '#4b2942', '#b57fa8'),
    londonWall('mold-wall', 'Parede com mofo', '#2f3a2d', '#78956e'),
    londonWall('cracked-wall', 'Parede com rachadura', '#4a4146', '#9b8f96'),
    londonWall('warehouse-wall', 'Parede de armazem', '#3d332e', '#8a7163'),
    londonWall('pub-wall', 'Parede de pub', '#4a251d', '#aa7358'),
    londonWall('institute-wall', 'Parede de hospital/instituto', '#2d3340', '#9aa6b8'),
    londonWall('lab-wall', 'Parede de laboratorio', '#253843', '#70a7ba'),
    londonWall('low-alley-wall', 'Muro baixo de beco', '#382b2b', '#826360', { w: 1, h: 1 }),
    londonWall('high-alley-wall', 'Muro alto de beco', '#241c1e', '#6d5458'),
    londonWall('iron-fence', 'Cerca de ferro', '#171921', '#8b95a7'),
    londonWall('iron-bars', 'Grade de ferro', '#11141b', '#a2aabc'),
    londonWall('iron-gate-wall', 'Portao de ferro', '#171821', '#b7bdc9'),
    londonWall('sewer-tunnel-wall', 'Parede de esgoto/tunel', '#25302c', '#5f746a')
  ];

  const doorsAndWindows: AssetInput[] = [
    londonDoor('simple-wood-door', 'Porta de madeira simples', '#4a2f1f', '#b57b4f', ['porta']),
    londonDoor('poor-wood-door', 'Porta de madeira pobre', '#38251c', '#865d43', ['porta', 'pobre']),
    londonDoor('tenement-door', 'Porta de cortico', '#2e211d', '#7d5b46', ['porta', 'cortico']),
    londonDoor('pub-door', 'Porta de pub', '#512515', '#c27b43', ['porta', 'pub']),
    londonDoor('office-door', 'Porta de escritorio', '#3c2418', '#a06b45', ['porta', 'escritorio']),
    londonDoor('institute-door', 'Porta de instituto', '#252d3b', '#9eafc6', ['porta', 'instituto']),
    londonDoor('lab-door', 'Porta de laboratorio', '#203743', '#72bdd1', ['porta', 'laboratorio', 'lab']),
    londonDoor('cell-door', 'Porta de cela', '#151820', '#9aa3b3', ['porta', 'cela']),
    londonDoor('iron-door', 'Porta de ferro', '#161922', '#9ca3af', ['porta', 'ferro']),
    londonDoor('secret-door', 'Porta secreta', '#2b2225', '#6d5560', ['porta', 'secreta']),
    londonDoor('double-victorian-door', 'Porta dupla vitoriana', '#542c1d', '#d29a62', ['porta', 'vitoriano'], { w: 2, h: 1 }),
    londonDoor('trapdoor', 'Alcapao', '#33271d', '#907052', ['alcapao'], { w: 1, h: 1 }),
    londonDoor('alley-gate', 'Portao de beco', '#181a20', '#9aa3b3', ['portao', 'beco']),
    londonDoor('tall-iron-gate', 'Portao de ferro alto', '#11141b', '#aab3c3', ['portao', 'ferro'], { w: 2, h: 1 }),
    londonWindow('small-window', 'Janela pequena', '#1d2530', '#a9c2d2'),
    londonWindow('sash-window', 'Janela de guilhotina', '#25313d', '#c2d4df'),
    londonWindow('broken-window', 'Janela quebrada', '#18222b', '#7dd3fc'),
    londonWindow('curtain-window', 'Janela com cortina', '#32243a', '#d8b4fe'),
    londonWindow('pub-window', 'Janela de pub', '#342010', '#f6c177'),
    londonWindow('shop-window', 'Vitrine de loja', '#1a2c36', '#8ed0e6', { w: 2, h: 1 }),
    londonWindow('skylight', 'Claraboia', '#1d2a35', '#a7d8e8', { w: 2, h: 2 }),
    londonWindow('barred-window', 'Grade de janela', '#161a22', '#9aa3b3')
  ];

  const streetProps = makeProps([
    ['gas-lamp-post', 'Poste de gas', '#29231a', '#f7d774', ['rua', 'luz'], { w: 1, h: 1 }, true],
    ['gas-lamp-off', 'Poste de gas apagado', '#252326', '#706a5e', ['rua', 'luz'], { w: 1, h: 1 }, true],
    ['broken-gas-lamp', 'Poste de gas quebrado', '#1f1d21', '#756b60', ['rua', 'quebrado'], { w: 1, h: 1 }, true],
    ['street-bench', 'Banco de rua', '#3a2517', '#a87449', ['rua', 'banco'], { w: 2, h: 1 }, true],
    ['postbox', 'Caixa de correio vitoriana', '#5d111a', '#d44b5a', ['rua', 'correio'], { w: 1, h: 1 }, true],
    ['water-pump', 'Hidrante/bomba d agua', '#1b2930', '#7db6c9', ['rua', 'agua'], { w: 1, h: 1 }, true],
    ['barrel', 'Barril', '#5a351e', '#c1844d', ['rua', 'pub'], { w: 1, h: 1 }, true],
    ['crate', 'Caixote', '#5c3a21', '#c28a55', ['rua', 'caixote'], { w: 1, h: 1 }, true],
    ['crate-stack', 'Pilha de caixotes', '#6a4226', '#d39a62', ['rua', 'caixote'], { w: 2, h: 2 }, true],
    ['coal-sack', 'Saco de carvao', '#1f1f20', '#5e5e61', ['rua', 'carvao'], { w: 1, h: 1 }, true],
    ['trash-basket', 'Lixeira/cesto', '#3b3328', '#8c785d', ['rua', 'lixo'], { w: 1, h: 1 }, true],
    ['street-trash', 'Lixo de rua', '#342e28', '#7b6a55', ['rua', 'lixo'], { w: 1, h: 1 }, false],
    ['newspaper-ground', 'Jornal no chao', '#c9bea0', '#746c58', ['jornal', 'pista'], { w: 1, h: 1 }, false],
    ['wall-poster', 'Cartaz na parede', '#c4a676', '#7c5f38', ['cartaz'], { w: 1, h: 1 }, false],
    ['street-sign', 'Placa de rua', '#1e2f3d', '#9fc8df', ['placa', 'rua'], { w: 1, h: 1 }, false],
    ['pub-sign', 'Placa de pub', '#4b2114', '#f0b45e', ['placa', 'pub'], { w: 1, h: 1 }, false],
    ['lodging-sign', 'Placa Lodging House', '#2f251d', '#d6b583', ['placa', 'lodging', 'hospedaria'], { w: 1, h: 1 }, false],
    ['police-sign', 'Placa Police', '#182f4d', '#9cc3ef', ['placa', 'police'], { w: 1, h: 1 }, false],
    ['apothecary-sign', 'Placa Apothecary', '#173f31', '#8bd9a8', ['placa', 'apothecary'], { w: 1, h: 1 }, false],
    ['butcher-sign', 'Placa Butcher', '#4a1720', '#e88790', ['placa', 'butcher'], { w: 1, h: 1 }, false],
    ['tailor-sign', 'Placa Tailor', '#1d2f4b', '#a8bfeb', ['placa', 'tailor'], { w: 1, h: 1 }, false],
    ['shop-window-prop', 'Vitrine', '#182c35', '#9ed7e8', ['loja', 'vitrine'], { w: 2, h: 1 }, true],
    ['market-stall', 'Barraca de feira', '#4f2f1e', '#d99c5b', ['feira', 'rua'], { w: 2, h: 2 }, true],
    ['wheelbarrow', 'Carrinho de mao', '#3b2b20', '#aa7b50', ['rua'], { w: 2, h: 1 }, true],
    ['vendor-cart', 'Carrinho de vendedor', '#53341f', '#d19862', ['rua', 'feira'], { w: 2, h: 2 }, true],
    ['small-carriage', 'Charrete pequena', '#2f2118', '#9f704b', ['carruagem'], { w: 2, h: 3 }, true],
    ['hansom-cab', 'Hansom cab 2x3', '#241b16', '#b88755', ['carruagem', 'hansom'], { w: 2, h: 3 }, true],
    ['omnibus', 'Omnibus 2x4', '#3a1e17', '#c88a56', ['carruagem', 'omnibus'], { w: 2, h: 4 }, true],
    ['tied-horse', 'Cavalo amarrado', '#4a3020', '#a47855', ['cavalo'], { w: 2, h: 2 }, true],
    ['cab-shelter', 'Cab shelter pequeno', '#2b241d', '#8b7458', ['rua'], { w: 2, h: 2 }, true],
    ['mud-decor', 'Poca/lama decorativa', '#3b2d20', '#76583b', ['lama'], { w: 2, h: 1 }, false],
    ['wood-pile', 'Pilha de madeira', '#4a2f1d', '#b37b4d', ['madeira'], { w: 2, h: 1 }, true],
    ['leaning-ladder', 'Escada encostada', '#3d2a1d', '#b98555', ['escada'], { w: 1, h: 2 }, true],
    ['improvised-barricade', 'Barricada improvisada', '#3c2f27', '#a88460', ['barricada', 'cobertura'], { w: 2, h: 1 }, true]
  ], 'street');

  const interiors = makeProps([
    ['simple-bed', 'Cama simples', '#4b2f22', '#b28062', ['quarto', 'pobre'], { w: 2, h: 3 }, true],
    ['floor-mattress', 'Colchao no chao', '#5c4b43', '#a89383', ['quarto', 'pobre'], { w: 2, h: 2 }, true],
    ['small-table', 'Mesa pequena', '#4a2e1e', '#b37b4e', ['mesa'], { w: 1, h: 1 }, true],
    ['simple-chair', 'Cadeira simples', '#3c281d', '#9d6c47', ['cadeira'], { w: 1, h: 1 }, true],
    ['stool', 'Banco', '#3a2518', '#91623f', ['banco'], { w: 1, h: 1 }, true],
    ['worn-wardrobe', 'Armario gasto', '#3b261a', '#8f6142', ['armario'], { w: 1, h: 2 }, true],
    ['chest', 'Bau', '#402819', '#b0794a', ['bau'], { w: 1, h: 1 }, true],
    ['small-stove', 'Fogao pequeno', '#1d1d1f', '#77777c', ['cozinha'], { w: 1, h: 1 }, true],
    ['basin', 'Bacia', '#6f6b61', '#c6c0ae', ['cozinha'], { w: 1, h: 1 }, false],
    ['bucket', 'Balde', '#3d4148', '#8c97a3', ['cozinha'], { w: 1, h: 1 }, false],
    ['indoor-clothesline', 'Varal interno', '#5b5249', '#d7cbb7', ['quarto'], { w: 2, h: 1 }, false],
    ['old-blanket', 'Cobertor velho', '#513442', '#a06a7f', ['quarto'], { w: 1, h: 1 }, false],
    ['pub-counter', 'Balcao de pub', '#4a2517', '#c47c48', ['pub'], { w: 3, h: 1 }, true],
    ['round-table', 'Mesa redonda', '#4b2d1a', '#ba7c43', ['pub', 'mesa'], { w: 2, h: 2 }, true],
    ['rect-table', 'Mesa retangular', '#432717', '#b47540', ['pub', 'mesa'], { w: 2, h: 1 }, true],
    ['bar-stool', 'Banqueta', '#3e2619', '#a86f45', ['pub'], { w: 1, h: 1 }, true],
    ['beer-barrel', 'Barril de cerveja', '#5b351c', '#d0924e', ['pub', 'barril'], { w: 1, h: 1 }, true],
    ['bottle-shelf', 'Prateleira de garrafas', '#2e2018', '#8fd3e6', ['pub', 'garrafas'], { w: 2, h: 1 }, true],
    ['fireplace', 'Lareira', '#2a1a14', '#ff9f43', ['pub', 'luz'], { w: 2, h: 1 }, true],
    ['upright-piano', 'Piano vertical', '#1c1514', '#8c715d', ['pub', 'piano'], { w: 2, h: 1 }, true],
    ['crooked-painting', 'Quadro torto', '#2d2431', '#b89464', ['interior'], { w: 1, h: 1 }, false],
    ['room-stairs', 'Escada para quartos', '#3a261b', '#9f6d45', ['hospedaria'], { w: 2, h: 2 }, true],
    ['room-key-rack', 'Chaveiro de quartos', '#30241d', '#d4aa69', ['hospedaria', 'chave'], { w: 1, h: 1 }, false],
    ['guest-book', 'Livro de hospedes', '#c5b18a', '#745c3d', ['hospedaria', 'livro'], { w: 1, h: 1 }, false],
    ['writing-desk', 'Escrivaninha', '#3d2417', '#b57b4f', ['escritorio'], { w: 2, h: 1 }, true],
    ['upholstered-chair', 'Cadeira estofada', '#34233a', '#a57cc0', ['escritorio'], { w: 1, h: 1 }, true],
    ['bookcase', 'Estante de livros', '#2f2118', '#b68d5c', ['escritorio', 'livros'], { w: 1, h: 2 }, true],
    ['filing-cabinet', 'Arquivo/gaveteiro', '#30353d', '#9aa3af', ['escritorio'], { w: 1, h: 1 }, true],
    ['meeting-table', 'Mesa de reuniao', '#432818', '#c0824d', ['escritorio'], { w: 3, h: 2 }, true],
    ['noble-rug', 'Tapete nobre', '#4b1530', '#c7869f', ['rico', 'tapete'], { w: 3, h: 2 }, false],
    ['globe', 'Globo terrestre', '#243452', '#8fb1d9', ['escritorio'], { w: 1, h: 1 }, true],
    ['safe', 'Cofre', '#20242b', '#9ca3af', ['cofre'], { w: 1, h: 1 }, true],
    ['pendulum-clock', 'Relogio de pendulo', '#352014', '#d09a61', ['relogio'], { w: 1, h: 2 }, true],
    ['old-telephone', 'Telefone antigo', '#121214', '#8b8b92', ['telefone'], { w: 1, h: 1 }, false],
    ['telegraph', 'Telegrafo', '#2f2117', '#d7b071', ['telegrafo'], { w: 1, h: 1 }, false],
    ['typewriter', 'Maquina de escrever', '#18191c', '#9da3ad', ['escritorio'], { w: 1, h: 1 }, false],
    ['cork-board', 'Quadro de cortica', '#6b4428', '#c99158', ['pista', 'escritorio'], { w: 2, h: 1 }, false],
    ['london-wall-map', 'Mapa de Londres na parede', '#21324a', '#9dc0e8', ['london', 'mapa'], { w: 2, h: 1 }, false],
    ['lab-table', 'Mesa de laboratorio', '#26333b', '#88aeba', ['laboratorio', 'lab'], { w: 2, h: 1 }, true],
    ['chem-bench', 'Bancada quimica', '#21313b', '#77c4d8', ['laboratorio', 'lab'], { w: 3, h: 1 }, true],
    ['flasks', 'Frascos', '#2c3d43', '#8ee2d0', ['laboratorio', 'frascos'], { w: 1, h: 1 }, false],
    ['test-tubes', 'Tubos de ensaio', '#22343d', '#9be7ff', ['laboratorio'], { w: 1, h: 1 }, false],
    ['microscope', 'Microscopio', '#1b1d22', '#b7c2d0', ['laboratorio'], { w: 1, h: 1 }, false],
    ['scale', 'Balanca', '#20242a', '#d6c8a0', ['laboratorio'], { w: 1, h: 1 }, false],
    ['small-cage', 'Jaula pequena', '#171a20', '#9aa3b3', ['laboratorio'], { w: 1, h: 1 }, true],
    ['glass-tank', 'Tanque de vidro', '#122936', '#8ad7ef', ['laboratorio'], { w: 2, h: 1 }, true],
    ['strange-generator', 'Gerador estranho', '#1c1930', '#a78bfa', ['laboratorio', 'anomalia'], { w: 2, h: 2 }, true],
    ['electric-coil', 'Bobina eletrica', '#1a2231', '#7dd3fc', ['laboratorio', 'eletrico'], { w: 1, h: 1 }, true],
    ['stretcher', 'Maca', '#2f3338', '#c7c9c7', ['laboratorio', 'hospital'], { w: 2, h: 1 }, true],
    ['autopsy-table', 'Mesa de autopsia', '#24292e', '#d7dedb', ['laboratorio', 'autopsia'], { w: 2, h: 1 }, true],
    ['medicine-cabinet', 'Armario de remedios', '#27343a', '#9dc8c9', ['laboratorio', 'remedios'], { w: 1, h: 2 }, true],
    ['surgical-tools', 'Caixa de instrumentos cirurgicos', '#2c2b2d', '#c4c4c4', ['laboratorio', 'cirurgico'], { w: 1, h: 1 }, false]
  ], 'interior');

  const clues = makeDetails([
    ['open-letter', 'Carta aberta', '#d5c39d', '#7d6b4c', ['carta', 'pista']],
    ['sealed-letter', 'Carta lacrada', '#cfbd94', '#9b2f3a', ['carta', 'pista']],
    ['envelope', 'Envelope', '#d6c59e', '#7d7155', ['carta', 'pista']],
    ['diary', 'Diario', '#4a2e1d', '#b88a58', ['diario', 'pista']],
    ['newspaper', 'Jornal', '#c8bea0', '#6b6250', ['jornal', 'pista']],
    ['newspaper-clipping', 'Recorte de jornal', '#d1c7a9', '#766d59', ['jornal', 'pista']],
    ['torn-note', 'Bilhete rasgado', '#d3c5a5', '#8a7d65', ['bilhete', 'pista']],
    ['old-photo', 'Fotografia antiga', '#6d6256', '#d9c7ab', ['foto', 'pista']],
    ['key', 'Chave', '#b99748', '#f4d06f', ['chave', 'pista']],
    ['rusty-key', 'Chave enferrujada', '#8a5a2b', '#c07d3b', ['chave', 'pista']],
    ['keyring', 'Chaveiro', '#9b7a3d', '#e0bb5d', ['chave', 'pista']],
    ['cloth-piece', 'Pedaco de tecido', '#5b2635', '#b36b82', ['tecido', 'pista']],
    ['blood-stain', 'Mancha de sangue', '#4a0e16', '#b91c1c', ['sangue', 'pista']],
    ['mud-footprint', 'Pegada na lama', '#3a271b', '#7a5135', ['pegada', 'pista']],
    ['bloody-footprint', 'Pegada com sangue', '#3b1115', '#b9232d', ['pegada', 'sangue', 'pista']],
    ['many-footprints', 'Pegadas multiplas', '#35261d', '#8d6749', ['pegada', 'pista']],
    ['knife', 'Faca', '#202126', '#c6c9d1', ['arma', 'pista']],
    ['razor', 'Navalha', '#22242a', '#d1d5db', ['arma', 'pista']],
    ['syringe', 'Seringa', '#25313a', '#a7d8e8', ['medico', 'pista']],
    ['ampoule', 'Ampola', '#183136', '#70e0c2', ['quimico', 'pista']],
    ['mystery-vial', 'Frasco misterioso', '#1d2736', '#a78bfa', ['quimico', 'pista']],
    ['drawn-symbol', 'Simbolo desenhado', '#23142f', '#c084fc', ['simbolo', 'pista']],
    ['chalk-mark', 'Giz no chao', '#c6c0b5', '#f4efe5', ['giz', 'pista']],
    ['scratch-mark', 'Marca de unha', '#2f2525', '#a37777', ['marca', 'pista']],
    ['hair-thread', 'Cabelo/fio', '#201816', '#8b6f63', ['cabelo', 'pista']],
    ['coin', 'Moeda', '#a2762d', '#f0ca66', ['moeda', 'pista']],
    ['pocket-watch', 'Relogio de bolso', '#9e7a35', '#f2cc68', ['relogio', 'pista']],
    ['locket', 'Medalhao', '#8f6d32', '#e9c56a', ['medalhao', 'pista']],
    ['locked-box', 'Caixa trancada', '#3a2418', '#b07a4f', ['caixa', 'pista']],
    ['medical-bag', 'Maleta medica', '#251718', '#8f3c42', ['medico', 'pista']],
    ['detective-bag', 'Maleta de detetive', '#2b2019', '#98724c', ['detetive', 'pista']]
  ]);

  const lights = [
    londonLight('gas-lamp-yellow', 'Poste de gas amarelo', '#f9d36f', '#fff2a8', ['gas', 'rua']),
    londonLight('weak-gas-lamp', 'Poste de gas fraco', '#b99142', '#f0d37d', ['gas', 'fraco']),
    londonLight('hand-lantern', 'Lampiao de mao', '#f5c86a', '#fff0a8', ['lanterna']),
    londonLight('bullseye-lantern', 'Lanterna bullseye', '#f8d58a', '#fff6c7', ['lanterna', 'cone']),
    londonLight('candle', 'Vela', '#ffe0a3', '#fff4cf', ['vela']),
    londonLight('candelabra', 'Candelabro', '#ffd98b', '#fff1bf', ['candelabro']),
    londonLight('fireplace-light', 'Lareira', '#ff8a3d', '#ffc073', ['lareira', 'pub']),
    londonLight('desk-lamp', 'Lamparina de mesa', '#ffd479', '#fff1ad', ['mesa']),
    londonLight('shop-window-light', 'Luz de vitrine', '#f9e2a0', '#fff7cf', ['vitrine']),
    londonLight('lab-light', 'Luz de laboratorio', '#9de8ff', '#d8f7ff', ['laboratorio', 'lab']),
    londonLight('blue-anomaly', 'Luz azul anomala', '#60a5fa', '#bfdbfe', ['anomalia']),
    londonLight('green-chemical', 'Luz verde quimica', '#4ade80', '#bbf7d0', ['quimico']),
    londonLight('red-danger', 'Luz vermelha de perigo', '#fb7185', '#fecdd3', ['perigo']),
    londonLight('dense-darkness', 'Escuridao densa', '#05030a', '#31284a', ['escuridao'], 0.5),
    londonLight('lit-fog', 'Nevoa iluminada', '#c4b5fd', '#e9d5ff', ['nevoa']),
    londonLight('gm-only-light', 'Luz GM-only', '#8b5cf6', '#ddd6fe', ['gm', 'mestre'])
  ];

  const fog = makeFog([
    ['light-fog', 'Nevoa leve', '#b7c3c8', '#e2e8f0', ['nevoa']],
    ['dense-fog', 'Nevoa densa', '#9aa6ad', '#d8dee3', ['nevoa', 'densa']],
    ['street-fog', 'Nevoa de rua', '#8d99a1', '#cfd8df', ['nevoa', 'rua']],
    ['chimney-smoke', 'Fumaca de chamine', '#6e7378', '#a6adb4', ['fumaca']],
    ['sewer-steam', 'Vapor de bueiro', '#93a3a8', '#d5e1e4', ['vapor', 'bueiro']],
    ['pipe-smoke', 'Fumaca de cachimbo', '#777276', '#bdb7bd', ['fumaca']],
    ['lab-smoke', 'Fumaca de laboratorio', '#7cc5c2', '#c4f1ef', ['laboratorio', 'fumaca']],
    ['light-rain', 'Chuva leve', '#5f7590', '#a8c5e5', ['chuva']],
    ['heavy-rain', 'Chuva forte', '#31465c', '#84a7cc', ['chuva']],
    ['shadow-stain', 'Mancha de sombra', '#05030a', '#1f1730', ['sombra']],
    ['alley-darkness', 'Escuridao de beco', '#040306', '#251936', ['beco', 'escuridao']],
    ['window-glow', 'Brilho de janela', '#f7d784', '#fff3ba', ['janela', 'luz']],
    ['wet-reflection', 'Reflexo molhado', '#2e4454', '#79a8bf', ['reflexo', 'molhado']]
  ]);

  const curatedLondonIds = new Set([
    'london-1888-cobblestone-dry',
    'london-1888-cobblestone-wet',
    'london-1888-sidewalk-light',
    'london-1888-gutter',
    'london-1888-street-mud',
    'london-1888-old-planks',
    'london-1888-dark-red-carpet',
    'london-1888-black-white-marble',
    'london-1888-laboratory-floor',
    'london-1888-water-puddle',
    'london-1888-rain-blood',
    'london-1888-train-track-straight-h',
    'london-1888-train-track-straight-v',
    'london-1888-train-track-curve',
    'london-1888-train-track-crossing',
    'london-1888-red-brick',
    'london-1888-wet-brick',
    'london-1888-poor-wood-wall',
    'london-1888-victorian-wallpaper',
    'london-1888-iron-bars',
    'london-1888-poor-wood-door',
    'london-1888-double-victorian-door',
    'london-1888-iron-door',
    'london-1888-sash-window',
    'london-1888-broken-window',
    'london-1888-gas-lamp-post',
    'london-1888-barrel',
    'london-1888-crate',
    'london-1888-newspaper-ground',
    'london-1888-open-letter',
    'london-1888-street-sign',
    'london-1888-small-table',
    'london-1888-simple-chair',
    'london-1888-simple-bed',
    'london-1888-pub-counter',
    'london-1888-bookcase',
    'london-1888-lab-table',
    'london-1888-chem-bench',
    'london-1888-gas-lamp-yellow',
    'london-1888-candle',
    'london-1888-fireplace-light',
    'london-1888-light-fog',
    'london-1888-alley-darkness'
  ]);

  return [
    ...floors,
    ...walls,
    ...doorsAndWindows,
    ...streetProps,
    ...interiors,
    ...clues,
    ...lights,
    ...fog
  ].map((entry) => asset(entry)).filter((entry) => curatedLondonIds.has(entry.id));

  function londonBase(spec: LondonAssetSpec): AssetInput {
    const footprint = spec.footprint || { w: 1, h: 1 };
    return {
      id: `london-1888-${spec.id}`,
      name: spec.name,
      typeCategory: spec.typeCategory,
      theme: 'urbano',
      layer: spec.layer,
      width: footprint.w * 64,
      height: footprint.h * 64,
      kind: spec.kind,
      snapMode: spec.snapMode,
      gridFootprint: footprint,
      tags: [...streetTags, ...spec.tags],
      blocksMovement: spec.blocksMovement,
      blocksVision: spec.blocksVision,
      givesCover: spec.givesCover,
      interactable: spec.interactable,
      opacity: spec.opacity,
      proceduralKind: spec.proceduralKind || inferLondonProceduralKind(spec),
      pattern: spec.pattern,
      color: spec.color,
      stroke: spec.stroke
    };
  }

  function londonFloor(id: string, name: string, color: string, stroke: string, tags: string[], footprint?: { w: number; h: number }, proceduralKind?: string): AssetInput {
    return londonBase({ id, name, typeCategory: 'floor', layer: 'floor', kind: 'floor', tags: ['chao', 'piso', ...tags], color, stroke, footprint, proceduralKind });
  }

  function londonWall(id: string, name: string, color: string, stroke: string, footprint?: { w: number; h: number }): AssetInput {
    return londonBase({ id, name, typeCategory: 'wall', layer: 'walls', kind: 'wall', tags: ['parede', 'wall'], color, stroke, footprint, blocksMovement: true, blocksVision: true });
  }

  function londonDoor(id: string, name: string, color: string, stroke: string, tags: string[], footprint = { w: 1, h: 1 }): AssetInput {
    return londonBase({ id, name, typeCategory: 'door', layer: 'doors', kind: 'door', tags: ['porta', 'door', ...tags], color, stroke, footprint, blocksMovement: true, blocksVision: true, interactable: true });
  }

  function londonWindow(id: string, name: string, color: string, stroke: string, footprint = { w: 1, h: 1 }): AssetInput {
    return londonBase({ id, name, typeCategory: 'window', layer: 'doors', kind: 'door', tags: ['janela', 'window'], color, stroke, footprint, blocksMovement: false, blocksVision: true, interactable: true });
  }

  function londonLight(id: string, name: string, color: string, stroke: string, tags: string[], opacity = 0.82): AssetInput {
    return londonBase({ id, name, typeCategory: 'light', layer: 'lighting', kind: 'light', tags: ['luz', 'light', ...tags], color, stroke, opacity, snapMode: 'free' });
  }

  function makeProps(items: Array<[string, string, string, string, string[], { w: number; h: number }, boolean]>, packTag: string): AssetInput[] {
    return items.map(([id, name, color, stroke, tags, footprint, solid]) => londonBase({
      id,
      name,
      typeCategory: name.includes('Mesa') || name.includes('Cadeira') || name.includes('Cama') || name.includes('Armario') || name.includes('Balcao') || name.includes('Estante') ? 'furniture' : 'prop',
      layer: 'objects',
      kind: 'prop',
      tags: ['prop', packTag, ...tags],
      color,
      stroke,
      footprint,
      blocksMovement: solid,
      givesCover: solid,
      snapMode: 'fine'
    }));
  }

  function makeDetails(items: Array<[string, string, string, string, string[]]>): AssetInput[] {
    return items.map(([id, name, color, stroke, tags]) => londonBase({
      id,
      name,
      typeCategory: 'detail',
      layer: 'details',
      kind: 'decal',
      tags: ['pista', 'clue', ...tags],
      color,
      stroke,
      footprint: { w: 1, h: 1 },
      snapMode: 'free'
    }));
  }

  function makeFog(items: Array<[string, string, string, string, string[]]>): AssetInput[] {
    return items.map(([id, name, color, stroke, tags]) => londonBase({
      id,
      name,
      typeCategory: 'fog',
      layer: 'fog',
      kind: 'fog',
      tags: ['fog', 'ambiente', ...tags],
      color,
      stroke,
      footprint: { w: 2, h: 2 },
      opacity: 0.42
    }));
  }
}

function inferLondonProceduralKind(spec: LondonAssetSpec): string {
  const text = normalizeProceduralText(`${spec.id} ${spec.name} ${spec.typeCategory} ${spec.layer} ${spec.tags.join(' ')}`);
  if (text.includes('train track straight h') || text.includes('track straight h')) return 'train_track_h';
  if (text.includes('train track straight v') || text.includes('track straight v')) return 'train_track_v';
  if (text.includes('train track curve') || text.includes('trilho curva')) return 'train_track_curve';
  if (text.includes('train track crossing') || text.includes('cruzamento')) return 'train_track_cross';
  if (text.includes('train track broken') || text.includes('trilho quebrado')) return 'train_track_broken';
  if (text.includes('loose sleepers') || text.includes('dormentes')) return 'rail_sleepers';
  if (text.includes('wet train track')) return 'train_track_wet';
  if (text.includes('tram track')) return 'tram_track';
  if (text.includes('trilho') || text.includes(' rail ')) return 'train_track_h';
  if (text.includes('cobblestone') || text.includes('paralelepipedo') || text.includes('irregular stone')) return text.includes('wet') || text.includes('molhado') ? 'wet_cobblestone' : 'cobblestone';
  if (text.includes('mud') || text.includes('lama') || text.includes('sludge') || text.includes('lodo')) return 'mud';
  if (text.includes('sidewalk') || text.includes('calcada')) return 'sidewalk';
  if (text.includes('curb') || text.includes('meio fio')) return 'curb';
  if (text.includes('gutter') || text.includes('sarjeta')) return 'gutter';
  if (text.includes('drain') || text.includes('bueiro') || text.includes('grelha')) return 'drain';
  if (text.includes('puddle') || text.includes('poca') || text.includes('water') || text.includes('agua') || text.includes('canal')) return 'puddle';
  if (text.includes('blood') || text.includes('sangue')) return 'blood';
  if (text.includes('plank') || text.includes('wood') || text.includes('madeira') || text.includes('tabua') || text.includes('dock')) return 'wood_floor';
  if (text.includes('carpet') || text.includes('tapete') || text.includes('rug')) return 'carpet';
  if (text.includes('marble') || text.includes('marmore')) return 'marble';
  if (text.includes('tile') || text.includes('ladrilho') || text.includes('linoleo')) return 'tile_floor';
  if (spec.typeCategory === 'wall' && (text.includes('brick') || text.includes('tijolo'))) return 'brick_wall';
  if (spec.typeCategory === 'wall' && (text.includes('wood') || text.includes('madeira'))) return 'wood_wall';
  if (text.includes('iron') || text.includes('ferro') || text.includes('fence') || text.includes('grade')) return 'iron_bars';
  if (spec.typeCategory === 'wall') return 'stone_wall';
  if (spec.typeCategory === 'door') return text.includes('double') || text.includes('dupla') ? 'double_door' : text.includes('trapdoor') || text.includes('alcapao') ? 'trapdoor' : 'door';
  if (spec.typeCategory === 'window') return text.includes('broken') || text.includes('quebrada') ? 'broken_window' : 'window';
  if (text.includes('gas lamp') || text.includes('poste de gas')) return 'gas_lamp';
  if (text.includes('lamp') || text.includes('lantern') || text.includes('luz') || spec.typeCategory === 'light') return 'light';
  if (text.includes('barrel') || text.includes('barril')) return 'barrel';
  if (text.includes('crate') || text.includes('caixote') || text.includes('box') || text.includes('caixa')) return 'crate';
  if (text.includes('table') || text.includes('mesa') || text.includes('desk') || text.includes('balcao') || text.includes('bench') || text.includes('bancada')) return 'table';
  if (text.includes('chair') || text.includes('cadeira') || text.includes('stool') || text.includes('banco')) return 'chair';
  if (text.includes('bed') || text.includes('cama') || text.includes('mattress') || text.includes('colchao')) return 'bed';
  if (text.includes('book') || text.includes('paper') || text.includes('letter') || text.includes('newspaper') || text.includes('carta') || text.includes('jornal') || text.includes('diario') || text.includes('bilhete') || text.includes('envelope')) return 'paper';
  if (text.includes('footprint') || text.includes('pegada')) return 'footprint';
  if (text.includes('knife') || text.includes('razor') || text.includes('faca') || text.includes('navalha')) return 'blade';
  if (text.includes('key') || text.includes('chave')) return 'key';
  if (text.includes('fog') || text.includes('nevoa') || text.includes('fumaca') || text.includes('vapor') || spec.typeCategory === 'fog') return 'fog';
  if (text.includes('carriage') || text.includes('hansom') || text.includes('omnibus') || text.includes('charrete') || text.includes('carruagem')) return 'vehicle';
  if (text.includes('sign') || text.includes('placa') || text.includes('poster') || text.includes('cartaz')) return 'sign';
  return spec.typeCategory === 'floor' ? 'tile_floor' : spec.typeCategory === 'detail' ? 'paper' : 'prop';
}

function normalizeProceduralText(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[_-]+/g, ' ');
}

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
    zIndexDefault: input.zIndexDefault,
    defaultOpacity: input.defaultOpacity,
    proceduralKind: input.proceduralKind,
    pattern: input.pattern,
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
