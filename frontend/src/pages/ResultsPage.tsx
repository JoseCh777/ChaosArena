import type { RuntimeArenaView } from '../../../shared/runtime-chaos';
import { ArenaRecognitions } from '../components/ArenaMoments';
import { ArenaPodium } from '../components/ArenaPodium';
import { Leaderboard } from '../components/Leaderboard';

export function ResultsPage({ view, act }: { view: RuntimeArenaView; act: (kind: 'start' | 'leave') => void }) {
  const player = view.players.find(item => item.id === view.you)!;
  return <main className="game-layout finish-view">
    <ArenaPodium players={view.players} final />
    <ArenaRecognitions awards={view.awards} />
    <section className="panel game-panel">
      <p className="round-meta">Puesto {player.rank} de {view.players.length}</p>
      <h1 className="game-prompt">Tus resultados</h1>
      <div className="score-display">{player.score}<small> PTS</small></div>
      <dl className="final-stats">
        <div><dt>Aciertos</dt><dd>{view.correctCount} de {view.total}</dd></div>
        <div><dt>Resultado académico</dt><dd>{Math.round(100 * view.correctCount / view.total)} %</dd></div>
      </dl>
      {view.host && <a href="/host" className="button button-primary">Preparar otra partida</a>}
      <button className="button button-text" onClick={() => act('leave')}>Salir de la sala</button>
    </section>
    <Leaderboard ranking={view.players} playerId={view.you} />
  </main>;
}
