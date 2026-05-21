import { Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTabletopStore } from '../mapStore';
import type { MapTool } from '../types';

const buildToolCommands: Array<{ label: string; tool: MapTool; keys: string }> = [
  { label: 'Selecionar', tool: 'select', keys: 'V' },
  { label: 'Mover camera', tool: 'pan', keys: 'H' },
  { label: 'Pintar piso', tool: 'brush', keys: 'B' },
  { label: 'Parede', tool: 'wall', keys: 'W' },
  { label: 'Borracha', tool: 'erase', keys: 'E' },
  { label: 'Fog', tool: 'fog', keys: 'F' },
  { label: 'Luz', tool: 'light', keys: 'L' },
  { label: 'Porta', tool: 'door', keys: 'D' },
  { label: 'Regua', tool: 'measure', keys: 'M' },
  { label: 'Salvar area como mapa', tool: 'frame', keys: 'Save' },
  { label: 'Nota', tool: 'note', keys: 'N' }
];

const sessionToolCommands: Array<{ label: string; tool: MapTool; keys: string }> = [
  { label: 'Selecionar', tool: 'select', keys: 'V' },
  { label: 'Mover camera', tool: 'pan', keys: 'H' },
  { label: 'Spawn token', tool: 'token', keys: 'T' },
  { label: 'Fog', tool: 'fog', keys: 'F' },
  { label: 'Luz', tool: 'light', keys: 'L' },
  { label: 'Porta', tool: 'door', keys: 'D' },
  { label: 'Regua', tool: 'measure', keys: 'M' },
  { label: 'Ping', tool: 'ping', keys: 'P' },
  { label: 'Templates', tool: 'template', keys: 'A' },
  { label: 'Nota', tool: 'note', keys: 'N' }
];

export function VttCommandPalette({
  open,
  onClose,
  onOpenAssets,
  onResetCamera
}: {
  open: boolean;
  onClose(): void;
  onOpenAssets(): void;
  onResetCamera(): void;
}) {
  const [search, setSearch] = useState('');
  const setTool = useTabletopStore((state) => state.setTool);
  const mode = useTabletopStore((state) => state.map.mode);
  const commands = useMemo(() => {
    const toolCommands = mode === 'build' ? buildToolCommands : sessionToolCommands;
    const rows = [
      ...toolCommands.map((entry) => ({ label: entry.label, hint: entry.keys, run: () => setTool(entry.tool) })),
      { label: 'Abrir assets', hint: 'B', run: onOpenAssets },
      { label: 'Resetar camera', hint: 'Pan', run: onResetCamera },
      { label: 'Player Preview', hint: 'GM', run: () => useTabletopStore.getState().setSessionViewMode('player-preview') },
      { label: 'GM View', hint: 'GM', run: () => useTabletopStore.getState().setSessionViewMode('gm') }
    ];
    const q = search.trim().toLowerCase();
    return q ? rows.filter((row) => row.label.toLowerCase().includes(q)) : rows;
  }, [mode, onOpenAssets, onResetCamera, search, setTool]);

  if (!open) return null;

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 grid place-items-start bg-black/35 pt-[12vh] backdrop-blur-sm" onMouseDown={onClose}>
      <div className="mx-auto w-[min(560px,calc(100vw-32px))] overflow-hidden rounded-xl border border-white/10 bg-[#12101a]/98 shadow-[0_24px_80px_rgba(0,0,0,0.55)]" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
          <Search size={18} className="text-textMuted" />
          <input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Comando, ferramenta, mapa..." className="h-9 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-textMuted" />
          <button type="button" className="rounded-lg p-2 text-textMuted hover:bg-white/10 hover:text-white" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="max-h-[340px] overflow-y-auto p-2">
          {commands.map((command) => (
            <button
              key={command.label}
              type="button"
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-semibold text-textMuted hover:bg-white/10 hover:text-white"
              onClick={() => {
                command.run();
                onClose();
              }}
            >
              <span>{command.label}</span>
              <span className="rounded bg-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.12em]">{command.hint}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
