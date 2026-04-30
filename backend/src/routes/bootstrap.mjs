import { requireAuth } from '../auth.mjs';
import { getCombatState, scopeCombatStateForUser } from '../combat.mjs';
import { getCharacterByOwnerUserId, listCharacters } from '../characters.mjs';
import { getMasterData } from '../master-data.mjs';

export default async function registerBootstrapRoutes(app) {
  app.get('/api/bootstrap', async (request, reply) => {
    const auth = await requireAuth(request, reply);
    if (!auth) return;

    let payloadCharacters = [];
    if (auth.user.role === 'master') {
      payloadCharacters = await listCharacters();
    } else {
      const ownCharacter = await getCharacterByOwnerUserId(auth.user.id);
      payloadCharacters = ownCharacter ? [ownCharacter] : [];
    }

    const combatState = scopeCombatStateForUser(auth.user, await getCombatState());

    const masterData = auth.user.role === 'master'
      ? {
          scenarios: (await getMasterData('scenarios')).data,
          enemyLibrary: (await getMasterData('enemy-library')).data,
          sessionLog: (await getMasterData('session-log')).data,
          libraries: (await getMasterData('libraries')).data,
          omnivitaCodes: (await getMasterData('omnivita-codes')).data
        }
      : {};

    reply.send({
      session: {
        expiresAt: auth.expiresAt,
        user: auth.user
      },
      characters: payloadCharacters.filter(Boolean),
      combatState,
      masterData
    });
  });
}
