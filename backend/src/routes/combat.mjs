import { requireAuth, requireMaster } from '../auth.mjs';
import { applyCombatControlToState, getCombatState, saveCombatState, scopeCombatStateForUser } from '../combat.mjs';
import { withTransaction } from '../db.mjs';
import { getCharacterByOwnerUserId } from '../characters.mjs';

function buildCombatControlPayload(control) {
  const safe = control && typeof control === 'object' ? control : {};
  return {
    requestId: String(safe.requestId || `req-${Date.now()}`),
    updatedAt: new Date().toISOString(),
    self: safe.self && typeof safe.self === 'object' ? safe.self : null,
    companions: Array.isArray(safe.companions) ? safe.companions : []
  };
}

export default async function registerCombatRoutes(app, { services }) {
  app.get('/api/combat', async (request, reply) => {
    const auth = await requireAuth(request, reply);
    if (!auth) return;

    reply.send({
      state: scopeCombatStateForUser(auth.user, await getCombatState())
    });
  });

  app.put('/api/combat', async (request, reply) => {
    const auth = await requireMaster(request, reply);
    if (!auth) return;

    const savedState = await saveCombatState(request.body?.state || {});
    services.broadcastCombatState(savedState, request.body?.meta || {});

    reply.send({ state: savedState });
  });

  app.post('/api/combat/control', async (request, reply) => {
    const auth = await requireAuth(request, reply);
    if (!auth) return;

    if (auth.user.role !== 'player') {
      reply.code(403).send({ message: 'Somente players usam este controle.' });
      return;
    }

    const control = buildCombatControlPayload(request.body?.control || {});
    const transactionResult = await withTransaction(async (client) => {
      const character = await getCharacterByOwnerUserId(auth.user.id, client);
      if (!character) {
        const error = new Error('Ficha nao encontrada para este player.');
        error.statusCode = 404;
        throw error;
      }

      const currentState = await getCombatState(client);
      const nextState = applyCombatControlToState(currentState, character, control);
      const savedState = await saveCombatState(nextState, client);
      return { savedState, character };
    }).catch((error) => {
      if (error?.statusCode) {
        reply.code(error.statusCode).send({ message: error.message });
        return null;
      }
      throw error;
    });

    if (!transactionResult) return;

    const { savedState } = transactionResult;
    if (!savedState) return;

    services.broadcastCombatState(savedState, {
      reason: 'player-control',
      characterId: auth.user.characterId || '',
      updatedAt: control.updatedAt || new Date().toISOString()
    });

    reply.send({
      state: scopeCombatStateForUser(auth.user, savedState)
    });
  });
}
