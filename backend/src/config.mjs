import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(backendRoot, '..');

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseOrigins(value) {
  return String(value || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parseHost(value) {
  const host = String(value || '').trim();
  if (!host) return '0.0.0.0';
  if (host === '::') return '0.0.0.0';
  return host;
}

function isWildcardOriginMatch(origin, allowedOrigin) {
  const allowed = String(allowedOrigin || '').trim();
  if (!allowed.includes('*')) return false;

  try {
    const originUrl = new URL(origin);
    const allowedUrl = new URL(allowed.replace('*.', 'wildcard.'));
    const suffix = allowedUrl.hostname.replace(/^wildcard\./, '');

    return originUrl.protocol === allowedUrl.protocol
      && originUrl.hostname.endsWith(`.${suffix}`)
      && (!allowedUrl.port || originUrl.port === allowedUrl.port);
  } catch {
    return false;
  }
}

export const config = {
  host: parseHost(process.env.HOST),
  port: toNumber(process.env.PORT, 3001),
  databaseUrl: String(process.env.DATABASE_URL || '').trim(),
  appTokenSecret: String(process.env.APP_TOKEN_SECRET || 'change-me-now').trim(),
  tokenTtlDays: Math.max(1, toNumber(process.env.TOKEN_TTL_DAYS, 14)),
  corsOrigins: parseOrigins(process.env.CORS_ORIGINS || 'http://localhost:5500,http://127.0.0.1:5500'),
  backendRoot,
  repoRoot,
  sqlDir: path.join(backendRoot, 'sql'),
  migrationInputDir: path.join(repoRoot, 'migration-input')
};

export function isOriginAllowed(origin) {
  if (!origin) return true;
  if (origin === 'null') return true;
  if (!config.corsOrigins.length) return true;
  if (config.corsOrigins.includes('*')) return true;
  if (config.corsOrigins.includes(origin)) return true;
  if (config.corsOrigins.some((allowed) => isWildcardOriginMatch(origin, allowed))) return true;
  return false;
}
