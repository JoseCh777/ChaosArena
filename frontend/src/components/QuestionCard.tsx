import type { PublicRound } from '@chaos-arena/shared';

export function optionLetter(index: number) {
  return String.fromCharCode(65 + index);
}

export function QuestionCard({ round, disabled, onAnswer }: {
  round: PublicRound;
  disabled: boolean;
  onAnswer: (option: number) => void;
}) {
  return (
    <>
      <h1 className="game-prompt" id="game-title">{round.prompt}</h1>
      <div className="game-options" role="group" aria-label="Opciones de respuesta">
        {round.options.map((option, index) => (
          <button className="game-option" type="button" key={index} disabled={disabled}
            onClick={() => onAnswer(index)}>
            <span className="option-letter">{optionLetter(index)}</span>
            <span>{option}</span>
          </button>
        ))}
      </div>
    </>
  );
}
