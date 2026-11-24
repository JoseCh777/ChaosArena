import { ARENA_PACE } from '@chaos-arena/shared/arena-settings.js';
import { useEffect, useRef, useState } from 'react';
import type { MediaOutput, RuntimeDisplayView } from '../../../shared/runtime-chaos';
import { RouletteResult } from './RouletteResult';
import { ChaosDial } from './ChaosDial';
import { audioGesture } from '../services/mediaAudio';
import { fallbackAudio, mediaSource, type MediaId } from '../services/mediaManifest';
import { currentAmbient, currentScene, type MediaScene } from '../services/mediaScenes';
import '../styles/media.css';

const onWheelRest = () => {};

export type MediaPreview = { asset: MediaId; started: number };
type Props = {
  view: RuntimeDisplayView;
  output: MediaOutput;
  enabled: boolean;
  preview?: MediaPreview;
  wheel?: boolean;
  onSkip?: () => void;
};

export function MediaOverlay({ view, output, enabled, preview, wheel = false, onSkip }: Props) {
  const ambient = useRef<HTMLAudioElement>(null);
  const player = useRef<HTMLMediaElement>(null);
  const [now, setNow] = useState(Date.now);
  const [skipped, setSkipped] = useState('');
  const [failed, setFailed] = useState<string[]>([]);
  const [missingAmbient, setMissingAmbient] = useState<string>();
  const [blocked, setBlocked] = useState(false);
  const show = view.show;
  const selected = show?.output === 'both' || (show?.output ?? 'host') === output;
  const audible = selected && enabled && show?.sound !== false;
  const master = (show?.volume ?? 75) / 100;
  const activePreview = preview && (view.phase === 'finished' || (view.phase === 'lobby' && view.showFact?.kind !== 'intro'));
  const scene: MediaScene | undefined = activePreview ? {
    id: `preview-${preview.started}`, started: preview.started,
    steps: [{ asset: preview.asset, title: 'Vista previa local', detail: preview.asset.replaceAll('-', ' '), ms: 20_000 }],
  } : currentScene(view);
  const elapsed = Math.max(0, now - (scene?.started ?? now));
  let start = 0;
  const step = scene?.steps.find(item => {
    const ended = elapsed >= start + item.ms;
    if (ended) start += item.ms;
    return !ended;
  });
  const id = scene ? `${view.pin}-${scene.id}` : '';
  const visible = step && id !== skipped;
  const sourceKey = (url: string) => `${id}-${start}-${url}`;
  const primary = visible ? mediaSource(step.asset) : undefined;
  const clip = visible && show?.videos !== false ? mediaSource(undefined, step.fallback) : undefined;
  const audio = visible ? mediaSource(step.audioFallback) : undefined;
  const tone = visible && step.asset ? fallbackAudio(step.audioFallback ?? step.asset) : undefined;
  const played = [primary, clip, audio, tone].find(source => source && !failed.includes(sourceKey(source.url))
    && (source.video ? show?.videos !== false : audible));
  const mediaKey = played ? sourceKey(played.url) : '';
  const companion = clip && !played?.video && !failed.includes(sourceKey(clip.url)) ? clip : undefined;
  const markFailed = (key: string) => setFailed(previous => previous.includes(key) ? previous : [...previous, key]);
  const ambientAsset = currentAmbient(view);
  const primaryAmbient = mediaSource(ambientAsset)?.url;
  const ambientUrl = ambientAsset && missingAmbient === primaryAmbient && primaryAmbient
    ? fallbackAudio(ambientAsset).url : primaryAmbient;
  const showText = visible && (show?.reactions !== false || view.phase === 'roulette' || scene?.id === view.showFact?.id && view.showFact?.kind === 'intro');
  const runningWheel = wheel && view.phase === 'roulette' && !view.duel && view.chaosEvent;
  const wheelEvent = runningWheel || undefined;
  const wheelRested = wheelEvent && elapsed >= ARENA_PACE.rouletteSpinMs;
  const stepRemaining = step ? step.ms - (elapsed - start) : 0;

  useEffect(() => { setNow(Date.now()); }, [id, scene?.started]);

  useEffect(() => {
    if (!visible) return;
    const timer = window.setTimeout(() => setNow(Date.now()), stepRemaining + 15);
    return () => window.clearTimeout(timer);
  }, [id, visible, stepRemaining]);

  useEffect(() => {
    const node = player.current;
    if (!node) return;
    node.muted = !audible;
    node.volume = master * (played?.video ? .85 : .90);
  }, [mediaKey, master, audible, played?.video]);

  useEffect(() => {
    const node = player.current;
    if (!node || !mediaKey) return;
    let active = true;
    node.playbackRate = step?.rate ?? 1;
    const align = () => {
      const offset = (Date.now() - (scene?.started ?? Date.now()) - start) / 1000 * node.playbackRate;
      if (offset > .25 && offset < node.duration && node.currentTime < .1) node.currentTime = offset;
    };
    if (node.readyState) align();
    else node.addEventListener('loadedmetadata', align, { once: true });
    node.play().then(() => { if (active && audible) setBlocked(false); }, error => {
      if (!active || error.name === 'AbortError') return;
      if (error.name === 'NotAllowedError' && audible) {
        setBlocked(true);
        if (played?.video) {
          node.muted = true;
          void node.play().catch(() => {});
        }
      } else markFailed(mediaKey);
    });
    return () => { active = false; node.removeEventListener('loadedmetadata', align); node.pause(); };
  }, [mediaKey, audible]);

  useEffect(() => {
    const node = ambient.current;
    if (node) node.volume = master * .54;
  }, [master]);

  useEffect(() => {
    const node = ambient.current;
    if (!node) return;
    if (!audible || !ambientUrl || played) { node.pause(); return; }
    let active = true;
    node.play().then(() => { if (active) setBlocked(false); }, error => {
      if (active && error.name === 'NotAllowedError') setBlocked(true);
    });
    return () => { active = false; node.pause(); };
  }, [ambientUrl, audible, played?.url]);

  useEffect(() => {
    const playFromGesture = (event?: Event) => {
      if (event?.target instanceof Element && event.target.closest('button[aria-pressed], .arena-media-unlock')) return;
      if (!audible) return;
      const node = played ? player.current : ambient.current;
      if (node?.getAttribute('src')) {
        node.muted = false;
        void node.play().then(() => setBlocked(false), error => {
          if (error.name === 'NotAllowedError') setBlocked(true);
        });
      }
    };
    window.addEventListener(audioGesture, playFromGesture);
    if (blocked) {
      window.addEventListener('pointerup', playFromGesture);
      window.addEventListener('keydown', playFromGesture);
    }
    return () => {
      window.removeEventListener(audioGesture, playFromGesture);
      window.removeEventListener('pointerup', playFromGesture);
      window.removeEventListener('keydown', playFromGesture);
    };
  }, [audible, played?.url, blocked]);

  const finishPreview = activePreview ? () => setSkipped(id) : undefined;
  const track = played && !failed.includes(mediaKey) && (played.video
    ? <video key={mediaKey} ref={node => { player.current = node; }} src={played.url} muted={!audible}
      playsInline preload="metadata" aria-hidden="true" onEnded={finishPreview} onError={() => markFailed(mediaKey)} />
    : <audio key={mediaKey} ref={node => { player.current = node; }} src={played.url}
      preload="metadata" onEnded={finishPreview} onError={() => markFailed(mediaKey)} />);

  return <>
    <audio ref={ambient} src={ambientUrl} loop preload="none" data-arena-ambient onError={() => setMissingAmbient(primaryAmbient)} />
    {(showText || track || companion || wheelEvent) && <aside className="arena-media" aria-label="Efecto de la partida"
      data-kind={view.showFact?.kind} data-impact={wheelRested ? wheelEvent.impact : undefined}>
      {wheelEvent && <ChaosDial type={wheelEvent.type} events={wheelEvent.wheel} started={wheelEvent.started} spin={!wheelRested} onRest={onWheelRest} />}
      {track}
      {companion && <video key={sourceKey(companion.url)} src={companion.url} muted autoPlay playsInline
        aria-hidden="true" onError={() => markFailed(sourceKey(companion.url))} />}
      {showText && step && (wheelRested
        ? <div role="status"><RouletteResult event={wheelEvent} /></div>
        : <div className="arena-media-copy" role="status">
          <strong>{step.title}</strong>{step.detail && <p>{step.detail}</p>}
        </div>)}
      {visible && selected && <button className="button button-text" type="button" onClick={() => { setSkipped(id); onSkip?.(); }}>Omitir efecto</button>}
    </aside>}
    {blocked && audible && <button type="button" className="button button-primary arena-media-unlock" onClick={() => {
      window.dispatchEvent(new Event(audioGesture));
    }}>Toca para escuchar</button>}
  </>;
}
