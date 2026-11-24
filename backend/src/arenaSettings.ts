import { CLIP_CUES, DEFAULT_CLIPS, DEFAULT_ROUND_SECONDS, ROUND_SECONDS_MAX, ROUND_SECONDS_MIN } from '@chaos-arena/shared/arena-settings.js';
import type { ArenaSettings, ClipCue, ProjectionClips } from '../../shared/live.js';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isChoice(value: unknown): value is ClipCue | null {
  return value === null || CLIP_CUES.some(cue => cue === value);
}

export function parseArenaSettings(input: unknown): ArenaSettings | undefined {
  if (input === undefined) return { roundSeconds: DEFAULT_ROUND_SECONDS, clips: { ...DEFAULT_CLIPS } };
  if (!isRecord(input) || !isRecord(input.clips)) return undefined;
  const { roundSeconds, clips } = input;
  if (roundSeconds !== null && (typeof roundSeconds !== 'number' || !Number.isInteger(roundSeconds)
    || roundSeconds < ROUND_SECONDS_MIN || roundSeconds > ROUND_SECONDS_MAX)) return undefined;

  const selected: ProjectionClips = { ...DEFAULT_CLIPS };
  for (const phase of CLIP_CUES) {
    const choice = clips[phase];
    if (!isChoice(choice)) return undefined;
    selected[phase] = choice;
  }
  return { roundSeconds, clips: selected };
}
