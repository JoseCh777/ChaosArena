import { useEffect, useState } from 'react';
import type { ClipCue, ProjectionClips } from '../../../shared/live';
import type { RuntimeArenaView, ShowChange } from '../../../shared/runtime-chaos';
import { ProjectionClip } from '../components/ProjectionClip';
import { command } from '../services/arena';
import { clipNames, presentation } from '../services/presentation';
import { reactions } from '../services/runtimeCatalog';
import { useProjectionAudio } from './useProjectionAudio';

const labels = { sound: 'Sonido', videos: 'Videos', reactions: 'Reacciones' } as const;
const controls = ['sound', 'videos', 'reactions'] as const;
const levels = [0, 25, 50, 75, 100];
const cues = { sala: 'Música de espera', ruleta: 'Sonido de ruleta', podio: 'Fanfarria de podio',
  reaccion: 'Señal de celebración', impacto: 'Señal de impacto' };

export function HostShow({ view, online, clips }: { view: RuntimeArenaView; online: boolean; clips?: ProjectionClips }) {
  const [pending, setPending] = useState<ShowChange>();
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<ClipCue>();
  const [recent, setRecent] = useState(true);
  const show = view.show;
  const reaction = view.reaction;
  const current = presentation(view);
  const volume = show?.sound === false ? 0 : (show?.volume ?? 75);
  const audio = useProjectionAudio(current.audio, volume);
  const availableClips = [...new Set(Object.values(clips ?? {}).filter(clip => clip !== null))];

  useEffect(() => {
    setRecent(true);
    if (!reaction) return;
    const timer = window.setTimeout(() => setRecent(false), Math.max(0, reaction.started + 3000 - Date.now()));
    return () => window.clearTimeout(timer);
  }, [reaction?.id, reaction?.started]);

  async function change(update: ShowChange) {
    setPending(update);
    setError('');
    const reply = await command('hostShow', update);
    if (!reply.ok) setError(reply.error);
    setPending(undefined);
  }

  if (!show) return null;
  const following = audio.enabled;
  const controlsState = pending ? { ...show, [pending.key]: pending.value } : show;
  return <section className="panel host-show" aria-labelledby="host-show-title">
    <header>
      <h2 id="host-show-title">Proyector en vivo</h2>
      <p className="host-show-cue" role="status">
        {recent && show.reactions && reaction ? reactions[reaction.kind]
          : show.videos && current.clip ? `Clip · ${clipNames[current.clip]}`
          : show.sound && show.volume > 0 && current.audio ? cues[current.audio] : 'Sin señal para esta fase'}
      </p>
    </header>
    <div className="host-show-switches" aria-label="Efectos del proyector">
      {controls.map(key => <label key={key}>
        <input type="checkbox" checked={controlsState[key]} disabled={!online || !!pending}
          onChange={event => change({ key, value: event.target.checked })} />
        {labels[key]}
      </label>)}
      <label className="host-volume">Volumen
        <select value={controlsState.volume} disabled={!online || !!pending}
          onChange={event => change({ key: 'volume', value: Number(event.target.value) })}>
          {[...new Set([...levels, controlsState.volume])].sort((a, b) => a - b).map(level =>
            <option key={level} value={level}>{level} %</option>)}
        </select>
      </label>
    </div>
    <p className="host-show-hint">En la ventana del proyector, pulsa Activar sonido una vez.</p>
    <button className="button button-text host-follow" type="button" aria-pressed={following} onClick={audio.toggle}>
      {following ? 'Dejar de seguir efectos aquí' : 'Seguir efectos aquí'}
    </button>
    {current.clip && <ProjectionClip key={view.phase} cue={current.clip} compact
      enabled={following && show.videos} sound={following && volume > 0} volume={volume} />}
    <details className="host-personal">
      <summary>Vista previa local</summary>
      <div className="host-actions">
        <button className="button button-text" type="button" onClick={audio.test}>Probar sonido</button>
        {availableClips.map(clip => <button className="button button-text" type="button"
          aria-pressed={preview === clip}
          key={clip} onClick={() => setPreview(preview === clip ? undefined : clip)}>{clipNames[clip]}</button>)}
      </div>
      {preview && availableClips.includes(preview) && <video key={preview} src={`/media/${preview}.webm`}
        autoPlay controls muted playsInline onError={() => { setPreview(undefined); setError('El clip de vista previa no pudo cargarse.'); }} />}
    </details>
    {(error || audio.error) && <p className="form-error" role="alert">{error || audio.error}</p>}
  </section>;
}
