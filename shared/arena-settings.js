export const DEFAULT_ROUND_SECONDS = 30;
export const ROUND_SECONDS_MIN = 10;
export const ROUND_SECONDS_MAX = 60;
export const CLIP_CUES = Object.freeze(['inicio', 'votacion', 'ruleta', 'podio']);
export const DEFAULT_CLIPS = Object.freeze({ inicio: 'inicio', votacion: 'votacion', ruleta: 'ruleta', podio: 'podio' });

export const ARENA_PACE = Object.freeze({
  introMs: 1650,
  revealMs: 1750,
  rouletteSpinMs: 1350,
  rouletteResultMs: 1250,
  duelResultMs: 1400,
  podiumRevealMs: 1200,
});
