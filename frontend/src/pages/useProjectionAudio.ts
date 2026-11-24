import { useEffect, useRef, useState } from 'react';
import type { AudioCue } from '../services/presentation';

const notes: Record<AudioCue, number[]> = {
  sala: [130.81, 196, 261.63, 196],
  ruleta: [196, 293.66, 392],
  podio: [392, 523.25, 659.25],
  reaccion: [329.63, 523.25, 783.99],
  impacto: [261.63, 196, 130.81],
};

function play(context: AudioContext, output: AudioNode, cue: AudioCue) {
  const start = context.currentTime;
  return notes[cue].map((note, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const beat = start + index * (cue === 'sala' ? .24 : .12);
    oscillator.type = 'triangle';
    oscillator.frequency.value = note;
    gain.gain.setValueAtTime(.001, beat);
    gain.gain.exponentialRampToValueAtTime(cue === 'sala' ? .035 : .075, beat + .03);
    gain.gain.exponentialRampToValueAtTime(.001, beat + .28);
    oscillator.connect(gain).connect(output);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    oscillator.start(beat);
    oscillator.stop(beat + .29);
    return oscillator;
  });
}

export function useProjectionAudio(cue?: AudioCue, volume = 75) {
  const audio = useRef<{ context: AudioContext; master: GainNode } | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState('');

  async function unlock() {
    setError('');
    try {
      if (!audio.current) {
        const context = new AudioContext();
        const master = context.createGain();
        master.gain.value = volume / 100;
        master.connect(context.destination);
        audio.current = { context, master };
      }
      await audio.current.context.resume();
      return audio.current;
    } catch {
      setError('El audio no está disponible en esta ventana.');
    }
  }

  async function toggle() {
    if (enabled) setEnabled(false);
    else if (await unlock()) setEnabled(true);
  }

  async function test() {
    const sound = await unlock();
    if (sound) play(sound.context, sound.master, 'ruleta');
  }

  useEffect(() => {
    const sound = audio.current;
    if (sound) sound.master.gain.setValueAtTime(volume / 100, sound.context.currentTime);
  }, [volume, enabled]);

  useEffect(() => {
    const sound = audio.current;
    if (!enabled || !cue || sound?.context.state !== 'running') return;
    const emit = () => play(sound.context, sound.master, cue);
    let tones = emit();
    const ambiance = cue === 'sala' ? window.setInterval(() => { tones = emit(); }, 3200) : undefined;
    return () => {
      window.clearInterval(ambiance);
      for (const oscillator of tones) oscillator.stop();
    };
  }, [cue, enabled]);

  useEffect(() => () => {
    if (audio.current) void audio.current.context.close().catch(() => {});
    audio.current = null;
  }, []);

  return { enabled, error, toggle, test };
}
