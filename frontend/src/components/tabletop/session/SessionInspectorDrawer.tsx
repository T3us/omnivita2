import clsx from 'clsx';
import { useState } from 'react';
import { Badge, Button } from '../../Ui';
import { useTabletopStore } from '../mapStore';
import { ObjectInspector } from '../ObjectInspector';

export function SessionInspectorDrawer({
  collapsed,
  onToggleCollapsed,
  onSave
}: {
  collapsed: boolean;
  onToggleCollapsed(): void;
  onSave(): void;
}) {
  const map = useTabletopStore((state) => state.map);
  const selectedTokenIds = useTabletopStore((state) => state.selectedTokenIds);
  const selectedObjectIds = useTabletopStore((state) => state.selectedObjectIds);
  const selectedTileCells = useTabletopStore((state) => state.selectedTileCells);
  const selectedMapInstanceIds = useTabletopStore((state) => state.selectedMapInstanceIds);
  const selectedRegionIds = useTabletopStore((state) => state.selectedRegionIds);
  const clearSessionSelection = useTabletopStore((state) => state.clearSessionSelection);
  const updateSelectedTokens = useTabletopStore((state) => state.updateSelectedTokens);
  const removeSelectedTokens = useTabletopStore((state) => state.removeSelectedTokens);
  const updateSessionMapInstance = useTabletopStore((state) => state.updateSessionMapInstance);
  const duplicateSessionMapInstance = useTabletopStore((state) => state.duplicateSessionMapInstance);
  const removeSessionMapInstance = useTabletopStore((state) => state.removeSessionMapInstance);
  const selectMapInstance = useTabletopStore((state) => state.selectMapInstance);
  const updateSessionLighting = useTabletopStore((state) => state.updateSessionLighting);
  const setSessionRegionPreset = useTabletopStore((state) => state.setSessionRegionPreset);
  const setTool = useTabletopStore((state) => state.setTool);
  const revealAllFog = useTabletopStore((state) => state.revealAllFog);
  const hideAllFog = useTabletopStore((state) => state.hideAllFog);
  const [tab, setTab] = useState<'inspector' | 'layers' | 'scene' | 'selection'>('inspector');

  const totalSelection = selectedTokenIds.length + selectedObjectIds.length + selectedTileCells.length + selectedMapInstanceIds.length + selectedRegionIds.length;
  const selectedMap = selectedMapInstanceIds[0] ? (map.sessionMapInstances || []).find((entry) => entry.id === selectedMapInstanceIds[0]) : null;
  const lighting = map.sessionLighting || {
    globalIllumination: true,
    darkness: 0,
    ambientColor: '#d8e6ff',
    ambientIntensity: 1,
    playerVisible: false,
    regions: []
  };

  return (
    <aside className={clsx(
      'pointer-events-auto absolute right-3 top-16 z-20 max-h-[calc(100%-9rem)] rounded-lg border border-line bg-panel/95 shadow-soft backdrop-blur-xl transition',
      collapsed ? 'w-12 p-2' : 'w-[min(360px,calc(100vw-5rem))] p-3'
    )}>
      <button
        type="button"
        className="mb-2 h-9 w-full rounded-lg border border-line bg-white/5 text-sm font-black text-textMain"
        onClick={onToggleCollapsed}
      >
        {collapsed ? 'I' : 'Recolher inspector'}
      </button>
      {collapsed ? null : (
        <>
          <div className="grid grid-cols-4 gap-1">
            {(['inspector', 'layers', 'scene', 'selection'] as const).map((entry) => (
              <button
                key={entry}
                type="button"
                className={clsx(
                  'rounded-lg border px-2 py-2 text-xs font-black',
                  tab === entry ? 'border-vita/70 bg-vita/25 text-textMain' : 'border-line bg-white/5 text-textMuted'
                )}
                onClick={() => setTab(entry)}
              >
                {entry === 'inspector' ? 'Item' : entry === 'layers' ? 'Layers' : entry === 'scene' ? 'Cena' : 'Sel.'}
              </button>
            ))}
          </div>

          <div className="mt-3 max-h-[calc(100vh-15rem)] overflow-auto pr-1">
            {tab === 'selection' ? (
              <section className="grid gap-3">
                <Header title="Selecao" value={totalSelection} />
                <div className="grid grid-cols-5 gap-2">
                  <MiniStat label="Tok" value={selectedTokenIds.length} />
                  <MiniStat label="Map" value={selectedMapInstanceIds.length} />
                  <MiniStat label="Obj" value={selectedObjectIds.length} />
                  <MiniStat label="Reg" value={selectedRegionIds.length} />
                  <MiniStat label="Por" value={selectedTileCells.length} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button type="button" onClick={clearSessionSelection}>Limpar</Button>
                  <Button type="button" tone="danger" disabled={!selectedTokenIds.length} onClick={removeSelectedTokens}>Remover tokens</Button>
                  <Button type="button" disabled={!selectedTokenIds.length} onClick={() => updateSelectedTokens({ hidden: false, visibleToPlayers: true })}>Revelar</Button>
                  <Button type="button" disabled={!selectedTokenIds.length} onClick={() => updateSelectedTokens({ hidden: true, visibleToPlayers: false })}>Ocultar</Button>
                </div>
              </section>
            ) : null}

            {tab === 'inspector' ? (
              <section className="grid gap-3">
                {selectedMap ? (
                  <div className="grid gap-3 rounded-lg border border-line bg-white/5 p-3">
                    <Header title={selectedMap.name} value={selectedMap.locked ? 'travado' : 'livre'} />
                    <div className="grid grid-cols-2 gap-2 text-xs text-textMuted">
                      <NumberInput label="X" value={Math.round(selectedMap.x)} onChange={(x) => updateSessionMapInstance(selectedMap.id, { x })} />
                      <NumberInput label="Y" value={Math.round(selectedMap.y)} onChange={(y) => updateSessionMapInstance(selectedMap.id, { y })} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button type="button" onClick={() => updateSessionMapInstance(selectedMap.id, { locked: !selectedMap.locked })}>{selectedMap.locked ? 'Destravar' : 'Travar'}</Button>
                      <Button type="button" onClick={() => updateSessionMapInstance(selectedMap.id, { visibleToPlayers: !selectedMap.visibleToPlayers })}>{selectedMap.visibleToPlayers ? 'Ocultar' : 'Revelar'}</Button>
                      <Button type="button" onClick={() => duplicateSessionMapInstance(selectedMap.id)}>Duplicar</Button>
                      <Button type="button" tone="danger" onClick={() => removeSessionMapInstance(selectedMap.id)}>Remover</Button>
                    </div>
                  </div>
                ) : totalSelection ? (
                  <ObjectInspector />
                ) : (
                  <div className="grid gap-3 rounded-lg border border-line bg-white/5 p-3">
                    <Header title="Sessao" value={map.name} />
                    <p className="text-sm text-textMuted">Selecione um token, mapa, objeto ou regiao para editar propriedades.</p>
                    <Button type="button" tone="primary" onClick={onSave}>Salvar agora</Button>
                  </div>
                )}
              </section>
            ) : null}

            {tab === 'layers' ? (
              <section className="grid gap-2">
                <Header title="Mapas no board" value={map.sessionMapInstances?.length || 0} />
                {(map.sessionMapInstances || []).map((instance) => (
                  <div key={instance.id} className="grid gap-2 rounded-lg border border-line bg-white/5 p-2">
                    <button type="button" className="text-left text-sm font-bold text-textMain" onClick={() => selectMapInstance(instance.id)}>{instance.name}</button>
                    <span className="text-xs text-textMuted">{Math.round(instance.x)}, {Math.round(instance.y)} / {instance.locked ? 'travado' : 'livre'}</span>
                    <div className="grid grid-cols-3 gap-1">
                      <Button type="button" onClick={() => updateSessionMapInstance(instance.id, { locked: !instance.locked })}>{instance.locked ? 'Soltar' : 'Travar'}</Button>
                      <Button type="button" onClick={() => updateSessionMapInstance(instance.id, { visibleToPlayers: !instance.visibleToPlayers })}>{instance.visibleToPlayers ? 'Ocultar' : 'Revelar'}</Button>
                      <Button type="button" tone="danger" onClick={() => removeSessionMapInstance(instance.id)}>x</Button>
                    </div>
                  </div>
                ))}
              </section>
            ) : null}

            {tab === 'scene' ? (
              <section className="grid gap-3">
                <Header title="Iluminacao" value={`${lighting.regions.length} regioes`} />
                <div className="grid grid-cols-2 gap-2">
                  <Button type="button" onClick={() => updateSessionLighting({ globalIllumination: true, darkness: 0, ambientIntensity: 1, ambientColor: '#f8fafc', playerVisible: false })}>Sol</Button>
                  <Button type="button" onClick={() => updateSessionLighting({ globalIllumination: false, darkness: 0.75, ambientIntensity: 0.2, ambientColor: '#172033' })}>Escuro</Button>
                  <Button type="button" onClick={() => { setSessionRegionPreset('dark'); setTool('template'); }}>Sala escura</Button>
                  <Button type="button" onClick={() => { setSessionRegionPreset('light'); setTool('template'); }}>Area clara</Button>
                  <Button type="button" onClick={hideAllFog}>Cobrir fog</Button>
                  <Button type="button" onClick={revealAllFog}>Revelar fog</Button>
                </div>
              </section>
            ) : null}
          </div>
        </>
      )}
    </aside>
  );
}

function Header({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <p className="min-w-0 truncate text-xs font-black uppercase text-violet">{title}</p>
      <Badge>{value}</Badge>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-line bg-black/20 p-2 text-center">
      <span className="block text-[10px] text-textMuted">{label}</span>
      <strong className="text-sm text-textMain">{value}</strong>
    </div>
  );
}

function NumberInput({ label, value, onChange }: { label: string; value: number; onChange(value: number): void }) {
  return (
    <label>
      {label}
      <input
        className="mt-1 w-full rounded-lg border border-line bg-black/20 px-2 py-2 text-textMain"
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}
