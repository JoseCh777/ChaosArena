import assert from 'node:assert/strict';
import { test } from 'node:test';
import { attachAutopilot } from './autopilot.js';
import { GameEngine } from './game.js';
import { fakeDeps, quiz } from './testing.js';

function fixture(voteAfter: number[] = []) {
  const clock = fakeDeps();
  const engine = new GameEngine('123456', quiz(3), { votingEnabled: true }, clock.deps);
  engine.enableRuntimeChaos();
  attachAutopilot(engine, { revealMs: 100, rouletteMs: 500, eventChance: 1, voteAfter }, clock.deps);
  const players = ['Jose', 'Daniel', 'Ana', 'Sara'].map(name => engine.join(name));
  engine.command('start');
  const id = engine.currentRound()!.roundId;
  const answerAll = () => players.forEach(player => engine.answer(player.id, id, 1));
  return { clock, engine, players, id, answerAll };
}

test('el reloj conserva su saldo y el servidor rechaza respuestas durante la pausa', () => {
  const { clock, engine, players, id } = fixture();
  engine.answer(players[0].id, id, 1);
  clock.advance(10_000);
  assert.equal(engine.setQuestionPaused(id, true), true);
  clock.advance(25_000);
  assert.equal(engine.questionPausedMs, 10_000);
  assert.equal(engine.phase, 'question');
  assert.equal(engine.choiceOf(players[1].id), null);
  assert.throws(() => engine.answer(players[1].id, id, 1), /ROUND_CLOSED/);
  assert.equal(engine.setQuestionPaused('vieja', false), false);
  assert.equal(engine.setQuestionPaused(id, false), true);
  assert.equal(engine.currentRound()?.deadline, clock.deps.now() + 10_000);
  clock.advance(9_999);
  assert.equal(engine.phase, 'question');
  clock.advance(1);
  assert.equal(engine.phase, 'results');
  assert.equal(engine.choiceOf(players[0].id), 1);
});

test('cerrar una pregunta en pausa la liquida una sola vez', () => {
  const { clock, engine, players, id } = fixture();
  engine.answer(players[0].id, id, 1);
  assert.equal(engine.setQuestionPaused(id, true), true);
  assert.equal(engine.closeQuestion(id), true);
  assert.equal(engine.closeQuestion(id), false);
  assert.equal(engine.questionPausedMs, undefined);
  clock.advance(100);
  assert.equal(engine.questionIndex, 1);
  assert.equal(players[0].correctCount, 1);
  assert.equal(engine.closeQuestion(id), false);
});

test('omitir el sorteo mantiene los puntos; saltar la animación conserva el evento aplicado', () => {
  const first = fixture();
  first.answerAll();
  const previous = first.players[0].score;
  assert.equal(first.engine.skipEvent(first.id), true);
  first.clock.advance(100);
  assert.equal(first.engine.phase, 'question');
  assert.equal(first.players[0].score, previous);

  const second = fixture();
  second.answerAll();
  second.clock.advance(100);
  assert.equal(second.engine.runtimeView().chaosEvent?.type, 'black-hole');
  const applied = second.players[0].score;
  assert.equal(second.engine.skipRoulette(second.id), true);
  second.clock.advance(500);
  assert.equal(second.engine.questionIndex, 1);
  assert.equal(applied, previous - Math.floor(previous * .2));
  assert.equal(second.players[0].score, applied);
});

test('cancelar una votación descarta los votos acumulados sin expulsar', () => {
  const { clock, engine, players, answerAll, id } = fixture([1]);
  answerAll();
  assert.equal(engine.skipEvent(id), true);
  clock.advance(100);
  const vote = engine.voteInfo()!;
  for (const player of players.slice(0, 3)) engine.vote(player.id, vote.voteId, players[3].id);
  assert.equal(engine.cancelVote('vieja'), false);
  assert.equal(engine.cancelVote(vote.voteId), true);
  assert.equal(engine.cancelVote(vote.voteId), false);
  clock.advance(0);
  assert.equal(engine.phase, 'question');
  assert.ok(players.every(player => player.status === 'active'));
});
