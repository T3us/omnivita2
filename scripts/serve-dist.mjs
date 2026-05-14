import fs from 'node:fs/promises';
import http from 'node:http';
import https from 'node:https';
import net from 'node:net';
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
const apiProxyTarget = new URL(getArg(
  'api-target',
  process.env.OMNIVITA_API_PROXY_TARGET || process.env.OMNIVITA_API_URL || 'http://127.0.0.1:3001'
));
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

function shouldProxy(url) {
  const parsedUrl = new URL(url || '/', 'http://localhost');
  return parsedUrl.pathname.startsWith('/api')
    || parsedUrl.pathname === '/health'
    || parsedUrl.pathname.startsWith('/socket.io');
}

function proxyHttp(request, response) {
  const targetUrl = new URL(request.url || '/', apiProxyTarget);
  const transport = targetUrl.protocol === 'https:' ? https : http;

  const proxyRequest = transport.request({
    protocol: targetUrl.protocol,
    hostname: targetUrl.hostname,
    port: targetUrl.port,
    method: request.method,
    path: `${targetUrl.pathname}${targetUrl.search}`,
    headers: {
      ...request.headers,
      host: targetUrl.host
    }
  }, (proxyResponse) => {
    response.writeHead(proxyResponse.statusCode || 502, proxyResponse.headers);
    if (request.method === 'HEAD') {
      response.end();
      return;
    }
    proxyResponse.pipe(response);
  });

  proxyRequest.on('error', (error) => {
    console.error(error);
    if (!response.headersSent) {
      send(response, 502, 'API local indisponivel.');
      return;
    }
    response.end();
  });

  request.pipe(proxyRequest);
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
  if (shouldProxy(request.url)) {
    proxyHttp(request, response);
    return;
  }

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

server.on('upgrade', (request, socket, head) => {
  if (!shouldProxy(request.url) || apiProxyTarget.protocol !== 'http:') {
    socket.destroy();
    return;
  }

  const targetUrl = new URL(request.url || '/', apiProxyTarget);
  const proxySocket = net.connect(Number(targetUrl.port || 80), targetUrl.hostname, () => {
    const headers = {
      ...request.headers,
      host: targetUrl.host
    };
    const headerLines = [
      `${request.method} ${targetUrl.pathname}${targetUrl.search} HTTP/${request.httpVersion}`,
      ...Object.entries(headers).map(([name, value]) => `${name}: ${Array.isArray(value) ? value.join(', ') : value}`)
    ];

    proxySocket.write(`${headerLines.join('\r\n')}\r\n\r\n`);
    if (head.length) proxySocket.write(head);
    proxySocket.pipe(socket);
    socket.pipe(proxySocket);
  });

  proxySocket.on('error', () => {
    socket.destroy();
  });
});

server.listen(port, host, () => {
  console.log(`OmniVita site local em http://${host}:${port}`);
  console.log(`Proxy da API em ${apiProxyTarget.origin}`);
});
