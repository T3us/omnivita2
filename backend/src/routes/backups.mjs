import {
  buildBackupPayload,
  createBackupFilename,
  readLatestBackupFile,
  restoreBackupPayload,
  writeBackupFile
} from '../backups.mjs';
import { requireMaster } from '../auth.mjs';

const SCOPE_LABELS = {
  all: 'completo',
  characters: 'fichas',
  maps: 'mapas',
  'session-boards': 'sessoes',
  'custom-assets': 'assets-customizados',
  settings: 'configuracoes-tabletop'
};

function normalizeScope(value) {
  const scope = String(value || 'all').trim().toLowerCase();
  if (scope === 'characters' || scope === 'fichas') return 'characters';
  if (scope === 'maps' || scope === 'mapas') return 'maps';
  if (scope === 'sessions' || scope === 'sessoes' || scope === 'session_boards') return 'session-boards';
  if (scope === 'assets' || scope === 'custom_assets' || scope === 'custom-assets') return 'custom-assets';
  if (scope === 'settings' || scope === 'tabletop-settings') return 'settings';
  return 'all';
}

function count(payload, key) {
  return Array.isArray(payload[key]) ? payload[key].length : 0;
}

function scopedPayload(payload, scope) {
  if (scope === 'all') return payload;

  const next = {
    ...payload,
    reason: `${payload.reason || 'manual-export'}:${scope}`,
    users: [],
    characters: [],
    combatState: [],
    masterData: [],
    maps: [],
    sessionBoards: [],
    customAssets: [],
    tabletopSettings: []
  };

  if (scope === 'characters') next.characters = payload.characters || [];
  if (scope === 'maps') next.maps = payload.maps || [];
  if (scope === 'session-boards') next.sessionBoards = payload.sessionBoards || [];
  if (scope === 'custom-assets') next.customAssets = payload.customAssets || [];
  if (scope === 'settings') next.tabletopSettings = payload.tabletopSettings || [];

  next.counts = {
    users: count(next, 'users'),
    characters: count(next, 'characters'),
    combatState: count(next, 'combatState'),
    masterData: count(next, 'masterData'),
    maps: count(next, 'maps'),
    sessionBoards: count(next, 'sessionBoards'),
    customAssets: count(next, 'customAssets'),
    tabletopSettings: count(next, 'tabletopSettings')
  };

  return next;
}

function backupFilenameForScope(scope) {
  const base = createBackupFilename();
  if (scope === 'all') return base;
  return base.replace('omnivita-backup-', `omnivita-backup-${SCOPE_LABELS[scope] || scope}-`);
}

function sendBackup(reply, payload, filename) {
  reply
    .header('Content-Type', 'application/json; charset=utf-8')
    .header('Content-Disposition', `attachment; filename="${filename}"`)
    .send(`${JSON.stringify(payload, null, 2)}\n`);
}

export default async function registerBackupRoutes(app) {
  app.get('/api/backups/export', async (request, reply) => {
    const auth = await requireMaster(request, reply);
    if (!auth) return;

    const scope = normalizeScope(request.query?.scope);
    const payload = scopedPayload(
      await buildBackupPayload({ reason: 'manual-site-export' }),
      scope
    );
    const filename = backupFilenameForScope(scope);

    await writeBackupFile(payload, { filename, writeLatest: scope === 'all' });
    sendBackup(reply, payload, filename);
  });

  app.get('/api/backups/latest', async (request, reply) => {
    const auth = await requireMaster(request, reply);
    if (!auth) return;

    try {
      const payload = await readLatestBackupFile();
      const exportedAt = payload?.exportedAt ? new Date(payload.exportedAt) : new Date();
      const filename = Number.isNaN(exportedAt.getTime()) ? createBackupFilename() : createBackupFilename(exportedAt);
      sendBackup(reply, payload, filename);
    } catch (error) {
      if (error?.code === 'ENOENT') {
        reply.code(404).send({ message: 'Nenhum backup automatico encontrado ainda.' });
        return;
      }
      throw error;
    }
  });

  app.post('/api/backups/import', async (request, reply) => {
    const auth = await requireMaster(request, reply);
    if (!auth) return;

    const payload = request.body?.backup || request.body?.payload || request.body;
    const confirm = request.body?.confirm === true;
    if (!payload || typeof payload !== 'object') {
      reply.code(400).send({ message: 'Arquivo de backup invalido.' });
      return;
    }

    const result = await restoreBackupPayload(payload, { confirm });
    reply.send(result);
  });
}
