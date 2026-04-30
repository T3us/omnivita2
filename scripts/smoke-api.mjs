import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

function trimSlash(value) {
  return String(value || '').trim().replace(/\/+$/, '');
}

async function readTextIfExists(filePath) {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch (error) {
    if (error?.code === 'ENOENT') return '';
    throw error;
  }
}

async function resolveApiBaseUrl() {
  const explicit = trimSlash(process.env.OMNIVITA_API_URL || process.env.API_BASE_URL);
  if (explicit) return explicit;

  const runtimeConfig = await readTextIfExists(path.join(repoRoot, 'assets', 'js', 'runtime-config.js'));
  const match = runtimeConfig.match(/apiBaseUrl:\s*['"]([^'"]+)['"]/);
  return trimSlash(match?.[1] || 'http://localhost:3001');
}

async function resolveSmokeAccount() {
  const username = String(process.env.OMNIVITA_SMOKE_USERNAME || '').trim();
  const password = String(process.env.OMNIVITA_SMOKE_PASSWORD || '').trim();
  if (username && password) return { username, password };

  const rawAccounts = await readTextIfExists(path.join(repoRoot, 'migration-input', 'manual-accounts.json'));
  if (!rawAccounts) return { username: 'mestre', password: '12032007' };

  const accounts = JSON.parse(rawAccounts);
  const master = Array.isArray(accounts)
    ? accounts.find((account) => String(account.role || '').toLowerCase() === 'master') || accounts[0]
    : null;

  return {
    username: String(master?.username || 'mestre'),
    password: String(master?.password || '12032007')
  };
}

async function request(baseUrl, pathName, options = {}) {
  const headers = {
    ...(options.headers || {})
  };

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${baseUrl}${pathName}`, {
    method: options.method || 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });

  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { message: text };
    }
  }

  if (!response.ok) {
    const message = payload?.message || payload?.error || text || `HTTP ${response.status}`;
    throw new Error(`${pathName} falhou: ${response.status} ${message}`);
  }

  return payload;
}

const baseUrl = await resolveApiBaseUrl();
const account = await resolveSmokeAccount();

console.log(`Smoke API: ${baseUrl}`);

const health = await request(baseUrl, '/health');
console.log(`Health: ${health?.service || 'api'} / banco ${health?.database || '?'}`);

const login = await request(baseUrl, '/api/auth/login', {
  method: 'POST',
  body: {
    identifier: account.username,
    password: account.password
  }
});

if (!login?.token) {
  throw new Error('Login nao retornou token.');
}

console.log(`Login: ${login.user?.username || account.username} (${login.user?.role || '?'})`);

const session = await request(baseUrl, '/api/auth/session', { token: login.token });
console.log(`Sessao: ${session?.user?.username || '?'} ativa`);

const bootstrap = await request(baseUrl, '/api/bootstrap', { token: login.token });
const characters = await request(baseUrl, login.user?.role === 'master' ? '/api/characters' : '/api/characters/me', { token: login.token });
const combat = await request(baseUrl, '/api/combat', { token: login.token });

const characterCount = Array.isArray(characters)
  ? characters.length
  : (Array.isArray(characters?.characters) ? characters.characters.length : (characters?.character ? 1 : 0));

console.log(`Bootstrap: ${bootstrap?.user?.username || bootstrap?.session?.user?.username || 'ok'}`);
console.log(`Fichas acessiveis: ${characterCount}`);
console.log(`Combate: ${combat?.state?.active ? 'ativo' : 'inativo'} / ${combat?.state?.combatants?.length || 0} participante(s)`);
console.log('Smoke concluido com sucesso.');
