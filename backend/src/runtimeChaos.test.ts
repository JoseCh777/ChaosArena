import assert from 'node:assert/strict';
import { test } from 'node:test';
import { GameEngine } from './game.js';
import { Duel } from './duel.js';
import { rollRuntimeEvent, type RuntimeEventContext } from './runtimeEvents.js';
import { RuntimePowers } from './runtimePowers.js';
import { scoreRound } from './scoring.js';
import { fakeDeps, player, question, quiz } from './testing.js';

function fixture() {
  const clock = fakeDeps();
  const ana = player({ score: 1000, correctCount: 3 });
  const beto = player({ id: 'p2', nickname: 'Beto', score: 100 });
  const ghost = player({ id: 'p3', nickname: 'Caro', status: 'ghost', score: 200, correctCount: 2 });
  const powers = new RuntimePowers();
  const ctx: RuntimeEventContext = {
    base: { rng: clock.deps.rng, activePlayers: [ana, beto], hasNextQuestion: true, hasPendingModifier: false,
      setNextRoundModifier() {} },
    index: 1, ghosts: [ghost], powers, offerDuel() {},
  };
  return { clock, ana, beto, ghost, powers, ctx };
}

test('ruleta pondera los ocho eventos y omite el último si hay alternativas', () => {
  const expected = ['black-hole', 'double-or-nothing', 'error-404', 'firewall', 'loot-box', 'hack', 'duel', 'respawn'];
  const starts = [0, 15, 35, 50, 70, 100, 108, 118];
  for (const [index, start] of starts.entries()) {
    const { clock, ctx } = fixture();
    clock.setRng([(start + 1) / 130]);
    assert.equal(rollRuntimeEvent(ctx)?.type, expected[index]);
  }
  const { ctx } = fixture();
  assert.equal(rollRuntimeEvent(ctx, 'black-hole')?.type, 'double-or-nothing');
});

test('Firewall caduca o se consume y Memento recupera hasta 150 del último ataque', () => {
  const { ana, ctx, powers } = fixture();
  powers.grantFirewall(ana.id, ctx.index);
  assert.equal(powers.firewall(ana.id, ctx.index + 2), true);
  assert.equal(powers.firewall(ana.id, ctx.index + 3), false);
  assert.match(rollRuntimeEvent(ctx)!.description, /bloqueó/);
  assert.equal(powers.firewall(ana.id, ctx.index), false);
  assert.equal(ana.score, 1000);
  assert.equal(rollRuntimeEvent(ctx)?.type, 'black-hole');
  assert.equal(ana.score, 800);
  powers.grant(ana.id, 'memento');
  powers.consume(ana, 'memento', ctx.index);
  assert.equal(ana.score, 950);
  assert.equal(ana.correctCount, 3);
});

test('Error 404 conserva la base multiplicada y no modifica el acierto', () => {
  const { ana, powers, ctx, clock } = fixture();
  ana.streak = 2;
  clock.setRng([.3, 0]);
  assert.equal(rollRuntimeEvent(ctx)?.type, 'error-404');
  assert.equal(powers.grant(ana.id, 'decorator'), true);
  powers.consume(ana, 'decorator', 1);
  const modifier = { baseMultiplier: 2, wrongPenalty: 50 };
  const round = { question: question(), questionIndex: 2, roundId: 'r', openedAt: 0, deadline: 0,
    modifier, submissions: new Map(), settled: true };
  const [result] = scoreRound({ question: round.question, players: [ana], submissions: [{ playerId: ana.id, receivedAt: 0, optionIndex: 1 }], modifier });
  assert.equal(powers.points(ana, round, result), 200);
  assert.equal(result.correct, true);
  assert.deepEqual(powers.view(ana, 2, false, false, true).items, ['decorator']);
});

test('Loot Box duplica solo su variante de puntos y Respawn conserva el inventario', () => {
  const { clock, ana, ghost, powers, ctx } = fixture();
  powers.grant(ana.id, 'prototype');
  powers.consume(ana, 'prototype', 0);
  clock.setRng([.6, 0, .4]);
  assert.match(rollRuntimeEvent(ctx)!.description, /escudo/);
  clock.setRng([.6, 0, 0]);
  assert.match(rollRuntimeEvent(ctx)!.description, /300 puntos/);
  assert.equal(ana.score, 1300);
  powers.grant(ghost.id, 'proxy');
  clock.setRng([.98, 0]);
  assert.equal(rollRuntimeEvent(ctx)?.type, 'respawn');
  assert.equal(ghost.status, 'active');
  assert.equal(ghost.score, 200);
  assert.equal(ghost.correctCount, 2);
  assert.deepEqual(powers.view(ghost, 2, false, false, true).items, ['proxy']);
});

test('duelo voluntario, Adapter privado y premio exclusivamente competitivo', () => {
  const { clock, ana, beto } = fixture();
  let charged = 0;
  let advanced = 0;
  const duel = new Duel([ana, beto], clock.deps, () => {}, () => advanced++, () => charged++);
  duel.start();
  const { id } = duel.publicView();
  assert.equal(duel.consent('otro', id, true), false);
  assert.equal(duel.consent(ana.id, id, true), true);
  assert.equal(duel.publicView().stage, 'invite');
  assert.equal(duel.consent(beto.id, id, true), true);
  assert.equal(charged, 1);
  assert.equal(duel.publicView().correctIndex, undefined);
  duel.adapt(ana.id);
  assert.deepEqual(duel.playerView(ana.id).hiddenOptions, [0, 2]);
  assert.equal(duel.playerView(beto.id).hiddenOptions, undefined);
  assert.equal(duel.answer(ana.id, id, 0), false);
  assert.equal(duel.answer(ana.id, id, 1), true);
  assert.equal(duel.answer(beto.id, id, 0), true);
  assert.equal(duel.publicView().correctIndex, 1);
  assert.equal(ana.score, 1200);
  assert.equal(ana.correctCount, 3);
  clock.advance(3000);
  assert.equal(advanced, 1);
});
test('Command conserva la carta cuando el rival rechaza y la consume al aceptar ambos', () => {
  const clock = fakeDeps();
  const engine = new GameEngine('123456', quiz(4), { votingEnabled: false }, clock.deps);
  engine.enableRuntimeChaos();
  const ana = engine.join('Ana');
  const beto = engine.join('Beto');
  engine.command('start');
  const answerAll = () => {
    const round = engine.currentRound()!;
    for (const p of [ana, beto]) engine.answer(p.id, round.roundId, 1);
  };
  answerAll();
  clock.setRng([.75, 0, .9, .99]);
  engine.command('event');
  assert.deepEqual(engine.chaosView(ana.id)?.items, ['command']);
  engine.command('next');
  assert.equal(engine.usePower(ana.id, 'command', ana.id), false);
  assert.equal(engine.usePower(ana.id, 'command', beto.id), true);
  answerAll();
  engine.command('next');
  const first = engine.runtimeView().duel!.id;
  assert.equal(engine.duelAction(beto.id, 'consent', first, false), true);
  assert.deepEqual(engine.chaosView(ana.id)?.items, ['command']);
  clock.advance(3_000);
  assert.equal(engine.usePower(ana.id, 'command', beto.id), true);
  answerAll();
  engine.command('next');
  const second = engine.runtimeView().duel!.id;
  assert.equal(engine.duelAction(ana.id, 'consent', second, true), true);
  assert.equal(engine.duelAction(beto.id, 'consent', second, true), true);
  assert.deepEqual(engine.chaosView(ana.id)?.items, ['decorator']);
  assert.deepEqual(engine.chaosView(ana.id)?.available, []);
});
test('el inventario admite dos poderes y Hackeo excluye a jugadores protegidos', () => {
  const { clock, ana, beto, powers, ctx } = fixture();
  const dani = player({ id: 'p4', nickname: 'Dani', score: 300 });
  ctx.base.activePlayers.push(dani);
  assert.equal(powers.grant(ana.id, 'proxy'), true);
  assert.equal(powers.grant(ana.id, 'memento'), true);
  assert.equal(powers.grant(ana.id, 'adapter'), false);
  powers.consume(ana, 'proxy', 1);
  assert.deepEqual(powers.view(ana, 1, false, false, true).available, []);
  clock.setRng([.8, 0, 0]);
  const hack = rollRuntimeEvent(ctx);
  assert.equal(hack?.type, 'hack');
  assert.deepEqual(hack?.targets, [beto.id, dani.id]);
  assert.deepEqual([ana.score, beto.score, dani.score], [1000, 300, 100]);
  assert.equal(powers.block(ana.id, 1), true);
});
