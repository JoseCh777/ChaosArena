import { ARENA_PACE } from '@chaos-arena/shared/arena-settings.js';
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import type { RuntimeLiveEvent } from '../../../shared/runtime-chaos';
import { RouletteResult } from './RouletteResult';
import { ChaosDial } from './ChaosDial';
import '../styles/roulette.css';

export function DemoRoulette({ event, preview }: { event: RuntimeLiveEvent; preview?: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [rest, setRest] = useState(() => Date.now() >= event.started + ARENA_PACE.rouletteSpinMs);
  const reveal = useCallback(() => setRest(true), []);
  useLayoutEffect(() => {
    const node = dialog.current!;
    node.showModal();
    return () => node.close();
  }, []);
  useEffect(() => {
    if (rest) return;
    const timer = window.setTimeout(reveal, Math.max(0, event.started + ARENA_PACE.rouletteSpinMs - Date.now()));
    return () => window.clearTimeout(timer);
  }, [event.started, rest, reveal]);
  return <dialog className="chaos-modal" ref={dialog} aria-labelledby="roulette-title"
    onCancel={e => e.preventDefault()} tabIndex={-1}>
    <div className="roulette-stage">
      <h2 id="roulette-title">Ruleta de <em>caos</em></h2>
      {preview}
      <ChaosDial type={event.type} events={event.wheel} started={event.started} spin={!rest} onRest={reveal} />
      <div className="roulette-result-layer" role="status">
        {rest && <RouletteResult event={event} />}
      </div>
    </div>
    <p className="roulette-progress" aria-hidden="true">{rest ? 'Ruleta detenida' : 'Girando…'}</p>
  </dialog>;
}
