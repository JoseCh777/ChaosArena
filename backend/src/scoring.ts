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

/** Devuelve un resultado por cada jugador de `players`, en el mismo orden. */
export function scoreRound(input: RoundScoreInput): PlayerRoundOutcome[] {
  const { question, players, submissions, modifier } = input;
  const activeIds = new Set(players.filter((player) => player.status === 'active').map((player) => player.id));
  const byPlayer = new Map<string, Submission>();
  let firstCorrect: Submission | undefined;

  for (const submission of submissions) {
    byPlayer.set(submission.playerId, submission);
    if (submission.optionIndex !== question.correctIndex || !activeIds.has(submission.playerId)) continue;
    if (!firstCorrect || submission.receivedAt < firstCorrect.receivedAt) firstCorrect = submission;
  }

  const basePoints = question.points * (modifier?.baseMultiplier ?? 1);
  return players.map((player) => {
    const submission = byPlayer.get(player.id);
    const correct = submission?.optionIndex === question.correctIndex;
    const active = player.status === 'active';
    const scoredCorrectly = active && correct;
    const newStreak = scoredCorrectly ? player.streak + 1 : 0;
    const streakBonus = STREAK_BONUSES[newStreak] ?? 0;
    const firstCorrectBonus = player.id === firstCorrect?.playerId ? FIRST_CORRECT_BONUS : 0;

    let pointsDelta = 0;
    if (scoredCorrectly) pointsDelta = basePoints + firstCorrectBonus + streakBonus;
    else if (active && modifier) pointsDelta = -modifier.wrongPenalty;

    return {
      playerId: player.id,
      answered: Boolean(submission),
      correct,
      pointsDelta,
      firstCorrectBonus,
      streakBonus,
      newStreak,
    };
  });
}

/** Conteo de respuestas por opción. */
export function countAnswers(question: Question, submissions: readonly Submission[]): number[] {
  const counts = question.options.map(() => 0);
  for (const s of submissions) if (s.optionIndex >= 0 && s.optionIndex < counts.length) counts[s.optionIndex]++;
  return counts;
}

/** Ranking por puntos y aciertos descendentes, con posición compartida en caso de empate. */
export function buildRanking(players: readonly PlayerState[]): RankingEntry[] {
  const sorted = [...players].sort(
    (a, b) => b.score - a.score || b.correctCount - a.correctCount || a.joinedAt - b.joinedAt,
  );
  let rank = 0;
  return sorted.map((player, index) => {
    const previous = sorted[index - 1];
    if (!previous || player.score !== previous.score || player.correctCount !== previous.correctCount) rank = index + 1;
    return { id: player.id, nickname: player.nickname, score: player.score, status: player.status, rank };
  });
}

/** Resultado académico individual. validQuestionCount = preguntas cerradas en la partida. */
export function personalResult(player: PlayerState, validQuestionCount: number): PersonalResult {
  const academicPercentage = validQuestionCount === 0
    ? 0
    : Math.round((player.correctCount / validQuestionCount) * 10000) / 100;
  return {
    playerId: player.id,
    score: player.score,
    correctCount: player.correctCount,
    validQuestionCount,
    academicPercentage,
  };
}
