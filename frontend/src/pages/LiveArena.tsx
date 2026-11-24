import { useEffect, useState } from 'react';
import { command, forget, sessionToken, useArena } from '../services/arena';
import { LobbyPage } from './LobbyPage';
import { PlayPage } from './PlayPage';
import { ResultsPage } from './ResultsPage';

export function LiveArena() {
  const { view, online, message, ended } = useArena();
  const [error, setError] = useState('');
  useEffect(() => {
    if (!view) return;
    const path = view.phase === 'lobby' ? '/lobby' : view.phase === 'finished' ? '/results' : '/play';
    if (location.pathname !== path) history.replaceState(null, '', path);
    setError('');
  }, [view?.phase]);
  async function act(kind: 'leave' | 'start') {
    const reply = await command(kind, {});
    if (!reply.ok) setError(reply.error);
    else if (kind === 'leave') { forget(); location.assign('/join'); }
  }
  if (!view) return <main className="empty-state panel"><h1>Sala de espera</h1>
    <p role="status">{(sessionToken() || ended) ? message : 'Entra con tu PIN y apodo.'}</p>
    {!sessionToken() && <a className="button button-primary" href="/join">Ir al ingreso</a>}</main>;
  return <>
    {!online && <p className="arena-notice" role="status">{message}</p>}
    {error && <p className="arena-notice" role="alert">{error}</p>}
    {view.phase === 'lobby' ? <LobbyPage view={view} act={act} />
      : view.phase === 'finished' ? <ResultsPage view={view} act={act} />
      : <PlayPage key={view.round?.roundId} view={view} online={online} />}
  </>;
}
