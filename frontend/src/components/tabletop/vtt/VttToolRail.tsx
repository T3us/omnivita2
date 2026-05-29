import clsx from 'clsx';
import {
  Box,
  CloudFog,
  DoorOpen,
  Eraser,
  Grid2X2,
  Hand,
  Lightbulb,
  MousePointer2,
  Package,
  Pencil,
  Radar,
  Ruler,
  Settings,
  Shapes,
  UserRoundPlus
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTabletopStore } from '../mapStore';
import type { MapTool } from '../types';

type RailAction = MapTool | 'assets' | 'settings';

const sessionTools: Array<{ id: RailAction; icon: LucideIcon; label: string; hint: string; group: 'main' | 'scene' | 'utility' | 'meta' }> = [
  { id: 'select', icon: MousePointer2, label: 'Selecionar / mover token', hint: 'V', group: 'main' },
  { id: 'move-token', icon: Hand, label: 'Mover tokens - arraste qualquer token visivel', hint: 'H', group: 'main' },
  { id: 'token', icon: UserRoundPlus, label: 'Spawn token', hint: 'T', group: 'main' },
  { id: 'fog', icon: CloudFog, label: 'Fog', hint: 'F', group: 'scene' },
  { id: 'template', icon: Shapes, label: 'Template', hint: 'A', group: 'scene' },
  { id: 'light', icon: Lightbulb, label: 'Luz', hint: 'L', group: 'scene' },
  { id: 'door', icon: DoorOpen, label: 'Porta', hint: 'D', group: 'scene' },
  { id: 'measure', icon: Ruler, label: 'Regua', hint: 'M', group: 'utility' },
  { id: 'ping', icon: Radar, label: 'Ping', hint: 'P', group: 'utility' },
  { id: 'note', icon: Pencil, label: 'Nota', hint: 'N', group: 'utility' },
  { id: 'assets', icon: Package, label: 'Assets', hint: 'B', group: 'meta' },
  { id: 'settings', icon: Settings, label: 'Configuracoes', hint: ',', group: 'meta' }
];

const buildTools: Array<{ id: RailAction; icon: LucideIcon; label: string; hint: string; group: 'main' | 'scene' | 'utility' | 'meta' }> = [
  { id: 'select', icon: MousePointer2, label: 'Selecionar / mover token', hint: 'V', group: 'main' },
  { id: 'move-token', icon: Hand, label: 'Mover tokens - arraste qualquer token visivel', hint: 'H', group: 'main' },
  { id: 'brush', icon: Grid2X2, label: 'Pintar piso', hint: 'B', group: 'scene' },
  { id: 'wall', icon: Package, label: 'Parede', hint: 'Tool', group: 'scene' },
  { id: 'collision', icon: Box, label: 'Colisao', hint: 'Tool', group: 'scene' },
  { id: 'door', icon: DoorOpen, label: 'Porta base', hint: 'Tool', group: 'scene' },
  { id: 'erase', icon: Eraser, label: 'Borracha', hint: 'Tool', group: 'scene' },
  { id: 'object', icon: Box, label: 'Props/objetos', hint: 'O', group: 'scene' },
  { id: 'light', icon: Lightbulb, label: 'Luz base', hint: 'L', group: 'scene' },
  { id: 'fog', icon: CloudFog, label: 'Fog base', hint: 'F', group: 'scene' },
  { id: 'measure', icon: Ruler, label: 'Regua', hint: 'M', group: 'utility' },
  { id: 'note', icon: Pencil, label: 'Nota', hint: 'N', group: 'utility' },
  { id: 'token', icon: UserRoundPlus, label: 'Biblioteca de tokens', hint: 'T', group: 'meta' },
  { id: 'assets', icon: Package, label: 'Assets', hint: 'B', group: 'meta' },
  { id: 'settings', icon: Settings, label: 'Configuracoes', hint: ',', group: 'meta' }
];

const playerTools: Array<{ id: RailAction; icon: LucideIcon; label: string; hint: string; group: 'main' | 'scene' | 'utility' | 'meta' }> = [
  { id: 'move-token', icon: Hand, label: 'Mover tokens - arraste qualquer token visivel', hint: 'H', group: 'main' },
  { id: 'measure', icon: Ruler, label: 'Regua', hint: 'M', group: 'utility' },
  { id: 'ping', icon: Radar, label: 'Ping', hint: 'P', group: 'utility' },
  { id: 'token', icon: UserRoundPlus, label: 'Meus tokens', hint: 'T', group: 'meta' },
  { id: 'settings', icon: Settings, label: 'Configuracoes', hint: ',', group: 'meta' }
];

export function VttToolRail({
  activePopover,
  onPopoverChange,
  onToggleAssets
}: {
  activePopover: RailAction | null;
  onPopoverChange(action: RailAction | null): void;
  onToggleAssets(category?: string): void;
}) {
  const tool = useTabletopStore((state) => state.tool);
  const mode = useTabletopStore((state) => state.map.mode);
  const role = useTabletopStore((state) => state.tabletopRole);
  const setTool = useTabletopStore((state) => state.setTool);
  if (role === 'player') {
    return <ToolRailContent key="player-tool-rail" tools={playerTools} tool={tool} activePopover={activePopover} onPopoverChange={onPopoverChange} onToggleAssets={onToggleAssets} setTool={setTool} />;
  }
  return mode === 'build' ? (
    <BuildToolRail key="build-tool-rail" tool={tool} activePopover={activePopover} onPopoverChange={onPopoverChange} onToggleAssets={onToggleAssets} setTool={setTool} />
  ) : (
    <SessionToolRail key="session-tool-rail" tool={tool} activePopover={activePopover} onPopoverChange={onPopoverChange} onToggleAssets={onToggleAssets} setTool={setTool} />
  );
}

function BuildToolRail(props: {
  tool: MapTool;
  activePopover: RailAction | null;
  onPopoverChange(action: RailAction | null): void;
  onToggleAssets(category?: string): void;
  setTool(tool: MapTool): void;
}) {
  return <ToolRailContent tools={buildTools} {...props} />;
}

function SessionToolRail(props: {
  tool: MapTool;
  activePopover: RailAction | null;
  onPopoverChange(action: RailAction | null): void;
  onToggleAssets(category?: string): void;
  setTool(tool: MapTool): void;
}) {
  return <ToolRailContent tools={sessionTools} {...props} />;
}

function ToolRailContent({
  tools,
  tool,
  activePopover,
  onPopoverChange,
  onToggleAssets,
  setTool
}: {
  tools: Array<{ id: RailAction; icon: LucideIcon; label: string; hint: string; group: 'main' | 'scene' | 'utility' | 'meta' }>;
  tool: MapTool;
  activePopover: RailAction | null;
  onPopoverChange(action: RailAction | null): void;
  onToggleAssets(category?: string): void;
  setTool(tool: MapTool): void;
}) {
  let currentGroup = tools[0]?.group;

  return (
    <nav className="pointer-events-auto fixed left-4 top-1/2 z-40 flex max-h-[calc(100vh-96px)] -translate-y-1/2 flex-col overflow-x-hidden overflow-y-auto rounded-xl border border-white/10 bg-[#12101a]/92 py-1 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl [scrollbar-color:rgba(167,139,250,0.35)_transparent] [scrollbar-width:thin]">
      {tools.map((entry) => {
        const Icon = entry.icon;
        const divider = entry.group !== currentGroup;
        currentGroup = entry.group;
        const active = entry.id === 'assets' ? activePopover === 'assets' : entry.id === 'settings' ? activePopover === 'settings' : tool === entry.id;
        return (
          <div key={entry.id} className={clsx(divider && 'mt-2 border-t border-white/10 pt-2')}>
            <button
              type="button"
              className={clsx(
                'relative flex h-9 w-9 items-center justify-center text-[#9fb4d6] transition hover:bg-white/10 hover:text-white',
                active && 'bg-vita/35 text-[#a9bfff]'
              )}
              title={`${entry.label} (${entry.hint})`}
              aria-label={entry.label}
              onClick={() => {
                if (entry.id === 'assets') {
                  onToggleAssets('maps');
                  onPopoverChange(null);
                  return;
                }
                if (entry.id === 'token') {
                  onToggleAssets(tools === buildTools ? 'npcs' : 'tokens');
                  onPopoverChange(null);
                  return;
                }
                if (entry.id === 'settings') {
                  onPopoverChange(activePopover === 'settings' ? null : 'settings');
                  return;
                }
                setTool(entry.id);
                onPopoverChange(shouldOpenPopover(entry.id) ? (activePopover === entry.id ? null : entry.id) : null);
              }}
            >
              {active ? <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r bg-[#9db7ff]" /> : null}
              <Icon size={18} strokeWidth={2.15} />
            </button>
          </div>
        );
      })}
    </nav>
  );
}

function shouldOpenPopover(action: RailAction) {
  return action === 'fog' || action === 'light' || action === 'template' || action === 'settings';
}

export type VttRailAction = RailAction;
