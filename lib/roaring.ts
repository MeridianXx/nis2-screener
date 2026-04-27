import type { CompanyHit, CompanyProfile } from '@/lib/mocks/companies';

const TIMEOUT_MS = 8000;
// Refresh access tokens slightly before they expire so a request never lands
// in the gap between expiry and the next renewal.
const TOKEN_REFRESH_BUFFER_MS = 30_000;

type Config = {
  clientId: string;
  clientSecret: string;
  baseUrl: string;
  tokenUrl: string;
};

function getConfig(): Config | null {
  const clientId = process.env.ROARING_CLIENT_ID;
  const clientSecret = process.env.ROARING_CLIENT_SECRET;
  const baseUrl = process.env.ROARING_BASE_URL;
  if (!clientId || !clientSecret || !baseUrl) return null;
  const trimmedBase = baseUrl.replace(/\/$/, '');
  return {
    clientId,
    clientSecret,
    baseUrl: trimmedBase,
    tokenUrl: process.env.ROARING_TOKEN_URL ?? `${trimmedBase}/token`,
  };
}

export class RoaringNotConfiguredError extends Error {
  constructor() {
    super('ROARING_CLIENT_ID, ROARING_CLIENT_SECRET eller ROARING_BASE_URL saknas');
    this.name = 'RoaringNotConfiguredError';
  }
}

let cachedToken: { token: string; expiresAt: number } | null = null;

// Exposed for tests; production callers should use callRoaring().
export function _resetTokenCache() {
  cachedToken = null;
}

async function getAccessToken(config: Config): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + TOKEN_REFRESH_BUFFER_MS) {
    return cachedToken.token;
  }

  const credentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');
  const body = new URLSearchParams({ grant_type: 'client_credentials' });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: body.toString(),
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(
        `Roaring token endpoint ${res.status}: ${await res.text().catch(() => '')}`,
      );
    }
    const json = (await res.json()) as { access_token: string; expires_in: number };
    cachedToken = {
      token: json.access_token,
      expiresAt: now + json.expires_in * 1000,
    };
    return cachedToken.token;
  } finally {
    clearTimeout(timeout);
  }
}

async function callRoaring<T>(path: string): Promise<T> {
  const config = getConfig();
  if (!config) throw new RoaringNotConfiguredError();
  const token = await getAccessToken(config);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${config.baseUrl}${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      signal: controller.signal,
    });
    if (res.status === 401) {
      // Token may have been revoked or rotated; clear and let the next call
      // re-authenticate from scratch.
      cachedToken = null;
    }
    if (!res.ok) {
      throw new Error(
        `Roaring ${path} → ${res.status}: ${await res.text().catch(() => '')}`,
      );
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

// Endpoints below are best-effort guesses against Roaring's "Company
// Information" + "Company Financials" v2 APIs. They may need to be tuned
// against the real sandbox response — see lib/company.ts for where to
// inject logging while iterating.
type RoaringSearchResponse = {
  hits?: { companyId?: string; companyName?: string; town?: string }[];
  // The API has shipped multiple shapes over the years; tolerate both.
  companies?: { companyId?: string; companyName?: string; town?: string }[];
};

type RoaringCompanyResponse = {
  companyId?: string;
  organisationNumber?: string;
  companyName?: string;
  town?: string;
  // SNI / industry classification — different envelopes have used different keys.
  industryCode?: string;
  industryText?: string;
  industries?: { code?: string; description?: string }[];
  // Headcount + financials — also vary.
  numberOfEmployees?: number;
  employees?: number;
  turnoverKSEK?: number;
  totalAssetsKSEK?: number;
  netSalesKSEK?: number;
  balanceSheetTotalKSEK?: number;
};

function normalizeProfile(raw: RoaringCompanyResponse): CompanyProfile {
  const orgnr = raw.companyId ?? raw.organisationNumber ?? '';
  const sni = raw.industries?.[0];
  const turnoverK = raw.turnoverKSEK ?? raw.netSalesKSEK ?? null;
  const balanceK = raw.totalAssetsKSEK ?? raw.balanceSheetTotalKSEK ?? null;
  return {
    orgnr,
    name: raw.companyName ?? '',
    city: raw.town ?? '',
    sniCode: raw.industryCode ?? sni?.code ?? '',
    sniLabel: raw.industryText ?? sni?.description ?? null,
    employees: raw.numberOfEmployees ?? raw.employees ?? null,
    // Roaring reports financials in kSEK; convert to MSEK for the rest of
    // the app.
    turnover: turnoverK != null ? turnoverK / 1000 : null,
    balance: balanceK != null ? balanceK / 1000 : null,
  };
}

export async function searchCompanies(query: string, limit = 6): Promise<CompanyHit[]> {
  const json = await callRoaring<RoaringSearchResponse>(
    `/se/company-information/2.0/companies?nameContaining=${encodeURIComponent(query)}&maxHits=${limit}`,
  );
  const rawHits = json.hits ?? json.companies ?? [];
  return rawHits.map((h) => ({
    orgnr: h.companyId ?? '',
    name: h.companyName ?? '',
    city: h.town ?? '',
  }));
}

export async function getCompanyProfile(orgnr: string): Promise<CompanyProfile> {
  const json = await callRoaring<RoaringCompanyResponse>(
    `/se/company-information/2.0/companies/${orgnr}`,
  );
  return normalizeProfile(json);
}
