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

declare const __LOCAL_MEDIA_FILES__: readonly string[];

export function mediaSource(id: MediaId | undefined, fallback?: ClipCue | null) {
  if (id) {
    const ext = mediaFiles[id];
    const file = `media-local/${id}.${ext}`;
    if (__LOCAL_MEDIA_FILES__.includes(file)) return { url: `/${file}`, video: ext === 'mp4' };
  }
  if (id && mediaFiles[id] !== 'mp4') return fallbackAudio(id);
  if (fallback) return { url: `/media/${fallback}.webm`, video: true };
  return undefined;
}

export function fallbackAudio(id: MediaId) {
  const cues: Partial<Record<MediaId, string>> = {
    'wii-shop': 'ambiente',
    'tic-tac': 'ambiente',
    millonario: 'ambiente',
    'noticias-caracol': 'ambiente',
    'acierto-concurso': 'acierto',
    'family-feud': 'fallo',
    'tiempo-agotado': 'fallo',
    'trompeta-triste': 'fallo',
    'ruleta-casino': 'ruleta',
    'la-plata': 'podio',
  };
  const channel = cues[id] ?? 'efecto';
  return { url: `/media/${channel}-original.wav`, video: false };
}
