import type { ChaosEvent, PublicRound, Quiz, RankingEntry } from './types.js';

export interface LiveEvent {
  type: ChaosEvent;
  targets: string[];
  description: string;
  started: number;
}
export interface ArenaView {
  phase: 'lobby' | 'question' | 'reveal' | 'roulette' | 'finished';
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
}
export interface ArenaCommands {
  join: { pin: string; nickname: string };
  resume: { token: string };
  start: { quiz?: Quiz };
  answer: { roundId: string; choice: number };
  leave: Record<string, never>;
}
export type Reply = { ok: true; token?: string } | { ok: false; error: string };
