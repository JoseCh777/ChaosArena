import type { ClipCue, ProjectionClips } from './live.js';

export const DEFAULT_ROUND_SECONDS: 30;
export const ROUND_SECONDS_MIN: 10;
export const ROUND_SECONDS_MAX: 60;
export const CLIP_CUES: readonly ClipCue[];
export const DEFAULT_CLIPS: Readonly<ProjectionClips>;

export const ARENA_PACE: Readonly<{
  introMs: number;
  revealMs: number;
  roundClipMs: number;
  blindClipMs: number;
  streakClipMs: number;
  rouletteSpinMs: number;
  rouletteResultMs: number;
  duelResultMs: number;
  podiumRevealMs: number;
  roundTimeoutMs: number;
  streakMs: number;
  leaderMs: number;
  voteOpenMs: number;
  voteClosedMs: number;
  expelledMs: number;
  podiumWinnerMs: number;
}>;
