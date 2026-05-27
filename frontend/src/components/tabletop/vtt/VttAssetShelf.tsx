import clsx from 'clsx';
import { Bookmark, Box, DoorOpen, Flame, Grid2X2, Image, Lightbulb, Map, Package, Search, Sparkles, StickyNote, UserRound, UserRoundPlus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { memo, useEffect, useMemo, useState } from 'react';
import { getAllAssets } from '../assets';
import { useTabletopStore } from '../mapStore';
import type { Asset, AvailableTabletopToken, MapSummary, MapTool, OmniMap, TabletopTokenKind } from '../types';
import { AssetThumbnail } from './assetRenderer';

type ShelfCategory = 'maps' | 'tokens' | 'npcs' | 'enemies' | 'creatures' | 'forms' | 'miniSheets' | 'props' | 'floors' | 'walls' | 'doors' | 'lights' | 'templates' | 'fog' | 'notes' | 'prefabs' | 'favorites' | 'recent';

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
  { id: 'forms', icon: UserRoundPlus, label: 'Formas' },
  { id: 'miniSheets', icon: UserRoundPlus, label: 'Mini fichas' },
  { id: 'templates', icon: Flame, label: 'Templates' },
  { id: 'lights', icon: Lightbulb, label: 'Luz rapida' },
  { id: 'fog', icon: Flame, label: 'Fog' },
  { id: 'notes', icon: StickyNote, label: 'Handouts' },
  { id: 'favorites', icon: Bookmark, label: 'Favoritos' },
  { id: 'recent', icon: Image, label: 'Recentes' }
];

const playerCategories: Array<{ id: ShelfCategory; icon: LucideIcon; label: string }> = [
  { id: 'tokens', icon: UserRound, label: 'Meus tokens' },
  { id: 'forms', icon: UserRoundPlus, label: 'Formas' },
  { id: 'miniSheets', icon: UserRoundPlus, label: 'Mini fichas' }
];

export const VttAssetShelf = memo(function VttAssetShelf({
  open,
  onOpenChange,
  maps,
  tokens,
  customTokens,
  loadingMaps,
  mode,
  onLoadMap,
  onAddMap,
  onHoldMap,
  onRenameMap,
  onDuplicateMap,
  onDeleteMap,
  onHoldToken,
  onHoldAsset,
  onClearHeld,
  onCreateToken,
  focusCategory,
  playerMode = false
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
  onHoldMap?(mapId: string): void;
  onRenameMap(mapId: string, name: string): void;
  onDuplicateMap(mapId: string): void;
  onDeleteMap(mapId: string): void;
  onHoldToken(token: AvailableTabletopToken): void;
  onHoldAsset(assetId: string): void;
  onClearHeld?(): void;
  onCreateToken(kind?: CreatableTokenKind): void;
  focusCategory?: string;
  playerMode?: boolean;
}) {
  const [activeCategory, setActiveCategory] = useState<ShelfCategory>('maps');
  const [search, setSearch] = useState('');
  const map = useTabletopStore((state) => state.map);
  const currentUserId = useTabletopStore((state) => state.currentUserId);
  const ownedCharacterIds = useTabletopStore((state) => state.ownedCharacterIds);
  const setSelectedAsset = useTabletopStore((state) => state.setSelectedAsset);
  const setTool = useTabletopStore((state) => state.setTool);
  const assets = useMemo(() => getAllAssets(map.tilesets), [map.tilesets]);
  const categories = playerMode ? playerCategories : mode === 'build' ? buildCategories : sessionCategories;
  const visibleAssets = useMemo(() => filterAssets(assets, activeCategory, search), [activeCategory, assets, search]);
  const visibleTokens = useMemo(() => filterTokens(tokens, customTokens, activeCategory, search, playerMode, currentUserId, ownedCharacterIds), [activeCategory, currentUserId, customTokens, ownedCharacterIds, playerMode, search, tokens]);
  const visibleMaps = useMemo(() => maps.filter((entry) => matches(`${entry.name} ${(entry as { tags?: string[] }).tags?.join(' ') || ''}`, search)), [maps, search]);

  useEffect(() => {
    if (focusCategory && categories.some((entry) => entry.id === focusCategory)) setActiveCategory(focusCategory as ShelfCategory);
  }, [categories, focusCategory]);

  useEffect(() => {
    if (!categories.some((entry) => entry.id === activeCategory)) setActiveCategory(categories[0]?.id || 'maps');
  }, [activeCategory, categories]);

  return (
    <div className="pointer-events-auto fixed bottom-3 left-[calc(50%+28px)] z-40 w-[min(880px,calc(100vw-128px))] -translate-x-1/2">
      {open ? (
        <div className="mb-2 max-h-[240px] overflow-hidden rounded-xl border border-white/10 bg-[#12101a]/95 p-3 shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="mb-2 flex items-center gap-2">
            <Search size={16} className="text-textMuted" />
            <input
              className="h-8 flex-1 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-textMain outline-none placeholder:text-textMuted focus:border-vita/50"
              placeholder={`Buscar em ${categories.find((entry) => entry.id === activeCategory)?.label || 'assets'}`}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <button type="button" className="rounded-lg px-3 py-1.5 text-xs font-bold text-textMuted hover:bg-white/10 hover:text-white" onClick={() => onOpenChange(false)}>Esc</button>
          </div>
          <div className="grid max-h-[174px] grid-cols-[repeat(auto-fill,minmax(76px,76px))] justify-start gap-2 overflow-y-auto pr-1 [scrollbar-color:rgba(167,139,250,0.35)_transparent] [scrollbar-width:thin]">
            {activeCategory === 'maps' ? (
              loadingMaps ? <ShelfEmpty label="Carregando mapas..." /> : visibleMaps.map((entry) => (
                <div key={entry.id} className="group relative h-[98px] w-[76px] rounded-lg border border-white/10 bg-white/5 hover:border-vita/60 hover:bg-vita/20" title={entry.name}>
                  <button
                    type="button"
                    className="flex h-full w-full flex-col items-center gap-1 overflow-hidden rounded-lg p-1.5 pb-6"
                    onClick={() => mode === 'build' ? onLoadMap(entry.id, 'build') : onHoldMap?.(entry.id)}
                    onDoubleClick={() => mode === 'build' ? onLoadMap(entry.id, 'build') : undefined}
                  >
                    {(entry as { thumbnail?: string }).thumbnail ? (
                      <img src={(entry as { thumbnail?: string }).thumbnail} alt="" className="h-10 w-10 shrink-0 rounded-md object-cover" />
                    ) : (
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-[#241936] text-[#a9bfff]"><Map size={18} /></div>
                    )}
                    <span className="block h-6 w-full truncate text-center text-[10px] font-semibold leading-3 text-textMuted group-hover:text-white">{entry.name}</span>
                  </button>
                  {mode === 'build' && !(entry as { isDefault?: boolean }).isDefault ? (
                    <div className="absolute bottom-1 left-1/2 flex -translate-x-1/2 gap-1">
                      <button type="button" className="grid h-4 w-4 place-items-center rounded bg-white/10 text-[9px] font-black leading-none text-textMuted hover:text-white" title="Renomear" onClick={(event) => {
                        event.stopPropagation();
                        const nextName = window.prompt('Nome do mapa', entry.name);
                        if (nextName?.trim()) onRenameMap(entry.id, nextName.trim());
                      }}>R</button>
                      <button type="button" className="grid h-4 w-4 place-items-center rounded bg-white/10 text-[9px] font-black leading-none text-textMuted hover:text-white" title="Duplicar" onClick={(event) => {
                        event.stopPropagation();
                        onDuplicateMap(entry.id);
                      }}>D</button>
                      <button type="button" className="grid h-4 w-4 place-items-center rounded bg-red-500/10 text-[9px] font-black leading-none text-red-200 hover:bg-red-500/20" title="Excluir" onClick={(event) => {
                        event.stopPropagation();
                        if (window.confirm(`Excluir "${entry.name}"?`)) onDeleteMap(entry.id);
                      }}>X</button>
                    </div>
                  ) : null}
                </div>
              ))
            ) : isTokenCategory(activeCategory) ? (
              <>
                {!playerMode && getCreatableTokenKind(activeCategory) ? (
                  <button type="button" className="group flex h-[82px] w-[72px] flex-col items-center gap-1 overflow-hidden rounded-lg border border-dashed border-vita/50 bg-vita/10 p-1.5 hover:bg-vita/20" title={`Criar ${getCreateTokenLabel(activeCategory)}`} onClick={() => {
                    const kind = getCreatableTokenKind(activeCategory);
                    if (kind) onCreateToken(kind);
                  }}>
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-[#241936] text-xl font-black text-[#a9bfff]">+</div>
                    <span className="block w-full truncate text-center text-[10px] font-semibold leading-tight text-violet group-hover:text-white">+ {getCreateTokenLabel(activeCategory)}</span>
                  </button>
                ) : null}
                {visibleTokens.length ? visibleTokens.map((token) => (
                <button key={token.id} type="button" className="group flex h-[82px] w-[72px] flex-col items-center gap-1 overflow-hidden rounded-lg border border-white/10 bg-white/5 p-1.5 hover:border-vita/60 hover:bg-vita/20" title={token.name} onClick={() => mode === 'session' ? onHoldToken(token) : undefined}>
                  {token.image ? <img src={token.image} alt="" className="h-12 w-12 shrink-0 rounded-md object-cover" /> : <div className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-[#241936] text-lg font-black text-[#a9bfff]">{token.name.slice(0, 1).toUpperCase()}</div>}
                  <span className="block w-full truncate text-center text-[10px] font-semibold leading-tight text-textMuted group-hover:text-white">{token.name}</span>
                </button>
                )) : <ShelfEmpty label={mode === 'build' ? 'Nenhum token salvo nesta biblioteca.' : 'Nada para spawnar nesta categoria.'} />}
              </>
            ) : (
              visibleAssets.map((asset) => (
                <button key={asset.id} type="button" className="group flex h-[82px] w-[72px] flex-col items-center gap-1 overflow-hidden rounded-lg border border-white/10 bg-white/5 p-1.5 hover:border-vita/60 hover:bg-vita/20" title={asset.name} onClick={() => {
                  if (mode === 'build') {
                    onClearHeld?.();
                    setSelectedAsset(asset.id);
                    setTool(getToolForAsset(asset));
                    onOpenChange(false);
                    return;
                  }
                  onHoldAsset(asset.id);
                }}>
                  <AssetThumbnail asset={asset} className="h-12 w-12 shrink-0 rounded-md object-cover" />
                  <span className="block w-full truncate text-center text-[10px] font-semibold leading-tight text-textMuted group-hover:text-white">{asset.name}</span>
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
});

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
  const searchText = search.trim();
  return assets
    .filter((asset) => {
      const matchesSearch = matches(`${asset.name} ${asset.tags.join(' ')}`, search);
      if (!searchText) return (!allowed || allowed.includes(asset.typeCategory || 'prop')) && matchesSearch;
      return matchesSearch;
    })
    .slice(0, 120);
}

type CreatableTokenKind = Extract<TabletopTokenKind, 'character' | 'npc' | 'enemy' | 'creature' | 'form' | 'companion'>;

function filterTokens(tokens: AvailableTabletopToken[], customTokens: AvailableTabletopToken[], category: ShelfCategory, search: string, playerMode: boolean, currentUserId: string, ownedCharacterIds: string[]) {
  const source = category === 'tokens'
    ? [...tokens, ...customTokens].filter((token) => token.kind === 'character' || token.isPlayerToken)
    : category === 'npcs'
      ? customTokens.filter((token) => token.kind === 'npc')
    : category === 'enemies'
      ? [...tokens.filter((token) => token.kind === 'enemy'), ...customTokens.filter((token) => token.kind === 'enemy')]
    : category === 'creatures'
          ? customTokens.filter((token) => token.kind === 'creature')
          : category === 'forms'
            ? customTokens.filter((token) => token.kind === 'form' || token.isFormToken)
            : category === 'miniSheets'
              ? customTokens.filter((token) => token.kind === 'companion' || token.kind === 'summon' || token.isMiniSheetToken)
          : [];
  return source
    .filter((token) => !playerMode || tokenBelongsToPlayer(token, currentUserId, ownedCharacterIds))
    .filter((token) => matches(`${token.name} ${token.subtitle || ''}`, search));
}

function isTokenCategory(category: ShelfCategory) {
  return category === 'tokens' || category === 'npcs' || category === 'enemies' || category === 'creatures' || category === 'forms' || category === 'miniSheets';
}

function getCreatableTokenKind(category: ShelfCategory): CreatableTokenKind | null {
  if (category === 'tokens') return 'character';
  if (category === 'npcs') return 'npc';
  if (category === 'enemies') return 'enemy';
  if (category === 'creatures') return 'creature';
  if (category === 'forms') return 'form';
  if (category === 'miniSheets') return 'companion';
  return null;
}

function getCreateTokenLabel(category: ShelfCategory) {
  if (category === 'tokens') return 'Token de player';
  if (category === 'enemies') return 'Inimigo';
  if (category === 'creatures') return 'Criatura';
  if (category === 'forms') return 'Forma';
  if (category === 'miniSheets') return 'Mini ficha';
  return 'NPC';
}

function tokenBelongsToPlayer(token: AvailableTabletopToken, currentUserId: string, ownedCharacterIds: string[]) {
  const owned = new Set(ownedCharacterIds.filter(Boolean));
  if (token.ownerUserId && currentUserId && token.ownerUserId === currentUserId) return true;
  if (token.ownerCharacterId && owned.has(token.ownerCharacterId)) return true;
  if (token.sourceSheetId && owned.has(token.sourceSheetId)) return true;
  if (token.sourceFormId && owned.has(token.sourceFormId)) return true;
  if (token.formOwnerCharacterId && owned.has(token.formOwnerCharacterId)) return true;
  return false;
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
