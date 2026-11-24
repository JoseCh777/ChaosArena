import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { Question } from '@chaos-arena/shared';
import { BOOLEAN_OPTIONS } from '../services/quizDraft';

export function QuestionForm({ initialQuestion, onSave, onCancel }: {
  initialQuestion: Question;
  onSave: (question: Question) => void;
  onCancel: () => void;
}) {
  const [question, setQuestion] = useState(initialQuestion);
  const [error, setError] = useState('');
  const boolean = question.type === 'boolean';
  const typeInput = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    typeInput.current?.focus();
  }, []);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const prompt = question.prompt.trim();
    const options = question.options.map(option => option.trim());
    if (!prompt || options.some(option => !option)) {
      setError('Completa el enunciado y todas las opciones.');
      return;
    }
    onSave({ ...question, prompt, options, explanation: question.explanation?.trim() || undefined });
  }

  return (
    <form className="panel question-form" onSubmit={submit} aria-label="Editar pregunta">
      <div className="field">
        <label htmlFor="question-type">Tipo de pregunta</label>
        <select id="question-type" ref={typeInput} value={question.type} onChange={event => {
          const type = event.target.value as Question['type'];
          setQuestion({ ...question, type, correctIndex: 0, options: type === 'boolean' ? BOOLEAN_OPTIONS : ['', ''] });
        }}>
          <option value="multiple">Selección múltiple</option>
          <option value="boolean">Verdadero o falso</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="question-prompt">Enunciado</label>
        <textarea id="question-prompt" required value={question.prompt}
          onChange={event => setQuestion({ ...question, prompt: event.target.value })} />
      </div>
      <fieldset className="editor-options">
        <legend>Opciones y respuesta correcta</legend>
        {question.options.map((option, index) => {
          const letter = String.fromCharCode(65 + index);
          return (
            <div className="editor-option" key={index}>
              <input type="radio" name="correct-option" aria-label={`Opción ${letter} correcta`}
                checked={question.correctIndex === index} onChange={() => setQuestion({ ...question, correctIndex: index })} />
              <div className="field">
                <input aria-label={`Opción ${letter}`} value={option} required readOnly={boolean}
                  onChange={event => setQuestion({ ...question, options: question.options.map((value, position) => position === index ? event.target.value : value) })} />
              </div>
            </div>
          );
        })}
        {!boolean && <div className="editor-actions">
          <button className="button button-text" type="button" disabled={question.options.length === 4}
            onClick={() => setQuestion({ ...question, options: [...question.options, ''] })}>Agregar opción</button>
          <button className="button button-text" type="button" disabled={question.options.length === 2}
            onClick={() => setQuestion({
              ...question,
              correctIndex: Math.min(question.correctIndex, question.options.length - 2),
              options: question.options.slice(0, -1),
            })}>Quitar última opción</button>
        </div>}
      </fieldset>
      <div className="editor-columns">
        <div className="field">
          <label htmlFor="question-seconds">Tiempo (segundos)</label>
          <input id="question-seconds" type="number" min="10" max="60" required
            value={Number.isNaN(question.seconds) ? '' : question.seconds}
            onChange={event => setQuestion({ ...question, seconds: event.target.valueAsNumber })} />
        </div>
        <div className="field">
          <label htmlFor="question-points">Puntos base</label>
          <input id="question-points" type="number" min="50" max="200" required
            value={Number.isNaN(question.points) ? '' : question.points}
            onChange={event => setQuestion({ ...question, points: event.target.valueAsNumber })} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="question-explanation">Explicación (opcional)</label>
        <textarea id="question-explanation" value={question.explanation ?? ''}
          onChange={event => setQuestion({ ...question, explanation: event.target.value })} />
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="editor-actions">
        <button className="button button-primary" type="submit">Guardar pregunta</button>
        <button className="button button-text" type="button" onClick={onCancel}>Cancelar</button>
      </div>
    </form>
  );
}
