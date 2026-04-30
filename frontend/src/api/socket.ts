import { io, type Socket } from 'socket.io-client';
import { getRuntimeApiBaseUrl } from './runtime';
import { getAccessToken } from './client';
import type { CombatState } from './types';

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  if (socket) return socket;
  const baseUrl = getRuntimeApiBaseUrl();
  const token = getAccessToken();
  if (!baseUrl || !token) return null;

  socket = io(baseUrl, {
    transports: ['websocket', 'polling'],
    auth: { token }
  });

  return socket;
}

export function subscribeCombatState(handler: (state: CombatState) => void): () => void {
  const active = getSocket();
  if (!active) return () => {};

  const listener = (payload: { state?: CombatState }) => {
    if (payload?.state) handler(payload.state);
  };

  active.on('combat:state', listener);
  active.emit('combat:request-sync', {});

  return () => {
    active.off('combat:state', listener);
  };
}

export function disconnectSocket(): void {
  if (!socket) return;
  socket.disconnect();
  socket = null;
}
