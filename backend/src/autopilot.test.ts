import { test } from 'node:test';
import assert from 'node:assert/strict';
import { attachAutopilot } from './autopilot.js';
import { GameEngine } from './game.js';
import { fakeDeps, quiz } from './testing.js';

const pilot = { revealMs: 100, rouletteMs: 200, eventChance: 0.3, voteAfter: [1] };

function setup(questions = 2, voting = true) {
  const clock = fakeDeps();
  const engine = new GameEngine('123456', quiz(questions), { votingEnabled: voting }, clock.deps);
  attachAutopilot(engine, pilot, clock.deps);
  return { clock, engine };
}

function answerAll(engine: GameEngine, option = 1) {
  const roundId = engine.publicSnapshot().round!.roundId;
  for (const id of engine.players.keys()) engine.answer(id, roundId, option);
}

test('piloto: sin evento ni asamblea avanza tras revelar', () => {
  const { engine, clock } = setup(2, false);
  engine.join('Ana');
  engine.command('start');
  clock.setRng([0.9]);
  answerAll(engine);
  assert.equal(engine.phase, 'results');
  clock.advance(100);
  assert.equal(engine.phase, 'question');
  assert.equal(engine.questionIndex, 1);
});

test('piloto: evento sorteado muestra ruleta y luego avanza', () => {
  const { engine, clock } = setup(2, false);
  engine.join('Ana');
  engine.command('start');
  answerAll(engine);
  clock.setRng([0.1, 0, 0]);
  clock.advance(100);
  assert.equal(engine.phase, 'event');
  clock.advance(200);
  assert.equal(engine.phase, 'question');
});

test('piloto: asamblea tras la pregunta configurada y avance al cerrar', () => {
  const { engine, clock } = setup(3);
  const [a, b, c] = ['Ana', 'Beto', 'Caro'].map((n) => engine.join(n));
  engine.command('start');
  clock.setRng([0.9]);
  answerAll(engine);
  clock.advance(100);
  assert.equal(engine.phase, 'voting');
  const voteId = engine.voteInfo()!.voteId;
  engine.vote(a.id, voteId, c.id);
  engine.vote(b.id, voteId, c.id);
  engine.vote(c.id, voteId, null);
  clock.advance(0);
  assert.equal(c.status, 'ghost');
  assert.equal(engine.phase, 'question');
});

test('piloto: respuestas pendientes al vencer no disparan evento', () => {
  const { engine, clock } = setup(2, false);
  engine.join('Ana');
  engine.join('Beto');
  engine.command('start');
  clock.setRng([0]);
  clock.advance(20_001);
  clock.advance(100);
  assert.equal(engine.phase, 'question');
});

test('motor: leave, configure y restart respetan la fase', () => {
  const { engine } = setup(1, false);
  const ana = engine.join('Ana');
  const beto = engine.join('Beto');
  engine.leave(beto.id);
  assert.equal(engine.players.size, 1);
  engine.configure(quiz(1), { votingEnabled: false });
  engine.command('start');
  assert.throws(() => engine.leave(ana.id), /WRONG_PHASE/);
  assert.throws(() => engine.restart(), /WRONG_PHASE/);
  engine.command('finish');
  ana.score = 500;
  engine.restart();
  assert.equal(engine.phase, 'lobby');
  assert.equal(ana.score, 0);
  assert.equal(engine.questionIndex, -1);
});
test('piloto: una asamblea programada conserva el sorteo tras cerrar sus votos', () => {
  const { engine, clock } = setup(3);
  engine.enableRuntimeChaos();
  const [ana, beto, caro] = ['Ana', 'Beto', 'Caro'].map(nickname => engine.join(nickname));
  engine.command('start');
  answerAll(engine);
  clock.setRng([0.1, .99, 0]);
  clock.advance(100);
  const id = engine.voteInfo()!.voteId;
  engine.vote(ana.id, id, caro.id);
  engine.vote(beto.id, id, caro.id);
  engine.vote(caro.id, id, null);
  clock.advance(0);
  assert.equal(engine.phase, 'event');
  assert.equal(engine.runtimeView().chaosEvent?.type, 'respawn');
  clock.advance(200);
  assert.equal(caro.status, 'active');
  assert.equal(engine.questionIndex, 1);
});
