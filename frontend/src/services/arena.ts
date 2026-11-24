import { io } from 'socket.io-client';
import { useSyncExternalStore } from 'react';
import type { ArenaCommands, ArenaView, DisplayView, Reply } from '../../../shared/live';

const key = 'chaos-arena.live-session';
export const sessionToken = () => sessionStorage.getItem(key);
export const remember = (token: string) => sessionStorage.setItem(key, token);
export function forget() { sessionStorage.removeItem(key); }

const url = import.meta.env.VITE_SOCKET_URL || window.location.origin;
const socket = io(url.replace(/\/$/, '') + '/arena', { autoConnect: false });
type State = { view?: ArenaView; display?: DisplayView; online: boolean; message: string };
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

function alignClock(view: DisplayView) {
  const offset = Date.now() - view.serverNow;
  if (view.round) view.round.deadline += offset;
  if (view.event) view.event.started += offset;
}
socket.on('view', (view: ArenaView) => {
  alignClock(view);
  update({ ...state, view, online: true, message: '' });
});
socket.on('display', (display: DisplayView) => {
  alignClock(display);
  update({ ...state, display, online: true, message: '' });
});
socket.on('disconnect', () => update({ ...state, online: false, message: 'Reconectando con la arena…' }));
socket.on('connect_error', () => update({ ...state, online: false, message: 'Esperando al servidor…' }));
socket.on('connect', async () => {
  if (window.location.pathname.replace(/\/$/, '') === '/display') {
    await command('observe', {});
    return;
  }
  const token = sessionToken();
  if (token) {
    const reply = await command('resume', { token });
    if (!reply.ok) {
      if (reply.error.startsWith('Tu sesión terminó')) forget();
      update({ online: false, message: reply.error });
    }
  }
});
if (sessionToken() || window.location.pathname.replace(/\/$/, '') === '/display') socket.connect();
