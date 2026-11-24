import type { RankingEntry } from '@chaos-arena/shared';
import type { ArenaAward } from '../../shared/runtime-chaos.js';
import type { PlayerState } from './model.js';

export class ArenaAwards {
  private readonly streak = new Map<string, number>();
  private readonly lowest = new Map<string, number>();

  reset() {
    this.streak.clear();
    this.lowest.clear();
  }

  record(ranking: RankingEntry[], players: ReadonlyMap<string, PlayerState>) {
    for (const player of ranking) {
      this.lowest.set(player.id, Math.max(this.lowest.get(player.id) ?? 0, player.rank));
      this.streak.set(player.id, Math.max(this.streak.get(player.id) ?? 0, players.get(player.id)?.streak ?? 0));
    }
  }

  finish(ranking: RankingEntry[], players: ReadonlyMap<string, PlayerState>): ArenaAward[] {
    const award = (kind: ArenaAward['kind'], minimum: number, metric: (player: RankingEntry) => number) => {
      const best = Math.max(0, ...ranking.map(metric));
      if (best < minimum) return [];
      const names = ranking.filter(player => metric(player) === best).map(player => player.nickname);
      // La cantidad de aciertos se mantiene en los resultados privados.
      return [{ kind, names, amount: kind === 'accuracy' ? undefined : best }];
    };
    return [
      ...award('streak', 2, player => this.streak.get(player.id) ?? 0),
      ...award('comeback', 1, player => (this.lowest.get(player.id) ?? player.rank) - player.rank),
      ...award('accuracy', 1, player => players.get(player.id)?.correctCount ?? 0),
    ];
  }
}
