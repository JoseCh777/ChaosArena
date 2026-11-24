import { useState } from 'react';
import { ArenaHeader } from './components/ArenaHeader';
import { EditorPage } from './pages/EditorPage';
import { JoinPage } from './pages/JoinPage';
import { DisplayPage } from './pages/DisplayPage';
import { HostPage } from './pages/HostPage';
import { LiveArena } from './pages/LiveArena';
import { sessionToken, useArena } from './services/arena';

export function App() {
  const { view } = useArena();
  const [presenting, setPresenting] = useState(false);
  const route = window.location.pathname.replace(/\/$/, '');

  const playerView = view && !view.host && !['/host', '/editor'].includes(route);

  if (route === '/display') return <div className="arena"><DisplayPage /></div>;

  return (
    <div className="arena">
      {!(route === '/host' && view?.host) && <ArenaHeader standard label={playerView ? `PIN ${view.pin}` : undefined}>
        {!playerView && <><a className="button button-text" href="/host">Anfitrión</a>
        <a className="button button-text" href="/display">Proyector</a>
        <a className="button button-text" href={route === '/editor' ? '/join' : '/editor'}>
          {route === '/editor' ? 'Ingreso' : 'Editor de preguntas'}
        </a></>}
      </ArenaHeader>}
      {route === '/editor' && <EditorPage />}
      {route === '/host' && <HostPage presenting={presenting} setPresenting={setPresenting} />}
      {!['/editor', '/host'].includes(route) && (sessionToken() || ['/lobby','/play','/results'].includes(route) ? <LiveArena /> : <JoinPage />)}
    </div>
  );
}
