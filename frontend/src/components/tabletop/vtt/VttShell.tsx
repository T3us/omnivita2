import { useCallback, useEffect, useRef, useState } from 'react';
import { useTabletopStore } from '../mapStore';
import type { AvailableTabletopToken, MapBounds, MapSummary, OmniMap } from '../types';
import { VttAssetShelf } from './VttAssetShelf';
import { VttCanvas, type VttCanvasControls } from './VttCanvas';
import { VttCommandPalette } from './VttCommandPalette';
import { VttInspectorPanel } from './VttInspectorPanel';
import { VttRuntimeBoundary } from './VttRuntimeBoundary';
import { VttNewMapModal } from './VttNewMapModal';
import { VttSaveAreaModal, type SaveAreaMeta } from './VttSaveAreaModal';
import { VttTokenModal } from './VttTokenModal';
import { VttToolPopover } from './VttToolPopover';
import { VttToolRail, type VttRailAction } from './VttToolRail';
import { VttTopBar } from './VttTopBar';
import { useVttKeyboard } from './hooks/useVttKeyboard';

export function VttShell({
  maps,
  tokens,
  customTokens,
  loadingMaps,
  saving,
  onSave,
  onSaveMapArea,
  onLoadMap,
  onAddMap,
  onRenameMap,
  onDuplicateMap,
  onDeleteMap,
  onCreateToken
}: {
  maps: MapSummary[];
  tokens: AvailableTabletopToken[];
  customTokens: AvailableTabletopToken[];
  loadingMaps?: boolean;
  saving: boolean;
  onSave(): void;
  onSaveMapArea(bounds: MapBounds, meta: SaveAreaMeta): Promise<void> | void;
  onLoadMap(mapId: string, mode: OmniMap['mode']): void;
  onAddMap(mapId: string): void;
  onRenameMap(mapId: string, name: string): void;
  onDuplicateMap(mapId: string): void;
  onDeleteMap(mapId: string): void;
  onCreateToken(token: AvailableTabletopToken): void;
}) {
  const controlsRef = useRef<VttCanvasControls | null>(null);
  const [heldAssetId, setHeldAssetId] = useState('');
  const [heldToken, setHeldToken] = useState<AvailableTabletopToken | null>(null);
  const [shelfOpen, setShelfOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [tokenModalOpen, setTokenModalOpen] = useState(false);
  const [newMapModalOpen, setNewMapModalOpen] = useState(false);
  const [saveAreaBounds, setSaveAreaBounds] = useState<MapBounds | null>(null);
  const [savingArea, setSavingArea] = useState(false);
  const [focusedShelfCategory, setFocusedShelfCategory] = useState<string>('');
  const [activePopover, setActivePopover] = useState<VttRailAction | null>(null);
  const [zoom, setZoom] = useState(1);
  const mode = useTabletopStore((state) => state.map.mode);

  const closeFloating = useCallback(() => {
    setShelfOpen(false);
    setCommandOpen(false);
    setActivePopover(null);
    setHeldAssetId('');
    setHeldToken(null);
  }, []);

  const resetCamera = useCallback(() => controlsRef.current?.resetCamera(), []);
  const focusSelection = useCallback(() => controlsRef.current?.focusSelection(), []);
  const openShelf = useCallback((category?: string) => {
    setFocusedShelfCategory(category || '');
    setShelfOpen(true);
  }, []);
  const beginAreaCapture = useCallback(() => {
    const store = useTabletopStore.getState();
    store.setMode('build');
    store.setTool('frame');
    store.clearSelection();
    setShelfOpen(false);
    setActivePopover(null);
    setHeldAssetId('');
    setHeldToken(null);
  }, []);

  useVttKeyboard({
    onToggleAssets: () => setShelfOpen((value) => !value),
    onToggleInspector: () => setInspectorOpen((value) => !value),
    onOpenCommandPalette: () => setCommandOpen(true),
    onCloseFloating: closeFloating,
    onResetCamera: resetCamera
  });

  useEffect(() => {
    setShelfOpen(false);
    setActivePopover(null);
    setHeldAssetId('');
    setHeldToken(null);
  }, [mode]);

  return (
    <main className="fixed inset-0 overflow-hidden bg-[#07040d] text-textMain">
      <VttRuntimeBoundary label="canvas">
        <VttCanvas
          heldAssetId={heldAssetId}
          heldToken={heldToken}
          clearHeld={() => {
            setHeldAssetId('');
            setHeldToken(null);
          }}
          onMapCapture={(bounds) => {
            setSaveAreaBounds(bounds);
            useTabletopStore.getState().setTool('select');
          }}
          onControlsReady={(controls) => {
          controlsRef.current = controls;
          setZoom(controls.camera.zoom);
        }}
      />
      </VttRuntimeBoundary>
      <VttTopBar
        saving={saving}
        zoom={zoom}
        onSave={mode === 'build' ? beginAreaCapture : onSave}
        onNewMap={() => setNewMapModalOpen(true)}
        onResetCamera={resetCamera}
        onFocusSelection={focusSelection}
        onToggleInspector={() => setInspectorOpen((value) => !value)}
        onModeChange={(nextMode) => {
          useTabletopStore.getState().setMode(nextMode);
          useTabletopStore.getState().clearSelection();
          setActivePopover(null);
          setHeldAssetId('');
          setHeldToken(null);
          setShelfOpen(false);
        }}
      />
      <VttToolRail
        activePopover={activePopover}
        onPopoverChange={setActivePopover}
        onToggleAssets={(category) => {
          if (category) {
            openShelf(category);
            return;
          }
          setShelfOpen((value) => !value);
        }}
      />
      <VttToolPopover
        action={activePopover}
        onClose={() => setActivePopover(null)}
        onOpenAssets={() => openShelf()}
        onResetCamera={resetCamera}
        onFocusSelection={focusSelection}
      />
      <VttAssetShelf
        open={shelfOpen}
        onOpenChange={setShelfOpen}
        maps={maps}
        tokens={tokens}
        customTokens={customTokens}
        loadingMaps={loadingMaps}
        mode={mode}
        focusCategory={focusedShelfCategory}
        onLoadMap={onLoadMap}
        onAddMap={onAddMap}
        onRenameMap={onRenameMap}
        onDuplicateMap={onDuplicateMap}
        onDeleteMap={onDeleteMap}
        onCreateToken={() => setTokenModalOpen(true)}
        onHoldToken={(token) => {
          setHeldToken(token);
          setHeldAssetId('');
          setShelfOpen(false);
        }}
        onHoldAsset={(assetId) => {
          setHeldAssetId(assetId);
          setHeldToken(null);
          setShelfOpen(false);
        }}
      />
      <VttInspectorPanel forcedOpen={inspectorOpen} onClose={() => setInspectorOpen(false)} />
      <VttCommandPalette
        open={commandOpen}
        onClose={() => setCommandOpen(false)}
        onOpenAssets={() => setShelfOpen(true)}
        onResetCamera={resetCamera}
      />
      <VttNewMapModal
        open={newMapModalOpen}
        onClose={() => setNewMapModalOpen(false)}
        onCreate={(config) => {
          const store = useTabletopStore.getState();
          store.newMap(config.name, config.width, config.height, config.gridSize);
          store.setMapMeta({ bounds: { x: 0, y: 0, width: config.width, height: config.height }, width: config.width, height: config.height });
          if (config.theme) store.setMapMeta({ theme: config.theme });
        }}
      />
      <VttSaveAreaModal
        bounds={saveAreaBounds}
        defaultName={useTabletopStore.getState().map.name && useTabletopStore.getState().map.name !== 'Novo mapa' ? useTabletopStore.getState().map.name : 'Novo mapa'}
        defaultGridSize={useTabletopStore.getState().map.gridSize}
        saving={savingArea}
        onClose={() => setSaveAreaBounds(null)}
        onSave={async (meta) => {
          if (!saveAreaBounds) return;
          setSavingArea(true);
          try {
            await onSaveMapArea(saveAreaBounds, meta);
            setSaveAreaBounds(null);
          } finally {
            setSavingArea(false);
          }
        }}
      />
      <VttTokenModal open={tokenModalOpen} onClose={() => setTokenModalOpen(false)} onCreate={onCreateToken} />
      {heldAssetId || heldToken ? (
        <div className="pointer-events-none fixed left-1/2 top-[68px] z-40 -translate-x-1/2 rounded-xl border border-vita/40 bg-[#12101a]/92 px-3 py-2 text-sm font-bold text-white shadow-soft">
          {heldToken ? `Token na mao: ${heldToken.name}` : 'Asset na mao: clique no canvas para colocar'} · Esc cancela
        </div>
      ) : null}
    </main>
  );
}
