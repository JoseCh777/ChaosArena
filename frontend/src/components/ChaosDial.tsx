import { useLayoutEffect, useRef } from 'react';
import { eventLabels, type DemoEvent } from '../services/demoEvents';
import './chaos-dial.css';

const sectors = Object.entries(eventLabels);
const glyphs = ['◉', '×2', '✦', '⇄'];

export function ChaosDial({ type, spin, onRest }: {
  type: DemoEvent['type'];
  spin: boolean;
  onRest: () => void;
}) {
  const rotor = useRef<HTMLDivElement>(null);
  const sector = sectors.findIndex(([id]) => id === type);
  const angle = 1440 - sector * 90;
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
    ], { duration: 2450, easing: 'cubic-bezier(.17,.68,.16,1)' });
    motion.onfinish = onRest;
    return () => { motion.onfinish = null; motion.cancel(); };
  }, [angle, spin, onRest]);

  return (
    <div className="chaos-dial" aria-hidden="true">
      <div className="dial-frame">
        <div className="dial-rotor" ref={rotor} style={{ transform: `rotate(${angle}deg)` }}>
          {sectors.map(([id, label], i) => (
            <div className="dial-sector" key={id} style={{ transform: `rotate(${i * 90}deg)` }}>
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
