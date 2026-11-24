import type { Power, Reaction, RuntimeEvent } from '../../../shared/runtime-chaos';

export const eventLabels: Record<RuntimeEvent, string> = {
  'black-hole': 'Agujero negro',
  'double-or-nothing': 'Doble o nada',
  'error-404': 'Error 404',
  firewall: 'Firewall',
  'loot-box': 'Loot Box',
  hack: 'Hackeo',
  duel: 'Duelo',
  respawn: 'Respawn',
};

export const powerInfo: Record<Power, { label: string; description: string }> = {
  proxy: { label: 'Proxy', description: 'Bloquea un ataque dirigido.' },
  decorator: { label: 'Decorator', description: 'Multiplica por 1,5 la base de tu próximo acierto.' },
  memento: { label: 'Memento', description: 'Recupera hasta 150 puntos perdidos en el último evento que te afectó.' },
  adapter: { label: 'Adapter', description: 'Descarta dos opciones incorrectas en el duelo.' },
  prototype: { label: 'Prototype', description: 'Duplica tu próxima recompensa de puntos de Loot Box.' },
  command: { label: 'Command', description: 'Invita a otro jugador a un duelo.' },
};

export const reactions: Record<Reaction, string> = {
  racha: 'Racha de cinco',
  'todos-aciertan': 'Misión cumplida · todos acertaron',
  'nadie-acierta': 'Nadie acertó esta vez',
  empate: 'Empate en el primer puesto',
  expulsion: 'Un jugador pasa a modo fantasma',
};
