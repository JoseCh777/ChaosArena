import type { ChaosEvent, PublicRound, Quiz, RankingEntry } from '@chaos-arena/shared';

export interface LiveEvent {
  type: ChaosEvent;
  targets: string[];
  description: string;
  started: number;
}
export interface ArenaView {
  phase: 'lobby' | 'question' | 'reveal' | 'roulette' | 'vote' | 'finished';
  serverNow: number;
  pin: string;
  you: string;
  host: boolean;
  players: RankingEntry[];
  number: number;
  total: number;
  received: number;
  choice: number | null;
  correctCount: number;
  round?: PublicRound;
  seconds: number;
  solution?: { index: number; explanation?: string; counts: number[] };
  event?: LiveEvent;
  voted?: boolean;
  voting?: { id: string; deadline: number; received: number; candidates: string[] };
  summary?: { id: string; correct: number }[];
}
export type DisplayView = Omit<ArenaView, 'you' | 'host' | 'choice' | 'correctCount' | 'summary' | 'voted'>;

export interface ArenaCommands {
  observe: Record<string, never>;
  join: { pin: string; nickname: string };
  resume: { token: string };
  start: { quiz?: Quiz; voting?: boolean };
  vote: { id: string; target: string | null };
  answer: { roundId: string; choice: number };
  removePlayer: { id: string };
  leave: Record<string, never>;
}
export type Reply = { ok: true; token?: string } | { ok: false; error: string };

export interface ArenaHostCommands {
  create: { nickname: string; hostKey?: string };
}
