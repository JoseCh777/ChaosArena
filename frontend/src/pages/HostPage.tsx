import { DEFAULT_CLIPS, DEFAULT_ROUND_SECONDS } from '@chaos-arena/shared/arena-settings.js';
import type { ArenaSettings } from '../../../shared/live';
import { HostOptions } from './HostOptions';
import { HostRound } from './HostRound';
import { HostShow } from './HostShow';
import './host-console.css';
import { useState, type FormEvent } from 'react';
import { command, forget, remember, sessionToken, useArena } from '../services/arena';
import { decodeQuiz, DRAFT_KEY } from '../services/quizDraft';

const phases = { lobby: 'Sala de espera', question: 'Pregunta abierta', reveal: 'Resultados de ronda', roulette: 'Ruleta de caos', vote: 'Votación secreta', finished: 'Partida terminada' };

export function HostPage() {
  const { view, online, message } = useArena();
  const [nickname, setNickname] = useState('');
  const [hostKey, setHostKey] = useState('');
  const [error, setError] = useState('');
  const [settings, setSettings] = useState<ArenaSettings>({ roundSeconds: DEFAULT_ROUND_SECONDS, clips: { ...DEFAULT_CLIPS } });
  const [voting, setVoting] = useState(true);
  const [confirmClose, setConfirmClose] = useState(false);
  const [busy, setBusy] = useState(false);

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
      const reply = await command('start', { quiz, voting, settings });
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
    return <main className="entry" aria-labelledby="host-create-title">
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

  const startable = view.phase === 'lobby' || view.phase === 'finished';
  return <main className="game-layout host-layout">
    <section className="panel game-panel host-deck">
      <p className="round-meta">{view.pausedMs !== undefined ? 'Pausa' : view.duel ? 'Duelo relámpago' : phases[view.phase]}</p>
      <h1 className="game-prompt">Mesa del anfitrión</h1>
      <p className="room-code">PIN <strong>{view.pin}</strong></p>
      <div className="host-actions">
        <a href="/display" target="_blank" rel="noreferrer" className="button button-primary">Abrir proyector ↗</a>
        <a href="/lobby" className="button button-text">Mi vista de jugador</a>
        <a href="/editor" className="button button-text">Editor</a>
      </div>
      {!online && <p role="status">{message}</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      {startable && !confirmClose && <HostOptions settings={settings} voting={voting} onSettings={setSettings} onVoting={setVoting} disabled={busy} />}
      {startable && !confirmClose ? <div className="host-actions">
        <button className="button button-primary" disabled={!online || busy} onClick={() => start(false)}>Iniciar con preguntas de muestra</button>
        <button className="button button-text" disabled={!online || busy} onClick={() => start(true)}>Iniciar mi cuestionario</button>
      </div> : !startable && !confirmClose && <HostRound key={view.round?.roundId} view={view} online={online && !busy} />}
      {confirmClose ? <div className="host-close">
        <p>Se desconectarán los jugadores y se descartará la partida. Al crear otra sala recibirás un PIN nuevo.</p>
        <div className="host-actions">
          <button type="button" className="button button-text" disabled={busy} onClick={() => setConfirmClose(false)}>Cancelar</button>
          <button type="button" className="button button-primary" disabled={!online || busy} onClick={closeRoom}>Confirmar cierre</button>
        </div>
      </div> : <button type="button" className="button button-text" disabled={!online || busy}
        onClick={() => setConfirmClose(true)}>Cerrar sala</button>}
    </section>
    <div className="host-sidebar">
      <HostShow key={view.pin} view={view} online={online && !busy} clips={startable ? settings.clips : view.clips} />
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
    </div>
  </main>;
}
