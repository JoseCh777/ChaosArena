import { useState } from 'react';
import { openDemoGame, readDemoGame, writeDemoGame } from '../services/demoGame';
import { PlayerList } from '../components/PlayerList';
import { leaveDemoRoom, readDemoRoom } from '../services/demoRoom';

export function LobbyPage() {
  const room = readDemoRoom();
  const game = readDemoGame();
  const [error, setError] = useState('');

  if (!room) {
    return (
      <main className="empty-state panel">
        <h1>Sala de espera</h1>
        <p>Ingresa el PIN y tu apodo para acceder.</p>
        <a href="/join" className="button button-primary">Ir al ingreso</a>
      </main>
    );
  }

  const { playerId, snapshot } = room;

  return (
    <main className="entry" aria-labelledby="lobby-title">
      <div className="entry-intro">
        <div className="arena-grid" aria-hidden="true" />
        <h1 id="lobby-title">Sala de <span>espera</span></h1>
        <p>Prueba el cuestionario de demostración y consulta tus resultados al terminar.</p>
      </div>
      <section className="panel lobby-panel" aria-labelledby="players-title">
        <div className="lobby-heading">
          <h2 id="players-title">Participantes <span>{snapshot.players.length}</span></h2>
          <p>PIN <strong>{snapshot.pin}</strong></p>
        </div>
        <PlayerList players={snapshot.players} playerId={playerId} />
        <div className="lobby-play">
          {game && !game.finished ? (
            <a className="button button-primary" href="/play">Continuar partida de prueba</a>
          ) : (
            <button type="button" className="button button-primary" onClick={() => {
              try {
                writeDemoGame(openDemoGame());
                window.location.assign('/play');
              } catch {
                setError('El navegador no pudo guardar la partida de prueba.');
              }
            }}>Iniciar partida de prueba</button>
          )}
          {game?.finished && <a className="button button-text" href="/results">Ver resultados anteriores</a>}
          {error && <p className="form-error" role="alert">{error}</p>}
        </div>
        <button type="button" className="button button-text" onClick={() => {
          leaveDemoRoom();
          window.location.assign('/join');
        }}>Salir de la sala</button>
      </section>
    </main>
  );
}
