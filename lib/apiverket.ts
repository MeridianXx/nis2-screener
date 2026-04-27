import type { CompanyHit, CompanyProfile } from '@/lib/mocks/companies';

const TIMEOUT_MS = 8000;
const BASE_URL = 'https://apiverket.se';

// Apiverket response shape — confirmed against a live response on
// 2026-04-27. The API wraps payloads in { meta, data }; sni_codes is an
// array of { code, description } objects; org_number uses an underscore;
// and the address is flattened to postal_code + city at the top level
// (the address field itself is often null). Field parsing is tolerant of
// the older flat / array-of-strings shapes too so older fixtures keep
// working in tests.

type ApiverketAddressObject = {
  street?: string;
  postal_code?: string;
  postalCode?: string;
  city?: string;
};

type ApiverketSniEntry = string | { code?: string; description?: string };

type ApiverketCompanyRaw = {
  org_number?: string;
  orgnr?: string;
  organisation_number?: string;
  name?: string;
  legal_form?: string | null;
  legalForm?: string | null;
  sni_codes?: ApiverketSniEntry[];
  sniCodes?: ApiverketSniEntry[];
  address?: ApiverketAddressObject | string | null;
  postal_code?: string | null;
  postalCode?: string | null;
  city?: string | null;
  status?: string | null;
};

type ApiverketEnvelope<T> = { meta?: unknown; data?: T };

type ApiverketSearchRaw =
  | ApiverketCompanyRaw[]
  | { companies?: ApiverketCompanyRaw[]; results?: ApiverketCompanyRaw[] };

export type ApiverketCompany = {
  orgnr: string;
  name: string;
  legalForm: string | null;
  // Normalized to "62.01" form (matches data/sni-mapping.json), with the
  // human-readable Swedish description from Apiverket preserved alongside.
  sniCodes: { code: string; description: string | null }[];
  address: { street?: string; postalCode?: string; city?: string } | null;
  status: string | null;
};

export class ApiverketNotConfiguredError extends Error {
  constructor() {
    super('APIVERKET_API_KEY saknas');
    this.name = 'ApiverketNotConfiguredError';
  }
}

export class ApiverketRateLimitError extends Error {
  constructor(
    public retryAfterSeconds: number | null,
    public diagnostic: {
      remaining: number | null;
      limit: number | null;
      resetEpoch: number | null;
      isDaily: boolean;
      upstreamMessage: string | null;
      bodySnippet: string;
    },
  ) {
    super('Apiverket-rate-limit nådd');
    this.name = 'ApiverketRateLimitError';
  }
}

export class ApiverketUpstreamError extends Error {
  constructor(public status: number, body: string) {
    super(`Apiverket ${status}: ${body.slice(0, 200)}`);
    this.name = 'ApiverketUpstreamError';
  }
}

function getApiKey(): string {
  const key = process.env.APIVERKET_API_KEY;
  if (!key) throw new ApiverketNotConfiguredError();
  return key;
}

// "62010" → "62.01"; "6201" → "62.01"; "62.01" → "62.01"; null/short/non-numeric → null.
export function normalizeSniCode(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const trimmed = String(raw).trim();
  if (trimmed.length === 0) return null;

  // Already-formatted XX.XX — accept verbatim, even if the digits after the
  // dot are 1 or 2 chars (some SNI codes are 4-digit pre-Nace-rev2).
  if (/^\d{2}\.\d{1,2}$/.test(trimmed)) return trimmed;

  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < 4) return null;
  return `${digits.slice(0, 2)}.${digits.slice(2, 4)}`;
}

function normalizeAddress(raw: ApiverketCompanyRaw) {
  const addressObj =
    raw.address && typeof raw.address === 'object' ? (raw.address as ApiverketAddressObject) : null;
  const street = addressObj?.street ?? undefined;
  const postalCode =
    raw.postal_code ?? raw.postalCode ?? addressObj?.postal_code ?? addressObj?.postalCode ?? undefined;
  const city = raw.city ?? addressObj?.city ?? undefined;
  if (!street && !postalCode && !city) return null;
  return { street, postalCode, city };
}

function extractSniEntry(
  entry: ApiverketSniEntry,
): { code: string; description: string | null } | null {
  if (typeof entry === 'string') {
    const code = normalizeSniCode(entry);
    return code ? { code, description: null } : null;
  }
  const code = normalizeSniCode(entry.code ?? null);
  if (!code) return null;
  return { code, description: entry.description ?? null };
}

function normalizeCompany(raw: ApiverketCompanyRaw): ApiverketCompany | null {
  const orgnr = (raw.org_number ?? raw.orgnr ?? raw.organisation_number ?? '').replace(/\D/g, '');
  if (!orgnr) return null;
  const rawSni = raw.sni_codes ?? raw.sniCodes ?? [];
  const sniCodes = rawSni
    .map((entry) => extractSniEntry(entry))
    .filter((entry): entry is { code: string; description: string | null } => entry !== null);
  return {
    orgnr,
    name: raw.name ?? '',
    legalForm: raw.legal_form ?? raw.legalForm ?? null,
    sniCodes,
    address: normalizeAddress(raw),
    status: raw.status ?? null,
  };
}

// Apiverket wraps successful responses as { meta, data }. Tests + older
// fixtures may hand back unwrapped objects, so accept both.
function unwrap<T>(payload: T | ApiverketEnvelope<T> | null): T | null {
  if (!payload) return null;
  if (typeof payload === 'object' && 'data' in payload && payload.data !== undefined) {
    return (payload as ApiverketEnvelope<T>).data ?? null;
  }
  return payload as T;
}

async function callApiverket<T>(path: string): Promise<{ status: number; json: T | null; text: string }> {
  const key = getApiKey();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: {
        Authorization: `Bearer ${key}`,
        Accept: 'application/json',
      },
      signal: controller.signal,
    });
    const text = await res.text();
    let json: T | null = null;
    if (text) {
      try {
        json = JSON.parse(text) as T;
      } catch {
        json = null;
      }
    }
    return { status: res.status, json, text };
  } finally {
    clearTimeout(timeout);
  }
}

export async function searchCompanies(query: string, limit = 6): Promise<ApiverketCompany[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  // /v1/companies/search per the Apiverket API reference: q is required
  // (min 2 chars, substring match) and limit is capped at 100. Response
  // shape is { meta, data: [...companies] } — unwrap() handles the envelope.
  const path = `/v1/companies/search?q=${encodeURIComponent(trimmed)}&limit=${limit}`;
  const { status, json, text } = await callApiverket<ApiverketEnvelope<ApiverketSearchRaw> | ApiverketSearchRaw>(
    path,
  );

  if (status === 429) {
    throw new ApiverketRateLimitError(parseRetryAfter(text), buildRateLimitDiagnostic(text));
  }
  if (status === 404) return [];
  if (status >= 400) throw new ApiverketUpstreamError(status, text);

  const data = unwrap(json);
  const list = Array.isArray(data) ? data : (data?.companies ?? data?.results ?? []);
  return list
    .map((raw) => normalizeCompany(raw))
    .filter((c): c is ApiverketCompany => c !== null);
}

export async function getCompany(orgnr: string): Promise<ApiverketCompany | null> {
  const cleaned = orgnr.replace(/\D/g, '');
  if (cleaned.length !== 10) return null;

  const { status, json, text } = await callApiverket<ApiverketEnvelope<ApiverketCompanyRaw> | ApiverketCompanyRaw>(
    `/v1/companies/${cleaned}`,
  );

  if (status === 404) return null;
  if (status === 429)
    throw new ApiverketRateLimitError(parseRetryAfter(text), buildRateLimitDiagnostic(text));
  if (status >= 400) throw new ApiverketUpstreamError(status, text);
  const data = unwrap(json);
  if (!data) return null;
  return normalizeCompany(data);
}

function parseRetryAfter(text: string): number | null {
  // Apiverket may return Retry-After in body for 429s; if not parseable, null.
  const match = /(\d+)/.exec(text);
  if (!match || !match[1]) return null;
  const n = parseInt(match[1], 10);
  return Number.isFinite(n) ? n : null;
}

// Apiverket's 429 body uses a different envelope than success responses:
// { error: { type, code, message, request_id } } and no meta block. Pull
// the message out and detect "daily" vs sliding per-minute throttling so
// the user-facing copy is honest about what they need to do (wait
// minutes vs wait until tomorrow / upgrade plan).
function buildRateLimitDiagnostic(text: string): {
  remaining: number | null;
  limit: number | null;
  resetEpoch: number | null;
  isDaily: boolean;
  upstreamMessage: string | null;
  bodySnippet: string;
} {
  let remaining: number | null = null;
  let limit: number | null = null;
  let resetEpoch: number | null = null;
  let isDaily = false;
  let upstreamMessage: string | null = null;
  try {
    const body = JSON.parse(text) as {
      meta?: { rate_limit?: { limit?: number; remaining?: number; reset?: number } };
      error?: { type?: string; code?: string; message?: string };
    };
    const rl = body?.meta?.rate_limit;
    if (rl) {
      if (typeof rl.limit === 'number') limit = rl.limit;
      if (typeof rl.remaining === 'number') remaining = rl.remaining;
      if (typeof rl.reset === 'number') resetEpoch = rl.reset;
    }
    if (body?.error?.message) {
      upstreamMessage = body.error.message;
      // "Daily company search limit of 20 exceeded for free tier" → daily.
      // Per-minute messages tend to say "rate limit" without "daily".
      if (/daily/i.test(body.error.message)) isDaily = true;
    }
    if (remaining === 0) isDaily = true;
  } catch {
    // Not JSON — keep defaults.
  }
  console.warn(
    '[apiverket] 429',
    JSON.stringify({
      remaining,
      limit,
      resetEpoch,
      isDaily,
      upstreamMessage,
      bodySnippet: text.slice(0, 200),
    }),
  );
  return { remaining, limit, resetEpoch, isDaily, upstreamMessage, bodySnippet: text.slice(0, 200) };
}

// Adapter to the project-wide CompanyProfile shape used by the cache and
// the assess flow. Apiverket does not expose employees, turnover or balance,
// so those fields are always null and the user fills them in on the
// confirmation page.
export function toCompanyProfile(c: ApiverketCompany): CompanyProfile {
  const sni = c.sniCodes[0];
  return {
    orgnr: c.orgnr,
    name: c.name,
    city: c.address?.city ?? '',
    sniCode: sni?.code ?? '',
    // Use the human-readable SNI description (e.g. "Partihandel med
    // medicinsk utrustning") rather than legal_form (e.g. "Aktiebolag")
    // — they're different things and the SNI label is what /assess/confirm
    // needs to show next to the code.
    sniLabel: sni?.description ?? null,
    employees: null,
    turnover: null,
    balance: null,
  };
}

export function toCompanyHit(c: ApiverketCompany): CompanyHit {
  return {
    orgnr: c.orgnr,
    name: c.name,
    city: c.address?.city ?? '',
  };
}
