import clsx from 'clsx';
import type { ChangeEvent } from 'react';
import { useMemo, useRef, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import type { CharacterSheet, Combatant } from '../../api/types';
import { calculateDerived, hydrateCharacter } from '../../domain/system';
import { Badge, Button, Card } from '../Ui';
import { GridControls } from './GridControls';
import { exportTabletopMap, loadSavedTabletopMaps, loadTabletopMap, readTabletopMapFile, saveTabletopMap, type SavedTabletopMapSummary } from './MapManager';
import { MapCanvas } from './MapCanvas';
import { TilePalette } from './TilePalette';
import { AvailableTokenCard, TokenLayer } from './TokenLayer';
import { useTabletopStore } from './mapStore';
import type { TabletopAvailableToken, TabletopMapState } from './types';

export function TabletopPage({
  characters,
  combatants
}: {
  characters: CharacterSheet[];
  combatants: Array<Combatant & Record<string, unknown>>;
}) {
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const mode = useTabletopStore((state) => state.currentMode);
  const setMode = useTabletopStore((state) => state.setMode);
  const setMapName = useTabletopStore((state) => state.setMapName);
  const newMap = useTabletopStore((state) => state.newMap);
  const setMap = useTabletopStore((state) => state.setMap);
  const name = useTabletopStore((state) => state.name);
  const gridWidth = useTabletopStore((state) => state.gridWidth);
  const gridHeight = useTabletopStore((state) => state.gridHeight);
  const tileSize = useTabletopStore((state) => state.tileSize);
  const tokens = useTabletopStore((state) => state.tokens);
  const [savedMaps, setSavedMaps] = useState<SavedTabletopMapSummary[]>(() => loadSavedTabletopMaps());
  const [selectedMapId, setSelectedMapId] = useState('');
  const [status, setStatus] = useState('Mesa pronta.');
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const availableTokens = useMemo(() => buildAvailableTokens(characters, combatants), [characters, combatants]);
  const width = gridWidth * tileSize;
  const height = gridHeight * tileSize;

  function refreshSavedMaps() {
    const list = loadSavedTabletopMaps();
    setSavedMaps(list);
    if (!selectedMapId && list[0]) setSelectedMapId(list[0].id);
  }

  function currentMapSnapshot(): TabletopMapState {
    const state = useTabletopStore.getState();
    return {
      version: 1,
      id: state.id,
      name: state.name,
      gridWidth: state.gridWidth,
      gridHeight: state.gridHeight,
      tileSize: state.tileSize,
      layers: state.layers,
      tokens: state.tokens,
      customTiles: state.customTiles,
      updatedAt: state.updatedAt
    };
  }

  function handleSave() {
    const nextName = window.prompt('Nome do mapa', name)?.trim();
    if (!nextName) return;
    const previousMode = mode;
    const saved = saveTabletopMap(currentMapSnapshot(), nextName);
    setMap(saved);
    setMode(previousMode);
    setStatus(`Mapa "${saved.name}" salvo.`);
    refreshSavedMaps();
    setSelectedMapId(saved.id);
  }

  function handleLoad() {
    const map = selectedMapId ? loadTabletopMap(selectedMapId) : null;
    if (!map) {
      setStatus('Escolha um mapa salvo para carregar.');
      return;
    }
    setMap(map);
    setStatus(`Mapa "${map.name}" carregado.`);
  }

  function handleNewMap() {
    const nextName = window.prompt('Nome do novo mapa', 'Novo mapa')?.trim();
    if (!nextName) return;
    const widthInput = window.prompt('Largura em celulas', '30');
    const heightInput = window.prompt('Altura em celulas', '22');
    newMap(nextName, Number(widthInput || 30), Number(heightInput || 22));
    setStatus(`Mapa "${nextName}" criado.`);
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const map = await readTabletopMapFile(file);
      setMap(map);
      setStatus(`Mapa "${map.name}" importado.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Falha ao importar mapa.');
    } finally {
      event.target.value = '';
    }
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="grid gap-4">
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <Badge tone="accent">MESA DO MESTRE</Badge>
              <h2 className="mt-3 text-2xl font-black">Tabletop pixelado</h2>
              <p className="mt-2 max-w-3xl text-sm text-textMuted">
                Construa mapas por tiles, posicione NPCs e mova tokens no grid. Por enquanto fica privado no painel do mestre.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge>{mode === 'edit' ? 'Modo edicao' : 'Modo jogo'}</Badge>
              <Badge>{gridWidth} x {gridHeight}</Badge>
              <Badge>{tokens.length} token(s)</Badge>
            </div>
          </div>
        </Card>

        <Card>
          <div className="grid gap-3 xl:grid-cols-[minmax(220px,0.8fr)_minmax(0,1.6fr)]">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-textMuted">Nome do mapa</span>
              <input className={fieldClass} value={name} onChange={(event) => setMapName(event.target.value)} />
            </label>

            <div className="flex flex-wrap items-end gap-2">
              <Button type="button" tone={mode === 'edit' ? 'primary' : 'secondary'} onClick={() => setMode(mode === 'edit' ? 'view' : 'edit')}>
                {mode === 'edit' ? 'Modo Visualizacao/Jogo' : 'Modo Edicao'}
              </Button>
              <Button type="button" onClick={handleSave}>Salvar</Button>
              <Button type="button" onClick={handleLoad}>Carregar</Button>
              <Button type="button" onClick={handleNewMap}>Novo mapa</Button>
              <Button type="button" onClick={() => exportTabletopMap(currentMapSnapshot())}>Exportar JSON</Button>
              <Button type="button" onClick={() => importInputRef.current?.click()}>Importar JSON</Button>
              <Button type="button" onClick={() => setShowGrid((current) => !current)}>{showGrid ? 'Ocultar grid' : 'Mostrar grid'}</Button>
              <input ref={importInputRef} className="hidden" type="file" accept="application/json,.json" onChange={(event) => void handleImport(event)} />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <select className="min-h-9 rounded-lg border border-line bg-white/5 px-3 text-sm font-semibold text-textMain outline-none focus:border-vita" value={selectedMapId} onChange={(event) => setSelectedMapId(event.target.value)}>
              <option value="">Mapas salvos</option>
              {savedMaps.map((map) => (
                <option key={map.id} value={map.id}>{map.name} ({map.gridWidth}x{map.gridHeight})</option>
              ))}
            </select>
            <Button type="button" onClick={refreshSavedMaps}>Atualizar lista</Button>
            <Button type="button" onClick={() => setZoom((current) => Math.max(0.5, Number((current - 0.1).toFixed(2))))}>- Zoom</Button>
            <Badge>{Math.round(zoom * 100)}%</Badge>
            <Button type="button" onClick={() => setZoom((current) => Math.min(2, Number((current + 0.1).toFixed(2))))}>+ Zoom</Button>
            <span className="text-sm text-textMuted">{status}</span>
          </div>
        </Card>

        <div className={clsx('grid gap-4', mode === 'edit' ? '2xl:grid-cols-[280px_minmax(0,1fr)_280px]' : '2xl:grid-cols-[minmax(0,1fr)_280px]')}>
          {mode === 'edit' ? <TilePalette /> : null}

          <Card className="min-w-0 overflow-hidden">
            <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-black">{name}</h3>
                <p className="mt-1 text-sm text-textMuted">
                  {mode === 'edit' ? 'Clique e arraste para pintar. Botao direito ou Alt apaga a camada atual.' : 'Arraste tokens para reposicionar. Eles encaixam na celula mais proxima.'}
                </p>
              </div>
              <Badge>{tileSize}px</Badge>
            </div>

            <div className="max-h-[72vh] overflow-auto rounded-lg border border-line bg-black/50 p-3">
              <div
                className="relative"
                style={{
                  width: width * zoom,
                  height: height * zoom
                }}
              >
                <div
                  className="absolute left-0 top-0 overflow-hidden rounded-lg border border-black/60 shadow-[0_20px_80px_rgba(0,0,0,0.45)]"
                  style={{
                    width,
                    height,
                    transform: `scale(${zoom})`,
                    transformOrigin: 'top left'
                  }}
                >
                  <MapCanvas showGrid={showGrid} />
                  <GridControls zoom={zoom} />
                  <TokenLayer interactive={mode === 'view'} />
                </div>
              </div>
            </div>
          </Card>

          <aside className="grid content-start gap-4 rounded-lg border border-line bg-panel/90 p-4">
            <div>
              <h3 className="text-lg font-black">Fichas de NPCs</h3>
              <p className="mt-1 text-sm text-textMuted">Arraste uma ficha para o mapa para criar token.</p>
            </div>

            <div className="grid gap-2">
              {availableTokens.map((source) => <AvailableTokenCard key={`${source.kind}-${source.npcId}-${source.name}`} source={source} />)}
            </div>

            <div className="rounded-lg border border-line bg-white/5 p-3">
              <h4 className="font-black">Tokens no mapa</h4>
              <div className="mt-2 grid gap-2 text-sm text-textMuted">
                {tokens.length ? tokens.map((token) => (
                  <span className="flex items-center justify-between gap-2" key={token.id}>
                    <span className="truncate">{token.name}</span>
                    <Badge>{token.x}, {token.y}</Badge>
                  </span>
                )) : <span>Nenhum token posicionado.</span>}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </DndProvider>
  );
}

function buildAvailableTokens(characters: CharacterSheet[], combatants: Array<Combatant & Record<string, unknown>>): TabletopAvailableToken[] {
  const characterTokens = characters.map((character) => {
    const hydrated = hydrateCharacter(character);
    const derived = calculateDerived(hydrated);
    return {
      npcId: hydrated.id,
      name: hydrated.identity.name || 'Player',
      hp: Number(hydrated.resources.pvCurrent ?? derived.maxPv),
      maxHp: derived.maxPv,
      image: hydrated.identity.image || '',
      kind: 'player' as const
    };
  });

  const combatTokens = combatants.map((combatant) => ({
    npcId: String(combatant.instanceId || combatant.name),
    name: String(combatant.name || 'NPC'),
    hp: Number(combatant.pvCurrent || 1),
    maxHp: Math.max(1, Number(combatant.pvMax || combatant.pvCurrent || 1)),
    image: String(combatant.image || ''),
    kind: combatant.combatantType === 'enemy' ? 'enemy' as const : 'npc' as const
  }));

  const fallbackTokens: TabletopAvailableToken[] = [
    { npcId: 'npc-generic', name: 'NPC livre', hp: 10, maxHp: 10, image: '', kind: 'npc' },
    { npcId: 'enemy-generic', name: 'Inimigo livre', hp: 12, maxHp: 12, image: '', kind: 'enemy' }
  ];

  const seen = new Set<string>();
  return [...characterTokens, ...combatTokens, ...fallbackTokens].filter((token) => {
    const key = `${token.kind}-${token.npcId}-${token.name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const fieldClass = 'w-full rounded-lg border border-line bg-white/5 px-3 py-2 text-textMain outline-none transition focus:border-vita focus:ring-2 focus:ring-vita/20';
