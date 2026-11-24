import { EditorPage } from './pages/EditorPage';
import { JoinPage } from './pages/JoinPage';
import { DisplayPage } from './pages/DisplayPage';
import { HostPage } from './pages/HostPage';
import { LiveArena } from './pages/LiveArena';
import { sessionToken } from './services/arena';

export function App() {
  const route = window.location.pathname.replace(/\/$/, '');

  if (route === '/display') return <div className="arena"><DisplayPage /></div>;

  return (
    <div className="arena">
      <header className="arena-header">
        <a href="/join" className="brand">
          <img src="/brand/chaos-arena-mark.png" alt="" width="40" height="40" />
          <span>Chaos<span className="brand-accent">Arena</span></span>
        </a>
        <nav className="arena-nav" aria-label="Vistas de la arena">
          <a className="mode-label" href="/host">Anfitrión</a>
          <a className="mode-label" href="/display">Proyector</a>
          <a className="mode-label" href={route === '/editor' ? '/join' : '/editor'}>
            {route === '/editor' ? 'Ingreso' : 'Editor de preguntas'}
          </a>
        </nav>
      </header>
      {route === '/editor' && <EditorPage />}
      {route === '/host' && <HostPage />}
      {!['/editor', '/host'].includes(route) && (sessionToken() || ['/lobby','/play','/results'].includes(route) ? <LiveArena /> : <JoinPage />)}
    </div>
  );
}
