import type { Namespace } from 'socket.io';
import type { ErrorCode, RankingEntry } from '@chaos-arena/shared';
import type { RuntimeArenaView, RuntimeDisplayView, Reaction, ShowFact, ShowSettings } from '../../shared/runtime-chaos.js';
import type { ArenaView, LiveEvent, Reply } from '../../shared/live.js';
import { attachAutopilot, defaultAutopilot, type AutopilotOptions } from './autopilot.js';
import { GameEngine, type EngineChange } from './game.js';
import { GameError, realDeps, type EngineDeps } from './model.js';
import { demoQuestions } from './practiceQuestions.js';
import { validateQuiz } from './questions.js';
import { generatePin, normalizeNickname, safeEqual } from './rooms.js';
import { parseArenaSettings } from './arenaSettings.js';
import { buildRanking } from './scoring.js';

/**
 * Adaptador del protocolo /arena que usa el frontend sobre GameEngine.
 * El motor aplica las reglas (State, Strategy); este módulo observa sus cambios (Observer)
 * y traduce cada uno a vistas por rol: jugador, anfitrión y proyector.
 */

const RECONNECT_GRACE_MS = 30_000;
const RATE_LIMIT = { windowMs: 1000, max: 20 };

const MESSAGES: Partial<Record<ErrorCode, string>> = {
  NICKNAME_INVALID: 'Escribe un apodo de 1 a 20 caracteres.',
  NICKNAME_TAKEN: 'Ese apodo ya está en uso.',
  ROOM_LOCKED: 'La partida ya comenzó.',
  ROUND_CLOSED: 'Esta ronda ya no acepta esa respuesta.',
  ALREADY_ANSWERED: 'Esta ronda ya no acepta esa respuesta.',
  OPTION_INVALID: 'Esta ronda ya no acepta esa respuesta.',
  VOTE_CLOSED: 'Este voto ya no está disponible.',
  ALREADY_VOTED: 'Este voto ya no está disponible.',
  TARGET_INVALID: 'Este voto ya no está disponible.',
  NOT_ACTIVE: 'Este voto ya no está disponible.',
  WRONG_PHASE: 'Acción no disponible en esta fase.',
  NOT_ENOUGH_PLAYERS: 'Faltan jugadores para esta acción.',
  RATE_LIMITED: 'Demasiadas solicitudes. Espera un momento.',
};

export interface ArenaConfig {
  deps?: EngineDeps;
  autopilot?: AutopilotOptions;
  introMs?: number;
}

export function attachArena(arena: Namespace, config: ArenaConfig = {}) {
  const deps = config.deps ?? realDeps;
  /** token → socket.id de la conexión vigente. */
  const connections = new Map<string, string>();
  /** playerId → token, para avisar retiros. */
  const tokens = new Map<string, string>();
  let engine!: GameEngine;
  let previousPin = '';
  let detach = () => {};
  let settings = parseArenaSettings(undefined)!;
  const initialShow: ShowSettings = { output: 'host', sound: true, videos: true, reactions: true, volume: 75 };
  let show = { ...initialShow };
  let reaction: RuntimeDisplayView['reaction'];
  let showFact: ShowFact | undefined;
  let previousLeader: string | undefined;
  let cancelIntro: (() => void) | undefined;
  let lastEvent: LiveEvent | undefined;
  let lastScores = new Map<string, number>();

  function boot(pin = '') {
    detach();
    cancelIntro?.();
    cancelIntro = undefined;
    showFact = undefined;
    previousLeader = undefined;
    engine?.dispose();
    connections.clear();
    tokens.clear();
    lastEvent = undefined;
    reaction = undefined;
    lastScores.clear();
    settings = parseArenaSettings(undefined)!;
    show = { ...initialShow };
    engine = new GameEngine(pin, { title: 'Patrones de diseño', questions: demoQuestions }, { votingEnabled: true }, deps);
    engine.enableRuntimeChaos();
    const offView = engine.subscribe(onChange);
    const offPilot = attachAutopilot(engine, config.autopilot ?? defaultAutopilot, deps);
    detach = () => {
      offView();
      offPilot();
    };
  }

  function queueReaction(kind: Reaction) {
    reaction = { id: deps.newId(), kind, started: deps.now() };
  }

  function announce(kind: ShowFact['kind'], title: string, detail?: string) {
    showFact = { id: deps.newId(), started: deps.now(), kind, title, detail };
  }

  function onChange(change: EngineChange) {
    if (change.kind === 'round:open' && showFact?.kind === 'intro') showFact = undefined;
    if (change.kind === 'round:result') {
      const { counts, correctIndex, ranking } = change.result;
      const correct = counts[correctIndex];
      const complete = counts.reduce((sum, count) => sum + count, 0) === engine.players.size;
      const leaders = ranking.filter(player => player.rank === 1);
      const leaderChanged = leaders.length === 1 && previousLeader && previousLeader !== leaders[0].id;
      previousLeader = leaders.length === 1 ? leaders[0].id : undefined;
      const streak = [...engine.players.values()].filter(player => player.streak === 3 || player.streak === 5)
        .sort((a, b) => b.streak - a.streak)[0];
      const solution = engine.currentRound()?.question.options[correctIndex];
      if (engine.questionTimedOut) announce('timeout', '¡Tiempo agotado!', 'La ronda cerró con las respuestas registradas.');
      else if (complete && correct === 0) announce('none', '¡Nadie acertó!', solution);
      else if (complete && leaderChanged) announce('leader', '¡Nuevo líder!', `${leaders[0].nickname} · ${leaders[0].score} pts`);
      else if (complete && streak) announce('streak', `¡Racha ×${streak.streak}!`, streak.nickname);
      else if (complete) announce('correct', correct === engine.players.size ? '¡Todos acertaron!' : 'Respuesta correcta', solution);
    }
    if (change.kind === 'vote:open') announce('vote-open', '¡Asamblea de emergencia!', 'Votación secreta');
    if (change.kind === 'vote:result') {
      const expelled = change.result.expelledId;
      if (expelled) announce('expelled', 'Votación cerrada', `${nicknameOf(expelled)} pasa a modo fantasma.`);
      else announce('vote-closed', engine.voteWasCancelled ? 'Votación cancelada' : 'Votación cerrada', 'Nadie fue expulsado.');
    }
    if (change.kind === 'finished') announce('final', 'Podio de ChaosArena');
    if (change.kind === 'round:open' && reaction?.kind !== 'expulsion') reaction = undefined;
    if (change.kind === 'round:result' && change.result.counts.reduce((sum, count) => sum + count, 0) === engine.players.size) {
      const correct = change.result.counts[change.result.correctIndex];
      if (correct === 0) queueReaction('nadie-acierta');
      else if ([...engine.players.values()].some(p => p.streak === 5)) queueReaction('racha');
      else if (correct === engine.players.size) queueReaction('todos-aciertan');
    }
    if (change.kind === 'vote:result' && change.result.expelledId) queueReaction('expulsion');
    if (change.kind === 'finished') {
      reaction = undefined;
      if (buildRanking([...engine.players.values()]).filter(p => p.rank === 1).length > 1) queueReaction('empate');
    }
    if (change.kind === 'event:result') lastEvent = describeEvent(change.result.type, change.result.targets);
    if (change.kind === 'player:kicked') {
      const token = tokens.get(change.playerId);
      tokens.delete(change.playerId);
      const socketId = token && connections.get(token);
      if (token) connections.delete(token);
      if (socketId) arena.to(socketId).emit('removed');
    }
    if (change.kind === 'snapshot' || change.kind === 'round:progress') publish();
  }

  function nicknameOf(id: string) {
    return engine.players.get(id)?.nickname ?? '?';
  }

  function describeEvent(type: LiveEvent['type'], targets: string[]): LiveEvent {
    const names = targets.map(nicknameOf);
    const delta = (id: string) => (engine.players.get(id)?.score ?? 0) - (lastScores.get(id) ?? 0);
    const description = {
      'loot-box': `${names[0]} gana 150 puntos.`,
      'black-hole': `${names[0]} pierde ${-delta(targets[0])} puntos (20 % del saldo).`,
      hack: `${names.join(' y ')} intercambian sus puntos.`,
      'double-or-nothing': 'La próxima respuesta correcta vale el doble. Un error u omisión resta 50 puntos.',
    }[type];
    return { type, targets: names, description, started: Date.now() };
  }

  function hostId(): string | undefined {
    return engine.players.keys().next().value;
  }

  function arenaPhase(): ArenaView['phase'] {
    switch (engine.phase) {
      case 'results':
        return 'reveal';
      case 'event':
        return 'roulette';
      case 'voting':
        return engine.voteInfo() ? 'vote' : 'reveal';
      default:
        return engine.phase;
    }
  }

  function publish() {
    const all = [...engine.players.values()];
    lastScores = new Map(all.map((p) => [p.id, p.score]));
    const players: RankingEntry[] = buildRanking(all);
    const phase = arenaPhase();
    const round = engine.currentRound();
    const q = round?.question;
    const received = round ? all.filter((p) => engine.choiceOf(p.id) !== null).length : 0;
    const view: RuntimeDisplayView = {
      ...engine.runtimeView(),
      pausedMs: engine.questionPausedMs,
      reaction: reaction && deps.now() - reaction.started < 3000 ? reaction : undefined,
      phase,
      serverNow: Date.now(),
      pin: engine.pin,
      clips: settings.clips,
      players,
      number: Math.max(engine.questionIndex, 0) + 1,
      total: engine.publicSnapshot().questionCount,
      received,
      seconds: q?.seconds ?? 0,
    };
    if (round && q) view.round = { roundId: round.roundId, prompt: q.prompt, options: [...q.options], deadline: round.deadline };
    // Mismo criterio que la versión previa: la clave solo se muestra si todos respondieron.
    if (round?.settled && q && phase === 'reveal' && received === all.length) {
      view.solution = {
        index: q.correctIndex,
        explanation: q.explanation,
        counts: q.options.map((_, i) => all.filter((p) => engine.choiceOf(p.id) === i).length),
      };
    }
    if (phase === 'roulette') view.event = lastEvent;
    const vote = engine.voteInfo();
    if (vote) view.voting = { id: vote.voteId, deadline: vote.deadline, received: vote.received, candidates: [...vote.candidateIds] };
    arena.to('display').emit('display', { ...view, show, showFact });

    const host = hostId();
    for (const [token, socketId] of connections) {
      const player = engine.playerByToken(token);
      if (!player) continue;
      const personal: RuntimeArenaView = {
        ...view,
        you: player.id,
        host: player.id === host,
        choice: engine.choiceOf(player.id),
        correctCount: player.correctCount,
        voted: vote?.hasVoted(player.id),
        chaos: engine.chaosView(player.id),
      };
      if (personal.host) {
        personal.show = show;
        personal.showFact = showFact;
        personal.canSkipEvent = engine.canSkipEvent;
      }
      if (personal.host && phase === 'finished') personal.summary = all.map((p) => ({ id: p.id, correct: p.correctCount }));
      arena.to(socketId).emit('view', personal);
    }
  }

  function leave(token: string) {
    const player = engine.playerByToken(token);
    connections.delete(token);
    if (!player) return;
    tokens.delete(player.id);
    try {
      engine.leave(player.id);
    } catch (error) {
      if (!(error instanceof GameError)) throw error;
    }
    if (engine.players.size === 0) {
      boot();
      publish();
    }
  }

  boot();

  arena.on('connection', (socket) => {
    let session = '';
    const rate = { start: 0, count: 0 };

    socket.on('command', (kind: string, data: Record<string, unknown> | undefined, ack: (r: Reply) => void) => {
      if (typeof ack !== 'function') return;
      const fail = (error: string) => ack({ ok: false, error });
      const now = Date.now();
      if (now - rate.start > RATE_LIMIT.windowMs) Object.assign(rate, { start: now, count: 0 });
      if (++rate.count > RATE_LIMIT.max) return fail(MESSAGES.RATE_LIMITED!);
      try {
        handle(kind, data ?? {}, ack, fail);
      } catch (error) {
        if (error instanceof GameError) return fail(MESSAGES[error.code] ?? 'Acción no disponible.');
        console.error('Error no controlado en /arena', error);
        fail('Error inesperado del servidor.');
      }
    });

    function handle(kind: string, data: Record<string, unknown>, ack: (r: Reply) => void, fail: (e: string) => void) {
      if (kind === 'observe') {
        socket.join('display');
        ack({ ok: true });
        publish();
        return;
      }
      if (kind === 'create' || kind === 'join' || kind === 'resume') {
        if (session) return fail('Esta conexión ya tiene un jugador.');
        if (kind !== 'resume') {
          if (kind === 'create') {
            if (engine.pin) return fail('Ya hay una sala abierta.');
            const hostKey = process.env.HOST_KEY;
            if ((hostKey && !safeEqual(data.hostKey, hostKey)) || (!hostKey && process.env.NODE_ENV === 'production')) {
              return fail('La clave de anfitrión es incorrecta o el servidor aún no está configurado.');
            }
            if (!normalizeNickname(data.nickname)) return fail(MESSAGES.NICKNAME_INVALID!);
            let pin = generatePin();
            while (pin === previousPin) pin = generatePin();
            previousPin = pin;
            boot(pin);
          } else {
            if (cancelIntro) return fail('La partida ya está por comenzar.');
            if (!engine.pin) return fail('El anfitrión todavía no ha abierto la sala.');
            if (data.pin !== engine.pin) return fail('PIN de sala incorrecto.');
          }
          const player = engine.join(data.nickname);
          tokens.set(player.id, player.token);
          session = player.token;
        } else {
          if (!engine.playerByToken(data.token)) return fail('Tu sesión terminó. Vuelve a ingresar.');
          session = data.token as string;
        }
        connections.set(session, socket.id);
        ack({ ok: true, token: session });
        publish();
        return;
      }
      const player = engine.playerByToken(session);
      if (!player || connections.get(session) !== socket.id) return fail('Vuelve a conectarte a la sala.');
      const isHost = player.id === hostId();

      switch (kind) {
        case 'answer':
          if (engine.questionPausedMs !== undefined) return fail('La pregunta está en pausa.');
          engine.answer(player.id, String(data.roundId), data.choice);
          break;
        case 'usePower':
          if (!engine.usePower(player.id, data.power, data.target)) return fail('Ese poder no está disponible ahora.');
          break;
        case 'duelConsent':
          if (!engine.duelAction(player.id, 'consent', data.id, data.accepted)) return fail('Esta invitación ya no está disponible.');
          break;
        case 'duelAnswer':
          if (!engine.duelAction(player.id, 'answer', data.id, data.choice)) return fail('El duelo ya no acepta esa respuesta.');
          break;
        case 'vote':
          engine.vote(player.id, String(data.id), data.target);
          break;
        case 'hostRound': {
          if (!isHost) return fail('Solo el anfitrión puede controlar la partida.');
          const { action, id } = data;
          let applied = false;
          switch (action) {
            case 'pause': case 'resume': applied = engine.setQuestionPaused(id, action === 'pause'); break;
            case 'close': applied = engine.closeQuestion(id); break;
            case 'skipEvent': applied = engine.skipEvent(id); break;
            case 'skipRoulette': applied = engine.skipRoulette(id); break;
            case 'cancelVote': applied = engine.cancelVote(id); break;
          }
          if (!applied) return fail('La fase ya cambió o la acción no está disponible.');
          break;
        }
        case 'hostShow': {
          if (!isHost) return fail('Solo el anfitrión puede controlar el proyector.');
          const { key, value } = data;
          if (key === 'output' && (value === 'host' || value === 'display')) {
            show = { ...show, output: value };
          } else if (key === 'volume' && typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 100) {
            show = { ...show, volume: value };
          } else if ((key === 'sound' || key === 'videos' || key === 'reactions') && typeof value === 'boolean') {
            show = { ...show, [key]: value };
          } else return fail('El ajuste del proyector no es válido.');
          publish();
          break;
        }
        case 'start': {
          if (cancelIntro || !isHost || !['lobby', 'finished'].includes(engine.phase)) return fail('Solo el anfitrión puede iniciar desde la sala.');
          const validation = validateQuiz(data.quiz ?? { title: 'Patrones de diseño', questions: demoQuestions });
          if (!validation.ok) return fail(validation.error);
          const nextSettings = parseArenaSettings(data.settings);
          if (!nextSettings) return fail('Revisa la duración y los clips de la sala.');
          settings = nextSettings;
          if (engine.phase === 'finished') engine.restart();
          const quiz = settings.roundSeconds === null ? validation.quiz : {
            ...validation.quiz,
            questions: validation.quiz.questions.map(q => ({ ...q, seconds: settings.roundSeconds! })),
          };
          engine.configure(quiz, { votingEnabled: data.voting !== false });
          const introMs = config.introMs ?? 2500;
          if (introMs > 0 && show.videos) {
            announce('intro', '¡Que comience el caos!');
            cancelIntro = deps.setTimer(introMs, () => {
              cancelIntro = undefined;
              engine.command('start');
            });
            publish();
          } else engine.command('start');
          break;
        }
        case 'removePlayer': {
          if (cancelIntro || engine.phase !== 'lobby' || !isHost) return fail('Solo el anfitrión puede retirar jugadores durante la espera.');
          if (typeof data.id !== 'string' || data.id === player.id || !engine.players.has(data.id)) return fail('Selecciona a otro jugador.');
          engine.kick(data.id);
          break;
        }
        case 'closeRoom': {
          if (!isHost) return fail('Solo el anfitrión puede cerrar la sala.');
          const guests = [...connections.values()].filter(id => id !== socket.id);
          boot();
          session = '';
          for (const id of guests) arena.to(id).emit('removed', 'El anfitrión cerró la sala.');
          publish();
          break;
        }
        case 'leave':
          if (cancelIntro || !['lobby', 'finished'].includes(engine.phase)) return fail('Acción no disponible en esta fase.');
          leave(session);
          session = '';
          break;
        default:
          return fail('Acción no disponible en esta fase.');
      }
      ack({ ok: true });
    }

    socket.on('disconnect', () => {
      if (!session || connections.get(session) !== socket.id) return;
      connections.delete(session);
      const token = session;
      setTimeout(() => {
        if (connections.has(token) || !engine.playerByToken(token)) return;
        if (['lobby', 'finished'].includes(engine.phase)) leave(token);
        else if (connections.size === 0) {
          boot();
          publish();
        }
      }, RECONNECT_GRACE_MS).unref();
    });
  });
}
