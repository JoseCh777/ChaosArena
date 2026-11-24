import { io } from 'socket.io-client';
import { useSyncExternalStore } from 'react';
import type { RuntimeArenaView, RuntimeDisplayView, RuntimeCommands, RuntimePublic } from '../../../shared/runtime-chaos';
import type { ArenaCommands, ArenaHostCommands, ArenaRoomLifecycleCommands, DisplayView, Reply, ArenaSettings } from '../../../shared/live';

const key = 'chaos-arena.live-session';
export const sessionToken = () => sessionStorage.getItem(key);
export const remember = (token: string) => sessionStorage.setItem(key, token);
export function forget() { sessionStorage.removeItem(key); }

const url = import.meta.env.VITE_SOCKET_URL || window.location.origin;
const socket = io(url.replace(/\/$/, '') + '/arena', { autoConnect: false });
type State = { ended?: boolean; view?: RuntimeArenaView; display?: RuntimeDisplayView; online: boolean; message: string };
let state: State = { online: false, message: 'Conectando con la arena…' };
const listeners = new Set<() => void>();
function update(next: State) { state = next; listeners.forEach(listener => listener()); }
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
export const useArena = () => useSyncExternalStore(subscribe, () => state);

type Commands = Omit<ArenaCommands, 'start'> & ArenaHostCommands & ArenaRoomLifecycleCommands & RuntimeCommands & {
  start: ArenaCommands['start'] & { settings?: ArenaSettings; bankSize?: 16 | 32 | 48; roulette?: boolean; rouletteChallenges?: boolean };
};

export async function command<K extends keyof Commands>(kind: K, payload: Commands[K]): Promise<Reply> {
  try {
    if (!socket.connected) await waitForConnection();
    return await socket.timeout(5500).emitWithAck('command', kind, payload);
  } catch {
    return { ok: false, error: 'Sin respuesta del servidor. Comprueba la conexión e inténtalo de nuevo.' };
  }
}

function waitForConnection() {
  return new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timer);
      socket.off('connect', connected);
      socket.off('connect_error', failed);
    };
    const connected = () => { cleanup(); resolve(); };
    const failed = () => { cleanup(); reject(new Error('Conexión no disponible')); };
    const timer = setTimeout(failed, 5500);
    socket.once('connect', connected);
    socket.once('connect_error', failed);
    socket.connect();
  });
}

if (import.meta.hot) import.meta.hot.dispose(() => socket.disconnect());

function alignClock(view: DisplayView & RuntimePublic) {
  const offset = Date.now() - view.serverNow;
  if (view.duel) view.duel.deadline += offset;
  if (view.chaosEvent) view.chaosEvent.started += offset;
  if (view.reaction) view.reaction.started += offset;
  if (view.showFact) view.showFact.started += offset;
  if (view.round) view.round.deadline += offset;
  if (view.voting) view.voting.deadline += offset;
  if (view.event) view.event.started += offset;
}
socket.on('view', (view: RuntimeArenaView) => {
  alignClock(view);
  update({ ...state, view, online: true, message: '' });
});
socket.on('display', (display: RuntimeDisplayView) => {
  alignClock(display);
  update({ ...state, display, online: true, message: '' });
});
socket.on('removed', (reason?: string) => {
  forget();
  update({ ended: true, online: false, message: reason ?? 'El anfitrión te retiró de la sala.' });
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
