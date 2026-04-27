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

  const url = `${config.baseUrl}${path}`;
  const debug = process.env.ROARING_DEBUG === 'true';
  if (debug) console.warn('[roaring] →', url);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
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
      const body = await res.text().catch(() => '');
      throw new Error(`Roaring ${path} → ${res.status}: ${body}`);
    }
    const json = (await res.json()) as T;
    if (debug) console.warn('[roaring] ←', url, JSON.stringify(json).slice(0, 800));
    return json;
  } finally {
    clearTimeout(timeout);
  }
}

// Endpoints below are best-effort guesses against Roaring's "Company
// Information" + "Company Financials" v2 APIs. They may need to be tuned
// against the real sandbox response — see lib/company.ts for where to
// inject logging while iterating.
type RoaringSearchHit = {
  companyId?: string;
  organisationNumber?: string;
  companyName?: string;
  town?: string;
  // Some search responses nest the address; flatten if present.
  address?: { town?: string };
};

type RoaringSearchResponse = {
  hitCount?: number;
  hits?: RoaringSearchHit[];
  // Older shapes — kept tolerant.
  companies?: RoaringSearchHit[];
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

// Roaring Company Search 2.0 endpoint per their developer portal:
//   GET /se/company/search/2.0/search?freeText=...&pageSize=...
// Hits come back as { hits: SearchHit[], hitCount, ... }. Override paths
// via env if you only have a different API product subscribed.
const SEARCH_PATH_TEMPLATE =
  process.env.ROARING_SEARCH_PATH ??
  '/se/company/search/2.0/search?freeText={q}&pageSize={limit}';
const COMPANY_PATH_TEMPLATE =
  process.env.ROARING_COMPANY_PATH ?? '/se/companyinformation/2.1/company/{orgnr}';

function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? '');
}

export async function searchCompanies(query: string, limit = 6): Promise<CompanyHit[]> {
  const path = fillTemplate(SEARCH_PATH_TEMPLATE, {
    q: encodeURIComponent(query),
    limit: String(limit),
  });
  const json = await callRoaring<RoaringSearchResponse>(path);
  const rawHits = json.hits ?? json.companies ?? [];
  return rawHits.map((h) => ({
    orgnr: h.companyId ?? h.organisationNumber ?? '',
    name: h.companyName ?? '',
    city: h.town ?? h.address?.town ?? '',
  }));
}

export async function getCompanyProfile(orgnr: string): Promise<CompanyProfile> {
  const path = fillTemplate(COMPANY_PATH_TEMPLATE, { orgnr });
  const json = await callRoaring<RoaringCompanyResponse>(path);
  return normalizeProfile(json);
}
