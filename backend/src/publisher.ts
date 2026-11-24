import type { Server } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@chaos-arena/shared';
import type { EngineChange, GameEngine } from './game.js';

/**
 * Observador concreto: traduce cambios del motor a emisiones Socket.IO autorizadas por rol.
 * Credenciales, claves antes del cierre y votos individuales nunca pasan por aquí.
 */

export type ArenaServer = Server<ClientToServerEvents, ServerToClientEvents>;

export const channels = {
  all: (pin: string) => `room:${pin}`,
  host: (pin: string) => `host:${pin}`,
  display: (pin: string) => `display:${pin}`,
  player: (playerId: string) => `player:${playerId}`,
};

export function attachSocketPublisher(io: ArenaServer, engine: GameEngine): () => void {
  const pin = engine.pin;
  const all = channels.all(pin);
  const staff = [channels.host(pin), channels.display(pin)];

  const sendPrivateViews = () => {
    for (const id of engine.players.keys()) {
      const view = engine.privateView(id);
      if (view) io.to(channels.player(id)).emit('player:private', view);
    }
  };

  return engine.subscribe((change: EngineChange) => {
    switch (change.kind) {
      case 'snapshot':
        io.to(all).emit('room:snapshot', engine.publicSnapshot());
        sendPrivateViews();
        return;
      case 'round:open':
        return void io.to(all).emit('round:open', change.round);
      case 'round:progress':
        return void io.to(staff).emit('round:progress', change.progress);
      case 'round:result':
        return void io.to(all).emit('round:result', change.result);
      case 'event:result':
        return void io.to(all).emit('event:result', change.result);
      case 'vote:open':
        return void io.to(all).emit('vote:open', change.vote);
      case 'vote:result':
        return void io.to(all).emit('vote:result', change.result);
      case 'player:kicked': {
        const room = channels.player(change.playerId);
        io.to(room).emit('player:kicked');
        io.in(room).socketsLeave([all, room]);
        return;
      }
      case 'finished':
        io.to(channels.display(pin)).emit('game:finished', engine.finishedView('display'));
        io.to(channels.host(pin)).emit('game:finished', engine.finishedView('host'));
        for (const id of engine.players.keys()) {
          const view = engine.finishedView('player', id);
          if (view) io.to(channels.player(id)).emit('game:finished', view);
        }
        return;
    }
  });
}
