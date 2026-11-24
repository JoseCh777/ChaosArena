import { ARENA_PACE } from '@chaos-arena/shared/arena-settings.js';
import { useCallback, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import type { RuntimeLiveEvent } from '../../../shared/runtime-chaos';
import { eventLabels } from '../services/runtimeCatalog';
import { ChaosDial } from './ChaosDial';
import '../styles/roulette.css';

export function DemoRoulette({ event, preview }: { event: RuntimeLiveEvent; preview?: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [started] = useState(event.started);
  const [rest, setRest] = useState(() => Date.now() >= event.started + ARENA_PACE.rouletteSpinMs);
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
      <ChaosDial type={event.type} started={started} spin={!rest} onRest={reveal} />
    </div>
    <div className="roulette-outcome" data-impact={rest ? event.impact ?? "event" : undefined} role="status">
      <h3>{rest ? eventLabels[event.type] : 'Girando…'}</h3>
      <p>{rest ? event.description : 'Resultado sincronizado con la sala.'}</p>
    </div>
  </dialog>;
}
