import type { ArenaView } from '../../../shared/live';
import { Leaderboard } from '../components/Leaderboard';

export function ResultsPage({ view, act }: { view: ArenaView; act: (kind: 'start' | 'leave') => void }) {
  const player = view.players.find(item => item.id === view.you)!;
  return <main className="game-layout finish-view">
    <section className="finish-stage" aria-label="Podio de la arena">
      {view.players.filter(p => p.rank <= 3).map(p => <div key={p.id} className="podium-place" data-rank={p.rank}>
        <strong>{p.rank}</strong><span>{p.nickname}</span><small>{p.score} pts</small>
      </div>)}
    </section>
    <section className="panel game-panel">
      <p className="round-meta">Puesto {player.rank} de {view.players.length}</p>
      <h1 className="game-prompt">Tus resultados</h1>
      <div className="score-display">{player.score}<small> PTS</small></div>
      <dl className="final-stats">
        <div><dt>Aciertos</dt><dd>{view.correctCount} de {view.total}</dd></div>
        <div><dt>Resultado académico</dt><dd>{Math.round(100 * view.correctCount / view.total)} %</dd></div>
      </dl>
      {view.host && <button className="button button-primary" onClick={() => act('start')}>Jugar otra vez →</button>}
      <button className="button button-text" onClick={() => act('leave')}>Salir de la sala</button>
    </section>
    <Leaderboard ranking={view.players} playerId={view.you} />
  </main>;
}
