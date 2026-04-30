import clsx from 'clsx';
import type { CharacterSheet, CombatState } from '../api/types';
import { calculateDerived, hydrateCharacter } from '../domain/system';

export function Badge({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'good' | 'warn' | 'danger' | 'accent' }) {
  const tones = {
    neutral: 'border-line bg-white/5 text-textMuted',
    good: 'border-vita/35 bg-vita/12 text-violet',
    warn: 'border-amber/30 bg-amber/10 text-amber',
    danger: 'border-coral/30 bg-coral/10 text-coral',
    accent: 'border-violet/30 bg-violet/10 text-violet'
  };
  return <span className={clsx('inline-flex min-h-7 max-w-full items-center rounded-lg border px-3 text-left text-sm font-semibold leading-tight break-words', tones[tone])}>{children}</span>;
}

export function Button({
  children,
  tone = 'secondary',
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: 'primary' | 'secondary' | 'danger' }) {
  const tones = {
    primary: 'bg-vita text-textMain shadow-[0_10px_28px_rgba(139,92,246,0.22)] hover:bg-vita/90',
    secondary: 'border border-line bg-white/5 text-textMain hover:bg-white/10',
    danger: 'border border-coral/35 bg-coral/15 text-textMain hover:bg-coral/25'
  };
  return (
    <button
      className={clsx('inline-flex min-h-9 max-w-full items-center justify-center rounded-lg px-3 text-center text-sm font-bold leading-tight whitespace-normal transition disabled:cursor-not-allowed disabled:opacity-50', tones[tone], className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={clsx('rounded-lg border border-line bg-panel/90 p-4 shadow-soft backdrop-blur-xl md:p-5', className)}>{children}</section>;
}

export function StatCard({ label, value, helper, tone = 'neutral' }: { label: string; value: React.ReactNode; helper?: string; tone?: 'neutral' | 'good' | 'warn' | 'danger' | 'accent' }) {
  return (
    <Card className="min-h-28">
      <span className="text-sm text-textMuted">{label}</span>
      <strong className="mt-3 block text-3xl text-textMain">{value}</strong>
      {helper ? <p className="mt-2 text-sm text-textMuted">{helper}</p> : null}
    </Card>
  );
}

export function ResourceMeter({ label, current, max, tone = 'good' }: { label: string; current: number | null; max: number; tone?: 'good' | 'warn' | 'danger' }) {
  const safeMax = Math.max(1, Number(max || 0));
  const safeCurrent = Math.max(0, Number(current || 0));
  const percent = Math.max(0, Math.min(100, Math.round((safeCurrent / safeMax) * 100)));
  const colors = {
    good: 'bg-gradient-to-r from-[#ff636d] to-[#ff9c64]',
    warn: 'bg-gradient-to-r from-[#855cff] to-[#5f79ff]',
    danger: 'bg-gradient-to-r from-[#60d9ff] to-[#7fffd5]'
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold text-textMain">{label}</span>
        <span className="text-textMuted">
          {safeCurrent}/{safeMax}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-lg border border-line bg-black/40">
        <div className={clsx('h-full rounded-lg transition-all', colors[tone])} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export function CharacterCard({ character, compact = false }: { character: CharacterSheet; compact?: boolean }) {
  const hydrated = hydrateCharacter(character);
  const derived = calculateDerived(hydrated);
  const image = hydrated.identity.image || '/Gemini_Generated_Image_rvnvryrvnvryrvnv.png';

  return (
    <Card className="grid gap-4">
      <div className="flex items-center gap-4">
        <img src={image} alt="" className="h-16 w-16 rounded-lg border border-line object-cover" />
        <div className="min-w-0">
          <h3 className="truncate text-xl font-bold">{hydrated.identity.name}</h3>
          <p className="text-sm text-textMuted">
            {hydrated.identity.className} nivel {hydrated.identity.level}
          </p>
        </div>
        <Badge tone={hydrated.resources.status === 'Vivo' ? 'good' : 'warn'}>{hydrated.resources.status}</Badge>
      </div>
      {!compact ? (
        <div className="grid gap-3">
          <ResourceMeter label="PV" current={hydrated.resources.pvCurrent} max={derived.maxPv} tone="good" />
          <ResourceMeter label="PE" current={hydrated.resources.peCurrent} max={derived.maxPe} tone="warn" />
          <ResourceMeter label="PD" current={hydrated.resources.pdCurrent} max={derived.maxPd} tone="danger" />
        </div>
      ) : null}
    </Card>
  );
}

export function CombatSummary({ state }: { state: CombatState | null | undefined }) {
  const combatants = state?.combatants || [];
  const current = combatants.find((entry) => entry.isCurrentTurn);
  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold">Combate atual</h3>
          <p className="text-sm text-textMuted">{state?.active ? `Rodada ${state.round}` : 'Nenhum combate ativo no momento.'}</p>
        </div>
        <Badge tone={state?.active ? 'warn' : 'neutral'}>{combatants.length} participante(s)</Badge>
      </div>
      {current ? <p className="mt-4 text-textMain">Vez atual: <strong>{current.name}</strong></p> : null}
    </Card>
  );
}
