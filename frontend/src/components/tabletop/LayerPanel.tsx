import clsx from 'clsx';
import { useTabletopStore } from './mapStore';
import type { MapLayerKey } from './types';

const layers: Array<{ id: MapLayerKey; label: string; icon: string }> = [
  { id: 'tokens', label: 'Tokens', icon: 'T' },
  { id: 'notes', label: 'Notas', icon: 'N' },
  { id: 'fog', label: 'Fog', icon: 'F' },
  { id: 'mechanics', label: 'Mecanica', icon: 'M' },
  { id: 'lighting', label: 'Luzes', icon: 'L' },
  { id: 'collision', label: 'Colisao', icon: 'C' },
  { id: 'details', label: 'Detalhes', icon: 'D' },
  { id: 'objects', label: 'Objetos', icon: 'O' },
  { id: 'decoration', label: 'Decoracao', icon: 'A' },
  { id: 'walls', label: 'Paredes', icon: 'W' },
  { id: 'floor', label: 'Piso', icon: 'P' }
];

export function LayerPanel() {
  const map = useTabletopStore((state) => state.map);
  const setActiveLayer = useTabletopStore((state) => state.setActiveLayer);
  const setLayerVisibility = useTabletopStore((state) => state.setLayerVisibility);
  const setLayerLocked = useTabletopStore((state) => state.setLayerLocked);
  const setLayerOpacity = useTabletopStore((state) => state.setLayerOpacity);
  const soloLayer = useTabletopStore((state) => state.soloLayer);
  const setSoloLayer = useTabletopStore((state) => state.setSoloLayer);

  return (
    <section className="rounded-lg border border-line bg-panel/90 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-black uppercase text-violet">Camadas</p>
        {soloLayer ? (
          <button className="rounded border border-amber/40 px-2 py-1 text-xs font-bold text-amber" type="button" onClick={() => setSoloLayer(null)}>
            Solo off
          </button>
        ) : null}
      </div>
      <div className="mt-3 grid gap-2">
        {layers.map((layer) => {
          const state = getLayerState(map, layer.id);
          const active = map.activeLayer === layer.id;
          const soloMuted = soloLayer && soloLayer !== layer.id;
          const visible = soloMuted ? false : state.visible;
          const count = getLayerCount(map, layer.id);
          return (
            <div
              key={layer.id}
              role="button"
              tabIndex={0}
              className={clsx(
                'rounded-lg border p-2 transition',
                active ? 'border-vita/70 bg-vita/15' : 'border-line bg-white/5 hover:bg-white/10',
                soloMuted && 'opacity-45'
              )}
              onClick={() => setActiveLayer(layer.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') setActiveLayer(layer.id);
              }}
            >
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-line bg-black/20 text-xs font-black text-violet">{layer.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <strong className="truncate text-sm text-textMain">{layer.label}</strong>
                    <span className="rounded border border-line bg-black/20 px-2 py-0.5 text-[11px] font-bold text-textMuted">{count}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-1">
                    <button
                      className={clsx('rounded border px-2 py-0.5 text-[11px] font-bold', visible ? 'border-vita/40 text-textMain' : 'border-line text-textMuted')}
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        if (layer.id !== 'tokens') setLayerVisibility(layer.id, !state.visible);
                      }}
                    >
                      {visible ? 'Ver' : 'Oculta'}
                    </button>
                    <button
                      className={clsx('rounded border px-2 py-0.5 text-[11px] font-bold', state.locked ? 'border-amber/40 text-amber' : 'border-line text-textMuted')}
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        if (layer.id !== 'tokens') setLayerLocked(layer.id, !state.locked);
                      }}
                    >
                      {state.locked ? 'Lock' : 'Livre'}
                    </button>
                    <button
                      className={clsx('rounded border px-2 py-0.5 text-[11px] font-bold', soloLayer === layer.id ? 'border-amber/40 text-amber' : 'border-line text-textMuted')}
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setSoloLayer(soloLayer === layer.id ? null : layer.id);
                      }}
                    >
                      Solo
                    </button>
                  </div>
                </div>
              </div>
              {layer.id !== 'tokens' ? (
                <input
                  className="mt-2 w-full accent-vita"
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={state.opacity}
                  onClick={(event) => event.stopPropagation()}
                  onChange={(event) => setLayerOpacity(layer.id, Number(event.target.value))}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function getLayerState(map: ReturnType<typeof useTabletopStore.getState>['map'], layer: MapLayerKey) {
  if (layer === 'floor' || layer === 'walls' || layer === 'collision') return map.tileLayers[layer];
  if (layer === 'objects') return map.objectLayer;
  if (layer === 'decoration') return map.decorationLayer;
  if (layer === 'details') return map.detailLayer;
  if (layer === 'lighting') return map.lightingLayer;
  if (layer === 'mechanics') return map.mechanicalLayer;
  if (layer === 'notes') return map.notesLayer;
  if (layer === 'fog') return map.fogLayer;
  return { visible: true, locked: false, opacity: 1 };
}

function getLayerCount(map: ReturnType<typeof useTabletopStore.getState>['map'], layer: MapLayerKey) {
  if (layer === 'floor' || layer === 'walls' || layer === 'collision') return map.tileLayers[layer].cells.length;
  if (layer === 'objects') return map.objectLayer.objects.length;
  if (layer === 'decoration') return map.decorationLayer.objects.length;
  if (layer === 'details') return map.detailLayer.objects.length;
  if (layer === 'lighting') return map.lightingLayer.objects.length;
  if (layer === 'mechanics') return map.mechanicalLayer.objects.length;
  if (layer === 'notes') return map.notesLayer.objects.length;
  if (layer === 'fog') return map.fogLayer.revealedCells.length;
  if (layer === 'tokens') return map.tokens.length;
  return 0;
}
