import express from 'express';
import cors from 'cors';
import { createServer } from 'node:http';
import { Server, type Socket } from 'socket.io';
import type { ClientToServerEvents, GameCommand, ServerToClientEvents } from '@chaos-arena/shared';
import { GameEngine } from './game.js';
import { GameError } from './model.js';
import { attachSocketPublisher, channels } from './publisher.js';
import { validateQuiz } from './questions.js';
import { generatePin, newToken, safeEqual } from './rooms.js';

const port = Number(process.env.PORT || 3001);
const clientOrigin = (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map((o) => o.trim());
const hostKey = process.env.HOST_KEY || '';
const production = process.env.NODE_ENV === 'production';
if (!hostKey) {
  console.warn(production ? 'HOST_KEY vacío: room:create queda bloqueado' : 'HOST_KEY vacío: cualquier hostKey crea sala (solo desarrollo)');
}

const app = express();
app.use(cors({ origin: clientOrigin }));
app.get('/health', (_request, response) => {
  response.json({ status: 'ok', service: 'chaos-arena', phase: current?.engine.phase ?? null });
});

const httpServer = createServer(app);
export const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: clientOrigin },
  maxHttpBufferSize: 100_000,
});

/** Sala única en memoria. */
let current: { engine: GameEngine; hostToken: string; detach: () => void } | undefined;

const COMMANDS: readonly GameCommand[] = ['start', 'close', 'next', 'event', 'vote', 'finish'];
const RATE_LIMIT = { windowMs: 1000, max: 20 };

type ArenaSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
type AnyAck = (result: { ok: true; data: unknown } | { ok: false; error: string }) => void;

/** Ejecuta un handler con límite de frecuencia y errores estables. */
function guarded<T>(socket: ArenaSocket, ack: unknown, fn: () => T) {
  const reply: AnyAck = typeof ack === 'function' ? (ack as AnyAck) : () => {};
  const now = Date.now();
  const bucket = (socket.data.rate ??= { start: now, count: 0 });
  if (now - bucket.start > RATE_LIMIT.windowMs) Object.assign(bucket, { start: now, count: 0 });
  if (++bucket.count > RATE_LIMIT.max) return reply({ ok: false, error: 'RATE_LIMITED' });
  try {
    reply({ ok: true, data: fn() });
  } catch (error) {
    if (error instanceof GameError) return reply({ ok: false, error: error.code });
    console.error('Error no controlado', error);
    reply({ ok: false, error: 'BAD_REQUEST' });
  }
}

function requireRoom(pin?: unknown) {
  if (!current || (pin !== undefined && pin !== current.engine.pin)) throw new GameError('ROOM_NOT_FOUND');
  return current;
}

function requireHost(socket: ArenaSocket, token: unknown) {
  const room = requireRoom();
  if (!safeEqual(token, room.hostToken)) throw new GameError('UNAUTHORIZED');
  socket.join([channels.all(room.engine.pin), channels.host(room.engine.pin)]);
  return room;
}

function requirePlayer(socket: ArenaSocket, token: unknown) {
  const room = requireRoom();
  const player = room.engine.playerByToken(token);
  if (!player) throw new GameError('UNAUTHORIZED');
  socket.join([channels.all(room.engine.pin), channels.player(player.id)]);
  return { room, player };
}

io.on('connection', (socket) => {
  socket.on('room:create', (data, ack) =>
    guarded(socket, ack, () => {
      const keyOk = hostKey ? safeEqual(data?.hostKey, hostKey) : !production;
      if (!keyOk) throw new GameError('UNAUTHORIZED');
      const validation = validateQuiz(data?.quiz);
      if (!validation.ok) throw new GameError('QUIZ_INVALID');
      if (current) {
        current.detach();
        current.engine.dispose();
        io.in(channels.all(current.engine.pin)).socketsLeave(channels.all(current.engine.pin));
      }
      const engine = new GameEngine(generatePin(), validation.quiz, {
        votingEnabled: data?.options?.votingEnabled !== false,
      });
      current = { engine, hostToken: newToken(), detach: attachSocketPublisher(io, engine) };
      socket.join([channels.all(engine.pin), channels.host(engine.pin)]);
      socket.emit('room:snapshot', engine.publicSnapshot());
      return { pin: engine.pin, hostToken: current.hostToken };
    }),
  );

  socket.on('room:join', (data, ack) =>
    guarded(socket, ack, () => {
      const room = requireRoom(data?.pin);
      const player = room.engine.join(data?.nickname);
      socket.join([channels.all(room.engine.pin), channels.player(player.id)]);
      socket.emit('room:snapshot', room.engine.publicSnapshot());
      return { playerId: player.id, playerToken: player.token };
    }),
  );

  socket.on('room:watch', (data, ack) =>
    guarded(socket, ack, () => {
      const room = requireRoom(data?.pin);
      socket.join([channels.all(room.engine.pin), channels.display(room.engine.pin)]);
      return room.engine.publicSnapshot();
    }),
  );

  socket.on('host:kick', (data, ack) =>
    guarded(socket, ack, () => {
      requireHost(socket, data?.hostToken).engine.kick(String(data?.playerId));
    }),
  );

  socket.on('game:control', (data, ack) =>
    guarded(socket, ack, () => {
      const room = requireHost(socket, data?.hostToken);
      if (!COMMANDS.includes(data?.command)) throw new GameError('BAD_REQUEST');
      room.engine.command(data.command);
    }),
  );

  socket.on('answer:submit', (data, ack) =>
    guarded(socket, ack, () => {
      const { room, player } = requirePlayer(socket, data?.token);
      room.engine.answer(player.id, String(data?.roundId), data?.optionIndex);
    }),
  );

  socket.on('vote:submit', (data, ack) =>
    guarded(socket, ack, () => {
      const { room, player } = requirePlayer(socket, data?.token);
      room.engine.vote(player.id, String(data?.voteId), data?.target);
    }),
  );
});

httpServer.listen(port, '0.0.0.0', () => {
  console.log(`ChaosArena backend disponible en el puerto ${port}`);
});
