import { Button } from '../Ui';
import { getAllAssets, getAsset } from './assets';
import { useTabletopStore } from './mapStore';
import type { DoorState, MapLayerKey, MapObject, TabletopToken, TileCell, TileLayerKey } from './types';

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
  const selectedTileCells = useTabletopStore((state) => state.selectedTileCells);
  const selectedTokenId = useTabletopStore((state) => state.selectedTokenId);
  const selectedTokenIds = useTabletopStore((state) => state.selectedTokenIds);
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
  const updateSelectedTiles = useTabletopStore((state) => state.updateSelectedTiles);
  const removeSelectedObjects = useTabletopStore((state) => state.removeSelectedObjects);
  const rotateSelectedObjects = useTabletopStore((state) => state.rotateSelectedObjects);
  const alignSelectedObjects = useTabletopStore((state) => state.alignSelectedObjects);
  const distributeSelectedObjects = useTabletopStore((state) => state.distributeSelectedObjects);
  const updateObject = useTabletopStore((state) => state.updateObject);
  const removeObject = useTabletopStore((state) => state.removeObject);
  const duplicateSelectedObjects = useTabletopStore((state) => state.duplicateSelectedObjects);
  const updateToken = useTabletopStore((state) => state.updateToken);
  const updateSelectedTokens = useTabletopStore((state) => state.updateSelectedTokens);
  const removeToken = useTabletopStore((state) => state.removeToken);
  const removeSelectedTokens = useTabletopStore((state) => state.removeSelectedTokens);
  const object = findObject(map, selectedObjectId);
  const token = map.tokens.find((entry) => entry.id === selectedTokenId) || null;
  const selectedTile = selectedTileCells.length === 1 && !object
    ? findTile(map, selectedTileCells[0].layer, selectedTileCells[0].x, selectedTileCells[0].y)
    : null;

  if (selectedTile && selectedTileCells.length === 1) {
    const selected = selectedTileCells[0];
    const asset = getAsset(selectedTile.assetId, map.tilesets);
    return (
      <section className="rounded-lg border border-line bg-panel/90 p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-black uppercase text-violet">Celula</p>
          <span className="rounded-lg border border-line bg-white/5 px-2 py-1 text-xs text-textMuted">{selected.layer} {selected.x},{selected.y}</span>
        </div>
        <div className="mt-3 grid gap-3">
          <div className="rounded-lg border border-line bg-white/5 p-2">
            <strong className="block text-sm text-textMain">{asset?.name || selectedTile.assetId}</strong>
            <span className="text-xs text-textMuted">{asset?.category || selected.layer}</span>
          </div>
          <NumberInput label="Rotacao" value={selectedTile.rotation || 0} step={45} onChange={(rotation) => updateSelectedTiles({ rotation })} />
          {selected.layer === 'doors' ? (
            <>
              <label className="text-sm font-semibold text-textMuted">
                Estado da porta
                <select
                  className="mt-1 w-full rounded-lg border border-line bg-white/5 px-3 py-2 text-textMain"
                  value={selectedTile.doorState || 'closed'}
                  onChange={(event) => updateSelectedTiles({ doorState: event.target.value as DoorState })}
                >
                  <option value="open">Aberta</option>
                  <option value="closed">Fechada</option>
                  <option value="locked">Trancada</option>
                </select>
              </label>
              <div className="grid gap-2">
                <Toggle label="Bloqueia movimento" checked={Boolean(selectedTile.blocksMovement)} onChange={(blocksMovement) => updateSelectedTiles({ blocksMovement })} />
                <Toggle label="Bloqueia visao" checked={Boolean(selectedTile.blocksVision)} onChange={(blocksVision) => updateSelectedTiles({ blocksVision })} />
                <Toggle label="Bloqueia som" checked={Boolean(selectedTile.blocksSound)} onChange={(blocksSound) => updateSelectedTiles({ blocksSound })} />
                <Toggle label="Interagivel" checked={Boolean(selectedTile.interactable)} onChange={(interactable) => updateSelectedTiles({ interactable })} />
                <Toggle label="Secreta" checked={Boolean(selectedTile.secret)} onChange={(secret) => updateSelectedTiles({ secret })} />
              </div>
            </>
          ) : null}
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" onClick={() => rotateSelectedObjects(45)}>Girar +45</Button>
            <Button type="button" onClick={() => rotateSelectedObjects(-45)}>Girar -45</Button>
            <Button type="button" tone="danger" onClick={removeSelectedObjects}>Apagar</Button>
          </div>
          <label className="text-sm font-semibold text-textMuted">
            Nota do mestre
            <textarea
              className="mt-1 min-h-20 w-full rounded-lg border border-line bg-white/5 px-3 py-2 text-textMain"
              value={selectedTile.note || ''}
              onChange={(event) => updateSelectedTiles({ note: event.target.value })}
            />
          </label>
        </div>
      </section>
    );
  }

  if (selectedTokenIds.length > 1 && !object && !selectedTileCells.length) {
    return (
      <section className="rounded-lg border border-line bg-panel/90 p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-black uppercase text-violet">Tokens</p>
          <span className="rounded-lg border border-line bg-white/5 px-2 py-1 text-xs text-textMuted">{selectedTokenIds.length} selecionados</span>
        </div>
        <div className="mt-3 grid gap-3">
          <div className="grid gap-2">
            <Toggle label="Visivel para jogadores" checked onChange={(visibleToPlayers) => updateSelectedTokens({ visibleToPlayers, hidden: !visibleToPlayers })} />
            <Toggle label="Travar tokens" checked={false} onChange={(locked) => updateSelectedTokens({ locked })} />
            <Toggle label="Visao ativa" checked onChange={(visionEnabled) => updateSelectedTokens({ visionEnabled })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <NumberInput label="Raio de visao" value={6} min={0} onChange={(visionRadius) => updateSelectedTokens({ visionRadius })} />
            <NumberInput label="Luz propria" value={0} min={0} onChange={(lightRadius) => updateSelectedTokens({ lightRadius })} />
          </div>
          <TextInput label="Status visual" value="" onChange={(status) => updateSelectedTokens({ status })} />
          <Button type="button" tone="danger" onClick={removeSelectedTokens}>Remover tokens</Button>
        </div>
      </section>
    );
  }

  if (selectedObjectIds.length + selectedTileCells.length > 1 || (selectedTileCells.length && !object)) {
    const totalSelected = selectedObjectIds.length + selectedTileCells.length;
    return (
      <section className="rounded-lg border border-line bg-panel/90 p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-black uppercase text-violet">Inspetor</p>
          <span className="rounded-lg border border-line bg-white/5 px-2 py-1 text-xs text-textMuted">{totalSelected} selecionados</span>
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
            <NumberInput label="Rotacao +" value={45} step={45} onChange={(rotation) => rotateSelectedObjects(rotation)} />
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
            <Button type="button" onClick={() => rotateSelectedObjects(45)}>Girar +45</Button>
            <Button type="button" onClick={() => rotateSelectedObjects(-45)}>Girar -45</Button>
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
                <span className="text-xs text-textMuted">{asset.category} - {asset.theme || 'generico'}</span>
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
            <NumberInput label="Rotacao" value={object.rotation} step={45} onChange={(rotation) => updateObject(object.id, { rotation })} />
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
            <Toggle label="Bloqueia som" checked={Boolean(object.blocksSound)} onChange={(blocksSound) => updateObject(object.id, { blocksSound })} />
            <Toggle label="Da cobertura" checked={object.givesCover} onChange={(givesCover) => updateObject(object.id, { givesCover })} />
            <Toggle label="Interagivel" checked={object.interactable} onChange={(interactable) => updateObject(object.id, { interactable })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-sm font-semibold text-textMuted">
              Cobertura
              <select
                className="mt-1 w-full rounded-lg border border-line bg-white/5 px-3 py-2 text-textMain"
                value={object.coverLevel || ''}
                onChange={(event) => updateObject(object.id, { coverLevel: event.target.value ? event.target.value as MapObject['coverLevel'] : undefined })}
              >
                <option value="">Nenhuma</option>
                <option value="low">Baixa</option>
                <option value="high">Alta</option>
              </select>
            </label>
            <TextInput label="DT / trava" value={object.difficulty || ''} onChange={(difficulty) => updateObject(object.id, { difficulty })} />
          </div>
          {object.kind === 'zone' ? (
            <label className="text-sm font-semibold text-textMuted">
              Efeito da zona
              <textarea
                className="mt-1 min-h-20 w-full rounded-lg border border-line bg-white/5 px-3 py-2 text-textMain"
                value={object.zoneEffect || ''}
                onChange={(event) => updateObject(object.id, { zoneEffect: event.target.value })}
              />
            </label>
          ) : null}
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
            <NumberInput label="PE" value={token.peCurrent || 0} onChange={(peCurrent) => updateToken(token.id, { peCurrent })} />
            <NumberInput label="PD" value={token.pdCurrent || 0} onChange={(pdCurrent) => updateToken(token.id, { pdCurrent })} />
            <NumberInput label="Tamanho" value={token.size || 1} min={0.5} step={0.5} onChange={(size) => updateToken(token.id, { size })} />
            <NumberInput label="Instabilidade" value={token.instability || 0} min={0} onChange={(instability) => updateToken(token.id, { instability })} />
            <NumberInput label="Raio de visao" value={token.visionRadius || 0} min={0} onChange={(visionRadius) => updateToken(token.id, { visionRadius })} />
            <NumberInput label="Visao clara" value={token.brightVisionRadius || 0} min={0} onChange={(brightVisionRadius) => updateToken(token.id, { brightVisionRadius })} />
            <NumberInput label="Visao fraca" value={token.dimVisionRadius || 0} min={0} onChange={(dimVisionRadius) => updateToken(token.id, { dimVisionRadius })} />
            <NumberInput label="Luz propria" value={token.lightRadius || 0} min={0} onChange={(lightRadius) => updateToken(token.id, { lightRadius })} />
          </div>
          <TextInput label="Estado" value={token.status || ''} onChange={(status) => updateToken(token.id, { status })} />
          <TextInput label="Marcadores" value={(token.statusMarkers || []).join(', ')} onChange={(value) => updateToken(token.id, { statusMarkers: value.split(',').map((entry) => entry.trim()).filter(Boolean) })} />
          <TextInput label="Aura" value={token.auraColor || ''} onChange={(auraColor) => updateToken(token.id, { auraColor })} />
          <label className="flex items-center gap-2 text-sm text-textMuted">
            <input
              className="accent-vita"
              type="checkbox"
              checked={token.visionEnabled !== false}
              onChange={(event) => updateToken(token.id, { visionEnabled: event.target.checked })}
            />
            Visao dinamica ativa
          </label>
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
          <label className="flex items-center gap-2 text-sm text-textMuted">
            <input
              className="accent-vita"
              type="checkbox"
              checked={Boolean(token.hidden)}
              onChange={(event) => updateToken(token.id, { hidden: event.target.checked })}
            />
            Oculto no mapa
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

function findTile(map: ReturnType<typeof useTabletopStore.getState>['map'], layer: TileLayerKey, x: number, y: number): TileCell | null {
  return map.tileLayers[layer].cells.find((cell) => {
    const footprint = resolveFootprint(cell.footprint, cell.rotation || 0);
    return x >= cell.x && x < cell.x + footprint.w && y >= cell.y && y < cell.y + footprint.h;
  }) || null;
}

function resolveFootprint(footprint: TileCell['footprint'], rotation = 0) {
  const base = footprint || { w: 1, h: 1 };
  const normalized = ((Math.round(rotation / 45) * 45) % 360 + 360) % 360;
  return normalized === 90 || normalized === 270 ? { w: base.h, h: base.w } : base;
}

function findObject(map: ReturnType<typeof useTabletopStore.getState>['map'], objectId: string): MapObject | null {
  if (!objectId) return null;
  return [map.objectLayer, map.decorationLayer, map.detailLayer, map.lightingLayer, map.mechanicalLayer, map.notesLayer]
    .flatMap((layer) => layer.objects)
    .find((object) => object.id === objectId) || null;
}
