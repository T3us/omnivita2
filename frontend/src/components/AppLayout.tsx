import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/auth-context';
import { Button } from './Ui';

interface AppLayoutProps {
  title: string;
  eyebrow: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  sidebar?: React.ReactNode;
  hideHeader?: boolean;
  sidebarWidth?: 'player' | 'master';
}

export function AppLayout({
  title,
  eyebrow,
  children,
  actions,
  sidebar,
  hideHeader = false,
  sidebarWidth = 'player'
}: AppLayoutProps) {
  const sidebarTemplate = sidebarWidth === 'master' ? 'lg:grid-cols-[220px_minmax(0,1fr)]' : 'lg:grid-cols-[240px_minmax(0,1fr)]';

  return (
    <div className="min-h-screen bg-ink text-textMain">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_14%_18%,rgba(120,77,255,0.16),transparent_24%),radial-gradient(circle_at_84%_12%,rgba(174,108,255,0.10),transparent_20%),linear-gradient(135deg,#020204_0%,#09080d_38%,#0d0a13_62%,#030305_100%)]" />
      <div className="mx-auto grid min-h-screen w-full gap-3 px-2 py-2 md:gap-4 md:px-3 md:py-3">
        <div className={`grid min-h-[calc(100vh-24px)] gap-3 md:gap-4 ${sidebarTemplate}`}>
          <aside className="min-w-0 lg:sticky lg:top-3 lg:h-[calc(100vh-24px)] lg:overflow-auto">
            {sidebar || <DefaultSidebar />}
          </aside>
          <main className="min-w-0">
            {!hideHeader ? (
              <header className="mb-3 rounded-lg border border-line bg-panel/90 p-4 shadow-soft backdrop-blur-xl md:p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <span className="inline-flex min-h-6 items-center rounded-full border border-vita/20 bg-vita/10 px-3 text-xs font-black uppercase tracking-[0.08em] text-violet">
                      {eyebrow}
                    </span>
                    <h1 className="mt-2 text-2xl font-black leading-tight md:text-3xl">{title}</h1>
                  </div>
                  {actions ? <div className="flex flex-wrap justify-end gap-2">{actions}</div> : null}
                </div>
              </header>
            ) : null}
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

function DefaultSidebar() {
  const { session, logout } = useAuth();

  return (
    <div className="grid gap-4 rounded-lg border border-line bg-panel/90 p-4 shadow-soft backdrop-blur-xl">
      <div>
        <span className="inline-flex min-h-6 items-center rounded-full border border-vita/20 bg-vita/10 px-3 text-xs font-black uppercase tracking-[0.08em] text-violet">
          OMNIVITA
        </span>
        <h2 className="mt-3 text-2xl font-black">Mesa local</h2>
        <p className="mt-2 text-sm text-textMuted">Frontend novo em migracao progressiva.</p>
      </div>
      <nav className="grid gap-2">
        <NavLink className={({ isActive }) => linkClass(isActive)} to="/personagem">Personagem</NavLink>
        <NavLink className={({ isActive }) => linkClass(isActive)} to="/mestre">Mestre</NavLink>
        <NavLink className={({ isActive }) => linkClass(isActive)} to="/omnivita">OmniVita</NavLink>
        <NavLink className={({ isActive }) => linkClass(isActive)} to="/recuperar">Recuperar dados</NavLink>
      </nav>
      <div className="rounded-lg border border-line bg-panelSoft/80 p-3">
        <p className="text-sm text-textMuted">Sessao</p>
        <strong className="mt-1 block">{session?.user.username || '-'}</strong>
        <p className="text-sm text-textMuted">{session?.user.role === 'master' ? 'Mestre' : 'Jogador'}</p>
        <Button className="mt-3 w-full" type="button" onClick={() => void logout()}>Sair</Button>
      </div>
    </div>
  );
}

function linkClass(active: boolean) {
  return [
    'rounded-lg border px-3 py-3 text-sm font-bold transition',
    active ? 'border-vita/50 bg-vita/20 text-textMain' : 'border-line bg-white/5 text-textMain hover:bg-white/10'
  ].join(' ');
}
