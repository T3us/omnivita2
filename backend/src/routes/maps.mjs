import { requireMaster } from '../auth.mjs';
import { createMap, deleteMap, getMapById, listMaps, updateMap } from '../maps.mjs';

export default async function registerMapRoutes(app, { services } = {}) {
  app.get('/api/maps', async (request, reply) => {
    const auth = await requireMaster(request, reply);
    if (!auth) return;
    reply.send({ maps: await listMaps() });
  });

  app.get('/api/maps/:id', async (request, reply) => {
    const auth = await requireMaster(request, reply);
    if (!auth) return;

    const map = await getMapById(request.params.id);
    if (!map) {
      reply.code(404).send({ message: 'Mapa nao encontrado.' });
      return;
    }

    reply.send({ map });
  });

  app.post('/api/maps', async (request, reply) => {
    const auth = await requireMaster(request, reply);
    if (!auth) return;
    const map = await createMap(request.body?.map || request.body);
    services?.broadcastMapState?.(map, { reason: 'map-created', userId: auth.user.id });
    reply.code(201).send({ map });
  });

  app.put('/api/maps/:id', async (request, reply) => {
    const auth = await requireMaster(request, reply);
    if (!auth) return;

    const map = await updateMap(request.params.id, request.body?.map || request.body);
    if (!map) {
      reply.code(404).send({ message: 'Mapa nao encontrado.' });
      return;
    }

    services?.broadcastMapState?.(map, { reason: 'map-updated', userId: auth.user.id });
    reply.send({ map });
  });

  app.delete('/api/maps/:id', async (request, reply) => {
    const auth = await requireMaster(request, reply);
    if (!auth) return;

    const deleted = await deleteMap(request.params.id);
    if (!deleted) {
      reply.code(404).send({ message: 'Mapa nao encontrado.' });
      return;
    }

    services?.broadcastMapDeleted?.(request.params.id, { reason: 'map-deleted', userId: auth.user.id });
    reply.send({ ok: true });
  });
}
