# Ensayo de carga de la arena en vivo

**Fecha** 23 de noviembre de 2026, hora de Bogotá (UTC−5).

**Entorno** Windows, Node.js v24.21.0, servidor y bots en la misma máquina. Backend `0fd50b8`.

## Ejecución

Desde la raíz del worktree, iniciar el backend en una terminal y ejecutar los bots en otra.

```sh
npm ci
node --import tsx backend/src/server.ts
```

```sh
npx tsx backend/scripts/load-test.ts
npx tsx backend/scripts/load-test.ts 80 http://localhost:3001
```

La primera orden de bots usa los valores por defecto de 40 bots y `http://localhost:3001`. Cada bot abre su propia conexión a `/arena`. El primero ingresa como anfitrión e inicia con el cuestionario predeterminado cuando todos han entrado. El anfitrión responde enseguida y los demás eligen una opción al azar tras una demora uniforme de 0 a 3 segundos. Cada bot elegible vota Omitir una vez por asamblea.

Se midió el tiempo de ida y vuelta desde el envío del comando hasta el acuse de recibo (ack), en milisegundos y con percentiles por rango más próximo. Los envíos sin ack se cuentan aparte. El plazo para recibirlo es de 5,5 segundos. Las vistas se cuentan por bot hasta su primera vista `finished`, inclusive. La salida JSON incluye el detalle por bot y las métricas por comando. La duración incluye el ingreso a la sala y termina cuando todos reciben `finished`.

## Resultados con el cuestionario predeterminado

| Métrica | 40 bots | 80 bots |
| --- | ---: | ---: |
| Inicio (hora de Bogotá) | 20:52:14 | 20:52:40 |
| Duración | 24,904 s | 31,162 s |
| Preguntas completadas | 3 | 3 |
| Asambleas abiertas | 0 | 0 |
| Respuestas aceptadas / enviadas | 120 / 120 | 240 / 240 |
| Respuestas rechazadas | 0 | 0 |
| Comandos sin ack | 0 | 0 |
| Vistas totales | 6.720 | 26.320 |
| Vistas por bot (mín. / p50 / máx.) | 129 / 167 / 207 | 250 / 328 / 408 |
| Bots que llegaron a `finished` | 40 / 40 | 80 / 80 |

| Comando | Ack con 40 bots | p50 / p95 / máx. (ms) | Ack con 80 bots | p50 / p95 / máx. (ms) |
| --- | ---: | ---: | ---: | ---: |
| `join` | 40 | 51,67 / 64,70 / 65,86 | 80 | 111,90 / 289,92 / 386,96 |
| `start` | 1 | 21,02 / 21,02 / 21,02 | 1 | 101,31 / 101,31 / 101,31 |
| `answer` | 120 | 2,42 / 4,58 / 6,58 | 240 | 8,93 / 22,18 / 34,25 |
| `vote` | 0 | — | 0 | — |
| `leave` | 40 | 36,30 / 40,06 / 40,72 | 80 | 136,07 / 154,41 / 154,84 |

## Comprobación de Omitir

El cuestionario predeterminado tiene tres preguntas. El piloto automático abre asambleas después de las preguntas 5 y 10 si se cumplen las condiciones. Para verificar el comportamiento de los bots se ejecutó el mismo adaptador `/arena` en el puerto 3002, con una asamblea programada después de la primera pregunta y la ruleta deshabilitada.

```sh
node --import tsx --input-type=module -e "
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { attachArena } from './backend/src/liveArena.ts';
const http = createServer((_request, response) => response.end('ok'));
const io = new Server(http);
attachArena(io.of('/arena'), {
  autopilot: { revealMs: 30, rouletteMs: 30, eventChance: 0, voteAfter: [1] }
});
http.listen(3002, '127.0.0.1');
"
```

```sh
npx tsx backend/scripts/load-test.ts 4 http://127.0.0.1:3002
```

Los cuatro votos Omitir se aceptaron. Sus acuses tuvieron p50 de 1,34 ms, p95 de 1,66 ms y máximo de 1,66 ms. Los cuatro bots llegaron a `finished`.

## Conclusiones

- La partida con 80 bots terminó con las tres rondas completas y sin rechazos. El ingreso simultáneo tuvo el p95 más alto de los comandos medidos, 289,92 ms.
- Al duplicar los bots se recibieron 3,9 veces más vistas. El aumento es coherente con la publicación de vistas individuales a todos los jugadores mientras cambian el lobby y el progreso de cada ronda.
- Se hizo una ejecución por tamaño de sala, en loopback y con las pausas y sorteos del piloto automático. Las cifras caracterizan estas partidas locales. La latencia por red y la carga de asambleas con 40 u 80 bots quedan por medir.
