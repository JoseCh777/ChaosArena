import type { ErrorCode, PlayerStatus, Question } from '@chaos-arena/shared';

/** Estado interno del jugador. Nunca se envía tal cual: token y correctCount son privados. */
export interface PlayerState {
  id: string;
  token: string;
  nickname: string;
  status: PlayerStatus;
  score: number;
  correctCount: number;
  streak: number;
  /** Orden de ingreso, para desempates estables. */
  joinedAt: number;
}

export interface Submission {
  playerId: string;
  optionIndex: number;
  /** Tiempo de recepción en el servidor, ms Unix. */
  receivedAt: number;
}

/** Modificador pendiente para la próxima ronda (Doble o nada). */
export interface RoundModifier {
  baseMultiplier: number;
  /** Puntos que pierde un activo que falla u omite. */
  wrongPenalty: number;
}

export interface RoundState {
  roundId: string;
  questionIndex: number;
  question: Question;
  openedAt: number;
  deadline: number;
  submissions: Map<string, Submission>;
  modifier?: RoundModifier;
  settled: boolean;
}

/** Resultado de una ronda para un jugador, calculado por scoring.ts y aplicado por el motor. */
export interface PlayerRoundOutcome {
  playerId: string;
  answered: boolean;
  correct: boolean;
  /** Cambio total de puntos competitivos. El motor aplica max(0, score + delta). */
  pointsDelta: number;
  firstCorrectBonus: number;
  streakBonus: number;
  /** Racha tras la ronda. */
  newStreak: number;
}

export class GameError extends Error {
  constructor(public readonly code: ErrorCode) {
    super(code);
  }
}

/** Dependencias inyectables para pruebas deterministas. */
export interface EngineDeps {
  now(): number;
  setTimer(ms: number, fn: () => void): () => void;
  rng(): number;
  newId(): string;
}

export const realDeps: EngineDeps = {
  now: () => Date.now(),
  setTimer: (ms, fn) => {
    const handle = setTimeout(fn, ms);
    return () => clearTimeout(handle);
  },
  rng: () => Math.random(),
  newId: () => crypto.randomUUID(),
};
