import type { Power, PrivateChaos } from '../../shared/runtime-chaos.js';
import type { PlayerRoundOutcome, PlayerState, RoundState } from './model.js';

export const powers: readonly Power[] = ['proxy', 'decorator', 'memento', 'adapter', 'prototype', 'command'];

interface Inventory {
  items: Power[];
  usedAt?: number;
  proxy: boolean;
  decorator: boolean;
  prototype: boolean;
  firewallUntil?: number;
  suppressedAt?: number;
  lastLoss: number;
}

export class RuntimePowers {
  private readonly inventories = new Map<string, Inventory>();

  reset() { this.inventories.clear(); }
  remove(id: string) { this.inventories.delete(id); }

  private get(id: string): Inventory {
    const current = this.inventories.get(id);
    if (current) return current;
    const initial: Inventory = { items: [], proxy: false, decorator: false, prototype: false, lastLoss: 0 };
    this.inventories.set(id, initial);
    return initial;
  }

  grant(id: string, power: Power) {
    const { items } = this.get(id);
    if (items.length >= 2 || items.includes(power)) return false;
    items.push(power);
    return true;
  }

  grantFirewall(id: string, index: number) { this.get(id).firewallUntil = index + 2; }
  suppress(id: string, index: number) { this.get(id).suppressedAt = index + 1; }
  recordLoss(id: string, loss: number) { if (loss > 0) this.get(id).lastLoss = loss; }

  firewall(id: string, index: number) { return (this.get(id).firewallUntil ?? -1) >= index; }
  block(id: string, index: number) {
    const item = this.get(id);
    if (this.firewall(id, index)) { item.firewallUntil = undefined; return true; }
    if (item.proxy) { item.proxy = false; return true; }
    return false;
  }

  rewardPoints(player: PlayerState) {
    const item = this.get(player.id);
    const reward = item.prototype ? 300 : 150;
    item.prototype = false;
    player.score += reward;
    return reward;
  }

  available(player: PlayerState, index: number, duelAdapter: boolean, canCommand: boolean, regular = true) {
    const item = this.get(player.id);
    if (player.status !== 'active' || item.usedAt === index) return [];
    return item.items.filter(power => {
      if (power === 'adapter') return duelAdapter;
      if (power === 'command') return canCommand;
      if (!regular) return false;
      if (power === 'memento') return item.lastLoss > 0;
      return !item[power];
    });
  }

  view(player: PlayerState, index: number, duelAdapter: boolean, canCommand: boolean, regular: boolean): PrivateChaos {
    const item = this.get(player.id);
    return {
      items: [...item.items], available: this.available(player, index, duelAdapter, canCommand, regular),
      shield: item.proxy || this.firewall(player.id, index), suppressed: item.suppressedAt === index,
    };
  }

  consume(player: PlayerState, power: Power, index: number) {
    const item = this.get(player.id);
    item.items.splice(item.items.indexOf(power), 1);
    item.usedAt = index;
    switch (power) {
      case 'proxy': case 'decorator': case 'prototype':
        item[power] = true;
        break;
      case 'memento':
        player.score += Math.min(150, item.lastLoss);
        item.lastLoss = 0;
        break;
    }
  }

  points(player: PlayerState, round: RoundState, outcome: PlayerRoundOutcome) {
    let points = outcome.pointsDelta;
    const item = this.get(player.id);
    if (item.suppressedAt === round.questionIndex) points -= outcome.firstCorrectBonus + outcome.streakBonus;
    if (player.status === 'active' && outcome.correct) {
      if (item.decorator) {
        const multiplier = round.modifier?.baseMultiplier ?? 1;
        const base = round.question.points;
        points += Math.floor(base * Math.max(1.5, multiplier)) - base * multiplier;
        item.decorator = false;
      }
      if (outcome.newStreak === 3) this.grant(player.id, 'decorator');
    }
    return points;
  }
}
