import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import type { PublicPlayer } from '@chaos-arena/shared';
import { eventLabels, type DemoEvent } from '../services/demoEvents';
import { ChaosDial } from './ChaosDial';
import '../styles/roulette.css';

export function DemoRoulette({ event, players, onSpin }: {
  event?: DemoEvent;
  players: PublicPlayer[];
  onSpin: () => void;
}) {
  const [stage, setStage] = useState<'closed' | 'spinning' | 'result'>('closed');
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const reveal = useCallback(() => setStage('result'), []);
  const visible = Boolean(event && stage !== 'closed');

  useLayoutEffect(() => {
    const node = dialog.current;
    if (!node || !visible) return;
    node.showModal();
    return () => {
      node.close();
      opener.current?.focus({ preventScroll: true });
    };
  }, [visible]);

  const names = event?.targets.map(target => players[target]?.nickname).join(' y ');
  const description = event && {
    'black-hole': `${names} pierde el 20 % de su saldo, redondeado hacia abajo.`,
    'double-or-nothing': 'La próxima respuesta correcta vale el doble. Un error resta 50 puntos.',
    'loot-box': `${names} recibe 150 puntos.`,
    hack: `${names} intercambian sus puntos.`,
  }[event.type];

  return (
    <>
      <button className="roulette-launch" type="button" ref={opener} aria-haspopup="dialog"
        onClick={() => {
          if (!event) onSpin();
          setStage(event ? 'result' : 'spinning');
        }}>
        <span className="roulette-seal" aria-hidden="true">✦</span>
        <span>{event ? `Ver efecto · ${eventLabels[event.type]}` : 'Abrir ruleta de caos'}</span>
        <span aria-hidden="true">↗</span>
      </button>
      {visible && event && (
        <dialog ref={dialog} className="chaos-modal" aria-labelledby="roulette-title"
          onCancel={e => { e.preventDefault(); setStage('closed'); }}>
          <header className="chaos-modal-head">
            <img src="/brand/chaos-arena-mark.png" alt="" width="24" height="24" />
            <span>ChaosArena</span>
            <button type="button" aria-label="Cerrar ruleta" onClick={() => setStage('closed')}>×</button>
          </header>
          <div className="roulette-stage">
            <h2 id="roulette-title">Ruleta de <em>caos</em></h2>
            <ChaosDial type={event.type} spin={stage === 'spinning'} onRest={reveal} />
          </div>
          <div className="roulette-outcome" aria-live="polite" aria-atomic="true">
            <h3>{stage === 'spinning' ? 'Girando…' : eventLabels[event.type]}</h3>
            {stage === 'result' && <p>{description}</p>}
          </div>
          <button className="roulette-continue" type="button" onClick={() => {
            if (stage === 'spinning') reveal();
            else setStage('closed');
          }}>{stage === 'spinning' ? 'Saltar animación' : 'Volver a la ronda'} <span aria-hidden="true">→</span></button>
        </dialog>
      )}
    </>
  );
}
