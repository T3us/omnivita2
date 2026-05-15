import clsx from 'clsx';
import { useState } from 'react';
import { Button } from '../../Ui';
import { useTabletopStore } from '../mapStore';
import type { AvailableTabletopToken, MapSummary, SessionBoardSummary } from '../types';
import { SessionAssetDock } from './SessionAssetDock';
import { SessionBottomBar } from './SessionBottomBar';
import { SessionInspectorDrawer } from './SessionInspectorDrawer';
import { SessionStage } from './SessionStage';
import { SessionToolRail } from './SessionToolRail';

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
  const dirty = useTabletopStore((state) => state.dirty);
  const zoom = useTabletopStore((state) => state.zoom);
  const setZoom = useTabletopStore((state) => state.setZoom);
  const showGrid = useTabletopStore((state) => state.showGrid);
  const toggleGrid = useTabletopStore((state) => state.toggleGrid);
  const sessionViewMode = useTabletopStore((state) => state.sessionViewMode);
  const setSessionViewMode = useTabletopStore((state) => state.setSessionViewMode);
  const undo = useTabletopStore((state) => state.undo);
  const redo = useTabletopStore((state) => state.redo);
  const [toolRailCollapsed, setToolRailCollapsed] = useState(false);
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [inspectorCollapsed, setInspectorCollapsed] = useState(false);

  return (
    <div className="relative min-h-0 overflow-hidden rounded-lg border border-line bg-[#08040f]">
      <div className="pointer-events-auto absolute inset-x-3 top-3 z-20 flex min-h-12 flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-panel/95 px-3 py-2 shadow-soft backdrop-blur-xl">
        <div className="flex min-w-0 items-center gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-textMain">{map.name}</p>
            <p className="text-[11px] font-semibold uppercase text-violet">Estudio de sessao</p>
          </div>
          <span className={clsx('rounded-lg border px-2 py-1 text-xs font-bold', dirty || saveStatus === 'dirty' ? 'border-amber/40 text-amber' : saveStatus === 'error' ? 'border-coral/40 text-coral' : 'border-vita/35 text-violet')}>
            {saveStatus === 'saving' ? 'Salvando' : saveStatus === 'error' ? 'Erro' : dirty || saveStatus === 'dirty' ? 'Alteracoes locais' : 'Salvo'}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={clsx('rounded-lg border px-3 py-2 text-xs font-black', sessionViewMode === 'gm' ? 'border-vita/60 bg-vita/25 text-textMain' : 'border-line bg-white/5 text-textMuted')}
            onClick={() => setSessionViewMode('gm')}
          >
            GM View
          </button>
          <button
            type="button"
            className={clsx('rounded-lg border px-3 py-2 text-xs font-black', sessionViewMode === 'player-preview' ? 'border-vita/60 bg-vita/25 text-textMain' : 'border-line bg-white/5 text-textMuted')}
            onClick={() => setSessionViewMode('player-preview')}
          >
            Preview Player
          </button>
          <Button type="button" onClick={onBackToBuild}>Build</Button>
          <Button type="button" onClick={undo}>Undo</Button>
          <Button type="button" onClick={redo}>Redo</Button>
          <button type="button" className="rounded-lg border border-line bg-white/5 px-3 py-2 text-xs font-black text-textMain" onClick={toggleGrid}>
            Grid {showGrid ? 'on' : 'off'}
          </button>
          <label className="flex h-9 items-center gap-2 rounded-lg border border-line bg-white/5 px-2 text-xs font-bold text-textMuted">
            Zoom
            <input className="w-24 accent-vita" type="range" min={0.35} max={2.75} step={0.05} value={zoom} onChange={(event) => setZoom(Number(event.target.value))} />
          </label>
          <Button type="button" tone="primary" onClick={onSave} disabled={saving}>{saving ? 'Salvando' : 'Salvar'}</Button>
          <button type="button" className="rounded-lg border border-line bg-white/5 px-3 py-2 text-xs font-black text-textMain" onClick={() => setToolRailCollapsed((value) => !value)}>Tools</button>
          <button type="button" className="rounded-lg border border-line bg-white/5 px-3 py-2 text-xs font-black text-textMain" onClick={() => setDockCollapsed((value) => !value)}>Dock</button>
          <button type="button" className="rounded-lg border border-line bg-white/5 px-3 py-2 text-xs font-black text-textMain" onClick={() => setInspectorCollapsed((value) => !value)}>Inspector</button>
        </div>
      </div>

      <SessionStage />
      <SessionToolRail collapsed={toolRailCollapsed} />
      <SessionInspectorDrawer collapsed={inspectorCollapsed} onToggleCollapsed={() => setInspectorCollapsed((value) => !value)} onSave={onSave} />
      <SessionAssetDock
          tokens={tokens}
          maps={maps}
          sessions={sessions}
          activeSessionBoardId={activeSessionBoardId}
          mapsLoading={mapsLoading}
          collapsed={dockCollapsed}
          onToggleCollapsed={() => setDockCollapsed((value) => !value)}
          onCreateSessionFromMap={onCreateSessionFromMap}
          onAddMapInstance={onAddMapInstance}
          onLoadSessionBoard={onLoadSessionBoard}
          onDeleteSessionBoard={onDeleteSessionBoard}
        />
      <SessionBottomBar saveStatus={saveStatus} />
    </div>
  );
}
