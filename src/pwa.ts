type Register = (opts: { immediate?: boolean; onNeedRefresh?: () => void }) => (reload?: boolean) => Promise<void>;

let pending = false;
let safe = false;
let updateSW: ((reload?: boolean) => Promise<void>) | null = null;

/** Registers the service worker but never reloads mid-practice: a new version waits for Home. */
export function initPwa(register: Register): void {
  pending = false;
  updateSW = register({
    immediate: true,
    onNeedRefresh: () => {
      pending = true;
      if (safe) applyUpdateIfPending();
    },
  });
}

export function applyUpdateIfPending(): void {
  if (pending && updateSW) {
    pending = false;
    void updateSW(true);
  }
}

/** Home is showing — the one safe moment to swap in a new version. Returns the leave callback. */
export function enterSafeScreen(): () => void {
  safe = true;
  applyUpdateIfPending();
  return () => { safe = false; };
}
