import { useCallback, useEffect, useState } from 'react';
import { useMe } from '../api/me';

const OVERRIDE_KEY = 'otula:theme-override';
type Override = 'night' | 'day' | null;

function isNightHour(date: Date): boolean {
  const hour = date.getHours();
  return hour >= 22 || hour < 6;
}

/**
 * Night mode: profile.night_mode=auto follows 22:00–6:00 local time;
 * the moon toggle overrides for this device. Sets data-theme on
 * <html> (600 ms CSS transition); "off" disables auto-switching.
 */
export function useNightMode() {
  const { data: me } = useMe();
  const [override, setOverride] = useState<Override>(() => {
    const stored = localStorage.getItem(OVERRIDE_KEY);
    return stored === 'night' || stored === 'day' ? stored : null;
  });
  const [, tick] = useState(0);

  // Re-evaluate the auto window as time passes.
  useEffect(() => {
    const id = window.setInterval(() => tick((n) => n + 1), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const auto = (me?.profile.night_mode ?? 'auto') === 'auto' && isNightHour(new Date());
  const isNight = override === 'night' || (override === null && auto);

  useEffect(() => {
    document.documentElement.dataset.theme = isNight ? 'night' : '';
    if (!isNight) delete document.documentElement.dataset.theme;
  }, [isNight]);

  const toggle = useCallback(() => {
    setOverride((current) => {
      const next: Override = current === 'night' ? 'day' : current === 'day' ? null : 'night';
      if (next) localStorage.setItem(OVERRIDE_KEY, next);
      else localStorage.removeItem(OVERRIDE_KEY);
      return next;
    });
  }, []);

  return { isNight, toggle };
}
