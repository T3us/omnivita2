import { ArrowLeft, Eye, EyeOff, Focus, Plus, RotateCcw, Save } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTabletopStore } from '../mapStore';

export function VttTopBar({
  saving,
  zoom,
  onSave,
  onNewMap,
  onResetCamera,
  onFocusSelection,
  onToggleInspector,
  onModeChange
}: {
  saving: boolean;
  zoom: number;
  onSave(): void;
  onNewMap(): void;
  onResetCamera(): void;
  onFocusSelection(): void;
  onToggleInspector(): void;
  onModeChange(mode: 'build' | 'session'): void;
}) {
  const map = useTabletopStore((state) => state.map);
  const dirty = useTabletopStore((state) => state.dirty);
  const setMapMeta = useTabletopStore((state) => state.setMapMeta);
  const viewMode = useTabletopStore((state) => state.sessionViewMode);
  const setSessionViewMode = useTabletopStore((state) => state.setSessionViewMode);
  const saveLabel = saving ? 'Salvando' : dirty ? 'Alterado' : 'Salvo';

  return (
    <header className="pointer-events-auto fixed left-[76px] right-4 top-3 z-40 flex h-11 items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#12101a]/88 px-3 text-textMain shadow-[0_18px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <div className="flex min-w-0 items-center gap-3">
        <Link to="/mestre" className="grid h-8 w-8 place-items-center rounded-lg text-textMuted transition hover:bg-white/10 hover:text-white" title="Voltar ao mestre">
          <ArrowLeft size={17} />
        </Link>
        {map.mode === 'build' && !map.bounds ? (
          <span className="truncate px-2 text-sm font-black text-white">Build - area livre</span>
        ) : (
          <input
            className="h-8 min-w-0 max-w-[34vw] rounded-lg border border-transparent bg-transparent px-2 text-sm font-black text-white outline-none transition hover:border-white/10 hover:bg-white/5 focus:border-vita/50 focus:bg-white/5"
            title={map.mode === 'build' ? 'Renomear mapa salvo' : 'Nome da sessao'}
            value={map.name || 'Novo mapa'}
            onChange={(event) => setMapMeta({ name: event.target.value || 'Novo mapa' })}
          />
        )}
        <span className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${map.mode === 'build' ? 'border-vita/40 bg-vita/20 text-violet' : 'border-cyan-300/30 bg-cyan-400/10 text-cyan-100'}`}>
          {map.mode === 'build' ? 'Build' : 'Session'}
        </span>
        <span className={`hidden rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] sm:inline ${dirty ? 'border-amber-300/30 bg-amber-400/10 text-amber-100' : 'border-emerald-300/25 bg-emerald-400/10 text-emerald-100'}`}>
          {saveLabel}
        </span>
      </div>
      <div className="flex items-center gap-1">
        {map.mode === 'build' ? (
          <button type="button" className="grid h-8 w-8 place-items-center rounded-lg text-textMuted hover:bg-white/10 hover:text-white" title="Criar mapa vazio" onClick={onNewMap}><Plus size={16} /></button>
        ) : null}
        <div className="flex overflow-hidden rounded-lg border border-white/10 bg-white/5">
          <button
            type="button"
            className={`px-3 py-1.5 text-xs font-black uppercase transition ${map.mode === 'build' ? 'bg-vita/35 text-white' : 'text-textMuted hover:bg-white/10 hover:text-white'}`}
            onClick={() => onModeChange('build')}
            title="Build: editar mapa base e biblioteca"
          >
            Build
          </button>
          <button
            type="button"
            className={`px-3 py-1.5 text-xs font-black uppercase transition ${map.mode === 'session' ? 'bg-vita/35 text-white' : 'text-textMuted hover:bg-white/10 hover:text-white'}`}
            onClick={() => onModeChange('session')}
            title="Session: jogar, mover tokens, fog e templates"
          >
            Session
          </button>
        </div>
        <button
          type="button"
          className="grid h-8 w-8 place-items-center rounded-lg text-textMuted hover:bg-white/10 hover:text-white"
          title="GM / Player Preview"
          onClick={() => setSessionViewMode(viewMode === 'gm' ? 'player-preview' : 'gm')}
        >
          {viewMode === 'gm' ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>
        <button type="button" className="grid h-8 w-8 place-items-center rounded-lg text-textMuted hover:bg-white/10 hover:text-white" title="Focar selecao" onClick={onFocusSelection}><Focus size={16} /></button>
        <button type="button" className="grid h-8 w-8 place-items-center rounded-lg text-textMuted hover:bg-white/10 hover:text-white" title="Resetar camera" onClick={onResetCamera}><RotateCcw size={16} /></button>
        <span className="hidden rounded-lg border border-white/10 px-2 py-1 text-xs font-bold text-textMuted sm:inline">{Math.round(zoom * 100)}%</span>
        <button type="button" className="grid h-8 w-8 place-items-center rounded-lg text-textMuted hover:bg-white/10 hover:text-white" title="Inspector" onClick={onToggleInspector}>I</button>
        <button type="button" className="flex h-8 items-center gap-1 rounded-lg px-2 text-textMuted hover:bg-white/10 hover:text-white disabled:opacity-50" title={map.mode === 'build' ? 'Salvar area como mapa' : 'Salvar sessao'} onClick={onSave} disabled={saving}>
          <Save size={16} />
          {map.mode === 'build' ? <span className="hidden text-xs font-black sm:inline">Salvar area</span> : null}
        </button>
      </div>
    </header>
  );
}
