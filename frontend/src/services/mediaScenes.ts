import { ARENA_PACE } from '@chaos-arena/shared/arena-settings.js';
import type { ClipCue } from '../../../shared/live';
import type { RuntimeDisplayView, RuntimeLiveEvent, ShowFact } from '../../../shared/runtime-chaos';
import { eventLabels } from './runtimeCatalog';
import type { MediaId } from './mediaManifest';

export type MediaStep = { title: string; detail?: string; asset?: MediaId; audioFallback?: MediaId; fallback?: ClipCue | null; ms: number; rate?: number };
export type MediaScene = { id: string; started: number; steps: MediaStep[] };

function scene(id: string, started: number, ...steps: MediaStep[]): MediaScene {
  return { id, started, steps };
}

function eventAsset(event: RuntimeLiveEvent): MediaId | undefined {
  if (event.impact === 'blocked') return 'attack-blocked';
  if (event.impact === 'shield' || event.type === 'firewall') return 'shield-activated';
  if (event.impact === 'reward') return 'jackpot';
  if (event.impact === 'loss' || event.type === 'black-hole') return 'trompeta-triste';
  if (event.type === 'duel') return 'campana-boxeo';
  return undefined;
}

function factScene(fact: ShowFact, view: RuntimeDisplayView) {
  const base = { title: fact.title, detail: fact.detail, ms: 1450 };
  switch (fact.kind) {
    case 'intro': return scene(fact.id, fact.started, { ...base, ms: ARENA_PACE.introMs, asset: 'vamo-a-jugar', fallback: view.clips?.inicio });
    case 'timeout': return scene(fact.id, fact.started, { ...base, ms: ARENA_PACE.roundTimeoutMs, asset: 'tiempo-agotado' });
    case 'correct': return scene(fact.id, fact.started, { ...base, asset: 'acierto-concurso' });
    case 'none': return scene(fact.id, fact.started, { ...base, asset: 'family-feud' });
    case 'none-clip': return scene(fact.id, fact.started, { ...base, asset: 'mejor-estar-ciego', ms: ARENA_PACE.roundClipMs });
    case 'streak-clip': return scene(fact.id, fact.started, { ...base, asset: 'asi-se-hace', ms: ARENA_PACE.roundClipMs });
    case 'streak': return scene(fact.id, fact.started, { ...base, ms: ARENA_PACE.streakMs, asset: 'siuuu', rate: 1.2 });
    case 'leader': return scene(fact.id, fact.started, { ...base, ms: ARENA_PACE.leaderMs, asset: 'goool', rate: 1.2 });
    case 'shield': return scene(fact.id, fact.started, { ...base, ms: 2250, asset: 'shield-activated', rate: 1.2 });
    case 'vote-open': return scene(fact.id, fact.started, { ...base, ms: ARENA_PACE.voteOpenMs, asset: 'among-us-emergency', rate: 1.6, fallback: view.clips?.votacion });
    case 'vote-closed': return scene(fact.id, fact.started, fact.title === 'Votación cancelada'
      ? base : { ...base, ms: ARENA_PACE.voteClosedMs, asset: 'caso-cerrado', rate: 1.25 });
    case 'expelled': return scene(fact.id, fact.started,
      { title: 'Modo fantasma', detail: fact.detail, ms: ARENA_PACE.expelledMs, asset: 'patria-milagro', rate: 1.05 });
    case 'final': {
      const winners = view.players.filter(player => player.rank === 1);
      return scene(fact.id, fact.started,
        { title: 'Y el campeón de ChaosArena es…', ms: ARENA_PACE.podiumRevealMs, asset: 'redoble', rate: 1.2 },
        { title: winners.length > 1 ? 'Primer puesto compartido' : '¡Campeón de ChaosArena!',
          detail: winners.map(player => `${player.nickname} · ${player.score} pts`).join(' / '),
          ms: ARENA_PACE.podiumWinnerMs, asset: 'la-plata', rate: 1.2, fallback: view.clips?.podio });
    }
  }
}

export function currentScene(view: RuntimeDisplayView): MediaScene | undefined {
  const event = view.chaosEvent;
  if (view.phase === 'roulette' && event && !view.duel) {
    const audio = eventAsset(event);
    const video = event.type === 'hack' ? 'la-roca'
      : event.type === 'loot-box' && event.impact === 'reward' ? 'que-bendicion' : undefined;
    const result = { title: eventLabels[event.type], detail: event.description };
    const reveal: MediaStep[] = video ? [
      { ...result, ms: ARENA_PACE.roundClipMs, asset: video, audioFallback: audio },
      { ...result, ms: ARENA_PACE.rouletteResultMs - ARENA_PACE.roundClipMs },
    ] : [{ ...result, ms: ARENA_PACE.rouletteResultMs, asset: audio }];
    return scene(`wheel-${view.round?.roundId}`, event.started,
      { title: '¡Evento de caos!', detail: 'La ruleta está decidiendo…', ms: ARENA_PACE.rouletteSpinMs, rate: 1.8,
        asset: 'ruleta-casino', fallback: view.clips?.ruleta },
      ...reveal);
  }
  if (view.duel?.stage === 'invite') {
    return scene(view.duel.id, view.duel.deadline - 10_000, { title: '¡Comienza el enfrentamiento!',
      detail: view.duel.players.map(player => player.nickname).join(' y '), ms: 2150, asset: 'campana-boxeo', rate: 1.2 });
  }
  if (view.showFact) return factScene(view.showFact, view);
}

export function currentAmbient(view: RuntimeDisplayView): MediaId | undefined {
  if (view.showFact?.kind === 'intro' && view.phase === 'lobby') return;
  if (view.phase === 'lobby') return 'wii-shop';
  if (view.phase === 'question' && view.pausedMs === undefined) return 'tic-tac';
  if (view.duel?.stage === 'question') return 'millonario';
  if (view.phase === 'vote') return 'noticias-caracol';
}
