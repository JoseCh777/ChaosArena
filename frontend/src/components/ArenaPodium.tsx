import { useLayoutEffect, useRef } from 'react';
import type { RuntimeDisplayView } from '../../../shared/runtime-chaos';
import '../styles/arena-podium.css';

export function ArenaPodium({ players, final = false, hideWinner = false }: {
  players: RuntimeDisplayView['players'];
  final?: boolean;
  hideWinner?: boolean;
}) {
  const stage = useRef<HTMLDivElement>(null);
  const previous = useRef(new Map<string, { x: number; y: number; rank: string | undefined }>());
  useLayoutEffect(() => {
    const positions = new Map<string, { x: number; y: number; rank: string | undefined }>();
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    for (const element of stage.current?.querySelectorAll<HTMLElement>('[data-podium-player]') ?? []) {
      const id = element.dataset.podiumPlayer!;
      const rank = element.closest<HTMLElement>('[data-rank]')?.dataset.rank;
      const from = previous.current.get(id);
      const card = element.closest<HTMLElement>('.arena-podium-place');
      const rect = card?.getBoundingClientRect() ?? element.getBoundingClientRect();
      positions.set(id, { x: rect.x, y: rect.y, rank });
      if (!from || from.rank === rank || reduceMotion) continue;
      element.getAnimations().forEach(animation => animation.cancel());
      element.animate([
        { transform: `translate(${from.x - rect.x}px, ${from.y - rect.y}px)`, opacity: .45 },
        { transform: 'none', opacity: 1 },
      ], { duration: 270, easing: 'cubic-bezier(.23, 1, .32, 1)' });
    }
    previous.current = positions;
  }, [players, final, hideWinner]);

  const places = [2, 1, 3].map(rank => ({
    rank, players: players.filter(player => player.rank === rank && !(hideWinner && rank === 1)),
  })).filter(place => place.players.length > 0);
  if (!places.length) return null;
  return <section className="arena-podium" aria-label={final ? 'Podio final' : 'Podio en directo'} data-final={final || undefined}>
    <h2>{final ? 'Podio final' : 'Podio en directo'}</h2>
    <div className="arena-podium-places" ref={stage}>
      {places.map(place => <div className="arena-podium-place" key={place.rank} data-rank={place.rank}>
        <span className="arena-podium-medal" aria-label={`Puesto ${place.rank}`}>{place.rank}</span>
        <div className="arena-podium-names">
          {place.players.slice(0, 2).map(player => <strong key={player.id} data-podium-player={player.id}>{player.nickname}</strong>)}
          {place.players.length > 2 && <span title={place.players.slice(2).map(player => player.nickname).join(', ')}>+{place.players.length - 2} en empate</span>}
        </div>
        <span className="arena-podium-score">{place.players[0].score} <small>pts</small></span>
      </div>)}
    </div>
  </section>;
}
