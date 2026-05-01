import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { api } from '../../api/client';
import type { CharacterSheet, Combatant } from '../../api/types';
import { hydrateCharacter } from '../../domain/system';
import { Badge, Button, Card } from '../Ui';
import { AssetPalette } from './AssetPalette';
import { LayerPanel } from './LayerPanel';
import { MapListPanel } from './MapListPanel';
import { MapStage } from './MapStage';
import { MapToolbar } from './MapToolbar';
import { useTabletopStore } from './mapStore';
import { ObjectInspector } from './ObjectInspector';
import { TokenPanel } from './TokenPanel';
import type { AvailableTabletopToken, OmniMap } from './types';

export function TabletopPage({
  characters,
  combatants
}: {
  characters: CharacterSheet[];
  combatants: Array<Combatant & Record<string, unknown>>;
}) {
  const queryClient = useQueryClient();
  const map = useTabletopStore((state) => state.map);
  const setMap = useTabletopStore((state) => state.setMap);
  const newMap = useTabletopStore((state) => state.newMap);
  const setMapMeta = useTabletopStore((state) => state.setMapMeta);
  const clearDirty = useTabletopStore((state) => state.clearDirty);
  const insertPrefab = useTabletopStore((state) => state.insertPrefab);
  const removePrefab = useTabletopStore((state) => state.removePrefab);
  const [message, setMessage] = useState('');
  const availableTokens = useMemo(() => buildAvailableTokens(characters, combatants), [characters, combatants]);

  const mapsQuery = useQuery({
    queryKey: ['maps'],
    queryFn: () => api.listMaps()
  });

  const saveMutation = useMutation({
    mutationFn: (nextMap: OmniMap) => api.createMap(nextMap),
    onSuccess: (result) => {
      setMap(result.map);
      clearDirty();
      setMessage('Mapa salvo.');
      queryClient.invalidateQueries({ queryKey: ['maps'] });
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : 'Falha ao salvar mapa.');
    }
  });

  const loadMutation = useMutation({
    mutationFn: (mapId: string) => api.getMap(mapId),
    onSuccess: (result) => {
      setMap(result.map);
      setMessage('Mapa carregado.');
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : 'Falha ao carregar mapa.');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (mapId: string) => api.deleteMap(mapId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maps'] });
      newMap('Novo mapa', 28, 18, 32);
      setMessage('Mapa removido.');
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : 'Falha ao remover mapa.');
    }
  });

  function handleNew() {
    const ok = window.confirm('Criar um mapa novo? Alteracoes locais nao salvas serao descartadas.');
    if (!ok) return;
    newMap('Novo mapa', 28, 18, 32);
    setMessage('Mapa novo criado.');
  }

  function handleSave() {
    saveMutation.mutate(map);
  }

  function handleDelete() {
    const ok = window.confirm(`Excluir "${map.name}"?`);
    if (!ok) return;
    deleteMutation.mutate(map.id);
  }

  const maps = mapsQuery.data?.maps || [];
  const saving = saveMutation.isPending || loadMutation.isPending || deleteMutation.isPending;

  return (
    <div className="grid gap-4">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <span className="text-xs font-black uppercase text-violet">Mesa</span>
            <h2 className="mt-2 text-2xl font-black text-textMain">Criador de mapas</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge tone={map.mode === 'build' ? 'accent' : 'neutral'}>{map.mode === 'build' ? 'Modo construcao' : 'Modo sessao'}</Badge>
              <Badge>{map.width}x{map.height}</Badge>
              <Badge>Grid {map.gridSize}</Badge>
            </div>
          </div>
          {message ? <Badge tone={message.includes('Falha') ? 'danger' : 'good'}>{message}</Badge> : null}
        </div>
      </Card>

      <MapToolbar saving={saving} onNew={handleNew} onSave={handleSave} onDelete={handleDelete} />

      <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
        <div className="grid content-start gap-4">
          <MapSettings map={map} onChange={setMapMeta} />
          {map.mode === 'build' ? (
            <>
              <AssetPalette />
              <PrefabPanel
                map={map}
                onInsert={(prefabId) => insertPrefab(prefabId, map.gridSize * 2, map.gridSize * 2)}
                onRemove={removePrefab}
              />
            </>
          ) : <TokenPanel tokens={availableTokens} />}
          <MapListPanel
            maps={maps}
            activeMapId={map.id}
            loading={mapsQuery.isLoading || loadMutation.isPending}
            onLoad={(mapId) => loadMutation.mutate(mapId)}
          />
        </div>

        <MapStage />

        <div className="grid content-start gap-4">
          <LayerPanel />
          {map.mode === 'session' ? <TokenPanel tokens={availableTokens} /> : null}
          <ObjectInspector />
          <SessionReadout map={map} />
        </div>
      </div>
    </div>
  );
}

function MapSettings({
  map,
  onChange
}: {
  map: OmniMap;
  onChange(patch: Pick<OmniMap, 'name' | 'width' | 'height' | 'gridSize'>): void;
}) {
  return (
    <section className="rounded-lg border border-line bg-panel/90 p-3">
      <p className="text-xs font-black uppercase text-violet">Mapa</p>
      <div className="mt-3 grid gap-3">
        <label className="text-sm font-semibold text-textMuted">
          Nome
          <input
            className="mt-1 w-full rounded-lg border border-line bg-white/5 px-3 py-2 text-textMain"
            value={map.name}
            onChange={(event) => onChange({ name: event.target.value, width: map.width, height: map.height, gridSize: map.gridSize })}
          />
        </label>
        <div className="grid grid-cols-3 gap-2">
          <NumberField label="Largura" value={map.width} min={8} max={120} onChange={(width) => onChange({ name: map.name, width, height: map.height, gridSize: map.gridSize })} />
          <NumberField label="Altura" value={map.height} min={8} max={120} onChange={(height) => onChange({ name: map.name, width: map.width, height, gridSize: map.gridSize })} />
          <NumberField label="Grid" value={map.gridSize} min={24} max={96} onChange={(gridSize) => onChange({ name: map.name, width: map.width, height: map.height, gridSize })} />
        </div>
      </div>
    </section>
  );
}

function NumberField({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange(value: number): void }) {
  return (
    <label className="text-xs font-semibold text-textMuted">
      {label}
      <input
        className="mt-1 w-full rounded-lg border border-line bg-white/5 px-2 py-2 text-textMain"
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function SessionReadout({ map }: { map: OmniMap }) {
  const visibleTokens = map.tokens.filter((token) => token.visibleToPlayers).length;
  const hiddenTokens = map.tokens.length - visibleTokens;
  return (
    <section className="rounded-lg border border-line bg-panel/90 p-3">
      <p className="text-xs font-black uppercase text-violet">Sessao</p>
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <MiniStat label="Tokens" value={map.tokens.length} />
        <MiniStat label="Ocultos" value={hiddenTokens} />
        <MiniStat label="Objetos" value={map.objectLayer.objects.length + map.decorationLayer.objects.length + map.detailLayer.objects.length} />
        <MiniStat label="Fog" value={map.fogLayer.revealedCells.length} />
      </div>
    </section>
  );
}

function PrefabPanel({
  map,
  onInsert,
  onRemove
}: {
  map: OmniMap;
  onInsert(prefabId: string): void;
  onRemove(prefabId: string): void;
}) {
  return (
    <section className="rounded-lg border border-line bg-panel/90 p-3">
      <p className="text-xs font-black uppercase text-violet">Prefabs</p>
      <div className="mt-3 grid gap-2">
        {(map.prefabs || []).map((prefab) => (
          <div key={prefab.id} className="rounded-lg border border-line bg-white/5 p-2">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <strong className="block truncate text-sm text-textMain">{prefab.name}</strong>
                <span className="text-xs text-textMuted">{prefab.objects.length} objeto(s)</span>
              </div>
              <div className="flex gap-1">
                <Button type="button" onClick={() => onInsert(prefab.id)}>+</Button>
                <Button type="button" tone="danger" onClick={() => onRemove(prefab.id)}>x</Button>
              </div>
            </div>
          </div>
        ))}
        {!map.prefabs?.length ? <p className="text-sm text-textMuted">Selecione objetos e salve uma composicao no inspetor.</p> : null}
      </div>
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-line bg-white/5 p-2">
      <span className="block text-xs text-textMuted">{label}</span>
      <strong className="text-lg text-textMain">{value}</strong>
    </div>
  );
}

function buildAvailableTokens(characters: CharacterSheet[], combatants: Array<Combatant & Record<string, unknown>>): AvailableTabletopToken[] {
  const characterTokens = characters.map(hydrateCharacter).map((character) => ({
    id: `char-${character.id}`,
    sourceId: character.id,
    kind: 'character' as const,
    name: character.identity.name || 'Personagem',
    image: character.identity.image,
    hpCurrent: Number(character.resources.pvCurrent || 0),
    hpMax: 0,
    subtitle: `${character.identity.className || 'Player'} Nv ${character.identity.level || 1}`
  }));

  const combatTokens = combatants.map((combatant) => ({
    id: `combat-${combatant.instanceId}`,
    sourceId: combatant.instanceId,
    kind: combatant.combatantType === 'enemy' ? 'enemy' as const : combatant.combatantType === 'character' ? 'character' as const : 'companion' as const,
    name: combatant.name || 'Combatente',
    image: combatant.image,
    hpCurrent: Number(combatant.pvCurrent || 0),
    hpMax: Number(combatant.pvMax || 0),
    subtitle: combatant.subtitle || combatant.combatantType
  }));

  const byId = new Map<string, AvailableTabletopToken>();
  [...combatTokens, ...characterTokens].forEach((token) => byId.set(token.id, token));
  return Array.from(byId.values());
}
