import { requireAuth, requireMaster } from '../auth.mjs';
import {
  createSessionBoard,
  deleteSessionBoard,
  getLatestSessionBoard,
  getSessionBoardById,
  listSessionBoards,
  moveSessionTokenOnBoard,
  sanitizeSessionBoardForUser,
  updateSessionBoard
} from '../session-boards.mjs';

export default async function registerSessionBoardRoutes(app, { services } = {}) {
  app.get('/api/session-boards', async (request, reply) => {
    const auth = await requireMaster(request, reply);
    if (!auth) return;
    reply.send({ boards: await listSessionBoards() });
  });

  app.get('/api/session-boards/active', async (request, reply) => {
    const auth = await requireAuth(request, reply);
    if (!auth) return;
    const board = await getLatestSessionBoard();
    reply.send({ board: board ? sanitizeSessionBoardForUser(board, auth.user) : null });
  });

  app.put('/api/session-boards/active/tokens/:tokenId', async (request, reply) => {
    const auth = await requireAuth(request, reply);
    if (!auth) return;
    const board = await getLatestSessionBoard();
    if (!board) {
      reply.code(404).send({ message: 'Sessao ativa nao encontrada.' });
      return;
    }
    const moved = moveSessionTokenOnBoard(board, request.params.tokenId, request.body?.x, request.body?.y, auth.user);
    if (!moved.ok) {
      reply.code(moved.reason === 'permission' ? 403 : 404).send({ message: moved.reason === 'permission' ? 'Voce nao controla este token.' : 'Token nao encontrado.' });
      return;
    }
    const saved = await updateSessionBoard(board.id, moved.board);
    services?.broadcastSessionBoardState?.(saved, { reason: 'token-moved', userId: auth.user.id, tokenId: request.params.tokenId });
    reply.send({ board: sanitizeSessionBoardForUser(saved, auth.user), token: moved.token });
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
