import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

function getArg(name, fallback) {
  const prefix = `--${name}=`;
  const match = process.argv.find((entry) => entry.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
}

const host = getArg('host', process.env.OMNIVITA_SITE_HOST || '0.0.0.0');
const port = Number(getArg('port', process.env.OMNIVITA_SITE_PORT || '5500'));
const requestedRoot = getArg('root', process.env.OMNIVITA_DIST_ROOT || '');
const distRoot = requestedRoot
  ? path.resolve(repoRoot, requestedRoot)
  : path.join(repoRoot, 'frontend', 'dist');

const mimeTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.jpeg', 'image/jpeg'],
  ['.jpg', 'image/jpeg'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml; charset=utf-8'],
  ['.webp', 'image/webp']
]);

function send(response, statusCode, body, headers = {}) {
  response.writeHead(statusCode, {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    ...headers
  });
  response.end(body);
}

function resolveRequestedPath(url) {
  const parsedUrl = new URL(url, 'http://localhost');
  const pathname = decodeURIComponent(parsedUrl.pathname || '/');
  const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const resolvedPath = path.resolve(distRoot, relativePath);

  if (!resolvedPath.startsWith(distRoot)) {
    return null;
  }

  return resolvedPath;
}

const server = http.createServer(async (request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    send(response, 405, 'Metodo nao permitido.', { Allow: 'GET, HEAD' });
    return;
  }

  const requestedPath = resolveRequestedPath(request.url || '/');
  if (!requestedPath) {
    send(response, 403, 'Acesso negado.');
    return;
  }

  try {
    let filePath = requestedPath;
    const stat = await fs.stat(filePath).catch(() => null);

    if (stat?.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    let content = await fs.readFile(filePath).catch(async (error) => {
      if (error?.code !== 'ENOENT') throw error;
      const hasExtension = Boolean(path.extname(filePath));
      if (hasExtension) throw error;
      filePath = path.join(distRoot, 'index.html');
      return fs.readFile(filePath);
    });
    const contentType = mimeTypes.get(path.extname(filePath).toLowerCase()) || 'application/octet-stream';
    response.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': contentType.includes('html') || filePath.endsWith('runtime-config.js')
        ? 'no-cache, no-store, must-revalidate'
        : 'public, max-age=60'
    });

    if (request.method === 'HEAD') {
      response.end();
      return;
    }

    response.end(content);
  } catch (error) {
    if (error?.code === 'ENOENT') {
      send(response, 404, 'Arquivo nao encontrado.');
      return;
    }

    console.error(error);
    send(response, 500, 'Erro ao servir arquivo.');
  }
});

server.listen(port, host, () => {
  console.log(`OmniVita site local em http://${host}:${port}`);
});
