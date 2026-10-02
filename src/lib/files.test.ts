import { afterEach, describe, expect, it, vi } from 'vitest';
import { saveTextFile } from './files';

describe('saveTextFile', () => {
  afterEach(() => vi.restoreAllMocks());
  it('uses the share sheet when files can be shared', async () => {
    const share = vi.fn(async () => {});
    Object.assign(navigator, { canShare: () => true, share });
    await saveTextFile('b.json', '{}');
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ files: [expect.any(File)] }));
  });
  it('rethrows when the parent cancels the share sheet', async () => {
    Object.assign(navigator, { canShare: () => true, share: async () => { throw new DOMException('cancel', 'AbortError'); } });
    await expect(saveTextFile('b.json', '{}')).rejects.toThrow('cancel');
  });
});

describe('saveTextFile fallback', () => {
  it('falls back to a download when the share sheet refuses (e.g. NotAllowedError after a slow export)', async () => {
    Object.assign(navigator, { canShare: () => true, share: async () => { throw new DOMException('late', 'NotAllowedError'); } });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    await saveTextFile('b.json', '{}');
    expect(click).toHaveBeenCalled();
  });
});
