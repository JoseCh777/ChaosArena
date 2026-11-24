/** Contrato inicial. Los cambios se acuerdan entre Jose y Daniel. */
export type Phase = 'lobby' | 'question' | 'results' | 'event' | 'voting' | 'finished';
export type PlayerStatus = 'active' | 'ghost';
export type GameCommand = 'start' | 'close' | 'next' | 'event' | 'vote' | 'finish';
export type ChaosEvent = 'black-hole' | 'double-or-nothing' | 'loot-box' | 'hack';
export type Role = 'host' | 'player' | 'display';
/** Códigos de error estables. El frontend traduce cada código a un mensaje. */
export type ErrorCode =
  | 'BAD_REQUEST'
  | 'RATE_LIMITED'
  | 'UNAUTHORIZED'
  | 'ROOM_EXISTS'
  | 'ROOM_NOT_FOUND'
  | 'ROOM_LOCKED'
  | 'NICKNAME_INVALID'
  | 'NICKNAME_TAKEN'
  | 'QUIZ_INVALID'
  | 'WRONG_PHASE'
  | 'ROUND_CLOSED'
  | 'ALREADY_ANSWERED'
  | 'OPTION_INVALID'
  | 'VOTE_CLOSED'
  | 'ALREADY_VOTED'
  | 'TARGET_INVALID'
  | 'NOT_ACTIVE'
  | 'NOT_ENOUGH_PLAYERS';
export type Ack<T = void> = (result: { ok: true; data: T } | { ok: false; error: ErrorCode | string }) => void;
export interface RoomOptions { votingEnabled: boolean }

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

/** Progreso de la ronda, solo para anfitrión y proyector. No revela qué eligió cada jugador. */
export interface RoundProgress { roundId: string; answered: number; expected: number }
/** Estado privado del jugador durante la partida. */
export interface PlayerPrivateView {
  playerId: string;
  nickname: string;
  status: PlayerStatus;
  score: number;
  streak: number;
  /** Respuesta enviada en la ronda abierta, si existe. */
  answeredRoundId?: string;
  /** Resultado propio de la última ronda cerrada. */
  lastRound?: { roundId: string; correct: boolean; pointsDelta: number };
}

export interface ClientToServerEvents {
  'room:create': (
    data: { quiz: Quiz; hostKey: string; options?: Partial<RoomOptions> },
    ack: Ack<{ pin: string; hostToken: string }>,
  ) => void;
  'room:join': (data: { pin: string; nickname: string }, ack: Ack<{ playerId: string; playerToken: string }>) => void;
  /** Proyector se suscribe a la sala con el PIN. No recibe credenciales. */
  'room:watch': (data: { pin: string }, ack: Ack<PublicSnapshot>) => void;
  /** Anfitrión retira un apodo. Solo en lobby. */
  'host:kick': (data: { hostToken: string; playerId: string }, ack: Ack) => void;
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
  /** Cierre de votación. expelledId null si ganó Omitir, hubo empate o faltaron votos. Votos individuales nunca se envían. */
  'vote:result': (data: { voteId: string; expelledId: string | null; validVotes: number; players: PublicPlayer[] }) => void;
  'round:progress': (data: RoundProgress) => void;
  'player:private': (data: PlayerPrivateView) => void;
  /** El anfitrión retiró a este jugador. El cliente vuelve al ingreso. */
  'player:kicked': () => void;
  'media:play': (data: { mediaId: string; triggerId: string }) => void;
  'game:finished': (data: FinishedView) => void;
}
