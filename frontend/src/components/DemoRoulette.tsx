import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import type { LiveEvent } from '../../../shared/live';
import { eventLabels } from '../services/demoEvents';
import { ChaosDial } from './ChaosDial';
import '../styles/roulette.css';

export function DemoRoulette({ event }: { event: LiveEvent }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [rest, setRest] = useState(() => Date.now() >= event.started + 2450);
  const reveal = useCallback(() => setRest(true), []);
  useLayoutEffect(() => {
    const node = dialog.current!;
    node.showModal();
    return () => node.close();
  }, []);
  return <dialog className="chaos-modal" ref={dialog} aria-labelledby="roulette-title"
    onCancel={e => e.preventDefault()} tabIndex={-1}>
    <div className="roulette-stage">
      <h2 id="roulette-title">Ruleta de <em>caos</em></h2>
      <ChaosDial type={event.type} started={event.started} spin={!rest} onRest={reveal} />
    </div>
    <div className="roulette-outcome" role="status">
      <h3>{rest ? eventLabels[event.type] : 'Girando…'}</h3>
      <p>{rest ? event.description : 'Un mismo giro para toda la arena.'}</p>
    </div>
  </dialog>;
}
