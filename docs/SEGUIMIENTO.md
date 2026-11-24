# Seguimiento y aceptación

Actualizar las casillas con evidencia al integrar cada hito en develop. Cinco jornadas relativas al inicio efectivo de implementación.

## Base del repositorio

- [x] Estructura de workspaces frontend, backend y shared.
- [x] Configuración TypeScript y scripts de desarrollo y build.
- [x] Arranque Express y transporte Socket.IO, con endpoint /health.
- [x] Arranque React/Vite y tokens suministrados.
- [x] Contexto, planes individuales y flujo Git documentados.
- [ ] Contrato completo acordado entre ambos.

## Hitos conjuntos

- [ ] Jornada 1 con dos móviles conectados a la misma sala.
- [ ] Jornada 2 con editor y pregunta completa, puntos correctos y cierre único.
- [ ] Jornada 3 con efecto y expulsión, manteniendo la evaluación del fantasma.
- [ ] Jornada 4 con partida online completa y funcionalidades congeladas.
- [ ] Jornada 5 con ensayo, evidencia y contingencia local.

## Pruebas de entrega

- [ ] Editor crea, modifica, elimina y ordena, conserva JSON y rechaza datos inválidos.
- [ ] PIN erróneo, apodo vacío y duplicado rechazados.
- [ ] Jugador sin privilegios no puede controlar partida ni recibir claves antes del cierre.
- [ ] Respuestas duplicadas, tardías y con opción inválida rechazadas.
- [ ] Cierre concurrente o repetido liquida la ronda una sola vez.
- [ ] Ranking, bonos, rachas y marcador académico correctos.
- [ ] Eventos elegibles aplicados una vez y puntos sin negativos.
- [ ] Empate u Omitir impiden expulsión y permanecen al menos dos activos.
- [ ] Fantasma conserva puntos y sigue acumulando aciertos académicos.
- [ ] Proyector maneja audio, mute y fallo multimedia sin bloquear ronda.
- [ ] Resultados privados por rol y tres patrones demostrables en código.
- [ ] Ensayo con concurrencia prevista, desconexión, móviles y proyector.
- [ ] Arranque local y acceso desde dos teléfonos.
- [ ] README, JSON revisado, URL y evidencia listos para entregar.

## Registro de evidencia

| Fecha | Rama o commit | Flujo probado | Resultado y pendiente | Responsable |
| --- | --- | --- | --- | --- |
| 2026-11-23 | Base inicial de develop | TypeScript de los tres workspaces, build frontend y backend, HTTP health, Vite y conexión WebSocket Socket.IO | Correcto. Enlaces Markdown comprobados. Los flujos de juego corresponden a los hitos pendientes | Codex |

| 2026-11-23 | feature/ajustes-de-sala | PIN vigente, cierre de sala, reloj y proyector | En Edge, dos sesiones y un proyector comprobaron un nuevo PIN tras cerrar, el reloj configurado, la reproducción del clip asignado y el modo visual al bloquear el video. Jose confirmó antes el ingreso de un teléfono por la red local. Queda la partida completa con teléfonos y proyector físicos. | Jose y Codex |

| 2026-11-23 | feature/runtime-chaos | RuntimeChaos con dos vistas móviles y un proyector en Edge | Se comprobó la clave oculta antes de la segunda respuesta, el mismo giro sin opción de cerrar, el duelo voluntario, Proxy privado y la llegada al podio. | Codex |

La preparación inicial se verifica mediante instalación, typecheck, build, health check y conexión Socket.IO. Registrar las pruebas de partida cuando se implementen los flujos.
