import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const runtimeConfigPath = path.join(repoRoot, 'assets', 'js', 'runtime-config.js');
const frontendRuntimeConfigPath = path.join(repoRoot, 'frontend', 'public', 'runtime-config.js');

const rawUrl = String(process.argv[2] || '--relative').trim();
const nextUrl = rawUrl === '--relative' || rawUrl === 'relative'
  ? ''
  : rawUrl.replace(/\/+$/, '');

const nextSource = `window.OMNIVITA_RUNTIME_CONFIG = window.OMNIVITA_RUNTIME_CONFIG || {\n  apiBaseUrl: '${nextUrl}'\n};\n`;

await fs.writeFile(runtimeConfigPath, nextSource, 'utf8');
await fs.mkdir(path.dirname(frontendRuntimeConfigPath), { recursive: true });
await fs.writeFile(frontendRuntimeConfigPath, nextSource, 'utf8');

console.log(`runtime-config.js atualizado para: ${nextUrl || 'mesma origem (/api via proxy)'}`);
