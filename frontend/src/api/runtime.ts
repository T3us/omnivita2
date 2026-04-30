import { z } from 'zod';

const RuntimeConfigSchema = z.object({
  apiBaseUrl: z.string().trim().optional().default('')
});

declare global {
  interface Window {
    OMNIVITA_RUNTIME_CONFIG?: unknown;
  }
}

export function getRuntimeApiBaseUrl(): string {
  const parsed = RuntimeConfigSchema.safeParse(window.OMNIVITA_RUNTIME_CONFIG || {});
  const configured = parsed.success ? parsed.data.apiBaseUrl.replace(/\/+$/, '') : '';
  const hostname = String(window.location.hostname || '').toLowerCase();
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

  if (configured) return configured;
  if (isLocalhost) return 'http://localhost:3001';
  return '';
}
