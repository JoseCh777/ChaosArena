export function RoundTimer({ seconds, totalSeconds }: { seconds: number; totalSeconds: number }) {
  const remaining = Math.min(totalSeconds, Math.max(0, seconds));
  const fraction = totalSeconds > 0 ? remaining / totalSeconds : 0;
  return (
    <div className="round-timer">
      <div className="round-timer-label">
        <span>Tiempo restante</span>
        <span role="timer" aria-label="Tiempo restante">{Math.ceil(remaining)} s</span>
      </div>
      <div className="round-timer-track" aria-hidden="true" data-urgent={remaining <= 5 || undefined}>
        <span className="round-timer-fill" style={{ transform: `scaleX(${fraction})` }} />
      </div>
    </div>
  );
}
