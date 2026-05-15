import { useEffect, useMemo, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { getAccessToken } from '../api/client';
import { getRuntimeApiBaseUrl } from '../api/runtime';
import { Card } from '../components/Ui';

type CheckState = 'checking' | 'ok' | 'warn' | 'error';

interface CheckResult {
  label: string;
  status: CheckState;
  detail: string;
}

export function DebugConnectionPage() {
  const [checks, setChecks] = useState<CheckResult[]>([
    { label: 'Health', status: 'checking', detail: 'Testando /health...' },
    { label: 'API', status: 'checking', detail: 'Testando /api/auth/session...' },
    { label: 'Socket', status: 'checking', detail: 'Testando Socket.IO...' }
  ]);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const apiBase = getRuntimeApiBaseUrl() || origin;
  const token = getAccessToken();
  const cloudflareUrl = useMemo(() => (
    origin.includes('trycloudflare.com') ? origin : 'Nao esta em um link trycloudflare.com agora.'
  ), [origin]);

  useEffect(() => {
    let socket: Socket | null = null;
    let cancelled = false;

    async function runChecks() {
      const next: CheckResult[] = [];

      try {
        const response = await fetch('/health');
        const payload = await response.json().catch(() => null) as { ok?: boolean; database?: string; message?: string } | null;
        next.push({
          label: 'Health',
          status: response.ok && payload?.ok ? 'ok' : 'warn',
          detail: response.ok ? `HTTP ${response.status} / banco: ${payload?.database || 'desconhecido'}` : `HTTP ${response.status}`
        });
      } catch (error) {
        next.push({ label: 'Health', status: 'error', detail: error instanceof Error ? error.message : 'Falha no /health.' });
      }

      try {
        const response = await fetch('/api/auth/session');
        next.push({
          label: 'API',
          status: response.ok || response.status === 401 ? 'ok' : 'warn',
          detail: response.status === 401 ? 'API respondeu 401, normal se voce nao estiver logado.' : `HTTP ${response.status}`
        });
      } catch (error) {
        next.push({ label: 'API', status: 'error', detail: error instanceof Error ? error.message : 'Falha na API.' });
      }

      if (!token) {
        next.push({ label: 'Socket', status: 'warn', detail: 'Sem token de login; entre no OmniVita para testar socket autenticado.' });
        if (!cancelled) setChecks(next);
        return;
      }

      await new Promise<void>((resolve) => {
        socket = io(getRuntimeApiBaseUrl() || undefined, {
          transports: ['websocket', 'polling'],
          auth: { token },
          timeout: 5000
        });

        const finish = (result: CheckResult) => {
          next.push(result);
          socket?.disconnect();
          if (!cancelled) setChecks(next);
          resolve();
        };

        socket.on('connect', () => finish({ label: 'Socket', status: 'ok', detail: `Conectado: ${socket?.id || 'sem id'}` }));
        socket.on('connect_error', (error) => finish({ label: 'Socket', status: 'error', detail: error.message }));
        window.setTimeout(() => finish({ label: 'Socket', status: 'error', detail: 'Tempo esgotado ao conectar.' }), 6000);
      });
    }

    runChecks();

    return () => {
      cancelled = true;
      socket?.disconnect();
    };
  }, [token]);

  return (
    <main className="min-h-screen bg-ink p-6 text-textMain">
      <div className="mx-auto grid max-w-4xl gap-4">
        <Card>
          <span className="text-xs font-black uppercase text-violet">OmniVita</span>
          <h1 className="mt-2 text-3xl font-black">Debug de conexao</h1>
          <p className="mt-2 text-sm text-textMuted">Use esta tela para conferir Cloudflare, API e socket sem depender do painel do mestre.</p>
        </Card>

        <Card>
          <div className="grid gap-3 text-sm">
            <InfoRow label="Origin atual" value={origin} />
            <InfoRow label="API usada pelo front" value={apiBase} />
            <InfoRow label="Cloudflare atual" value={cloudflareUrl} />
            <InfoRow label="Login/token" value={token ? 'Token encontrado no navegador.' : 'Sem token salvo.'} />
          </div>
        </Card>

        <div className="grid gap-3 md:grid-cols-3">
          {checks.map((check) => (
            <Card key={check.label}>
              <span className={`text-xs font-black uppercase ${check.status === 'ok' ? 'text-emerald-300' : check.status === 'checking' ? 'text-violet' : check.status === 'warn' ? 'text-amber-300' : 'text-rose-300'}`}>
                {check.status}
              </span>
              <h2 className="mt-2 text-xl font-black">{check.label}</h2>
              <p className="mt-2 text-sm text-textMuted">{check.detail}</p>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-white/5 p-3">
      <div className="text-xs font-black uppercase text-violet">{label}</div>
      <div className="mt-1 break-all font-mono text-textMain">{value}</div>
    </div>
  );
}
