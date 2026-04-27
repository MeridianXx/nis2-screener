import { getMockCompany, searchMockCompanies, type CompanyHit, type CompanyProfile } from '@/lib/mocks/companies';
import { getCompanyCache, setCompanyCache } from '@/lib/cache';
import * as roaring from '@/lib/roaring';

function mockMode(): boolean {
  return process.env.NEXT_PUBLIC_USE_MOCK_COMPANY_DATA === 'true';
}

export class CompanyNotFoundError extends Error {
  constructor(orgnr: string) {
    super(`Företag ${orgnr} kunde inte hittas.`);
    this.name = 'CompanyNotFoundError';
  }
}

export async function findCompanyHits(query: string): Promise<CompanyHit[]> {
  if (mockMode()) return searchMockCompanies(query);
  return roaring.searchCompanies(query);
}

export async function fetchCompanyProfile(orgnr: string): Promise<CompanyProfile> {
  const cached = await getCompanyCache(orgnr);
  if (cached) return cached;

  if (mockMode()) {
    const profile = getMockCompany(orgnr);
    if (!profile) throw new CompanyNotFoundError(orgnr);
    await setCompanyCache(profile);
    return profile;
  }

  const profile = await roaring.getCompanyProfile(orgnr);
  await setCompanyCache(profile);
  return profile;
}
