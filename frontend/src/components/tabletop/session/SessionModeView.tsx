import { ASSET_TYPE_LABELS, getAsset } from '../assets';
import { useTabletopStore } from '../mapStore';
import type { AvailableTabletopToken, MapSummary, SessionBoardSummary } from '../types';
import { SessionSidebar } from './SessionSidebar';
import { SessionStage } from './SessionStage';
import { SessionToolbar } from './SessionToolbar';

export function SessionModeView({
  tokens,
  maps,
  mapsLoading,
  sessions,
  activeSessionBoardId,
  saving,
  saveStatus,
  onSave,
  onBackToBuild,
  onCreateSessionFromMap,
  onAddMapInstance,
  onLoadSessionBoard,
  onDeleteSessionBoard
}: {
  tokens: AvailableTabletopToken[];
  maps: MapSummary[];
  mapsLoading: boolean;
  sessions: SessionBoardSummary[];
  activeSessionBoardId: string;
  saving: boolean;
  saveStatus: 'saved' | 'dirty' | 'saving' | 'error';
  onSave(): void;
  onBackToBuild(): void;
  onCreateSessionFromMap(mapId: string): void;
  onAddMapInstance(mapId: string): void;
  onLoadSessionBoard(boardId: string): void;
  onDeleteSessionBoard(boardId: string): void;
}) {
  const map = useTabletopStore((state) => state.map);
  const tool = useTabletopStore((state) => state.tool);
  const selectedAssetId = useTabletopStore((state) => state.selectedAssetId);
  const selectedTokenIds = useTabletopStore((state) => state.selectedTokenIds);
  const selectedObjectIds = useTabletopStore((state) => state.selectedObjectIds);
  const selectedTileCells = useTabletopStore((state) => state.selectedTileCells);
  const selectedMapInstanceIds = useTabletopStore((state) => state.selectedMapInstanceIds);
  const selectedRegionIds = useTabletopStore((state) => state.selectedRegionIds);
  const placementRotation = useTabletopStore((state) => state.placementRotation);
  const snapMode = useTabletopStore((state) => state.snapMode);
  const eraseMode = useTabletopStore((state) => state.eraseMode);
  const sessionViewMode = useTabletopStore((state) => state.sessionViewMode);
  const sessionDynamicVision = useTabletopStore((state) => state.sessionDynamicVision);
  const sessionFogEnabled = useTabletopStore((state) => state.sessionFogEnabled);
  const asset = getAsset(selectedAssetId, map.tilesets);

  return (
    <div className="grid min-h-0 gap-4">
      <SessionToolbar saving={saving} saveStatus={saveStatus} onSave={onSave} onBackToBuild={onBackToBuild} />
      <div className="grid min-h-0 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid min-h-0 content-start gap-2">
          <SessionStage />
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-panel/90 px-3 py-2 text-sm text-textMuted">
            <StatusPill label="Ferramenta" value={tool} />
            <StatusPill label="Visao" value={sessionViewMode === 'gm' ? 'GM' : 'Player'} />
            <StatusPill label="Asset" value={asset ? `${asset.name} (${asset.typeCategory ? ASSET_TYPE_LABELS[asset.typeCategory] : asset.category})` : '-'} />
            <StatusPill label="Rotacao" value={`${placementRotation} deg`} />
            <StatusPill label="Snap" value={snapMode === 'fine' ? 'Fino 4px' : snapMode === 'grid' ? 'Grid' : 'Livre'} />
            <StatusPill label="Fog" value={sessionFogEnabled ? sessionDynamicVision ? 'Dinamico' : 'Manual' : 'Desligado'} />
            <StatusPill label="Apagar" value={eraseMode} />
            <StatusPill label="Selecao" value={`${selectedTokenIds.length} token(s), ${selectedMapInstanceIds.length} mapa(s), ${selectedRegionIds.length} regiao(oes), ${selectedObjectIds.length} item(ns), ${selectedTileCells.length} porta(s)`} />
          </div>
        </div>
        <SessionSidebar
          tokens={tokens}
          maps={maps}
          sessions={sessions}
          activeMapId={map.id}
          activeSessionBoardId={activeSessionBoardId}
          mapsLoading={mapsLoading}
          onCreateSessionFromMap={onCreateSessionFromMap}
          onAddMapInstance={onAddMapInstance}
          onLoadSessionBoard={onLoadSessionBoard}
          onDeleteSessionBoard={onDeleteSessionBoard}
        />
      </div>
    </div>
  );
}

function StatusPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-lg border border-line bg-white/5 px-2 py-1">
      <span className="font-bold text-violet">{label}: </span>
      <span className="text-textMain">{value}</span>
    </span>
  );
}
