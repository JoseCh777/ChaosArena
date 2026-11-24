export function RoundTimer({ seconds, totalSeconds }: { seconds: number; totalSeconds: number }) {
  return (
    <div className="round-timer">
      <div className="round-timer-label">
        <span>Tiempo restante</span>
        <span role="timer" aria-label="Tiempo restante">{seconds} s</span>
      </div>
      <progress value={seconds} max={totalSeconds} aria-label="Tiempo restante de la pregunta" />
    </div>
  );
}
