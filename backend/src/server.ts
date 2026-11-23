import express from 'express';
import cors from 'cors';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@chaos-arena/shared';

const port = Number(process.env.PORT || 3001);
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const app = express();
app.use(cors({ origin: clientOrigin }));
app.get('/health', (_request, response) => {
  response.json({ status: 'ok', service: 'chaos-arena' });
});

const httpServer = createServer(app);
// Los handlers del juego se implementarán en backend según docs/PLAN-DANIEL.md.
export const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: clientOrigin },
  maxHttpBufferSize: 100_000,
});

httpServer.listen(port, '0.0.0.0', () => {
  console.log(`ChaosArena backend disponible en el puerto ${port}`);
});
