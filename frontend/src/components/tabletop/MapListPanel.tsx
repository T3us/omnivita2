import clsx from 'clsx';
import { Button } from '../Ui';
import type { MapSummary } from './types';

export function MapListPanel({
  maps,
  activeMapId,
  loading,
  onLoad
}: {
  maps: MapSummary[];
  activeMapId: string;
  loading: boolean;
  onLoad(mapId: string): void;
}) {
  return (
    <section className="rounded-lg border border-line bg-panel/90 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-black uppercase text-violet">Mapas</p>
        {loading ? <span className="text-xs text-textMuted">Carregando</span> : null}
      </div>
      <div className="mt-3 grid gap-2">
        {maps.map((map) => (
          <button
            key={map.id}
            type="button"
            className={clsx(
              'rounded-lg border p-3 text-left transition',
              activeMapId === map.id ? 'border-vita/60 bg-vita/20' : 'border-line bg-white/5 hover:bg-white/10'
            )}
            onClick={() => onLoad(map.id)}
          >
            <strong className="block text-sm text-textMain">{map.name}</strong>
            <span className="mt-1 block text-xs text-textMuted">{map.width}x{map.height} grid {map.gridSize}</span>
          </button>
        ))}
        {!maps.length ? <p className="text-sm text-textMuted">Nenhum mapa salvo ainda.</p> : null}
      </div>
      <div className="mt-3">
        <Button type="button" onClick={() => activeMapId && onLoad(activeMapId)} disabled={!activeMapId}>Recarregar</Button>
      </div>
    </section>
  );
}
