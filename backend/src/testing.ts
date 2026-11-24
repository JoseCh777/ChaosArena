import type { Question, Quiz } from '@chaos-arena/shared';
import type { EngineDeps, PlayerState } from './model.js';

/** Utilidades compartidas por los tests. No se importa desde código de producción. */

export function fakeDeps(start = 1_000_000) {
  let now = start;
  let seq = 0;
  let rngValues: number[] = [];
  const timers: { at: number; fn: () => void; active: boolean }[] = [];
  const deps: EngineDeps = {
    now: () => now,
    setTimer(ms, fn) {
      const timer = { at: now + ms, fn, active: true };
      timers.push(timer);
      return () => {
        timer.active = false;
      };
    },
    rng: () => rngValues.shift() ?? 0,
    newId: () => `id${++seq}`,
  };
  return {
    deps,
    /** Avanza el reloj y dispara temporizadores vencidos. */
    advance(ms: number) {
      now += ms;
      for (const t of timers) if (t.active && t.at <= now) {
        t.active = false;
        t.fn();
      }
    },
    setRng(values: number[]) {
      rngValues = [...values];
    },
  };
}

export function question(overrides: Partial<Question> = {}): Question {
  return {
    id: 'q1',
    type: 'multiple',
    prompt: '¿Qué patrón separa algoritmos intercambiables?',
    options: ['Observer', 'Strategy', 'State', 'Singleton'],
    correctIndex: 1,
    seconds: 20,
    points: 100,
    ...overrides,
  };
}

export function quiz(count = 3): Quiz {
  return { title: 'Prueba', questions: Array.from({ length: count }, (_, i) => question({ id: `q${i + 1}` })) };
}

export function player(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    id: 'p1',
    token: 't1',
    nickname: 'Ana',
    status: 'active',
    score: 0,
    correctCount: 0,
    streak: 0,
    joinedAt: 0,
    ...overrides,
  };
}
