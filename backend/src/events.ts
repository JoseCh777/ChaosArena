import type { ChaosEvent } from '@chaos-arena/shared';
import type { PlayerState, RoundModifier } from './model.js';

/**
 * Patrón Strategy: cada evento del caos es una estrategia con elegibilidad y efecto.
 * DUEÑO: agente B (tarea B). Ver backend/AGENTS.md.
 */

export interface EventContext {
  /** Jugadores activos. Las estrategias mutan `score` directamente sobre estos objetos. */
  readonly activePlayers: PlayerState[];
  rng(): number;
  /** Hay un modificador pendiente para la próxima ronda. */
  readonly hasPendingModifier: boolean;
  /** Quedan preguntas por jugar. Doble o nada no es elegible si es false. */
  readonly hasNextQuestion: boolean;
  setNextRoundModifier(modifier: RoundModifier): void;
}

export interface EventOutcome {
  type: ChaosEvent;
  /** IDs de jugadores afectados. */
  targets: string[];
}

export interface ChaosEffect {
  readonly type: ChaosEvent;
  isEligible(ctx: EventContext): boolean;
  /** Se llama una sola vez por evento. */
  apply(ctx: EventContext): EventOutcome;
}

const blackHole: ChaosEffect = {
  type: 'black-hole',
  isEligible: (ctx) => ctx.activePlayers.some((player) => player.score > 0),
  apply(ctx) {
    const candidates = ctx.activePlayers.filter((player) => player.score > 0);
    const target = candidates[Math.floor(ctx.rng() * candidates.length)];
    target.score -= Math.floor(target.score * 0.2);
    return { type: 'black-hole', targets: [target.id] };
  },
};

const doubleOrNothing: ChaosEffect = {
  type: 'double-or-nothing',
  isEligible: (ctx) => ctx.hasNextQuestion && !ctx.hasPendingModifier,
  apply(ctx) {
    ctx.setNextRoundModifier({ baseMultiplier: 2, wrongPenalty: 50 });
    return { type: 'double-or-nothing', targets: ctx.activePlayers.map((player) => player.id) };
  },
};

const lootBox: ChaosEffect = {
  type: 'loot-box',
  isEligible: (ctx) => ctx.activePlayers.length >= 1,
  apply(ctx) {
    const target = ctx.activePlayers[Math.floor(ctx.rng() * ctx.activePlayers.length)];
    target.score += 150;
    return { type: 'loot-box', targets: [target.id] };
  },
};

const hack: ChaosEffect = {
  type: 'hack',
  isEligible: ({ activePlayers }) =>
    activePlayers.length >= 2 && activePlayers.some((player) => player.score !== activePlayers[0].score),
  apply(ctx) {
    const { activePlayers } = ctx;
    const firstIndex = Math.floor(ctx.rng() * activePlayers.length);
    const remainingIndex = Math.floor(ctx.rng() * (activePlayers.length - 1));
    const secondIndex = remainingIndex < firstIndex ? remainingIndex : remainingIndex + 1;
    const first = activePlayers[firstIndex];
    const second = activePlayers[secondIndex];
    [first.score, second.score] = [second.score, first.score];
    return { type: 'hack', targets: [first.id, second.id] };
  },
};

export const defaultEffects: readonly ChaosEffect[] = [blackHole, doubleOrNothing, lootBox, hack];

/** Selección uniforme entre efectos elegibles. null si ninguno lo es. */
export function pickEffect(ctx: EventContext, effects: readonly ChaosEffect[] = defaultEffects): ChaosEffect | null {
  const eligible = effects.filter((e) => e.isEligible(ctx));
  if (eligible.length === 0) return null;
  return eligible[Math.floor(ctx.rng() * eligible.length)];
}
