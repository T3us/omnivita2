import clsx from 'clsx';
import type { ReactNode } from 'react';
import { Badge, Button } from '../../Ui';
import { useTabletopStore } from '../mapStore';
import type { MapTool } from '../types';

const sessionTools: Array<{ id: MapTool; label: string; hint: string }> = [
  { id: 'select', label: 'Selecionar', hint: 'V' },
  { id: 'token', label: 'Criar token', hint: 'T' },
  { id: 'measure', label: 'Regua', hint: 'M' },
  { id: 'ping', label: 'Ping', hint: 'P' },
  { id: 'fog', label: 'Fog', hint: 'F' },
  { id: 'door', label: 'Porta', hint: 'D' },
  { id: 'light', label: 'Luz', hint: 'L' },
  { id: 'note', label: 'Nota', hint: 'N' },
  { id: 'template', label: 'Area', hint: 'A' }
];

export function SessionToolbar({
  saving,
  saveStatus,
  onSave,
  onBackToBuild
}: {
  saving: boolean;
  saveStatus?: 'saved' | 'dirty' | 'saving' | 'error';
  onSave(): void;
  onBackToBuild(): void;
}) {
  const tool = useTabletopStore((state) => state.tool);
  const dirty = useTabletopStore((state) => state.dirty);
  const setTool = useTabletopStore((state) => state.setTool);
  const zoom = useTabletopStore((state) => state.zoom);
  const setZoom = useTabletopStore((state) => state.setZoom);
  const viewMode = useTabletopStore((state) => state.sessionViewMode);
  const dynamicVision = useTabletopStore((state) => state.sessionDynamicVision);
  const fogEnabled = useTabletopStore((state) => state.sessionFogEnabled);
  const ignoreCollision = useTabletopStore((state) => state.sessionIgnoreCollision);
  const darkness = useTabletopStore((state) => state.sessionGlobalDarkness);
  const setSessionViewMode = useTabletopStore((state) => state.setSessionViewMode);
  const setSessionDynamicVision = useTabletopStore((state) => state.setSessionDynamicVision);
  const setSessionFogEnabled = useTabletopStore((state) => state.setSessionFogEnabled);
  const setSessionIgnoreCollision = useTabletopStore((state) => state.setSessionIgnoreCollision);
  const setSessionGlobalDarkness = useTabletopStore((state) => state.setSessionGlobalDarkness);

  const statusLabel = saveStatus === 'saving'
    ? 'Salvando'
    : saveStatus === 'error'
      ? 'Erro ao salvar'
      : dirty || saveStatus === 'dirty'
        ? 'Alteracoes locais'
        : 'Salvo';
  const statusTone = saveStatus === 'error' ? 'danger' : dirty || saveStatus === 'dirty' || saveStatus === 'saving' ? 'warn' : 'good';

  return (
    <section className="rounded-lg border border-line bg-panel/90 p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="accent">Estudio de sessao</Badge>
          <Badge tone={statusTone}>{statusLabel}</Badge>
          <button
            type="button"
            className={clsx('rounded-lg border px-3 py-2 text-sm font-black transition', viewMode === 'gm' ? 'border-vita/60 bg-vita/20 text-textMain' : 'border-line bg-white/5 text-textMuted')}
            onClick={() => setSessionViewMode('gm')}
          >
            GM View
          </button>
          <button
            type="button"
            className={clsx('rounded-lg border px-3 py-2 text-sm font-black transition', viewMode === 'player-preview' ? 'border-vita/60 bg-vita/20 text-textMain' : 'border-line bg-white/5 text-textMuted')}
            onClick={() => setSessionViewMode('player-preview')}
          >
            Preview Player
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={onBackToBuild}>Modo construcao</Button>
          <Button type="button" tone="primary" onClick={onSave} disabled={saving}>{saving ? 'Salvando' : 'Forcar salvar agora'}</Button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {sessionTools.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className={clsx(
                'rounded-lg border px-3 py-2 text-sm font-bold transition',
                tool === entry.id ? 'border-vita/60 bg-vita/25 text-textMain' : 'border-line bg-white/5 text-textMuted hover:bg-white/10'
              )}
              onClick={() => setTool(entry.id)}
              title={entry.hint}
            >
              {entry.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm text-textMuted">
          <ToggleButton active={dynamicVision} onClick={() => setSessionDynamicVision(!dynamicVision)}>Visao dinamica</ToggleButton>
          <ToggleButton active={fogEnabled} onClick={() => setSessionFogEnabled(!fogEnabled)}>Fog</ToggleButton>
          <ToggleButton active={ignoreCollision} onClick={() => setSessionIgnoreCollision(!ignoreCollision)}>Ignorar colisao GM</ToggleButton>
          <label className="flex min-w-44 items-center gap-2 rounded-lg border border-line bg-white/5 px-3 py-2">
            Escuridao
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={darkness}
              onChange={(event) => setSessionGlobalDarkness(Number(event.target.value))}
              className="accent-vita"
            />
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-line bg-white/5 px-3 py-2">
            Zoom
            <input
              type="range"
              min={0.55}
              max={2.2}
              step={0.05}
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              className="accent-vita"
            />
          </label>
        </div>
      </div>
    </section>
  );
}

function ToggleButton({ active, onClick, children }: { active: boolean; onClick(): void; children: ReactNode }) {
  return (
    <button
      type="button"
      className={clsx('rounded-lg border px-3 py-2 text-sm font-bold transition', active ? 'border-vita/60 bg-vita/20 text-textMain' : 'border-line bg-white/5 text-textMuted')}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
