import { ARENA_PACE } from '@chaos-arena/shared/arena-settings.js';
import { useLayoutEffect, useRef } from 'react';
import type { RuntimeEvent } from '../../../shared/runtime-chaos';
import { eventLabels, rouletteTypes } from '../services/runtimeCatalog';
import './chaos-dial.css';

const sectors = {
  'black-hole': ['◉', '#6636a3'],
  'double-or-nothing': ['×2', '#126575'],
  'error-404': ['404', '#87404b'],
  firewall: ['⬡', '#436027'],
  'loot-box': ['✦', '#8c551a'],
  hack: ['⇄', '#953653'],
  duel: ['⚔', '#315080'],
  respawn: ['↺', '#206854'],
} satisfies Record<RuntimeEvent, [string, string]>;

export function ChaosDial({ type, events, spin, onRest, started }: {
  type: RuntimeEvent;
  events?: RuntimeEvent[];
  spin: boolean;
  started: number;
  onRest: () => void;
}) {
  const rotor = useRef<HTMLDivElement>(null);
  const wheel = events?.includes(type) ? events : rouletteTypes;
  const sector = wheel.indexOf(type);
  const step = 360 / wheel.length;
  const wedges = wheel.map((id, index) =>
    `${sectors[id][1]} ${index * step}deg ${(index + 1) * step - 1}deg, #e5cfff ${(index + 1) * step - 1}deg ${(index + 1) * step}deg`
  );
  const angle = 1440 - sector * step;
  useLayoutEffect(() => {
    const wheel = rotor.current;
    if (!wheel || !spin) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const motion = wheel.animate([
      { transform: 'rotate(0deg)' },
      { transform: `rotate(${angle}deg)` },
    ], { duration: ARENA_PACE.rouletteSpinMs, fill: 'forwards', easing: 'cubic-bezier(.17,.68,.16,1)' });
    motion.currentTime = Math.min(ARENA_PACE.rouletteSpinMs, Math.max(0, Date.now() - started));
    motion.onfinish = onRest;
    return () => { motion.onfinish = null; motion.cancel(); };
  }, [angle, spin, onRest, started]);

  return (
    <div className="chaos-dial" aria-hidden="true">
      <div className="dial-frame">
        <div className="dial-rotor" ref={rotor} style={{
          transform: `rotate(${spin ? 0 : angle}deg)`,
          backgroundImage: `radial-gradient(circle, transparent 14%, #08031233 63%, #ffffff19 69%, #07031199 71%), conic-gradient(from ${-step / 2}deg, ${wedges.join(', ')})`,
        }}>
          {wheel.map((id, i) => (
            <div className="dial-sector" key={id} style={{ transform: `rotate(${i * step}deg)` }}>
              <b>{sectors[id][0]}</b><span>{eventLabels[id]}</span>
            </div>
          ))}
        </div>
        <div className="dial-hub"><img src="/brand/chaos-arena-mark.png" alt="" /></div>
      </div>
      <div className="dial-pointer" />
    </div>
  );
}
