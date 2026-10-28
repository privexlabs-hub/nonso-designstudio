/* Toasts — bottom-centre live region; callable from anywhere (React or not). */
export type ToastKind = 'success' | 'error' | 'info' | undefined;

export const toast = (msg: string, kind?: ToastKind) => {
  if (typeof document === 'undefined') return;
  let host = document.getElementById('ns-toast-host');
  if (!host) {
    host = document.createElement('div'); host.id = 'ns-toast-host'; host.setAttribute('role', 'status'); host.setAttribute('aria-live', 'polite');
    document.body.appendChild(host);
  }
  const t = document.createElement('div');
  t.className = 'ns-toast' + (kind === 'error' ? ' ns-toast--error' : kind === 'success' ? ' ns-toast--success' : '');
  t.textContent = msg; host.appendChild(t);
  requestAnimationFrame(() => t.classList.add('is-in'));
  setTimeout(() => { t.classList.remove('is-in'); setTimeout(() => t.remove(), 250); }, kind === 'error' ? 5200 : 2400);
};
