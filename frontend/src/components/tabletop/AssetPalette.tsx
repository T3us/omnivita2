import clsx from 'clsx';
import { getAsset } from './assets';
import { useTabletopStore } from './mapStore';
import type { Asset, MapLayerKey } from './types';

const layerOptions: Array<{ id: MapLayerKey; label: string }> = [
  { id: 'floor', label: 'Piso' },
  { id: 'walls', label: 'Paredes' },
  { id: 'objects', label: 'Objetos' },
  { id: 'decoration', label: 'Decoracao' },
  { id: 'lighting', label: 'Luzes' },
  { id: 'collision', label: 'Colisao' },
  { id: 'fog', label: 'Fog' },
  { id: 'notes', label: 'Notas' }
];

export function AssetPalette() {
  const map = useTabletopStore((state) => state.map);
  const selectedAssetId = useTabletopStore((state) => state.selectedAssetId);
  const setSelectedAsset = useTabletopStore((state) => state.setSelectedAsset);
  const setActiveLayer = useTabletopStore((state) => state.setActiveLayer);
  const activeAsset = getAsset(selectedAssetId, map.tilesets);

  return (
    <aside className="grid gap-3 rounded-lg border border-line bg-panel/90 p-3">
      <div>
        <p className="text-xs font-black uppercase text-violet">Camada</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {layerOptions.map((layer) => (
            <button
              key={layer.id}
              type="button"
              className={clsx(
                'rounded-lg border px-2 py-2 text-left text-xs font-bold',
                map.activeLayer === layer.id ? 'border-vita/60 bg-vita/20 text-textMain' : 'border-line bg-white/5 text-textMuted'
              )}
              onClick={() => setActiveLayer(layer.id)}
            >
              {layer.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-black uppercase text-violet">Paleta</p>
        <div className="mt-2 grid gap-3">
          {map.tilesets.map((tileset) => (
            <div key={tileset.id}>
              <p className="text-sm font-bold text-textMain">{tileset.name}</p>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {tileset.assets.map((asset) => (
                  <AssetButton
                    key={`${tileset.id}-${asset.id}`}
                    asset={asset}
                    selected={selectedAssetId === asset.id}
                    onClick={() => setSelectedAsset(asset.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {activeAsset ? (
        <div className="rounded-lg border border-line bg-white/5 p-3">
          <p className="text-sm font-black text-textMain">{activeAsset.name}</p>
          <p className="mt-1 text-xs text-textMuted">{activeAsset.kind}</p>
        </div>
      ) : null}
    </aside>
  );
}

function AssetButton({ asset, selected, onClick }: { asset: Asset; selected: boolean; onClick(): void }) {
  return (
    <button
      type="button"
      className={clsx(
        'aspect-square rounded-lg border p-1 transition',
        selected ? 'border-vita bg-vita/20' : 'border-line bg-white/5 hover:bg-white/10'
      )}
      onClick={onClick}
      title={asset.name}
    >
      <span
        className="flex h-full w-full items-center justify-center rounded border text-xs font-black text-white"
        style={{ backgroundColor: asset.color, borderColor: asset.stroke || asset.color }}
      >
        {asset.icon || asset.name.slice(0, 1)}
      </span>
    </button>
  );
}
