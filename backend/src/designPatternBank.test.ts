import assert from 'node:assert/strict';
import { test } from 'node:test';
import { designPatternQuiz } from './designPatternBank.js';
import { validateQuiz } from './questions.js';

test('cada tamaño sortea preguntas y reserva el caso jefe para el cierre', () => {
  for (const size of [16, 32, 48] as const) {
    const quiz = designPatternQuiz(size, () => 0);
    const other = designPatternQuiz(size, () => .99);
    assert.deepEqual(validateQuiz(quiz), { ok: true, quiz });
    assert.equal(quiz.questions.length, size);
    assert.equal(new Set(quiz.questions.map(question => question.id)).size, size);
    assert.equal(quiz.questions[0].points, 75);
    assert.notDeepEqual(quiz.questions.map(question => question.id), other.questions.map(question => question.id));
    for (const bank of [quiz, other]) {
      const boss = bank.questions.at(-1)!;
      assert.equal(boss.id, 'patrones-caso-final');
      assert.equal(boss.seconds, 55);
      assert.equal(boss.points, 150);
      assert.match(boss.options[boss.correctIndex], /^Facade coordina/);
    }
  }
});
