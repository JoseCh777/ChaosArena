import type { Question } from '@chaos-arena/shared';

export const demoQuestions: Question[] = [
  {
    id: 'observer',
    type: 'multiple',
    prompt: '¿Qué patrón notifica a varios suscriptores cuando cambia el estado de un objeto?',
    options: ['Strategy', 'Observer', 'State', 'Adapter'],
    correctIndex: 1,
    explanation: 'Observer permite que varios suscriptores reciban avisos cuando cambia el objeto que observan.',
    seconds: 20,
    points: 100,
  },
  {
    id: 'strategy',
    type: 'boolean',
    prompt: 'Strategy permite intercambiar un algoritmo sin cambiar el código que lo usa.',
    options: ['Verdadero', 'Falso'],
    correctIndex: 0,
    explanation: 'Las estrategias comparten una interfaz, por lo que el contexto puede usar una u otra.',
    seconds: 15,
    points: 100,
  },
  {
    id: 'state',
    type: 'multiple',
    prompt: '¿Qué patrón organiza las acciones permitidas según la fase de una partida?',
    options: ['Builder', 'Facade', 'State', 'Singleton'],
    correctIndex: 2,
    explanation: 'State permite que el comportamiento dependa del estado actual, como lobby, ronda o resultados.',
    seconds: 20,
    points: 100,
  },
];
