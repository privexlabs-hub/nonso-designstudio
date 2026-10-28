'use client';
import { useMemo, useSyncExternalStore } from 'react';

/* Local edits are announced in-tab with 'ns-store' and across tabs by the browser's 'storage' event. */
export const notifyStore = () => window.dispatchEvent(new Event('ns-store'));
const subscribe = (cb: () => void) => {
  window.addEventListener('storage', cb); window.addEventListener('ns-store', cb); document.addEventListener('visibilitychange', cb);
  return () => { window.removeEventListener('storage', cb); window.removeEventListener('ns-store', cb); document.removeEventListener('visibilitychange', cb); };
};

/** Parsed JSON value of a localStorage key; re-reads when storage changes in this or another tab. Null before hydration. */
export function useStored<T>(key: string, fallback: T): T | null {
  const raw = useSyncExternalStore(subscribe, () => { try { return localStorage.getItem(key); } catch { return null; } }, () => undefined);
  return useMemo(() => { if (raw === undefined) return null; if (raw == null) return fallback; try { return JSON.parse(raw) as T; } catch { return fallback; } }, [raw]); // eslint-disable-line react-hooks/exhaustive-deps
}

/** A version number that changes whenever any localStorage key with this prefix changes (for lists of saved docs). */
export function useStoreVersion(prefix: string): string | null {
  return useSyncExternalStore(subscribe, () => {
    try { let s = ''; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith(prefix)) s += k + ':' + (localStorage.getItem(k) || '').length + ';'; } return s; } catch { return ''; }
  }, () => null);
}

/** True once mounted in the browser (avoids hydration mismatches for browser-only values). */
export function useHydrated(): boolean {
  return useSyncExternalStore(() => () => {}, () => true, () => false);
}
