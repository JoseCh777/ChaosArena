import { randomBytes, randomInt, timingSafeEqual } from 'node:crypto';

/** Utilidades de sala: PIN, apodos y tokens. */

export const NICKNAME_MAX = 20;
export const MAX_PLAYERS = 120;

export function generatePin(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

export function newToken(): string {
  return randomBytes(24).toString('base64url');
}

/** Colapsa espacios y recorta. Devuelve null si queda vacío o supera 20 caracteres. */
export function normalizeNickname(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const nickname = raw.normalize('NFC').replace(/\s+/g, ' ').trim();
  if (nickname.length === 0 || [...nickname].length > NICKNAME_MAX) return null;
  return nickname;
}

/** Clave de comparación sin distinguir mayúsculas. */
export function nicknameKey(nickname: string): string {
  return nickname.toLocaleLowerCase('es');
}

export function safeEqual(a: unknown, b: string): boolean {
  if (typeof a !== 'string') return false;
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
