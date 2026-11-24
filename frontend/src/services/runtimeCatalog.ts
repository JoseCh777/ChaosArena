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

export const eventDescriptions: Record<RuntimeEvent, string> = {
  'black-hole': 'Un jugador pierde el 20 % de sus puntos, a menos que un escudo bloquee el ataque.',
  'double-or-nothing': 'En la próxima pregunta, acertar duplica los puntos base. Fallar o no responder resta 50 puntos.',
  'error-404': 'Un jugador pierde los bonos de rapidez y de racha en la próxima pregunta. Conserva los puntos base.',
  firewall: 'Un jugador recibe un escudo que bloquea un ataque durante las próximas dos rondas.',
  'loot-box': 'Un jugador recibe puntos, un escudo o un poder al azar.',
  hack: 'Dos jugadores con puntajes distintos intercambian sus puntos. Los escudos protegen del intercambio.',
  duel: 'Dos jugadores reciben una invitación a un duelo de exhibición. Ambos deben aceptar para jugarlo.',
  respawn: 'Un fantasma vuelve al juego con los puntos y poderes que tenía.',
};

export const rouletteTypes = Object.keys(eventLabels) as RuntimeEvent[];

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
