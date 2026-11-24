import { useRef, useState, type ChangeEvent } from 'react';
import type { Question, Quiz } from '@chaos-arena/shared';
import { QuestionForm } from '../components/QuestionForm';
import { command, sessionToken } from '../services/arena';
import { decodeQuiz, downloadQuiz, DRAFT_KEY, emptyQuiz, newQuestion } from '../services/quizDraft';
import '../styles/editor.css';

export function EditorPage() {
  const [quiz, setQuiz] = useState<Quiz>(() => {
    try {
      return decodeQuiz(localStorage.getItem(DRAFT_KEY) ?? JSON.stringify(emptyQuiz), true);
    } catch {
      return emptyQuiz;
    }
  });
  const [editing, setEditing] = useState<Question>();
  const [status, setStatus] = useState<{ message: string; error?: boolean }>();
  const fileInput = useRef<HTMLInputElement>(null);

  function updateQuiz(next: Quiz, message = 'Borrador guardado.') {
    setQuiz(next);
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
      setStatus({ message });
    } catch {
      setStatus({ message: 'El navegador no pudo guardar el borrador. Descarga un JSON para conservarlo.', error: true });
    }
  }

  function saveQuestion(question: Question) {
    const exists = quiz.questions.some(item => item.id === question.id);
    const questions = exists
      ? quiz.questions.map(item => item.id === question.id ? question : item)
      : [...quiz.questions, question];
    updateQuiz({ ...quiz, questions });
    setEditing(undefined);
  }

  function moveQuestion(index: number, offset: number) {
    const questions = [...quiz.questions];
    const [item] = questions.splice(index, 1);
    questions.splice(index + offset, 0, item);
    updateQuiz({ ...quiz, questions });
  }

  async function importQuiz(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;

    try {
      const imported = decodeQuiz(await file.text());
      if ((quiz.title || quiz.questions.length || editing)
        && !window.confirm('¿Reemplazar el borrador actual por el cuestionario importado?')) return;
      updateQuiz(imported, 'Cuestionario importado.');
      setEditing(undefined);
    } catch (error) {
      setStatus({
        message: error instanceof SyntaxError ? 'El archivo no contiene JSON válido.' : 'Revisa el título, los campos y los identificadores de las preguntas.',
        error: true,
      });
    }
  }

  async function playDraft() {
    try {
      if (!sessionToken()) {
        setStatus({ message: 'Crea una sala desde Anfitrión y vuelve al editor.', error: true });
        return;
      }
      const validated = decodeQuiz(JSON.stringify(quiz));
      const reply = await command('start', { quiz: validated });
      if (!reply.ok) { setStatus({ message: reply.error, error: true }); return; }
      window.location.assign('/play');
    } catch {
      setStatus({ message: 'Se necesita un título, al menos una pregunta y acceso al almacenamiento para iniciar.', error: true });
    }
  }

  return (
    <main className="editor" aria-labelledby="editor-title">
      <header className="editor-header">
        <div>
          <h1 id="editor-title">Editor de preguntas</h1>
          <p>Prepara el cuestionario que cargará el anfitrión.</p>
        </div>
        <div className="editor-actions">
          <input ref={fileInput} type="file" accept=".json,application/json" hidden onChange={importQuiz} />
          <button type="button" className="button button-text" onClick={() => fileInput.current?.click()}>Importar JSON</button>
          <button type="button" className="button button-text" onClick={() => {
            if (!quiz.title.trim()) {
              setStatus({ message: 'Escribe un título antes de exportar.', error: true });
              document.getElementById('quiz-title')?.focus();
              return;
            }
            downloadQuiz(quiz);
            setStatus({ message: 'Cuestionario descargado.' });
          }}>Exportar JSON</button>
          <button type="button" className="button button-primary" onClick={playDraft} disabled={Boolean(editing)}>
            Probar cuestionario
          </button>
        </div>
      </header>
      {status && <p className={status.error ? 'form-error editor-status' : 'editor-status'} role={status.error ? 'alert' : 'status'}>{status.message}</p>}
      <div className="editor-layout">
        <section className="panel question-list" aria-labelledby="question-list-title">
          <div className="field">
            <label htmlFor="quiz-title">Título del cuestionario</label>
            <input id="quiz-title" value={quiz.title} placeholder="Patrones de diseño"
              onChange={event => updateQuiz({ ...quiz, title: event.target.value })} />
          </div>
          <div className="editor-list-heading">
            <h2 id="question-list-title">Preguntas <span>{quiz.questions.length}</span></h2>
            <button type="button" className="button button-primary" disabled={Boolean(editing)}
              onClick={() => setEditing(newQuestion())}>Nueva pregunta</button>
          </div>
          {quiz.questions.length === 0 && <p>Agrega una pregunta o importa un cuestionario JSON.</p>}
          <ol>
            {quiz.questions.map((question, index) => (
              <li key={question.id}>
                <strong>{question.prompt}</strong>
                <span>{question.seconds} s · {question.points} puntos</span>
                <div className="editor-actions">
                  <button type="button" className="button button-text" disabled={Boolean(editing)}
                    onClick={() => setEditing(question)}>Editar</button>
                  <button type="button" className="button button-text" disabled={index === 0}
                    onClick={() => moveQuestion(index, -1)} aria-label={`Subir pregunta ${index + 1}`}>↑</button>
                  <button type="button" className="button button-text" disabled={index === quiz.questions.length - 1}
                    onClick={() => moveQuestion(index, 1)} aria-label={`Bajar pregunta ${index + 1}`}>↓</button>
                  <button type="button" className="button button-text" disabled={Boolean(editing)}
                    onClick={() => updateQuiz({ ...quiz, questions: quiz.questions.filter(item => item.id !== question.id) })}
                    aria-label={`Eliminar pregunta ${index + 1}`}>Eliminar</button>
                </div>
              </li>
            ))}
          </ol>
        </section>
        {editing && <QuestionForm key={editing.id} initialQuestion={editing} onSave={saveQuestion} onCancel={() => setEditing(undefined)} />}
      </div>
    </main>
  );
}
