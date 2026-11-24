import type { ChaosEvent } from '@chaos-arena/shared';
import type { ArenaView, ConfiguredDisplayView, LiveEvent } from './live.js';

export type RuntimeEvent = ChaosEvent | 'error-404' | 'firewall' | 'duel' | 'respawn';
export type Power = 'proxy' | 'decorator' | 'memento' | 'adapter' | 'prototype' | 'command';
export type RuntimeLiveEvent = Omit<LiveEvent, 'type'> & { type: RuntimeEvent };
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
  sound: boolean;
  videos: boolean;
  reactions: boolean;
  volume: number;
}

export type ShowChange = { key: 'volume'; value: number }
  | { key: 'sound' | 'videos' | 'reactions'; value: boolean };
export type HostRoundAction = 'pause' | 'resume' | 'close' | 'skipEvent' | 'skipRoulette' | 'cancelVote';

export interface RuntimePublic {
  pausedMs?: number;
  show?: ShowSettings;
  chaosEvent?: RuntimeLiveEvent;
  duel?: DuelView;
  protectedIds?: string[];
  reaction?: { id: string; kind: Reaction; started: number };
}
export type RuntimeArenaView = ArenaView & Pick<ConfiguredDisplayView, 'clips'> & RuntimePublic & { chaos?: PrivateChaos; canSkipEvent?: boolean };
export type RuntimeDisplayView = ConfiguredDisplayView & RuntimePublic;

export interface RuntimeCommands {
  hostRound: { action: HostRoundAction; id: string };
  hostShow: ShowChange;
  usePower: { power: Power; target?: string };
  duelConsent: { id: string; accepted: boolean };
  duelAnswer: { id: string; choice: number };
}
