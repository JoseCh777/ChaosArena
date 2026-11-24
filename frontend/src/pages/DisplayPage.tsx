import { ARENA_PACE } from '@chaos-arena/shared/arena-settings.js';
import { setAudioFromGesture } from '../services/mediaAudio';
import { useEffect, useState } from 'react';
import type { RuntimeDisplayView } from '../../../shared/runtime-chaos';
import QRCode from 'react-qr-code';
import { useArena } from '../services/arena';
import { useRoundSeconds } from '../components/useRoundSeconds';
import { RoundTimer } from '../components/RoundTimer';
import { Leaderboard } from '../components/Leaderboard';
import { DuelStage } from '../components/DuelStage';
import { RoundMoment, ArenaRecognitions } from '../components/ArenaMoments';
import { ArenaPodium } from '../components/ArenaPodium';
import { MediaOverlay } from '../components/MediaOverlay';
import './projection.css';

type DisplayProps = { hostView?: RuntimeDisplayView; enabled?: boolean; toggleAudio?: () => void };

export function DisplayPage({ hostView, enabled, toggleAudio }: DisplayProps = {}) {
  const arena = useArena();
  const display = hostView ?? arena.display;
  const { online, message } = arena;
  const [localAudio, setLocalAudio] = useState(false);
  const [skippedFinal, setSkippedFinal] = useState<string>();
  const output = hostView ? 'host' : 'display';
  const audioEnabled = enabled ?? localAudio;
  const selected = (display?.show?.output ?? 'host') === output;
  const phase = display?.phase;
  const [now, setNow] = useState(Date.now);
  const podiumAt = phase === 'finished' && display?.showFact?.kind === 'final' ? display.showFact.started + ARENA_PACE.podiumRevealMs : 0;
  useEffect(() => {
    if (!podiumAt) return;
    setNow(Date.now());
    const timer = window.setTimeout(() => setNow(Date.now()), Math.max(0, podiumAt - Date.now()) + 20);
    return () => window.clearTimeout(timer);
  }, [podiumAt]);
  const hideWinner = now < podiumAt && skippedFinal !== display?.showFact?.id;
  const remaining = useRoundSeconds(phase === 'question' ? display?.round?.deadline : undefined, display?.pausedMs);

  const audioControl = display?.pin && selected && <button className="button button-text" type="button" aria-pressed={audioEnabled}
      onClick={toggleAudio ?? (() => setAudioFromGesture(() => setLocalAudio(!localAudio)))}>{audioEnabled ? 'Silenciar' : 'Activar sonido'}</button>;

  if (!display?.pin) return <main className="projection">
    <section className="panel empty-state">
      <h1>{display ? 'Esperando sala' : 'Proyector'}</h1>
      <p role="status">{display && online ? 'El PIN y el QR aparecerán cuando el anfitrión cree la sala.' : message}</p>
    </section>
  </main>;
  const link = new URL('/join', window.location.origin);
  link.searchParams.set('pin', display.pin);
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(link.hostname);
  const round = display.round;
  const waiting = phase === 'lobby';
  const finished = phase === 'finished';
  return <main className={'projection ' + (waiting ? 'projection-lobby' : '')}>
    {!waiting && <ArenaPodium players={display.players} final={finished} hideWinner={hideWinner} />}
    <div className="projection-stage">
      <div className="arena-stage-content">
    {waiting ? <section className="projection-prompt">
      <div><p className="round-meta">Sala de espera</p><h1>Entra a la <em>arena</em></h1>
        <p className="projection-pin">{display.pin}</p>
        <p>{display.players.length} jugadores en sala</p>
      </div>
      <div className="projection-qr">
        <QRCode value={link.href} size={188} title="QR de ingreso" />
        <a href={link.href}>{link.host}/join</a>
        {local && <small>Para usar el QR desde otro dispositivo, abre el proyector desde la dirección de red del equipo.</small>}
      </div>
    </section> : finished ? <>
      {hideWinner && <h1>Podio de la arena</h1>}
      {!hideWinner && <ArenaRecognitions awards={display.awards} />}
      {!hideWinner && <Leaderboard ranking={display.players} playerId="" />}
    </> : display.duel ? <DuelStage key={display.duel.id} duel={display.duel} /> : phase === 'vote' && display.voting ? <section className="projection-round">
      <h1>Votación secreta</h1><p>{display.voting.received} de {display.voting.candidates.length} votos recibidos</p>
    </section> : round && <section className="projection-round" data-boss={display.roundStage === 'boss' || undefined}>
      <RoundMoment view={display} />
      <div className="round-meta"><span>Ronda {display.number} / {display.total}</span>
        <span>{display.received} / {display.players.length} respuestas</span></div>
      {phase === 'question' && <RoundTimer seconds={remaining} totalSeconds={display.seconds} />}
      {display.pausedMs !== undefined && <p className="lock-feedback" role="status">Pregunta en pausa</p>}
      <h1>{round.prompt}</h1>
      <ol className="projection-options">{round.options.map((option, i) =>
        <li key={i} data-correct={display.solution?.index === i || undefined}>
          <b>{String.fromCharCode(65 + i)}</b><span>{option}</span>
          {display.solution && <strong>{display.solution.counts[i]}</strong>}
        </li>)}</ol>
      {display.solution?.explanation && <p>{display.solution.explanation}</p>}
      {phase === 'reveal' && <Leaderboard ranking={display.players} playerId="" />}
    </section>}
      </div>
      <div className="arena-effect-lane">
        <MediaOverlay view={display} output={output} enabled={audioEnabled} wheel
          onSkip={() => { if (phase === 'finished') setSkippedFinal(display.showFact?.id); }} />
      </div>
    </div>
    {audioControl && <footer className="projection-footer">{audioControl}</footer>}
  </main>;
}
