import 'fake-indexeddb/auto';
import { webcrypto } from 'node:crypto';
import { afterEach } from 'vitest';

// jsdom's window may hide Node's Web Crypto; the app needs subtle.digest and randomUUID.
if (!globalThis.crypto?.subtle || !globalThis.crypto?.randomUUID) {
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });
}

if (typeof document !== 'undefined') {
  // jsdom has no object URLs.
  URL.createObjectURL ??= () => 'blob:test';
  URL.revokeObjectURL ??= () => {};
  // jsdom lacks on* pointer handlers, so Preact would listen for "PointerDown" instead of the
  // real lowercase event; browsers (incl. iPad Safari) have them.
  for (const name of ['onpointerdown', 'onpointerup', 'onpointercancel', 'onpointerleave', 'onpointermove']) {
    if (!(name in HTMLElement.prototype)) Object.defineProperty(HTMLElement.prototype, name, { value: null, writable: true, configurable: true });
  }
  const { cleanup } = await import('@testing-library/preact');
  afterEach(() => cleanup());
}
