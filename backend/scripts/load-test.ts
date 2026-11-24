import { randomInt } from 'node:crypto';
import { setTimeout as sleep } from 'node:timers/promises';
import { io, type Socket } from 'socket.io-client';
import type { ArenaCommands, ArenaView, Reply } from '../../shared/live.js';

const ACK_TIMEOUT_MS = 5500;
const MATCH_TIMEOUT_MS = 120_000;
const MAX_ANSWER_DELAY_MS = 3000;

type Command = 'create' | 'join' | 'start' | 'answer' | 'vote' | 'leave';
type ArenaSocket = Socket<
  { view: (view: ArenaView) => void },
  { command: (kind: Command, data: ArenaCommands[Command], ack: (reply: Reply) => void) => void }
>;

interface Bot {
  nickname: string;
  socket: ArenaSocket;
  joined: boolean;
  view?: ArenaView;
  views: number;
  answeredRounds: Set<string>;
  votedAssemblies: Set<string>;
}

interface AckSamples {
  durations: number[];
  rejections: Map<string, number>;
  missing: number;
}

function parseArgs(args: string[]) {
  const count = Number(args[0] ?? '40');
  if (args.length > 2 || !Number.isSafeInteger(count) || count < 1) {
    throw new Error('Uso: npx tsx backend/scripts/load-test.ts [cantidad de bots] [URL del backend]');
  }
  const url = new URL('/arena', args[1] ?? 'http://localhost:3001');
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('La URL del backend debe usar HTTP o HTTPS.');
  }
  return { count, url: url.href };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function percentile(sorted: number[], p: number): number | null {
  return sorted[Math.ceil(sorted.length * p) - 1] ?? null;
}

function summarizeAck({ durations, rejections, missing }: AckSamples) {
  const sorted = [...durations].sort((a, b) => a - b);
  const rejected = [...rejections.values()].reduce((total, count) => total + count, 0);
  const ms = (value: number | null) => value === null ? null : Number(value.toFixed(2));
  return {
    enviados: sorted.length + missing,
    aceptados: sorted.length - rejected,
    rechazados: rejected,
    sinAck: missing,
    p50Ms: ms(percentile(sorted, 0.5)),
    p95Ms: ms(percentile(sorted, 0.95)),
    maxMs: ms(percentile(sorted, 1)),
    motivosDeRechazo: Object.fromEntries(rejections),
  };
}

function newSamples(): AckSamples {
  return { durations: [], rejections: new Map(), missing: 0 };
}

async function waitFor(check: () => boolean, timeoutMs: number, message: string) {
  const deadline = performance.now() + timeoutMs;
  while (!check()) {
    if (performance.now() >= deadline) throw new Error(message);
    await sleep(25);
  }
}

async function main() {
  const { count, url } = parseArgs(process.argv.slice(2));
  const startedAt = new Date().toISOString();
  const started = performance.now();
  const metrics = {
    create: newSamples(), join: newSamples(), start: newSamples(), answer: newSamples(), vote: newSamples(), leave: newSamples(),
  };
  const roundIds = new Set<string>();
  const voteIds = new Set<string>();
  const answerTimers = new Set<ReturnType<typeof setTimeout>>();
  const inFlight: Promise<Reply>[] = [];

  async function send<K extends Command>(bot: Bot, kind: K, data: ArenaCommands[K]): Promise<Reply> {
    const samples = metrics[kind];
    const sentAt = performance.now();
    let reply: Reply;
    try {
      reply = await bot.socket.timeout(ACK_TIMEOUT_MS).emitWithAck('command', kind, data);
    } catch (error) {
      samples.missing++;
      return { ok: false, error: `sin acuse de recibo (${errorMessage(error)})` };
    }
    samples.durations.push(performance.now() - sentAt);
    if (!reply.ok) samples.rejections.set(reply.error, (samples.rejections.get(reply.error) ?? 0) + 1);
    return reply;
  }

  function onView(bot: Bot, view: ArenaView) {
    if (bot.view?.phase === 'finished') return;
    bot.view = view;
    bot.views++;

    const { round, voting } = view;
    if (view.phase === 'question' && round && !bot.answeredRounds.has(round.roundId)) {
      roundIds.add(round.roundId);
      bot.answeredRounds.add(round.roundId);
      const timer = setTimeout(() => {
        answerTimers.delete(timer);
        inFlight.push(send(bot, 'answer', { roundId: round.roundId, choice: randomInt(round.options.length) }));
      }, view.host ? 0 : randomInt(MAX_ANSWER_DELAY_MS + 1));
      answerTimers.add(timer);
    }

    if (view.phase === 'vote' && voting) {
      voteIds.add(voting.id);
      if (!voting.candidates.includes(view.you) || bot.votedAssemblies.has(voting.id)) return;
      bot.votedAssemblies.add(voting.id);
      inFlight.push(send(bot, 'vote', { id: voting.id, target: null }));
    }
  }

  async function join(bot: Bot, pin: string) {
    await new Promise<void>((resolve, reject) => {
      bot.socket.once('connect', resolve);
      bot.socket.once('connect_error', (error) => reject(new Error(`${bot.nickname}: ${error.message}`)));
      bot.socket.connect();
    });
    const reply = await send(bot, 'join', { pin, nickname: bot.nickname });
    if (!reply.ok) throw new Error(`${bot.nickname} no pudo ingresar: ${reply.error}`);
    bot.joined = true;
  }

  const bots = Array.from({ length: count }, (_, index) => {
    const bot: Bot = {
      nickname: index === 0 ? 'Anfitrión' : `Bot ${index + 1}`,
      socket: io(url, { forceNew: true, autoConnect: false, reconnection: false, timeout: ACK_TIMEOUT_MS }),
      joined: false,
      views: 0,
      answeredRounds: new Set(),
      votedAssemblies: new Set(),
    };
    bot.socket.on('view', (view) => onView(bot, view));
    return bot;
  });

  let failure: string | undefined;
  try {
    const [host, ...players] = bots;
    const created = await send(host, 'create', { nickname: host.nickname, hostKey: process.env.HOST_KEY });
    if (!created.ok) throw new Error(created.error);
    await waitFor(() => Boolean(host.view), ACK_TIMEOUT_MS, 'El anfitrión no recibió la vista inicial.');
    if (!host.view?.host) throw new Error('El primer bot no recibió la vista de anfitrión.');
    const pin = host.view.pin;

    const joins = await Promise.allSettled(players.map(bot => join(bot, pin)));
    const failedJoin = joins.find((result) => result.status === 'rejected');
    if (failedJoin?.status === 'rejected') throw failedJoin.reason;

    const reply = await send(host, 'start', {});
    if (!reply.ok) throw new Error(`No se pudo iniciar la partida: ${reply.error}`);
    await waitFor(() => {
      const disconnected = bots.find((bot) => !bot.socket.connected && bot.view?.phase !== 'finished');
      if (disconnected) throw new Error(`${disconnected.nickname} se desconectó antes de finalizar.`);
      return bots.every((bot) => bot.view?.phase === 'finished');
    }, MATCH_TIMEOUT_MS, 'Se agotó la espera para que todos los bots llegaran a finished.');
  } catch (error) {
    failure = errorMessage(error);
    process.exitCode = 1;
  } finally {
    const elapsed = performance.now() - started;
    for (const timer of answerTimers) clearTimeout(timer);
    for (const bot of bots) bot.socket.off('view');
    await Promise.all(inFlight);

    const canLeave = bots.filter((bot) => bot.joined && bot.socket.connected
      && (!bot.view || bot.view.phase === 'lobby' || bot.view.phase === 'finished'));
    await Promise.all(canLeave.map((bot) => send(bot, 'leave', {})));
    for (const bot of bots) bot.socket.disconnect();

    const byBot = bots.map((bot) => ({
      bot: bot.nickname, vistas: bot.views, finished: bot.view?.phase === 'finished',
    }));
    const counts = byBot.map(({ vistas }) => vistas).sort((a, b) => a - b);
    console.log(JSON.stringify({
      fechaUtc: startedAt,
      url,
      bots: count,
      duracionMs: Math.round(elapsed),
      rondas: roundIds.size,
      asambleas: voteIds.size,
      finished: byBot.filter((bot) => bot.finished).length,
      vistas: {
        total: counts.reduce((total, views) => total + views, 0),
        min: counts[0],
        p50: percentile(counts, 0.5),
        max: counts.at(-1),
        porBot: byBot,
      },
      ack: Object.fromEntries(Object.entries(metrics).map(([kind, samples]) => [kind, summarizeAck(samples)])),
      ...(failure ? { error: failure } : {}),
    }, null, 2));
  }
}

void main().catch((error: unknown) => {
  console.error(errorMessage(error));
  process.exitCode = 1;
});
