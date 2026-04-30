import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const distDir = path.join(repoRoot, 'dist');

const filesToCopy = [
  'index.html',
  'personagem.html',
  'mestre.html',
  'recuperar-dados.html',
  'omnitrix.html'
];

const dirsToCopy = [
  'assets'
];

async function removeDir(target) {
  await fs.rm(target, { recursive: true, force: true });
}

async function ensureDir(target) {
  await fs.mkdir(target, { recursive: true });
}

async function copyFileRelative(relativePath) {
  const source = path.join(repoRoot, relativePath);
  const destination = path.join(distDir, relativePath);
  await ensureDir(path.dirname(destination));
  await fs.copyFile(source, destination);
}

async function copyDirRelative(relativePath) {
  const source = path.join(repoRoot, relativePath);
  const destination = path.join(distDir, relativePath);
  await fs.cp(source, destination, { recursive: true, force: true });
}

await removeDir(distDir);
await ensureDir(distDir);

for (const file of filesToCopy) {
  try {
    await copyFileRelative(file);
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
}

for (const dir of dirsToCopy) {
  await copyDirRelative(dir);
}

console.log(`Build estatico concluido em: ${distDir}`);
