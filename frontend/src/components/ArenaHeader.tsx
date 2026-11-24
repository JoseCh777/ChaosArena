import type { ReactNode } from 'react';
import '../pages/projection.css';

export function ArenaHeader({ label, standard, actions, children, extra }: {
  label?: string;
  standard?: boolean;
  actions?: ReactNode;
  extra?: ReactNode;
  children?: ReactNode;
}) {
  return <header className={standard ? 'projection-brand arena-shared-header' : 'projection-brand'}>
    <img src="/brand/chaos-arena-mark.png" alt="" width="36" height="40" />
    <strong>ChaosArena</strong>
    {label && <span>{label}</span>}
    {(actions ?? children) && <nav className="host-actions" aria-label="Vistas de la arena">{actions ?? children}</nav>}
    {extra}
  </header>;
}
