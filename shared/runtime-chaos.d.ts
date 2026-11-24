import type { ChaosEvent } from '@chaos-arena/shared';
import type { ArenaView, ConfiguredDisplayView, LiveEvent } from './live.js';

export type RuntimeEvent = ChaosEvent | 'error-404' | 'firewall' | 'duel' | 'respawn';
export type Power = 'proxy' | 'decorator' | 'memento' | 'adapter' | 'prototype' | 'command';
export type EventImpact = 'loss' | 'reward' | 'shield' | 'blocked';
export type RuntimeLiveEvent = Omit<LiveEvent, 'type'> & { type: RuntimeEvent; impact?: EventImpact; wheel?: RuntimeEvent[] };
export type MediaOutput = 'host' | 'display';
export interface ShowFact {
  id: string;
  started: number;
  kind: 'intro' | 'timeout' | 'correct' | 'none' | 'streak' | 'leader' | 'vote-open'
    | 'vote-closed' | 'expelled' | 'final' | 'shield';
  title: string;
  detail?: string;
}
export type Reaction = 'racha' | 'todos-aciertan' | 'nadie-acierta' | 'empate' | 'expulsion';

export interface DuelView {
  id: string;
  stage: 'invite' | 'question' | 'result';
  deadline: number;
  players: { id: string; nickname: string }[];
  prompt?: string;
  options?: string[];
  correctIndex?: number;
  result?: string;
}
export interface PrivateChaos {
  items: Power[];
  available: Power[];
  shield: boolean;
  suppressed: boolean;
  accepted?: boolean;
  answered?: boolean;
  hiddenOptions?: number[];
}

export interface ShowSettings {
  output: MediaOutput;
  sound: boolean;
  videos: boolean;
  reactions: boolean;
  volume: number;
}

export type ShowChange = { key: 'volume'; value: number }
  | { key: 'output'; value: MediaOutput }
  | { key: 'sound' | 'videos' | 'reactions'; value: boolean };
export type HostRoundAction = 'pause' | 'resume' | 'close' | 'skipEvent' | 'skipRoulette' | 'cancelVote';

export type ArenaAward = { kind: 'streak' | 'comeback' | 'accuracy'; names: string[]; amount?: number };

export interface RuntimePublic {
  voterCount?: number;
  roundStage?: 'regular' | 'boss';
  awards?: ArenaAward[];
  pausedMs?: number;
  showFact?: ShowFact;
  show?: ShowSettings;
  chaosEvent?: RuntimeLiveEvent;
  duel?: DuelView;
  protectedIds?: string[];
  reaction?: { id: string; kind: Reaction; started: number };
}
export type RuntimeArenaView = ArenaView & Pick<ConfiguredDisplayView, 'clips'> & RuntimePublic & { chaos?: PrivateChaos; canVote?: boolean; canSkipEvent?: boolean };
export type RuntimeDisplayView = ConfiguredDisplayView & RuntimePublic;

export interface RuntimeCommands {
  hostRound: { action: HostRoundAction; id: string };
  hostShow: ShowChange;
  usePower: { power: Power; target?: string };
  duelConsent: { id: string; accepted: boolean };
  duelAnswer: { id: string; choice: number };
}
