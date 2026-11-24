import './arena-header.css';

const destinations = [
  ['/join', 'Ingreso'],
  ['/host', 'Anfitrión'],
  ['/display', 'Proyector'],
  ['/editor', 'Editor'],
] as const;

export type ArenaDestination = typeof destinations[number][0];

export function ArenaHeader({ current, label, onReturnToHost }: {
  current: ArenaDestination;
  label?: string;
  onReturnToHost?: () => void;
}) {
  return <header className="arena-header">
    <div className="arena-brand">
      <img src="/brand/chaos-arena-mark.png" alt="" width="36" height="40" />
      <strong>ChaosArena</strong>
    </div>
    {label && <span className="arena-header-status">{label}</span>}
    <nav aria-label="Vistas de la arena">
      {destinations.map(([path, name]) => path === '/host' && onReturnToHost
        ? <button className="button button-text" type="button" key={path} onClick={onReturnToHost}>{name}</button>
        : <a className="button button-text" key={path} href={path}
          aria-current={current === path ? 'page' : undefined}>{name}</a>)}
    </nav>
  </header>;
}
