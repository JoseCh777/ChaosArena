import type { ClipCue } from '../../../shared/live';
import type { RuntimeDisplayView, RuntimeLiveEvent, ShowFact } from '../../../shared/runtime-chaos';
import { eventLabels } from './runtimeCatalog';
import type { MediaId } from './mediaManifest';

export type MediaStep = { title: string; detail?: string; asset?: MediaId; fallback?: ClipCue | null; ms: number };
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
  const base = { title: fact.title, detail: fact.detail, ms: 3000 };
  switch (fact.kind) {
    case 'intro': return scene(fact.id, fact.started, { ...base, ms: 2500, asset: 'vamo-a-jugar', fallback: view.clips?.inicio });
    case 'timeout': return scene(fact.id, fact.started, { ...base, asset: 'tiempo-agotado' });
    case 'correct': return scene(fact.id, fact.started, { ...base, asset: 'acierto-concurso' });
    case 'none': return scene(fact.id, fact.started, { ...base, asset: 'family-feud' });
    case 'streak': return scene(fact.id, fact.started, { ...base, asset: 'siuuu' });
    case 'leader': return scene(fact.id, fact.started, { ...base, asset: 'goool' });
    case 'shield': return scene(fact.id, fact.started, { ...base, asset: 'shield-activated' });
    case 'vote-open': return scene(fact.id, fact.started, { ...base, ms: 1450, asset: 'among-us-emergency', fallback: view.clips?.votacion });
    case 'vote-closed': return scene(fact.id, fact.started, { ...base, ms: 4100, asset: 'caso-cerrado' });
    case 'expelled': return scene(fact.id, fact.started,
      { title: fact.title, ms: 4000, asset: 'caso-cerrado' },
      { title: 'Modo fantasma', detail: fact.detail, ms: 5150, asset: 'coffin-dance' });
    case 'final': {
      const winners = view.players.filter(player => player.rank === 1);
      return scene(fact.id, fact.started,
        { title: 'El podio está por decidirse', ms: 3050, asset: 'redoble' },
        { title: winners.length > 1 ? 'Primer puesto compartido' : '¡Campeón de ChaosArena!',
          detail: winners.map(player => `${player.nickname} · ${player.score} pts`).join(' / '),
          ms: 5600, asset: 'la-plata', fallback: view.clips?.podio });
    }
  }
}

export function currentScene(view: RuntimeDisplayView): MediaScene | undefined {
  const event = view.chaosEvent;
  if (view.phase === 'roulette' && event && !view.duel) {
    return scene(`wheel-${view.round?.roundId}`, event.started,
      { title: '¡Evento de caos!', detail: 'La ruleta está decidiendo…', ms: 2450,
        asset: 'ruleta-casino', fallback: view.clips?.ruleta },
      { title: eventLabels[event.type], detail: event.description, ms: 2950, asset: eventAsset(event) });
  }
  if (view.duel?.stage === 'invite') {
    return scene(view.duel.id, view.duel.deadline - 10_000, { title: '¡Comienza el enfrentamiento!',
      detail: view.duel.players.map(player => player.nickname).join(' y '), ms: 2500, asset: 'campana-boxeo' });
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
