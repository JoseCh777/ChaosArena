import type { Question } from '@chaos-arena/shared';

export function shuffleQuestions(questions: readonly Question[], random: () => number): Question[] {
  const shuffled = [...questions];
  for (let index = shuffled.length - 1; index > 0; index--) {
    const target = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
  }
  return shuffled;
}
