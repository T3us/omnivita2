import { Button } from '../Ui';
import { getAllAssets, getAsset } from './assets';
import { useTabletopStore } from './mapStore';
import type { MapLayerKey, MapObject, TabletopToken } from './types';

const objectLayers: Array<{ id: MapLayerKey; label: string }> = [
  { id: 'decoration', label: 'Decoracao' },
  { id: 'objects', label: 'Objetos' },
  { id: 'details', label: 'Detalhes' },
  { id: 'lighting', label: 'Luzes' },
  { id: 'mechanics', label: 'Mecanica' },
  { id: 'notes', label: 'Notas' }
];

export function ObjectInspector() {
  const map = useTabletopStore((state) => state.map);
  const selectedObjectId = useTabletopStore((state) => state.selectedObjectId);
  const selectedObjectIds = useTabletopStore((state) => state.selectedObjectIds);
  const selectedTokenId = useTabletopStore((state) => state.selectedTokenId);
  const bringForward = useTabletopStore((state) => state.bringForward);
  const sendBackward = useTabletopStore((state) => state.sendBackward);
  const moveLayer = useTabletopStore((state) => state.moveLayer);
  const centerSelectedOnGrid = useTabletopStore((state) => state.centerSelectedOnGrid);
  const resetSelectedRotation = useTabletopStore((state) => state.resetSelectedRotation);
  const resetSelectedScale = useTabletopStore((state) => state.resetSelectedScale);
  const placeOnSelectedParent = useTabletopStore((state) => state.placeOnSelectedParent);
  const groupSelectedObjects = useTabletopStore((state) => state.groupSelectedObjects);
  const ungroupSelectedObjects = useTabletopStore((state) => state.ungroupSelectedObjects);
  const saveSelectionAsPrefab = useTabletopStore((state) => state.saveSelectionAsPrefab);
  const updateSelectedObjects = useTabletopStore((state) => state.updateSelectedObjects);
  const removeSelectedObjects = useTabletopStore((state) => state.removeSelectedObjects);
  const rotateSelectedObjects = useTabletopStore((state) => state.rotateSelectedObjects);
  const alignSelectedObjects = useTabletopStore((state) => state.alignSelectedObjects);
  const distributeSelectedObjects = useTabletopStore((state) => state.distributeSelectedObjects);
  const updateObject = useTabletopStore((state) => state.updateObject);
  const removeObject = useTabletopStore((state) => state.removeObject);
  const duplicateSelectedObjects = useTabletopStore((state) => state.duplicateSelectedObjects);
  const updateToken = useTabletopStore((state) => state.updateToken);
  const removeToken = useTabletopStore((state) => state.removeToken);
  const object = findObject(map, selectedObjectId);
  const token = map.tokens.find((entry) => entry.id === selectedTokenId) || null;

  if (selectedObjectIds.length > 1) {
    return (
      <section className="rounded-lg border border-line bg-panel/90 p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-black uppercase text-violet">Inspetor</p>
          <span className="rounded-lg border border-line bg-white/5 px-2 py-1 text-xs text-textMuted">{selectedObjectIds.length} selecionados</span>
        </div>
        <div className="mt-3 grid gap-3">
          <label className="text-sm font-semibold text-textMuted">
            Camada em massa
            <select
              className="mt-1 w-full rounded-lg border border-line bg-white/5 px-3 py-2 text-textMain"
              onChange={(event) => updateSelectedObjects({ layer: event.target.value as MapLayerKey })}
              defaultValue=""
            >
              <option value="" disabled>Escolher camada</option>
              {objectLayers.map((layer) => <option key={layer.id} value={layer.id}>{layer.label}</option>)}
            </select>
          </label>
          <div className="grid gap-2">
            <Toggle label="Visivel para jogadores" checked onChange={(checked) => updateSelectedObjects({ hiddenFromPlayers: !checked, visibleToPlayers: checked })} />
            <Toggle label="Travar selecao" checked={false} onChange={(locked) => updateSelectedObjects({ locked })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <NumberInput label="Opacidade" value={1} step={0.05} min={0} max={1} onChange={(opacity) => updateSelectedObjects({ opacity })} />
            <NumberInput label="Rotacao +" value={15} step={5} onChange={(rotation) => rotateSelectedObjects(rotation)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" onClick={duplicateSelectedObjects}>Duplicar</Button>
            <Button type="button" tone="danger" onClick={removeSelectedObjects}>Deletar</Button>
            <Button type="button" onClick={groupSelectedObjects}>Agrupar</Button>
            <Button type="button" onClick={ungroupSelectedObjects}>Desagrupar</Button>
            <Button type="button" onClick={bringForward}>Frente</Button>
            <Button type="button" onClick={sendBackward}>Tras</Button>
            <Button type="button" onClick={() => alignSelectedObjects('top')}>Alinhar topo</Button>
            <Button type="button" onClick={() => alignSelectedObjects('center')}>Alinhar centro</Button>
            <Button type="button" onClick={() => distributeSelectedObjects('horizontal')}>Distribuir H</Button>
            <Button type="button" onClick={() => distributeSelectedObjects('vertical')}>Distribuir V</Button>
            <Button type="button" onClick={() => rotateSelectedObjects(15)}>Girar +15</Button>
            <Button type="button" onClick={() => rotateSelectedObjects(-15)}>Girar -15</Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" onClick={placeOnSelectedParent}>Em cima do primeiro</Button>
            <Button
              type="button"
              onClick={() => {
                const name = window.prompt('Nome do prefab', 'Composicao');
                if (name) saveSelectionAsPrefab(name);
              }}
            >
              Salvar prefab
            </Button>
          </div>
        </div>
      </section>
    );
  }

  if (object) {
    const assets = getAllAssets(map.tilesets);
    const asset = getAsset(object.assetId, map.tilesets);
    return (
      <section className="rounded-lg border border-line bg-panel/90 p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-black uppercase text-violet">Inspetor</p>
          {selectedObjectIds.length > 1 ? <span className="rounded-lg border border-line bg-white/5 px-2 py-1 text-xs text-textMuted">{selectedObjectIds.length} selecionados</span> : null}
        </div>
        <div className="mt-3 grid gap-3">
          {asset ? (
            <div className="flex items-center gap-3 rounded-lg border border-line bg-white/5 p-2">
              <span
                className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded border border-line bg-black/30"
                style={{
                  backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.05) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.05) 25%, transparent 25%)',
                  backgroundSize: '12px 12px'
                }}
              >
                <img src={asset.thumbnailUrl || asset.imageUrl} alt={asset.name} className="h-full w-full object-contain p-1 [image-rendering:pixelated]" />
              </span>
              <div className="min-w-0">
                <strong className="block truncate text-sm text-textMain">{asset.name}</strong>
                <span className="text-xs text-textMuted">{asset.category} • {asset.theme || 'generico'}</span>
              </div>
            </div>
          ) : null}
          <TextInput label="Nome" value={object.name} onChange={(name) => updateObject(object.id, { name })} />
          <label className="text-sm font-semibold text-textMuted">
            Asset
            <select
              className="mt-1 w-full rounded-lg border border-line bg-white/5 px-3 py-2 text-textMain"
              value={object.assetId}
              onChange={(event) => updateObject(object.id, { assetId: event.target.value })}
            >
              {assets.map((asset) => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold text-textMuted">
            Camada
            <select
              className="mt-1 w-full rounded-lg border border-line bg-white/5 px-3 py-2 text-textMain"
              value={object.layer}
              onChange={(event) => updateObject(object.id, { layer: event.target.value as MapLayerKey })}
            >
              {objectLayers.map((layer) => <option key={layer.id} value={layer.id}>{layer.label}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <NumberInput label="X" value={object.x} step={0.25} onChange={(x) => updateObject(object.id, { x })} />
            <NumberInput label="Y" value={object.y} step={0.25} onChange={(y) => updateObject(object.id, { y })} />
            <NumberInput label="Largura" value={object.width} step={4} min={4} onChange={(width) => updateObject(object.id, { width })} />
            <NumberInput label="Altura" value={object.height} step={4} min={4} onChange={(height) => updateObject(object.id, { height })} />
            <NumberInput label="Rotacao" value={object.rotation} step={15} onChange={(rotation) => updateObject(object.id, { rotation })} />
            <NumberInput label="zIndex" value={object.zIndex} step={1} min={0} onChange={(zIndex) => updateObject(object.id, { zIndex })} />
            <NumberInput label="Opacidade" value={object.opacity} step={0.05} min={0} max={1} onChange={(opacity) => updateObject(object.id, { opacity })} />
          </div>
          <label className="text-sm font-semibold text-textMuted">
            Snap do objeto
            <select
              className="mt-1 w-full rounded-lg border border-line bg-white/5 px-3 py-2 text-textMain"
              value={object.snapMode || 'free'}
              onChange={(event) => updateObject(object.id, { snapMode: event.target.value as MapObject['snapMode'] })}
            >
              <option value="free">Livre</option>
              <option value="fine">Fino 4px</option>
              <option value="grid">Grid</option>
            </select>
          </label>
          <div className="grid gap-2">
            <Toggle label="Visivel para jogadores" checked={!object.hiddenFromPlayers} onChange={(checked) => updateObject(object.id, { hiddenFromPlayers: !checked, visibleToPlayers: checked })} />
            <Toggle label="Travar objeto" checked={object.locked} onChange={(locked) => updateObject(object.id, { locked })} />
            <Toggle label="Bloqueia movimento" checked={object.blocksMovement} onChange={(blocksMovement) => updateObject(object.id, { blocksMovement })} />
            <Toggle label="Bloqueia visao" checked={object.blocksVision} onChange={(blocksVision) => updateObject(object.id, { blocksVision })} />
            <Toggle label="Da cobertura" checked={object.givesCover} onChange={(givesCover) => updateObject(object.id, { givesCover })} />
            <Toggle label="Interagivel" checked={object.interactable} onChange={(interactable) => updateObject(object.id, { interactable })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" onClick={bringForward}>Frente</Button>
            <Button type="button" onClick={sendBackward}>Tras</Button>
            <Button type="button" onClick={() => moveLayer(1)}>Subir camada</Button>
            <Button type="button" onClick={() => moveLayer(-1)}>Descer camada</Button>
            <Button type="button" onClick={duplicateSelectedObjects}>Duplicar</Button>
            <Button type="button" tone="danger" onClick={() => removeObject(object.id)}>Deletar</Button>
            <Button type="button" onClick={centerSelectedOnGrid}>Centralizar grid</Button>
            <Button type="button" onClick={resetSelectedRotation}>Reset rotacao</Button>
            <Button type="button" onClick={resetSelectedScale}>Reset escala</Button>
          </div>
          {selectedObjectIds.length > 1 ? (
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" onClick={placeOnSelectedParent}>Em cima do primeiro</Button>
              <Button type="button" onClick={groupSelectedObjects}>Agrupar</Button>
              <Button type="button" onClick={ungroupSelectedObjects}>Desagrupar</Button>
              <Button
                type="button"
                onClick={() => {
                  const name = window.prompt('Nome do prefab', 'Composicao');
                  if (name) saveSelectionAsPrefab(name);
                }}
              >
                Salvar prefab
              </Button>
            </div>
          ) : null}
          {object.kind === 'light' ? <LightFields object={object} onChange={(patch) => updateObject(object.id, patch)} /> : null}
          <label className="text-sm font-semibold text-textMuted">
            Nota do mestre
            <textarea
              className="mt-1 min-h-24 w-full rounded-lg border border-line bg-white/5 px-3 py-2 text-textMain"
              value={object.note || ''}
              onChange={(event) => updateObject(object.id, { note: event.target.value })}
            />
          </label>
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

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange(value: boolean): void }) {
  return (
    <label className="flex items-center gap-2 text-sm text-textMuted">
      <input
        className="accent-vita"
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  );
}

function LightFields({ object, onChange }: { object: MapObject; onChange(patch: Partial<MapObject>): void }) {
  const light = object.light || { id: object.id, x: object.x, y: object.y, radius: 5, intensity: 0.55, color: object.color || '#8b5cf6' };
  return (
    <div className="grid grid-cols-2 gap-2">
      <NumberInput label="Raio" value={light.radius} min={16} step={8} onChange={(radius) => onChange({ light: { ...light, radius } })} />
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
  return [map.objectLayer, map.decorationLayer, map.detailLayer, map.lightingLayer, map.mechanicalLayer, map.notesLayer]
    .flatMap((layer) => layer.objects)
    .find((object) => object.id === objectId) || null;
}
