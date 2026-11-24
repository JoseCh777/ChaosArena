import { useState } from 'react';
import { CLIP_CUES, DEFAULT_ROUND_SECONDS, ROUND_SECONDS_MAX, ROUND_SECONDS_MIN } from '@chaos-arena/shared/arena-settings.js';
import type { ArenaSettings, ClipCue } from '../../../shared/live';
import type { RuntimeEvent } from '../../../shared/runtime-chaos';
import { eventDescriptions, eventLabels, rouletteTypes } from '../services/runtimeCatalog';

const labels: Record<ClipCue, string> = {
  inicio: 'Inicio de la partida',
  votacion: 'Votación',
  ruleta: 'Ruleta',
  podio: 'Podio',
};

export function HostOptions({ hostAnswers, onHostAnswers, hostVotes, onHostVotes, settings, voting, disabled, onSettings, onVoting, roulette, rouletteEvents, onRoulette, onRouletteEvents }: {
  hostAnswers: boolean;
  onHostAnswers: (enabled: boolean) => void;
  hostVotes: boolean;
  onHostVotes: (enabled: boolean) => void;
  settings: ArenaSettings;
  voting: boolean;
  disabled: boolean;
  onSettings: (settings: ArenaSettings) => void;
  onVoting: (enabled: boolean) => void;
  roulette: boolean;
  rouletteEvents: RuntimeEvent[];
  onRoulette: (enabled: boolean) => void;
  onRouletteEvents: (events: RuntimeEvent[]) => void;
}) {
  const [eventInfo, setEventInfo] = useState<RuntimeEvent>();
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
      <div>
        <label className="host-options-check"><input type="checkbox" checked={hostAnswers} disabled={disabled}
          onChange={event => onHostAnswers(event.target.checked)} /> El anfitrión responde y compite</label>
        <label className="host-options-check"><input type="checkbox" checked={voting} disabled={disabled}
          aria-describedby="assembly-hint" onChange={event => onVoting(event.target.checked)} /> Activar votaciones</label>
        <label className="host-options-check"><input type="checkbox" checked={hostVotes} disabled={disabled || !voting}
          onChange={event => onHostVotes(event.target.checked)} /> El anfitrión puede votar</label>
        <p className="host-options-note" id="assembly-hint">Después de las preguntas 5 y 10, con al menos tres votantes activos. La persona expulsada pasa a modo fantasma.</p>
      </div>
      <label className="host-options-check"><input type="checkbox" checked={roulette} disabled={disabled}
        onChange={event => onRoulette(event.target.checked)} /> Activar ruleta</label>
    </div>
    <fieldset className="roulette-options" aria-describedby="roulette-options-hint">
      <legend>Eventos de la ruleta · {rouletteEvents.length}/{rouletteTypes.length}</legend>
      <div className="roulette-event-grid">
        {rouletteTypes.map(type => {
          const infoId = `roulette-info-${type}`;
          const open = eventInfo === type;
          return <div className="roulette-event-option" key={type} data-info-open={open || undefined}
            onKeyDown={event => {
              if (event.key === 'Escape' && open) setEventInfo(undefined);
            }}>
            <label className="host-options-check">
              <input type="checkbox" checked={rouletteEvents.includes(type)} disabled={disabled || !roulette}
                aria-describedby={infoId} onChange={event =>
                  onRouletteEvents(event.target.checked ? [...rouletteEvents, type] : rouletteEvents.filter(item => item !== type))
                } /> {eventLabels[type]}
            </label>
            <button className="roulette-event-help" type="button" aria-label={`Qué hace ${eventLabels[type]}`}
              aria-controls={infoId} aria-expanded={open} onClick={() => setEventInfo(open ? undefined : type)}>i</button>
            <span className="roulette-event-tip" id={infoId} role="tooltip">{eventDescriptions[type]}</span>
          </div>;
        })}
      </div>
      <p id="roulette-options-hint" className="host-options-note" role="status">
        {roulette && rouletteEvents.length === 0
          ? 'Selecciona al menos un evento o desactiva la ruleta para iniciar.'
          : 'La ruleta sortea entre los eventos marcados que puedan aplicarse en esa ronda.'}
      </p>
    </fieldset>
    <fieldset disabled={disabled}>
      <legend>Clips de respaldo</legend>
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
