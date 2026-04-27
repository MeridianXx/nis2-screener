import { isDatabaseConfigured, prisma } from '@/lib/prisma';
import { EXPLANATION_TTL_DAYS } from '@/lib/explain-prompt';
import type { CompanyProfile } from '@/lib/mocks/companies';

export const COMPANY_CACHE_TTL_DAYS = 60;

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
