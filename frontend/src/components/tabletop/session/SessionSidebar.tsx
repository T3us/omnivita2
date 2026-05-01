import { Badge, Button } from '../../Ui';
import { useTabletopStore } from '../mapStore';
import { ObjectInspector } from '../ObjectInspector';
import { TokenPanel } from '../TokenPanel';
import type { AvailableTabletopToken, MapSummary } from '../types';

export function SessionSidebar({
  tokens,
  maps,
  activeMapId,
  mapsLoading,
  onLoadMap
}: {
  tokens: AvailableTabletopToken[];
  maps: MapSummary[];
  activeMapId: string;
  mapsLoading: boolean;
  onLoadMap(mapId: string): void;
}) {
  const map = useTabletopStore((state) => state.map);
  const selectedTokenIds = useTabletopStore((state) => state.selectedTokenIds);
  const selectedObjectIds = useTabletopStore((state) => state.selectedObjectIds);
  const selectedTileCells = useTabletopStore((state) => state.selectedTileCells);
  const clearSessionSelection = useTabletopStore((state) => state.clearSessionSelection);
  const removeSelectedTokens = useTabletopStore((state) => state.removeSelectedTokens);
  const updateSelectedTokens = useTabletopStore((state) => state.updateSelectedTokens);

  return (
    <div className="grid content-start gap-4">
      <section className="rounded-lg border border-line bg-panel/90 p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-black uppercase text-violet">Selecao</p>
          <Badge>{selectedTokenIds.length + selectedObjectIds.length + selectedTileCells.length}</Badge>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
          <MiniStat label="Tokens" value={selectedTokenIds.length} />
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
          <p className="text-xs font-black uppercase text-violet">Cenas salvas</p>
          {mapsLoading ? <Badge>Carregando</Badge> : <Badge>{maps.length}</Badge>}
        </div>
        <div className="mt-3 grid max-h-64 gap-2 overflow-auto pr-1">
          {maps.map((entry) => (
            <div key={entry.id} className="rounded-lg border border-line bg-white/5 p-2">
              <strong className="block truncate text-sm text-textMain">{entry.name}</strong>
              <span className="text-xs text-textMuted">{entry.width}x{entry.height} - {entry.tokens} token(s)</span>
              <Button className="mt-2 w-full" type="button" disabled={entry.id === activeMapId} onClick={() => onLoadMap(entry.id)}>
                {entry.id === activeMapId ? 'Cena atual' : 'Abrir cena'}
              </Button>
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
