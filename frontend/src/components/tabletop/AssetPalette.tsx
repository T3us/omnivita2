import clsx from 'clsx';
import { useMemo, useState } from 'react';
import { ASSET_THEME_LABELS, ASSET_TYPE_LABELS, getAllAssets, makeCustomAsset } from './assets';
import { useTabletopStore } from './mapStore';
import type { Asset, AssetTheme, AssetTypeCategory, MapLayerKey, MapTool, SnapMode } from './types';

const layerOptions: Array<{ id: MapLayerKey; label: string }> = [
  { id: 'floor', label: 'Piso' },
  { id: 'walls', label: 'Paredes' },
  { id: 'objects', label: 'Objetos' },
  { id: 'decoration', label: 'Decoracao' },
  { id: 'details', label: 'Detalhes' },
  { id: 'lighting', label: 'Luzes' },
  { id: 'mechanics', label: 'Mecanica' },
  { id: 'collision', label: 'Colisao' },
  { id: 'fog', label: 'Fog' },
  { id: 'notes', label: 'Notas' }
];

export function AssetPalette() {
  const map = useTabletopStore((state) => state.map);
  const selectedAssetId = useTabletopStore((state) => state.selectedAssetId);
  const favoriteAssetIds = useTabletopStore((state) => state.favoriteAssetIds);
  const recentAssetIds = useTabletopStore((state) => state.recentAssetIds);
  const setSelectedAsset = useTabletopStore((state) => state.setSelectedAsset);
  const toggleFavoriteAsset = useTabletopStore((state) => state.toggleFavoriteAsset);
  const setActiveLayer = useTabletopStore((state) => state.setActiveLayer);
  const setTool = useTabletopStore((state) => state.setTool);
  const addCustomAsset = useTabletopStore((state) => state.addCustomAsset);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<AssetTypeCategory | 'Todos' | 'Favoritos' | 'Recentes'>('Todos');
  const [themeFilter, setThemeFilter] = useState<AssetTheme | 'Todos'>('Todos');
  const [importOpen, setImportOpen] = useState(false);
  const [importImage, setImportImage] = useState('');
  const [importName, setImportName] = useState('');
  const [importType, setImportType] = useState<AssetTypeCategory>('prop');
  const [importTheme, setImportTheme] = useState<AssetTheme>('generico');
  const [importTags, setImportTags] = useState('');
  const [importLayer, setImportLayer] = useState<MapLayerKey>('objects');
  const [importSnapMode, setImportSnapMode] = useState<SnapMode>('free');
  const [importWidth, setImportWidth] = useState(64);
  const [importHeight, setImportHeight] = useState(64);
  const [importBlocksMovement, setImportBlocksMovement] = useState(false);
  const [importBlocksVision, setImportBlocksVision] = useState(false);
  const [importGivesCover, setImportGivesCover] = useState(false);

  const assets = useMemo(() => getAllAssets(map.tilesets), [map.tilesets]);
  const filteredAssets = assets.filter((asset) => {
    const haystack = `${asset.name} ${asset.category || ''} ${asset.typeCategory || ''} ${asset.theme || ''} ${(asset.tags || []).join(' ')}`.toLowerCase();
    const matchesSearch = !search.trim() || haystack.includes(search.trim().toLowerCase());
    const matchesType = typeFilter === 'Todos'
      || (typeFilter === 'Favoritos' && favoriteAssetIds.includes(asset.id))
      || (typeFilter === 'Recentes' && recentAssetIds.includes(asset.id))
      || asset.typeCategory === typeFilter;
    const matchesTheme = themeFilter === 'Todos' || asset.theme === themeFilter;
    return matchesSearch && matchesType && matchesTheme;
  }).sort((left, right) => {
    const leftRecent = recentAssetIds.indexOf(left.id);
    const rightRecent = recentAssetIds.indexOf(right.id);
    if (typeFilter === 'Recentes') return (leftRecent < 0 ? 999 : leftRecent) - (rightRecent < 0 ? 999 : rightRecent);
    return String(left.name).localeCompare(String(right.name), 'pt-BR');
  });

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

      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-black uppercase text-violet">Assets</p>
          <button
            type="button"
            className="rounded-lg border border-line bg-white/5 px-2 py-1 text-xs font-bold text-textMuted hover:bg-white/10"
            onClick={() => setImportOpen((value) => !value)}
          >
            {importOpen ? 'Fechar' : 'Importar'}
          </button>
        </div>
        {importOpen ? (
          <AssetImportForm
            image={importImage}
            name={importName}
            typeCategory={importType}
            theme={importTheme}
            tags={importTags}
            layer={importLayer}
            snapMode={importSnapMode}
            width={importWidth}
            height={importHeight}
            blocksMovement={importBlocksMovement}
            blocksVision={importBlocksVision}
            givesCover={importGivesCover}
            onImage={setImportImage}
            onName={setImportName}
            onTypeCategory={setImportType}
            onTheme={setImportTheme}
            onTags={setImportTags}
            onLayer={setImportLayer}
            onSnapMode={setImportSnapMode}
            onWidth={setImportWidth}
            onHeight={setImportHeight}
            onBlocksMovement={setImportBlocksMovement}
            onBlocksVision={setImportBlocksVision}
            onGivesCover={setImportGivesCover}
            onImport={() => {
              if (!importImage || !importName.trim()) return;
              const customAsset = makeCustomAsset({
                name: importName.trim(),
                category: ASSET_TYPE_LABELS[importType],
                typeCategory: importType,
                theme: importTheme,
                tags: importTags.split(',').map((tag) => tag.trim()).filter(Boolean),
                imageUrl: importImage,
                thumbnailUrl: importImage,
                defaultLayer: importLayer,
                defaultWidth: importWidth,
                defaultHeight: importHeight,
                defaultSnapMode: importSnapMode,
                defaultBlocksMovement: importBlocksMovement,
                defaultBlocksVision: importBlocksVision,
                defaultGivesCover: importGivesCover,
                defaultInteractable: false,
                kind: inferKind(importLayer),
                color: '#2d2437',
                stroke: '#a78bfa',
                blocksMovement: importBlocksMovement,
                blocksVision: importBlocksVision,
                givesCover: importGivesCover,
                interactable: false
              });
              addCustomAsset(customAsset);
              setTypeFilter(customAsset.typeCategory || 'prop');
              setImportImage('');
              setImportName('');
              setImportTags('');
            }}
          />
        ) : null}
        <input
          className="w-full rounded-lg border border-line bg-white/5 px-3 py-2 text-sm text-textMain"
          value={search}
          placeholder="Buscar por nome ou tag"
          onChange={(event) => setSearch(event.target.value)}
        />
        <select
          className="w-full rounded-lg border border-line bg-white/5 px-3 py-2 text-sm text-textMain"
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value as typeof typeFilter)}
        >
          <option value="Todos">Todos os tipos</option>
          <option value="Favoritos">Favoritos</option>
          <option value="Recentes">Recentes</option>
          {Object.entries(ASSET_TYPE_LABELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </select>
        <select
          className="w-full rounded-lg border border-line bg-white/5 px-3 py-2 text-sm text-textMain"
          value={themeFilter}
          onChange={(event) => setThemeFilter(event.target.value as typeof themeFilter)}
        >
          <option value="Todos">Todos os temas</option>
          {Object.entries(ASSET_THEME_LABELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </select>
      </div>

      <div className="grid max-h-[480px] grid-cols-3 gap-2 overflow-auto pr-1">
        {filteredAssets.map((asset) => (
          <AssetButton
            key={asset.id}
            asset={asset}
            selected={selectedAssetId === asset.id}
            favorite={favoriteAssetIds.includes(asset.id)}
            onClick={() => {
              setSelectedAsset(asset.id);
              if (asset.defaultLayer !== 'fog' && asset.defaultLayer !== 'tokens') setActiveLayer(asset.defaultLayer);
              setTool(getToolForAsset(asset));
            }}
            onFavorite={() => toggleFavoriteAsset(asset.id)}
          />
        ))}
        {!filteredAssets.length ? <p className="col-span-3 text-sm text-textMuted">Nenhum asset encontrado.</p> : null}
      </div>
    </aside>
  );
}

function AssetImportForm({
  image,
  name,
  typeCategory,
  theme,
  tags,
  layer,
  snapMode,
  width,
  height,
  blocksMovement,
  blocksVision,
  givesCover,
  onImage,
  onName,
  onTypeCategory,
  onTheme,
  onTags,
  onLayer,
  onSnapMode,
  onWidth,
  onHeight,
  onBlocksMovement,
  onBlocksVision,
  onGivesCover,
  onImport
}: {
  image: string;
  name: string;
  typeCategory: AssetTypeCategory;
  theme: AssetTheme;
  tags: string;
  layer: MapLayerKey;
  snapMode: SnapMode;
  width: number;
  height: number;
  blocksMovement: boolean;
  blocksVision: boolean;
  givesCover: boolean;
  onImage(value: string): void;
  onName(value: string): void;
  onTypeCategory(value: AssetTypeCategory): void;
  onTheme(value: AssetTheme): void;
  onTags(value: string): void;
  onLayer(value: MapLayerKey): void;
  onSnapMode(value: SnapMode): void;
  onWidth(value: number): void;
  onHeight(value: number): void;
  onBlocksMovement(value: boolean): void;
  onBlocksVision(value: boolean): void;
  onGivesCover(value: boolean): void;
  onImport(): void;
}) {
  return (
    <div className="grid gap-2 rounded-lg border border-vita/30 bg-vita/10 p-2">
      <label className="text-xs font-bold text-textMuted">
        PNG/WebP
        <input
          className="mt-1 block w-full text-xs text-textMuted file:mr-2 file:rounded-lg file:border file:border-line file:bg-white/10 file:px-2 file:py-1 file:text-textMain"
          type="file"
          accept="image/png,image/webp"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => onImage(String(reader.result || ''));
            reader.readAsDataURL(file);
            if (!name.trim()) onName(file.name.replace(/\.(png|webp)$/i, '').replace(/[-_]+/g, ' '));
          }}
        />
      </label>
      {image ? (
        <div className="flex items-center gap-2">
          <span className="block h-14 w-14 shrink-0">
            <AssetPreview image={image} alt={name || 'Asset importado'} />
          </span>
          <span className="text-xs text-textMuted">Imagem carregada.</span>
        </div>
      ) : null}
      <input className="rounded-lg border border-line bg-white/5 px-2 py-2 text-sm text-textMain" value={name} placeholder="Nome do asset" onChange={(event) => onName(event.target.value)} />
      <div className="grid grid-cols-2 gap-2">
        <select className="rounded-lg border border-line bg-white/5 px-2 py-2 text-sm text-textMain" value={typeCategory} onChange={(event) => onTypeCategory(event.target.value as AssetTypeCategory)}>
          {Object.entries(ASSET_TYPE_LABELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </select>
        <select className="rounded-lg border border-line bg-white/5 px-2 py-2 text-sm text-textMain" value={theme} onChange={(event) => onTheme(event.target.value as AssetTheme)}>
          {Object.entries(ASSET_THEME_LABELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </select>
        <select className="rounded-lg border border-line bg-white/5 px-2 py-2 text-sm text-textMain" value={layer} onChange={(event) => onLayer(event.target.value as MapLayerKey)}>
          {layerOptions.filter((entry) => entry.id !== 'tokens').map((entry) => <option key={entry.id} value={entry.id}>{entry.label}</option>)}
        </select>
        <select className="rounded-lg border border-line bg-white/5 px-2 py-2 text-sm text-textMain" value={snapMode} onChange={(event) => onSnapMode(event.target.value as SnapMode)}>
          <option value="free">Livre</option>
          <option value="fine">Fino 4px</option>
          <option value="grid">Grid</option>
        </select>
        <input className="rounded-lg border border-line bg-white/5 px-2 py-2 text-sm text-textMain" type="number" min={4} value={width} onChange={(event) => onWidth(Number(event.target.value))} />
        <input className="rounded-lg border border-line bg-white/5 px-2 py-2 text-sm text-textMain" type="number" min={4} value={height} onChange={(event) => onHeight(Number(event.target.value))} />
      </div>
      <input className="rounded-lg border border-line bg-white/5 px-2 py-2 text-sm text-textMain" value={tags} placeholder="tags separadas por virgula" onChange={(event) => onTags(event.target.value)} />
      <div className="grid gap-1 text-xs text-textMuted">
        <Toggle label="Bloqueia movimento" checked={blocksMovement} onChange={onBlocksMovement} />
        <Toggle label="Bloqueia visao" checked={blocksVision} onChange={onBlocksVision} />
        <Toggle label="Da cobertura" checked={givesCover} onChange={onGivesCover} />
      </div>
      <button
        type="button"
        className="rounded-lg border border-vita/50 bg-vita/25 px-3 py-2 text-sm font-black text-textMain disabled:cursor-not-allowed disabled:opacity-50"
        disabled={!image || !name.trim()}
        onClick={onImport}
      >
        Adicionar asset
      </button>
    </div>
  );
}

function AssetButton({
  asset,
  selected,
  favorite,
  onClick,
  onFavorite
}: {
  asset: Asset;
  selected: boolean;
  favorite: boolean;
  onClick(): void;
  onFavorite(): void;
}) {
  return (
    <div
      className={clsx(
        'rounded-lg border bg-white/5 p-1 transition',
        selected ? 'border-vita bg-vita/20' : 'border-line hover:bg-white/10'
      )}
    >
      <button type="button" className="block w-full text-left" onClick={onClick} title={asset.name}>
        <span
          draggable
          onDragStart={(event) => {
            event.dataTransfer.setData('application/x-omnivita-asset', asset.id);
            event.dataTransfer.effectAllowed = 'copy';
          }}
        >
          <AssetPreview image={asset.thumbnailUrl || asset.imageUrl} alt={asset.name} selected={selected} />
        </span>
        <span className="mt-1 block truncate text-[11px] font-bold text-textMain">{asset.name}</span>
        <span className="block truncate text-[10px] text-textMuted">{ASSET_TYPE_LABELS[asset.typeCategory || 'prop']}</span>
        <span className="block truncate text-[10px] text-textMuted">{ASSET_THEME_LABELS[asset.theme || 'generico']}</span>
      </button>
      <button
        type="button"
        className={clsx('mt-1 w-full rounded border px-1 py-0.5 text-[11px] font-bold', favorite ? 'border-amber/40 text-amber' : 'border-line text-textMuted')}
        onClick={onFavorite}
      >
        {favorite ? 'Favorito' : 'Favoritar'}
      </button>
    </div>
  );
}

function AssetPreview({ image, alt, selected = false }: { image: string; alt: string; selected?: boolean }) {
  return (
    <span
      className={clsx('relative flex aspect-square w-full items-center justify-center overflow-hidden rounded border', selected ? 'border-vita/70' : 'border-line')}
      style={{
        backgroundColor: 'rgba(255,255,255,0.04)',
        backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.05) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.05) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.05) 75%), linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.05) 75%)',
        backgroundSize: '12px 12px',
        backgroundPosition: '0 0, 0 6px, 6px -6px, -6px 0'
      }}
    >
      {image ? <img src={image} alt={alt} className="h-full w-full object-contain p-1 [image-rendering:pixelated]" /> : null}
    </span>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange(value: boolean): void }) {
  return (
    <label className="flex items-center gap-2">
      <input className="accent-vita" type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  );
}

function inferKind(layer: MapLayerKey): Asset['kind'] {
  if (layer === 'floor') return 'floor';
  if (layer === 'walls') return 'wall';
  if (layer === 'details') return 'decal';
  if (layer === 'lighting') return 'light';
  if (layer === 'notes') return 'note';
  if (layer === 'fog') return 'fog';
  if (layer === 'mechanics') return 'zone';
  return 'prop';
}

function getToolForAsset(asset: Asset): MapTool {
  if (asset.typeCategory === 'floor' || asset.defaultLayer === 'floor') return 'brush';
  if (asset.typeCategory === 'wall' || asset.defaultLayer === 'walls') return 'wall';
  if (asset.typeCategory === 'light' || asset.defaultLayer === 'lighting') return 'light';
  if (asset.typeCategory === 'note' || asset.defaultLayer === 'notes') return 'note';
  if (asset.typeCategory === 'fog' || asset.defaultLayer === 'fog') return 'fog';
  if (asset.kind === 'door') return 'door';
  if (asset.kind === 'cover') return 'cover';
  if (asset.kind === 'terminal') return 'terminal';
  if (asset.kind === 'zone') return 'zone';
  return 'object';
}
