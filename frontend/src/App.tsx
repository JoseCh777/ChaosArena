import { JoinPage } from './pages/JoinPage';
import { LobbyPage } from './pages/LobbyPage';

export function App() {
  const route = window.location.pathname.replace(/\/$/, '');

  return (
    <div className="arena">
      <header className="arena-header">
        <a href="/join" className="brand">
          <img src="/brand/chaos-arena-mark.png" alt="" width="40" height="40" />
          <span>Chaos<span className="brand-accent">Arena</span></span>
        </a>
        <span className="mode-label">Modo de prueba</span>
      </header>
      {route === '/lobby' ? <LobbyPage /> : <JoinPage />}
    </div>
  );
}
