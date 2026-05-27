import { Eye, EyeOff, Lock, Unlock, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useBootstrap } from '../../../hooks/useBootstrap';
import { useTabletopStore } from '../mapStore';
import type { SessionSelectedEntity } from '../types';

export function VttInspectorPanel({
  forcedOpen,
  onClose
}: {
  forcedOpen: boolean;
  onClose(): void;
}) {
  const map = useTabletopStore((state) => state.map);
  const selectedEntities = useTabletopStore((state) => state.selectedEntities);
  const updateToken = useTabletopStore((state) => state.updateToken);
  const updateSessionMapInstance = useTabletopStore((state) => state.updateSessionMapInstance);
  const duplicateSessionMapInstance = useTabletopStore((state) => state.duplicateSessionMapInstance);
  const removeSessionMapInstance = useTabletopStore((state) => state.removeSessionMapInstance);
  const removeToken = useTabletopStore((state) => state.removeToken);
  const role = useTabletopStore((state) => state.tabletopRole);
  const bootstrap = useBootstrap();
  const characters = bootstrap.data?.characters || [];
  const [tab, setTab] = useState<'inspector' | 'scene' | 'layers'>('inspector');
  const primary = selectedEntities[0] || null;
  const resolved = useMemo(() => primary ? resolveSelection(map, primary) : null, [map, primary]);

  if (!forcedOpen && !selectedEntities.length) return null;

  return (
    <aside className="pointer-events-auto fixed right-4 top-[68px] z-40 max-h-[72vh] w-[min(320px,calc(100vw-96px))] overflow-hidden rounded-xl border border-white/10 bg-[#12101a]/94 text-textMain shadow-[0_20px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-violet">Inspector</p>
          <p className="text-xs text-textMuted">{selectedEntities.length ? `${selectedEntities.length} selecionado(s)` : 'Cena'}</p>
        </div>
        <button type="button" className="rounded-lg p-2 text-textMuted hover:bg-white/10 hover:text-white" onClick={onClose} aria-label="Fechar inspector"><X size={16} /></button>
      </div>
      <div className="grid grid-cols-3 border-b border-white/10 text-xs font-bold">
        {(['inspector', 'scene', 'layers'] as const).map((entry) => (
          <button key={entry} type="button" className={`px-2 py-2 ${tab === entry ? 'bg-vita/25 text-white' : 'text-textMuted hover:bg-white/10'}`} onClick={() => setTab(entry)}>
            {entry === 'inspector' ? 'Item' : entry === 'scene' ? 'Cena' : 'Layers'}
          </button>
        ))}
      </div>
      <div className="max-h-[calc(72vh-92px)] overflow-y-auto p-3">
        {tab === 'inspector' ? (
          resolved ? (
            <div className="grid gap-3">
              <InspectorTitle entity={primary} title={resolved.title} subtitle={resolved.subtitle} />
              {primary?.type === 'token' && resolved.kind === 'token' ? (
                <div className="grid gap-2">
                  {role === 'gm' ? (
                    <div className="grid gap-2 rounded-lg border border-white/10 bg-white/5 p-3">
                      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-violet">Controle / Dono</p>
                      <label className="grid gap-1 text-xs font-bold text-textMuted">
                        Personagem vinculado
                        <select
                          className="h-9 rounded-lg border border-white/10 bg-black/20 px-2 text-sm text-white outline-none focus:border-vita/50"
                          value={resolved.item.ownerCharacterId || resolved.item.characterId || ''}
                          onChange={(event) => {
                            const character = characters.find((entry) => entry.id === event.target.value);
                            updateToken(resolved.item.id, {
                              ownerCharacterId: character?.id || undefined,
                              ownerUserId: character?.ownerUserId || undefined,
                              sourceSheetId: character?.id || resolved.item.sourceSheetId,
                              isPlayerToken: Boolean(character) || resolved.item.isPlayerToken
                            });
                          }}
                        >
                          <option value="">Sem dono</option>
                          {characters.map((character) => (
                            <option key={character.id} value={character.id}>{character.identity?.name || character.id}</option>
                          ))}
                        </select>
                      </label>
                      <TextInput label="Dono userId" value={resolved.item.ownerUserId || ''} onChange={(ownerUserId) => updateToken(resolved.item.id, { ownerUserId: ownerUserId || undefined })} />
                      <TextInput
                        label="Controlado por userIds"
                        value={(resolved.item.controlledByUserIds || []).join(', ')}
                        onChange={(value) => updateToken(resolved.item.id, { controlledByUserIds: value.split(',').map((entry) => entry.trim()).filter(Boolean) })}
                      />
                      <ToggleRow label="Token de player" enabled={Boolean(resolved.item.isPlayerToken)} onClick={() => updateToken(resolved.item.id, { isPlayerToken: !resolved.item.isPlayerToken })} />
                      <ToggleRow label="Forma / mini ficha" enabled={Boolean(resolved.item.isFormToken)} onClick={() => updateToken(resolved.item.id, { isFormToken: !resolved.item.isFormToken })} />
                    </div>
                  ) : null}
                  <ToggleRow label="Visivel aos players" enabled={resolved.item.visibleToPlayers} onClick={() => updateToken(resolved.item.id, { visibleToPlayers: !resolved.item.visibleToPlayers })} />
                  <ToggleRow label="Oculto" enabled={Boolean(resolved.item.hidden)} onClick={() => updateToken(resolved.item.id, { hidden: !resolved.item.hidden })} />
                  <ToggleRow label="Travado" enabled={Boolean(resolved.item.locked)} onClick={() => updateToken(resolved.item.id, { locked: !resolved.item.locked })} />
                  <ToggleRow label="Bloqueia movimento" enabled={Boolean(resolved.item.blocksMovement)} onClick={() => updateToken(resolved.item.id, { blocksMovement: !resolved.item.blocksMovement })} />
                  <button type="button" className="rounded-lg border border-red-500/30 px-3 py-2 text-left text-sm font-bold text-red-200 hover:bg-red-500/10" onClick={() => removeToken(resolved.item.id)}>Remover token</button>
                </div>
              ) : null}
              {primary?.type === 'map' && resolved.kind === 'map' ? (
                <div className="grid gap-2">
                  <ToggleRow label="Travado" enabled={resolved.item.locked} onClick={() => updateSessionMapInstance(resolved.item.id, { locked: !resolved.item.locked })} />
                  <ToggleRow label="Visivel aos players" enabled={resolved.item.visibleToPlayers} onClick={() => updateSessionMapInstance(resolved.item.id, { visibleToPlayers: !resolved.item.visibleToPlayers })} />
                  <button type="button" className="rounded-lg border border-white/10 px-3 py-2 text-left text-sm font-bold text-textMuted hover:bg-white/10 hover:text-white" onClick={() => duplicateSessionMapInstance(resolved.item.id)}>Duplicar mapa</button>
                  <button type="button" className="rounded-lg border border-red-500/30 px-3 py-2 text-left text-sm font-bold text-red-200 hover:bg-red-500/10" onClick={() => removeSessionMapInstance(resolved.item.id)}>Remover da sessao</button>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-textMuted">Selecione token, mapa ou objeto para editar.</p>
          )
        ) : tab === 'scene' ? (
          <ScenePanel />
        ) : (
          <LayersPanel />
        )}
      </div>
    </aside>
  );
}

function InspectorTitle({ entity, title, subtitle }: { entity: SessionSelectedEntity | null; title: string; subtitle: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-violet">{entity?.type || 'cena'}</p>
      <h3 className="mt-1 text-base font-black text-white">{title}</h3>
      <p className="mt-1 text-xs text-textMuted">{subtitle}</p>
    </div>
  );
}

function ToggleRow({ label, enabled, onClick }: { label: string; enabled: boolean; onClick(): void }) {
  return (
    <button type="button" className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left text-sm font-semibold text-textMuted hover:bg-white/10 hover:text-white" onClick={onClick}>
      <span>{label}</span>
      {enabled ? <Eye size={16} className="text-vita" /> : <EyeOff size={16} />}
    </button>
  );
}

function TextInput({ label, value, onChange }: { label: string; value: string; onChange(value: string): void }) {
  return (
    <label className="grid gap-1 text-xs font-bold text-textMuted">
      {label}
      <input className="h-9 rounded-lg border border-white/10 bg-black/20 px-2 text-sm text-white outline-none focus:border-vita/50" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function ScenePanel() {
  const map = useTabletopStore((state) => state.map);
  const setMapMeta = useTabletopStore((state) => state.setMapMeta);
  const updateSessionLighting = useTabletopStore((state) => state.updateSessionLighting);
  const setMode = useTabletopStore((state) => state.setMode);
  const bounds = map.bounds || { x: 0, y: 0, width: map.width, height: map.height };
  return (
    <div className="grid gap-2 text-sm">
      <InfoRow label="Cena" value={map.name} />
      <InfoRow label="Modo" value={map.mode === 'build' ? 'Construcao' : 'Sessao'} />
      {map.mode === 'build' && map.bounds ? (
        <div className="grid gap-2 rounded-lg border border-white/10 bg-white/5 p-3">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-violet">Bounds do mapa salvo</p>
          <label className="grid gap-1 text-xs font-bold text-textMuted">
            Nome do mapa
            <input className="h-9 rounded-lg border border-white/10 bg-black/20 px-2 text-sm text-white outline-none focus:border-vita/50" value={map.name} onChange={(event) => setMapMeta({ name: event.target.value || 'Novo mapa' })} />
          </label>
          <label className="grid gap-1 text-xs font-bold text-textMuted">
            Descricao
            <input className="h-9 rounded-lg border border-white/10 bg-black/20 px-2 text-sm text-white outline-none focus:border-vita/50" value={map.description || ''} onChange={(event) => setMapMeta({ description: event.target.value })} />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <NumberInput label="X" value={bounds.x} onChange={(value) => setMapMeta({ bounds: { ...bounds, x: value } })} />
            <NumberInput label="Y" value={bounds.y} onChange={(value) => setMapMeta({ bounds: { ...bounds, y: value } })} />
            <NumberInput label="Largura" value={bounds.width} min={1} onChange={(value) => setMapMeta({ bounds: { ...bounds, width: value }, width: value })} />
            <NumberInput label="Altura" value={bounds.height} min={1} onChange={(value) => setMapMeta({ bounds: { ...bounds, height: value }, height: value })} />
            <NumberInput label="Grid" value={map.gridSize} min={24} max={96} onChange={(value) => setMapMeta({ gridSize: value })} />
          </div>
          <button type="button" className="rounded-lg border border-white/10 px-3 py-2 text-left font-bold text-textMuted hover:bg-white/10 hover:text-white" onClick={() => setMapMeta({ bounds: { x: 0, y: 0, width: map.width, height: map.height } })}>Centralizar bounds em 0,0</button>
        </div>
      ) : null}
      <InfoRow label="Tokens" value={String(map.tokens.length)} />
      <InfoRow label="Mapas" value={String(map.sessionMapInstances?.length || 0)} />
      <button type="button" className="rounded-lg border border-white/10 px-3 py-2 text-left font-bold text-textMuted hover:bg-white/10 hover:text-white" onClick={() => setMode(map.mode === 'build' ? 'session' : 'build')}>Alternar Build/Session</button>
      <button type="button" className="rounded-lg border border-white/10 px-3 py-2 text-left font-bold text-textMuted hover:bg-white/10 hover:text-white" onClick={() => updateSessionLighting({ globalIllumination: true, darkness: 0, ambientIntensity: 1 })}>Sol / claro global</button>
      <button type="button" className="rounded-lg border border-white/10 px-3 py-2 text-left font-bold text-textMuted hover:bg-white/10 hover:text-white" onClick={() => updateSessionLighting({ globalIllumination: false, darkness: 0.75, ambientIntensity: 0.35 })}>Escuro global</button>
    </div>
  );
}

function NumberInput({ label, value, min = -999, max = 999, onChange }: { label: string; value: number; min?: number; max?: number; onChange(value: number): void }) {
  return (
    <label className="grid gap-1 text-xs font-bold text-textMuted">
      {label}
      <input
        className="h-9 rounded-lg border border-white/10 bg-black/20 px-2 text-sm text-white outline-none focus:border-vita/50"
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function LayersPanel() {
  const map = useTabletopStore((state) => state.map);
  const setLayerVisibility = useTabletopStore((state) => state.setLayerVisibility);
  const setLayerLocked = useTabletopStore((state) => state.setLayerLocked);
  const rows = [
    ['floor', map.tileLayers.floor.visible, map.tileLayers.floor.locked],
    ['walls', map.tileLayers.walls.visible, map.tileLayers.walls.locked],
    ['doors', map.tileLayers.doors.visible, map.tileLayers.doors.locked],
    ['objects', map.objectLayer.visible, map.objectLayer.locked],
    ['lighting', map.lightingLayer.visible, map.lightingLayer.locked],
    ['notes', map.notesLayer.visible, map.notesLayer.locked]
  ] as const;
  return (
    <div className="grid gap-2">
      {rows.map(([layer, visible, locked]) => (
        <div key={layer} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-2 py-2">
          <span className="text-sm font-bold text-textMuted">{layer}</span>
          <div className="flex gap-1">
            <button type="button" className="rounded p-1 text-textMuted hover:bg-white/10 hover:text-white" onClick={() => setLayerVisibility(layer, !visible)}>{visible ? <Eye size={15} /> : <EyeOff size={15} />}</button>
            <button type="button" className="rounded p-1 text-textMuted hover:bg-white/10 hover:text-white" onClick={() => setLayerLocked(layer, !locked)}>{locked ? <Lock size={15} /> : <Unlock size={15} />}</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2">
      <span className="text-textMuted">{label}</span>
      <strong className="text-white">{value}</strong>
    </div>
  );
}

function resolveSelection(map: ReturnType<typeof useTabletopStore.getState>['map'], entity: SessionSelectedEntity) {
  if (entity.type === 'token') {
    const item = map.tokens.find((entry) => entry.id === entity.id);
    return item ? { kind: 'token' as const, item, title: item.name, subtitle: `${item.kind} em ${item.x}, ${item.y}` } : null;
  }
  if (entity.type === 'map') {
    const item = (map.sessionMapInstances || []).find((entry) => entry.id === entity.id);
    if (!item && entity.id === 'base-map') return { kind: 'base-map' as const, item: map, title: map.name, subtitle: 'Mapa base' };
    return item ? { kind: 'map' as const, item, title: item.name, subtitle: `${item.width}x${item.height} celulas` } : null;
  }
  return { kind: 'item' as const, item: entity, title: entity.type, subtitle: entity.id };
}
