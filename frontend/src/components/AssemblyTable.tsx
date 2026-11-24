import type { RuntimeDisplayView } from '../../../shared/runtime-chaos';
import './assembly.css';

export function AssemblyTable({ view }: { view: RuntimeDisplayView }) {
  const seats = view.players.filter(player => view.voting?.candidates.includes(player.id));
  const visible = seats.slice(0, 8);
  return <div className="assembly-art" aria-label="Mesa de la asamblea">
    <div className="assembly-disc"><strong>Voto secreto</strong><small>{view.voting?.received ?? 0}/{view.voterCount ?? seats.length} votos</small></div>
    {visible.map((player, index) => {
      const angle = 2 * Math.PI * index / visible.length - Math.PI / 2;
      return <span className="assembly-seat" key={player.id} title={player.nickname}
        style={{ left: `${50 + 37 * Math.cos(angle)}%`, top: `${50 + 38 * Math.sin(angle)}%` }}>
        <b aria-hidden="true">{Array.from(player.nickname.trim()).slice(0, 2).join('').toUpperCase()}</b><small>{player.nickname}</small>
      </span>;
    })}
    {seats.length > 8 && <small className="assembly-extra">{seats.slice(8).map(player => player.nickname).join(' · ')}</small>}
  </div>;
}
