import type { PublicPlayer, PublicSnapshot } from '@chaos-arena/shared';

export const DEMO_PIN = '482913';
export const GAME_KEY = 'chaos-arena.demo-game';
const SESSION_KEY = 'chaos-arena.demo-player';
const demoPlayers: PublicPlayer[] = [
  { id: 'demo-luna', nickname: 'Luna', score: 0, status: 'active' },
  { id: 'demo-nova', nickname: 'Nova', score: 0, status: 'active' },
];

type JoinResult = { ok: true } | { ok: false; field: 'pin' | 'nickname' | 'form'; message: string };

export function joinDemoRoom(pin: string, nickname: string): JoinResult {
  if (!/^\d{6}$/.test(pin)) {
    return { ok: false, field: 'pin', message: 'Escribe los seis dígitos del PIN.' };
  }
  if (pin !== DEMO_PIN) {
    return { ok: false, field: 'pin', message: 'No encontramos una sala con ese PIN.' };
  }

  const name = nickname.trim().replace(/\s+/g, ' ');
  if (!name || name.length > 20) {
    return { ok: false, field: 'nickname', message: 'Escribe un apodo de 1 a 20 caracteres.' };
  }
  if (demoPlayers.some(player => player.nickname.toLocaleLowerCase('es') === name.toLocaleLowerCase('es'))) {
    return { ok: false, field: 'nickname', message: 'Ese apodo ya está en uso. Prueba con otro.' };
  }

  try {
    sessionStorage.removeItem(GAME_KEY);
    sessionStorage.setItem(SESSION_KEY, name);
    return { ok: true };
  } catch {
    return { ok: false, field: 'form', message: 'Activa el almacenamiento del navegador para entrar.' };
  }
}

export function readDemoRoom(): { playerId: string; snapshot: PublicSnapshot } | undefined {
  let nickname: string | null;
  try {
    nickname = sessionStorage.getItem(SESSION_KEY);
  } catch {
    return undefined;
  }
  if (!nickname) return undefined;

  const playerId = 'local-player';
  return {
    playerId,
    snapshot: {
      pin: DEMO_PIN,
      phase: 'lobby',
      players: [...demoPlayers, { id: playerId, nickname, score: 0, status: 'active' }],
      questionIndex: -1,
      questionCount: 0,
    },
  };
}

export function leaveDemoRoom() {
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(GAME_KEY);
}
