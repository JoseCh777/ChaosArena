import { useEffect, useState } from 'react';
import type { RuntimePublic } from '../../../shared/runtime-chaos';
import { reactions } from '../services/runtimeCatalog';
import '../styles/runtime-chaos.css';

export function ProjectionReaction({ reaction }: { reaction: NonNullable<RuntimePublic['reaction']> }) {
  const [expires] = useState(() => reaction.started + 3000);
  const [visible, setVisible] = useState(() => Date.now() < expires);
  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), Math.max(0, expires - Date.now()));
    return () => window.clearTimeout(timer);
  }, [expires]);
  return visible ? <aside className="projection-reaction" data-kind={reaction.kind} role="status">
    {reactions[reaction.kind]}
  </aside> : null;
}
