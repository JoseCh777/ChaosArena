import { useState } from 'react';
import type { HostRoundAction, RuntimeArenaView } from '../../../shared/runtime-chaos';
import { RoundTimer } from '../components/RoundTimer';
import { useRoundSeconds } from '../components/useRoundSeconds';
import { command } from '../services/arena';

export function HostRound({ view, online }: { view: RuntimeArenaView; online: boolean }) {
  const [pending, setPending] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [error, setError] = useState('');
  const round = view.round;
  const question = view.phase === 'question';
  const paused = view.pausedMs !== undefined;
  const roulette = view.phase === 'roulette' && view.chaosEvent && !view.duel;
  const seconds = useRoundSeconds(question ? round?.deadline : undefined, view.pausedMs);
  const disabled = !online || pending;
  const voting = view.phase === 'vote' ? view.voting : undefined;

  async function run(action: HostRoundAction | number) {
    const id = typeof action === 'string' && action === 'cancelVote' ? voting?.id : round?.roundId;
    if (!id || disabled) return;
    setError('');
    setPending(true);
    const reply = typeof action === 'number'
      ? await command('answer', { roundId: id, choice: action })
      : await command('hostRound', { action, id });
    if (!reply.ok) setError(reply.error);
    if (action === 'close') setConfirmClose(false);
    setPending(false);
  }

  if (!round) return null;
  return <section className="host-console" aria-labelledby="host-control-title">
    <header>
      <h2 id="host-control-title">{question ? 'Pregunta en juego' : 'Control de partida'}</h2>
      <p>Ronda {view.number} de {view.total} · {view.received}/{view.players.length} respuestas</p>
    </header>
    {question && <>
      <RoundTimer seconds={seconds} totalSeconds={view.seconds} />
      {paused && <p className="host-state" role="status">Pregunta en pausa</p>}
      <p className="host-question">{round.prompt}</p>
      <ol className="host-answer-list" type="A">
        {round.options.map(option => <li key={option}>{option}</li>)}
      </ol>
      <div className="host-actions">
        <button className="button button-primary" type="button" disabled={disabled || seconds <= 0}
          onClick={() => run(paused ? 'resume' : 'pause')}>{paused ? 'Reanudar pregunta' : 'Pausar pregunta'}</button>
        {confirmClose ? <>
          <button className="button button-text" type="button" disabled={disabled} onClick={() => run('close')}>Confirmar cierre de pregunta</button>
          <button className="button button-text" type="button" onClick={() => setConfirmClose(false)}>Seguir con la pregunta</button>
        </> : <button className="button button-text" type="button" disabled={disabled} onClick={() => setConfirmClose(true)}>Cerrar pregunta</button>}
      </div>
      <details className="host-personal">
        <summary>{view.choice === null ? 'Responder como jugador' : 'Tu respuesta está registrada'}</summary>
        <div className="host-actions">
          {round.options.map((option, index) => <button className="button button-text" type="button" key={option}
            disabled={disabled || paused || seconds <= 0 || view.choice !== null} onClick={() => run(index)}>
            {String.fromCharCode(65 + index)} · {option}
          </button>)}
        </div>
      </details>
    </>}
    {view.canSkipEvent && <button className="button button-text" type="button" disabled={disabled}
      onClick={() => run('skipEvent')}>Omitir sorteo de esta ronda</button>}
    {roulette && view.chaosEvent && <div className="host-cue">
      <button className="button button-text" type="button" disabled={disabled} onClick={() => run('skipRoulette')}>
        Saltar animación de ruleta
      </button>
    </div>}
    {voting && <div className="host-cue">
      <p>{voting.received}/{voting.candidates.length} votos recibidos</p>
      <button className="button button-text" type="button" disabled={disabled} onClick={() => run('cancelVote')}>Cancelar votación</button>
    </div>}
    {view.duel && <p className="host-state">Duelo · {view.duel.players.map(player => player.nickname).join(' y ')}</p>}
    {error && <p className="form-error" role="alert">{error}</p>}
  </section>;
}
