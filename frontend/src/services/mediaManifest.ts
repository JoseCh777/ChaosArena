import type { ClipCue } from '../../../shared/live';

export const mediaFiles = {
  'que-bendicion': 'mp4',
  'la-roca': 'mp4',
  'tic-tac': 'mp3',
  'vamo-a-jugar': 'mp4',
  'coffin-dance': 'mp4',
  'mejor-estar-ciego': 'mp4',
  'patria-milagro': 'mp4',
  'asi-se-hace': 'mp4',
  'noticias-caracol': 'mp3',
  'millonario': 'mp3',
  'trompeta-triste': 'mp3',
  'redoble': 'mp3',
  'la-plata': 'mp3',
  'campana-boxeo': 'mp3',
  'wii-shop': 'mp3',
  'latidos': 'mp3',
  'caso-cerrado': 'mp3',
  'among-us-emergency': 'mp3',
  'tiempo-agotado': 'mp3',
  'ruleta-casino': 'mp3',
  'jackpot': 'mp3',
  'acierto-concurso': 'mp3',
  'family-feud': 'mp3',
  'goool': 'mp3',
  'attack-blocked': 'mp3',
  'shield-activated': 'mp3',
  'diomedes-respawn': 'mp3',
  'siuuu': 'mp3',
} as const;

export type MediaId = keyof typeof mediaFiles;
export const mediaIds = Object.keys(mediaFiles) as MediaId[];

export function mediaSource(id: MediaId | undefined, fallback?: ClipCue | null) {
  if (id && import.meta.env.DEV) {
    const ext = mediaFiles[id];
    return { url: `/media-local/${id}.${ext}`, video: ext === 'mp4' };
  }
  if (id && mediaFiles[id] !== 'mp4') return fallbackAudio(id);
  if (fallback) return { url: `/media/${fallback}.webm`, video: true };
  return undefined;
}

export function fallbackAudio(id: MediaId) {
  const channel = ['wii-shop', 'tic-tac', 'millonario', 'noticias-caracol'].includes(id) ? 'ambiente' : 'efecto';
  return { url: `/media/${channel}-original.wav`, video: false };
}
