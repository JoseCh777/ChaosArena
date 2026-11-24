import { useEffect, useState } from 'react';

export function useRoundSeconds(deadline?: number, pausedMs?: number) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (deadline === undefined || pausedMs !== undefined) return;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 150);
    return () => window.clearInterval(timer);
  }, [deadline, pausedMs]);
  return Math.max(0, (pausedMs ?? (deadline === undefined ? 0 : deadline - now)) / 1000);
}
