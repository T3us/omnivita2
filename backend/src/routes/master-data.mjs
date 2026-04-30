import { requireMaster } from '../auth.mjs';
import { getMasterData, saveMasterData } from '../master-data.mjs';

export default async function registerMasterDataRoutes(app) {
  app.get('/api/master-data/:key', async (request, reply) => {
    const auth = await requireMaster(request, reply);
    if (!auth) return;

    reply.send(await getMasterData(request.params.key));
  });

  app.put('/api/master-data/:key', async (request, reply) => {
    const auth = await requireMaster(request, reply);
    if (!auth) return;

    const data = request.body?.data;
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      reply.code(400).send({ message: 'Payload de dados do mestre invalido.' });
      return;
    }

    reply.send(await saveMasterData(request.params.key, data));
  });
}

