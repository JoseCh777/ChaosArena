import { useState } from 'react';
import type { RuntimeArenaView, ShowChange } from '../../../shared/runtime-chaos';
import { MediaOverlay, type MediaPreview } from '../components/MediaOverlay';
import { command } from '../services/arena';
import { mediaIds, type MediaId } from '../services/mediaManifest';

const labels = { sound: 'Sonido de sala', videos: 'Videos', reactions: 'Reacciones' } as const;
const controls = ['sound', 'videos', 'reactions'] as const;
const levels = [0, 25, 50, 75, 100];

type Props = {
  view: RuntimeArenaView;
  online: boolean;
  audioEnabled: boolean;
  toggleAudio: () => void;
};

export function HostShow({ view, online, audioEnabled, toggleAudio }: Props) {
  const [pending, setPending] = useState<ShowChange>();
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<MediaId>('vamo-a-jugar');
  const [preview, setPreview] = useState<MediaPreview>();
  const show = view.show;

  async function change(update: ShowChange) {
    setPending(update);
    setError('');
    const reply = await command('hostShow', update);
    if (!reply.ok) setError(reply.error);
    setPending(undefined);
  }

  if (!show) return null;
  const controlsState = pending ? { ...show, [pending.key]: pending.value } : show;
  const disabled = !online || !!pending;
  const canPreview = import.meta.env.DEV && (view.phase === 'finished'
    || (view.phase === 'lobby' && view.showFact?.kind !== 'intro'));

  return <section className="panel host-show" aria-labelledby="host-show-title">
    <header><h2 id="host-show-title">Escenario audiovisual</h2></header>
    <label className="host-volume">Salida
      <select value={controlsState.output} disabled={disabled}
        onChange={event => change({ key: 'output', value: event.target.value === 'display' ? 'display' : 'host' })}>
        <option value="host">Anfitrión</option><option value="display">Proyector</option>
      </select>
    </label>
    <div className="host-show-switches" aria-label="Efectos de la sala">
      {controls.map(key => <label key={key}>
        <input type="checkbox" checked={controlsState[key]} disabled={disabled}
          onChange={event => change({ key, value: event.target.checked })} />{labels[key]}
      </label>)}
      <label className="host-volume">Volumen
        <select value={controlsState.volume} disabled={disabled}
          onChange={event => change({ key: 'volume', value: Number(event.target.value) })}>
          {[...new Set([...levels, controlsState.volume])].sort((a, b) => a - b).map(level =>
            <option key={level} value={level}>{level} %</option>)}
        </select>
      </label>
    </div>
    {show.output === 'host' ? <button className="button button-text host-follow" type="button"
      aria-pressed={audioEnabled} onClick={toggleAudio}>{audioEnabled ? 'Silenciar' : 'Activar sonido'}</button>
      : <p className="host-show-hint">Activa el sonido en la ventana del proyector.</p>}
    {canPreview && <details className="host-personal">
      <summary>Probar un recurso</summary>
      <div className="host-actions">
        <label className="host-volume">Recurso
          <select value={selected} onChange={event => setSelected(event.target.value as MediaId)}>
            {mediaIds.map(id => <option key={id} value={id}>{id.replaceAll('-', ' ')}</option>)}
          </select>
        </label>
        <button className="button button-text" type="button" onClick={() => setPreview({ asset: selected, started: Date.now() })}>Probar</button>
      </div>
    </details>}
    <MediaOverlay view={view} output="host" enabled={audioEnabled} preview={preview} wheel />
    {error && <p className="form-error" role="alert">{error}</p>}
  </section>;
}
