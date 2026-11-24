import { DEFAULT_CLIPS } from '@chaos-arena/shared/arena-settings.js';
import type { RuntimeDisplayView } from '../../../shared/runtime-chaos';

export const clipNames = { inicio: 'Inicio', votacion: 'Votación', ruleta: 'Ruleta', podio: 'Podio' };
export type AudioCue = 'sala' | 'ruleta' | 'podio' | 'reaccion' | 'impacto';

export function presentation(view?: RuntimeDisplayView) {
  const clips = view?.clips ?? DEFAULT_CLIPS;
  if (view?.phase === 'lobby') return { audio: 'sala' as const };
  if (view?.phase === 'roulette' && !view.duel) return { audio: 'ruleta' as const, clip: clips.ruleta };
  if (view?.phase === 'finished') return { audio: 'podio' as const, clip: clips.podio };
  const clip = view?.phase === 'vote' ? clips.votacion : view?.phase === 'question' && view.number === 1 ? clips.inicio : null;
  const reaction = view?.show?.reactions !== false && view?.reaction && Date.now() < view.reaction.started + 3000
    ? view.reaction.kind : undefined;
  const audio: AudioCue | undefined = reaction
    ? (reaction === 'expulsion' || reaction === 'nadie-acierta' ? 'impacto' : 'reaccion') : undefined;
  return { audio, clip };
}
