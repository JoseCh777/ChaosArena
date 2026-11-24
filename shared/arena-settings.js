export const DEFAULT_ROUND_SECONDS = 30;
export const ROUND_SECONDS_MIN = 10;
export const ROUND_SECONDS_MAX = 60;
export const CLIP_CUES = Object.freeze(['inicio', 'votacion', 'ruleta', 'podio']);
export const DEFAULT_CLIPS = Object.freeze({ inicio: 'inicio', votacion: 'votacion', ruleta: 'ruleta', podio: 'podio' });

export const ARENA_PACE = Object.freeze({
  introMs: 3300,
  revealMs: 1750,
  roundClipMs: 1900,
  blindClipMs: 12000,
  streakClipMs: 16000,
  rouletteSpinMs: 1450,
  rouletteResultMs: 3500,
  duelResultMs: 1400,
  podiumRevealMs: 2550,
  roundTimeoutMs: 1900,
  streakMs: 2450,
  leaderMs: 2550,
  voteOpenMs: 1550,
  voteClosedMs: 3300,
  expelledMs: 6000,
  podiumWinnerMs: 277000,
});
