import { useEffect, useRef, useState } from 'react';

export function useProjectionAudio(cue?: 'ruleta' | 'podio') {
  const audio = useRef<AudioContext | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState('');

  async function toggle() {
    setError('');
    if (enabled) {
      setEnabled(false);
      return;
    }
    try {
      audio.current ??= new AudioContext();
      await audio.current.resume();
      setEnabled(true);
    } catch {
      setError('El audio no está disponible. El proyector sigue en modo visual.');
    }
  }

  useEffect(() => {
    const context = audio.current;
    if (!enabled || !cue || context?.state !== 'running') return;
    const notes = cue === 'podio' ? [392, 523.25, 659.25] : [196, 293.66, 392];
    const start = context.currentTime;
    const tones = notes.map((note, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const beat = start + index * .12;
      oscillator.type = 'triangle';
      oscillator.frequency.value = note;
      gain.gain.setValueAtTime(.001, beat);
      gain.gain.exponentialRampToValueAtTime(.075, beat + .03);
      gain.gain.exponentialRampToValueAtTime(.001, beat + .28);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(beat);
      oscillator.stop(beat + .29);
      return { oscillator, gain };
    });
    return () => {
      for (const { oscillator, gain } of tones) {
        oscillator.disconnect();
        gain.disconnect();
      }
    };
  }, [cue, enabled]);

  useEffect(() => () => {
    if (audio.current) void audio.current.close().catch(() => {});
    audio.current = null;
  }, []);

  return { enabled, error, toggle };
}
