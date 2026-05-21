import clsx from 'clsx';
import { Bookmark, Box, DoorOpen, Flame, Grid2X2, Image, Lightbulb, Map, Package, Search, Sparkles, StickyNote, UserRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { getAllAssets } from '../assets';
import { useTabletopStore } from '../mapStore';
import type { Asset, AvailableTabletopToken, MapSummary, MapTool, OmniMap } from '../types';

type ShelfCategory = 'maps' | 'tokens' | 'npcs' | 'enemies' | 'creatures' | 'props' | 'floors' | 'walls' | 'doors' | 'lights' | 'templates' | 'fog' | 'notes' | 'prefabs' | 'favorites' | 'recent';

const buildCategories: Array<{ id: ShelfCategory; icon: LucideIcon; label: string }> = [
  { id: 'maps', icon: Map, label: 'Mapas' },
  { id: 'floors', icon: Grid2X2, label: 'Pisos' },
  { id: 'walls', icon: Package, label: 'Paredes' },
  { id: 'doors', icon: DoorOpen, label: 'Portas' },
  { id: 'props', icon: Box, label: 'Props' },
  { id: 'lights', icon: Lightbulb, label: 'Luzes' },
  { id: 'fog', icon: Flame, label: 'Fog base' },
  { id: 'notes', icon: StickyNote, label: 'Notas' },
  { id: 'prefabs', icon: Sparkles, label: 'Prefabs' },
  { id: 'npcs', icon: Sparkles, label: 'Token Library' },
  { id: 'favorites', icon: Bookmark, label: 'Favoritos' },
  { id: 'recent', icon: Image, label: 'Recentes' }
];

const sessionCategories: Array<{ id: ShelfCategory; icon: LucideIcon; label: string }> = [
  { id: 'maps', icon: Map, label: 'Mapas' },
  { id: 'tokens', icon: UserRound, label: 'Players' },
  { id: 'npcs', icon: Sparkles, label: 'NPCs' },
  { id: 'enemies', icon: Box, label: 'Inimigos' },
  { id: 'creatures', icon: Package, label: 'Criaturas' },
  { id: 'templates', icon: Flame, label: 'Templates' },
  { id: 'lights', icon: Lightbulb, label: 'Luz rapida' },
  { id: 'fog', icon: Flame, label: 'Fog' },
  { id: 'notes', icon: StickyNote, label: 'Handouts' },
  { id: 'favorites', icon: Bookmark, label: 'Favoritos' },
  { id: 'recent', icon: Image, label: 'Recentes' }
];

export function VttAssetShelf({
  open,
  onOpenChange,
  maps,
  tokens,
  customTokens,
  loadingMaps,
  mode,
  onLoadMap,
  onAddMap,
  onRenameMap,
  onDuplicateMap,
  onDeleteMap,
  onHoldToken,
  onHoldAsset,
  onCreateToken,
  focusCategory
}: {
  open: boolean;
  onOpenChange(open: boolean): void;
  maps: MapSummary[];
  tokens: AvailableTabletopToken[];
  customTokens: AvailableTabletopToken[];
  loadingMaps?: boolean;
  mode: OmniMap['mode'];
  onLoadMap(mapId: string, mode: OmniMap['mode']): void;
  onAddMap(mapId: string): void;
  onRenameMap(mapId: string, name: string): void;
  onDuplicateMap(mapId: string): void;
  onDeleteMap(mapId: string): void;
  onHoldToken(token: AvailableTabletopToken): void;
  onHoldAsset(assetId: string): void;
  onCreateToken(): void;
  focusCategory?: string;
}) {
  const [activeCategory, setActiveCategory] = useState<ShelfCategory>('maps');
  const [search, setSearch] = useState('');
  const map = useTabletopStore((state) => state.map);
  const setSelectedAsset = useTabletopStore((state) => state.setSelectedAsset);
  const setTool = useTabletopStore((state) => state.setTool);
  const assets = useMemo(() => getAllAssets(map.tilesets), [map.tilesets]);
  const categories = mode === 'build' ? buildCategories : sessionCategories;
  const visibleAssets = useMemo(() => filterAssets(assets, activeCategory, search), [activeCategory, assets, search]);
  const visibleTokens = useMemo(() => filterTokens(tokens, customTokens, activeCategory, search), [activeCategory, customTokens, search, tokens]);
  const visibleMaps = useMemo(() => maps.filter((entry) => matches(entry.name, search)), [maps, search]);

  useEffect(() => {
    if (focusCategory && categories.some((entry) => entry.id === focusCategory)) setActiveCategory(focusCategory as ShelfCategory);
  }, [categories, focusCategory]);

  return (
    <div className="pointer-events-auto fixed bottom-3 left-1/2 z-40 w-[min(880px,calc(100vw-132px))] -translate-x-1/2">
      {open ? (
        <div className="mb-2 max-h-[190px] overflow-hidden rounded-xl border border-white/10 bg-[#12101a]/95 p-3 shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="mb-3 flex items-center gap-2">
            <Search size={16} className="text-textMuted" />
            <input
              className="h-8 flex-1 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-textMain outline-none placeholder:text-textMuted focus:border-vita/50"
              placeholder={`Buscar em ${categories.find((entry) => entry.id === activeCategory)?.label || 'assets'}`}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <button type="button" className="rounded-lg px-3 py-1.5 text-xs font-bold text-textMuted hover:bg-white/10 hover:text-white" onClick={() => onOpenChange(false)}>Esc</button>
          </div>
          <div className="grid max-h-[126px] grid-cols-[repeat(auto-fill,minmax(58px,1fr))] gap-2 overflow-y-auto pr-1">
            {activeCategory === 'maps' ? (
              loadingMaps ? <ShelfEmpty label="Carregando mapas..." /> : visibleMaps.map((entry) => (
                <div key={entry.id} className="group grid place-items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-1.5 hover:border-vita/60 hover:bg-vita/20" title={entry.name}>
                  <button type="button" className="grid place-items-center gap-1" onClick={() => mode === 'build' ? onLoadMap(entry.id, 'build') : onAddMap(entry.id)} onDoubleClick={() => onLoadMap(entry.id, 'build')}>
                    <div className="grid h-12 w-12 place-items-center rounded-md bg-[#241936] text-[#a9bfff]"><Map size={20} /></div>
                    <span className="max-w-full truncate text-[10px] font-semibold text-textMuted group-hover:text-white">{entry.name}</span>
                  </button>
                  {mode === 'build' ? (
                    <div className="flex gap-1">
                      <button type="button" className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-black text-textMuted hover:text-white" title="Renomear" onClick={(event) => {
                        event.stopPropagation();
                        const nextName = window.prompt('Nome do mapa', entry.name);
                        if (nextName?.trim()) onRenameMap(entry.id, nextName.trim());
                      }}>R</button>
                      <button type="button" className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-black text-textMuted hover:text-white" title="Duplicar" onClick={(event) => {
                        event.stopPropagation();
                        onDuplicateMap(entry.id);
                      }}>D</button>
                      <button type="button" className="rounded bg-red-500/10 px-1.5 py-0.5 text-[9px] font-black text-red-200 hover:bg-red-500/20" title="Excluir" onClick={(event) => {
                        event.stopPropagation();
                        if (window.confirm(`Excluir "${entry.name}"?`)) onDeleteMap(entry.id);
                      }}>X</button>
                    </div>
                  ) : null}
                </div>
              ))
            ) : isTokenCategory(activeCategory) ? (
              <>
                {mode === 'build' && activeCategory === 'npcs' ? (
                  <button type="button" className="group grid place-items-center gap-1 rounded-lg border border-dashed border-vita/50 bg-vita/10 p-1.5 hover:bg-vita/20" title="Criar NPC" onClick={onCreateToken}>
                    <div className="grid h-12 w-12 place-items-center rounded-md bg-[#241936] text-xl font-black text-[#a9bfff]">+</div>
                    <span className="max-w-full truncate text-[10px] font-semibold text-violet group-hover:text-white">Criar NPC</span>
                  </button>
                ) : null}
                {visibleTokens.length ? visibleTokens.map((token) => (
                <button key={token.id} type="button" className="group grid place-items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-1.5 hover:border-vita/60 hover:bg-vita/20" title={token.name} onClick={() => mode === 'session' ? onHoldToken(token) : undefined}>
                  {token.image ? <img src={token.image} alt="" className="h-12 w-12 rounded-md object-cover" /> : <div className="grid h-12 w-12 place-items-center rounded-md bg-[#241936] text-lg font-black text-[#a9bfff]">{token.name.slice(0, 1).toUpperCase()}</div>}
                  <span className="max-w-full truncate text-[10px] font-semibold text-textMuted group-hover:text-white">{token.name}</span>
                </button>
                )) : <ShelfEmpty label={mode === 'build' ? 'Nenhum token salvo nesta biblioteca.' : 'Nada para spawnar nesta categoria.'} />}
              </>
            ) : (
              visibleAssets.map((asset) => (
                <button key={asset.id} type="button" className="group grid place-items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-1.5 hover:border-vita/60 hover:bg-vita/20" title={asset.name} onClick={() => {
                  if (mode === 'build') {
                    setSelectedAsset(asset.id);
                    setTool(getToolForAsset(asset));
                    onOpenChange(false);
                    return;
                  }
                  onHoldAsset(asset.id);
                }}>
                  {asset.thumbnailUrl || asset.imageUrl ? <img src={asset.thumbnailUrl || asset.imageUrl} alt="" className="h-12 w-12 rounded-md object-cover" /> : <div className="h-12 w-12 rounded-md" style={{ background: asset.color || '#241936', border: `1px solid ${asset.stroke || '#6d5a90'}` }} />}
                  <span className="max-w-full truncate text-[10px] font-semibold text-textMuted group-hover:text-white">{asset.name}</span>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
      <div className="flex h-14 items-center justify-center gap-1 overflow-hidden rounded-xl border border-white/10 bg-[#12101a]/92 px-2 shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        {categories.map((entry) => {
          const Icon = entry.icon;
          return (
            <button
              key={entry.id}
              type="button"
              title={entry.label}
              aria-label={entry.label}
              className={clsx(
                'grid h-10 w-10 place-items-center rounded-lg text-[#9fb4d6] transition hover:bg-white/10 hover:text-white',
                open && activeCategory === entry.id && 'bg-vita/35 text-[#a9bfff]'
              )}
              onClick={() => {
                setActiveCategory(entry.id);
                onOpenChange(!(open && activeCategory === entry.id));
              }}
            >
              <Icon size={19} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ShelfEmpty({ label }: { label: string }) {
  return <div className="col-span-full rounded-lg border border-white/10 bg-white/5 p-4 text-center text-sm text-textMuted">{label}</div>;
}

function filterAssets(assets: Asset[], category: ShelfCategory, search: string) {
  const categoriesByShelf: Partial<Record<ShelfCategory, string[]>> = {
    props: ['furniture', 'prop', 'detail', 'mechanic'],
    floors: ['floor'],
    walls: ['wall'],
    doors: ['door', 'window', 'door-window'],
    lights: ['light'],
    fog: ['fog'],
    templates: ['fog', 'mechanic'],
    notes: ['note']
  };
  if (category === 'prefabs') return [];
  const allowed = categoriesByShelf[category];
  return assets.filter((asset) => (!allowed || allowed.includes(asset.typeCategory || 'prop')) && matches(`${asset.name} ${asset.tags.join(' ')}`, search)).slice(0, 80);
}

function filterTokens(tokens: AvailableTabletopToken[], customTokens: AvailableTabletopToken[], category: ShelfCategory, search: string) {
  const source = category === 'tokens'
    ? tokens.filter((token) => token.kind === 'character' || token.kind === 'companion')
    : category === 'npcs'
      ? customTokens.filter((token) => token.kind === 'npc')
      : category === 'enemies'
        ? [...tokens.filter((token) => token.kind === 'enemy'), ...customTokens.filter((token) => token.kind === 'enemy')]
        : category === 'creatures'
          ? customTokens.filter((token) => token.kind === 'object')
          : [];
  return source.filter((token) => matches(`${token.name} ${token.subtitle || ''}`, search));
}

function isTokenCategory(category: ShelfCategory) {
  return category === 'tokens' || category === 'npcs' || category === 'enemies' || category === 'creatures';
}

function getToolForAsset(asset: Asset): MapTool {
  if (asset.defaultLayer === 'floor') return 'brush';
  if (asset.defaultLayer === 'walls') return 'wall';
  if (asset.defaultLayer === 'doors') return 'door';
  if (asset.defaultLayer === 'lighting') return 'light';
  if (asset.defaultLayer === 'notes') return 'note';
  if (asset.kind === 'cover') return 'cover';
  if (asset.kind === 'terminal') return 'terminal';
  if (asset.kind === 'zone' || asset.defaultLayer === 'mechanics') return 'zone';
  return 'object';
}

function matches(value: string, search: string) {
  return value.toLowerCase().includes(search.trim().toLowerCase());
}
