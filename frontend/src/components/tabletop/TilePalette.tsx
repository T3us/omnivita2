import clsx from 'clsx';
import type { ChangeEvent } from 'react';
import { Badge, Button } from '../Ui';
import { useTabletopStore } from './mapStore';
import { DEFAULT_TILESETS, getTilesetById } from './tilesets';
import type { TabletopLayerKey, TabletopTileDefinition } from './types';
import { TABLETOP_ERASER_TILE } from './types';

const layerOptions: Array<{ id: TabletopLayerKey; label: string; helper: string }> = [
  { id: 'ground', label: 'Fundo', helper: 'Chao, ruas, agua e piso.' },
  { id: 'objects', label: 'Objetos', helper: 'Props, paredes e decoracao.' },
  { id: 'collision', label: 'Colisao', helper: 'Bloqueia movimento dos tokens.' }
];

export function TilePalette() {
  const currentTileset = useTabletopStore((state) => state.currentTileset);
  const customTiles = useTabletopStore((state) => state.customTiles);
  const selectedTile = useTabletopStore((state) => state.selectedTile);
  const activeLayer = useTabletopStore((state) => state.activeLayer);
  const setCurrentTileset = useTabletopStore((state) => state.setCurrentTileset);
  const setSelectedTile = useTabletopStore((state) => state.setSelectedTile);
  const setActiveLayer = useTabletopStore((state) => state.setActiveLayer);
  const addCustomTile = useTabletopStore((state) => state.addCustomTile);

  const tileset = currentTileset === 'custom'
    ? { id: 'custom', name: 'Customizados', tiles: customTiles }
    : getTilesetById(currentTileset);
  const visibleTiles = activeLayer === 'collision'
    ? []
    : tileset.tiles.filter((tile) => tile.layer === activeLayer);

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    addCustomTile({
      name: file.name.replace(/\.[^.]+$/, '') || 'Tile customizado',
      layer: activeLayer === 'objects' ? 'objects' : 'ground',
      colors: ['#8b5cf6', '#2f164f', '#e9d5ff'],
      blocksMovement: activeLayer === 'objects',
      imageSrc: dataUrl
    });
    event.target.value = '';
  }

  return (
    <aside className="grid gap-4 rounded-lg border border-line bg-panel/90 p-4">
      <div>
        <h3 className="text-lg font-black">Paleta de tiles</h3>
        <p className="mt-1 text-sm text-textMuted">Escolha camada, tileset e pinte direto no grid.</p>
      </div>

      <div className="grid gap-2">
        <span className="text-xs font-black uppercase tracking-[0.08em] text-textMuted">Camada</span>
        <div className="grid gap-2">
          {layerOptions.map((layer) => (
            <button
              className={clsx(
                'rounded-lg border px-3 py-2 text-left transition',
                activeLayer === layer.id ? 'border-vita/60 bg-vita/20' : 'border-line bg-white/5 hover:bg-white/10'
              )}
              key={layer.id}
              type="button"
              onClick={() => setActiveLayer(layer.id)}
            >
              <span className="block font-black">{layer.label}</span>
              <span className="text-xs text-textMuted">{layer.helper}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-2">
        <span className="text-xs font-black uppercase tracking-[0.08em] text-textMuted">Tileset</span>
        <div className="flex flex-wrap gap-2">
          {DEFAULT_TILESETS.map((tilesetOption) => (
            <Button
              className="min-h-8 px-2 text-xs"
              key={tilesetOption.id}
              tone={currentTileset === tilesetOption.id ? 'primary' : 'secondary'}
              type="button"
              onClick={() => setCurrentTileset(tilesetOption.id)}
            >
              {tilesetOption.name}
            </Button>
          ))}
          <Button className="min-h-8 px-2 text-xs" tone={currentTileset === 'custom' ? 'primary' : 'secondary'} type="button" onClick={() => setCurrentTileset('custom')}>
            Custom
          </Button>
        </div>
      </div>

      <div className="grid gap-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-black uppercase tracking-[0.08em] text-textMuted">{tileset.name}</span>
          <Badge>{activeLayer}</Badge>
        </div>

        {activeLayer === 'collision' ? (
          <div className="grid grid-cols-2 gap-2">
            <button className="rounded-lg border border-coral/45 bg-coral/15 p-3 text-sm font-black text-coral" type="button" onClick={() => setSelectedTile('collision')}>
              Bloquear
            </button>
            <button className="rounded-lg border border-line bg-white/5 p-3 text-sm font-black text-textMuted" type="button" onClick={() => setSelectedTile(TABLETOP_ERASER_TILE)}>
              Liberar
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {visibleTiles.map((tile) => (
              <TileButton key={tile.id} selected={selectedTile === tile.id} tile={tile} onClick={() => setSelectedTile(tile.id)} />
            ))}
            <button
              className={clsx(
                'aspect-square rounded-lg border p-1 text-xs font-black transition',
                selectedTile === TABLETOP_ERASER_TILE ? 'border-coral/60 bg-coral/20 text-coral' : 'border-line bg-white/5 text-textMuted hover:bg-white/10'
              )}
              type="button"
              onClick={() => setSelectedTile(TABLETOP_ERASER_TILE)}
              title="Apagar camada"
            >
              Apagar
            </button>
          </div>
        )}
      </div>

      <label className="grid gap-2 rounded-lg border border-dashed border-line bg-white/5 p-3 text-sm text-textMuted">
        <span className="font-black text-textMain">Upload PNG</span>
        <span>Importa um tile customizado para a camada atual.</span>
        <input type="file" accept="image/png,image/webp,image/jpeg" onChange={(event) => void handleUpload(event)} />
      </label>
    </aside>
  );
}

function TileButton({ tile, selected, onClick }: { tile: TabletopTileDefinition; selected: boolean; onClick(): void }) {
  return (
    <button
      className={clsx(
        'grid aspect-square place-items-center rounded-lg border p-1 transition',
        selected ? 'border-vita/70 bg-vita/20 shadow-[0_0_24px_rgba(139,92,246,.18)]' : 'border-line bg-white/5 hover:border-vita/35 hover:bg-white/10'
      )}
      type="button"
      title={tile.name}
      onClick={onClick}
    >
      <span
        className="h-full w-full rounded-sm border border-black/30 [image-rendering:pixelated]"
        style={tile.imageSrc ? {
          backgroundImage: `url(${tile.imageSrc})`,
          backgroundSize: 'cover'
        } : {
          background: `linear-gradient(135deg, ${tile.colors[2]} 0 18%, ${tile.colors[0]} 18% 70%, ${tile.colors[1]} 70%)`
        }}
      />
    </button>
  );
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Falha ao carregar imagem.'));
    reader.readAsDataURL(file);
  });
}
