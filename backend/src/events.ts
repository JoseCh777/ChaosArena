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

/** TODO(agente B): Agujero negro, Doble o nada, Loot Box y Hackeo. Este stub solo trae Loot Box. */
const lootBox: ChaosEffect = {
  type: 'loot-box',
  isEligible: (ctx) => ctx.activePlayers.length >= 1,
  apply(ctx) {
    const target = ctx.activePlayers[Math.floor(ctx.rng() * ctx.activePlayers.length)];
    target.score += 150;
    return { type: 'loot-box', targets: [target.id] };
  },
};

export const defaultEffects: readonly ChaosEffect[] = [lootBox];

/** Selección uniforme entre efectos elegibles. null si ninguno lo es. */
export function pickEffect(ctx: EventContext, effects: readonly ChaosEffect[] = defaultEffects): ChaosEffect | null {
  const eligible = effects.filter((e) => e.isEligible(ctx));
  if (eligible.length === 0) return null;
  return eligible[Math.floor(ctx.rng() * eligible.length)];
}
