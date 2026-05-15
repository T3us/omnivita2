import clsx from 'clsx';
import { ASSET_TYPE_LABELS, getAsset } from '../assets';
import { useTabletopStore } from '../mapStore';

export function SessionBottomBar({ saveStatus }: { saveStatus: 'saved' | 'dirty' | 'saving' | 'error' }) {
  const map = useTabletopStore((state) => state.map);
  const tool = useTabletopStore((state) => state.tool);
  const selectedAssetId = useTabletopStore((state) => state.selectedAssetId);
  const snapMode = useTabletopStore((state) => state.snapMode);
  const showGrid = useTabletopStore((state) => state.showGrid);
  const sessionViewMode = useTabletopStore((state) => state.sessionViewMode);
  const sessionFogEnabled = useTabletopStore((state) => state.sessionFogEnabled);
  const sessionDynamicVision = useTabletopStore((state) => state.sessionDynamicVision);
  const selectedTokenIds = useTabletopStore((state) => state.selectedTokenIds);
  const selectedObjectIds = useTabletopStore((state) => state.selectedObjectIds);
  const selectedMapInstanceIds = useTabletopStore((state) => state.selectedMapInstanceIds);
  const selectedRegionIds = useTabletopStore((state) => state.selectedRegionIds);
  const selectedTileCells = useTabletopStore((state) => state.selectedTileCells);
  const asset = getAsset(selectedAssetId, map.tilesets);
  const selectionCount = selectedTokenIds.length + selectedObjectIds.length + selectedMapInstanceIds.length + selectedRegionIds.length + selectedTileCells.length;

  return (
    <div className="pointer-events-auto absolute inset-x-3 bottom-1 z-10 flex min-h-7 items-center justify-between gap-2 rounded-lg border border-line bg-black/55 px-3 text-[11px] font-semibold text-textMuted backdrop-blur-md">
      <div className="flex min-w-0 items-center gap-2 overflow-hidden">
        <Pill label="Ferramenta" value={tool === 'pan' ? 'Pan' : tool} active />
        <Pill label="View" value={sessionViewMode === 'gm' ? 'GM' : 'Player'} />
        <Pill label="Snap" value={snapMode === 'fine' ? '4px' : snapMode === 'grid' ? 'Grid' : 'Livre'} />
        <Pill label="Grid" value={showGrid ? 'on' : 'off'} />
        <Pill label="Fog" value={sessionFogEnabled ? sessionDynamicVision ? 'dinamico' : 'manual' : 'off'} />
      </div>
      <div className="flex min-w-0 items-center gap-2 overflow-hidden">
        <Pill label="Selecao" value={String(selectionCount)} />
        <Pill label="Asset" value={asset ? `${asset.name} ${asset.typeCategory ? `/${ASSET_TYPE_LABELS[asset.typeCategory]}` : ''}` : '-'} />
        <span className={clsx(
          'shrink-0 rounded-md border px-2 py-1',
          saveStatus === 'error' ? 'border-coral/40 text-coral' : saveStatus === 'saving' || saveStatus === 'dirty' ? 'border-amber/40 text-amber' : 'border-vita/35 text-violet'
        )}>
          {saveStatus === 'saving' ? 'salvando' : saveStatus === 'error' ? 'erro' : saveStatus === 'dirty' ? 'alteracoes locais' : 'salvo'}
        </span>
      </div>
    </div>
  );
}

function Pill({ label, value, active }: { label: string; value: string; active?: boolean }) {
  return (
    <span className={clsx('shrink-0 rounded-md border px-2 py-1', active ? 'border-vita/40 text-textMain' : 'border-line text-textMuted')}>
      <span className="text-violet">{label}: </span>{value}
    </span>
  );
}
