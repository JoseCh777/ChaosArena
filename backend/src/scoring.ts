import type { PersonalResult, Question, RankingEntry } from '@chaos-arena/shared';
import type { PlayerRoundOutcome, PlayerState, RoundModifier, Submission } from './model.js';

/**
 * Reglas de puntuación. Funciones puras: no mutan argumentos.
 * DUEÑO: Codex (tarea A). Ver backend/AGENTS.md para las reglas exactas.
 */

export const FIRST_CORRECT_BONUS = 50;
export const STREAK_BONUSES: Readonly<Record<number, number>> = { 3: 150, 5: 300 };

export interface RoundScoreInput {
  question: Question;
  /** Todos los jugadores de la sala (activos y fantasmas). */
  players: readonly PlayerState[];
  submissions: readonly Submission[];
  modifier?: RoundModifier;
}

/**
 * Devuelve un outcome por cada jugador de `players`, en el mismo orden.
 * TODO(codex): primer acierto, rachas, fantasmas y Doble o nada. Este stub solo suma la base.
 */
export function scoreRound(input: RoundScoreInput): PlayerRoundOutcome[] {
  const byPlayer = new Map(input.submissions.map((s) => [s.playerId, s]));
  return input.players.map((player) => {
    const submission = byPlayer.get(player.id);
    const correct = submission?.optionIndex === input.question.correctIndex;
    return {
      playerId: player.id,
      answered: Boolean(submission),
      correct,
      pointsDelta: correct && player.status === 'active' ? input.question.points : 0,
      firstCorrectBonus: 0,
      streakBonus: 0,
      newStreak: correct ? player.streak + 1 : 0,
    };
  });
}

/** Conteo de respuestas por opción. */
export function countAnswers(question: Question, submissions: readonly Submission[]): number[] {
  const counts = question.options.map(() => 0);
  for (const s of submissions) if (s.optionIndex >= 0 && s.optionIndex < counts.length) counts[s.optionIndex]++;
  return counts;
}

/**
 * Ranking por puntos desc y luego aciertos desc. Empate total comparte posición (1, 1, 3).
 * TODO(codex): verificar posiciones compartidas y orden estable con tests.
 */
export function buildRanking(players: readonly PlayerState[]): RankingEntry[] {
  const sorted = [...players].sort(
    (a, b) => b.score - a.score || b.correctCount - a.correctCount || a.joinedAt - b.joinedAt,
  );
  return sorted.map((p, i) => ({
    id: p.id,
    nickname: p.nickname,
    score: p.score,
    status: p.status,
    rank: i + 1,
  }));
}

/** Resultado académico individual. validQuestionCount = preguntas cerradas en la partida. */
export function personalResult(player: PlayerState, validQuestionCount: number): PersonalResult {
  return {
    playerId: player.id,
    score: player.score,
    correctCount: player.correctCount,
    validQuestionCount,
    academicPercentage: validQuestionCount === 0 ? 0 : Math.round((player.correctCount / validQuestionCount) * 10000) / 100,
  };
}
