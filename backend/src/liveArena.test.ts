import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { Server } from 'socket.io';
import { io as connect, type Socket } from 'socket.io-client';
import type { ArenaView, DisplayView, Reply } from '../../shared/live.js';
import type { RuntimeDisplayView, RuntimeArenaView } from '../../shared/runtime-chaos.js';
import { attachArena } from './liveArena.js';
import { question } from './testing.js';

/** Integración del protocolo /arena con sockets reales sobre GameEngine. */

let url = '';
const server = createServer();
const ioServer = new Server(server);
const clients: Socket[] = [];

before(async () => {
  attachArena(ioServer.of('/arena'), { autopilot: { revealMs: 30, rouletteMs: 30, eventChance: 0, voteAfter: [1] } });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  url = `http://localhost:${(server.address() as AddressInfo).port}/arena`;
});

after(() => {
  for (const c of clients) c.disconnect();
  ioServer.close();
});

interface Client {
  socket: Socket;
  view?: ArenaView;
  removed: boolean;
  cmd(kind: string, data?: object): Promise<Reply>;
}

function client(): Client {
  const socket = connect(url, { forceNew: true });
  clients.push(socket);
  const c: Client = {
    socket,
    removed: false,
    cmd: (kind, data = {}) => socket.timeout(2000).emitWithAck('command', kind, data),
  };
  socket.on('view', (v: ArenaView) => (c.view = v));
  socket.on('removed', () => (c.removed = true));
  return c;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function until(check: () => boolean, ms = 2000) {
  const end = Date.now() + ms;
  while (!check()) {
    if (Date.now() > end) throw new Error('Tiempo de espera agotado');
    await wait(10);
  }
}

test('arena: partida con asamblea, fantasma, final y reinicio', async () => {
  const display = client();
  let screen: RuntimeDisplayView | undefined;
  display.socket.on('display', (v: RuntimeDisplayView) => (screen = v));
  assert.ok((await display.cmd('observe')).ok);

  const [ana, beto, caro, dani] = [client(), client(), client(), client()];
  assert.equal((await ana.cmd('join', { pin: '482913', nickname: 'Ana' })).ok, false);
  assert.ok((await ana.cmd('create', { nickname: 'Ana', hostKey: process.env.HOST_KEY })).ok);
  await until(() => Boolean(ana.view?.pin));
  const pin = ana.view!.pin;
  assert.match(pin, /^\d{6}$/);
  assert.equal((await beto.cmd('create', { nickname: 'Beto', hostKey: process.env.HOST_KEY })).ok, false);
  assert.equal((await beto.cmd('join', { pin: pin === '000000' ? '000001' : '000000', nickname: 'Beto' })).ok, false);
  assert.ok((await beto.cmd('join', { pin, nickname: 'Beto' })).ok);
  const dup = await caro.cmd('join', { pin, nickname: 'ana' });
  assert.equal(!dup.ok && dup.error, 'Ese apodo ya está en uso.');
  assert.ok((await caro.cmd('join', { pin, nickname: 'Caro' })).ok);
  assert.ok((await dani.cmd('join', { pin, nickname: 'Dani' })).ok);

  await until(() => dani.view?.players.length === 4);
  assert.equal(ana.view?.host, true);
  assert.equal(beto.view?.host, false);

  // Retiro en lobby y no-anfitrión sin permisos.
  assert.equal((await beto.cmd('removePlayer', { id: dani.view!.you })).ok, false);
  assert.ok((await ana.cmd('removePlayer', { id: dani.view!.you })).ok);
  await until(() => dani.removed);

  assert.equal((await beto.cmd('start', {})).ok, false);
  const quiz = { title: 'Prueba', questions: [question({ id: 'a', seconds: 10 }), question({ id: 'b', seconds: 10 })] };
  assert.equal((await ana.cmd('start', { quiz, settings: { roundSeconds: 61, clips: {} } })).ok, false);
  assert.equal((await ana.cmd('start', { quiz, settings: { roundSeconds: 35, clips: {
    inicio: '../ajeno', votacion: 'votacion', ruleta: 'ruleta', podio: 'podio',
  } } })).ok, false);
  const clips = { inicio: null, votacion: 'votacion', ruleta: 'ruleta', podio: 'inicio' };
  assert.ok((await ana.cmd('start', { quiz, settings: { roundSeconds: 35, clips } })).ok);
  await until(() => ana.view?.phase === 'question' && screen?.phase === 'question');
  assert.equal(ana.view?.seconds, 35);
  assert.deepEqual((screen as DisplayView & { clips?: object })?.clips, clips);
  assert.equal(ana.view?.round && 'correctIndex' in ana.view.round, false);

  const roundId = ana.view!.round!.roundId;
  assert.equal((await beto.cmd('hostRound', { action: 'pause', id: roundId })).ok, false);
  assert.equal((await beto.cmd('hostShow', { key: 'sound', value: false })).ok, false);
  assert.equal((await ana.cmd('hostShow', { key: 'volume', value: 101 })).ok, false);
  assert.ok((await ana.cmd('hostShow', { key: 'volume', value: 25 })).ok);
  await until(() => screen?.show?.volume === 25);
  assert.equal((beto.view as RuntimeArenaView).show, undefined);
  assert.ok((await ana.cmd('hostRound', { action: 'pause', id: roundId })).ok);
  await until(() => screen?.pausedMs !== undefined);
  assert.equal((await beto.cmd('answer', { roundId, choice: 1 })).ok, false);
  assert.ok((await ana.cmd('hostRound', { action: 'resume', id: roundId })).ok);
  await until(() => screen?.pausedMs === undefined);
  for (const c of [ana, beto, caro]) assert.ok((await c.cmd('answer', { roundId, choice: 1 })).ok);
  assert.equal((await ana.cmd('answer', { roundId, choice: 1 })).ok, false);

  // Asamblea tras la pregunta 1.
  await until(() => ana.view?.phase === 'vote');
  const voting = ana.view!.voting!;
  const caroId = caro.view!.you;
  assert.ok((await ana.cmd('vote', { id: voting.id, target: caroId })).ok);
  assert.ok((await beto.cmd('vote', { id: voting.id, target: caroId })).ok);
  assert.ok((await caro.cmd('vote', { id: voting.id, target: null })).ok);

  await until(() => ana.view?.phase === 'question' && ana.view.number === 2);
  assert.equal(ana.view!.players.find((p) => p.id === caroId)?.status, 'ghost');
  assert.equal(JSON.stringify(screen).includes('target'), false);

  const r2 = ana.view!.round!.roundId;
  for (const c of [ana, beto, caro]) assert.ok((await c.cmd('answer', { roundId: r2, choice: 1 })).ok);
  await until(() => ana.view?.phase === 'finished');

  assert.equal(ana.view?.summary?.length, 3);
  assert.equal(beto.view?.summary, undefined);
  assert.equal(caro.view?.correctCount, 2);
  assert.equal(ana.view?.players.find((p) => p.id === caroId)?.score, 100);

  // Reanudar con token y reiniciar desde el final.
  const bad = await client().cmd('resume', { token: 'falso' });
  assert.equal(!bad.ok && bad.error, 'Tu sesión terminó. Vuelve a ingresar.');
  assert.ok((await ana.cmd('start', { quiz })).ok);
  await until(() => ana.view?.phase === 'question' && ana.view.players.every((p) => p.score === 0));

  assert.equal(ana.view?.seconds, 30);

  // Salir solo en lobby o al terminar.
  assert.equal((await beto.cmd('leave')).ok, false);
  assert.equal((await beto.cmd('closeRoom')).ok, false);
  assert.ok((await ana.cmd('closeRoom')).ok);
  await until(() => beto.removed && screen?.pin === '');
  assert.ok((await ana.cmd('create', { nickname: 'Ana', hostKey: process.env.HOST_KEY })).ok);
  await until(() => Boolean(screen?.pin));
  assert.notEqual(screen?.pin, pin);
  assert.equal((await client().cmd('join', { pin, nickname: 'Otro jugador' })).ok, false);
});
