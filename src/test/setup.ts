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
  const { cleanup } = await import('@testing-library/preact');
  afterEach(() => cleanup());
}
