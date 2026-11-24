import type { ArenaAward, RuntimePublic } from '../../../shared/runtime-chaos';
import '../styles/arena-moments.css';

type RoundInfo = Pick<RuntimePublic, 'roundStage'> & { number: number; total: number };

export function RoundMoment({ view }: { view: RoundInfo }) {
  if (!view.roundStage || view.total < 1) return null;
  const boss = view.roundStage === 'boss';
  const segments = Math.ceil((view.total - 1) / 5);
  const position = boss ? segments + 1 : Math.ceil(view.number / 5);
  return <div className="arena-round-moment" data-boss={boss || undefined}>
    <div>
      <strong>{boss ? 'Caso jefe' : `Bloque ${position} de ${segments}`}</strong>
      <span>{boss ? 'Desafío final · 150 pts base' : `Pregunta ${view.number} de ${view.total}`}</span>
    </div>
    <div className="arena-round-segments" aria-hidden="true">
      {Array.from({ length: segments + 1 }, (_, index) => (
        <i key={index} data-finished={index + 1 < position || undefined} data-current={index + 1 === position || undefined} />
      ))}
    </div>
  </div>;
}

const titles = { streak: 'Mayor racha', comeback: 'Remontada', accuracy: 'Más aciertos' };

export function ArenaRecognitions({ awards }: { awards?: ArenaAward[] }) {
  if (!awards?.length) return null;
  return <section className="arena-recognitions" aria-labelledby="recognitions-title">
    <h2 id="recognitions-title">Reconocimientos</h2>
    <ul>
      {awards.map(({ kind, names, amount }) => <li data-award={kind} key={kind}>
        <span>{titles[kind]}</span>
        <strong>{names.slice(0, 3).join(' · ')}{names.length > 3 ? ` · +${names.length - 3}` : ''}</strong>
        {amount !== undefined && <small>{kind === 'streak' ? `${amount} seguidas` : `${amount} ${amount === 1 ? 'puesto ganado' : 'puestos ganados'}`}</small>}
      </li>)}
    </ul>
  </section>;
}
