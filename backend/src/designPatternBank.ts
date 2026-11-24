import { shuffleQuestions } from './questionOrder.js';
import type { Question, Quiz } from '@chaos-arena/shared';

// Basado en las 15 diapositivas de Patrones de Diseño en Ingeniería de Software.
// Cada grupo de doce aumenta la dificultad. La primera opción de cada fila es la clave.
const bank = [
  ["¿Qué es un patrón de diseño?","Un modelo adaptable para un problema recurrente","Una librería que se instala","Un diagrama obligatorio","Un lenguaje de programación"],
  ["¿Cuántos patrones incluye el catálogo GoF clásico?","23","15","17","32"],
  ["¿Cuántas familias presenta la diapositiva?","Tres","Dos","Cuatro","Cinco"],
  ["¿Qué familia se ocupa de cómo se crean los objetos?","Creacionales","Estructurales","Comportamiento","Persistencia"],
  ["¿Qué familia se centra en la composición de objetos?","Estructurales","Comportamiento","Creacionales","Despliegue"],
  ["¿Qué familia estudia la comunicación y las responsabilidades?","Comportamiento","Estructurales","Creacionales","Almacenamiento"],
  ["¿Qué patrón deja a las subclases elegir el producto concreto?","Factory Method","Builder","Observer","Facade"],
  ["¿Qué patrón construye una cita paso a paso?","Builder","Adapter","Observer","Strategy"],
  ["¿Qué patrón traduce llamadas entre interfaces incompatibles?","Adapter","Facade","Observer","Builder"],
  ["¿Qué patrón ofrece una entrada simple a servicios internos complejos?","Facade","Factory Method","Strategy","Observer"],
  ["¿Qué patrón avisa automáticamente a los suscriptores?","Observer","Builder","Adapter","Factory Method"],
  ["¿Qué patrón permite cambiar el algoritmo usado durante la ejecución?","Strategy","Facade","Factory Method","Adapter"],
  ["¿Qué distribución GoF corresponde a creacionales, estructurales y de comportamiento?","5, 7 y 11","7, 5 y 11","5, 11 y 7","11, 7 y 5"],
  ["¿Qué beneficio aporta decir «usamos Observer» al equipo?","Resume cómo se propagan los cambios","Garantiza que todos los avisos sean entregados","Define el formato de la base de datos","Elimina las pruebas de integración"],
  ["¿Por qué el ejemplo usa una interfaz Notificación?","Para depender de un contrato común al enviar","Para fijar una clase concreta para todos","Para guardar el estado de la cita","Para elegir la hora automáticamente"],
  ["Una cita debe montarse con paciente, hora y recordatorios opcionales. ¿Qué responsabilidad asume Builder?","Organizar la construcción por etapas","Escuchar futuras confirmaciones","Escoger el algoritmo de turnos","Traducir la API externa"],
  ["El calendario externo espera fecha y minutos por separado. La aplicación usa un intervalo. ¿Qué modifica el Adapter?","La representación intercambiada entre ambas interfaces","La política que asigna turnos","El tipo de producto de Factory Method","La lista de observadores"],
  ["¿Qué distingue una Facade para confirmar citas?","Agrupa llamadas a varios servicios detrás de una operación","Sustituye un algoritmo durante la ejecución","Notifica a cada suscriptor de un cambio","Construye un objeto de forma incremental"],
  ["La cita confirma un turno y pronto debe avisar a un nuevo canal analítico. ¿Dónde encaja el canal?","Como suscriptor del evento de confirmación","Como parte obligatoria del Builder","Como condición fija del módulo de citas","Como traducción del calendario"],
  ["La asignación cambia entre orden de llegada y prioridad clínica. ¿Qué pieza cambia con Strategy?","La regla que ejecuta el contexto","La interfaz pública del calendario","El producto creado por cada subclase","El conjunto de suscriptores de la cita"],
  ["¿Qué indica que el uso de un patrón puede ser innecesario?","Agrega piezas sin resolver una dificultad concreta","Los desarrolladores lo documentan","Existe un problema recurrente de diseño","La interfaz reduce acoplamiento"],
  ["¿Cuál es el acoplamiento que Adapter reduce en el ejemplo?","La dependencia del cliente en la interfaz externa","La dependencia de la cita en sus datos obligatorios","La necesidad de validar el turno","La duplicación entre dos observadores"],
  ["¿Qué hace el calendario en el ejemplo de Observer tras la confirmación?","Añade el evento como reacción a la notificación","Escoge qué notificador instanciar","Decide el orden de los pasos del Builder","Simplifica la entrada al subsistema"],
  ["¿Qué efecto práctico tiene documentar la elección de un patrón?","Explica el problema y permite reevaluar la decisión","Impide que cambien los requisitos","Obliga a usar la misma solución en otros módulos","Reemplaza las pruebas del comportamiento"],
  ["La cita se construye por etapas y el canal de notificación depende del creador concreto. ¿Qué pareja corresponde en ese orden?","Builder y Factory Method","Observer y Strategy","Factory Method y Builder","Facade y Adapter"],
  ["La aplicación ofrece confirmarCita() y esa operación llama a validación, persistencia y agenda. La agenda externa habla otra interfaz. ¿Qué par separa ambas responsabilidades?","Facade y Adapter","Adapter y Observer","Strategy y Builder","Factory Method y Facade"],
  ["¿Cómo agregarías push al Factory Method de la presentación sin cambiar el código consumidor?","Implementando el producto push y un creador concreto que lo devuelva","Añadiendo una comprobación push en todos los clientes","Exigiendo que los clientes instancien Push directamente","Haciendo que Email también asigne turnos"],
  ["¿Qué dependencia conservarías al aplicar Observer a citas?","La dependencia en un evento o contrato de suscripción","Una dependencia del emisor a cada clase de correo","Una dependencia de cada suscriptor a todos los demás","Una dependencia de Adapter a la asignación"],
  ["¿Qué cambio convierte una política de turnos en Strategy según la presentación?","Inyectar reglas compatibles que se puedan alternar","Exponer una ruta única para reservas","Instanciar el calendario en una subclase","Publicar un evento cuando hay un turno"],
  ["Un Builder devuelve dos representaciones de la misma cita. ¿Qué puede mantenerse compartido?","La secuencia conceptual de construcción","El formato de salida de ambas representaciones","La instancia concreta final","La lista de destinatarios de correo"],
  ["¿Qué pista distingue Adapter de Facade si ambos envuelven servicios?","Adapter ajusta al contrato esperado y Facade ofrece uno simplificado","Adapter siempre envía eventos y Facade siempre crea objetos","Adapter elige reglas y Facade guarda resultados","Adapter y Facade requieren que el cliente conozca cada servicio"],
  ["Tras confirmar citas, el sistema registra métricas sin cambiar el coordinador. ¿Qué diseño favorece ese cambio?","Registrar métricas como observador de la confirmación","Usar Builder para instanciar el coordinador","Cambiar la interfaz del usuario final","Agregar una estrategia de cálculo de horario"],
  ["Un equipo aplica patrones en cada clase y luego localizar un fallo requiere saltar por diez interfaces. ¿Qué concluirías?","Hay que revisar si cada abstracción resuelve un problema real","Hay que sumar interfaces de la misma familia","Hay que preferir siempre familias creacionales","Hay que conservar el diseño por usar patrones GoF"],
  ["El proveedor externo cambió nombres de campos sin cambiar su propósito. ¿Dónde conviene aislar ese ajuste?","En el adaptador del proveedor","En todas las estrategias de turnos","En cada suscriptor de la cita","En la secuencia del Builder"],
  ["Factory Method y Strategy ofrecen variación. ¿Qué decisión corresponde a cada uno?","Qué objeto se crea y qué algoritmo se ejecuta","Qué evento se emite y qué objeto se crea","Qué interfaz se traduce y cómo se construye un objeto","Qué algoritmo se ejecuta y quién recibe un evento"],
  ["¿Qué cambio pondría en duda que Observer logró el objetivo del ejemplo?","Que confirmar una cita necesite importar cada clase de destinatario nuevo","Que cada destinatario reaccione de modo distinto","Que exista un contrato común de suscripción","Que un destinatario se pueda retirar"],
  ["Tres sedes cambian su política de asignación independientemente. El calendario externo también cambia sus nombres de campos. ¿Cómo acotas ambos cambios?","Estrategias por sede y un Adapter para el calendario","Tres Facades que dupliquen llamadas al calendario","Un Builder que transforme todas las políticas en objetos de calendario","Un Observer que escoja el algoritmo en cada pantalla"],
  ["El sistema confirma citas a través de una Facade y emite un evento después de persistir. ¿Qué distribución preserva las dos intenciones?","La Facade coordina la operación y los observadores reaccionan al evento emitido","Cada observador confirma de nuevo la cita y la Facade se suscribe","El Adapter crea el evento y las pantallas deciden si la operación terminó","Factory Method sustituye la coordinación y el evento"],
  ["En la presentación, un creador concreto devuelve Notificación. ¿Qué prueba deja detectar un acoplamiento que el ejemplo intenta evitar?","Ejecutar el cliente con un creador alterno sin cambiar su código ni sus tipos","Comprobar que el creador SMS solo produce SMS","Comprobar que correo conoce la plantilla HTML","Verificar que Correo y Push tienen propiedades distintas"],
  ["El integrador quiere cambiar el proveedor externo sin modificar el cliente. El nuevo proveedor invierte el significado de inicio y fin. ¿Qué debe mantener estable el adaptador?","El significado del contrato visto por el cliente","El orden particular de los campos de la API externa","La clase concreta que eligió el cliente","La política interna de las sedes"],
  ["Una Facade ofrece reservar() y oculta una Strategy que elige turnos. ¿Qué cambio evidencia separación de responsabilidades?","Poder añadir otra regla con el mismo contrato público de reserva","Exigir otro método de reserva por cada nueva regla","Mover la elección de la regla a todas las pantallas","Hacer que la regla traduzca la API de agenda"],
  ["Se agrega un observador para agendar y falla el correo. ¿Qué puede deducirse solo del patrón mostrado?","Los observadores reciben eventos. La política de fallos debe definirse aparte","La persistencia se revierte automáticamente","Todos los observadores se ejecutan siempre en paralelo","El patrón garantiza reintentos hasta entregar el correo"],
  ["El cliente conoce una Facade única, el Adapter mapea formatos y el Observer difunde cambios. ¿Cuál atiende el problema de exponer operaciones internas al cliente?","Facade","Observer","Adapter","Builder"],
  ["El equipo quiere cambiar la forma de construir recordatorios y también el tipo de notificación que se fabrica. ¿Qué responsabilidad conviene mantener separada?","Secuencia de construcción de Builder y selección del producto de Factory Method","Lista de suscriptores de Builder y salida de Facade","Regla de Strategy y adaptación de campos en Factory Method","Operaciones de Facade y suscripciones propias de Adapter"],
  ["El paquete de turnos publica TurnoAsignado y varias pantallas reaccionan. ¿Qué transformación lo vuelve un problema de Strategy?","Pedir que el paquete elija entre varios algoritmos de asignación compatibles","Añadir una pantalla que recibe el evento","Permitir que una pantalla se desuscriba","Cambiar el texto mostrado en una alerta"],
  ["Dos sistemas tienen varias operaciones internas complejas, pero ya exponen el mismo contrato de reserva. ¿Qué evidencia justificaría introducir un Adapter?","Que un proveedor futuro ya no cumpla ese contrato y aún deba ser compatible","Que haya demasiados clics para confirmar una cita","Que se quiera un único método para coordinar ambos sistemas","Que los usuarios quieran recibir una alerta"],
  ["Una aplicación crea SMS, correo y push con subclases. Las reglas para decidir prioridad cambian con frecuencia. ¿Cómo probarías que cada variación quedó aislada?","Cambiar la política sin editar los creadores y añadir un creador sin editar la política","Agregar if de prioridad a las tres notificaciones concretas","Poner política y notificación en cada observador","Cambiar el calendario para simular distintos notificadores"],
  ["¿Qué justifica una combinación de patrones en el caso de las citas?","Cada patrón responde a una presión de cambio distinta y verificable","El catálogo fija una combinación obligatoria por sistema","Las tres familias deben estar siempre presentes","La complejidad añadida sustituye documentar decisiones"],
];

const finalCase: Question = {
  id: 'patrones-caso-final',
  type: 'multiple',
  prompt: 'Una clínica integra calendarios de proveedores incompatibles, cambia la asignación de turnos según la sede y debe avisar a correo y agenda al confirmar una cita. ¿Qué arquitectura permite cambiar cada parte por separado?',
  options: [
    'Facade coordina la reserva, Adapter traduce el calendario, Strategy asigna turnos y Observer difunde la confirmación.',
    'Strategy traduce el calendario, Observer asigna los turnos y Adapter distribuye cada confirmación.',
    'Builder gestiona todas las reservas, Facade cambia las reglas de turno y Factory Method actualiza los suscriptores.',
    'Cada pantalla adapta el calendario, asigna sus turnos y envía sus avisos directamente.',
  ],
  correctIndex: 0,
  explanation: 'Facade ofrece un punto de entrada, Adapter aísla al proveedor, Strategy permite cambiar la regla y Observer desacopla los avisos.',
  seconds: 55,
  points: 150,
};

export function designPatternQuiz(size: 16 | 32 | 48, random: () => number): Quiz {
  const byLevel = [0, 1, 2, 3].map(level => {
    const questions: Question[] = bank.slice(level * 12, (level + 1) * 12).map(([prompt, ...choices], index) => {
      const correctIndex = (index + level) % choices.length;
      const options = [...choices.slice(choices.length - correctIndex), ...choices.slice(0, choices.length - correctIndex)];
      return {
        id: `patrones-${level * 12 + index + 1}`, type: 'multiple', prompt, options, correctIndex,
        seconds: [20, 30, 40, 55][level], points: [75, 100, 125, 150][level],
      };
    });
    return shuffleQuestions(questions, random).slice(0, size / 4 - Number(level === 3));
  });
  // Cada bloque de cinco sube de dificultad. Dentro de cada nivel se sortea el orden.
  const block = [0, 1, 2, 2, 3];
  const questions = Array.from({ length: size - 1 }, (_, index) => {
    const target = block[index % block.length];
    const available = [0, 1, 2, 3].filter(level => byLevel[level].length > 0);
    available.sort((a, b) => Math.abs(a - target) - Math.abs(b - target));
    return byLevel[available[0]].shift()!;
  });
  const shift = Math.floor(random() * finalCase.options.length);
  const options = [...finalCase.options.slice(shift), ...finalCase.options.slice(0, shift)];
  questions.push({ ...finalCase, options, correctIndex: (options.length - shift) % options.length });
  return { title: 'Patrones de diseño · Sistema de citas', questions };
}
