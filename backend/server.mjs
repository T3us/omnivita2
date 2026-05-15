import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config, isOriginAllowed } from './src/config.mjs';
import { pool } from './src/db.mjs';
import { attachSocketServer } from './src/socket.mjs';
import registerAuthRoutes from './src/routes/auth.mjs';
import registerBootstrapRoutes from './src/routes/bootstrap.mjs';
import registerCharacterRoutes from './src/routes/characters.mjs';
import registerCombatRoutes from './src/routes/combat.mjs';
import registerBackupRoutes from './src/routes/backups.mjs';
import registerMapRoutes from './src/routes/maps.mjs';
import registerMasterDataRoutes from './src/routes/master-data.mjs';
import registerOmnivitaRoutes from './src/routes/omnivita.mjs';
import registerSessionBoardRoutes from './src/routes/session-boards.mjs';

const app = Fastify({
  logger: true,
  bodyLimit: 200 * 1024 * 1024
});

const services = {
  broadcastCombatState() {},
  broadcastMapState() {},
  broadcastMapDeleted() {},
  broadcastSessionBoardState() {},
  broadcastSessionBoardDeleted() {}
};

await app.register(cors, {
  origin(origin, callback) {
    callback(null, isOriginAllowed(origin));
  }
});

app.get('/health', async () => {
  try {
    const result = await pool.query('SELECT now() AS now');
    return {
      ok: true,
      service: 'omnivita-backend',
      database: 'up',
      now: result.rows[0]?.now ? new Date(result.rows[0].now).toISOString() : new Date().toISOString()
    };
  } catch (error) {
    return {
      ok: false,
      service: 'omnivita-backend',
      database: 'down',
      code: error?.code || 'DB_UNAVAILABLE',
      message: 'Banco de dados indisponivel no momento.'
    };
  }
});

app.setErrorHandler((error, request, reply) => {
  const code = String(error?.code || error?.cause?.code || '').trim();
  if (['ECONNRESET', 'ECONNREFUSED', '57P01', '57P02', '57P03'].includes(code)) {
    reply.code(503).send({
      message: 'Banco de dados indisponivel no momento. Tente novamente em instantes.',
      code
    });
    return;
  }

  reply.code(error.statusCode || 500).send({
    message: error?.message || 'Erro interno do servidor.',
    code: code || 'INTERNAL_SERVER_ERROR'
  });
});

await registerAuthRoutes(app, { services });
await registerBootstrapRoutes(app, { services });
await registerBackupRoutes(app, { services });
await registerCharacterRoutes(app, { services });
await registerCombatRoutes(app, { services });
await registerMapRoutes(app, { services });
await registerMasterDataRoutes(app, { services });
await registerOmnivitaRoutes(app, { services });
await registerSessionBoardRoutes(app, { services });

const sockets = attachSocketServer(app.server);
services.broadcastCombatState = sockets.broadcastCombatState;
services.broadcastMapState = sockets.broadcastMapState;
services.broadcastMapDeleted = sockets.broadcastMapDeleted;
services.broadcastSessionBoardState = sockets.broadcastSessionBoardState;
services.broadcastSessionBoardDeleted = sockets.broadcastSessionBoardDeleted;

try {
  await app.listen({
    port: config.port,
    host: config.host
  });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
