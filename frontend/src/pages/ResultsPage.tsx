import { Leaderboard } from '../components/Leaderboard';
import { demoPersonalResult, demoRanking, readDemoGame } from '../services/demoGame';
import { readDemoRoom } from '../services/demoRoom';
import '../styles/game.css';

const percentage = new Intl.NumberFormat('es-CO', { style: 'percent', maximumFractionDigits: 1 });

export function ResultsPage() {
  const game = readDemoGame();
  const room = readDemoRoom();

  if (!room || !game?.finished) {
    return (
      <main className="empty-state panel">
        <h1>Resultados</h1>
        <p>Completa la partida de prueba para ver tu puntuación.</p>
        <a href={room && game ? '/play' : '/lobby'} className="button button-primary">
          {room && game ? 'Volver a la partida' : 'Ir a la sala'}
        </a>
      </main>
    );
  }

  const result = demoPersonalResult(game, room.playerId);

  return (
    <main className="game-layout">
      <section className="panel game-panel" aria-labelledby="game-title">
        <h1 className="game-prompt" id="game-title">Tus resultados</h1>
        <dl className="final-stats">
          <div>
            <dt>Puntos de juego</dt>
            <dd>{result.score}</dd>
          </div>
          <div>
            <dt>Resultado académico</dt>
            <dd>{percentage.format(result.academicPercentage / 100)}</dd>
          </div>
          <div>
            <dt>Aciertos</dt>
            <dd>{result.correctCount} de {result.validQuestionCount}</dd>
          </div>
        </dl>
        <a href="/lobby" className="button button-primary">Volver a la sala</a>
      </section>
      <Leaderboard ranking={demoRanking(game)} playerId={room.playerId} />
    </main>
  );
}
