import { useEffect, useRef, useState } from 'react';
import { ARENA_PACE } from '@chaos-arena/shared/arena-settings.js';
import { currentAmbient, currentScene } from '../services/mediaScenes';
import { fallbackAudio, mediaSource, type MediaId } from '../services/mediaManifest';
import type { RuntimeArenaView } from '../../../shared/runtime-chaos';

export function GuestAudio({ view }: { view: RuntimeArenaView }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [enabled, setEnabled] = useState(true);
  const [blocked, setBlocked] = useState(false);
  const wheel = view.phase === 'roulette' ? view.chaosEvent : undefined;
  const [settledWheel, setSettledWheel] = useState<number>();
  useEffect(() => {
    if (!wheel) return;
    const delay = Math.max(0, wheel.started + ARENA_PACE.rouletteSpinMs - Date.now());
    const timer = window.setTimeout(() => setSettledWheel(wheel.started), delay);
    return () => window.clearTimeout(timer);
  }, [wheel?.started]);
  const ambient = currentAmbient(view);
  const scene = currentScene(view);
  let cue: MediaId = ambient ?? 'wii-shop';
  if (wheel) {
    const step = scene?.steps[settledWheel === wheel.started ? 1 : 0];
    cue = step?.audioFallback ?? step?.asset ?? 'jackpot';
  }
  else if (view.phase === 'vote') cue = 'among-us-emergency';
  else if (view.phase === 'finished') cue = 'la-plata';
  else if (view.solution) cue = view.choice === view.solution.index ? 'acierto-concurso' : 'family-feud';
  const loop = cue === ambient;
  const source = mediaSource(cue);
  const primary = source?.video ? undefined : source?.url;
  const [missing, setMissing] = useState<string>();
  const url = primary && missing !== primary ? primary : fallbackAudio(cue).url;
  const round = view.round?.roundId;
  useEffect(() => {
    const node = audio.current;
    if (!enabled || !node) return;
    let current = true;
    node.volume = loop ? .30 : .74;
    node.currentTime = 0;
    void node.play().then(() => { if (current) setBlocked(false); }).catch(error => {
      if (current && error.name !== 'AbortError') setBlocked(true);
    });
    return () => { current = false; node.pause(); };
  }, [enabled, url, loop, round, cue]);
  useEffect(() => {
    if (!enabled || !blocked) return;
    const retry = (event: Event) => {
      if (event.target instanceof Element && event.target.closest('.guest-audio')) return;
      void audio.current?.play().then(() => setBlocked(false), () => {});
    };
    window.addEventListener('pointerup', retry);
    window.addEventListener('keydown', retry);
    return () => { window.removeEventListener('pointerup', retry); window.removeEventListener('keydown', retry); };
  }, [enabled, blocked]);
  return <>
    <audio ref={audio} src={url} loop={loop} preload="none" onError={() => {
      if (primary && primary !== url) return;
      if (primary && primary !== fallbackAudio(cue).url) setMissing(primary);
    }} />
    <button className="button button-text guest-audio" aria-pressed={enabled} onClick={() => {
      if (enabled && !blocked) { audio.current?.pause(); setEnabled(false); return; }
      const node = audio.current;
      if (!node) return;
      node.volume = loop ? .30 : .74;
      void node.play().then(() => { setEnabled(true); setBlocked(false); }, () => setBlocked(true));
    }}>{blocked ? 'Toca para escuchar' : enabled ? 'Silenciar mi teléfono' : 'Activar sonido en mi teléfono'}</button>
  </>;
}
