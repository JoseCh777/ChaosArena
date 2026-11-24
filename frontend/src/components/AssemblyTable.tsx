import type { RuntimeDisplayView } from '../../../shared/runtime-chaos';
import './assembly.css';

export function AssemblyTable({ view }: { view: RuntimeDisplayView }) {
  const seats = view.players.filter(player => view.voting?.candidates.includes(player.id));
  return <div className="assembly-art" aria-label="Mesa de la asamblea">
    <div className="assembly-disc"><strong>ASAMBLEA</strong><small>{seats.length} en la mesa</small></div>
    {seats.slice(0, 8).map((player, index) => {
      const angle = 2 * Math.PI * index / Math.min(seats.length, 8) - Math.PI / 2;
      return <span className="assembly-seat" key={player.id} title={player.nickname}
        style={{ left: `${50 + 39 * Math.cos(angle)}%`, top: `${50 + 39 * Math.sin(angle)}%` }}>
        <b>{Array.from(player.nickname)[0]}</b><small>{player.nickname}</small>
      </span>;
    })}
    {seats.length > 8 && <small className="assembly-extra">+{seats.length - 8} participantes</small>}
  </div>;
}
