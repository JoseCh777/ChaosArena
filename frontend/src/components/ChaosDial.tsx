import { ARENA_PACE } from '@chaos-arena/shared/arena-settings.js';
import { useLayoutEffect, useRef } from 'react';
import type { RuntimeEvent } from '../../../shared/runtime-chaos';
import { eventLabels } from '../services/runtimeCatalog';
import './chaos-dial.css';

const sectors = Object.entries(eventLabels);
const glyphs = ['◉', '×2', '404', '⬡', '✦', '⇄', '⚔', '↺'];

export function ChaosDial({ type, spin, onRest, started }: {
  type: RuntimeEvent;
  spin: boolean;
  started: number;
  onRest: () => void;
}) {
  const rotor = useRef<HTMLDivElement>(null);
  const sector = sectors.findIndex(([id]) => id === type);
  const step = 360 / sectors.length;
  const angle = 1440 - sector * step;
  useLayoutEffect(() => {
    const wheel = rotor.current;
    if (!wheel || !spin) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onRest();
      return;
    }
    const motion = wheel.animate([
      { transform: 'rotate(0deg)' },
      { transform: `rotate(${angle}deg)` },
    ], { duration: ARENA_PACE.rouletteSpinMs, easing: 'cubic-bezier(.17,.68,.16,1)' });
    motion.currentTime = Math.min(ARENA_PACE.rouletteSpinMs, Math.max(0, Date.now() - started));
    motion.onfinish = onRest;
    return () => { motion.onfinish = null; motion.cancel(); };
  }, [angle, spin, onRest, started]);

  return (
    <div className="chaos-dial" aria-hidden="true">
      <div className="dial-frame">
        <div className="dial-rotor" ref={rotor} style={{ transform: `rotate(${angle}deg)` }}>
          {sectors.map(([id, label], i) => (
            <div className="dial-sector" key={id} style={{ transform: `rotate(${i * step}deg)` }}>
              <b>{glyphs[i]}</b><span>{label}</span>
            </div>
          ))}
        </div>
        <div className="dial-hub"><img src="/brand/chaos-arena-mark.png" alt="" /></div>
      </div>
      <div className="dial-pointer" />
    </div>
  );
}
