import clsx from 'clsx';
import { useTabletopStore } from '../mapStore';
import type { MapTool } from '../types';

const tools: Array<{ id: MapTool; icon: string; label: string; hint: string }> = [
  { id: 'select', icon: 'V', label: 'Selecionar', hint: 'V' },
  { id: 'pan', icon: 'H', label: 'Mover camera', hint: 'H ou Space' },
  { id: 'token', icon: 'T', label: 'Criar token', hint: 'T' },
  { id: 'fog', icon: 'F', label: 'Fog', hint: 'F' },
  { id: 'light', icon: 'L', label: 'Luz', hint: 'L' },
  { id: 'door', icon: 'D', label: 'Porta', hint: 'D' },
  { id: 'measure', icon: 'M', label: 'Regua', hint: 'M' },
  { id: 'ping', icon: 'P', label: 'Ping', hint: 'P' },
  { id: 'template', icon: 'A', label: 'Area / template', hint: 'A' },
  { id: 'note', icon: 'N', label: 'Nota', hint: 'N' }
];

export function SessionToolRail({ collapsed = false }: { collapsed?: boolean }) {
  const tool = useTabletopStore((state) => state.tool);
  const setTool = useTabletopStore((state) => state.setTool);

  if (collapsed) return null;

  return (
    <nav className="pointer-events-auto absolute left-3 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-2 rounded-lg border border-line bg-panel/95 p-2 shadow-soft backdrop-blur-xl">
      {tools.map((entry) => (
        <button
          key={entry.id}
          type="button"
          className={clsx(
            'flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-black transition',
            tool === entry.id
              ? 'border-vita/70 bg-vita/25 text-textMain shadow-[0_0_18px_rgba(139,92,246,0.28)]'
              : 'border-line bg-white/5 text-textMuted hover:bg-white/10 hover:text-textMain'
          )}
          onClick={() => setTool(entry.id)}
          title={`${entry.label} (${entry.hint})`}
          aria-label={entry.label}
        >
          {entry.icon}
        </button>
      ))}
    </nav>
  );
}
