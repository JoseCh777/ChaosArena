import { PlayerList } from '../components/PlayerList';
import { leaveDemoRoom, readDemoRoom } from '../services/demoRoom';

export function LobbyPage() {
  const room = readDemoRoom();

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
        <p>La partida comenzará cuando el anfitrión la inicie.</p>
      </div>
      <section className="panel lobby-panel" aria-labelledby="players-title">
        <div className="lobby-heading">
          <h2 id="players-title">Participantes <span>{snapshot.players.length}</span></h2>
          <p>PIN <strong>{snapshot.pin}</strong></p>
        </div>
        <PlayerList players={snapshot.players} playerId={playerId} />
        <button type="button" className="button button-text" onClick={() => {
          leaveDemoRoom();
          window.location.assign('/join');
        }}>Salir de la sala</button>
      </section>
    </main>
  );
}
