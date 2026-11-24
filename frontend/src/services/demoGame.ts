import type { PersonalResult, PublicRound, Quiz, RankingEntry, ServerToClientEvents } from '@chaos-arena/shared';
import { demoQuestions } from './demoQuestions';
import { GAME_KEY, readDemoRoom } from './demoRoom';
import { decodeQuiz } from './quizDraft';

export interface DemoGame {
  quiz?: Quiz;
  index: number;
  deadline: number;
  answers: (number | null)[];
  finished: boolean;
}

type RoundResult = Parameters<ServerToClientEvents['round:result']>[0];

// Respuestas fijas de Luna y Nova para que la clasificación se pueda reproducir.
const simulatedAnswers = [
  [1, 1, null],
  [0, 1, 2],
] as const;

export function gameQuestions(game: DemoGame) {
  return game.quiz?.questions ?? demoQuestions;
}

export function openDemoGame(quiz?: Quiz): DemoGame {
  const first = (quiz?.questions ?? demoQuestions)[0];
  if (!first) throw new Error('El cuestionario necesita al menos una pregunta.');
  return { quiz, index: 0, deadline: Date.now() + first.seconds * 1000, answers: [], finished: false };
}

export function readDemoGame(): DemoGame | undefined {
  try {
    const raw = sessionStorage.getItem(GAME_KEY);
    if (!raw) return undefined;
    const game = JSON.parse(raw) as Partial<DemoGame> | null;
    if (!game) return undefined;
    if (game.quiz !== undefined) game.quiz = decodeQuiz(JSON.stringify(game.quiz));
    const questions = game.quiz?.questions ?? demoQuestions;
    if (typeof game.index !== 'number' || !Number.isInteger(game.index)
      || game.index < 0 || game.index >= questions.length || !Number.isFinite(game.deadline)
      || !Array.isArray(game.answers) || typeof game.finished !== 'boolean'
      || game.answers.length < game.index || game.answers.length > game.index + 1
      || (game.finished && game.answers.length !== questions.length)
      || !game.answers.every((answer, index) => answer === null
        || (Number.isInteger(answer) && answer >= 0 && answer < questions[index].options.length))) {
      return undefined;
    }
    return game as DemoGame;
  } catch {
    return undefined;
  }
}

export function writeDemoGame(game: DemoGame) {
  sessionStorage.setItem(GAME_KEY, JSON.stringify(game));
}

export function demoRound(game: DemoGame): PublicRound {
  const { id, prompt, options } = gameQuestions(game)[game.index];
  return { roundId: id, prompt, options, deadline: game.deadline };
}

export function settleDemoRound(game: DemoGame, optionIndex: number | null, now: number): DemoGame {
  if (game.finished || game.answers.length > game.index) return game;
  const question = gameQuestions(game)[game.index];
  const timely = now < game.deadline;

  if ((optionIndex === null && timely)
    || (optionIndex !== null && (!Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex >= question.options.length))) {
    return game;
  }
  return { ...game, answers: [...game.answers, timely ? optionIndex : null] };
}

export function advanceDemoGame(game: DemoGame): DemoGame {
  if (game.finished || game.answers.length <= game.index) return game;
  const next = gameQuestions(game)[game.index + 1];
  if (!next) return { ...game, finished: true };
  return { ...game, index: game.index + 1, deadline: Date.now() + next.seconds * 1000 };
}

function mockAnswers(game: DemoGame, playerIndex: number) {
  if (!game.quiz) return simulatedAnswers[playerIndex];
  return game.quiz.questions.map((question, index) => (index + playerIndex) % 2 === 0
    ? question.correctIndex
    : (question.correctIndex + 1) % question.options.length);
}

function scoreAnswers(game: DemoGame, answers: readonly (number | null)[], count: number) {
  const questions = gameQuestions(game);
  let score = 0;
  let correctCount = 0;
  for (let index = 0; index < count; index++) {
    const question = questions[index];
    if (answers[index] === question.correctIndex) {
      score += question.points;
      correctCount++;
    }
  }
  return { score, correctCount };
}

export function demoRanking(game: DemoGame): RankingEntry[] {
  const room = readDemoRoom();
  if (!room) return [];

  const players = room.snapshot.players.map((player, index) => ({
    ...player,
    ...scoreAnswers(game, player.id === room.playerId ? game.answers : mockAnswers(game, index), game.answers.length),
  }));
  players.sort((a, b) => b.score - a.score || b.correctCount - a.correctCount);
  let rank = 0;
  return players.map(({ correctCount, ...player }, index) => {
    const previous = players[index - 1];
    if (!previous || previous.score !== player.score || previous.correctCount !== correctCount) rank = index + 1;
    return { ...player, rank };
  });
}

export function demoRoundResult(game: DemoGame): RoundResult | undefined {
  if (game.answers.length <= game.index) return undefined;
  const question = gameQuestions(game)[game.index];
  const counts = question.options.map(() => 0);
  for (const answer of [game.answers[game.index], ...[0, 1].map(player => mockAnswers(game, player)[game.index])]) {
    if (answer !== null) counts[answer]++;
  }
  return {
    roundId: question.id,
    correctIndex: question.correctIndex,
    explanation: question.explanation,
    counts,
    ranking: demoRanking(game),
  };
}

export function demoPersonalResult(game: DemoGame, playerId: string): PersonalResult {
  const validQuestionCount = gameQuestions(game).length;
  const { score, correctCount } = scoreAnswers(game, game.answers, validQuestionCount);
  return {
    playerId,
    score,
    correctCount,
    validQuestionCount,
    academicPercentage: 100 * correctCount / validQuestionCount,
  };
}
