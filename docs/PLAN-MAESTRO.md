# Plan maestro de ChaosArena

## Contexto

Proyecto académico para evaluar conocimientos sobre patrones de diseño con un quiz web participativo y demostrar Observer, Strategy y State en el código del juego. Fuente de alcance y reglas, Plan Maestro MVP v2.1 del 23 de noviembre de 2026, conservado en references/Chaos Arena.docx. El Design System v3.0 y los tokens CSS suministrados definen la identidad visual.

Jose asume frontend y experiencia de anfitrión, jugador y proyector. Daniel asume servidor, reglas, validación y despliegue backend. Ambos acuerdan shared/types.ts y verifican cada integración. La estimación es de cinco jornadas de 4–5 horas por persona, 40–50 horas totales de equipo. Las jornadas son hitos relativos, sin fechas comprometidas.

## Alcance

P0 núcleo incluye editor reutilizable con JSON, ingreso por PIN y apodo, lobby, preguntas con plazo, una respuesta por persona, puntuación, controles de anfitrión, ranking y resultados privados. Primero debe funcionar una partida completa de este flujo.

P0 entretenimiento añade cuatro eventos, votación, fantasmas, 4–6 clips y podio. P1 contempla respawn, pausa exacta, CSV y recuperación de sesión mejorada cuando quede tiempo. Cuentas, base de datos, historial persistente, duelos, inventarios, avatares, microservicios y Docker quedan fuera del alcance del MVP original.

Una sala en memoria y 15 preguntas sugeridas. Preparar ensayo con el tamaño real de la clase. Un reinicio del servidor pierde la sala. El anfitrión conserva el cuestionario en su navegador y mediante exportación JSON.

## Flujo de partida

Lobby → pregunta → resultados → evento o votación opcional → siguiente pregunta → final. El anfitrión avanza manualmente y el servidor autoriza las transiciones. El tiempo objetivo de sesión es 15–20 minutos, por confirmar en ensayo. Preguntas de 15–20 segundos, hasta 30 para código. Mostrar explicaciones durante 5–8 segundos. Ritmo sugerido de ruleta cada tres preguntas y asambleas tras las preguntas cinco y diez.

## Reglas de evaluación

Mantener puntos competitivos y aciertos académicos separados. Acierto suma la base configurada y un acierto académico. Primer acierto añade 50 puntos. Rachas de tres y cinco añaden 150 y 300 una vez por umbral. Error u omisión reinicia la racha. Los puntos nunca bajan de cero. El fantasma conserva sus puntos y responde para el resultado académico, sin ganar puntos competitivos.

Porcentaje académico igual a aciertos dividido entre preguntas válidas por cien. Ranking ordenado por puntos y luego aciertos, con posición compartida si persiste el empate. Resultados académicos individuales visibles para su titular y el anfitrión. Acordar casos límite del cómputo antes de implementar según CONTRATO-SOCKET.md.

## Editor e ingreso

Crear, editar, eliminar y ordenar preguntas. Selección múltiple con 2–4 opciones y verdadero/falso con dos opciones fijas. Campos de ID, tipo, enunciado, opciones, clave, explicación opcional, segundos entre 10 y 60 y base entre 50 y 200. Validar campos vacíos, índices y cuestionario no vacío en navegador y servidor. Guardar borrador en localStorage e importar y exportar JSON sin perder datos.

PIN de seis dígitos y apodo de 1–20 caracteres. Normalizar espacios y comparar apodos sin distinguir mayúsculas. Rechazar duplicados y bloquear nuevos ingresos al iniciar. El anfitrión puede retirar apodos inapropiados en lobby. Los jugadores acceden sin correo ni contraseña. QR con PIN precargado.

## Eventos y votación

| Evento | Efecto sobre activos |
| --- | --- |
| Agujero negro | Un activo pierde floor del 20 % de sus puntos |
| Doble o nada | Próxima pregunta con doble base y error resta 50 |
| Loot Box | Un activo aleatorio gana 150 puntos |
| Hackeo | Dos activos intercambian puntos, requiere dos candidatos |

Seleccionar uniformemente entre efectos elegibles en el servidor. Máximo un evento entre rondas y permitir omitir. Evitar combinar efectos pendientes. La ruleta muestra el resultado decidido por el servidor.

Votación de 20 segundos entre activos. Un voto por persona a otro activo u Omitir. Gana el candidato que supere a Omitir sin empate, con tres votos válidos como mínimo. Máximo una expulsión y al menos dos activos restantes. El expulsado pasa a fantasma y conserva evaluación y puntos. Los votos individuales permanecen secretos. El anfitrión puede desactivar votaciones.

Clips locales autorizados de 2–5 segundos, uno a la vez y solo en el proyector. Audio habilitado mediante gesto del anfitrión, con mute y alternativa visual si falla la reproducción.

## Entrega y contingencia

Entregar repositorio, README, cuestionario revisado, evidencia de ensayo, URL y versión estable. Completar una partida en dos móviles y proyector, y después con la concurrencia prevista. Demostrar Observer, Strategy y State implementados. Preparar arranque en red local y alternativa de evaluación manual.

Vercel para frontend y Render para backend son destinos propuestos por el documento. El presupuesto objetivo es cero COP dentro de las cuotas disponibles. Verificar condiciones vigentes al desplegar. Los despliegues se realizarán en la fase correspondiente.

## Control del alcance

Al cierre de jornada dos, resolver el núcleo antes de añadir animaciones y eventos. Si hay retraso en jornada tres, mantener cuatro efectos, una votación y pocos clips, y aplazar P1. Congelar funcionalidades tras lograr partida completa en jornada cuatro. Jornada cinco para correcciones y ensayo.
