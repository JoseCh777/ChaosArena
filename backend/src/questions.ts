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

/**
 * Recibe datos no confiables del socket. Devuelve una copia limpia (trim, sin campos extra)
 * o el primer error con un mensaje legible que indique la pregunta afectada.
 *
 * TODO(codex): implementar todas las reglas de AGENTS.md. Este stub solo comprueba la forma mínima.
 */
export function validateQuiz(input: unknown): QuizValidation {
  const quiz = input as Quiz;
  if (!quiz || !Array.isArray(quiz.questions) || quiz.questions.length === 0) {
    return { ok: false, error: 'El cuestionario no tiene preguntas' };
  }
  return { ok: true, quiz: structuredClone(quiz) };
}

/** Vista pública de la pregunta: sin correctIndex ni explicación. */
export function toPublicRound(question: Question, roundId: string, deadline: number): PublicRound {
  return { roundId, prompt: question.prompt, options: [...question.options], deadline };
}
