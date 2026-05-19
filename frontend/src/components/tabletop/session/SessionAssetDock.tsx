import clsx from 'clsx';
import type { DragEvent, ReactNode } from 'react';
import { useMemo, useState } from 'react';
import {
  Archive,
  BrickWall,
  CloudFog,
  DoorOpen,
  Grid2X2,
  Lightbulb,
  Map as MapIcon,
  Package,
  Search,
  StickyNote,
  UsersRound
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ASSET_TYPE_LABELS, getAllAssets } from '../assets';
import { useTabletopStore } from '../mapStore';
import type { Asset, AvailableTabletopToken, MapSummary, MapTool, SessionBoardSummary } from '../types';

type DockCategory = NonNullable<Asset['typeCategory']> | 'maps' | 'tokens' | 'sessions' | 'all';

const categories: Array<{ id: DockCategory; label: string; icon: LucideIcon }> = [
  { id: 'all', label: 'Buscar', icon: Search },
  { id: 'maps', label: 'Mapas', icon: MapIcon },
  { id: 'tokens', label: 'Tokens', icon: UsersRound },
  { id: 'floor', label: 'Pisos', icon: Grid2X2 },
  { id: 'wall', label: 'Paredes', icon: BrickWall },
  { id: 'door', label: 'Portas', icon: DoorOpen },
  { id: 'prop', label: 'Props', icon: Package },
  { id: 'light', label: 'Luzes', icon: Lightbulb },
  { id: 'fog', label: 'Fog', icon: CloudFog },
  { id: 'note', label: 'Notas', icon: StickyNote },
  { id: 'sessions', label: 'Sessoes', icon: Archive }
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
  const [category, setCategory] = useState<DockCategory>('all');
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
      'pointer-events-auto absolute inset-x-16 bottom-4 z-20 rounded-lg border border-line bg-[#12111a]/95 shadow-soft backdrop-blur-xl transition',
      collapsed ? 'w-fit max-w-[calc(100%-8rem)] px-2 py-2' : 'px-3 py-3'
    )}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="flex h-10 items-center gap-2 rounded-lg border border-line bg-white/5 px-3 text-sm font-black text-textMain hover:bg-white/10"
          onClick={onToggleCollapsed}
          title={collapsed ? 'Abrir dock' : 'Recolher dock'}
        >
          <Package size={18} />
          {collapsed ? 'Assets' : 'Recolher'}
        </button>
        {!collapsed ? (
          <>
            <input
              className="h-10 min-w-0 flex-1 rounded-lg border border-line bg-black/25 px-3 text-sm text-textMain outline-none placeholder:text-textMuted focus:border-vita/60"
              value={search}
              placeholder="Buscar assets, mapas, tokens..."
              onChange={(event) => setSearch(event.target.value)}
            />
            <div className="flex max-w-[52vw] gap-1 overflow-x-auto rounded-lg border border-line bg-black/20 p-1">
              {categories.map((entry) => {
                const Icon = entry.icon;
                return (
                <button
                  key={entry.id}
                  type="button"
                  className={clsx(
                    'flex h-9 w-10 shrink-0 items-center justify-center rounded-lg text-[#9fb4d6] transition hover:bg-white/10 hover:text-textMain',
                    category === entry.id && 'bg-vita/30 text-[#9db7ff]'
                  )}
                  onClick={() => setCategory(entry.id)}
                  title={entry.label}
                  aria-label={entry.label}
                >
                  <Icon size={18} strokeWidth={2.2} />
                </button>
                );
              })}
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
        active ? 'border-vita/70 shadow-[0_0_18px_rgba(139,92,246,0.22)]' : 'border-line'
      )}
      draggable={draggable}
      onClick={onClick}
      onDragStart={onDragStart}
      title={title}
    >
      <div className="flex h-14 items-center justify-center overflow-hidden rounded-lg border border-line bg-black/30">
        {image ? <img src={image} alt="" className="h-full w-full object-cover" /> : <Package className="text-[#9fb4d6]" size={24} />}
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
