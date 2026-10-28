/* Light/dark theme: stored at localStorage['ns-theme'], falls back to the system preference,
   broadcast as the window event 'ns-theme' and synced across tabs. */
'use client';
import { useSyncExternalStore } from 'react';

export type Theme = 'light' | 'dark';

export const getTheme = (): Theme => {
  try { return (localStorage.getItem('ns-theme') as Theme) || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); } catch { return 'light'; }
};
export const applyTheme = (t: Theme) => { document.documentElement.setAttribute('data-theme', t); };
export const setTheme = (t: Theme) => {
  try { localStorage.setItem('ns-theme', t); } catch { /* ignore */ }
  applyTheme(t); window.dispatchEvent(new CustomEvent('ns-theme', { detail: t }));
};
export const toggleTheme = () => setTheme(getTheme() === 'dark' ? 'light' : 'dark');

/** Runs in <head> before paint so the stored theme never flashes. */
export const themeBootScript = `(function(){try{var t=localStorage.getItem('ns-theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.setAttribute('data-theme',t)}catch(e){document.documentElement.setAttribute('data-theme','light')}})();`;

let syncing = false;
/** Cross-tab sync: another tab changed the theme → apply it here and re-broadcast. */
const ensureSync = () => {
  if (syncing || typeof window === 'undefined') return; syncing = true;
  window.addEventListener('storage', (e) => {
    if (e.key === 'ns-theme') { const t = getTheme(); applyTheme(t); window.dispatchEvent(new CustomEvent('ns-theme', { detail: t })); }
  });
};

const subscribe = (cb: () => void) => {
  ensureSync();
  window.addEventListener('ns-theme', cb);
  return () => window.removeEventListener('ns-theme', cb);
};
/** Current theme, or null during server render / before hydration. */
export function useTheme(): Theme | null {
  return useSyncExternalStore(subscribe, getTheme, () => null);
}
