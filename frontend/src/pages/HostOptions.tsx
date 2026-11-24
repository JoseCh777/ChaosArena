import { CLIP_CUES, DEFAULT_ROUND_SECONDS, ROUND_SECONDS_MAX, ROUND_SECONDS_MIN } from '@chaos-arena/shared/arena-settings.js';
import type { ArenaSettings, ClipCue } from '../../../shared/live';

const labels: Record<ClipCue, string> = {
  inicio: 'Inicio de la partida',
  votacion: 'Votación',
  ruleta: 'Ruleta',
  podio: 'Podio',
};

export function HostOptions({ settings, voting, disabled, onSettings, onVoting }: {
  settings: ArenaSettings;
  voting: boolean;
  disabled: boolean;
  onSettings: (settings: ArenaSettings) => void;
  onVoting: (enabled: boolean) => void;
}) {
  return <details className="host-options">
    <summary>Ajustes de partida</summary>
    <div className="host-options-grid">
      <div className="field">
        <label htmlFor="round-seconds">Segundos por pregunta</label>
        <select id="round-seconds" disabled={disabled} value={settings.roundSeconds ?? 'quiz'}
          onChange={event => onSettings({
            ...settings, roundSeconds: event.target.value === 'quiz' ? null : Number(event.target.value),
          })}>
          <option value="quiz">Usar los tiempos del cuestionario</option>
          {Array.from({ length: ROUND_SECONDS_MAX - ROUND_SECONDS_MIN + 1 }, (_, i) => i + ROUND_SECONDS_MIN).map(value =>
            <option key={value} value={value}>{value} s{value === DEFAULT_ROUND_SECONDS ? ' (por defecto)' : ''}</option>)}
        </select>
      </div>
      <label className="host-options-check"><input type="checkbox" checked={voting} disabled={disabled}
        onChange={event => onVoting(event.target.checked)} /> Activar votaciones</label>
    </div>
    <fieldset disabled={disabled}>
      <legend>Clips del proyector</legend>
      <div className="host-options-grid">
        {CLIP_CUES.map(phase => <div className="field" key={phase}>
          <label htmlFor={`clip-${phase}`}>{labels[phase]}</label>
          <select id={`clip-${phase}`} value={settings.clips[phase] ?? ''}
            onChange={event => {
              const selected = CLIP_CUES.find(cue => cue === event.target.value) ?? null;
              onSettings({ ...settings, clips: { ...settings.clips, [phase]: selected } });
            }}>
            <option value="">Sin clip</option>
            {CLIP_CUES.map(cue => <option key={cue} value={cue}>{labels[cue]}</option>)}
          </select>
        </div>)}
      </div>
    </fieldset>
  </details>;
}
