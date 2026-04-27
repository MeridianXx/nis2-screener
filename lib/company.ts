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

  // Apiverket's free-text search path is still unconfirmed, but
  // /v1/companies/{orgnr} is solid. If the user typed a 10-digit org
  // number (with or without the "XXXXXX-XXXX" hyphen), short-circuit to
  // the lookup endpoint and surface a single hit so the flow works.
  const digitsOnly = trimmed.replace(/\D/g, '');
  if (/^\d{10}$/.test(digitsOnly)) {
    const company = await apiverket.getCompany(digitsOnly);
    return company ? [apiverket.toCompanyHit(company)] : [];
  }

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
