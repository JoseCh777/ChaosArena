import { io } from 'socket.io-client';
import { useSyncExternalStore } from 'react';
import type { ArenaCommands, ArenaView, Reply } from '../../../shared/live';

const key = 'chaos-arena.live-session';
export const sessionToken = () => sessionStorage.getItem(key);
export const remember = (token: string) => sessionStorage.setItem(key, token);
export function forget() { sessionStorage.removeItem(key); }

const url = import.meta.env.VITE_SOCKET_URL || window.location.origin;
const socket = io(url.replace(/\/$/, '') + '/arena', { autoConnect: false });
type State = { view?: ArenaView; online: boolean; message: string };
let state: State = { online: false, message: 'Conectando con la arena…' };
const listeners = new Set<() => void>();
function update(next: State) { state = next; listeners.forEach(listener => listener()); }
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
export const useArena = () => useSyncExternalStore(subscribe, () => state);

export async function command<K extends keyof ArenaCommands>(kind: K, payload: ArenaCommands[K]): Promise<Reply> {
  if (!socket.connected) socket.connect();
  try {
    return await socket.timeout(5500).emitWithAck('command', kind, payload);
  } catch {
    return { ok: false, error: 'Sin respuesta del servidor. Comprueba la conexión e inténtalo de nuevo.' };
  }
}

socket.on('view', (view: ArenaView) => update({ view, online: true, message: '' }));
socket.on('disconnect', () => update({ ...state, online: false, message: 'Reconectando con la arena…' }));
socket.on('connect_error', () => update({ ...state, online: false, message: 'Esperando al servidor…' }));
socket.on('connect', async () => {
  const token = sessionToken();
  if (token) {
    const reply = await command('resume', { token });
    if (!reply.ok) {
      if (reply.error.startsWith('Tu sesión terminó')) forget();
      update({ online: false, message: reply.error });
    }
  }
});
if (sessionToken()) socket.connect();
