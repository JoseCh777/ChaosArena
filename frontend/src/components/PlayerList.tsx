import type { PublicPlayer } from '@chaos-arena/shared';

export function PlayerList({ players, playerId }: { players: PublicPlayer[]; playerId: string }) {
  return (
    <ul className="player-list">
      {players.map(player => (
        <li className="player-row" key={player.id}>
          <span className="player-avatar" aria-hidden="true">
            {Array.from(player.nickname)[0]?.toLocaleUpperCase('es')}
          </span>
          <span className="player-name">{player.nickname}</span>
          {player.id === playerId && <span className="you-label">Tú</span>}
        </li>
      ))}
    </ul>
  );
}
