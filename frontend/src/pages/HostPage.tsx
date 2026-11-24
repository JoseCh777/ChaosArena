import { useState } from 'react';
import { command, sessionToken, useArena } from '../services/arena';
import { decodeQuiz, DRAFT_KEY } from '../services/quizDraft';

const phases = { lobby: 'Sala de espera', question: 'Pregunta abierta', reveal: 'Resultados de ronda', roulette: 'Ruleta de caos', vote: 'Votación secreta', finished: 'Partida terminada' };

export function HostPage() {
  const { view, online, message } = useArena();
  const [error, setError] = useState('');
  const [voting, setVoting] = useState(true);
  const [busy, setBusy] = useState(false);

  async function start(draft: boolean) {
    setBusy(true);
    setError('');
    try {
      const quiz = draft ? decodeQuiz(localStorage.getItem(DRAFT_KEY) ?? '') : undefined;
      const reply = await command('start', { quiz, voting });
      if (!reply.ok) setError(reply.error);
    } catch {
      setError('Guarda un cuestionario válido en el editor antes de iniciarlo.');
    } finally {
      setBusy(false);
    }
  }

  async function removePlayer(id: string) {
    setError('');
    const reply = await command('removePlayer', { id });
    if (!reply.ok) setError(reply.error);
  }

  if (!view?.host) return <main className="panel empty-state"><h1>Anfitrión</h1>
    <p role="status">{view ? 'El panel está reservado a quien abrió la sala.' : sessionToken() ? message : 'Entra primero a la sala con tu apodo.'}</p>
    <a href={view ? '/lobby' : '/join'} className="button button-primary">{view ? 'Volver a la sala' : 'Ir al ingreso'}</a>
  </main>;

  const startable = view.phase === 'lobby' || view.phase === 'finished';
  return <main className="game-layout host-layout">
    <section className="panel game-panel">
      <p className="round-meta">{phases[view.phase]}</p>
      <h1 className="game-prompt">Mesa del anfitrión</h1>
      <p className="room-code">PIN <strong>{view.pin}</strong></p>
      <div className="host-actions">
        <a href="/display" target="_blank" rel="noreferrer" className="button button-primary">Abrir proyector ↗</a>
        <a href="/lobby" className="button button-text">Mi vista de jugador</a>
        <a href="/editor" className="button button-text">Editor</a>
      </div>
      {!online && <p role="status">{message}</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      {startable && <label><input type="checkbox" checked={voting} onChange={event => setVoting(event.target.checked)} /> Activar votaciones</label>}
      {startable ? <div className="host-actions">
        <button className="button button-primary" disabled={!online || busy} onClick={() => start(false)}>Iniciar con preguntas de muestra</button>
        <button className="button button-text" disabled={!online || busy} onClick={() => start(true)}>Iniciar mi cuestionario</button>
      </div> : <p role="status">Ronda {view.number} de {view.total} · {view.received} de {view.players.length} respuestas</p>}
    </section>
    <section className="panel host-roster">
      <h2>{view.summary ? 'Resultados de la sala' : 'Jugadores en sala'}</h2>
      <ul>{view.players.map(player => {
        const result = view.summary?.find(item => item.id === player.id);
        return <li key={player.id}><strong>{player.nickname}</strong>
          <span>{result ? `${result.correct} de ${view.total} aciertos · ${player.score} pts` : `${player.score} pts`}</span>
          {view.phase === 'lobby' && player.id !== view.you && <button className="button button-text" disabled={!online}
            onClick={() => removePlayer(player.id)} aria-label={`Retirar a ${player.nickname}`}>Retirar</button>}</li>;
      })}</ul>
    </section>
  </main>;
}
