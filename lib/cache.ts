import { isDatabaseConfigured, prisma } from '@/lib/prisma';
import { EXPLANATION_TTL_DAYS } from '@/lib/explain-prompt';

// All cache helpers swallow Prisma errors and return null/false so a missing
// or unreachable database gracefully degrades to "no cache" instead of
// breaking the request path. Callers can check the boolean return on writes.

export async function getExplanationCache(cacheKey: string): Promise<string | null> {
  if (!isDatabaseConfigured()) return null;
  try {
    const row = await prisma.explanationCache.findUnique({ where: { cacheKey } });
    if (!row) return null;
    if (row.expiresAt.getTime() < Date.now()) return null;
    return row.text;
  } catch (err) {
    console.warn('[cache] explanation read failed:', err);
    return null;
  }
}

export async function setExplanationCache(cacheKey: string, text: string): Promise<boolean> {
  if (!isDatabaseConfigured()) return false;
  const expiresAt = new Date(Date.now() + EXPLANATION_TTL_DAYS * 24 * 60 * 60 * 1000);
  try {
    await prisma.explanationCache.upsert({
      where: { cacheKey },
      update: { text, expiresAt },
      create: { cacheKey, text, expiresAt },
    });
    return true;
  } catch (err) {
    console.warn('[cache] explanation write failed:', err);
    return false;
  }
}
