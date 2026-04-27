// Tiny in-memory token bucket. Lives in the module scope of a single Vercel
// instance, so rate limits are best-effort across instances — acceptable at
// the tool's expected volume (the limit catches abuse, not bursts of two
// simultaneous taps from the same user). Swap to Vercel KV / Upstash Redis
// when traffic warrants strict cross-instance enforcement.

export const RATE_LIMIT_PER_MINUTE = 3;
export const RATE_LIMIT_WINDOW_MS = 60_000;

type Bucket = { count: number; reset: number };

export function takeToken(
  store: Map<string, Bucket>,
  key: string,
  now: number,
  limit: number = RATE_LIMIT_PER_MINUTE,
  windowMs: number = RATE_LIMIT_WINDOW_MS,
): { ok: true } | { ok: false; retryAfter: number } {
  const bucket = store.get(key);
  if (!bucket || bucket.reset <= now) {
    store.set(key, { count: 1, reset: now + windowMs });
    return { ok: true };
  }
  if (bucket.count >= limit) {
    return { ok: false, retryAfter: Math.ceil((bucket.reset - now) / 1000) };
  }
  bucket.count += 1;
  return { ok: true };
}

// Drop expired buckets opportunistically so the map doesn't grow unbounded
// under abuse.
export function gcBuckets(store: Map<string, Bucket>, now: number): void {
  for (const [key, bucket] of store) {
    if (bucket.reset <= now) store.delete(key);
  }
}
