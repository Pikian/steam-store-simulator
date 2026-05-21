import { useEffect, useState } from 'react';

/** Matches Tailwind `lg` — below 1024px is treated as mobile (display-only). */
const MOBILE_MAX_WIDTH = 1023;

export function useIsMobile(): boolean {
  const query = `(max-width: ${MOBILE_MAX_WIDTH}px)`;

  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false
  );

  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return isMobile;
}
