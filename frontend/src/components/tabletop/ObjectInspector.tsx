import { Button } from '../Ui';
import { useTabletopStore } from './mapStore';
import type { MapObject, TabletopToken } from './types';

export function ObjectInspector() {
  const map = useTabletopStore((state) => state.map);
  const selectedObjectId = useTabletopStore((state) => state.selectedObjectId);
  const selectedTokenId = useTabletopStore((state) => state.selectedTokenId);
  const updateObject = useTabletopStore((state) => state.updateObject);
  const removeObject = useTabletopStore((state) => state.removeObject);
  const updateToken = useTabletopStore((state) => state.updateToken);
  const removeToken = useTabletopStore((state) => state.removeToken);
  const object = findObject(map, selectedObjectId);
  const token = map.tokens.find((entry) => entry.id === selectedTokenId) || null;

  if (object) {
    return (
      <section className="rounded-lg border border-line bg-panel/90 p-3">
        <p className="text-xs font-black uppercase text-violet">Inspetor</p>
        <div className="mt-3 grid gap-3">
          <TextInput label="Nome" value={object.name} onChange={(name) => updateObject(object.id, { name })} />
          <div className="grid grid-cols-2 gap-2">
            <NumberInput label="X" value={object.x} step={0.25} onChange={(x) => updateObject(object.id, { x })} />
            <NumberInput label="Y" value={object.y} step={0.25} onChange={(y) => updateObject(object.id, { y })} />
            <NumberInput label="Largura" value={object.width} step={0.25} min={0.25} onChange={(width) => updateObject(object.id, { width })} />
            <NumberInput label="Altura" value={object.height} step={0.25} min={0.25} onChange={(height) => updateObject(object.id, { height })} />
            <NumberInput label="Rotacao" value={object.rotation} step={15} onChange={(rotation) => updateObject(object.id, { rotation })} />
          </div>
          <label className="flex items-center gap-2 text-sm text-textMuted">
            <input
              className="accent-vita"
              type="checkbox"
              checked={object.visibleToPlayers}
              onChange={(event) => updateObject(object.id, { visibleToPlayers: event.target.checked })}
            />
            Visivel para jogadores
          </label>
          <label className="flex items-center gap-2 text-sm text-textMuted">
            <input
              className="accent-vita"
              type="checkbox"
              checked={object.locked}
              onChange={(event) => updateObject(object.id, { locked: event.target.checked })}
            />
            Travar objeto
          </label>
          {object.kind === 'light' ? <LightFields object={object} onChange={(patch) => updateObject(object.id, patch)} /> : null}
          {object.kind === 'note' || object.kind === 'zone' ? (
            <label className="text-sm font-semibold text-textMuted">
              Nota
              <textarea
                className="mt-1 min-h-24 w-full rounded-lg border border-line bg-white/5 px-3 py-2 text-textMain"
                value={object.note || ''}
                onChange={(event) => updateObject(object.id, { note: event.target.value })}
              />
            </label>
          ) : null}
          <Button type="button" tone="danger" onClick={() => removeObject(object.id)}>Remover objeto</Button>
        </div>
      </section>
    );
  }

  if (token) {
    return (
      <section className="rounded-lg border border-line bg-panel/90 p-3">
        <p className="text-xs font-black uppercase text-violet">Token</p>
        <div className="mt-3 grid gap-3">
          <TextInput label="Nome" value={token.name} onChange={(name) => updateToken(token.id, { name })} />
          <div className="grid grid-cols-2 gap-2">
            <NumberInput label="X" value={token.x} onChange={(x) => updateToken(token.id, { x })} />
            <NumberInput label="Y" value={token.y} onChange={(y) => updateToken(token.id, { y })} />
            <NumberInput label="PV" value={token.hpCurrent || 0} onChange={(hpCurrent) => updateToken(token.id, { hpCurrent })} />
            <NumberInput label="PV max" value={token.hpMax || 0} onChange={(hpMax) => updateToken(token.id, { hpMax })} />
          </div>
          <label className="flex items-center gap-2 text-sm text-textMuted">
            <input
              className="accent-vita"
              type="checkbox"
              checked={token.visibleToPlayers}
              onChange={(event) => updateToken(token.id, { visibleToPlayers: event.target.checked })}
            />
            Visivel para jogadores
          </label>
          <label className="flex items-center gap-2 text-sm text-textMuted">
            <input
              className="accent-vita"
              type="checkbox"
              checked={token.locked}
              onChange={(event) => updateToken(token.id, { locked: event.target.checked })}
            />
            Travar token
          </label>
          <Button type="button" tone="danger" onClick={() => removeToken(token.id)}>Remover token</Button>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-line bg-panel/90 p-3">
      <p className="text-xs font-black uppercase text-violet">Inspetor</p>
      <p className="mt-2 text-sm text-textMuted">Nenhum item selecionado.</p>
    </section>
  );
}

function LightFields({ object, onChange }: { object: MapObject; onChange(patch: Partial<MapObject>): void }) {
  const light = object.light || { id: object.id, x: object.x, y: object.y, radius: 5, intensity: 0.55, color: object.color || '#8b5cf6' };
  return (
    <div className="grid grid-cols-2 gap-2">
      <NumberInput label="Raio" value={light.radius} min={1} onChange={(radius) => onChange({ light: { ...light, radius } })} />
      <NumberInput label="Intensidade" value={light.intensity} min={0} max={1} step={0.05} onChange={(intensity) => onChange({ light: { ...light, intensity } })} />
    </div>
  );
}

function TextInput({ label, value, onChange }: { label: string; value: string; onChange(value: string): void }) {
  return (
    <label className="text-sm font-semibold text-textMuted">
      {label}
      <input
        className="mt-1 w-full rounded-lg border border-line bg-white/5 px-3 py-2 text-textMain"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function NumberInput({
  label,
  value,
  min,
  max,
  step = 1,
  onChange
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange(value: number): void;
}) {
  return (
    <label className="text-sm font-semibold text-textMuted">
      {label}
      <input
        className="mt-1 w-full rounded-lg border border-line bg-white/5 px-3 py-2 text-textMain"
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function findObject(map: ReturnType<typeof useTabletopStore.getState>['map'], objectId: string): MapObject | null {
  if (!objectId) return null;
  return [map.objectLayer, map.decorationLayer, map.lightingLayer, map.notesLayer]
    .flatMap((layer) => layer.objects)
    .find((object) => object.id === objectId) || null;
}
