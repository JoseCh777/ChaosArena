import type { RuntimeEvent } from '../../shared/runtime-chaos.js';
import { defaultEffects, type EventContext } from './events.js';
import type { PlayerState } from './model.js';
import { powers, type RuntimePowers } from './runtimePowers.js';

export interface RuntimeEventContext {
  base: EventContext;
  ghosts: PlayerState[];
  index: number;
  powers: RuntimePowers;
  offerDuel: (players: [PlayerState, PlayerState]) => void;
}
type Outcome = { type: RuntimeEvent; targets: string[]; description: string };
type Effect = {
  type: RuntimeEvent;
  weight: number;
  eligible: (ctx: RuntimeEventContext) => boolean;
  run: (ctx: RuntimeEventContext) => Omit<Outcome, 'type'>;
};

const draw = <T>(pool: readonly T[], rng: () => number) => pool[Math.floor(rng() * pool.length)];
const ids = (...players: PlayerState[]) => players.map(p => p.id);
const double = defaultEffects.find(effect => effect.type === 'double-or-nothing')!;

const effects: readonly Effect[] = [
  {
    type: 'black-hole', weight: 15,
    eligible: ({ base }) => base.activePlayers.some(p => p.score > 0),
    run: ({ base, index, powers }) => {
      const p = draw(base.activePlayers.filter(p => p.score > 0), base.rng);
      if (powers.block(p.id, index)) return { targets: ids(p), description: `El escudo de ${p.nickname} bloqueó Agujero negro.` };
      const lost = Math.floor(p.score * .2);
      p.score -= lost;
      powers.recordLoss(p.id, lost);
      return { targets: ids(p), description: `${p.nickname} pierde ${lost} puntos (20 % del saldo).` };
    },
  },
  {
    type: 'double-or-nothing', weight: 20,
    eligible: ({ base }) => double.isEligible(base),
    run: ({ base }) => ({ ...double.apply(base), description: 'La próxima respuesta correcta vale el doble. Un error u omisión resta 50 puntos.' }),
  },
  {
    type: 'error-404', weight: 15,
    eligible: ({ base }) => base.hasNextQuestion && base.activePlayers.length > 0,
    run: ({ base, index, powers }) => {
      const p = draw(base.activePlayers, base.rng);
      const blocked = powers.block(p.id, index);
      if (!blocked) powers.suppress(p.id, index);
      return { targets: ids(p), description: blocked ? `El escudo de ${p.nickname} bloqueó Error 404.` :
        `${p.nickname} conserva la base, pero pierde los bonos de rapidez y racha en la próxima pregunta.` };
    },
  },
  {
    type: 'firewall', weight: 20,
    eligible: ({ base }) => base.hasNextQuestion && base.activePlayers.length > 0,
    run: ({ base, index, powers }) => {
      const p = draw(base.activePlayers, base.rng);
      powers.grantFirewall(p.id, index);
      return { targets: ids(p), description: `${p.nickname} recibe un escudo durante las próximas dos rondas.` };
    },
  },
  {
    type: 'loot-box', weight: 30,
    eligible: ({ base }) => base.activePlayers.length > 0,
    run: ({ base, index, powers: inventory }) => {
      const p = draw(base.activePlayers, base.rng);
      const reward = base.hasNextQuestion ? draw(['points', 'shield', 'power'] as const, base.rng) : 'points';
      if (reward === 'shield') {
        inventory.grantFirewall(p.id, index);
        return { targets: ids(p), description: `${p.nickname} recibe un escudo durante dos rondas.` };
      }
      if (reward === 'power' && inventory.grant(p.id, draw(powers, base.rng))) {
        return { targets: ids(p), description: `${p.nickname} recibe un poder en su inventario.` };
      }
      return { targets: ids(p), description: `${p.nickname} gana ${inventory.rewardPoints(p)} puntos.` };
    },
  },
  {
    type: 'hack', weight: 8,
    eligible: ({ base, index, powers }) => {
      const pool = base.activePlayers.filter(p => !powers.shielded(p.id, index));
      return pool.length > 1 && pool.some(p => p.score !== pool[0].score);
    },
    run: ({ base, index, powers }) => {
      const pool = base.activePlayers.filter(p => !powers.shielded(p.id, index));
      const a = draw(pool, base.rng);
      const b = draw(pool.filter(p => p.score !== a.score), base.rng);
      powers.recordLoss(a.id, a.score - b.score);
      powers.recordLoss(b.id, b.score - a.score);
      [a.score, b.score] = [b.score, a.score];
      return { targets: ids(a, b), description: `${a.nickname} y ${b.nickname} intercambian sus puntos.` };
    },
  },
  {
    type: 'duel', weight: 10,
    eligible: ({ base }) => base.activePlayers.length >= 2,
    run: ({ base, offerDuel }) => {
      const a = draw(base.activePlayers, base.rng);
      const b = draw(base.activePlayers.filter(p => p !== a), base.rng);
      offerDuel([a, b]);
      return { targets: ids(a, b), description: `${a.nickname} y ${b.nickname} pueden aceptar un duelo de exhibición.` };
    },
  },
  {
    type: 'respawn', weight: 12,
    eligible: ({ ghosts, base }) => base.hasNextQuestion && ghosts.length > 0,
    run: ({ ghosts, base }) => {
      const p = draw(ghosts, base.rng);
      p.status = 'active';
      p.streak = 0;
      return { targets: ids(p), description: `${p.nickname} regresa al juego con sus puntos y sus poderes disponibles.` };
    },
  },
];

export function rollRuntimeEvent(ctx: RuntimeEventContext, previous?: RuntimeEvent): Outcome | undefined {
  const eligible = effects.filter(effect => effect.eligible(ctx));
  if (!eligible.length) return undefined;
  const alternatives = eligible.filter(effect => effect.type !== previous);
  const pool = alternatives.length ? alternatives : eligible;
  let weight = ctx.base.rng() * pool.reduce((total, effect) => total + effect.weight, 0);
  const selected = pool.find(effect => (weight -= effect.weight) < 0) ?? pool[pool.length - 1];
  return { ...selected.run(ctx), type: selected.type };
}
