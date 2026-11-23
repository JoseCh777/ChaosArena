# Plan de trabajo de Daniel

Responsable de backend/ y despliegue backend. Rama backend creada desde develop. PR hacia develop. Coordinar cambios en shared/types.ts con Jose.

| Jornada | Trabajo | Aceptación |
| --- | --- | --- |
| 1 | PIN, sala única, sesiones, normalización de apodos y autorización host | Dos jugadores distintos ingresan y duplicados se rechazan |
| 2 | Validar cuestionario, rondas, plazo, respuestas y puntuación | Una respuesta válida por persona, cierre único y puntos coherentes |
| 3 | Cuatro estrategias de evento, votación y fantasma | Efectos una vez, empate sin expulsión y aciertos independientes |
| 4 | Final, vistas privadas, controles host y despliegue | Partida online completa y Socket.IO conectado desde frontend |
| 5 | Errores, concurrencia prevista, reconexión y respaldo local | Evidencia de ensayo y arranque local con móviles |

## Módulos previstos

| Archivo en src/ | Responsabilidad |
| --- | --- |
| server.ts | Express, health check, Socket.IO, límites y autorización |
| rooms.ts | Sala única, PIN, apodos, tokens y participantes |
| questions.ts | Validar quiz y construir vistas sin soluciones |
| game.ts | Motor, fases, ronda, cierre y avance |
| scoring.ts | Base, primer acierto, rachas y evaluación |
| events.ts | Estrategias elegibles y efecto único |
| voting.ts | Candidatos, votos privados, cierre y fantasma |

Crear cada módulo al implementar su responsabilidad. La base inicial solo arranca el servidor y Socket.IO.

## Patrones que se deben demostrar

Observer mediante suscripción a cambios del GameEngine y un observador que publica vistas por Socket.IO. Strategy mediante efectos con apply(context), elegibilidad y selección intercambiable. State mediante objetos pequeños Lobby, Question, Results, Event, Voting y Finished, que reciben y autorizan acciones y delegan transiciones.

## Reglas del servidor

Usar tiempo de recepción del servidor y deadline absoluto. Validar fase, token, identidad, ronda, índice y plazo. Rechazar respuesta repetida o tardía y voto duplicado. Liquidar cada ronda y evento una sola vez. Preservar invariantes ante cierre manual y temporizador simultáneos. Implementar límite sencillo de solicitudes y tamaño de quiz. Mantener tokens, quiz privado y votos individuales fuera de snapshots públicos y logs.

Enviar claves solo después del cierre. Construir DTO explícito por rol y enviar resultado académico al titular y al anfitrión. Un fantasma sigue respondiendo y conserva puntos. Permitir retirar participantes antes del inicio mediante un comando acordado con Jose.

## Entregables

- [ ] Motor y fases con acciones autorizadas.
- [ ] Reglas de puntuación y eventos verificadas.
- [ ] Votación y fantasmas con evaluación intacta.
- [ ] Demostración localizable de Observer, Strategy y State.
- [ ] Health y Socket.IO comprobados en despliegue.
- [ ] Ensayo de concurrencia y contingencia registrado.
