import { useTabletopStore } from './mapStore';
import type { MapLayerKey } from './types';

const layers: Array<{ id: MapLayerKey; label: string }> = [
  { id: 'tokens', label: 'Tokens' },
  { id: 'notes', label: 'Notas' },
  { id: 'fog', label: 'Fog' },
  { id: 'mechanics', label: 'Mecanica' },
  { id: 'lighting', label: 'Luzes' },
  { id: 'collision', label: 'Colisao' },
  { id: 'details', label: 'Detalhes' },
  { id: 'objects', label: 'Objetos' },
  { id: 'decoration', label: 'Decoracao' },
  { id: 'walls', label: 'Paredes' },
  { id: 'floor', label: 'Piso' }
];

export function LayerPanel() {
  const map = useTabletopStore((state) => state.map);
  const setLayerVisibility = useTabletopStore((state) => state.setLayerVisibility);
  const setLayerLocked = useTabletopStore((state) => state.setLayerLocked);
  const setLayerOpacity = useTabletopStore((state) => state.setLayerOpacity);

  return (
    <section className="rounded-lg border border-line bg-panel/90 p-3">
      <p className="text-xs font-black uppercase text-violet">Camadas</p>
      <div className="mt-3 grid gap-2">
        {layers.map((layer) => {
          const state = getLayerState(map, layer.id);
          return (
            <div key={layer.id} className="rounded-lg border border-line bg-white/5 p-2">
              <div className="flex items-center justify-between gap-2">
                <strong className="text-sm text-textMain">{layer.label}</strong>
                <div className="flex gap-1">
                  <button className="rounded border border-line px-2 text-xs text-textMuted" type="button" onClick={() => setLayerVisibility(layer.id, !state.visible)}>
                    {state.visible ? 'Ver' : 'Oculta'}
                  </button>
                  {'locked' in state ? (
                    <button className="rounded border border-line px-2 text-xs text-textMuted" type="button" onClick={() => setLayerLocked(layer.id, !state.locked)}>
                      {state.locked ? 'Travada' : 'Livre'}
                    </button>
                  ) : null}
                </div>
              </div>
              {'opacity' in state ? (
                <input
                  className="mt-2 w-full accent-vita"
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={state.opacity}
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
  return { visible: true };
}
