import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateQuiz } from './questions.js';
import { question, quiz } from './testing.js';

test('validateQuiz devuelve una copia limpia y omite la explicación vacía', () => {
  const input = {
    title: '  Prueba  ',
    extra: true,
    questions: [
      { ...question(), id: ' q1 ', type: ' multiple ', prompt: ' Patrones ', options: [' A ', ' B '], explanation: ' Motivo ', extra: true },
      { ...question({ type: 'boolean', options: ['Sí', 'No'] }), id: ' q2 ', explanation: ' \t ' },
    ],
  };
  const original = structuredClone(input);
  const result = validateQuiz(input);

  assert.deepEqual(result, {
    ok: true,
    quiz: {
      title: 'Prueba',
      questions: [
        question({ prompt: 'Patrones', options: ['A', 'B'], explanation: 'Motivo' }),
        question({ id: 'q2', type: 'boolean', options: ['Sí', 'No'] }),
      ],
    },
  });
  assert.ok(result.ok);
  result.quiz.questions[0].options[0] = 'Cambio';
  assert.deepEqual(input, original);
});

test('validateQuiz acepta los extremos inclusivos de todos los límites', () => {
  const min = {
    title: 'T',
    questions: [question({ id: 'i', prompt: '?', options: ['A', 'B'], correctIndex: 0, seconds: 10, points: 50 })],
  };
  const max = {
    title: 'T'.repeat(100),
    questions: [
      question({
        id: 'i'.repeat(40),
        prompt: '?'.repeat(300),
        options: ['A'.repeat(120), 'B', 'C', 'D'],
        correctIndex: 3,
        seconds: 60,
        points: 200,
        explanation: 'E'.repeat(500),
      }),
      ...quiz(49).questions,
    ],
  };

  assert.deepEqual(validateQuiz(min), { ok: true, quiz: min });
  assert.deepEqual(validateQuiz(max), { ok: true, quiz: max });
});

const invalidQuizzes: [string, unknown, RegExp][] = [
  ['entrada nula', null, /objeto/],
  ['entrada numérica', 42, /objeto/],
  ['entrada de tipo arreglo', [], /objeto/],
  ['título ausente', { questions: [question()] }, /título/],
  ['título de otro tipo', { ...quiz(), title: 123 }, /título/],
  ['título vacío', { ...quiz(), title: '  ' }, /título/],
  ['título de más de 100 caracteres', { ...quiz(), title: 'T'.repeat(101) }, /título/],
  ['preguntas de otro tipo', { ...quiz(), questions: {} }, /entre 1 y 50 preguntas/],
  ['cero preguntas', quiz(0), /entre 1 y 50 preguntas/],
  ['más de 50 preguntas', quiz(51), /entre 1 y 50 preguntas/],
];

for (const [name, input, error] of invalidQuizzes) {
  test(`validateQuiz rechaza ${name}`, () => {
    const result = validateQuiz(input);
    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.error, error);
  });
}

const invalidQuestions: [string, Record<string, unknown>, RegExp][] = [
  ['ID vacío', { id: ' ' }, /ID/],
  ['ID de más de 40 caracteres', { id: 'i'.repeat(41) }, /ID/],
  ['ID de otro tipo', { id: 123 }, /ID/],
  ['ID repetido después de limpiar espacios', { id: ' q1 ' }, /ID está repetido/],
  ['tipo desconocido', { type: 'single' }, /tipo/],
  ['tipo no textual', { type: 1 }, /tipo/],
  ['enunciado vacío', { prompt: '\t' }, /enunciado/],
  ['enunciado de más de 300 caracteres', { prompt: '?'.repeat(301) }, /enunciado/],
  ['enunciado de otro tipo', { prompt: {} }, /enunciado/],
  ['opciones que no son un arreglo', { options: 'Sí, No' }, /opciones/],
  ['selección múltiple con una opción', { options: ['A'] }, /entre 2 y 4 opciones/],
  ['selección múltiple con cinco opciones', { options: ['A', 'B', 'C', 'D', 'E'] }, /entre 2 y 4 opciones/],
  ['pregunta booleana con una opción', { type: 'boolean', options: ['Sí'] }, /exactamente 2 opciones/],
  ['pregunta booleana con tres opciones', { type: 'boolean', options: ['Sí', 'No', 'Quizá'] }, /exactamente 2 opciones/],
  ['opción vacía', { options: ['A', ' '] }, /cada opción/],
  ['opción de más de 120 caracteres', { options: ['A', 'B'.repeat(121)] }, /cada opción/],
  ['opción de otro tipo', { options: ['A', null] }, /cada opción/],
  ['opciones repetidas con espacios y mayúsculas', { options: [' Árbol ', 'áRBOL'] }, /opciones no pueden repetirse/],
  ['clave negativa', { correctIndex: -1 }, /clave/],
  ['clave igual al número de opciones', { options: ['A', 'B'], correctIndex: 2 }, /clave/],
  ['clave fraccionaria', { correctIndex: 0.5 }, /clave/],
  ['clave de otro tipo', { correctIndex: '1' }, /clave/],
  ['menos de 10 segundos', { seconds: 9 }, /tiempo/],
  ['más de 60 segundos', { seconds: 61 }, /tiempo/],
  ['segundos fraccionarios', { seconds: 10.5 }, /tiempo/],
  ['segundos de otro tipo', { seconds: '20' }, /tiempo/],
  ['menos de 50 puntos', { points: 49 }, /puntos/],
  ['más de 200 puntos', { points: 201 }, /puntos/],
  ['puntos fraccionarios', { points: 50.5 }, /puntos/],
  ['puntos de otro tipo', { points: '100' }, /puntos/],
  ['explicación de más de 500 caracteres', { explanation: 'E'.repeat(501) }, /explicación/],
  ['explicación de otro tipo', { explanation: null }, /explicación/],
];

for (const [name, overrides, error] of invalidQuestions) {
  test(`validateQuiz rechaza ${name} e indica la pregunta`, () => {
    const input = quiz(3);
    const result = validateQuiz({ ...input, questions: [
      input.questions[0],
      input.questions[1],
      { ...input.questions[2], ...overrides },
    ] });

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.match(result.error, /^Pregunta 3: /);
      assert.match(result.error, error);
    }
  });
}

test('validateQuiz rechaza una pregunta que no es un objeto e indica su posición', () => {
  assert.deepEqual(validateQuiz({ title: 'Prueba', questions: [question(), null] }), {
    ok: false,
    error: 'Pregunta 2: debe ser un objeto',
  });
});
