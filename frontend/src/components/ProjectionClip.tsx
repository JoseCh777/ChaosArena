import { useEffect, useState } from 'react';

export function ProjectionClip({ cue }: { cue: 'inicio' | 'votacion' | 'ruleta' | 'podio' }) {
  const [visible, setVisible] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  useEffect(() => {
    const timeout = window.setTimeout(() => setVisible(false), 3300);
    return () => window.clearTimeout(timeout);
  }, []);

  if (!visible) return null;
  return (
    <aside className="projection-clip" aria-hidden="true">
      <video src={`/media/${cue}.webm`} autoPlay muted playsInline disablePictureInPicture
        onEnded={() => setVisible(false)} onError={() => setVisible(false)} />
    </aside>
  );
}
