import type {
  FinishedView,
  GameCommand,
  Phase,
  PlayerPrivateView,
  PublicPlayer,
  PublicSnapshot,
  Quiz,
  RoomOptions,
  RoundProgress,
  ServerToClientEvents,
} from '@chaos-arena/shared';
import { pickEffect, type EventContext } from './events.js';
import { GameError, realDeps, type EngineDeps, type PlayerRoundOutcome, type PlayerState, type RoundModifier, type RoundState } from './model.js';
import { toPublicRound } from './questions.js';
import { MAX_PLAYERS, newToken, nicknameKey, normalizeNickname } from './rooms.js';
import { buildRanking, countAnswers, personalResult, scoreRound } from './scoring.js';
import { MIN_ACTIVE_TO_VOTE, VOTE_SECONDS, VoteSession } from './voting.js';

type Payload<K extends keyof ServerToClientEvents> = Parameters<ServerToClientEvents[K]>[0];

/** Cambios que publica el motor. Patrón Observer: el motor no conoce Socket.IO. */
export type EngineChange =
  | { kind: 'snapshot' }
  | { kind: 'round:open'; round: Payload<'round:open'> }
  | { kind: 'round:progress'; progress: RoundProgress }
  | { kind: 'round:result'; result: Payload<'round:result'> }
  | { kind: 'event:result'; result: Payload<'event:result'> }
  | { kind: 'vote:open'; vote: Payload<'vote:open'> }
  | { kind: 'vote:result'; result: Payload<'vote:result'> }
  | { kind: 'player:kicked'; playerId: string }
  | { kind: 'finished' };

export type EngineListener = (change: EngineChange) => void;

/**
 * Patrón State: cada fase decide qué acciones acepta y delega la transición al motor.
 * Por defecto toda acción se rechaza con WRONG_PHASE.
 */
abstract class PhaseState {
  abstract readonly phase: Phase;
  command(_engine: GameEngine, _command: GameCommand): void {
    throw new GameError('WRONG_PHASE');
  }
  join(_engine: GameEngine, _nickname: unknown): PlayerState {
    throw new GameError('ROOM_LOCKED');
  }
  kick(_engine: GameEngine, _playerId: string): void {
    throw new GameError('WRONG_PHASE');
  }
  answer(_engine: GameEngine, _player: PlayerState, _roundId: string, _optionIndex: unknown): void {
    throw new GameError('ROUND_CLOSED');
  }
  vote(_engine: GameEngine, _player: PlayerState, _voteId: string, _target: unknown): void {
    throw new GameError('VOTE_CLOSED');
  }
  onTimeout(_engine: GameEngine): void {}
}

class LobbyState extends PhaseState {
  readonly phase = 'lobby' as const;
  override join(engine: GameEngine, nickname: unknown) {
    return engine.addPlayer(nickname);
  }
  override kick(engine: GameEngine, playerId: string) {
    engine.removePlayer(playerId);
  }
  override command(engine: GameEngine, command: GameCommand) {
    if (command !== 'start') throw new GameError('WRONG_PHASE');
    if (engine.players.size === 0) throw new GameError('NOT_ENOUGH_PLAYERS');
    engine.openRound(0);
  }
}

class QuestionState extends PhaseState {
  readonly phase = 'question' as const;
  override answer(engine: GameEngine, player: PlayerState, roundId: string, optionIndex: unknown) {
    engine.recordAnswer(player, roundId, optionIndex);
  }
  override command(engine: GameEngine, command: GameCommand) {
    if (command === 'close') return engine.settleRound();
    if (command === 'finish') {
      engine.settleRound();
      return engine.finish();
    }
    throw new GameError('WRONG_PHASE');
  }
  override onTimeout(engine: GameEngine) {
    engine.settleRound();
  }
}

/** Entre rondas: resultados, evento aplicado o votación cerrada. */
class InterludeState extends PhaseState {
  constructor(readonly phase: 'results' | 'event' | 'voting') {
    super();
  }
  override command(engine: GameEngine, command: GameCommand) {
    switch (command) {
      case 'next':
        return engine.hasNextQuestion() ? engine.openRound(engine.questionIndex + 1) : engine.finish();
      case 'event':
        return engine.runEvent();
      case 'vote':
        return engine.openVote();
      case 'finish':
        return engine.finish();
      default:
        throw new GameError('WRONG_PHASE');
    }
  }
}

class VotingState extends PhaseState {
  readonly phase = 'voting' as const;
  override vote(engine: GameEngine, player: PlayerState, voteId: string, target: unknown) {
    engine.recordVote(player, voteId, target);
  }
  override command(engine: GameEngine, command: GameCommand) {
    if (command !== 'close') throw new GameError('WRONG_PHASE');
    engine.settleVote();
  }
  override onTimeout(engine: GameEngine) {
    engine.settleVote();
  }
}

class FinishedState extends PhaseState {
  readonly phase = 'finished' as const;
}

export class GameEngine {
  private state: PhaseState = new LobbyState();
  private readonly listeners = new Set<EngineListener>();
  readonly players = new Map<string, PlayerState>();
  questionIndex = -1;
  private round?: RoundState;
  private voteSession?: VoteSession;
  private pendingModifier?: RoundModifier;
  private interlude = { eventUsed: false, voteUsed: false };
  private closedRounds = 0;
  private readonly lastOutcomes = new Map<string, PlayerRoundOutcome & { roundId: string }>();
  private cancelTimer?: () => void;

  constructor(
    readonly pin: string,
    private readonly quiz: Quiz,
    readonly options: RoomOptions,
    private readonly deps: EngineDeps = realDeps,
  ) {}

  get phase(): Phase {
    return this.state.phase;
  }

  // ---------- Observer ----------

  subscribe(listener: EngineListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(change: EngineChange) {
    for (const listener of this.listeners) {
      try {
        listener(change);
      } catch (error) {
        console.error('Observador falló', change.kind, error);
      }
    }
  }

  // ---------- Acciones externas, delegadas al estado ----------

  command(command: GameCommand) {
    this.state.command(this, command);
  }
  join(nickname: unknown): PlayerState {
    return this.state.join(this, nickname);
  }
  kick(playerId: string) {
    this.state.kick(this, playerId);
  }
  answer(playerId: string, roundId: string, optionIndex: unknown) {
    this.state.answer(this, this.requirePlayer(playerId), roundId, optionIndex);
  }
  vote(playerId: string, voteId: string, target: unknown) {
    this.state.vote(this, this.requirePlayer(playerId), voteId, target);
  }

  playerByToken(token: unknown): PlayerState | undefined {
    if (typeof token !== 'string') return undefined;
    for (const player of this.players.values()) if (player.token === token) return player;
    return undefined;
  }

  dispose() {
    this.cancelTimer?.();
    this.listeners.clear();
  }

  // ---------- Transiciones, usadas solo por los estados ----------

  addPlayer(rawNickname: unknown): PlayerState {
    const nickname = normalizeNickname(rawNickname);
    if (!nickname) throw new GameError('NICKNAME_INVALID');
    const key = nicknameKey(nickname);
    for (const p of this.players.values()) if (nicknameKey(p.nickname) === key) throw new GameError('NICKNAME_TAKEN');
    if (this.players.size >= MAX_PLAYERS) throw new GameError('ROOM_LOCKED');
    const player: PlayerState = {
      id: this.deps.newId(),
      token: newToken(),
      nickname,
      status: 'active',
      score: 0,
      correctCount: 0,
      streak: 0,
      joinedAt: this.deps.now(),
    };
    this.players.set(player.id, player);
    this.notify({ kind: 'snapshot' });
    return player;
  }

  removePlayer(playerId: string) {
    if (!this.players.delete(playerId)) throw new GameError('BAD_REQUEST');
    this.notify({ kind: 'player:kicked', playerId });
    this.notify({ kind: 'snapshot' });
  }

  openRound(index: number) {
    const question = this.quiz.questions[index];
    const now = this.deps.now();
    const ms = question.seconds * 1000;
    this.round = {
      roundId: this.deps.newId(),
      questionIndex: index,
      question,
      openedAt: now,
      deadline: now + ms,
      submissions: new Map(),
      modifier: this.pendingModifier,
      settled: false,
    };
    this.pendingModifier = undefined;
    this.interlude = { eventUsed: false, voteUsed: false };
    this.questionIndex = index;
    this.state = new QuestionState();
    this.schedule(ms);
    this.notify({ kind: 'round:open', round: toPublicRound(question, this.round.roundId, this.round.deadline) });
    this.notify({ kind: 'snapshot' });
  }

  recordAnswer(player: PlayerState, roundId: string, optionIndex: unknown) {
    const round = this.round;
    const now = this.deps.now();
    if (!round || round.settled || round.roundId !== roundId || now > round.deadline) throw new GameError('ROUND_CLOSED');
    if (round.submissions.has(player.id)) throw new GameError('ALREADY_ANSWERED');
    if (!Number.isInteger(optionIndex) || (optionIndex as number) < 0 || (optionIndex as number) >= round.question.options.length) {
      throw new GameError('OPTION_INVALID');
    }
    round.submissions.set(player.id, { playerId: player.id, optionIndex: optionIndex as number, receivedAt: now });
    this.notify({ kind: 'round:progress', progress: this.roundProgress()! });
    if (round.submissions.size >= this.players.size) this.settleRound();
  }

  /** Idempotente: cierre manual y temporizador simultáneos liquidan una sola vez. */
  settleRound() {
    const round = this.round;
    if (!round || round.settled) return;
    round.settled = true;
    this.clearTimer();
    const players = [...this.players.values()];
    const submissions = [...round.submissions.values()];
    const outcomes = scoreRound({ question: round.question, players, submissions, modifier: round.modifier });
    for (const outcome of outcomes) {
      const player = this.players.get(outcome.playerId);
      if (!player) continue;
      player.score = Math.max(0, player.score + outcome.pointsDelta);
      if (outcome.correct) player.correctCount++;
      player.streak = outcome.newStreak;
      this.lastOutcomes.set(player.id, { ...outcome, roundId: round.roundId });
    }
    this.closedRounds++;
    this.state = new InterludeState('results');
    this.notify({
      kind: 'round:result',
      result: {
        roundId: round.roundId,
        correctIndex: round.question.correctIndex,
        explanation: round.question.explanation,
        counts: countAnswers(round.question, submissions),
        ranking: buildRanking(players),
      },
    });
    this.notify({ kind: 'snapshot' });
  }

  runEvent() {
    if (this.interlude.eventUsed) throw new GameError('WRONG_PHASE');
    const ctx: EventContext = {
      activePlayers: this.activePlayers(),
      rng: this.deps.rng,
      hasPendingModifier: Boolean(this.pendingModifier),
      hasNextQuestion: this.hasNextQuestion(),
      setNextRoundModifier: (modifier) => {
        this.pendingModifier = modifier;
      },
    };
    const effect = pickEffect(ctx);
    if (!effect) throw new GameError('NOT_ENOUGH_PLAYERS');
    const outcome = effect.apply(ctx);
    for (const p of this.players.values()) p.score = Math.max(0, p.score);
    this.interlude.eventUsed = true;
    this.state = new InterludeState('event');
    this.notify({
      kind: 'event:result',
      result: { eventId: this.deps.newId(), type: outcome.type, targets: outcome.targets, players: this.publicPlayers() },
    });
    this.notify({ kind: 'snapshot' });
  }

  openVote() {
    if (!this.options.votingEnabled || this.interlude.voteUsed) throw new GameError('WRONG_PHASE');
    const active = this.activePlayers();
    if (active.length < MIN_ACTIVE_TO_VOTE) throw new GameError('NOT_ENOUGH_PLAYERS');
    const ms = VOTE_SECONDS * 1000;
    this.voteSession = new VoteSession(this.deps.newId(), active.map((p) => p.id), this.deps.now() + ms);
    this.state = new VotingState();
    this.schedule(ms);
    this.notify({
      kind: 'vote:open',
      vote: { voteId: this.voteSession.voteId, candidates: active.map(toPublicPlayer), deadline: this.voteSession.deadline },
    });
    this.notify({ kind: 'snapshot' });
  }

  recordVote(player: PlayerState, voteId: string, target: unknown) {
    const session = this.voteSession;
    if (!session || session.voteId !== voteId) throw new GameError('VOTE_CLOSED');
    if (target !== null && typeof target !== 'string') throw new GameError('TARGET_INVALID');
    const error = session.cast(player.id, target, this.deps.now());
    if (error) throw new GameError(error);
    if (session.voteCount >= session.candidateIds.length) this.settleVote();
  }

  /** Idempotente. */
  settleVote() {
    const session = this.voteSession;
    if (!session) return;
    this.voteSession = undefined;
    this.clearTimer();
    const tally = session.close();
    if (tally.expelledId && this.activePlayers().length > 2) {
      const expelled = this.players.get(tally.expelledId);
      if (expelled) {
        expelled.status = 'ghost';
        expelled.streak = 0;
      }
    }
    this.interlude.voteUsed = true;
    this.state = new InterludeState('voting');
    this.notify({
      kind: 'vote:result',
      result: { voteId: session.voteId, expelledId: tally.expelledId, validVotes: tally.validVotes, players: this.publicPlayers() },
    });
    this.notify({ kind: 'snapshot' });
  }

  finish() {
    this.clearTimer();
    this.state = new FinishedState();
    this.notify({ kind: 'finished' });
    this.notify({ kind: 'snapshot' });
  }

  hasNextQuestion(): boolean {
    return this.questionIndex + 1 < this.quiz.questions.length;
  }

  // ---------- Vistas por rol ----------

  publicSnapshot(): PublicSnapshot {
    const round = this.round;
    return {
      pin: this.pin,
      phase: this.phase,
      players: this.publicPlayers(),
      questionIndex: this.questionIndex,
      questionCount: this.quiz.questions.length,
      round: this.phase === 'question' && round ? toPublicRound(round.question, round.roundId, round.deadline) : undefined,
    };
  }

  privateView(playerId: string): PlayerPrivateView | undefined {
    const player = this.players.get(playerId);
    if (!player) return undefined;
    const last = this.lastOutcomes.get(playerId);
    const open = this.round && !this.round.settled ? this.round : undefined;
    return {
      playerId: player.id,
      nickname: player.nickname,
      status: player.status,
      score: player.score,
      streak: player.streak,
      answeredRoundId: open?.submissions.has(playerId) ? open.roundId : undefined,
      lastRound: last ? { roundId: last.roundId, correct: last.correct, pointsDelta: last.pointsDelta } : undefined,
    };
  }

  roundProgress(): RoundProgress | undefined {
    if (!this.round) return undefined;
    return { roundId: this.round.roundId, answered: this.round.submissions.size, expected: this.players.size };
  }

  finishedView(role: 'display'): FinishedView;
  finishedView(role: 'host'): FinishedView;
  finishedView(role: 'player', playerId: string): FinishedView | undefined;
  finishedView(role: 'display' | 'host' | 'player', playerId?: string): FinishedView | undefined {
    const players = [...this.players.values()];
    const podium = buildRanking(players).slice(0, 3);
    if (role === 'display') return { role, podium };
    if (role === 'host') return { role, podium, results: players.map((p) => personalResult(p, this.closedRounds)) };
    const player = playerId ? this.players.get(playerId) : undefined;
    return player ? { role, podium, personal: personalResult(player, this.closedRounds) } : undefined;
  }

  // ---------- Internos ----------

  private requirePlayer(playerId: string): PlayerState {
    const player = this.players.get(playerId);
    if (!player) throw new GameError('UNAUTHORIZED');
    return player;
  }

  private activePlayers(): PlayerState[] {
    return [...this.players.values()].filter((p) => p.status === 'active');
  }

  private publicPlayers(): PublicPlayer[] {
    return [...this.players.values()].sort((a, b) => a.joinedAt - b.joinedAt).map(toPublicPlayer);
  }

  private schedule(ms: number) {
    this.clearTimer();
    const expected = this.state;
    this.cancelTimer = this.deps.setTimer(ms, () => {
      if (this.state === expected) this.state.onTimeout(this);
    });
  }

  private clearTimer() {
    this.cancelTimer?.();
    this.cancelTimer = undefined;
  }
}

function toPublicPlayer(p: PlayerState): PublicPlayer {
  return { id: p.id, nickname: p.nickname, score: p.score, status: p.status };
}
