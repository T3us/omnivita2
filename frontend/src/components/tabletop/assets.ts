import type { Asset, Tileset } from './types';

export const DEFAULT_ASSETS: Asset[] = [
  { id: 'floor-grass', name: 'Grama', kind: 'floor', color: '#2f8f55', stroke: '#58c878', tags: ['externo'] },
  { id: 'floor-path', name: 'Caminho', kind: 'floor', color: '#9f7950', stroke: '#d2aa73', tags: ['externo'] },
  { id: 'floor-stone', name: 'Pedra', kind: 'floor', color: '#6a6f7f', stroke: '#9ba3b5', tags: ['urbano'] },
  { id: 'floor-metal', name: 'Metal', kind: 'floor', color: '#344050', stroke: '#75859e', tags: ['base'] },
  { id: 'wall-hedge', name: 'Cerca viva', kind: 'wall', color: '#164c36', stroke: '#4fc978', tags: ['externo'] },
  { id: 'wall-brick', name: 'Parede', kind: 'wall', color: '#462b48', stroke: '#a78bfa', tags: ['urbano'] },
  { id: 'wall-concrete', name: 'Concreto', kind: 'wall', color: '#34303d', stroke: '#81738d', tags: ['base'] },
  { id: 'prop-tree', name: 'Arvore', kind: 'prop', color: '#19633f', stroke: '#64d987', icon: 'T', tags: ['prop'] },
  { id: 'prop-rock', name: 'Rocha', kind: 'prop', color: '#555062', stroke: '#a9a3b5', icon: 'R', tags: ['prop'] },
  { id: 'prop-crate', name: 'Caixa', kind: 'prop', color: '#76523a', stroke: '#d3a36f', icon: 'C', tags: ['prop'] },
  { id: 'door-metal', name: 'Porta', kind: 'door', color: '#262330', stroke: '#c4b5fd', icon: 'D', tags: ['interacao'] },
  { id: 'cover-low', name: 'Cobertura', kind: 'cover', color: '#4a3c56', stroke: '#f59e0b', icon: 'B', tags: ['combate'] },
  { id: 'terminal-purple', name: 'Terminal', kind: 'terminal', color: '#27124a', stroke: '#a855f7', icon: 'I', tags: ['tecnologia'] },
  { id: 'light-violet', name: 'Luz violeta', kind: 'light', color: '#8b5cf6', stroke: '#ddd6fe', icon: 'L', tags: ['luz'] },
  { id: 'zone-danger', name: 'Zona', kind: 'zone', color: '#7f1d1d', stroke: '#fb7185', icon: 'Z', tags: ['zona'] },
  { id: 'note-master', name: 'Nota', kind: 'note', color: '#31284a', stroke: '#c4b5fd', icon: 'N', tags: ['mestre'] },
  { id: 'fog-cover', name: 'Nevoa', kind: 'fog', color: '#05030a', stroke: '#31284a', tags: ['fog'] }
];

export const DEFAULT_TILESETS: Tileset[] = [
  {
    id: 'forest',
    name: 'Floresta',
    assets: DEFAULT_ASSETS.filter((asset) => ['floor-grass', 'floor-path', 'wall-hedge', 'prop-tree', 'prop-rock', 'cover-low', 'zone-danger', 'note-master'].includes(asset.id))
  },
  {
    id: 'city',
    name: 'Cidade',
    assets: DEFAULT_ASSETS.filter((asset) => ['floor-stone', 'floor-metal', 'wall-brick', 'wall-concrete', 'prop-crate', 'door-metal', 'terminal-purple', 'light-violet', 'note-master'].includes(asset.id))
  },
  {
    id: 'anomaly',
    name: 'Anomalia',
    assets: DEFAULT_ASSETS.filter((asset) => ['floor-metal', 'wall-brick', 'terminal-purple', 'light-violet', 'zone-danger', 'fog-cover', 'note-master', 'cover-low'].includes(asset.id))
  }
];

export function getAsset(assetId: string | undefined, tilesets = DEFAULT_TILESETS): Asset | null {
  if (!assetId) return null;
  for (const tileset of tilesets) {
    const asset = tileset.assets.find((entry) => entry.id === assetId);
    if (asset) return asset;
  }
  return DEFAULT_ASSETS.find((entry) => entry.id === assetId) || null;
}

export function getAssetsByKind(kind: Asset['kind'], tilesets = DEFAULT_TILESETS) {
  const seen = new Set<string>();
  return tilesets.flatMap((tileset) => tileset.assets)
    .filter((asset) => {
      if (asset.kind !== kind || seen.has(asset.id)) return false;
      seen.add(asset.id);
      return true;
    });
}
