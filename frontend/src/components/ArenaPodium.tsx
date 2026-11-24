import type { RuntimeDisplayView } from '../../../shared/runtime-chaos';
import '../styles/arena-podium.css';

export function ArenaPodium({ players, final = false, hideWinner = false }: {
  players: RuntimeDisplayView['players'];
  final?: boolean;
  hideWinner?: boolean;
}) {
  const places = [2, 1, 3].map(rank => ({
    rank, players: players.filter(player => player.rank === rank && !(hideWinner && rank === 1)),
  })).filter(place => place.players.length > 0);
  if (!places.length) return null;
  return <section className="arena-podium" aria-label={final ? 'Podio final' : 'Podio en directo'} data-final={final || undefined}>
    <h2>{final ? 'Podio final' : 'Podio en directo'}</h2>
    <div className="arena-podium-places">
      {places.map(place => <div className="arena-podium-place" key={place.rank} data-rank={place.rank}>
        <span className="arena-podium-medal" aria-label={`Puesto ${place.rank}`}>{place.rank}</span>
        <div className="arena-podium-names">
          {place.players.slice(0, 2).map(player => <strong key={player.id}>{player.nickname}</strong>)}
          {place.players.length > 2 && <span title={place.players.slice(2).map(player => player.nickname).join(', ')}>+{place.players.length - 2} en empate</span>}
        </div>
        <span className="arena-podium-score">{place.players[0].score} <small>pts</small></span>
      </div>)}
    </div>
  </section>;
}
