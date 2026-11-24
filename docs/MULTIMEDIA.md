# Multimedia de ChaosArena

## Operación

La salida inicial es `/host`. En **Escenario audiovisual**, selecciona **Anfitrión** o **Proyector** y pulsa **Activar sonido** en la ventana seleccionada. El volumen, el sonido de sala, los videos y las reacciones se pueden ajustar por separado. **Omitir efecto** para la reproducción local sin afectar el juego.

**Modo presentación** muestra solo información pública desde la mesa. **Volver al anfitrión** restaura los controles. **Abrir proyector** y su enlace de regreso usan la misma pestaña y conservan el PIN de la sesión. Para otra pantalla se puede abrir `/display` directamente. Los jugadores no cargan un reproductor multimedia.

El servidor confirma el vencimiento, las votaciones, el podio y los datos del evento. El frontend deriva la secuencia usando esas vistas. Hay un ambiente por fase y una reacción por salida. Los videos se ajustan al cuadro sin recortar. Si un medio falta, el texto del acontecimiento sigue visible.

## Auditoría local

FFprobe 9.1 abrió los **28 originales** de la carpeta entregada. Hay siete videos H.264 con AAC y 21 audios AAC o MP3. El cuadro indica el punto de entrada y la duración objetivo de cada copia. Se midió la duración y se buscó silencio antes de recortar. Los originales se conservaron. FFmpeg generó MP4 H.264/AAC y MP3 con normalización, sin aumentar la resolución.

Todas las fuentes y los permisos de redistribución figuran como pendientes. Los archivos optimizados están en `frontend/media-local/`, carpeta ignorada por Git y servida en desarrollo. La compilación de producción usa las tarjetas de texto y los clips de respaldo existentes. Las fuentes quedan en esta tabla hasta que el equipo registre autoría, atribución y permiso de cada recurso.

| ID | Archivo original | Original | Entrada / duración objetivo | Copia |
| --- | --- | --- | --- | --- |
| `que-bendicion` | Que-bendición-meme-plantilla_002_720p.mp4 | 6.83 s · 1280×720 · 30000/1001 fps | 1.00 s / 5.80 s | MP4 |
| `la-roca` | La roca.mp4 | 1.53 s · 854×480 · 1880/61 fps | 0.00 s / 1.54 s | MP4 |
| `tic-tac` | tic-tac de reloj.m4a | 86.94 s | 0.58 s / 11.00 s | MP3 |
| `vamo-a-jugar` | Bueno-vamo-a-jugar_001_720p.mp4 | 3.11 s · 1280×720 · 138000/4573 fps | 1.15 s / 1.96 s | MP4 |
| `coffin-dance` | NEGROS-BAILANDO-CON-ATAÚDmp4.mp4 | 5.08 s · 1280×720 · 128000/5079 fps | 0.00 s / 5.08 s | MP4 |
| `mejor-estar-ciego` | para lo qué hay que ver mejor estar ciego.mp4 | 11.78 s · 720×1280 · 731/25 fps | 0.00 s / 11.78 s | MP4 |
| `patria-milagro` | Bienvenido a la patria milagro.mp4 | 5.80 s · 1280×720 · 41700/1727 fps | 0.00 s / 4.32 s | MP4 |
| `asi-se-hace` | Asi es que se hace.mp4 | 15.72 s · 360×360 · 29919/1000 fps | 0.00 s / 15.72 s | MP4 |
| `noticias-caracol` | Tema musical corto Noticias Caracol.mp3 | 68.50 s | 1.02 s / 18.00 s | MP3 |
| `millonario` | Pregunta-Quién-quiere-ser-millonario-Sound-Effect_006_48k.m4a | 4.18 s | 0.45 s / 3.65 s | MP3 |
| `trompeta-triste` | Sad-Trombone-Sound-Effect-HD_007_48k.m4a | 5.11 s | 0.45 s / 3.32 s | MP3 |
| `redoble` | Redoble-De-Tambores-Efecto-De-Sonido_006_48k.m4a | 5.43 s | 0.40 s / 3.05 s | MP3 |
| `la-plata` | Diomedes-Díaz-La-Plata-En-Vivo_007_48k.m4a | 276.23 s | 0.45 s / 5.40 s | MP3 |
| `campana-boxeo` | campana-de-Box-Efecto-de-sonido_007_48k.m4a | 4.18 s | 1.00 s / 2.45 s | MP3 |
| `wii-shop` | Wii-Shop-Channel-Main-Theme-HQ_007_48k.m4a | 128.45 s | 0.79 s / 22.00 s | MP3 |
| `latidos` | Corazón-Latiendo-BEATING-HEART_007_48k.m4a | 9.98 s | 0.25 s / 2.39 s | MP3 |
| `caso-cerrado` | He-dicho-caso-cerrado_007_48k.m4a | 4.04 s | 0.00 s / 4.04 s | MP3 |
| `among-us-emergency` | Sabotage-Alarm-Among-Us-Crisis-Sound-Effect-for-editing_007_48k.m4a | 8.41 s | 0.64 s / 1.45 s | MP3 |
| `tiempo-agotado` | Alarm-Clock-Sound-Effects_007_48k.m4a | 7.25 s | 1.60 s / 1.80 s | MP3 |
| `ruleta-casino` | sonido-de-ruleta-de-juego-game-roulette-sound-effect-2020_009_48k.m4a | 9.71 s | 0.00 s / 2.45 s | MP3 |
| `jackpot` | Slot-Machine-Jackpot-Sound-Effect_004_48k.m4a | 5.25 s | 0.00 s / 2.50 s | MP3 |
| `acierto-concurso` | Correct-sound-effect-right-or-wrong_007_48k.m4a | 1.72 s | 0.60 s / 1.00 s | MP3 |
| `family-feud` | The-Family-Feud-Buzzer-Sound-Effect_004_48k.m4a | 2.46 s | 1.21 s / 1.00 s | MP3 |
| `goool` | Goool-Efecto-de-sonido_007_48k.m4a | 10.17 s | 0.30 s / 2.90 s | MP3 |
| `attack-blocked` | Shield-Sound-effects-HD_005_48k.m4a | 6.46 s | 1.20 s / 2.58 s | MP3 |
| `shield-activated` | Sonido-Escudo-Grande-Fortnite_004_48k.m4a | 6.04 s | 0.37 s / 2.60 s | MP3 |
| `diomedes-respawn` | lo que uno demora muerto.mp3 | 11.13 s | 0.00 s / 11.13 s | MP3 |
| `siuuu` | RONALDO-SIÙUUUUUU-SOUND-EFFECT_004_48k.m4a | 7.01 s | 0.54 s / 2.80 s | MP3 |

## Estado de integración

En el ensayo local se conectaron los ambientes de lobby, pregunta, duelo y votación, la introducción, los resultados colectivos, la ruleta, las pérdidas y premios, la activación y el bloqueo de escudo, la expulsión, la racha, el cambio de líder y la secuencia de podio. El duelo usa el ambiente especial porque el JSON de preguntas no tiene un indicador para preguntas especiales.

`que-bendicion`, `la-roca`, `mejor-estar-ciego`, `patria-milagro`, `asi-se-hace`, `latidos` y `diomedes-respawn` quedan en la vista previa. Para el ensayo, Respawn, Hackeo y Doble o nada muestran la descripción confirmada del evento. Quedan por elegir y revisar los cortes de voz antes de usarlos como reacciones breves. Las votaciones sin expulsión comparten el mismo texto de veredicto y los aciertos colectivos usan el sonido disponible.

Se comprobó en Edge la navegación de ida y vuelta sin abrir pestañas, el mismo PIN, la privacidad del modo presentación, la salida de audio exclusiva, el clip inicial previo al reloj, la pausa, el cierre temprano y el silencio de los jugadores. Queda el ensayo con teléfonos y proyector físicos.
