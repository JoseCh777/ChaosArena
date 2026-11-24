import type { PublicPlayer } from '@chaos-arena/shared';
import { eventLabels, type DemoEvent } from '../services/demoEvents';
import '../styles/roulette.css';

const labels = Object.entries(eventLabels);

export function DemoRoulette({ event, players, onSpin }: {
  event?: DemoEvent;
  players: PublicPlayer[];
  onSpin: () => void;
}) {
  const selected = event ? labels.findIndex(([type]) => type === event.type) : -1;
  const names = event?.targets.map(target => players[target]?.nickname).join(' y ');
  const effect = event && {
    'black-hole': `${names} pierde el 20 % de su saldo, redondeado hacia abajo.`,
    'double-or-nothing': 'En la próxima pregunta, el acierto suma el doble y una respuesta incorrecta resta 50 puntos.',
    'loot-box': `${names} suma 150 puntos.`,
    hack: `${names} intercambian sus puntos.`,
  }[event.type];

  return (
    <section className="demo-roulette" aria-labelledby="roulette-title">
      <h2 id="roulette-title">Ruleta de caos</h2>
      <div className="roulette-content">
        <div className="roulette-graphic" aria-hidden="true">
          <div className={event ? 'roulette-wheel roulette-spun' : 'roulette-wheel'}
            style={{ transform: `rotate(${event ? 720 - selected * 90 : 0}deg)` }} />
        </div>
        <ul className="roulette-options" aria-label="Eventos posibles">
          {labels.map(([type, label], index) => (
            <li key={type} data-segment={index} aria-current={index === selected ? 'true' : undefined}>
              <span aria-hidden="true" />{label}
            </li>
          ))}
        </ul>
      </div>
      {event ? (
        <p className="roulette-result" role="status"><strong>{eventLabels[event.type]}.</strong> {effect}</p>
      ) : (
        <button type="button" className="button button-text roulette-spin" onClick={onSpin}>Girar ruleta</button>
      )}
    </section>
  );
}
