import { gcBuckets, RATE_LIMIT_PER_MINUTE, RATE_LIMIT_WINDOW_MS, takeToken } from '@/lib/rate-limit';

type Bucket = { count: number; reset: number };

describe('takeToken', () => {
  test('allows up to LIMIT requests in a window', () => {
    const store = new Map<string, Bucket>();
    const now = 0;
    for (let i = 0; i < RATE_LIMIT_PER_MINUTE; i++) {
      expect(takeToken(store, 'a', now)).toEqual({ ok: true });
    }
    const denied = takeToken(store, 'a', now);
    expect(denied.ok).toBe(false);
  });

  test('reports retryAfter in seconds when blocked', () => {
    const store = new Map<string, Bucket>();
    for (let i = 0; i < RATE_LIMIT_PER_MINUTE; i++) takeToken(store, 'a', 0);
    const denied = takeToken(store, 'a', 30_000);
    expect(denied.ok).toBe(false);
    if (denied.ok === false) {
      // 60s window started at t=0, we're at t=30s → 30s remain.
      expect(denied.retryAfter).toBe(30);
    }
  });

  test('resets after the window expires', () => {
    const store = new Map<string, Bucket>();
    for (let i = 0; i < RATE_LIMIT_PER_MINUTE; i++) takeToken(store, 'a', 0);
    const fresh = takeToken(store, 'a', RATE_LIMIT_WINDOW_MS + 1);
    expect(fresh.ok).toBe(true);
  });

  test('different keys have independent buckets', () => {
    const store = new Map<string, Bucket>();
    for (let i = 0; i < RATE_LIMIT_PER_MINUTE; i++) takeToken(store, 'a', 0);
    const otherIp = takeToken(store, 'b', 0);
    expect(otherIp.ok).toBe(true);
  });
});

describe('gcBuckets', () => {
  test('drops expired entries only', () => {
    const store = new Map<string, Bucket>();
    store.set('expired', { count: 1, reset: 100 });
    store.set('active', { count: 1, reset: 100_000 });
    gcBuckets(store, 1_000);
    expect(store.has('expired')).toBe(false);
    expect(store.has('active')).toBe(true);
  });
});
