import { Server } from 'socket.io';
import { getAuthSessionFromToken } from './auth.mjs';
import { getCombatState, scopeCombatStateForUser } from './combat.mjs';
import { isOriginAllowed } from './config.mjs';

function extractBearerToken(value) {
  const header = String(value || '');
  if (!header.toLowerCase().startsWith('bearer ')) return '';
  return header.slice(7).trim();
}

export function attachSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin(origin, callback) {
        callback(null, isOriginAllowed(origin));
      },
      credentials: false
    }
  });

  io.use(async (socket, next) => {
    try {
      const token = String(
        socket.handshake.auth?.token
        || extractBearerToken(socket.handshake.headers?.authorization)
        || ''
      ).trim();

      const session = await getAuthSessionFromToken(token);
      if (!session) {
        next(new Error('Unauthorized'));
        return;
      }

      socket.data.auth = session;
      next();
    } catch (error) {
      next(error);
    }
  });

  io.on('connection', (socket) => {
    socket.on('combat:request-sync', async () => {
      try {
        const scopedState = scopeCombatStateForUser(
          socket.data.auth.user,
          await getCombatState()
        );
        socket.emit('combat:state', { state: scopedState });
      } catch (error) {
        console.error(error);
      }
    });
  });

  return {
    io,
    broadcastCombatState(state, meta = {}) {
      io.sockets.sockets.forEach((socket) => {
        const scopedState = scopeCombatStateForUser(socket.data.auth.user, state);
        socket.emit('combat:state', {
          state: scopedState,
          meta,
          sentAt: new Date().toISOString()
        });
      });
    },
    broadcastMapState(map, meta = {}) {
      io.sockets.sockets.forEach((socket) => {
        socket.emit('tabletop:map', {
          map,
          meta,
          sentAt: new Date().toISOString()
        });
      });
    },
    broadcastMapDeleted(mapId, meta = {}) {
      io.emit('tabletop:map-deleted', {
        mapId,
        meta,
        sentAt: new Date().toISOString()
      });
    },
    broadcastSessionBoardState(board, meta = {}) {
      io.sockets.sockets.forEach((socket) => {
        socket.emit('tabletop:session-board', {
          board,
          meta,
          sentAt: new Date().toISOString()
        });
      });
    },
    broadcastSessionBoardDeleted(boardId, meta = {}) {
      io.emit('tabletop:session-board-deleted', {
        boardId,
        meta,
        sentAt: new Date().toISOString()
      });
    }
  };
}
