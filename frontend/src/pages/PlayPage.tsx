import { useEffect, useState } from 'react';
import type { ArenaView } from '../../../shared/live';
import { command } from '../services/arena';
import { RoundTimer } from '../components/RoundTimer';
import { Leaderboard } from '../components/Leaderboard';
import { DemoRoulette } from '../components/DemoRoulette';
import '../styles/game.css';

export function PlayPage({ view, online }: { view: ArenaView; online: boolean }) {
  const [now, setNow] = useState(Date.now);
  const [pending, setPending] = useState<number | null>(null);
  const [error, setError] = useState('');
  const round = view.round!;
  useEffect(() => {
    if (view.phase !== 'question') return;
    const id = setInterval(() => setNow(Date.now()), 150);
    return () => clearInterval(id);
  }, [view.phase]);
  async function answer(choice: number) {
    if (!online || pending !== null || view.choice !== null) return;
    setPending(choice);
    const reply = await command('answer', { roundId: round.roundId, choice });
    if (!reply.ok) { setError(reply.error); setPending(null); }
  }
  const choice = view.choice ?? pending;
  const reveal = view.solution;
  return <main className="game-layout play-view">
    <section className="panel game-panel" aria-labelledby="game-title">
      <div className="round-meta"><span>Ronda {view.number} / {view.total}</span><span>{view.received} de {view.players.length} respuestas</span></div>
      {view.phase === 'question' && <RoundTimer seconds={Math.max(0, Math.ceil((round.deadline - now) / 1000))} totalSeconds={view.seconds} />}
      <div className="prompt-board">
        <span className="round-digit" aria-hidden="true">{String(view.number).padStart(2, '0')}</span>
        <h1 className="game-prompt" id="game-title">{round.prompt}</h1>
      </div>
      <div className="game-options" aria-label="Opciones de respuesta" role="group">
        {round.options.map((option, i) => <button key={i} className="game-option"
          data-picked={choice === i || undefined} data-correct={reveal?.index === i || undefined}
          disabled={!online || choice !== null || view.phase !== 'question' || now >= round.deadline}
          onClick={() => answer(i)}>
          <span className="option-letter">{String.fromCharCode(65 + i)}</span>
          <span>{option}{reveal?.index === i && <small> · Correcta</small>}</span>
          {reveal && <span className="answer-count">{reveal.counts[i]} resp.</span>}
        </button>)}
      </div>
      {view.phase === 'question' && choice !== null && <p className="lock-feedback" role="status">
        {view.choice !== null ? 'Respuesta registrada. Esperando a los demás…' : 'Enviando respuesta…'}
      </p>}
      {view.phase === 'reveal' && !reveal && <p className="lock-feedback" role="status">Tiempo agotado. Preparando la siguiente fase…</p>}
      {reveal && <div className="round-verdict" role="status">
        <strong>{view.choice === null ? 'Tiempo agotado' : view.choice === reveal.index ? '¡Respuesta correcta!' : 'Respuesta incorrecta'}</strong>
        {reveal.explanation && <p>{reveal.explanation}</p>}
      </div>}
      {error && view.phase === 'question' && <p role="alert">{error}</p>}
    </section>
    {reveal && <Leaderboard ranking={view.players} playerId={view.you} />}
    {view.phase === 'roulette' && view.event && <DemoRoulette event={view.event} />}
  </main>;
}
