import { DEFAULT_CLIPS, DEFAULT_ROUND_SECONDS } from '@chaos-arena/shared/arena-settings.js';
import type { ArenaSettings } from '../../../shared/live';
import { rouletteTypes } from '../services/runtimeCatalog';
import { HostOptions } from './HostOptions';
import { HostRound } from './HostRound';
import { RoundMoment, ArenaRecognitions } from '../components/ArenaMoments';
import { ArenaPodium } from '../components/ArenaPodium';
import { HostShow } from './HostShow';
import { DisplayPage } from './DisplayPage';
import './host-console.css';
import { setAudioFromGesture } from '../services/mediaAudio';
import { useState, type FormEvent } from 'react';
import { command, forget, remember, sessionToken, useArena } from '../services/arena';
import { downloadResults } from '../services/downloadResults';
import { decodeQuiz, DRAFT_KEY } from '../services/quizDraft';

const phases = { lobby: 'Sala de espera', question: 'Pregunta abierta', reveal: 'Resultados de ronda', roulette: 'Ruleta de caos', vote: 'Votación secreta', finished: 'Partida terminada' };

export function HostPage({ presenting, setPresenting }: { presenting: boolean; setPresenting: (active: boolean) => void }) {
  const { view, online, message } = useArena();
  const [nickname, setNickname] = useState('');
  const [hostKey, setHostKey] = useState('');
  const [error, setError] = useState('');
  const [settings, setSettings] = useState<ArenaSettings>({ roundSeconds: DEFAULT_ROUND_SECONDS, clips: { ...DEFAULT_CLIPS } });
  const [bankSize, setBankSize] = useState<16 | 32 | 48>(16);
  const [hostVotes, setHostVotes] = useState(true);
  const [voting, setVoting] = useState(true);
  const [roulette, setRoulette] = useState(true);
  const [rouletteEvents, setRouletteEvents] = useState(rouletteTypes);
  const [confirmClose, setConfirmClose] = useState(false);
  const [busy, setBusy] = useState(false);
  const canStart = online && !busy && (!roulette || rouletteEvents.length > 0);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const toggleAudio = () => setAudioFromGesture(() => setAudioEnabled(!audioEnabled));

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !nickname.trim()) return;
    setBusy(true);
    setError('');
    try {
      const reply = await command('create', { nickname, hostKey });
      if (!reply.ok) setError(reply.error);
      else if (reply.token) {
        remember(reply.token);
        setHostKey('');
      }
    } finally {
      setBusy(false);
    }
  }

  async function start(draft: boolean) {
    setBusy(true);
    setError('');
    try {
      const quiz = draft ? decodeQuiz(localStorage.getItem(DRAFT_KEY) ?? '') : undefined;
      const reply = await command('start', { quiz, voting, hostVotes, settings, roulette, rouletteEvents, bankSize: draft ? undefined : bankSize });
      if (!reply.ok) setError(reply.error);
    } catch {
      setError('Guarda un cuestionario válido en el editor antes de iniciarlo.');
    } finally {
      setBusy(false);
    }
  }

  async function closeRoom() {
    setBusy(true);
    setError('');
    try {
      const reply = await command('closeRoom', {});
      if (!reply.ok) setError(reply.error);
      else {
        forget();
        location.assign('/host');
      }
    } finally {
      setBusy(false);
    }
  }

  async function removePlayer(id: string) {
    setError('');
    const reply = await command('removePlayer', { id });
    if (!reply.ok) setError(reply.error);
  }

  if (!view && (!sessionToken() || busy)) {
    return <main className="entry arena-entry" aria-labelledby="host-create-title">
      <div className="entry-intro">
        <h1 id="host-create-title">Abre una <span>sala</span></h1>
        <p>Al crearla recibes un PIN de seis dígitos y el QR para invitar a los jugadores.</p>
      </div>
      <form className="panel entry-form" onSubmit={create}>
        <h2>Configura el acceso</h2>
        <div className="field">
          <label htmlFor="host-nickname">Apodo del anfitrión</label>
          <input id="host-nickname" autoComplete="nickname" value={nickname} maxLength={20} required
            onChange={event => setNickname(event.target.value)} />
        </div>
        <details>
          <summary>Clave del anfitrión</summary>
          <div className="field">
            <label htmlFor="host-key">Clave configurada en el servidor</label>
            <input id="host-key" type="password" autoComplete="off" value={hostKey}
              onChange={event => setHostKey(event.target.value)} />
          </div>
        </details>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button type="submit" className="button button-primary" disabled={busy}>
          {busy ? 'Creando sala…' : 'Crear sala'} <span aria-hidden="true">→</span>
        </button>
      </form>
    </main>;
  }

  if (!view?.host) return <main className="panel empty-state"><h1>Anfitrión</h1>
    <p role="status">{view ? 'El panel está reservado a quien abrió la sala.' : sessionToken() ? message : 'Entra primero a la sala con tu apodo.'}</p>
    <a href={view ? '/lobby' : '/join'} className="button button-primary">{view ? 'Volver a la sala' : 'Ir al ingreso'}</a>
  </main>;

  if (presenting) return <DisplayPage hostView={view} enabled={audioEnabled} toggleAudio={toggleAudio} />;
  const intro = view.phase === 'lobby' && view.showFact?.kind === 'intro';
  const startable = !intro && (view.phase === 'lobby' || view.phase === 'finished');
  return <main className="game-layout host-layout">
    {view.phase !== 'lobby' && <ArenaPodium players={view.players} final={view.phase === 'finished'} />}
    {view.phase === 'finished' && <ArenaRecognitions awards={view.awards} />}
    {!startable && <section className="host-main-stage" data-phase={view.phase} data-boss={view.roundStage === 'boss' || undefined} aria-label="Partida en curso">
      {!intro && <RoundMoment view={view} />}
      {intro ? <h1 className="game-prompt">Comienza la partida</h1>
        : <HostRound key={view.round?.roundId} view={view} online={online && !busy} />}
    </section>}
    <section className="panel game-panel host-deck">
      <p className="round-meta">{phases[view.phase]}</p>
      <h1 className="host-title">Mesa del anfitrión</h1>
      <p className="room-code">PIN <strong>{view.pin}</strong></p>
      <div className="host-actions">
        <button className="button button-primary" type="button" onClick={() => {
          setPresenting(true);
          void document.documentElement.requestFullscreen?.().catch(() => {});
        }}>Modo presentación</button>
        <a href="/display" className="button button-text">Abrir proyector</a>
        <a href="/editor" className="button button-text">Editor de preguntas</a>
      </div>
      {!online && <p role="status">{message}</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      {startable && !confirmClose && <HostOptions hostVotes={hostVotes} onHostVotes={setHostVotes} settings={settings} voting={voting} onSettings={setSettings} onVoting={setVoting} roulette={roulette}
        rouletteEvents={rouletteEvents} onRoulette={setRoulette} onRouletteEvents={setRouletteEvents} disabled={busy} />}
      {startable && !confirmClose ? <div className="host-actions">
        <label className="host-volume host-count">Preguntas del banco
          <select value={bankSize} disabled={busy} onChange={event => setBankSize(Number(event.target.value) as 16 | 32 | 48)}>
            <option value={16}>16 · Partida corta</option>
            <option value={32}>32 · Partida extendida</option>
            <option value={48}>48 · Banco completo</option>
          </select>
        </label>
        <button className="button button-primary" disabled={!canStart} onClick={() => start(false)}>Iniciar Patrones de Diseño</button>
        <details className="host-personal"><summary>Cuestionario del editor</summary>
          <button className="button button-text" disabled={!canStart} onClick={() => start(true)}>Iniciar mi cuestionario</button>
        </details>
      </div> : null}
      {confirmClose ? <div className="host-close">
        <p>Se desconectarán los jugadores y se descartará la partida. Al crear otra sala recibirás un PIN nuevo.</p>
        <div className="host-actions">
          <button type="button" className="button button-text" disabled={busy} onClick={() => setConfirmClose(false)}>Cancelar</button>
          <button type="button" className="button button-primary" disabled={!online || busy} onClick={closeRoom}>Confirmar cierre</button>
        </div>
      </div> : <button type="button" className="button button-text" disabled={!online || busy}
        onClick={() => setConfirmClose(true)}>Cerrar sala</button>}
    </section>
    <HostShow key={view.pin} view={view} online={online && !busy} audioEnabled={audioEnabled} toggleAudio={toggleAudio} />
    {view.summary && <section className="panel host-export" aria-label="Informe de evaluación">
      <div><h2>Informe de evaluación</h2><p>{view.summary.length} participantes · {view.total} preguntas</p></div>
      <button className="button button-primary" type="button" onClick={() => downloadResults(view)}>Descargar CSV</button>
    </section>}
    <details className="panel host-roster" open={view.phase === 'lobby' ? true : undefined}>
        <summary>{view.summary ? 'Resultados de la sala' : `Jugadores en sala · ${view.players.length}`}</summary>
        <ul>{view.players.map(player => {
          const result = view.summary?.find(item => item.id === player.id);
          return <li key={player.id}><strong>{player.nickname}</strong>
            <span>{result ? `${result.correct} de ${view.total} aciertos · ${player.score} pts` : `${player.score} pts`}</span>
            {view.phase === 'lobby' && player.id !== view.you && <button className="button button-text" disabled={!online}
              onClick={() => removePlayer(player.id)} aria-label={`Retirar a ${player.nickname}`}>Retirar</button>}</li>;
        })}</ul>
    </details>
  </main>;
}
