import type { ReactNode } from 'react';
import type { RuntimeEvent } from '../../../shared/runtime-chaos';

const scenes: Record<RuntimeEvent, ReactNode> = {
  'black-hole': <><ellipse cx="80" cy="50" rx="29" ry="29" fill="var(--art-ink)" /><g className="orbit"><ellipse cx="80" cy="50" rx="59" ry="12" transform="rotate(-18 80 50)" /><circle cx="28" cy="67" r="4" /></g></>,
  'double-or-nothing': <><path d="m35 35 37-9 12 54-36 9z" fill="var(--art-ink)" /><g className="lift"><rect x="69" y="15" width="48" height="65" rx="6" fill="var(--art-paper)" /><text x="93" y="56" textAnchor="middle">×2</text></g></>,
  'error-404': <><rect x="23" y="18" width="114" height="64" rx="6" /><path d="M24 33h112m-80 58h48M80 83v8" /><g className="glitch"><text x="80" y="67" textAnchor="middle">404</text></g></>,
  firewall: <><g className="ward"><path d="M80 10 116 24v25q0 26-36 43Q44 75 44 49V24Z" fill="var(--art-ink)" /><path d="m61 51 13 13 26-30" strokeWidth="7" /></g></>,
  'loot-box': <><path d="m40 52 39 12 41-13v24L79 90 40 76Z" fill="var(--art-ink)" /><path d="M79 64v26"/><g className="lid"><path d="m36 43 42-15 45 13-43 17Z" fill="var(--art-paper)" /><path d="m36 43 1 9 43 14 43-17v-8M80 58v8"/></g><path d="m52 18 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z"/></>,
  hack: <><rect x="19" y="41" width="36" height="39" rx="6"/><rect x="105" y="21" width="36" height="39" rx="6"/><g className="transfer"><path d="M39 33q24-25 56-11l-8-12m8 12-15 4M122 69q-23 26-59 10l8 13m-8-13 15-3"/></g></>,
  duel: <><g className="strike"><path d="m39 17 12 4 53 52-8 8-53-52z" fill="var(--art-ink)" /><path d="m88 82 17-18m-4 13 13 13"/></g><path d="m121 17-12 4-53 52 8 8 53-52z" fill="var(--art-paper)" /><path d="m72 82-17-18m4 13L46 90"/></>,
  respawn: <><ellipse cx="80" cy="83" rx="40" ry="8"/><g className="rise"><path d="M56 67V43a24 24 0 0 1 48 0v24l-8-5-8 5-8-5-8 5-8-5Z" fill="var(--art-paper)" /><path d="M70 40v5m20-5v5"/></g></>,
};

export function EventArt({ type }: { type: RuntimeEvent }) {
  return <svg className="event-art" data-event={type} viewBox="0 0 160 100" aria-hidden="true"
    fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    {scenes[type]}
  </svg>;
}
