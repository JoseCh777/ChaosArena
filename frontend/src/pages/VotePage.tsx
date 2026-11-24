import { useEffect, useState } from 'react';
import type { RuntimeArenaView } from '../../../shared/runtime-chaos';
import { AssemblyTable } from '../components/AssemblyTable';
import { RoundTimer } from '../components/RoundTimer';
import { command } from '../services/arena';

export function VotePage({ view, online }: { view: RuntimeArenaView; online: boolean }) {
  const voting = view.voting!;
  const [now, setNow] = useState(Date.now);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const eligible = view.canVote ?? voting.candidates.includes(view.you);
  const remaining = Math.max(0, (voting.deadline - now) / 1000);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(timer);
  }, []);

  async function vote(target: string | null) {
    setPending(true);
    setError('');
    const reply = await command('vote', { id: voting.id, target });
    if (!reply.ok) setError(reply.error);
    setPending(false);
  }

  return <section className="assembly-vote">
      <h2 className="assembly-call">¡Atención, asamblea!</h2>
      <AssemblyTable view={view} />
      <RoundTimer seconds={remaining} totalSeconds={20} />
      {view.protectedIds?.includes(view.you) && <p role="status">Firewall te protege de la expulsión.</p>}
      {eligible && !view.voted ? <div className="game-options">
        {view.players.filter(p => p.id !== view.you && p.rank > 0 && voting.candidates.includes(p.id) && !view.protectedIds?.includes(p.id)).map(player =>
          <button className="game-option" key={player.id} disabled={pending || !online || !remaining}
            onClick={() => vote(player.id)}>{player.nickname}</button>)}
        <button className="button button-text" disabled={pending || !online || !remaining} onClick={() => vote(null)}>Omitir</button>
      </div> : <p className="lock-feedback" role="status">{view.voted
        ? 'Voto registrado. Espera el cierre de la votación.'
        : 'Observas esta votación. La partida continúa al cerrarse la asamblea.'}</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
  </section>;
}
