import {
  searchMockCompanies,
  getMockCompany,
  type CompanyHit,
  type CompanyProfile,
} from '@/lib/mocks/companies';
import {
  getCompanyCache,
  setCompanyCache,
  getSearchCache,
  setSearchCache,
} from '@/lib/cache';
import * as apiverket from '@/lib/apiverket';

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
  const trimmed = query.trim();
  if (!trimmed) return [];

  if (mockMode()) return searchMockCompanies(trimmed);

  const cached = await getSearchCache(trimmed);
  if (cached) return cached;

  const results = await apiverket.searchCompanies(trimmed);
  const hits = results.map((c) => apiverket.toCompanyHit(c));
  await setSearchCache(trimmed, hits);
  return hits;
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

  const company = await apiverket.getCompany(orgnr);
  if (!company) throw new CompanyNotFoundError(orgnr);
  const profile = apiverket.toCompanyProfile(company);
  await setCompanyCache(profile);
  return profile;
}
