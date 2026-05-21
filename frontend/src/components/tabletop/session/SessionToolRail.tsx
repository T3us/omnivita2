import clsx from 'clsx';
import {
  CloudFog,
  DoorOpen,
  Hand,
  Lightbulb,
  MousePointer2,
  Pencil,
  Radar,
  Ruler,
  Shapes,
  UserRoundPlus
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTabletopStore } from '../mapStore';
import type { MapTool } from '../types';

const tools: Array<{ id: MapTool; icon: LucideIcon; label: string; hint: string; group?: 'main' | 'scene' | 'utility' }> = [
  { id: 'select', icon: MousePointer2, label: 'Selecionar', hint: 'V', group: 'main' },
  { id: 'pan', icon: Hand, label: 'Mover camera', hint: 'H ou Space', group: 'main' },
  { id: 'token', icon: UserRoundPlus, label: 'Criar token', hint: 'T', group: 'main' },
  { id: 'fog', icon: CloudFog, label: 'Fog', hint: 'F', group: 'scene' },
  { id: 'light', icon: Lightbulb, label: 'Luz', hint: 'L', group: 'scene' },
  { id: 'door', icon: DoorOpen, label: 'Porta', hint: 'D', group: 'scene' },
  { id: 'measure', icon: Ruler, label: 'Regua', hint: 'M', group: 'utility' },
  { id: 'ping', icon: Radar, label: 'Ping', hint: 'P', group: 'utility' },
  { id: 'template', icon: Shapes, label: 'Template', hint: 'A', group: 'utility' },
  { id: 'note', icon: Pencil, label: 'Nota', hint: 'N', group: 'utility' }
];

export function SessionToolRail({ collapsed = false }: { collapsed?: boolean }) {
  const tool = useTabletopStore((state) => state.tool);
  const setTool = useTabletopStore((state) => state.setTool);

  if (collapsed) return null;

  let lastGroup = tools[0]?.group;

  return (
    <nav className="pointer-events-auto absolute left-3 top-1/2 z-20 flex -translate-y-1/2 flex-col overflow-hidden rounded-lg border border-line bg-[#12111a]/95 py-2 shadow-soft backdrop-blur-xl">
      {tools.map((entry) => {
        const Icon = entry.icon;
        const needsDivider = entry.group !== lastGroup;
        lastGroup = entry.group;
        return (
          <div key={entry.id} className={clsx(needsDivider && 'mt-2 border-t border-line/80 pt-2')}>
            <button
              type="button"
              className={clsx(
                'relative flex h-12 w-14 items-center justify-center text-[#9fb4d6] transition hover:bg-white/10 hover:text-textMain',
                tool === entry.id && 'bg-vita/30 text-[#9db7ff]'
              )}
              onClick={() => setTool(entry.id)}
              title={`${entry.label} (${entry.hint})`}
              aria-label={entry.label}
            >
              {tool === entry.id ? <span className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r bg-[#9db7ff]" /> : null}
              <Icon size={22} strokeWidth={2.15} />
            </button>
          </div>
        );
      })}
    </nav>
  );
}
