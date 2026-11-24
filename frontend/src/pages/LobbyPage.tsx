import type { ArenaView } from '../../../shared/live';
import { PlayerList } from '../components/PlayerList';

export function LobbyPage({ view, act }: { view: ArenaView; act: (kind: 'start' | 'leave') => void }) {
  return <main className="entry lobby-view">
    <div className="entry-intro">
      <p className="room-code">PIN <strong>{view.pin}</strong></p>
      <h1>Sala de <span>espera</span></h1>
      <p>{view.host ? 'Comparte el PIN. Cuando estén todos, inicia la partida.' : 'Ya estás dentro. El anfitrión dará la salida.'}</p>
    </div>
    <section className="panel lobby-panel">
      <div className="lobby-heading"><h2>Jugadores en pista</h2><strong>{view.players.length}</strong></div>
      <PlayerList players={view.players} playerId={view.you} />
      {view.host && <button className="button button-primary" onClick={() => act('start')}>Iniciar partida →</button>}
      <button className="button button-text" onClick={() => act('leave')}>Salir de la sala</button>
    </section>
  </main>;
}
