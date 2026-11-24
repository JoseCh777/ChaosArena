import type { RuntimeLiveEvent } from '../../../shared/runtime-chaos';
import { eventLabels } from '../services/runtimeCatalog';
import '../styles/roulette.css';

export function RouletteResult({ event }: { event: RuntimeLiveEvent }) {
  return <div className="roulette-reveal" data-impact={event.impact}>
    {(event.impact === 'shield' || event.impact === 'blocked') && <span className="shield-fx" data-blocked={event.impact === 'blocked'} aria-hidden="true">🛡️</span>}
    <strong>{eventLabels[event.type]}</strong>
    <p>{event.description}</p>
  </div>;
}
