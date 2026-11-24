import { useState } from 'react';
import type { Power, RuntimeArenaView } from '../../../shared/runtime-chaos';
import { command } from '../services/arena';
import { powerInfo } from '../services/runtimeCatalog';

const icons: Record<Power, string> = { proxy: '🛡️', decorator: '✦', memento: '↶', adapter: '⚙', prototype: '×2', command: '⚔' };

export function PowerTray({ view, online }: { view: RuntimeArenaView; online: boolean }) {
  const [target, setTarget] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const chaos = view.chaos;
  if (!chaos || !(chaos.items.length || chaos.shield || chaos.suppressed)) return null;
  const targets = view.players.filter(player => player.id !== view.you && player.status === 'active');
  const selected = targets.some(player => player.id === target) ? target : '';

  async function activate(power: Power) {
    setBusy(true);
    setError('');
    const reply = await command('usePower', { power, target: power === 'command' ? selected : undefined });
    if (!reply.ok) setError(reply.error);
    setBusy(false);
  }

  return <section className="power-tray" aria-label="Tus poderes">
    <h2><span aria-hidden="true">🎒 </span>Tus poderes <small>{chaos.items.length}/2</small></h2>
    {(chaos.shield || chaos.suppressed) && <p role="status">
      {chaos.shield && <span className="shield-fx" aria-hidden="true">🛡️ </span>}
      {[chaos.shield && 'Escudo activo', chaos.suppressed && 'Error 404 · Sin bonus de rapidez o racha'].filter(Boolean).join(' · ')}
    </p>}
    {chaos.items.map(power => {
      const info = powerInfo[power];
      const available = chaos.available.includes(power);
      return <div className="power-card" key={power}>
        <div><strong><span aria-hidden="true">{icons[power]} </span>{info.label}</strong><p>{info.description}</p></div>
        {power === 'command' && available && <select aria-label="Rival para el duelo" value={selected}
          disabled={!online || busy} onChange={event => setTarget(event.target.value)}>
          <option value="">Selecciona un rival</option>
          {targets.map(player => <option key={player.id} value={player.id}>{player.nickname}</option>)}
        </select>}
        <button type="button" className="button button-text"
          disabled={!online || busy || !available || (power === 'command' && !selected)}
          onClick={() => activate(power)}>{power === 'command' ? 'Invitar' : 'Activar'} <span className="sr-only">{info.label}</span></button>
      </div>;
    })}
    {error && <p role="alert">{error}</p>}
  </section>;
}
