import { requireMaster } from '../auth.mjs';
import {
  createSessionBoard,
  deleteSessionBoard,
  getSessionBoardById,
  listSessionBoards,
  updateSessionBoard
} from '../session-boards.mjs';

export default async function registerSessionBoardRoutes(app, { services } = {}) {
  app.get('/api/session-boards', async (request, reply) => {
    const auth = await requireMaster(request, reply);
    if (!auth) return;
    reply.send({ boards: await listSessionBoards() });
  });

  app.get('/api/session-boards/:id', async (request, reply) => {
    const auth = await requireMaster(request, reply);
    if (!auth) return;

    const board = await getSessionBoardById(request.params.id);
    if (!board) {
      reply.code(404).send({ message: 'Sessao nao encontrada.' });
      return;
    }

    reply.send({ board });
  });

  app.post('/api/session-boards', async (request, reply) => {
    const auth = await requireMaster(request, reply);
    if (!auth) return;
    const board = await createSessionBoard(request.body?.board || request.body);
    services?.broadcastSessionBoardState?.(board, { reason: 'session-board-created', userId: auth.user.id });
    reply.code(201).send({ board });
  });

  app.put('/api/session-boards/:id', async (request, reply) => {
    const auth = await requireMaster(request, reply);
    if (!auth) return;

    const board = await updateSessionBoard(request.params.id, request.body?.board || request.body);
    if (!board) {
      reply.code(404).send({ message: 'Sessao nao encontrada.' });
      return;
    }

    services?.broadcastSessionBoardState?.(board, { reason: 'session-board-updated', userId: auth.user.id });
    reply.send({ board });
  });

  app.delete('/api/session-boards/:id', async (request, reply) => {
    const auth = await requireMaster(request, reply);
    if (!auth) return;

    const deleted = await deleteSessionBoard(request.params.id);
    if (!deleted) {
      reply.code(404).send({ message: 'Sessao nao encontrada.' });
      return;
    }

    services?.broadcastSessionBoardDeleted?.(request.params.id, { reason: 'session-board-deleted', userId: auth.user.id });
    reply.send({ ok: true });
  });
}
