import clsx from 'clsx';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { Button, Badge } from '../Ui';
import { useTabletopStore } from './mapStore';
import type { MapTool, TabletopMode } from './types';
import type { SnapMode } from './types';

const buildTools: Array<{ id: MapTool; label: string }> = [
  { id: 'select', label: 'Selecionar' },
  { id: 'brush', label: 'Piso' },
  { id: 'wall', label: 'Parede' },
  { id: 'collision', label: 'Colisao' },
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

const snapModes: Array<{ id: SnapMode; label: string }> = [
  { id: 'grid', label: 'Grid' },
  { id: 'fine', label: '4px' },
  { id: 'free', label: 'Livre' },
  { id: 'object', label: 'Objeto' }
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
  const snapMode = useTabletopStore((state) => state.snapMode);
  const brushSize = useTabletopStore((state) => state.brushSize);
  const showGrid = useTabletopStore((state) => state.showGrid);
  const canUndo = useTabletopStore((state) => state.historyPast.length > 0);
  const canRedo = useTabletopStore((state) => state.historyFuture.length > 0);
  const dirty = useTabletopStore((state) => state.dirty);
  const setMode = useTabletopStore((state) => state.setMode);
  const setTool = useTabletopStore((state) => state.setTool);
  const setZoom = useTabletopStore((state) => state.setZoom);
  const setSnapMode = useTabletopStore((state) => state.setSnapMode);
  const setBrushSize = useTabletopStore((state) => state.setBrushSize);
  const toggleGrid = useTabletopStore((state) => state.toggleGrid);
  const toggleActiveLayerLock = useTabletopStore((state) => state.toggleActiveLayerLock);
  const undo = useTabletopStore((state) => state.undo);
  const redo = useTabletopStore((state) => state.redo);
  const duplicateSelectedObjects = useTabletopStore((state) => state.duplicateSelectedObjects);
  const removeSelectedObjects = useTabletopStore((state) => state.removeSelectedObjects);
  const tools = map.mode === 'build' ? buildTools : sessionTools;

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isEditableTarget(event.target)) return;
      const key = event.key.toLowerCase();
      if (event.ctrlKey && key === 'z') {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
        return;
      }
      if (event.ctrlKey && key === 'y') {
        event.preventDefault();
        redo();
        return;
      }
      if (event.ctrlKey && key === 'd') {
        event.preventDefault();
        duplicateSelectedObjects();
        return;
      }
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        removeSelectedObjects();
        return;
      }
      const toolByKey: Partial<Record<string, MapTool>> = {
        v: 'select',
        b: 'brush',
        w: 'wall',
        e: 'erase',
        f: 'fog',
        c: 'collision',
        o: 'object'
      };
      if (toolByKey[key]) {
        event.preventDefault();
        setTool(toolByKey[key]);
        return;
      }
      if (event.key === '[') {
        event.preventDefault();
        setBrushSize(nextBrushSize(brushSize, -1));
      }
      if (event.key === ']') {
        event.preventDefault();
        setBrushSize(nextBrushSize(brushSize, 1));
      }
      if (key === 'g') {
        event.preventDefault();
        toggleGrid();
      }
      if (key === 'l') {
        event.preventDefault();
        toggleActiveLayerLock();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [brushSize, duplicateSelectedObjects, redo, removeSelectedObjects, setBrushSize, setTool, toggleActiveLayerLock, toggleGrid, undo]);

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
          <Button type="button" onClick={undo} disabled={!canUndo}>Desfazer</Button>
          <Button type="button" onClick={redo} disabled={!canRedo}>Refazer</Button>
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
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 5].map((size) => (
              <button
                key={size}
                type="button"
                className={clsx(
                  'min-h-8 rounded-lg border px-2 text-xs font-bold',
                  brushSize === size ? 'border-vita/60 bg-vita/20 text-textMain' : 'border-line bg-white/5 text-textMuted'
                )}
                onClick={() => setBrushSize(size)}
              >
                {size}x{size}
              </button>
            ))}
          </div>
          <button
            type="button"
            className={clsx(
              'min-h-8 rounded-lg border px-2 text-xs font-bold',
              showGrid ? 'border-vita/60 bg-vita/20 text-textMain' : 'border-line bg-white/5 text-textMuted'
            )}
            onClick={toggleGrid}
          >
            Grid
          </button>
          <div className="flex items-center gap-1">
            {snapModes.map((entry) => (
              <button
                key={entry.id}
                type="button"
                className={clsx(
                  'min-h-8 rounded-lg border px-2 text-xs font-bold',
                  snapMode === entry.id ? 'border-vita/60 bg-vita/20 text-textMain' : 'border-line bg-white/5 text-textMuted'
                )}
                onClick={() => setSnapMode(entry.id)}
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
      </div>
    </section>
  );
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable;
}

function nextBrushSize(current: number, direction: -1 | 1) {
  const sizes = [1, 2, 3, 5];
  const index = sizes.indexOf(current);
  return sizes[Math.max(0, Math.min(sizes.length - 1, index + direction))] || current;
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
