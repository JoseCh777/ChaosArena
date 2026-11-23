/** Contrato inicial. Los cambios se acuerdan entre Jose y Daniel. */
export type Phase = 'lobby' | 'question' | 'results' | 'event' | 'voting' | 'finished';
export type PlayerStatus = 'active' | 'ghost';
export type GameCommand = 'start' | 'close' | 'next' | 'event' | 'vote' | 'finish';
export type ChaosEvent = 'black-hole' | 'double-or-nothing' | 'loot-box' | 'hack';
export type Ack<T = void> = (result: { ok: true; data: T } | { ok: false; error: string }) => void;

export interface Question {
  id: string;
  type: 'multiple' | 'boolean';
  prompt: string;
  options: string[];
  correctIndex: number;
  seconds: number;
  points: number;
  explanation?: string;
}
export interface Quiz { title: string; questions: Question[] }
export interface PublicPlayer {
  id: string;
  nickname: string;
  score: number;
  status: PlayerStatus;
}
export interface RankingEntry extends PublicPlayer { rank: number }
export interface PublicRound {
  roundId: string;
  prompt: string;
  options: string[];
  deadline: number;
}
export interface PublicSnapshot {
  pin: string;
  phase: Phase;
  players: PublicPlayer[];
  questionIndex: number;
  questionCount: number;
  round?: PublicRound;
}
export interface PersonalResult {
  playerId: string;
  score: number;
  correctCount: number;
  validQuestionCount: number;
  academicPercentage: number;
}
export type FinishedView =
  | { role: 'display'; podium: RankingEntry[] }
  | { role: 'player'; podium: RankingEntry[]; personal: PersonalResult }
  | { role: 'host'; podium: RankingEntry[]; results: PersonalResult[] };

export interface ClientToServerEvents {
  'room:create': (data: { quiz: Quiz; hostKey: string }, ack: Ack<{ pin: string; hostToken: string }>) => void;
  'room:join': (data: { pin: string; nickname: string }, ack: Ack<{ playerId: string; playerToken: string }>) => void;
  'game:control': (data: { hostToken: string; command: GameCommand }, ack: Ack) => void;
  'answer:submit': (data: { token: string; roundId: string; optionIndex: number }, ack: Ack) => void;
  'vote:submit': (data: { token: string; voteId: string; target: string | null }, ack: Ack) => void;
}
export interface ServerToClientEvents {
  'room:snapshot': (data: PublicSnapshot) => void;
  'round:open': (data: PublicRound) => void;
  'round:result': (data: { roundId: string; correctIndex: number; explanation?: string; counts: number[]; ranking: RankingEntry[] }) => void;
  'event:result': (data: { eventId: string; type: ChaosEvent; targets: string[]; players: PublicPlayer[] }) => void;
  'vote:open': (data: { voteId: string; candidates: PublicPlayer[]; deadline: number }) => void;
  'media:play': (data: { mediaId: string; triggerId: string }) => void;
  'game:finished': (data: FinishedView) => void;
}
