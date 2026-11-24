import type { ErrorCode } from '@chaos-arena/shared';

/**
 * Votación de expulsión. Votos individuales nunca salen de esta clase.
 * DUEÑO: agente B (tarea B). Ver backend/AGENTS.md.
 */

export const VOTE_SECONDS = 20;
export const MIN_VALID_VOTES = 3;
/** Activos mínimos para abrir votación (tras expulsar quedan al menos 2). */
export const MIN_ACTIVE_TO_VOTE = 3;

export interface VoteTally {
  expelledId: string | null;
  validVotes: number;
}

export class VoteSession {
  readonly #votes = new Map<string, string | null>();
  private tally?: VoteTally;

  constructor(
    readonly voteId: string,
    /** IDs de activos que pueden ser votados y que pueden votar. */
    readonly candidateIds: readonly string[],
    readonly deadline: number,
  ) {}

  /**
   * Registra un voto. Devuelve null si se aceptó o el código de error.
   */
  cast(voterId: string, target: string | null, now: number): ErrorCode | null {
    if (this.tally || now > this.deadline) return 'VOTE_CLOSED';
    if (!this.candidateIds.includes(voterId)) return 'NOT_ACTIVE';
    if (this.#votes.has(voterId)) return 'ALREADY_VOTED';
    if (target !== null && (target === voterId || !this.candidateIds.includes(target))) return 'TARGET_INVALID';
    this.#votes.set(voterId, target);
    return null;
  }

  get voteCount(): number {
    return this.#votes.size;
  }

  /**
   * Cierra la votación una sola vez y calcula el resultado.
   */
  close(): VoteTally {
    if (this.tally) return this.tally;

    const validVotes = this.#votes.size;
    let expelledId: string | null = null;
    if (validVotes >= MIN_VALID_VOTES) {
      const counts = new Map<string | null, number>();
      for (const target of this.#votes.values()) {
        counts.set(target, (counts.get(target) ?? 0) + 1);
      }

      let maxVotes = counts.get(null) ?? 0;
      for (const [target, count] of counts) {
        if (target === null) continue;
        if (count > maxVotes) {
          maxVotes = count;
          expelledId = target;
        } else if (count === maxVotes) {
          expelledId = null;
        }
      }
    }

    this.tally = { expelledId, validVotes };
    return this.tally;
  }
}
