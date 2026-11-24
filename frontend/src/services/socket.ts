import { io, type Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@chaos-arena/shared';

// Conectar desde el flujo que elija el rol y gestionar su ciclo de vida allí.
export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001',
  { autoConnect: false },
);
