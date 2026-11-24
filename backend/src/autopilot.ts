import type { GameCommand } from '@chaos-arena/shared';
import type { EngineChange, GameEngine } from './game.js';
import { GameError, realDeps, type EngineDeps } from './model.js';
import { MIN_ACTIVE_TO_VOTE } from './voting.js';

/**
 * Observador que conduce la partida sin anfitrión entre rondas: revela, sortea un evento,
 * abre asambleas y avanza. Solo emite comandos al motor; las reglas siguen en GameEngine.
 */

export interface AutopilotOptions {
  /** Tiempo mostrando la solución antes del sorteo. */
  revealMs: number;
  /** Duración de la ruleta antes de avanzar. */
  rouletteMs: number;
  /** Probabilidad de evento cuando todos respondieron. */
  eventChance: number;
  /** Número de pregunta (1-based) tras el que se abre asamblea. */
  voteAfter: readonly number[];
}

export const defaultAutopilot: AutopilotOptions = {
  revealMs: 3500,
  rouletteMs: 5400,
  eventChance: 0.3,
  voteAfter: [5, 10],
};

export function attachAutopilot(
  engine: GameEngine,
  options: AutopilotOptions = defaultAutopilot,
  deps: Pick<EngineDeps, 'setTimer' | 'rng'> = realDeps,
): () => void {
  let cancel: (() => void) | undefined;
  let rollAfterVote = false;

  const later = (ms: number, expectedPhase: string, fn: () => void) => {
    cancel?.();
    cancel = deps.setTimer(ms, () => {
      cancel = undefined;
      if (engine.phase === expectedPhase) fn();
    });
  };

  const run = (command: GameCommand): boolean => {
    try {
      engine.command(command);
      return true;
    } catch (error) {
      if (error instanceof GameError) return false;
      throw error;
    }
  };

  const rollOrContinue = (allAnswered: boolean) => {
    if (allAnswered && deps.rng() < options.eventChance && run('event')) {
      later(options.rouletteMs, 'event', () => run('next'));
      return;
    }
    run('next');
  };

  const afterReveal = (allAnswered: boolean) => {
    const active = [...engine.players.values()].filter((p) => p.status === 'active').length;
    const wantsVote = engine.votingEnabled && engine.hasNextQuestion()
      && options.voteAfter.includes(engine.questionIndex + 1) && active >= MIN_ACTIVE_TO_VOTE;
    if (wantsVote && run('vote')) {
      rollAfterVote = allAnswered;
      return;
    }
    rollOrContinue(allAnswered);
  };

  const unsubscribe = engine.subscribe((change: EngineChange) => {
    if (change.kind === 'round:result') {
      const answered = change.result.counts.reduce((a, b) => a + b, 0);
      const allAnswered = answered >= engine.players.size;
      later(options.revealMs, 'results', () => afterReveal(allAnswered));
    } else if (change.kind === 'vote:result') {
      const eligible = rollAfterVote;
      rollAfterVote = false;
      later(0, 'voting', () => rollOrContinue(eligible));
    } else if (change.kind === 'finished') {
      cancel?.();
    }
  });

  return () => {
    cancel?.();
    unsubscribe();
  };
}
