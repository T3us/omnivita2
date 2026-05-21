import { useTabletopStore } from '../mapStore';
import type { VttRailAction } from './VttToolRail';

export function VttToolPopover({
  action,
  onClose,
  onOpenAssets,
  onResetCamera,
  onFocusSelection
}: {
  action: VttRailAction | null;
  onClose(): void;
  onOpenAssets(): void;
  onResetCamera(): void;
  onFocusSelection(): void;
}) {
  const setTool = useTabletopStore((state) => state.setTool);
  const mode = useTabletopStore((state) => state.map.mode);
  const updateSessionLighting = useTabletopStore((state) => state.updateSessionLighting);
  const hideAllFog = useTabletopStore((state) => state.hideAllFog);
  const revealAllFog = useTabletopStore((state) => state.revealAllFog);
  const sessionFogEnabled = useTabletopStore((state) => state.sessionFogEnabled);
  const setSessionFogEnabled = useTabletopStore((state) => state.setSessionFogEnabled);

  if (!action || action === 'assets') return null;

  const rows = getRows(action, {
    setTool,
    onOpenAssets,
    mode,
    onResetCamera,
    onFocusSelection,
    onClose,
    sun: () => updateSessionLighting({ globalIllumination: true, darkness: 0, ambientIntensity: 1 }),
    dark: () => updateSessionLighting({ globalIllumination: false, darkness: 0.75, ambientIntensity: 0.35 }),
    toggleFog: () => setSessionFogEnabled(!sessionFogEnabled),
    hideAllFog,
    revealAllFog
  });

  return (
    <div className="pointer-events-auto fixed left-[76px] top-1/2 z-40 w-56 -translate-y-1/2 rounded-xl border border-white/10 bg-[#12101a]/95 p-2 text-sm text-textMain shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl">
      <div className="mb-2 flex items-center justify-between px-2">
        <span className="text-[11px] font-black uppercase tracking-[0.22em] text-violet">{labelForAction(action)}</span>
        <button type="button" className="rounded px-2 py-1 text-xs text-textMuted hover:bg-white/10 hover:text-white" onClick={onClose}>Esc</button>
      </div>
      <div className="grid gap-1">
        {rows.map((row) => (
          <button
            key={row.label}
            type="button"
            className="rounded-lg px-3 py-2 text-left text-sm font-semibold text-textMuted transition hover:bg-white/10 hover:text-white"
            onClick={row.onClick}
          >
            {row.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function getRows(action: VttRailAction, actions: {
  setTool(tool: Parameters<ReturnType<typeof useTabletopStore.getState>['setTool']>[0]): void;
  onOpenAssets(): void;
  onResetCamera(): void;
  onFocusSelection(): void;
  onClose(): void;
  sun(): void;
  dark(): void;
  toggleFog(): void;
  hideAllFog(): void;
  revealAllFog(): void;
  mode: 'build' | 'session';
}) {
  if (action === 'select') {
    return [
      { label: 'Selecionar / mover', onClick: () => actions.setTool('select') },
      { label: 'Focar selecao', onClick: actions.onFocusSelection },
      { label: 'Duplicar selecao (Ctrl+D)', onClick: actions.onClose }
    ];
  }
  if (action === 'pan') {
    return [
      { label: 'Resetar camera', onClick: actions.onResetCamera },
      { label: 'Focar selecao', onClick: actions.onFocusSelection },
      { label: 'Space + arrastar tambem move', onClick: actions.onClose }
    ];
  }
  if (action === 'fog') {
    return [
      { label: 'Ativar/desativar fog', onClick: actions.toggleFog },
      { label: 'Cobrir tudo', onClick: actions.hideAllFog },
      { label: 'Revelar tudo', onClick: actions.revealAllFog }
    ];
  }
  if (action === 'light') {
    return [
      { label: 'Sol / tudo claro', onClick: actions.sun },
      { label: 'Escuro global', onClick: actions.dark },
      { label: 'Criar luz no clique', onClick: () => actions.setTool('light') }
    ];
  }
  if (action === 'template') {
    return [
      { label: 'Template circular', onClick: () => actions.setTool('template') },
      { label: 'Template cone', onClick: () => actions.setTool('template') },
      { label: 'Template linha/raio', onClick: () => actions.setTool('template') },
      { label: 'Template aura', onClick: () => actions.setTool('template') }
    ];
  }
  if (action === 'frame') {
    return [
      { label: 'Arrastar area para salvar', onClick: () => actions.setTool('frame') },
      { label: 'Abrir mapas salvos', onClick: actions.onOpenAssets }
    ];
  }
  if (action === 'settings') {
    return [
      { label: 'Abrir assets', onClick: actions.onOpenAssets },
      { label: 'Resetar camera', onClick: actions.onResetCamera },
      { label: 'Focar selecao', onClick: actions.onFocusSelection }
    ];
  }
  return [
    { label: `Usar ${labelForAction(action)}`, onClick: () => actions.setTool(action as Parameters<typeof actions.setTool>[0]) },
    { label: 'Fechar', onClick: actions.onClose }
  ];
}

function labelForAction(action: VttRailAction) {
  const labels: Record<string, string> = {
    select: 'Select',
    pan: 'Pan',
    token: 'Token',
    fog: 'Fog',
    template: 'Template',
    frame: 'Salvar area',
    light: 'Light',
    door: 'Door',
    measure: 'Measure',
    ping: 'Ping',
    note: 'Note',
    settings: 'Settings'
  };
  return labels[action] || action;
}
