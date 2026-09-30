import { useEffect } from 'react';

// Defer the request until commit, cancelling loads from discarded effects
// (including React StrictMode's first mount).
export function useInitialLoad(load) {
  useEffect(() => {
    let active = true;
    queueMicrotask(() => { if (active) load(); });
    return () => { active = false; };
  }, [load]);
}
