import assert from 'node:assert/strict';
import { test } from 'node:test';
import { VoteSession } from './voting.js';

const deadline = 20_000;
const now = deadline - 1;

function session() {
  return new VoteSession('v1', ['a', 'b', 'c', 'd', 'e'], deadline);
}

test('un empate en el máximo entre candidatos impide la expulsión', () => {
  const vote = session();
  assert.equal(vote.cast('a', 'b', now), null);
  assert.equal(vote.cast('b', 'a', now), null);
  assert.equal(vote.cast('c', 'a', now), null);
  assert.equal(vote.cast('d', 'b', now), null);
  assert.deepEqual(vote.close(), { expelledId: null, validVotes: 4 });
});

test('Omitir impide la expulsión si gana o empata con el candidato más votado', () => {
  for (const fourthTarget of ['a', null]) {
    const vote = session();
    assert.equal(vote.cast('a', null, now), null);
    assert.equal(vote.cast('b', null, now), null);
    assert.equal(vote.cast('c', 'a', now), null);
    assert.equal(vote.cast('d', fourthTarget, now), null);
    assert.deepEqual(vote.close(), { expelledId: null, validVotes: 4 });
  }
});

test('dos votos son insuficientes aunque coincidan en un candidato', () => {
  const vote = session();
  assert.equal(vote.cast('b', 'a', now), null);
  assert.equal(vote.cast('c', 'a', now), null);
  assert.deepEqual(vote.close(), { expelledId: null, validVotes: 2 });
});

test('Omitir cuenta para el mínimo de tres y el máximo único que lo supera gana', () => {
  const vote = session();
  assert.equal(vote.cast('a', null, now), null);
  assert.equal(vote.cast('b', 'a', now), null);
  assert.equal(vote.cast('c', 'a', now), null);
  assert.deepEqual(vote.close(), { expelledId: 'a', validVotes: 3 });
});

test('rechaza el auto-voto y un candidato no activo sin consumir el voto', () => {
  const vote = session();
  assert.equal(vote.cast('a', 'a', now), 'TARGET_INVALID');
  assert.equal(vote.cast('a', 'fantasma', now), 'TARGET_INVALID');
  assert.equal(vote.voteCount, 0);
  assert.equal(vote.cast('a', 'b', now), null);
});

test('rechaza el voto duplicado y conserva el voto original', () => {
  const vote = session();
  assert.equal(vote.cast('a', 'b', now), null);
  assert.equal(vote.cast('a', 'a', now), 'ALREADY_VOTED');
  assert.equal(vote.cast('c', 'b', now), null);
  assert.equal(vote.cast('b', null, now), null);
  assert.deepEqual(vote.close(), { expelledId: 'b', validVotes: 3 });
});

test('rechaza a un votante no activo incluso cuando intenta omitir', () => {
  const vote = session();
  assert.equal(vote.cast('fantasma', null, now), 'NOT_ACTIVE');
  assert.equal(vote.voteCount, 0);
});

test('acepta votos en el instante límite y rechaza los tardíos', () => {
  const vote = session();
  assert.equal(vote.cast('a', null, deadline), null);
  assert.equal(vote.cast('a', null, deadline + 1), 'VOTE_CLOSED');
  assert.equal(vote.cast('b', 'a', deadline + 1), 'VOTE_CLOSED');
  assert.equal(vote.voteCount, 1);
});

test('close devuelve el mismo resultado y bloquea los votos aun antes del plazo', () => {
  const vote = session();
  assert.equal(vote.cast('a', 'b', now), null);
  const result = vote.close();
  assert.deepEqual(result, { expelledId: null, validVotes: 1 });
  assert.equal(vote.cast('b', 'a', now), 'VOTE_CLOSED');
  assert.strictEqual(vote.close(), result);
});
