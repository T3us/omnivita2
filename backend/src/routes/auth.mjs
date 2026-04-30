import { deleteSessionByToken, requireAuth, validateLogin, createSessionForUser } from '../auth.mjs';
import { serializeUser } from '../serializers.mjs';

function extractBearerToken(value) {
  const header = String(value || '');
  if (!header.toLowerCase().startsWith('bearer ')) return '';
  return header.slice(7).trim();
}

export default async function registerAuthRoutes(app) {
  app.post('/api/auth/login', async (request, reply) => {
    const identifier = String(request.body?.identifier || '').trim();
    const password = String(request.body?.password || '');

    if (!identifier || !password) {
      reply.code(400).send({ message: 'Informe usuario/email e senha.' });
      return;
    }

    const user = await validateLogin(identifier, password);
    if (!user) {
      reply.code(401).send({ message: 'Usuario ou senha invalidos.' });
      return;
    }

    const session = await createSessionForUser(user.id);
    reply.send({
      token: session.token,
      expiresAt: session.expiresAt,
      user: serializeUser(user)
    });
  });

  app.get('/api/auth/session', async (request, reply) => {
    const auth = await requireAuth(request, reply);
    if (!auth) return;

    reply.send({
      expiresAt: auth.expiresAt,
      user: auth.user
    });
  });

  app.post('/api/auth/logout', async (request, reply) => {
    const token = extractBearerToken(request.headers.authorization);
    if (token) {
      try {
        await deleteSessionByToken(token);
      } catch (error) {
        console.error(error);
      }
    }

    reply.send({ ok: true });
  });
}
