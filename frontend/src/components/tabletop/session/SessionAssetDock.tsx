import clsx from 'clsx';
import type { DragEvent, ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { ASSET_TYPE_LABELS, getAllAssets } from '../assets';
import { useTabletopStore } from '../mapStore';
import type { Asset, AvailableTabletopToken, MapSummary, MapTool, SessionBoardSummary } from '../types';

const categories: Array<{ id: Asset['typeCategory'] | 'maps' | 'tokens' | 'sessions' | 'all'; label: string }> = [
  { id: 'all', label: 'Buscar' },
  { id: 'maps', label: 'Mapas' },
  { id: 'tokens', label: 'Tokens' },
  { id: 'floor', label: 'Pisos' },
  { id: 'wall', label: 'Paredes' },
  { id: 'door', label: 'Portas' },
  { id: 'prop', label: 'Props' },
  { id: 'light', label: 'Luzes' },
  { id: 'fog', label: 'Fog' },
  { id: 'note', label: 'Notas' },
  { id: 'sessions', label: 'Sessoes' }
];

export function SessionAssetDock({
  tokens,
  maps,
  sessions,
  activeSessionBoardId,
  mapsLoading,
  collapsed,
  onToggleCollapsed,
  onCreateSessionFromMap,
  onAddMapInstance,
  onLoadSessionBoard,
  onDeleteSessionBoard
}: {
  tokens: AvailableTabletopToken[];
  maps: MapSummary[];
  sessions: SessionBoardSummary[];
  activeSessionBoardId: string;
  mapsLoading: boolean;
  collapsed: boolean;
  onToggleCollapsed(): void;
  onCreateSessionFromMap(mapId: string): void;
  onAddMapInstance(mapId: string): void;
  onLoadSessionBoard(boardId: string): void;
  onDeleteSessionBoard(boardId: string): void;
}) {
  const map = useTabletopStore((state) => state.map);
  const selectedAssetId = useTabletopStore((state) => state.selectedAssetId);
  const setSelectedAsset = useTabletopStore((state) => state.setSelectedAsset);
  const setTool = useTabletopStore((state) => state.setTool);
  const setActiveLayer = useTabletopStore((state) => state.setActiveLayer);
  const addToken = useTabletopStore((state) => state.addToken);
  const [category, setCategory] = useState<typeof categories[number]['id']>('all');
  const [search, setSearch] = useState('');

  const assets = useMemo(() => getAllAssets(map.tilesets), [map.tilesets]);
  const filteredAssets = assets
    .filter((asset) => category === 'all' || category === 'maps' || category === 'tokens' || category === 'sessions' || asset.typeCategory === category)
    .filter((asset) => {
      const query = search.trim().toLowerCase();
      if (!query) return true;
      return `${asset.name} ${asset.category} ${asset.typeCategory || ''} ${(asset.tags || []).join(' ')}`.toLowerCase().includes(query);
    })
    .slice(0, 36);

  function pickAsset(asset: Asset) {
    setSelectedAsset(asset.id);
    if (asset.defaultLayer !== 'fog' && asset.defaultLayer !== 'tokens') setActiveLayer(asset.defaultLayer);
    setTool(getToolForAsset(asset));
  }

  function spawnToken(token: AvailableTabletopToken) {
    addToken(token, Math.floor(map.width / 2), Math.floor(map.height / 2));
    setTool('select');
  }

  return (
    <section className={clsx(
      'pointer-events-auto absolute inset-x-16 bottom-4 z-20 rounded-lg border border-line bg-panel/95 shadow-soft backdrop-blur-xl transition',
      collapsed ? 'w-fit max-w-[calc(100%-8rem)] px-2 py-2' : 'px-3 py-3'
    )}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="h-9 rounded-lg border border-line bg-white/5 px-3 text-sm font-black text-textMain"
          onClick={onToggleCollapsed}
          title={collapsed ? 'Abrir dock' : 'Recolher dock'}
        >
          {collapsed ? 'Assets' : 'Recolher'}
        </button>
        {!collapsed ? (
          <>
            <input
              className="h-9 min-w-0 flex-1 rounded-lg border border-line bg-black/20 px-3 text-sm text-textMain"
              value={search}
              placeholder="Buscar assets, mapas, tokens..."
              onChange={(event) => setSearch(event.target.value)}
            />
            <div className="flex max-w-[52vw] gap-1 overflow-x-auto">
              {categories.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  className={clsx(
                    'h-9 shrink-0 rounded-lg border px-3 text-xs font-black transition',
                    category === entry.id ? 'border-vita/70 bg-vita/25 text-textMain' : 'border-line bg-white/5 text-textMuted hover:bg-white/10'
                  )}
                  onClick={() => setCategory(entry.id)}
                >
                  {entry.label}
                </button>
              ))}
            </div>
          </>
        ) : null}
      </div>

      {!collapsed ? (
        <div className="mt-3 flex max-h-40 gap-2 overflow-x-auto pb-1">
          {category === 'maps' ? maps.map((entry) => (
            <DockCard key={entry.id} title={entry.name} subtitle={`${entry.width}x${entry.height}`}>
              <button type="button" className="rounded-lg border border-line bg-white/5 px-2 py-1 text-xs font-bold text-textMain" onClick={() => onAddMapInstance(entry.id)}>
                Board
              </button>
              <button type="button" className="rounded-lg border border-line bg-white/5 px-2 py-1 text-xs font-bold text-textMain" onClick={() => onCreateSessionFromMap(entry.id)}>
                Nova
              </button>
            </DockCard>
          )) : null}

          {category === 'sessions' ? sessions.map((entry) => (
            <DockCard key={entry.id} title={entry.name} subtitle={`${entry.tokens} token(s)`}>
              <button
                type="button"
                disabled={entry.id === activeSessionBoardId}
                className="rounded-lg border border-line bg-white/5 px-2 py-1 text-xs font-bold text-textMain disabled:opacity-40"
                onClick={() => onLoadSessionBoard(entry.id)}
              >
                {entry.id === activeSessionBoardId ? 'Atual' : 'Abrir'}
              </button>
              <button
                type="button"
                className="rounded-lg border border-coral/35 bg-coral/15 px-2 py-1 text-xs font-bold text-textMain"
                onClick={() => onDeleteSessionBoard(entry.id)}
              >
                x
              </button>
            </DockCard>
          )) : null}

          {category === 'tokens' ? tokens.map((token) => (
            <DockCard
              key={token.id}
              title={token.name}
              subtitle={token.subtitle || token.kind}
              image={token.image}
              draggable
              onDragStart={(event) => event.dataTransfer.setData('application/x-omnivita-token', JSON.stringify(token))}
            >
              <button type="button" className="rounded-lg border border-line bg-white/5 px-2 py-1 text-xs font-bold text-textMain" onClick={() => spawnToken(token)}>
                Spawn
              </button>
            </DockCard>
          )) : null}

          {category !== 'maps' && category !== 'tokens' && category !== 'sessions' ? filteredAssets.map((asset) => (
            <DockCard
              key={asset.id}
              title={asset.name}
              subtitle={asset.typeCategory ? ASSET_TYPE_LABELS[asset.typeCategory] : asset.category}
              image={asset.thumbnailUrl || asset.imageUrl}
              active={selectedAssetId === asset.id}
              draggable
              onClick={() => pickAsset(asset)}
              onDragStart={(event) => {
                pickAsset(asset);
                event.dataTransfer.setData('application/x-omnivita-asset', asset.id);
              }}
            />
          )) : null}

          {mapsLoading ? <p className="px-3 py-8 text-sm text-textMuted">Carregando...</p> : null}
        </div>
      ) : null}
    </section>
  );
}

function DockCard({
  title,
  subtitle,
  image,
  active,
  draggable,
  children,
  onClick,
  onDragStart
}: {
  title: string;
  subtitle: string;
  image?: string;
  active?: boolean;
  draggable?: boolean;
  children?: ReactNode;
  onClick?(): void;
  onDragStart?(event: DragEvent<HTMLDivElement>): void;
}) {
  return (
    <div
      className={clsx(
        'grid h-32 w-28 shrink-0 cursor-pointer content-start gap-2 rounded-lg border bg-white/5 p-2 transition hover:bg-white/10',
        active ? 'border-vita/70' : 'border-line'
      )}
      draggable={draggable}
      onClick={onClick}
      onDragStart={onDragStart}
      title={title}
    >
      <div className="flex h-14 items-center justify-center overflow-hidden rounded-lg border border-line bg-black/30">
        {image ? <img src={image} alt="" className="h-full w-full object-cover" /> : <span className="text-lg font-black text-violet">{title.slice(0, 1).toUpperCase()}</span>}
      </div>
      <div className="min-w-0">
        <strong className="block truncate text-xs text-textMain">{title}</strong>
        <span className="block truncate text-[11px] text-textMuted">{subtitle}</span>
      </div>
      {children ? <div className="flex gap-1">{children}</div> : null}
    </div>
  );
}

function getToolForAsset(asset: Asset): MapTool {
  if (asset.typeCategory === 'floor' || asset.defaultLayer === 'floor') return 'brush';
  if (asset.typeCategory === 'wall' || asset.defaultLayer === 'walls') return 'wall';
  if (asset.typeCategory === 'door' || asset.kind === 'door' || asset.defaultLayer === 'doors') return 'door';
  if (asset.typeCategory === 'light' || asset.defaultLayer === 'lighting') return 'light';
  if (asset.typeCategory === 'note' || asset.defaultLayer === 'notes') return 'note';
  if (asset.typeCategory === 'fog' || asset.defaultLayer === 'fog') return 'fog';
  if (asset.kind === 'cover') return 'cover';
  if (asset.kind === 'terminal') return 'terminal';
  if (asset.kind === 'zone') return 'zone';
  return 'object';
}
