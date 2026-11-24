import type { ChaosEvent } from '@chaos-arena/shared';

const eventTypes = ['black-hole', 'double-or-nothing', 'loot-box', 'hack'] as const;

export interface DemoEvent {
  afterRound: number;
  type: ChaosEvent;
  targets: number[];
}

export const eventLabels: Record<ChaosEvent, string> = {
  'black-hole': 'Agujero negro',
  'double-or-nothing': 'Doble o nada',
  'loot-box': 'Loot Box',
  hack: 'Hackeo',
};

export function drawDemoEvent(afterRound: number, playerCount: number): DemoEvent {
  const eligible = playerCount > 1 ? eventTypes : eventTypes.filter(type => type !== 'hack');
  const type = eligible[Math.floor(Math.random() * eligible.length)];
  const players = Array.from({ length: playerCount }, (_, index) => index);
  if (type === 'double-or-nothing') return { afterRound, type, targets: players };
  const [first] = players.splice(Math.floor(Math.random() * players.length), 1);
  const targets = type === 'hack' ? [first, players[Math.floor(Math.random() * players.length)]] : [first];
  return { afterRound, type, targets };
}

export function applyDemoEvent(event: DemoEvent, players: { score: number }[]) {
  const [first, second] = event.targets;
  switch (event.type) {
    case 'black-hole':
      players[first].score -= Math.floor(players[first].score * .2);
      break;
    case 'loot-box':
      players[first].score += 150;
      break;
    case 'hack':
      [players[first].score, players[second].score] = [players[second].score, players[first].score];
      break;
  }
}

export function validDemoEvents(events: unknown, lastRound: number, totalRounds: number): events is DemoEvent[] {
  if (!Array.isArray(events)) return false;
  const rounds = new Set<number>();
  return events.every((event: DemoEvent | null) => {
    if (!event || !eventTypes.includes(event.type) || !Number.isInteger(event.afterRound)
      || event.afterRound < 0 || event.afterRound > lastRound || event.afterRound >= totalRounds - 1
      || rounds.has(event.afterRound) || !Array.isArray(event.targets)) return false;
    const count = event.type === 'double-or-nothing' ? 3 : event.type === 'hack' ? 2 : 1;
    rounds.add(event.afterRound);
    return event.targets.length === count && new Set(event.targets).size === count
      && event.targets.every(target => Number.isInteger(target) && target >= 0 && target < 3);
  });
}
