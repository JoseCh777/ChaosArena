import type { Question } from '@chaos-arena/shared';
import type { DuelView } from '../../shared/runtime-chaos.js';
import type { EngineDeps, PlayerState } from './model.js';

const exhibition: Question[] = [
  { id: 'duel-composite', type: 'multiple', prompt: '¿Qué patrón permite tratar una hoja y una composición con la misma interfaz?', options: ['Proxy', 'Composite', 'Decorator', 'Observer'], correctIndex: 1, points: 0, seconds: 12 },
  { id: 'duel-factory', type: 'multiple', prompt: '¿Qué patrón deja a una subclase elegir el producto que fabrica?', options: ['Observer', 'State', 'Factory Method', 'Memento'], correctIndex: 2, points: 0, seconds: 12 },
  { id: 'duel-adapter', type: 'multiple', prompt: '¿Qué patrón convierte una interfaz existente en la que espera el cliente?', options: ['Adapter', 'Singleton', 'Builder', 'Prototype'], correctIndex: 0, points: 0, seconds: 12 },
];

export class Duel {
  private readonly accepts = new Set<string>();
  private readonly answers = new Map<string, number>();
  private readonly hidden = new Map<string, number[]>();
  private readonly question: Question;
  private readonly id: string;
  private stage: DuelView['stage'] = 'invite';
  private deadline = 0;
  private result?: string;
  private cancelTimer?: () => void;

  constructor(
    readonly players: readonly [PlayerState, PlayerState],
    private readonly deps: EngineDeps,
    private readonly publish: () => void,
    private readonly advance: () => void,
    private readonly onAccept: () => void,
  ) {
    this.id = deps.newId();
    this.question = exhibition[Math.floor(deps.rng() * exhibition.length)];
  }

  start() {
    this.schedule(10_000, () => this.finish('El duelo no se aceptó.'));
    this.publish();
  }

  dispose() { this.cancelTimer?.(); }

  private schedule(ms: number, run: () => void) {
    this.dispose();
    this.deadline = this.deps.now() + ms;
    this.cancelTimer = this.deps.setTimer(ms, run);
  }

  publicView(): DuelView {
    return {
      id: this.id, stage: this.stage, deadline: this.deadline,
      players: this.players.map(({ id, nickname }) => ({ id, nickname })),
      prompt: this.accepts.size === 2 ? this.question.prompt : undefined,
      options: this.accepts.size === 2 ? this.question.options : undefined,
      correctIndex: this.stage === 'result' && this.accepts.size === 2 ? this.question.correctIndex : undefined,
      result: this.result,
    };
  }

  private has(id: string) { return this.players.some(player => player.id === id); }

  canAdapt(id: string) {
    return this.stage === 'question' && this.deps.now() < this.deadline && this.has(id)
      && !this.answers.has(id) && !this.hidden.has(id);
  }

  adapt(id: string) {
    this.hidden.set(id, this.question.options.map((_, i) => i).filter(i => i !== this.question.correctIndex).slice(0, 2));
  }

  playerView(id: string) {
    return this.has(id) ? { accepted: this.accepts.has(id), answered: this.answers.has(id), hiddenOptions: this.hidden.get(id) } : {};
  }

  consent(player: string, id: unknown, decision: unknown) {
    if (id !== this.id || typeof decision !== 'boolean' || this.stage !== 'invite'
      || !this.has(player) || this.accepts.has(player) || this.deps.now() >= this.deadline) return false;
    if (!decision) { this.finish('El duelo fue rechazado.'); return true; }
    this.accepts.add(player);
    if (this.accepts.size === 2) {
      this.onAccept();
      this.stage = 'question';
      this.schedule(this.question.seconds * 1000, () => this.settle());
    }
    this.publish();
    return true;
  }

  answer(player: string, id: unknown, choice: unknown) {
    if (id !== this.id || this.stage !== 'question' || !this.has(player)
      || this.answers.has(player) || this.deps.now() >= this.deadline
      || typeof choice !== 'number' || !Number.isInteger(choice) || choice < 0 || choice >= this.question.options.length
      || this.hidden.get(player)?.includes(choice)) return false;
    this.answers.set(player, choice);
    if (this.answers.size === 2) this.settle();
    else this.publish();
    return true;
  }

  private settle() {
    const correct = this.players.filter(player => this.answers.get(player.id) === this.question.correctIndex);
    if (correct.length === 1) {
      correct[0].score += 200;
      this.finish(`${correct[0].nickname} gana el duelo y recibe 200 puntos.`);
    } else if (this.answers.size === 2) {
      for (const player of this.players) player.score += 50;
      this.finish('Empate. Cada participante gana 50 puntos.');
    } else this.finish('Duelo sin ganador.');
  }

  private finish(result: string) {
    if (this.stage === 'invite') this.accepts.clear();
    this.stage = 'result';
    this.result = result;
    this.schedule(3000, this.advance);
    this.publish();
  }
}
