import { requireAuth, requireMaster } from '../auth.mjs';
import {
  getCharacterById,
  getCharacterByOwnerUserId,
  getCharacterRowById,
  listCharacters,
  saveCharacter
} from '../characters.mjs';

function canAccessCharacter(auth, row) {
  if (!row) return false;
  if (auth.user.role === 'master') return true;
  return String(row.owner_user_id || '') === String(auth.user.id || '');
}

export default async function registerCharacterRoutes(app) {
  app.get('/api/characters/me', async (request, reply) => {
    const auth = await requireAuth(request, reply);
    if (!auth) return;

    const character = await getCharacterByOwnerUserId(auth.user.id);
    if (!character) {
      reply.code(404).send({ message: 'Nenhuma ficha vinculada a esta conta.' });
      return;
    }

    reply.send(character);
  });

  app.get('/api/characters', async (request, reply) => {
    const auth = await requireMaster(request, reply);
    if (!auth) return;
    reply.send(await listCharacters());
  });

  app.get('/api/characters/:id', async (request, reply) => {
    const auth = await requireAuth(request, reply);
    if (!auth) return;

    const row = await getCharacterRowById(request.params.id);
    if (!row) {
      reply.code(404).send({ message: 'Ficha nao encontrada.' });
      return;
    }

    if (!canAccessCharacter(auth, row)) {
      reply.code(403).send({ message: 'Voce nao pode acessar essa ficha.' });
      return;
    }

    reply.send(await getCharacterById(request.params.id));
  });

  app.put('/api/characters/:id', async (request, reply) => {
    const auth = await requireAuth(request, reply);
    if (!auth) return;

    const characterId = String(request.params.id || '');
    const incomingCharacter = request.body?.character;
    const existingRow = await getCharacterRowById(characterId);

    if (!existingRow) {
      reply.code(404).send({ message: 'Ficha nao encontrada.' });
      return;
    }

    if (!canAccessCharacter(auth, existingRow)) {
      reply.code(403).send({ message: 'Voce nao pode editar essa ficha.' });
      return;
    }

    const saved = await saveCharacter(existingRow, {
      ...(incomingCharacter || {}),
      id: characterId,
      ownerUserId: existingRow.owner_user_id || ''
    });

    reply.send(saved);
  });
}
