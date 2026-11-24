import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { useArena } from '../services/arena';
import { RoundTimer } from '../components/RoundTimer';
import { Leaderboard } from '../components/Leaderboard';
import { DemoRoulette } from '../components/DemoRoulette';
import { ProjectionClip } from '../components/ProjectionClip';
import { useProjectionAudio } from './useProjectionAudio';
import './projection.css';

export function DisplayPage() {
  const { display, online, message } = useArena();
  const [now, setNow] = useState(Date.now);
  const phase = display?.phase;
  const audio = useProjectionAudio(phase === 'roulette' ? 'ruleta' : phase === 'finished' ? 'podio' : undefined);
  useEffect(() => {
    if (phase !== 'question') return;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(timer);
  }, [phase, display?.round?.roundId]);

  const header = <header className="projection-brand">
    <img src="/brand/chaos-arena-mark.png" alt="" width="36" height="40" />
    <strong>ChaosArena</strong>
    <span>{online ? 'Proyector' : message}</span>
    <nav className="host-actions" aria-label="Salir del proyector">
      <a className="button button-text" href="/host">Anfitrión</a>
      <a className="button button-text" href="/join">Ingreso</a>
    </nav>
    {display?.pin && <button className="button button-text" type="button" aria-pressed={audio.enabled} onClick={audio.toggle}>
      {audio.enabled ? 'Silenciar' : 'Activar sonido'}
    </button>}
  </header>;

  if (!display?.pin) return <main className="projection">
    {header}
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
  const clip = phase === 'vote' ? 'votacion' : finished ? 'podio' : phase === 'question' && display.number === 1 ? 'inicio' : undefined;
  return <main className={'projection ' + (waiting ? 'projection-lobby' : '')}>
    {header}
    {clip && <ProjectionClip key={clip} cue={clip} />}
    {audio.error && <p role="status">{audio.error}</p>}
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
      <h1>Podio de la arena</h1>
      <div className="finish-stage">{display.players.filter(p => p.rank <= 3).map(p =>
        <div className="podium-place" data-rank={p.rank} key={p.id}>
          <strong>{p.rank}</strong><span>{p.nickname}</span><small>{p.score} pts</small>
        </div>)}</div>
      <Leaderboard ranking={display.players} playerId="" />
    </> : phase === 'vote' && display.voting ? <section className="projection-round">
      <h1>Votación secreta</h1><p>{display.voting.received} de {display.voting.candidates.length} votos recibidos</p>
    </section> : round && <section className="projection-round">
      <div className="round-meta"><span>Ronda {display.number} / {display.total}</span>
        <span>{display.received} / {display.players.length} respuestas</span></div>
      {phase === 'question' && <RoundTimer seconds={Math.max(0, (round.deadline - now) / 1000)} totalSeconds={display.seconds} />}
      <h1>{round.prompt}</h1>
      <ol className="projection-options">{round.options.map((option, i) =>
        <li key={i} data-correct={display.solution?.index === i || undefined}>
          <b>{String.fromCharCode(65 + i)}</b><span>{option}</span>
          {display.solution && <strong>{display.solution.counts[i]}</strong>}
        </li>)}</ol>
      {display.solution?.explanation && <p>{display.solution.explanation}</p>}
      {phase === 'reveal' && <Leaderboard ranking={display.players} playerId="" />}
    </section>}
    {phase === 'roulette' && display.event && <DemoRoulette event={display.event} preview={<ProjectionClip cue="ruleta" />} />}
  </main>;
}
