import { randomUUID } from 'node:crypto';
import type { Quiz } from '@chaos-arena/shared';
import type { ArenaView, LiveEvent } from '../../shared/live.js';
import { rollEffect } from './arenaEffects.js';

export interface Member {
  id: string;
  nickname: string;
  score: number;
  correct: number;
  streak: number;
  choice: number | null;
  ghost?: boolean;
}

export class LiveRound {
  phase: ArenaView['phase'] = 'lobby';
  index = 0;
  id = '';
  deadline = 0;
  quiz: Quiz = { title: '', questions: [] };
  event?: LiveEvent;
  private timer?: ReturnType<typeof setTimeout>;
  voting?: { id: string; deadline: number; votes: Map<string, string | null> };
  private votingEnabled = true;
  private doubled = false;
  private firstCorrect = '';

  constructor(readonly members: Map<string, Member>, private readonly publish: () => void) {}

  stop() { clearTimeout(this.timer); }

  start(quiz: Quiz, voting = true) {
    this.stop();
    this.quiz = quiz;
    this.votingEnabled = voting;
    this.voting = undefined;
    this.index = 0;
    this.event = undefined;
    this.doubled = false;
    for (const p of this.members.values()) Object.assign(p, { score: 0, correct: 0, streak: 0, ghost: false });
    this.open();
  }

  private open() {
    this.phase = 'question';
    this.id = randomUUID();
    this.firstCorrect = '';
    this.event = undefined;
    for (const p of this.members.values()) p.choice = null;
    this.deadline = Date.now() + this.quiz.questions[this.index].seconds * 1000;
    this.timer = setTimeout(() => this.close(false), Math.max(0, this.deadline - Date.now()));
    this.publish();
  }

  answer(player: Member, roundId: string, choice: number) {
    const question = this.quiz.questions[this.index];
    if (this.phase !== 'question' || roundId !== this.id || player.choice !== null
      || Date.now() >= this.deadline || !Number.isInteger(choice) || choice < 0 || choice >= question.options.length) return false;
    player.choice = choice;
    if (!player.ghost && !this.firstCorrect && choice === question.correctIndex) this.firstCorrect = player.id;
    if ([...this.members.values()].every(p => p.choice !== null)) this.close(true);
    else this.publish();
    return true;
  }

  private close(allAnswered: boolean) {
    if (this.phase !== 'question') return;
    this.stop();
    this.phase = 'reveal';
    const question = this.quiz.questions[this.index];
    const players = [...this.members.values()];
    for (const p of players) {
      if (p.choice === question.correctIndex) {
        p.correct++;
        if (p.ghost) continue;
        p.streak++;
        p.score += question.points * (this.doubled ? 2 : 1) + (p.id === this.firstCorrect ? 50 : 0);
        if (p.streak === 3) p.score += 150;
        if (p.streak === 5) p.score += 300;
      } else {
        p.streak = 0;
        if (!p.ghost && this.doubled && p.choice !== null) p.score = Math.max(0, p.score - 50);
      }
    }
    const final = this.index + 1 === this.quiz.questions.length;
    this.doubled = false;
    this.publish();
    const advance = () => {
      if (final) { this.phase = 'finished'; this.publish(); }
      else { this.index++; this.open(); }
    };
    this.timer = setTimeout(() => {
      this.event = allAnswered ? rollEffect(players.filter(p => !p.ghost), final) : undefined;
      if (!this.event) {
        const active = players.filter(p => !p.ghost);
        if (this.votingEnabled && !final && [5, 10].includes(this.index + 1) && active.length >= 3) {
          this.openVote(active, advance);
        } else advance();
        return;
      }
      this.phase = 'roulette';
      this.doubled = this.event.type === 'double-or-nothing';
      this.publish();
      this.timer = setTimeout(advance, 5400);
    }, 3500);
  }

  vote(player: Member, id: string, target: string | null) {
    const voting = this.voting;
    if (!voting || voting.id !== id || player.ghost || voting.votes.has(player.id)
      || Date.now() >= voting.deadline || target === player.id) return false;
    if (target !== null && ![...this.members.values()].some(p => p.id === target && !p.ghost)) return false;
    voting.votes.set(player.id, target);
    this.publish();
    return true;
  }

  private openVote(active: Member[], advance: () => void) {
    const votes = new Map<string, string | null>();
    this.voting = { id: randomUUID(), deadline: Date.now() + 20000, votes };
    this.phase = 'vote';
    this.publish();
    this.timer = setTimeout(() => {
      if (votes.size >= 3) {
        const counts = new Map<string | null, number>();
        for (const target of votes.values()) counts.set(target, (counts.get(target) ?? 0) + 1);
        const ranked = [...counts].sort((a, b) => b[1] - a[1]);
        const [first, second] = ranked;
        if (first[0] !== null && first[1] > (second?.[1] ?? 0)) {
          const member = active.find(p => p.id === first[0]);
          if (member) member.ghost = true;
        }
      }
      this.voting = undefined;
      advance();
    }, 20000);
  }
}
