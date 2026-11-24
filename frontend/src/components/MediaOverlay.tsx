import { useEffect, useRef, useState } from 'react';
import type { MediaOutput, RuntimeDisplayView } from '../../../shared/runtime-chaos';
import { ChaosDial } from './ChaosDial';
import { mediaSource, type MediaId } from '../services/mediaManifest';
import { currentAmbient, currentScene, type MediaScene } from '../services/mediaScenes';
import '../styles/media.css';

export type MediaPreview = { asset: MediaId; started: number };
type Props = {
  view: RuntimeDisplayView;
  output: MediaOutput;
  enabled: boolean;
  preview?: MediaPreview;
  wheel?: boolean;
};

export function MediaOverlay({ view, output, enabled, preview, wheel = false }: Props) {
  const ambient = useRef<HTMLAudioElement>(null);
  const player = useRef<HTMLMediaElement>(null);
  const [now, setNow] = useState(Date.now);
  const [skipped, setSkipped] = useState('');
  const [failed, setFailed] = useState('');
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
  const source = visible ? mediaSource(step.asset, step.fallback) : undefined;
  const played = source && (!source.video || show?.videos !== false) && (source.video || audible) ? source : undefined;
  const mediaKey = played ? `${id}-${start}-${played.url}` : '';
  const ambientUrl = mediaSource(currentAmbient(view))?.url;
  const showText = visible && (show?.reactions !== false || view.phase === 'roulette' || scene?.id === view.showFact?.id && view.showFact?.kind === 'intro');
  const runningWheel = wheel && view.phase === 'roulette' && !view.duel && view.chaosEvent;
  const wheelEvent = runningWheel || undefined;
  const stepRemaining = step ? step.ms - (elapsed - start) : 0;

  useEffect(() => {
    setNow(Date.now());
    if (!visible) return;
    const timer = window.setTimeout(() => setNow(Date.now()), stepRemaining + 15);
    return () => window.clearTimeout(timer);
  }, [id, scene?.started, visible, stepRemaining]);

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
    node.play().then(() => { if (active) setBlocked(false); }, error => {
      if (!active || error.name === 'AbortError') return;
      if (error.name === 'NotAllowedError' && audible) setBlocked(true);
      else setFailed(mediaKey);
    });
    return () => { active = false; node.pause(); };
  }, [mediaKey, audible]);

  useEffect(() => {
    const node = ambient.current;
    if (node) node.volume = master * .20;
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

  const track = played && mediaKey !== failed && (played.video
    ? <video key={mediaKey} ref={node => { player.current = node; }} src={played.url} muted={!audible}
      playsInline preload="metadata" aria-hidden="true" onError={() => setFailed(mediaKey)} />
    : <audio key={mediaKey} ref={node => { player.current = node; }} src={played.url}
      preload="metadata" onError={() => setFailed(mediaKey)} />);

  return <>
    <audio ref={ambient} src={ambientUrl} loop preload="none" data-arena-ambient />
    {(showText || track || wheelEvent) && <aside className="arena-media" aria-label="Efecto de la partida"
      data-kind={view.showFact?.kind}>
      {wheelEvent && <ChaosDial type={wheelEvent.type} started={wheelEvent.started} spin={elapsed < 2450} onRest={() => {}} />}
      {track}
      {showText && step && <div className="arena-media-copy" role="status">
        <strong>{step.title}</strong>{step.detail && <p>{step.detail}</p>}
      </div>}
      {visible && selected && <button className="button button-text" type="button" onClick={() => setSkipped(id)}>Omitir efecto</button>}
    </aside>}
    {blocked && audible && <p className="arena-media-status" role="status">Pulsa Silenciar y Activar sonido para reintentar el audio.</p>}
  </>;
}
