import { Badge, Button } from '../../Ui';
import { useTabletopStore } from '../mapStore';
import { ObjectInspector } from '../ObjectInspector';
import { TokenPanel } from '../TokenPanel';
import type { AvailableTabletopToken, MapSummary, SessionBoardSummary } from '../types';

export function SessionSidebar({
  tokens,
  maps,
  sessions,
  activeMapId,
  activeSessionBoardId,
  mapsLoading,
  onCreateSessionFromMap,
  onAddMapInstance,
  onLoadSessionBoard,
  onDeleteSessionBoard
}: {
  tokens: AvailableTabletopToken[];
  maps: MapSummary[];
  sessions: SessionBoardSummary[];
  activeMapId: string;
  activeSessionBoardId: string;
  mapsLoading: boolean;
  onCreateSessionFromMap(mapId: string): void;
  onAddMapInstance(mapId: string): void;
  onLoadSessionBoard(boardId: string): void;
  onDeleteSessionBoard(boardId: string): void;
}) {
  const map = useTabletopStore((state) => state.map);
  const selectedTokenIds = useTabletopStore((state) => state.selectedTokenIds);
  const selectedObjectIds = useTabletopStore((state) => state.selectedObjectIds);
  const selectedTileCells = useTabletopStore((state) => state.selectedTileCells);
  const selectedMapInstanceIds = useTabletopStore((state) => state.selectedMapInstanceIds);
  const selectedRegionIds = useTabletopStore((state) => state.selectedRegionIds);
  const clearSessionSelection = useTabletopStore((state) => state.clearSessionSelection);
  const setTool = useTabletopStore((state) => state.setTool);
  const setSessionRegionPreset = useTabletopStore((state) => state.setSessionRegionPreset);
  const removeSelectedTokens = useTabletopStore((state) => state.removeSelectedTokens);
  const updateSelectedTokens = useTabletopStore((state) => state.updateSelectedTokens);
  const revealAllFog = useTabletopStore((state) => state.revealAllFog);
  const hideAllFog = useTabletopStore((state) => state.hideAllFog);
  const updateSessionLighting = useTabletopStore((state) => state.updateSessionLighting);
  const removeLightingRegion = useTabletopStore((state) => state.removeLightingRegion);
  const addAreaTemplate = useTabletopStore((state) => state.addAreaTemplate);
  const updateSessionMapInstance = useTabletopStore((state) => state.updateSessionMapInstance);
  const removeSessionMapInstance = useTabletopStore((state) => state.removeSessionMapInstance);
  const duplicateSessionMapInstance = useTabletopStore((state) => state.duplicateSessionMapInstance);
  const selectMapInstance = useTabletopStore((state) => state.selectMapInstance);
  const lighting = map.sessionLighting || {
    globalIllumination: true,
    darkness: 0,
    ambientColor: '#d8e6ff',
    ambientIntensity: 1,
    playerVisible: false,
    regions: []
  };

  return (
    <div className="grid content-start gap-4">
      <section className="rounded-lg border border-line bg-panel/90 p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-black uppercase text-violet">Selecao</p>
          <Badge>{selectedTokenIds.length + selectedObjectIds.length + selectedTileCells.length + selectedMapInstanceIds.length + selectedRegionIds.length}</Badge>
        </div>
        <div className="mt-3 grid grid-cols-5 gap-2 text-sm">
          <MiniStat label="Tokens" value={selectedTokenIds.length} />
          <MiniStat label="Mapas" value={selectedMapInstanceIds.length} />
          <MiniStat label="Regioes" value={selectedRegionIds.length} />
          <MiniStat label="Interativos" value={selectedObjectIds.length} />
          <MiniStat label="Portas" value={selectedTileCells.filter((cell) => cell.layer === 'doors').length} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button type="button" onClick={clearSessionSelection}>Limpar</Button>
          <Button type="button" tone="danger" disabled={!selectedTokenIds.length} onClick={removeSelectedTokens}>Remover tokens</Button>
          <Button type="button" disabled={!selectedTokenIds.length} onClick={() => updateSelectedTokens({ hidden: false, visibleToPlayers: true })}>Revelar</Button>
          <Button type="button" disabled={!selectedTokenIds.length} onClick={() => updateSelectedTokens({ hidden: true, visibleToPlayers: false })}>Ocultar</Button>
        </div>
      </section>

      <TokenPanel tokens={tokens} />

      <section className="rounded-lg border border-line bg-panel/90 p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-black uppercase text-violet">Mapas no board</p>
          <Badge>{map.sessionMapInstances?.length || 0}</Badge>
        </div>
        <div className="mt-3 grid max-h-56 gap-2 overflow-auto pr-1">
          {(map.sessionMapInstances || []).map((instance) => (
            <div key={instance.id} className="rounded-lg border border-line bg-white/5 p-2">
              <strong className="block truncate text-sm text-textMain">{instance.name}</strong>
              <span className="text-xs text-textMuted">{Math.round(instance.x)}, {Math.round(instance.y)} - {instance.locked ? 'travado' : 'livre'} - {instance.visibleToPlayers ? 'visivel' : 'oculto'}</span>
              <div className="mt-2 grid grid-cols-5 gap-1">
                <Button type="button" onClick={() => selectMapInstance(instance.id)}>Focar</Button>
                <Button type="button" onClick={() => updateSessionMapInstance(instance.id, { locked: !instance.locked })}>{instance.locked ? 'Soltar' : 'Travar'}</Button>
                <Button type="button" onClick={() => updateSessionMapInstance(instance.id, { visibleToPlayers: !instance.visibleToPlayers })}>{instance.visibleToPlayers ? 'Ocultar' : 'Revelar'}</Button>
                <Button type="button" onClick={() => duplicateSessionMapInstance(instance.id)}>Dup</Button>
                <Button type="button" tone="danger" onClick={() => removeSessionMapInstance(instance.id)}>x</Button>
              </div>
            </div>
          ))}
          {!map.sessionMapInstances?.length ? <p className="text-sm text-textMuted">Use "Adicionar ao board" em um mapa base para montar varias cenas juntas.</p> : null}
        </div>
      </section>

      <section className="rounded-lg border border-line bg-panel/90 p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-black uppercase text-violet">Iluminacao</p>
          <Badge>{lighting.regions.length} regioes</Badge>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button type="button" onClick={() => updateSessionLighting({ globalIllumination: true, darkness: 0, ambientIntensity: 1, ambientColor: '#f8fafc', playerVisible: false })}>Sol</Button>
          <Button type="button" onClick={() => updateSessionLighting({ globalIllumination: false, darkness: 0.75, ambientIntensity: 0.2, ambientColor: '#172033' })}>Escuro</Button>
          <Button type="button" onClick={() => { setSessionRegionPreset('dark'); setTool('template'); }}>Desenhar sala escura</Button>
          <Button type="button" onClick={() => { setSessionRegionPreset('light'); setTool('template'); }}>Desenhar area clara</Button>
          <Button type="button" onClick={() => { setSessionRegionPreset('gm'); setTool('template'); }}>Desenhar GM-only</Button>
          <Button type="button" onClick={() => addAreaTemplate(createAreaTemplate(map, 'circle'))}>Circulo</Button>
          <Button type="button" onClick={() => addAreaTemplate(createAreaTemplate(map, 'cone'))}>Cone</Button>
          <Button type="button" onClick={() => addAreaTemplate(createAreaTemplate(map, 'line'))}>Linha</Button>
        </div>
        <div className="mt-3 grid max-h-32 gap-2 overflow-auto pr-1">
          {lighting.regions.map((region) => (
            <div key={region.id} className="flex items-center justify-between gap-2 rounded-lg border border-line bg-white/5 p-2">
              <span className="min-w-0 truncate text-sm text-textMain">{region.name}</span>
              <Button type="button" tone="danger" onClick={() => removeLightingRegion(region.id)}>x</Button>
            </div>
          ))}
          {!lighting.regions.length ? <p className="text-sm text-textMuted">Use regioes para sala escura, luz clara ou luz secreta do mestre.</p> : null}
        </div>
      </section>

      <section className="rounded-lg border border-line bg-panel/90 p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-black uppercase text-violet">Fog</p>
          <Badge>{map.fogLayer.revealedCells.length} celulas</Badge>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button type="button" onClick={hideAllFog}>Cobrir tudo</Button>
          <Button type="button" onClick={revealAllFog}>Revelar tudo</Button>
          <Button type="button" onClick={() => setTool('fog')}>Pincel fog</Button>
          <Button type="button" onClick={() => { setSessionRegionPreset('fog'); setTool('template'); }}>Desenhar nevoa</Button>
        </div>
      </section>

      <section className="rounded-lg border border-line bg-panel/90 p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-black uppercase text-violet">Sessoes salvas</p>
          {mapsLoading ? <Badge>Carregando</Badge> : <Badge>{sessions.length}</Badge>}
        </div>
        <div className="mt-3 grid max-h-64 gap-2 overflow-auto pr-1">
          {sessions.map((entry) => (
            <div key={entry.id} className="rounded-lg border border-line bg-white/5 p-2">
              <strong className="block truncate text-sm text-textMain">{entry.name}</strong>
              <span className="text-xs text-textMuted">{entry.sourceMapName || 'Mapa'} - {entry.tokens} token(s), {entry.exploredCells} fog</span>
              <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
                <Button type="button" disabled={entry.id === activeSessionBoardId} onClick={() => onLoadSessionBoard(entry.id)}>
                  {entry.id === activeSessionBoardId ? 'Sessao atual' : 'Abrir'}
                </Button>
                <Button type="button" tone="danger" onClick={() => onDeleteSessionBoard(entry.id)}>x</Button>
              </div>
            </div>
          ))}
          {!sessions.length && !mapsLoading ? <p className="text-sm text-textMuted">Crie uma sessao limpa a partir de um mapa base.</p> : null}
        </div>
      </section>

      <section className="rounded-lg border border-line bg-panel/90 p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-black uppercase text-violet">Criar por mapa</p>
          {mapsLoading ? <Badge>Carregando</Badge> : <Badge>{maps.length}</Badge>}
        </div>
        <div className="mt-3 grid max-h-56 gap-2 overflow-auto pr-1">
          {maps.map((entry) => (
            <div key={entry.id} className="rounded-lg border border-line bg-white/5 p-2">
              <strong className="block truncate text-sm text-textMain">{entry.name}</strong>
              <span className="text-xs text-textMuted">{entry.width}x{entry.height} - mapa base</span>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Button type="button" disabled={entry.id === activeMapId && !activeSessionBoardId} onClick={() => onCreateSessionFromMap(entry.id)}>
                  Nova sessao
                </Button>
                <Button type="button" onClick={() => onAddMapInstance(entry.id)}>
                  Adicionar ao board
                </Button>
              </div>
            </div>
          ))}
          {!maps.length && !mapsLoading ? <p className="text-sm text-textMuted">Salve mapas no builder para abrir aqui.</p> : null}
        </div>
      </section>

      <ObjectInspector />

      <section className="rounded-lg border border-line bg-panel/90 p-3">
        <p className="text-xs font-black uppercase text-violet">Estado da sessao</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <MiniStat label="Tokens" value={map.tokens.length} />
          <MiniStat label="Portas" value={map.tileLayers.doors.cells.length} />
          <MiniStat label="Luzes" value={map.lightingLayer.objects.length} />
          <MiniStat label="Fog aberto" value={map.fogLayer.revealedCells.length} />
        </div>
      </section>
    </div>
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

function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function createAreaTemplate(map: ReturnType<typeof useTabletopStore.getState>['map'], shape: 'circle' | 'cone' | 'line') {
  const radius = map.gridSize * 3;
  const center = {
    x: map.width * map.gridSize / 2,
    y: map.height * map.gridSize / 2
  };
  return {
    id: createId('template'),
    name: shape === 'cone' ? 'Cone' : shape === 'line' ? 'Linha' : 'Area circular',
    shape,
    x: center.x,
    y: center.y,
    width: shape === 'line' ? radius * 2 : radius * 2,
    height: shape === 'line' ? 0 : radius * 2,
    radius: shape === 'circle' ? radius : undefined,
    angle: shape === 'cone' ? 90 : undefined,
    color: '#67e8f9',
    opacity: 0.22,
    visibleToPlayers: true,
    createdAt: new Date().toISOString()
  };
}
