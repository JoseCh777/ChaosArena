import { randomUUID } from 'node:crypto';
import type { Namespace } from 'socket.io';
import type { Quiz } from '@chaos-arena/shared';
import type { ArenaView, DisplayView, Reply } from '../../shared/live.js';
import { LiveRound, type Member } from './liveRound.js';
import { demoQuestions } from './practiceQuestions.js';

function validQuiz(quiz: Quiz): boolean {
  return typeof quiz?.title === 'string' && Boolean(quiz.title.trim()) && Array.isArray(quiz.questions)
    && quiz.questions.length > 0 && quiz.questions.length <= 100
    && quiz.questions.every(q => q && typeof q.prompt === 'string' && q.prompt.trim()
      && ['multiple', 'boolean'].includes(q.type) && Array.isArray(q.options)
      && q.options.length >= 2 && q.options.length <= 4 && q.options.every(s => typeof s === 'string' && s.trim())
      && (q.type !== 'boolean' || q.options.length === 2)
      && Number.isInteger(q.correctIndex) && q.correctIndex >= 0 && q.correctIndex < q.options.length
      && Number.isInteger(q.seconds) && q.seconds >= 10 && q.seconds <= 60
      && Number.isInteger(q.points) && q.points >= 50 && q.points <= 200
      && (q.explanation === undefined || typeof q.explanation === 'string'));
}

export function attachArena(arena: Namespace) {
  const members = new Map<string, Member>();
  const connections = new Map<string, string>();
  let game = new LiveRound(members, publish);
  const pin = '482913';
  function publish() {
    const sorted = [...members.values()].sort((a, b) => b.score - a.score || b.correct - a.correct);
    let rank = 0;
    const players = sorted.map((p, i) => {
      if (!i || sorted[i-1].score !== p.score || sorted[i-1].correct !== p.correct) rank = i + 1;
      return { id: p.id, nickname: p.nickname, score: p.score, status: p.ghost ? 'ghost' as const : 'active' as const, rank };
    });
    const q = game.quiz.questions[game.index];
    const publicView: DisplayView = {
      phase: game.phase, serverNow: Date.now(), pin, players,
      number: game.index + 1, total: game.quiz.questions.length,
      received: sorted.filter(m => m.choice !== null).length, seconds: q?.seconds ?? 0,
    };
    if (q) publicView.round = { roundId: game.id, prompt: q.prompt, options: q.options, deadline: game.deadline };
    if (q && game.phase === 'reveal' && publicView.received === sorted.length) publicView.solution = {
      index: q.correctIndex, explanation: q.explanation,
      counts: q.options.map((_, i) => sorted.filter(m => m.choice === i).length),
    };
    if (game.phase === 'roulette') publicView.event = game.event;
    const voting = game.voting;
    if (voting) publicView.voting = { id: voting.id, deadline: voting.deadline,
      received: voting.votes.size, candidates: players.filter(p => p.status === 'active').map(p => p.id) };
    arena.to('display').emit('display', publicView);
    for (const [token, socketId] of connections) {
      const player = members.get(token);
      if (!player) continue;
      const host = token === members.keys().next().value;
      const view: ArenaView = {
        ...publicView, you: player.id, host, choice: player.choice, correctCount: player.correct, voted: voting?.votes.has(player.id),
      };
      if (host && game.phase === 'finished') view.summary = sorted.map(p => ({ id: p.id, correct: p.correct }));
      arena.to(socketId).emit('view', view);
    }
  }
  function remove(token: string) {
    connections.delete(token);
    members.delete(token);
    if (!members.size) { game.stop(); game = new LiveRound(members, publish); }
    publish();
  }
  arena.on('connection', socket => {
    let session = '';
    socket.on('command', (kind, data, ack: (r: Reply) => void) => {
      if (typeof ack !== 'function') return;
      const fail = (error: string) => ack({ ok: false, error });
      if (kind === 'observe') {
        Promise.resolve(socket.join('display')).then(() => {
          ack({ ok: true });
          publish();
        }).catch(() => fail('No se pudo abrir el proyector.'));
        return;
      }
      const player = members.get(session);
      if (kind === 'join' || kind === 'resume') {
        if (session) return fail('Esta conexión ya tiene un jugador.');
        if (kind === 'join') {
          const nickname = typeof data?.nickname === 'string' ? data.nickname.trim().replace(/\s+/g, ' ') : '';
          if (data?.pin !== pin) return fail('PIN de sala incorrecto.');
          if (!nickname || nickname.length > 20) return fail('Escribe un apodo de 1 a 20 caracteres.');
          if (game.phase !== 'lobby') return fail('La partida ya comenzó.');
          if ([...members.values()].some(p => p.nickname.toLowerCase() === nickname.toLowerCase())) return fail('Ese apodo ya está en uso.');
          session = randomUUID();
          members.set(session, { id: randomUUID(), nickname, score: 0, correct: 0, streak: 0, choice: null });
        } else {
          if (!members.has(data?.token)) return fail('Tu sesión terminó. Vuelve a ingresar.');
          session = data.token;
        }
        connections.set(session, socket.id);
        ack({ ok: true, token: session }); publish(); return;
      }
      if (!player || connections.get(session) !== socket.id) return fail('Vuelve a conectarte a la sala.');
      if (kind === 'answer') {
        if (!game.answer(player, data?.roundId, data?.choice)) return fail('Esta ronda ya no acepta esa respuesta.');
      } else if (kind === 'vote') {
        if (!game.vote(player, data?.id, data?.target)) return fail('Este voto ya no está disponible.');
      } else if (kind === 'start') {
        if (session !== members.keys().next().value || !['lobby','finished'].includes(game.phase)) return fail('Solo el anfitrión puede iniciar desde la sala.');
        const quiz = data?.quiz ?? { title: 'Patrones de diseño', questions: demoQuestions };
        if (!validQuiz(quiz)) return fail('Revisa los campos del cuestionario.');
        game.start(quiz, data?.voting !== false);
      } else if (kind === 'leave' && ['lobby','finished'].includes(game.phase)) {
        remove(session); session = '';
      } else return fail('Acción no disponible en esta fase.');
      ack({ ok: true });
    });
    socket.on('disconnect', () => {
      if (connections.get(session) !== socket.id) return;
      connections.delete(session);
      const token = session;
      setTimeout(() => {
        if (!connections.has(token) && (!connections.size || ['lobby','finished'].includes(game.phase))) remove(token);
      }, 30000).unref();
    });
  });
}
