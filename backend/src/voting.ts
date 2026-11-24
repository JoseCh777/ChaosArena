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
  private readonly votes = new Map<string, string | null>();
  private closed = false;

  constructor(
    readonly voteId: string,
    /** IDs de activos que pueden ser votados y que pueden votar. */
    readonly candidateIds: readonly string[],
    readonly deadline: number,
  ) {}

  /**
   * Registra un voto. Devuelve null si se aceptó o el código de error.
   * TODO(agente B): validar votante activo, auto-voto, duplicado, plazo y candidato.
   */
  cast(voterId: string, target: string | null, now: number): ErrorCode | null {
    if (this.closed || now > this.deadline) return 'VOTE_CLOSED';
    if (this.votes.has(voterId)) return 'ALREADY_VOTED';
    this.votes.set(voterId, target);
    return null;
  }

  get voteCount(): number {
    return this.votes.size;
  }

  /**
   * Cierra la votación una sola vez y calcula el resultado.
   * TODO(agente B): regla completa (supera a Omitir, sin empate, mínimo de votos). Este stub nunca expulsa.
   */
  close(): VoteTally {
    this.closed = true;
    return { expelledId: null, validVotes: this.votes.size };
  }
}
