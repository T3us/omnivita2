import { useState } from 'react';

export function VttNewMapModal({
  open,
  onClose,
  onCreate
}: {
  open: boolean;
  onClose(): void;
  onCreate(config: { name: string; width: number; height: number; gridSize: number; theme?: string }): void;
}) {
  const [name, setName] = useState('Novo mapa');
  const [width, setWidth] = useState(28);
  const [height, setHeight] = useState(18);
  const [gridSize, setGridSize] = useState(32);
  const [theme, setTheme] = useState('');

  if (!open) return null;

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 grid place-items-center bg-black/50 px-4 backdrop-blur-sm">
      <form
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#12101a] p-4 text-textMain shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
        onSubmit={(event) => {
          event.preventDefault();
          onCreate({
            name: name.trim() || 'Novo mapa',
            width: Number(width) || 28,
            height: Number(height) || 18,
            gridSize: Number(gridSize) || 32,
            theme: theme.trim()
          });
          onClose();
        }}
      >
        <div className="mb-4">
          <h2 className="text-sm font-black uppercase tracking-[0.18em] text-violet">Novo mapa</h2>
        </div>
        <label className="mb-3 grid gap-1 text-xs font-bold text-textMuted">
          Nome
          <input className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-vita/50" value={name} onChange={(event) => setName(event.target.value)} autoFocus />
        </label>
        <div className="mb-3 grid grid-cols-3 gap-2">
          <NumberField label="Largura" value={width} onChange={setWidth} />
          <NumberField label="Altura" value={height} onChange={setHeight} />
          <NumberField label="Grid" value={gridSize} onChange={setGridSize} />
        </div>
        <label className="mb-4 grid gap-1 text-xs font-bold text-textMuted">
          Tema
          <input className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-vita/50" value={theme} onChange={(event) => setTheme(event.target.value)} placeholder="Opcional" />
        </label>
        <div className="flex justify-end gap-2">
          <button type="button" className="rounded-lg px-3 py-2 text-sm font-bold text-textMuted hover:bg-white/10 hover:text-white" onClick={onClose}>Cancelar</button>
          <button type="submit" className="rounded-lg bg-vita px-3 py-2 text-sm font-black text-white hover:bg-vita/80">Criar vazio</button>
        </div>
      </form>
    </div>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange(value: number): void }) {
  return (
    <label className="grid gap-1 text-xs font-bold text-textMuted">
      {label}
      <input
        className="h-10 rounded-lg border border-white/10 bg-white/5 px-2 text-sm text-white outline-none focus:border-vita/50"
        type="number"
        min={label === 'Grid' ? 24 : 1}
        max={label === 'Grid' ? 96 : 240}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}
