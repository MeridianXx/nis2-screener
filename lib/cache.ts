import { createHash } from 'node:crypto';
import { isDatabaseConfigured, prisma } from '@/lib/prisma';
import { EXPLANATION_TTL_DAYS } from '@/lib/explain-prompt';
import type { CompanyHit, CompanyProfile } from '@/lib/mocks/companies';

// Bumped from 60 → 90 days to fit Apiverket's 200/day free tier; per-orgnr
// reads should rarely re-fetch.
export const COMPANY_CACHE_TTL_DAYS = 90;
// Search results churn faster (new companies register, names change) so a
// shorter TTL keeps the autocomplete reasonably fresh.
export const SEARCH_CACHE_TTL_DAYS = 7;

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

export async function getCompanyCache(orgnr: string): Promise<CompanyProfile | null> {
  if (!isDatabaseConfigured()) return null;
  try {
    const row = await prisma.companyCache.findUnique({ where: { orgnr } });
    if (!row) return null;
    if (row.expiresAt.getTime() < Date.now()) return null;
    return {
      orgnr: row.orgnr,
      name: row.name,
      city: row.city ?? '',
      sniCode: row.sniCode,
      sniLabel: row.sniLabel,
      employees: row.employees,
      turnover: row.turnover,
      balance: row.balance,
    };
  } catch (err) {
    console.warn('[cache] company read failed:', err);
    return null;
  }
}

export async function setCompanyCache(profile: CompanyProfile): Promise<boolean> {
  if (!isDatabaseConfigured()) return false;
  const expiresAt = new Date(Date.now() + COMPANY_CACHE_TTL_DAYS * 24 * 60 * 60 * 1000);
  try {
    await prisma.companyCache.upsert({
      where: { orgnr: profile.orgnr },
      update: {
        name: profile.name,
        city: profile.city || null,
        sniCode: profile.sniCode,
        sniLabel: profile.sniLabel,
        employees: profile.employees,
        turnover: profile.turnover,
        balance: profile.balance,
        expiresAt,
      },
      create: {
        orgnr: profile.orgnr,
        name: profile.name,
        city: profile.city || null,
        sniCode: profile.sniCode,
        sniLabel: profile.sniLabel,
        employees: profile.employees,
        turnover: profile.turnover,
        balance: profile.balance,
        expiresAt,
      },
    });
    return true;
  } catch (err) {
    console.warn('[cache] company write failed:', err);
    return false;
  }
}

function searchCacheKey(query: string): string {
  return createHash('sha256').update(query.trim().toLowerCase()).digest('hex').slice(0, 32);
}

export async function getSearchCache(query: string): Promise<CompanyHit[] | null> {
  if (!isDatabaseConfigured()) return null;
  try {
    const row = await prisma.searchCache.findUnique({ where: { queryHash: searchCacheKey(query) } });
    if (!row) return null;
    if (row.expiresAt.getTime() < Date.now()) return null;
    return row.results as unknown as CompanyHit[];
  } catch (err) {
    console.warn('[cache] search read failed:', err);
    return null;
  }
}

export async function setSearchCache(query: string, hits: CompanyHit[]): Promise<boolean> {
  if (!isDatabaseConfigured()) return false;
  const expiresAt = new Date(Date.now() + SEARCH_CACHE_TTL_DAYS * 24 * 60 * 60 * 1000);
  try {
    await prisma.searchCache.upsert({
      where: { queryHash: searchCacheKey(query) },
      update: { results: hits as unknown as object, expiresAt },
      create: { queryHash: searchCacheKey(query), results: hits as unknown as object, expiresAt },
    });
    return true;
  } catch (err) {
    console.warn('[cache] search write failed:', err);
    return false;
  }
}

export async function logAssessment(record: {
  orgnr: string | null;
  verdict: string;
  sector: string | null;
  sizeClass: string | null;
}): Promise<boolean> {
  if (!isDatabaseConfigured()) return false;
  try {
    await prisma.assessmentLog.create({ data: record });
    return true;
  } catch (err) {
    console.warn('[cache] assessment log failed:', err);
    return false;
  }
}
