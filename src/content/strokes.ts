export const STROKE_DATA_VERSION = '2.0.1';

export type Fetcher = (url: string) => Promise<Response>;
export type StrokeAvailability = 'yes' | 'no' | 'unknown';

const defaultFetch: Fetcher = (url) => fetch(url);

export function strokeUrl(char: string): string {
  return `https://cdn.jsdelivr.net/npm/hanzi-writer-data@${STROKE_DATA_VERSION}/${encodeURIComponent(char)}.json`;
}

/** 'no' only when the CDN says the file does not exist; network trouble is 'unknown'. */
export async function strokeAvailability(char: string, fetcher: Fetcher = defaultFetch): Promise<StrokeAvailability> {
  try {
    const res = await fetcher(strokeUrl(char));
    if (res.ok) return 'yes';
    return res.status === 404 ? 'no' : 'unknown';
  } catch {
    return 'unknown';
  }
}

export async function loadStrokeData(char: string): Promise<unknown> {
  const res = await fetch(strokeUrl(char));
  if (!res.ok) throw new Error(`Stroke data for ${char}: HTTP ${res.status}`);
  return res.json();
}

/** Warms the service-worker cache so writing works offline later. */
export async function prefetchStrokes(chars: string[], fetcher: Fetcher = defaultFetch, concurrency = 4): Promise<void> {
  const queue = [...new Set(chars)];
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      for (let c = queue.shift(); c !== undefined; c = queue.shift()) await strokeAvailability(c, fetcher);
    }),
  );
}
