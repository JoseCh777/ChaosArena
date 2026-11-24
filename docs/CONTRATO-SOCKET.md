# Contrato inicial de Socket.IO

shared/types.ts contiene la propuesta tipada para integración. Ambos revisan el contrato durante la jornada uno y actualizan este documento en el mismo PR. Los handlers de juego se implementarán en backend.

Cliente a servidor recibe ack con ok y data, o con ok false y error. Usar deadline como timestamp Unix en milisegundos. El backend mide recepción y decide cierres. Votos con target null representan Omitir.

| Evento | Dirección | Contenido |
| --- | --- | --- |
| room:create | Cliente a servidor | Quiz y hostKey. Devuelve PIN y hostToken |
| room:join | Cliente a servidor | PIN y nickname. Devuelve playerId y playerToken |
| game:control | Cliente a servidor | hostToken y start, close, next, event, vote o finish |
| answer:submit | Cliente a servidor | Token, roundId y optionIndex |
| vote:submit | Cliente a servidor | Token, voteId y target |
| room:snapshot | Servidor a cliente | Fase y vista pública sin quiz completo, credenciales ni votos |
| round:open | Servidor a cliente | roundId, prompt, options y deadline |
| round:result | Servidor a cliente | Solución tras cierre, explicación, conteos y ranking |
| event:result | Servidor a cliente | eventId, tipo, objetivos y puntos públicos resultantes |
| vote:open | Servidor a cliente | voteId, candidatos y deadline |
| media:play | Servidor a proyector | mediaId y triggerId para evitar repetición |
| game:finished | Servidor a cliente | Podio y datos autorizados por rol |
| room:watch | Proyector a servidor | PIN. Suscribe al canal display y devuelve snapshot |
| host:kick | Anfitrión a servidor | hostToken y playerId. Solo en lobby |
| vote:result | Servidor a cliente | voteId, expelledId o null, votos válidos y jugadores |
| round:progress | Servidor a host y proyector | Respondidos y esperados de la ronda abierta |
| player:private | Servidor a jugador | Estado propio: puntos, racha, respuesta enviada y última ronda |
| player:kicked | Servidor a jugador | El anfitrión lo retiró del lobby |

Errores: ack con `error` igual a un `ErrorCode` de shared/types.ts. Reglas de puntuación, eventos y votación acordadas en backend/AGENTS.md.

La vista pública evita correctCount y resultados académicos individuales. El servidor puede usarlos internamente para desempatar. FinishedView diferencia proyector, jugador y anfitrión. Autorizar cada emisión en backend.

## Acuerdos necesarios al integrar

- [ ] Definir suscripción y autenticación de /host y /display y vista privada durante la partida. El contrato base aún requiere estos eventos.
- [ ] Añadir comando autorizado para retirar apodos en lobby y configuración que desactive voto. Definir cómo se comunica el cierre de votación y la expulsión.
- [ ] Precisar rachas tras cinco aciertos, elegibilidad del primer acierto y tratamiento de empate de recepción.
- [ ] Precisar omisión bajo Doble o nada y relación entre base doble y bonos.
- [ ] Definir límites de preguntas, longitud de textos y frecuencia de solicitudes. El transporte inicial limita cada mensaje a 100 kB.
- [ ] Acordar definición de pregunta válida para el denominador académico y finalización anticipada.
- [ ] Definir errores estables y permisos para cada acción por fase.
- [ ] Añadir room:resume únicamente al implementar recuperación P1, con validación de token y restitución de rol.

Estos puntos completan detalles que el plan original deja abiertos. La integración de cada flujo requiere su acuerdo y actualización de tipos.
