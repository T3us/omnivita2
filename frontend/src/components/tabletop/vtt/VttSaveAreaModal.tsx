import { useEffect, useState } from 'react';
import type { MapBounds } from '../types';

export type SaveAreaMeta = {
  name: string;
  description: string;
  theme: string;
  tags: string[];
  gridSize: number;
};

export function VttSaveAreaModal({
  bounds,
  defaultName,
  defaultGridSize,
  saving,
  onClose,
  onSave
}: {
  bounds: MapBounds | null;
  defaultName: string;
  defaultGridSize: number;
  saving: boolean;
  onClose(): void;
  onSave(meta: SaveAreaMeta): void;
}) {
  const [name, setName] = useState(defaultName || 'Novo mapa');
  const [description, setDescription] = useState('');
  const [theme, setTheme] = useState('');
  const [tags, setTags] = useState('');
  const [gridSize, setGridSize] = useState(defaultGridSize);

  useEffect(() => {
    if (!bounds) return;
    setName(defaultName || 'Novo mapa');
    setGridSize(defaultGridSize);
  }, [bounds, defaultGridSize, defaultName]);

  if (!bounds) return null;

  const canSave = Boolean(name.trim()) && bounds.width > 0 && bounds.height > 0;

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 grid place-items-center bg-black/50 px-4 backdrop-blur-sm">
      <form
        className="w-full max-w-md rounded-2xl border border-white/10 bg-[#12101a] p-4 text-textMain shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
        onSubmit={(event) => {
          event.preventDefault();
          if (!canSave || saving) return;
          onSave({
            name: name.trim(),
            description: description.trim(),
            theme: theme.trim(),
            tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean),
            gridSize
          });
        }}
      >
        <div className="mb-4">
          <h2 className="text-sm font-black uppercase tracking-[0.18em] text-violet">Salvar area como mapa</h2>
          <p className="mt-1 text-xs text-textMuted">{bounds.width}x{bounds.height} celulas em X {bounds.x}, Y {bounds.y}</p>
        </div>
        <label className="mb-3 grid gap-1 text-xs font-bold text-textMuted">
          Nome do mapa
          <input className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-vita/50" value={name} onChange={(event) => setName(event.target.value)} autoFocus />
        </label>
        <label className="mb-3 grid gap-1 text-xs font-bold text-textMuted">
          Descricao
          <input className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-vita/50" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Opcional" />
        </label>
        <div className="mb-4 grid grid-cols-[1fr_1fr_88px] gap-2">
          <label className="grid gap-1 text-xs font-bold text-textMuted">
            Tema
            <input className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-vita/50" value={theme} onChange={(event) => setTheme(event.target.value)} placeholder="Opcional" />
          </label>
          <label className="grid gap-1 text-xs font-bold text-textMuted">
            Tags
            <input className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-vita/50" value={tags} onChange={(event) => setTags(event.target.value)} placeholder="lab, rua" />
          </label>
          <label className="grid gap-1 text-xs font-bold text-textMuted">
            Grid
            <input className="h-10 rounded-lg border border-white/10 bg-white/5 px-2 text-sm text-white outline-none focus:border-vita/50" type="number" min={24} max={96} value={gridSize} onChange={(event) => setGridSize(Number(event.target.value) || defaultGridSize)} />
          </label>
        </div>
        <div className="mb-4 grid h-24 place-items-center rounded-xl border border-white/10 bg-black/20 text-xs font-bold text-textMuted">
          Preview {bounds.width}x{bounds.height}
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" className="rounded-lg px-3 py-2 text-sm font-bold text-textMuted hover:bg-white/10 hover:text-white" onClick={onClose} disabled={saving}>Cancelar</button>
          <button type="submit" className="rounded-lg bg-vita px-3 py-2 text-sm font-black text-white hover:bg-vita/80 disabled:cursor-not-allowed disabled:opacity-50" disabled={!canSave || saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </form>
    </div>
  );
}
