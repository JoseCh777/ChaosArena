import { useState } from 'react';
import { ArenaHeader, type ArenaDestination } from './components/ArenaHeader';
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
  const isPresentation = route === '/host' && presenting && Boolean(view?.host);
  const current: ArenaDestination = isPresentation || route === '/display' ? '/display'
    : route === '/host' || route === '/editor' ? route : '/join';
  const useLiveView = sessionToken() || ['/lobby', '/play', '/results'].includes(route);

  function closePresentation() {
    setPresenting(false);
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
  }

  return <div className="arena">
    <ArenaHeader current={current} onReturnToHost={isPresentation ? closePresentation : undefined}
      label={isPresentation ? 'Modo presentación' : current === '/join' && view ? `PIN ${view.pin}` : undefined} />
    {route === '/display' ? <DisplayPage />
      : route === '/editor' ? <EditorPage />
      : route === '/host' ? <HostPage presenting={isPresentation} setPresenting={setPresenting} />
      : useLiveView ? <LiveArena /> : <JoinPage />}
  </div>;
}
