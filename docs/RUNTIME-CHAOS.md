# Ampliación de juego RuntimeChaos

Referencia de producto *Runtime Chaos Plan Daniel y Jose*, versión 1.1. La ruleta tiene un 30 % de probabilidad al cerrar una pregunta con respuesta de todos. El servidor filtra los eventos elegibles y evita repetir el anterior si quedan alternativas. Las asambleas programadas se resuelven primero.

| Evento | Peso | Efecto competitivo |
| --- | ---: | --- |
| Agujero negro | 15 | Resta el 20 % del saldo de un activo, redondeado hacia abajo. Un escudo puede bloquearlo. |
| Doble o nada | 20 | Duplica la base del próximo acierto. Un error u omisión resta 50 puntos. |
| Error 404 | 15 | Suprime los bonos de rapidez y racha de un activo en la próxima pregunta. |
| Firewall | 20 | Protege de un ataque dirigido y evita ser candidato a expulsión durante dos rondas, salvo que se consuma antes al bloquear un ataque. |
| Loot Box | 30 | Otorga 150 puntos, un escudo o un poder. Si el poder sorteado no cabe, paga puntos. |
| Duelo | 10 | Invita a dos activos a una pregunta de exhibición. Un único acierto da 200 puntos y dos respuestas con el mismo resultado dan 50 a cada uno. |
| Hackeo | 8 | Intercambia saldos distintos entre dos activos sin escudo. |
| Respawn | 12 | Reactiva a un fantasma con su saldo e inventario disponibles. |

Se guardan hasta dos poderes y se usa uno por ronda. Proxy bloquea un ataque. Decorator se obtiene al llegar a tres aciertos seguidos y aumenta la próxima base a ×1,5. Si coincide con Doble o nada, se aplica ×2. Memento recupera hasta 150 puntos perdidos en el último evento personal. Adapter oculta dos distractores de la pregunta de exhibición solo a quien lo usa. Prototype duplica los puntos de la próxima Loot Box de puntos. Command permite invitar a otro activo y se consume cuando ambos aceptan.

El duelo abre una confirmación de 10 segundos y, con ambos de acuerdo, una pregunta de 12 segundos. Después del resultado se retoma automáticamente el cuestionario. Las decisiones del juego actualizan los puntos competitivos y la evaluación académica sigue contando las respuestas del cuestionario, también para fantasmas.

El proyector muestra reacciones de racha de cinco, acierto unánime, ningún acierto, expulsión y empate en el primer puesto. Si una racha coincide con un acierto unánime en la misma ronda, se muestra la racha. Las reacciones usan animación y texto. Los cuatro clips de fase se escogen en los ajustes de sala. El botón de sonido del proyector activa la música de espera y las señales de ruleta y podio.

## Operación desde el anfitrión

En `/host`, **Control de partida** muestra el reloj y las respuestas recibidas. Pausar congela el reloj en todos los dispositivos y bloquea los envíos hasta reanudar. Cerrar pregunta liquida las respuestas recibidas y deja las faltantes como omisiones. El anfitrión puede enviar su propia respuesta desde la misma mesa.

Durante los resultados, **Omitir sorteo de esta ronda** evita que se aplique un evento de ruleta. Una vez iniciado el giro, **Saltar animación de ruleta** conserva el efecto aplicado y continúa. **Cancelar votación** descarta los votos e impide una expulsión en esa asamblea.

**Escenario audiovisual** controla el sonido, volumen, videos y reacciones. Selecciona la salida y activa el audio con un clic en esa ventana. **Modo presentación** proyecta la parte pública de la mesa y **Volver al anfitrión** recupera sus controles. Consulta [el inventario local y su operación](MULTIMEDIA.md).
