import { DEFAULT_ROUND_SECONDS } from '@chaos-arena/shared/arena-settings.js';
import type { Question, Quiz } from '@chaos-arena/shared';

export const DRAFT_KEY = 'chaos-arena.quiz-draft';
export const BOOLEAN_OPTIONS = ['Verdadero', 'Falso'];
export const emptyQuiz: Quiz = { title: '', questions: [] };

export function newQuestion(): Question {
  return {
    id: Array.from(crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, '0')).join(''),
    type: 'multiple',
    prompt: '',
    options: ['', ''],
    correctIndex: 0,
    seconds: DEFAULT_ROUND_SECONDS,
    points: 100,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isInteger(value: unknown, minimum: number, maximum: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= minimum && value <= maximum;
}

function isQuestion(value: unknown): value is Question {
  if (!isRecord(value) || !isText(value.id) || !isText(value.prompt)) return false;
  const { type, options, correctIndex, seconds, points, explanation } = value;
  if (!Array.isArray(options) || !options.every(isText)) return false;

  const validOptions = type === 'boolean'
    ? options.length === 2 && options.every((option, index) => option === BOOLEAN_OPTIONS[index])
    : type === 'multiple' && options.length >= 2 && options.length <= 4;

  return validOptions && isInteger(correctIndex, 0, options.length - 1)
    && isInteger(seconds, 10, 60) && isInteger(points, 50, 200)
    && (explanation === undefined || typeof explanation === 'string');
}

export function decodeQuiz(json: string, draft = false): Quiz {
  const value: unknown = JSON.parse(json);
  if (!isRecord(value) || typeof value.title !== 'string' || !Array.isArray(value.questions)
    || (!draft && !isText(value.title)) || !value.questions.every(isQuestion)
    || new Set(value.questions.map(question => question.id)).size !== value.questions.length) {
    throw new Error('El archivo no es un cuestionario válido. Revisa el título y los campos de cada pregunta.');
  }
  return { title: value.title, questions: value.questions };
}

export function downloadQuiz(quiz: Quiz) {
  const json = JSON.stringify(quiz, null, 2);
  decodeQuiz(json);
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'chaos-arena-cuestionario.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
