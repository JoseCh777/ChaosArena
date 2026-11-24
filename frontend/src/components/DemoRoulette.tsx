import { useCallback, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import type { RuntimeLiveEvent } from '../../../shared/runtime-chaos';
import { eventLabels } from '../services/runtimeCatalog';
import { ChaosDial } from './ChaosDial';
import '../styles/roulette.css';

export function DemoRoulette({ event, preview }: { event: RuntimeLiveEvent; preview?: ReactNode }) {
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
      {preview}
      <ChaosDial type={event.type} started={event.started} spin={!rest} onRest={reveal} />
    </div>
    <div className="roulette-outcome" role="status">
      <h3>{rest ? eventLabels[event.type] : 'Girando…'}</h3>
      <p>{rest ? event.description : 'Un mismo giro para toda la arena.'}</p>
    </div>
  </dialog>;
}
