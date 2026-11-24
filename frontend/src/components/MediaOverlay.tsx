import { ARENA_PACE } from '@chaos-arena/shared/arena-settings.js';
import { useEffect, useRef, useState } from 'react';
import type { MediaOutput, RuntimeDisplayView } from '../../../shared/runtime-chaos';
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
  const selected = (show?.output ?? 'host') === output;
  const audible = selected && enabled && show?.sound !== false;
  const master = (show?.volume ?? 75) / 100;
  const activePreview = preview && (view.phase === 'finished' || (view.phase === 'lobby' && view.showFact?.kind !== 'intro'));
  const scene: MediaScene | undefined = activePreview ? {
    id: `preview-${preview.started}`, started: preview.started,
    steps: [{ asset: preview.asset, title: 'Vista previa local', detail: preview.asset.replaceAll('-', ' '), ms: 6000 }],
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
  const primary = visible ? mediaSource(step.asset, step.fallback) : undefined;
  const primaryKey = primary ? `${id}-${start}-${primary.url}` : '';
  const source = primaryKey && failed.includes(primaryKey) && step?.asset
    ? fallbackAudio(step.asset) : primary;
  const played = source && (!source.video || show?.videos !== false) && (source.video || audible) ? source : undefined;
  const mediaKey = played ? `${id}-${start}-${played.url}` : '';
  const ambientAsset = currentAmbient(view);
  const primaryAmbient = mediaSource(ambientAsset)?.url;
  const ambientUrl = ambientAsset && missingAmbient === primaryAmbient && primaryAmbient
    ? fallbackAudio(ambientAsset).url : primaryAmbient;
  const showText = visible && (show?.reactions !== false || view.phase === 'roulette' || scene?.id === view.showFact?.id && view.showFact?.kind === 'intro');
  const runningWheel = wheel && view.phase === 'roulette' && !view.duel && view.chaosEvent;
  const wheelEvent = runningWheel || undefined;
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
    node.volume = master * (played?.video ? .75 : .60);
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
    node.play().then(() => { if (active) setBlocked(false); }, error => {
      if (!active || error.name === 'AbortError') return;
      if (error.name === 'NotAllowedError' && audible) setBlocked(true);
      else setFailed(previous => previous.includes(mediaKey) ? previous : [...previous, mediaKey]);
    });
    return () => { active = false; node.removeEventListener('loadedmetadata', align); node.pause(); };
  }, [mediaKey, audible]);

  useEffect(() => {
    const node = ambient.current;
    if (node) node.volume = master * .32;
  }, [master]);

  useEffect(() => {
    const node = ambient.current;
    if (!node) return;
    if (!audible || !ambientUrl || visible) { node.pause(); return; }
    let active = true;
    node.play().then(() => { if (active) setBlocked(false); }, error => {
      if (active && error.name === 'NotAllowedError') setBlocked(true);
    });
    return () => { active = false; node.pause(); };
  }, [ambientUrl, audible, visible]);

  useEffect(() => {
    const playFromGesture = () => {
      if (!audible) return;
      const node = visible ? player.current : ambient.current;
      if (node?.getAttribute('src')) {
        node.muted = false;
        void node.play().then(() => setBlocked(false), error => {
          if (error.name === 'NotAllowedError') setBlocked(true);
        });
      }
    };
    window.addEventListener(audioGesture, playFromGesture);
    return () => window.removeEventListener(audioGesture, playFromGesture);
  }, [audible, visible]);

  const track = played && !failed.includes(mediaKey) && (played.video
    ? <video key={mediaKey} ref={node => { player.current = node; }} src={played.url} muted={!audible}
      playsInline preload="metadata" aria-hidden="true" onError={() => setFailed(previous => previous.includes(mediaKey) ? previous : [...previous, mediaKey])} />
    : <audio key={mediaKey} ref={node => { player.current = node; }} src={played.url}
      preload="metadata" onError={() => setFailed(previous => previous.includes(mediaKey) ? previous : [...previous, mediaKey])} />);

  return <>
    <audio ref={ambient} src={ambientUrl} loop preload="none" data-arena-ambient onError={() => setMissingAmbient(primaryAmbient)} />
    {(showText || track || wheelEvent) && <aside className="arena-media" aria-label="Efecto de la partida"
      data-kind={view.showFact?.kind}>
      {wheelEvent && <ChaosDial type={wheelEvent.type} started={wheelEvent.started} spin={elapsed < ARENA_PACE.rouletteSpinMs} onRest={onWheelRest} />}
      {track}
      {showText && step && <div className="arena-media-copy" role="status">
        <strong>{step.title}</strong>{step.detail && <p>{step.detail}</p>}
      </div>}
      {visible && selected && <button className="button button-text" type="button" onClick={() => { setSkipped(id); onSkip?.(); }}>Omitir efecto</button>}
    </aside>}
    {blocked && audible && <p className="arena-media-status" role="status">Pulsa Silenciar y Activar sonido para reintentar el audio.</p>}
  </>;
}
