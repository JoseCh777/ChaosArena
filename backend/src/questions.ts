import type { PublicRound, Question, Quiz } from '@chaos-arena/shared';

/**
 * Validación del cuestionario y vistas sin soluciones.
 * DUEÑO: Codex (tarea A). Ver backend/AGENTS.md para reglas y límites.
 */

export const QUIZ_LIMITS = {
  maxQuestions: 50,
  maxTitle: 100,
  maxId: 40,
  maxPrompt: 300,
  maxOption: 120,
  maxExplanation: 500,
  minSeconds: 10,
  maxSeconds: 60,
  minPoints: 50,
  maxPoints: 200,
} as const;

export type QuizValidation = { ok: true; quiz: Quiz } | { ok: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readText(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const text = value.trim();
  return text.length >= 1 && text.length <= maxLength ? text : undefined;
}

function isIntegerInRange(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
}

/**
 * Recibe datos no confiables del socket. Devuelve una copia limpia (trim, sin campos extra)
 * o el primer error con un mensaje legible que indique la pregunta afectada.
 */
export function validateQuiz(input: unknown): QuizValidation {
  if (!isRecord(input)) return { ok: false, error: 'El cuestionario debe ser un objeto' };

  const title = readText(input.title, QUIZ_LIMITS.maxTitle);
  if (!title) return { ok: false, error: `El título debe tener entre 1 y ${QUIZ_LIMITS.maxTitle} caracteres` };

  const rawQuestions = input.questions;
  if (!Array.isArray(rawQuestions) || rawQuestions.length < 1 || rawQuestions.length > QUIZ_LIMITS.maxQuestions) {
    return { ok: false, error: `El cuestionario debe tener entre 1 y ${QUIZ_LIMITS.maxQuestions} preguntas` };
  }

  const ids = new Set<string>();
  const questions: Question[] = [];
  for (const [index, rawQuestion] of rawQuestions.entries()) {
    const invalid = (message: string): QuizValidation => ({ ok: false, error: `Pregunta ${index + 1}: ${message}` });
    if (!isRecord(rawQuestion)) return invalid('debe ser un objeto');

    const id = readText(rawQuestion.id, QUIZ_LIMITS.maxId);
    if (!id) return invalid(`el ID debe tener entre 1 y ${QUIZ_LIMITS.maxId} caracteres`);
    if (ids.has(id)) return invalid('el ID está repetido');

    const type = typeof rawQuestion.type === 'string' ? rawQuestion.type.trim() : undefined;
    if (type !== 'multiple' && type !== 'boolean') return invalid('el tipo debe ser multiple o boolean');

    const prompt = readText(rawQuestion.prompt, QUIZ_LIMITS.maxPrompt);
    if (!prompt) return invalid(`el enunciado debe tener entre 1 y ${QUIZ_LIMITS.maxPrompt} caracteres`);

    const rawOptions = rawQuestion.options;
    const maxOptions = type === 'multiple' ? 4 : 2;
    if (!Array.isArray(rawOptions) || rawOptions.length < 2 || rawOptions.length > maxOptions) {
      return invalid(type === 'multiple' ? 'debe tener entre 2 y 4 opciones' : 'debe tener exactamente 2 opciones');
    }

    const options: string[] = [];
    const seenOptions = new Set<string>();
    for (const rawOption of rawOptions) {
      const option = readText(rawOption, QUIZ_LIMITS.maxOption);
      if (!option) return invalid(`cada opción debe tener entre 1 y ${QUIZ_LIMITS.maxOption} caracteres`);
      const normalized = option.toLowerCase();
      if (seenOptions.has(normalized)) return invalid('las opciones no pueden repetirse');
      seenOptions.add(normalized);
      options.push(option);
    }

    const { correctIndex, seconds, points } = rawQuestion;
    if (!isIntegerInRange(correctIndex, 0, options.length - 1)) return invalid('la clave está fuera de rango');
    if (!isIntegerInRange(seconds, QUIZ_LIMITS.minSeconds, QUIZ_LIMITS.maxSeconds)) {
      return invalid(`el tiempo debe ser un entero entre ${QUIZ_LIMITS.minSeconds} y ${QUIZ_LIMITS.maxSeconds} segundos`);
    }
    if (!isIntegerInRange(points, QUIZ_LIMITS.minPoints, QUIZ_LIMITS.maxPoints)) {
      return invalid(`los puntos deben ser un entero entre ${QUIZ_LIMITS.minPoints} y ${QUIZ_LIMITS.maxPoints}`);
    }

    const question: Question = { id, type, prompt, options, correctIndex, seconds, points };
    if (rawQuestion.explanation !== undefined) {
      if (typeof rawQuestion.explanation !== 'string') return invalid('la explicación debe ser texto');
      const explanation = rawQuestion.explanation.trim();
      if (explanation.length > QUIZ_LIMITS.maxExplanation) {
        return invalid(`la explicación debe tener como máximo ${QUIZ_LIMITS.maxExplanation} caracteres`);
      }
      if (explanation) question.explanation = explanation;
    }

    ids.add(id);
    questions.push(question);
  }

  return { ok: true, quiz: { title, questions } };
}

/** Vista pública de la pregunta: sin correctIndex ni explicación. */
export function toPublicRound(question: Question, roundId: string, deadline: number): PublicRound {
  return { roundId, prompt: question.prompt, options: [...question.options], deadline };
}
