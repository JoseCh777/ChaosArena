import { randomInt } from 'node:crypto';
import type { ChaosEvent } from '@chaos-arena/shared';
import type { LiveEvent } from '../../shared/live.js';

interface Participant { nickname: string; score: number }

export function rollEffect(players: Participant[], final: boolean): LiveEvent | undefined {
  if (randomInt(100) >= 30) return;
  const types: ChaosEvent[] = ['black-hole', 'loot-box'];
  if (!final) types.push('double-or-nothing');
  if (players.length >= 2) types.push('hack');
  const type = types[randomInt(types.length)];
  const first = players[randomInt(players.length)];
  let targets = [first.nickname];
  let description: string;
  switch (type) {
    case 'loot-box':
      first.score += 150;
      description = `${first.nickname} gana 150 puntos.`;
      break;
    case 'black-hole': {
      const lost = Math.floor(first.score * .2);
      first.score -= lost;
      description = `${first.nickname} pierde ${lost} puntos (20 % del saldo).`;
      break;
    }
    case 'hack': {
      const others = players.filter(player => player !== first);
      const second = others[randomInt(others.length)];
      [first.score, second.score] = [second.score, first.score];
      targets = [first.nickname, second.nickname];
      description = `${targets.join(' y ')} intercambian sus puntos.`;
      break;
    }
    case 'double-or-nothing':
      targets = players.map(player => player.nickname);
      description = 'La próxima respuesta correcta vale el doble. Un error resta 50 puntos.';
      break;
  }
  return { type, targets, description, started: Date.now() };
}
