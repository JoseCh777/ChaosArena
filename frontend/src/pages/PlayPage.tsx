import { useEffect, useState } from 'react';
import { DemoRoulette } from '../components/DemoRoulette';
import { Leaderboard } from '../components/Leaderboard';
import { QuestionCard, optionLetter } from '../components/QuestionCard';
import { RoundTimer } from '../components/RoundTimer';
import { addDemoEvent, advanceDemoGame, demoRound, demoRoundResult, gameQuestions, readDemoGame, settleDemoRound, writeDemoGame } from '../services/demoGame';
import { readDemoRoom } from '../services/demoRoom';
import '../styles/game.css';

export function PlayPage() {
  const room = readDemoRoom();
  const [game, setGame] = useState(readDemoGame);
  const [now, setNow] = useState(Date.now);
  const [storageError, setStorageError] = useState(false);
  const result = game ? demoRoundResult(game) : undefined;

  useEffect(() => {
    if (!game || game.finished || game.answers.length > game.index) return;
    const timer = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(timer);
  }, [game]);

  useEffect(() => {
    if (!game || now < game.deadline) return;
    const settled = settleDemoRound(game, null, now);
    if (settled === game) return;
    try {
      writeDemoGame(settled);
      setGame(settled);
    } catch {
      setStorageError(true);
    }
  }, [game, now]);

  function answer(option: number) {
    if (!game) return;
    const updated = settleDemoRound(game, option, Date.now());
    if (updated === game) return;
    try {
      writeDemoGame(updated);
      setGame(updated);
    } catch {
      setStorageError(true);
    }
  }

  function nextRound() {
    if (!game) return;
    const next = advanceDemoGame(game);
    try {
      writeDemoGame(next);
      setGame(next);
      setNow(Date.now());
      if (next.finished) window.location.assign('/results');
    } catch {
      setStorageError(true);
    }
  }

  if (!room || !game) {
    return (
      <main className="empty-state panel">
        <h1>Ronda de prueba</h1>
        <p>Inicia la ronda desde la sala de espera.</p>
        <a className="button button-primary" href="/lobby">Ir a la sala</a>
      </main>
    );
  }

  if (game.finished) {
    return (
      <main className="empty-state panel">
        <h1>Partida terminada</h1>
        <a className="button button-primary" href="/results">Ver resultados</a>
      </main>
    );
  }

  const round = demoRound(game);
  const seconds = Math.max(0, Math.ceil((round.deadline - now) / 1000));
  const questions = gameQuestions(game);
  const finalRound = game.index === questions.length - 1;

  return (
    <main className="game-layout">
      <section className="panel game-panel" aria-labelledby="game-title">
        <div className="round-meta">
          <span>Pregunta {game.index + 1} de {questions.length}</span>
          {result && <span>Ronda cerrada</span>}
        </div>
        {result ? (
          <>
            <h1 className="game-prompt" id="game-title">{round.prompt}</h1>
            <p className="answer-feedback" role="status">
              {game.answers[game.index] === null ? 'Se acabó el tiempo.'
                : game.answers[game.index] === result.correctIndex ? 'Respuesta correcta.' : 'Respuesta incorrecta.'}
            </p>
            <ol className="answer-results">
              {round.options.map((option, index) => (
                <li key={index} className={index === result.correctIndex ? 'correct-answer' : undefined}>
                  <span className="option-letter">{optionLetter(index)}</span>
                  <span>{option}{index === result.correctIndex && <strong> · Correcta</strong>}</span>
                  <span className="answer-count">{result.counts[index]} {result.counts[index] === 1 ? 'respuesta' : 'respuestas'}</span>
                </li>
              ))}
            </ol>
            {result.explanation && <p className="answer-explanation">{result.explanation}</p>}
            {!finalRound && (
              <DemoRoulette event={game.events?.find(event => event.afterRound === game.index)}
                players={room.snapshot.players} onSpin={() => {
                  try {
                    const updated = addDemoEvent(readDemoGame() ?? game, room.snapshot.players.length);
                    writeDemoGame(updated);
                    setGame(updated);
                  } catch {
                    setStorageError(true);
                  }
                }} />
            )}
            <button type="button" className="button button-primary" onClick={nextRound}>
              {finalRound ? 'Ver resultados finales' : 'Siguiente pregunta'}
            </button>
          </>
        ) : (
          <>
            <RoundTimer seconds={seconds} totalSeconds={questions[game.index].seconds} />
            <QuestionCard round={round} disabled={seconds === 0 || storageError} onAnswer={answer} />
          </>
        )}
        {storageError && <p className="form-error" role="alert">El navegador no pudo guardar la ronda. Vuelve a la sala para intentarlo de nuevo.</p>}
        <a className="button button-text game-back" href="/lobby">Volver a la sala</a>
      </section>
      {result && <Leaderboard ranking={result.ranking} playerId={room.playerId} />}
    </main>
  );
}
