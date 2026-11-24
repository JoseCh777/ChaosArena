import type { ClipCue } from '../../../shared/live';
import { useEffect, useRef, useState } from 'react';

export function ProjectionClip({ cue, enabled = true, sound = false, volume = 75 }: { cue: ClipCue; enabled?: boolean; sound?: boolean; volume?: number }) {
  const video = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  useEffect(() => {
    const timeout = window.setTimeout(() => setVisible(false), 3300);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (video.current) video.current.volume = volume / 100;
  }, [volume, enabled, visible]);

  if (!visible || !enabled) return null;
  return (
    <aside className="projection-clip" aria-hidden="true">
      <video ref={video} src={`/media/${cue}.webm`} autoPlay muted={!sound} playsInline disablePictureInPicture
        onEnded={() => setVisible(false)} onError={() => setVisible(false)} />
    </aside>
  );
}
