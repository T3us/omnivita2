import clsx from 'clsx';
import type { ReactNode } from 'react';
import { Button, Badge } from '../Ui';
import { useTabletopStore } from './mapStore';
import type { MapTool, TabletopMode } from './types';

const buildTools: Array<{ id: MapTool; label: string }> = [
  { id: 'select', label: 'Selecionar' },
  { id: 'brush', label: 'Piso' },
  { id: 'wall', label: 'Parede' },
  { id: 'object', label: 'Objeto' },
  { id: 'door', label: 'Porta' },
  { id: 'cover', label: 'Cobertura' },
  { id: 'terminal', label: 'Terminal' },
  { id: 'light', label: 'Luz' },
  { id: 'zone', label: 'Zona' },
  { id: 'note', label: 'Nota' },
  { id: 'fog', label: 'Fog' },
  { id: 'erase', label: 'Apagar' }
];

const sessionTools: Array<{ id: MapTool; label: string }> = [
  { id: 'token', label: 'Token' },
  { id: 'fog', label: 'Fog' },
  { id: 'select', label: 'Selecionar' }
];

export function MapToolbar({
  saving,
  onNew,
  onSave,
  onDelete
}: {
  saving: boolean;
  onNew(): void;
  onSave(): void;
  onDelete(): void;
}) {
  const map = useTabletopStore((state) => state.map);
  const tool = useTabletopStore((state) => state.tool);
  const zoom = useTabletopStore((state) => state.zoom);
  const dirty = useTabletopStore((state) => state.dirty);
  const setMode = useTabletopStore((state) => state.setMode);
  const setTool = useTabletopStore((state) => state.setTool);
  const setZoom = useTabletopStore((state) => state.setZoom);
  const tools = map.mode === 'build' ? buildTools : sessionTools;

  return (
    <section className="rounded-lg border border-line bg-panel/90 p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <ModeButton mode="build" current={map.mode} onClick={setMode}>Construcao</ModeButton>
          <ModeButton mode="session" current={map.mode} onClick={setMode}>Sessao</ModeButton>
          <Badge tone={dirty ? 'warn' : 'good'}>{dirty ? 'Alteracoes locais' : 'Salvo'}</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={onNew}>Novo</Button>
          <Button type="button" tone="primary" onClick={onSave} disabled={saving}>{saving ? 'Salvando' : 'Salvar'}</Button>
          <Button type="button" tone="danger" onClick={onDelete}>Excluir</Button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {tools.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className={clsx(
                'min-h-9 rounded-lg border px-3 text-sm font-bold transition',
                tool === entry.id ? 'border-vita/60 bg-vita/25 text-textMain' : 'border-line bg-white/5 text-textMuted hover:bg-white/10'
              )}
              onClick={() => setTool(entry.id)}
            >
              {entry.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm text-textMuted">
          <span>Zoom</span>
          <input
            className="w-32 accent-vita"
            type="range"
            min="0.5"
            max="2.5"
            step="0.1"
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
          />
          <span className="w-12 text-right">{Math.round(zoom * 100)}%</span>
        </div>
      </div>
    </section>
  );
}

function ModeButton({ mode, current, onClick, children }: { mode: TabletopMode; current: TabletopMode; onClick(mode: TabletopMode): void; children: ReactNode }) {
  return (
    <button
      type="button"
      className={clsx(
        'min-h-9 rounded-lg border px-3 text-sm font-black',
        current === mode ? 'border-vita/60 bg-vita/25 text-textMain' : 'border-line bg-white/5 text-textMuted hover:bg-white/10'
      )}
      onClick={() => onClick(mode)}
    >
      {children}
    </button>
  );
}
