import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildRanking, personalResult, scoreRound } from './scoring.js';
import { player, question } from './testing.js';

test('scoreRound da el primer acierto al activo más rápido y desempata por orden de envío', () => {
  const players = Object.freeze([
    Object.freeze(player({ id: 'empate' })),
    Object.freeze(player({ id: 'fantasma', status: 'ghost' })),
    Object.freeze(player({ id: 'tardío' })),
    Object.freeze(player({ id: 'primero' })),
    Object.freeze(player({ id: 'error' })),
  ]);
  const submissions = Object.freeze([
    Object.freeze({ playerId: 'fuera-de-sala', optionIndex: 1, receivedAt: 0 }),
    Object.freeze({ playerId: 'fantasma', optionIndex: 1, receivedAt: 1 }),
    Object.freeze({ playerId: 'error', optionIndex: 0, receivedAt: 2 }),
    Object.freeze({ playerId: 'tardío', optionIndex: 1, receivedAt: 20 }),
    Object.freeze({ playerId: 'primero', optionIndex: 1, receivedAt: 10 }),
    Object.freeze({ playerId: 'empate', optionIndex: 1, receivedAt: 10 }),
  ]);

  const outcomes = scoreRound({ question: question(), players, submissions });

  assert.deepEqual(outcomes.map(({ playerId }) => playerId), players.map(({ id }) => id));
  assert.deepEqual(outcomes.map(({ firstCorrectBonus }) => firstCorrectBonus), [0, 0, 0, 50, 0]);
  assert.deepEqual(outcomes.map(({ pointsDelta }) => pointsDelta), [100, 0, 100, 150, 0]);
});

test('scoreRound premia cada umbral de racha una sola vez y lo habilita otra vez al reiniciar', () => {
  let participant = player();
  const currentQuestion = question();

  function playRound(optionIndex?: number) {
    const [outcome] = scoreRound({
      question: currentQuestion,
      players: [participant],
      submissions: optionIndex === undefined ? [] : [{ playerId: participant.id, optionIndex, receivedAt: 1 }],
    });
    participant = { ...participant, streak: outcome.newStreak };
    return outcome;
  }

  const streak = [1, 2, 3, 4, 5, 6, 7].map(() => playRound(1));
  assert.deepEqual(streak.map(({ newStreak }) => newStreak), [1, 2, 3, 4, 5, 6, 7]);
  assert.deepEqual(streak.map(({ streakBonus }) => streakBonus), [0, 0, 150, 0, 300, 0, 0]);
  assert.deepEqual(streak.map(({ pointsDelta }) => pointsDelta), [150, 150, 300, 150, 450, 150, 150]);

  for (const optionIndex of [0, undefined]) {
    const reset = playRound(optionIndex);
    assert.deepEqual(reset, {
      playerId: participant.id,
      answered: optionIndex !== undefined,
      correct: false,
      pointsDelta: 0,
      firstCorrectBonus: 0,
      streakBonus: 0,
      newStreak: 0,
    });
    const renewedStreak = [1, 2, 3, 4, 5].map(() => playRound(1));
    assert.deepEqual(renewedStreak.map(({ streakBonus }) => streakBonus), [0, 0, 150, 0, 300]);
  }
});

test('scoreRound aplica Doble o nada a la base y penaliza tanto error como omisión', () => {
  const players = [player({ id: 'acierto', streak: 4 }), player({ id: 'error', streak: 3 }), player({ id: 'omisión', streak: 2 })];
  const modifier = Object.freeze({ baseMultiplier: 2, wrongPenalty: 50 });
  const outcomes = scoreRound({
    question: question({ points: 125 }),
    players,
    submissions: [
      { playerId: 'acierto', optionIndex: 1, receivedAt: 1 },
      { playerId: 'error', optionIndex: 0, receivedAt: 2 },
    ],
    modifier,
  });

  assert.deepEqual(outcomes, [
    { playerId: 'acierto', answered: true, correct: true, pointsDelta: 600, firstCorrectBonus: 50, streakBonus: 300, newStreak: 5 },
    { playerId: 'error', answered: true, correct: false, pointsDelta: -50, firstCorrectBonus: 0, streakBonus: 0, newStreak: 0 },
    { playerId: 'omisión', answered: false, correct: false, pointsDelta: -50, firstCorrectBonus: 0, streakBonus: 0, newStreak: 0 },
  ]);
});

test('scoreRound conserva la respuesta académica del fantasma y le asigna cero puntos, bonos y racha', () => {
  const players = ['acierto', 'error', 'omisión'].map((id) => player({ id, status: 'ghost', streak: 2 }));
  const outcomes = scoreRound({
    question: question(),
    players,
    submissions: [
      { playerId: 'acierto', optionIndex: 1, receivedAt: 1 },
      { playerId: 'error', optionIndex: 0, receivedAt: 2 },
    ],
    modifier: { baseMultiplier: 2, wrongPenalty: 50 },
  });

  const zeroScore = { pointsDelta: 0, firstCorrectBonus: 0, streakBonus: 0, newStreak: 0 };
  assert.deepEqual(outcomes, [
    { playerId: 'acierto', answered: true, correct: true, ...zeroScore },
    { playerId: 'error', answered: true, correct: false, ...zeroScore },
    { playerId: 'omisión', answered: false, correct: false, ...zeroScore },
  ]);
});

test('buildRanking comparte posiciones 1, 1, 3 y ordena el empate por ingreso', () => {
  const players = Object.freeze([
    player({ id: 'tercero', nickname: 'Ana', score: 200, correctCount: 1, joinedAt: 1 }),
    player({ id: 'después', nickname: 'Bea', score: 200, correctCount: 2, joinedAt: 3, status: 'ghost' }),
    player({ id: 'antes', nickname: 'Cris', score: 200, correctCount: 2, joinedAt: 2 }),
  ]);

  assert.deepEqual(buildRanking(players), [
    { id: 'antes', nickname: 'Cris', score: 200, status: 'active', rank: 1 },
    { id: 'después', nickname: 'Bea', score: 200, status: 'ghost', rank: 1 },
    { id: 'tercero', nickname: 'Ana', score: 200, status: 'active', rank: 3 },
  ]);
});

test('buildRanking prioriza los puntos y conserva el orden de entrada si coincide el momento de ingreso', () => {
  const players = [
    player({ id: 'ocupado', score: 250, correctCount: 4, joinedAt: 1 }),
    player({ id: 'por-puntos', score: 300, correctCount: 1, joinedAt: 2 }),
    player({ id: 'posterior', score: 250, correctCount: 4, joinedAt: 1 }),
  ];

  assert.deepEqual(buildRanking(players).map(({ id, rank }) => [id, rank]), [
    ['por-puntos', 1], ['ocupado', 2], ['posterior', 2],
  ]);
});

test('personalResult calcula el porcentaje de aciertos sobre las preguntas cerradas y redondea a dos decimales', () => {
  const ghost = player({ score: 250, correctCount: 2, status: 'ghost' });

  assert.deepEqual(personalResult(ghost, 3), {
    playerId: ghost.id,
    score: 250,
    correctCount: 2,
    validQuestionCount: 3,
    academicPercentage: 66.67,
  });
  assert.equal(personalResult(player({ correctCount: 1 }), 3).academicPercentage, 33.33);
  assert.equal(personalResult(player(), 0).academicPercentage, 0);
});
