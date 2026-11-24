import { useState } from 'react';
import type { RuntimeArenaView } from '../../../shared/runtime-chaos';
import { command } from '../services/arena';
import { useRoundSeconds } from '../components/useRoundSeconds';
import { RoundTimer } from '../components/RoundTimer';
import { Leaderboard } from '../components/Leaderboard';
import { VotePage } from './VotePage';
import { DemoRoulette } from '../components/DemoRoulette';
import { DuelStage } from '../components/DuelStage';
import { PowerTray } from '../components/PowerTray';
import '../styles/game.css';

export function PlayPage({ view, online }: { view: RuntimeArenaView; online: boolean }) {
  const [pending, setPending] = useState<number | null>(null);
  const [error, setError] = useState('');
  const round = view.round!;
  const paused = view.pausedMs !== undefined;
  const remaining = useRoundSeconds(view.phase === 'question' ? round.deadline : undefined, view.pausedMs);
  async function answer(choice: number) {
    if (!online || paused || pending !== null || view.choice !== null) return;
    setPending(choice);
    const reply = await command('answer', { roundId: round.roundId, choice });
    if (!reply.ok) { setError(reply.error); setPending(null); }
  }
  if (view.phase === 'vote' && view.voting) return <VotePage view={view} online={online} />;
  if (view.duel) return <main className="game-layout play-view">
    <DuelStage key={view.duel.id} duel={view.duel} view={view} online={online} />
  </main>;
  const event = view.chaosEvent ?? view.event;
  const ghost = view.players.some(player => player.id === view.you && player.status === 'ghost');
  const choice = view.choice ?? pending;
  const reveal = view.solution;
  const verdict = !reveal ? undefined : view.choice === null ? 'unanswered'
    : view.choice === reveal.index ? 'correct' : 'incorrect';
  return <main className="game-layout play-view">
    <section className="panel game-panel" aria-labelledby="game-title">
      {ghost && <p className="lock-feedback">Modo fantasma · Tus respuestas siguen contando para la evaluación.</p>}
      <div className="round-meta"><span>Ronda {view.number} / {view.total}</span><span>{view.received} de {view.players.length} respuestas</span></div>
      {view.phase === 'question' && <RoundTimer seconds={remaining} totalSeconds={view.seconds} />}
      {paused && <p className="lock-feedback" role="status">Pregunta en pausa</p>}
      <div className="prompt-board">
        <span className="round-digit" aria-hidden="true">{String(view.number).padStart(2, '0')}</span>
        <h1 className="game-prompt" id="game-title">{round.prompt}</h1>
      </div>
      {verdict && reveal && <div className="round-verdict player-verdict" data-verdict={verdict} role="status">
        <span className="verdict-mark" aria-hidden="true">{verdict === 'correct' ? '✓' : verdict === 'incorrect' ? '×' : '–'}</span>
        <div>
          <strong>{verdict === 'correct' ? '¡Respuesta correcta!' : verdict === 'incorrect' ? 'Respuesta incorrecta' : 'Sin respuesta'}</strong>
          {verdict !== 'correct' && <p>Correcta · {round.options[reveal.index]}</p>}
          {reveal.explanation && <p>{reveal.explanation}</p>}
        </div>
      </div>}
      <div className="game-options" aria-label="Opciones de respuesta" role="group">
        {round.options.map((option, i) => <button key={i} className="game-option"
          data-picked={choice === i || undefined} data-correct={reveal?.index === i || undefined} data-wrong={verdict === 'incorrect' && view.choice === i || undefined}
          disabled={!online || choice !== null || view.phase !== 'question' || paused || remaining <= 0}
          onClick={() => answer(i)}>
          <span className="option-letter">{String.fromCharCode(65 + i)}</span>
          <span>{option}{reveal?.index === i && <small> · Correcta</small>}</span>
          {reveal && <span className="answer-count">{reveal.counts[i]} resp.</span>}
        </button>)}
      </div>
      {view.phase === 'question' && choice !== null && <p className="lock-feedback" role="status">
        {view.choice !== null ? 'Respuesta registrada. Esperando a los demás…' : 'Enviando respuesta…'}
      </p>}
      {view.phase === 'reveal' && !reveal && <p className="lock-feedback" role="status">Pregunta cerrada. Preparando la siguiente fase…</p>}
      {error && view.phase === 'question' && <p role="alert">{error}</p>}
    </section>
    <PowerTray view={view} online={online} />
    {reveal && <Leaderboard ranking={view.players} playerId={view.you} />}
    {view.phase === 'roulette' && event && <DemoRoulette key={round.roundId} event={event} />}
  </main>;
}
