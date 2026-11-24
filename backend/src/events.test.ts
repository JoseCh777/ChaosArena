import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { ChaosEvent } from '@chaos-arena/shared';
import { defaultEffects, pickEffect, type EventContext } from './events.js';
import { GameEngine, type EngineChange } from './game.js';
import type { RoundModifier } from './model.js';
import { fakeDeps, player, quiz } from './testing.js';

function setup(scores: number[], overrides: Partial<EventContext> = {}) {
  const clock = fakeDeps();
  const modifiers: RoundModifier[] = [];
  const ctx: EventContext = {
    activePlayers: scores.map((score, index) => player({ id: `p${index + 1}`, score })),
    rng: clock.deps.rng,
    hasPendingModifier: false,
    hasNextQuestion: true,
    setNextRoundModifier: (modifier) => { modifiers.push(modifier); },
    ...overrides,
  };
  return { ctx, modifiers, setRng: clock.setRng };
}

function effect(type: ChaosEvent) {
  const strategy = defaultEffects.find((item) => item.type === type);
  assert.ok(strategy);
  return strategy;
}

test('Agujero negro requiere un puntaje positivo y resta el 20 % redondeado hacia abajo', () => {
  const strategy = effect('black-hole');
  assert.equal(strategy.isEligible(setup([]).ctx), false);
  assert.equal(strategy.isEligible(setup([0, -5]).ctx), false);
  assert.equal(strategy.isEligible(setup([1]).ctx), true);

  const { ctx, setRng } = setup([41, 107, 0]);
  setRng([0.9]);
  assert.deepEqual(strategy.apply(ctx), { type: 'black-hole', targets: ['p2'] });
  assert.deepEqual(ctx.activePlayers.map((item) => item.score), [41, 86, 0]);
});

test('Doble o nada requiere otra pregunta y registra un solo modificador para todos los activos', () => {
  const strategy = effect('double-or-nothing');
  assert.equal(strategy.isEligible(setup([10], { hasNextQuestion: false }).ctx), false);
  assert.equal(strategy.isEligible(setup([10], { hasPendingModifier: true }).ctx), false);
  assert.equal(strategy.isEligible(setup([]).ctx), true);

  const { ctx, modifiers } = setup([10, 20]);
  assert.equal(strategy.isEligible(ctx), true);
  assert.deepEqual(strategy.apply(ctx), { type: 'double-or-nothing', targets: ['p1', 'p2'] });
  assert.deepEqual(modifiers, [{ baseMultiplier: 2, wrongPenalty: 50 }]);
  assert.deepEqual(ctx.activePlayers.map((item) => item.score), [10, 20]);
});

test('Loot Box requiere un activo y suma 150 a un solo jugador', () => {
  const strategy = effect('loot-box');
  assert.equal(strategy.isEligible(setup([]).ctx), false);
  assert.equal(strategy.isEligible(setup([0]).ctx), true);

  const { ctx, setRng } = setup([10, 0]);
  setRng([0.75]);
  assert.deepEqual(strategy.apply(ctx), { type: 'loot-box', targets: ['p2'] });
  assert.deepEqual(ctx.activePlayers.map((item) => item.score), [10, 150]);
});

test('Hackeo requiere puntajes distintos e intercambia los de dos jugadores distintos', () => {
  const strategy = effect('hack');
  assert.equal(strategy.isEligible(setup([10]).ctx), false);
  assert.equal(strategy.isEligible(setup([10, 10]).ctx), false);

  const { ctx, setRng } = setup([10, 10, 50]);
  assert.equal(strategy.isEligible(ctx), true);
  setRng([0.5, 0.5]);
  assert.deepEqual(strategy.apply(ctx), { type: 'hack', targets: ['p2', 'p3'] });
  assert.deepEqual(ctx.activePlayers.map((item) => item.score), [10, 50, 10]);
});

test('pickEffect divide el intervalo del RNG en partes iguales entre los elegibles', () => {
  const { ctx, setRng } = setup([10, 20]);
  setRng([0, 0.249, 0.25, 0.499, 0.5, 0.749, 0.75, 0.999]);
  assert.deepEqual(Array.from({ length: 8 }, () => pickEffect(ctx)?.type), [
    'black-hole', 'black-hole', 'double-or-nothing', 'double-or-nothing',
    'loot-box', 'loot-box', 'hack', 'hack',
  ]);

  const filtered = setup([0]);
  filtered.setRng([0.499, 0.5]);
  assert.equal(pickEffect(filtered.ctx)?.type, 'double-or-nothing');
  assert.equal(pickEffect(filtered.ctx)?.type, 'loot-box');
  assert.equal(pickEffect(setup([], { hasNextQuestion: false }).ctx), null);
});

test('el motor aplica y publica el evento una sola vez entre rondas', () => {
  const clock = fakeDeps();
  const engine = new GameEngine('123456', quiz(2), { votingEnabled: true }, clock.deps);
  const changes: EngineChange[] = [];
  engine.subscribe((change) => changes.push(change));
  const ana = engine.join('Ana');
  engine.command('start');
  engine.command('close');

  clock.setRng([0.75, 0]);
  engine.command('event');
  assert.throws(() => engine.command('event'), /WRONG_PHASE/);
  assert.equal(ana.score, 150);
  assert.equal(changes.filter((change) => change.kind === 'event:result').length, 1);
});
