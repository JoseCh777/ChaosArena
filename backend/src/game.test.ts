import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameEngine, type EngineChange } from './game.js';
import { fakeDeps, quiz } from './testing.js';

function setup(questions = 2) {
  const clock = fakeDeps();
  const engine = new GameEngine('123456', quiz(questions), { votingEnabled: true }, clock.deps);
  const changes: EngineChange[] = [];
  engine.subscribe((c) => changes.push(c));
  return { clock, engine, changes };
}

test('lobby: apodos normalizados y duplicados rechazados', () => {
  const { engine } = setup();
  const ana = engine.join('  Ana   María ');
  assert.equal(ana.nickname, 'Ana María');
  assert.throws(() => engine.join('ana maría'), /NICKNAME_TAKEN/);
  assert.throws(() => engine.join('   '), /NICKNAME_INVALID/);
  assert.throws(() => engine.join('x'.repeat(21)), /NICKNAME_INVALID/);
});

test('estado: solo start en lobby y bloqueo de ingreso al iniciar', () => {
  const { engine } = setup();
  assert.throws(() => engine.command('start'), /NOT_ENOUGH_PLAYERS/);
  engine.join('Ana');
  assert.throws(() => engine.command('next'), /WRONG_PHASE/);
  engine.command('start');
  assert.equal(engine.phase, 'question');
  assert.throws(() => engine.join('Beto'), /ROOM_LOCKED/);
});

test('ronda: una respuesta por persona, opción válida y cierre único', () => {
  const { engine, changes } = setup();
  const ana = engine.join('Ana');
  engine.join('Beto');
  engine.command('start');
  const roundId = engine.publicSnapshot().round!.roundId;
  assert.throws(() => engine.answer(ana.id, roundId, 9), /OPTION_INVALID/);
  assert.throws(() => engine.answer(ana.id, 'otra', 1), /ROUND_CLOSED/);
  engine.answer(ana.id, roundId, 1);
  assert.throws(() => engine.answer(ana.id, roundId, 1), /ALREADY_ANSWERED/);
  engine.command('close');
  engine.settleRound();
  assert.equal(changes.filter((c) => c.kind === 'round:result').length, 1);
  assert.equal(engine.phase, 'results');
  assert.equal(ana.correctCount, 1);
});

test('una ronda sin el anfitrión cierra con los jugadores y lo excluye de la clasificación', () => {
  const { engine, changes } = setup();
  const host = engine.join('Anfitrión');
  const player = engine.join('Jugadora');
  engine.configureParticipation(host.id);
  engine.command('start');
  const progress = engine.roundProgress()!;
  assert.equal(progress.expected, 1);
  assert.throws(() => engine.answer(host.id, progress.roundId, 1), /NOT_ACTIVE/);
  engine.answer(player.id, progress.roundId, 1);
  assert.equal(engine.phase, 'results');
  const result = changes.find(change => change.kind === 'round:result');
  assert.deepEqual(result?.result.ranking.map(entry => entry.id), [player.id]);
});

test('ronda: temporizador cierra y respuesta tardía se rechaza', () => {
  const { engine, clock } = setup();
  const ana = engine.join('Ana');
  engine.join('Beto');
  engine.command('start');
  const roundId = engine.publicSnapshot().round!.roundId;
  clock.advance(20_001);
  assert.equal(engine.phase, 'results');
  assert.throws(() => engine.answer(ana.id, roundId, 1), /ROUND_CLOSED/);
});

test('snapshot público no expone clave ni tokens', () => {
  const { engine } = setup();
  engine.join('Ana');
  engine.command('start');
  const json = JSON.stringify(engine.publicSnapshot());
  assert.ok(!json.includes('correctIndex'));
  assert.ok(!json.includes('token'));
  assert.ok(!json.includes('correctCount'));
});

test('flujo completo hasta finished con resultados por rol', () => {
  const { engine } = setup(2);
  const ana = engine.join('Ana');
  engine.command('start');
  engine.answer(ana.id, engine.publicSnapshot().round!.roundId, 1);
  engine.command('next');
  engine.command('close');
  engine.command('next');
  assert.equal(engine.phase, 'finished');
  const host = engine.finishedView('host');
  assert.equal(host.role, 'host');
  const personal = engine.finishedView('player', ana.id);
  assert.equal(personal?.role === 'player' && personal.personal.academicPercentage, 50);
});
