# Plan de trabajo de Jose

Responsable de frontend/ y despliegue frontend. Rama frontend creada desde develop. PR hacia develop. Coordinar cambios en shared/types.ts con Daniel.

| Jornada | Trabajo | Aceptación |
| --- | --- | --- |
| 1 | Rutas, tokens v3.0, ingreso, PIN, apodos, errores y lobby con mocks | Dos móviles muestran la misma sala al integrar room:create y room:join |
| 2 | Editor JSON, validaciones, localStorage, pregunta, respuestas, reloj y ranking | Crear V/F, modificar y reordenar preguntas, exportar, recargar e importar. Completar una pregunta real |
| 3 | Ruleta guiada por resultado servidor, voto, estado fantasma y MediaOverlay | Mostrar efecto único y expulsión sin afectar resultados académicos |
| 4 | Controles host, display, QR, resultados y podio. Preparar despliegue | Partida online completa con audio activable y resultados por rol |
| 5 | Móvil, proyector, teclado, contraste, estados de conexión y ensayo | Evidencia de partida completa y acceso por red local |

## Pantallas

- /join para PIN, apodo y errores.
- /lobby y /play para espera, pregunta, opciones, reloj, confirmación de respuesta, voto, fantasma y puntos propios.
- /editor para formulario, lista, orden, JSON y borrador local.
- /host para crear sala, iniciar, cerrar, avanzar, evento, voto, participantes y finalizar.
- /display para PIN y QR, pregunta, temporizador, conteos, solución, ranking, ruleta, clips y podio.
- /results para top tres y resultado personal, o resumen autorizado al anfitrión.

## Orden de implementación

1. Crear Button, QuestionCard, Timer, Leaderboard y PlayerList y las rutas.
2. Desarrollar datos simulados ajustados al contrato y utilizar un único cliente en src/services/socket.ts.
3. Integrar lobby, pregunta, respuesta y resultado, gestionando acknowledgements y errores.
4. Añadir Roulette y MediaOverlay y las vistas de evento, voto y final.
5. Comprobar controles touch, letras A–D además de color, foco visible y pantalla de proyector.

Mantener tokens en src/styles/tokens.css y consultar ../docs/design-system.html. Guardar marca suministrada en public/brand y clips en public/media cuando se seleccionen los recursos. Aplicar proporciones y margen de marca del 10 %. Usar animación donde facilite temporizador, ruleta, transición o podio y permitir responder durante la interacción.

## Dependencias de Daniel

Contrato y snapshots por rol, plazos absolutos del servidor, errores de ingreso y respuesta, evento resuelto, candidatos de voto y resultados finales. Acordar suscripción del proyector y acreditación del anfitrión antes de integrar esas rutas.

## Entregables

- [ ] Editor operativo y cuestionario exportable.
- [ ] Flujo completo de jugador y estado fantasma.
- [ ] Panel de anfitrión y proyector responsive.
- [ ] Mute, activación de sonido y fallback visual.
- [ ] URL frontend y configuración documentada cuando se despliegue.
- [ ] Ensayo en móviles y proyector registrado en SEGUIMIENTO.md.
