import { useEffect, useState } from 'react';
import type { DuelView, RuntimeArenaView } from '../../../shared/runtime-chaos';
import { command } from '../services/arena';
import { PowerTray } from './PowerTray';
import { RoundTimer } from './RoundTimer';
import '../styles/runtime-chaos.css';

export function DuelStage({ duel, view, online = false }: { duel: DuelView; view?: RuntimeArenaView; online?: boolean }) {
  const [now, setNow] = useState(Date.now);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const participant = !!view && duel.players.some(player => player.id === view.you);
  const remaining = Math.max(0, (duel.deadline - now) / 1000);
  const disabled = !online || busy || !remaining;

  useEffect(() => {
    if (duel.stage === 'result') return;
    const timer = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(timer);
  }, [duel.stage]);

  async function send(response: number | boolean) {
    setBusy(true);
    setError('');
    const reply = typeof response === 'boolean'
      ? await command('duelConsent', { id: duel.id, accepted: response })
      : await command('duelAnswer', { id: duel.id, choice: response });
    if (!reply.ok) setError(reply.error);
    setBusy(false);
  }

  return <section className="duel-stage panel" aria-labelledby="duel-title">
    <div className="duel-rivals">{duel.players.map(player => <span key={player.id}>{player.nickname}</span>)}</div>
    <h1 id="duel-title">{duel.prompt ?? 'Duelo relámpago'}</h1>
    {duel.stage !== 'result' && <RoundTimer seconds={remaining} totalSeconds={duel.stage === 'invite' ? 10 : 12} />}
    {duel.stage === 'invite' && (participant && !view?.chaos?.accepted
      ? <div className="duel-actions">
        <button className="game-option" disabled={disabled} onClick={() => send(true)}>Aceptar duelo</button>
        <button className="button button-text" disabled={disabled} onClick={() => send(false)}>Rechazar</button>
      </div>
      : <p role="status">Esperando la confirmación de los participantes…</p>)}
    {duel.options && <div className="game-options" aria-label="Opciones del duelo" role="group">
      {duel.options.map((option, i) => {
        if (duel.stage === 'question' && view?.chaos?.hiddenOptions?.includes(i)) return null;
        const contents = <><span className="option-letter">{String.fromCharCode(65 + i)}</span>
          <span>{option}{duel.correctIndex === i && <small> · Correcta</small>}</span></>;
        return participant && duel.stage === 'question'
          ? <button className="game-option" key={i} disabled={disabled || view?.chaos?.answered} onClick={() => send(i)}>{contents}</button>
          : <div className="game-option" key={i} data-correct={duel.correctIndex === i || undefined}>{contents}</div>;
      })}
    </div>}
    {duel.stage === 'question' && view?.chaos?.answered && <p role="status">Respuesta registrada. Esperando el resultado…</p>}
    {duel.result && <strong className="round-verdict" role="status">{duel.result}</strong>}
    {participant && view && duel.stage === 'question' && <PowerTray view={view} online={online} />}
    {error && <p role="alert">{error}</p>}
  </section>;
}
