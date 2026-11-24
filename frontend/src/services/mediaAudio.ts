import { flushSync } from 'react-dom';

export const audioGesture = 'chaos-audio-gesture';

export function setAudioFromGesture(update: () => void) {
  flushSync(update);
  window.dispatchEvent(new Event(audioGesture));
}
