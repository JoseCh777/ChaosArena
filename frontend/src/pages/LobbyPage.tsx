import type { ArenaView } from '../../../shared/live';
import { PlayerList } from '../components/PlayerList';

export function LobbyPage({ view, act }: { view: ArenaView; act: (kind: 'leave') => void }) {
  return <main className="entry lobby-view arena-entry">
    <div className="entry-intro">
      <div className="lobby-signal" aria-hidden="true"><i /><i /><i /></div>
      <p className="room-code">PIN <strong>{view.pin}</strong></p>
      <h1>Sala de <span>espera</span></h1>
      <p>{view.host ? 'Comparte el PIN. Cuando estén todos, inicia la partida.' : 'Ya estás dentro. El anfitrión dará la salida.'}</p>
    </div>
    <section className="panel lobby-panel">
      <div className="lobby-heading"><h2>Jugadores en pista</h2><strong>{view.players.length}</strong></div>
      <PlayerList players={view.players} playerId={view.you} />
      {view.host && <a className="button button-primary" href="/host">Configurar partida →</a>}
      <button className="button button-text" onClick={() => act('leave')}>Salir de la sala</button>
    </section>
  </main>;
}
