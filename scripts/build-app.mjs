import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const frontendRoot = path.join(repoRoot, 'frontend');
const frontendDist = path.join(frontendRoot, 'dist');
const legacyDist = path.join(frontendDist, 'legacy');

const legacyFiles = [
  'index.html',
  'personagem.html',
  'mestre.html',
  'recuperar-dados.html',
  'omnitrix.html'
];

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      ...options
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} ${args.join(' ')} falhou com codigo ${code}`));
    });
  });
}

async function copyIfExists(source, destination) {
  try {
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.copyFile(source, destination);
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
}

await run('cmd.exe', ['/d', '/s', '/c', 'npm.cmd --prefix frontend run build'], { cwd: repoRoot });

await fs.rm(legacyDist, { recursive: true, force: true });
await fs.mkdir(legacyDist, { recursive: true });

for (const file of legacyFiles) {
  await copyIfExists(path.join(repoRoot, file), path.join(legacyDist, file));
}

await fs.cp(path.join(repoRoot, 'assets'), path.join(legacyDist, 'assets'), {
  recursive: true,
  force: true
});

console.log(`Build React concluido em: ${frontendDist}`);
console.log(`Fallback legado copiado para: ${legacyDist}`);
