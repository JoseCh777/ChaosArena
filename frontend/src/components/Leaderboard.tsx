import type { RankingEntry } from '@chaos-arena/shared';

export function Leaderboard({ ranking, playerId }: { ranking: RankingEntry[]; playerId: string }) {
  return (
    <section className="panel leaderboard" aria-labelledby="ranking-title">
      <h2 id="ranking-title">Clasificación</h2>
      <ol>
        {ranking.filter(player => player.rank > 0).map(player => (
          <li key={player.id} data-rank={player.rank} className={player.id === playerId ? 'ranking-player' : undefined}>
            <span aria-label={`Puesto ${player.rank}`}>{player.rank}</span>
            <span>{player.nickname}{player.id === playerId && <small> · Tú</small>}</span>
            <strong>{player.score} pts</strong>
          </li>
        ))}
      </ol>
    </section>
  );
}
