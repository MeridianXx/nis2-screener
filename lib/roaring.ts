import type { CompanyHit, CompanyProfile } from '@/lib/mocks/companies';

const TIMEOUT_MS = 8000;

function getConfig(): { apiKey: string; baseUrl: string } | null {
  const apiKey = process.env.ROARING_API_KEY;
  const baseUrl = process.env.ROARING_BASE_URL;
  if (!apiKey || !baseUrl) return null;
  return { apiKey, baseUrl: baseUrl.replace(/\/$/, '') };
}

export class RoaringNotConfiguredError extends Error {
  constructor() {
    super('ROARING_API_KEY eller ROARING_BASE_URL saknas');
    this.name = 'RoaringNotConfiguredError';
  }
}

async function callRoaring<T>(path: string): Promise<T> {
  const config = getConfig();
  if (!config) throw new RoaringNotConfiguredError();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${config.baseUrl}${path}`, {
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        Accept: 'application/json',
      },
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`Roaring ${res.status}: ${await res.text().catch(() => '')}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

// The exact Roaring response shapes are stubbed here — adapt the field
// names once a real API key is wired up and the JSON shape can be
// inspected against a sandbox response.
type RoaringSearchResponse = {
  hits: { companyId: string; companyName: string; town?: string }[];
};

type RoaringCompanyResponse = {
  companyId: string;
  companyName: string;
  town?: string;
  industryCode: string;
  industryText?: string;
  numberOfEmployees?: number;
  turnoverKSEK?: number;
  totalAssetsKSEK?: number;
};

export async function searchCompanies(query: string, limit = 6): Promise<CompanyHit[]> {
  const json = await callRoaring<RoaringSearchResponse>(
    `/companies/search?q=${encodeURIComponent(query)}&limit=${limit}`,
  );
  return json.hits.map((h) => ({
    orgnr: h.companyId,
    name: h.companyName,
    city: h.town ?? '',
  }));
}

export async function getCompanyProfile(orgnr: string): Promise<CompanyProfile> {
  const json = await callRoaring<RoaringCompanyResponse>(`/companies/${orgnr}`);
  return {
    orgnr: json.companyId,
    name: json.companyName,
    city: json.town ?? '',
    sniCode: json.industryCode,
    sniLabel: json.industryText ?? null,
    employees: json.numberOfEmployees ?? null,
    // Roaring reports financials in kSEK (thousand SEK); the rest of the app
    // works in MSEK (million SEK) so divide by 1000.
    turnover: json.turnoverKSEK != null ? json.turnoverKSEK / 1000 : null,
    balance: json.totalAssetsKSEK != null ? json.totalAssetsKSEK / 1000 : null,
  };
}
