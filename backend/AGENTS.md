# Instrucciones para agentes en backend/

Backend autoritativo de ChaosArena: Node + Express + Socket.IO, sala única en memoria. Responsable humano: Daniel. Leer también docs/PLAN-MAESTRO.md y docs/CONTRATO-SOCKET.md.

## Reglas de trabajo

- Tocar solo los archivos de tu tarea (tabla abajo). Si necesitas cambiar otro archivo, `shared/types.ts` o una interfaz exportada, detente y repórtalo en el resumen final en vez de cambiarlo.
- No cambiar firmas exportadas de `model.ts`, `game.ts`, `scoring.ts`, `events.ts`, `voting.ts`, `questions.ts`. Sí puedes añadir exportaciones nuevas.
- Funciones puras donde se indique. Sin `Math.random()` ni `Date.now()` directos en lógica: usar `rng`/`now` recibidos.
- Imports relativos con extensión `.js` (NodeNext). Tipos compartidos con `import type` desde `@chaos-arena/shared`.
- Tests con `node:test` + `node:assert/strict` en `src/<modulo>.test.ts`. Helpers en `src/testing.ts` (puedes añadir helpers, no cambiar los existentes).
- Antes de terminar: `npm test -w backend` y `npm run typecheck` desde la raíz, ambos en verde.
- Comentarios y mensajes en español. Commits Conventional Commits en español, por ejemplo `feat(backend): reglas de puntuación`.

## Dueños por archivo

| Archivo | Dueño | Estado |
| --- | --- | --- |
| model.ts, game.ts, rooms.ts, publisher.ts, server.ts, testing.ts | Claude (Daniel) | Implementado |
| questions.ts, scoring.ts | Tarea A | Stub con TODO(codex) |
| events.ts, voting.ts | Tarea B | Stub con TODO(agente B) |

## Reglas acordadas (fuente de verdad para tests)

### Cuestionario (questions.ts → validateQuiz)

- Entrada `unknown`. Devolver copia limpia: strings con trim, solo campos conocidos, `explanation` omitida si vacía.
- `title` 1–100. 1–50 preguntas. `id` 1–40 y único en el quiz.
- `type` `multiple` con 2–4 opciones, o `boolean` con exactamente 2 opciones.
- `prompt` 1–300, cada opción 1–120 y sin opciones duplicadas (case-insensitive), `explanation` ≤ 500.
- `correctIndex` entero dentro de rango. `seconds` entero 10–60. `points` entero 50–200.
- Error: string legible con número de pregunta, por ejemplo `Pregunta 3: la clave está fuera de rango`.

### Puntuación (scoring.ts → scoreRound)

- Un outcome por jugador de `players`, mismo orden. No mutar entradas.
- Activo acierta: `pointsDelta = points * (modifier?.baseMultiplier ?? 1) + firstCorrectBonus + streakBonus`.
- Primer acierto: +50 al acierto con menor `receivedAt` entre **activos**. Empate exacto de `receivedAt`: gana quien aparece primero en `submissions` (orden de llegada). Solo uno por ronda.
- Racha: `newStreak = streak + 1` al acertar. Bonus +150 al llegar exactamente a 3 y +300 al llegar exactamente a 5. Sin bonus en 4, 6, 7… Error u omisión reinicia a 0, y la racha puede volver a ganar bonus.
- Doble o nada (`modifier`): la base se multiplica; los bonos no. Activo que falla **u omite** recibe `pointsDelta = -wrongPenalty` (el motor recorta a 0).
- Fantasma: `answered`/`correct` reales (cuentan para lo académico), `pointsDelta = 0`, sin bonos, `newStreak = 0`, y no compite por primer acierto.
- `buildRanking`: puntos desc, luego `correctCount` desc. Empate en ambos comparte rank estilo competición (1, 1, 3). Orden estable por `joinedAt`.
- `personalResult`: `academicPercentage` = aciertos / preguntas cerradas × 100, redondeado a 2 decimales. 0 si no hubo preguntas.

### Eventos (events.ts, patrón Strategy)

- Cada efecto implementa `ChaosEffect` con `isEligible(ctx)` y `apply(ctx)`. Mutar `score` sobre `ctx.activePlayers`. El motor recorta a 0 después.
- Agujero negro (`black-hole`): un activo aleatorio pierde `floor(score * 0.2)`. Elegible con ≥1 activo con score > 0. Elegir entre los que tienen score > 0.
- Doble o nada (`double-or-nothing`): `setNextRoundModifier({ baseMultiplier: 2, wrongPenalty: 50 })`, targets = todos los activos. Elegible solo si `hasNextQuestion` y no `hasPendingModifier`.
- Loot Box (`loot-box`): un activo aleatorio +150. Elegible con ≥1 activo.
- Hackeo (`hack`): dos activos aleatorios distintos intercambian score. Elegible con ≥2 activos y que al menos dos tengan score distinto.
- `pickEffect`: uniforme entre elegibles con `ctx.rng()`; null si ninguno. Exportar `defaultEffects` con los cuatro.

### Votación (voting.ts)

- Votan y son candidatos solo los activos (`candidateIds`).
- `cast`: `VOTE_CLOSED` si cerrada o `now > deadline`; `NOT_ACTIVE` si el votante no está en candidatos; `ALREADY_VOTED` si repite; `TARGET_INVALID` si target no es candidato o es él mismo. `null` = Omitir.
- `close()` idempotente: segunda llamada devuelve el mismo resultado.
- `validVotes` = votos registrados (incluye Omitir). Si `validVotes < 3` no hay expulsión.
- Gana el candidato con más votos si es único máximo y tiene **estrictamente más** votos que Omitir. Si no, `expelledId: null`.
- El motor garantiza que quedan ≥2 activos tras la expulsión y convierte al expulsado en fantasma.
- Los votos individuales nunca se exponen fuera de la clase.
