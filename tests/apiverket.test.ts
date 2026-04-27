import {
  ApiverketNotConfiguredError,
  ApiverketRateLimitError,
  getCompany,
  normalizeSniCode,
  searchCompanies,
} from '@/lib/apiverket';

describe('normalizeSniCode', () => {
  test('5-digit code → XX.XX', () => {
    expect(normalizeSniCode('62010')).toBe('62.01');
  });

  test('4-digit code → XX.XX', () => {
    expect(normalizeSniCode('6201')).toBe('62.01');
  });

  test('already-formatted code is preserved', () => {
    expect(normalizeSniCode('62.01')).toBe('62.01');
    expect(normalizeSniCode('10.5')).toBe('10.5');
  });

  test('null/undefined/empty returns null', () => {
    expect(normalizeSniCode(null)).toBeNull();
    expect(normalizeSniCode(undefined)).toBeNull();
    expect(normalizeSniCode('')).toBeNull();
    expect(normalizeSniCode('   ')).toBeNull();
  });

  test('shorter than 4 digits returns null', () => {
    expect(normalizeSniCode('62')).toBeNull();
    expect(normalizeSniCode('1')).toBeNull();
  });

  test('non-numeric characters are stripped before formatting', () => {
    expect(normalizeSniCode('62-010')).toBe('62.01');
    expect(normalizeSniCode('SNI:62010')).toBe('62.01');
  });

  test('purely non-numeric returns null', () => {
    expect(normalizeSniCode('abc')).toBeNull();
  });

  test('trims whitespace', () => {
    expect(normalizeSniCode('  62010  ')).toBe('62.01');
  });
});

describe('searchCompanies + getCompany — fetch behaviour', () => {
  const realFetch = globalThis.fetch;
  const realKey = process.env.APIVERKET_API_KEY;

  afterEach(() => {
    globalThis.fetch = realFetch;
    if (realKey === undefined) delete process.env.APIVERKET_API_KEY;
    else process.env.APIVERKET_API_KEY = realKey;
  });

  test('throws ApiverketNotConfiguredError when API key missing', async () => {
    delete process.env.APIVERKET_API_KEY;
    await expect(searchCompanies('foo')).rejects.toBeInstanceOf(ApiverketNotConfiguredError);
  });

  test('passes Bearer token in Authorization header', async () => {
    process.env.APIVERKET_API_KEY = 'sk_test_123';
    const seenHeaders: Record<string, string> = {};
    globalThis.fetch = (async (_url: string, init?: RequestInit) => {
      Object.assign(seenHeaders, init?.headers as Record<string, string>);
      return new Response('[]', { status: 200, headers: { 'content-type': 'application/json' } });
    }) as typeof fetch;

    await searchCompanies('foo');
    expect(seenHeaders.Authorization).toBe('Bearer sk_test_123');
    expect(seenHeaders.Accept).toBe('application/json');
  });

  test('getCompany returns null on 404 (does not throw)', async () => {
    process.env.APIVERKET_API_KEY = 'sk_test_123';
    globalThis.fetch = (async () =>
      new Response('Not Found', { status: 404 })) as typeof fetch;

    const result = await getCompany('5560000123');
    expect(result).toBeNull();
  });

  test('getCompany throws ApiverketRateLimitError on 429', async () => {
    process.env.APIVERKET_API_KEY = 'sk_test_123';
    globalThis.fetch = (async () =>
      new Response('Retry after 60 seconds', { status: 429 })) as typeof fetch;

    await expect(getCompany('5560000123')).rejects.toBeInstanceOf(ApiverketRateLimitError);
  });

  test('searchCompanies throws ApiverketRateLimitError on 429', async () => {
    process.env.APIVERKET_API_KEY = 'sk_test_123';
    globalThis.fetch = (async () => new Response('429', { status: 429 })) as typeof fetch;
    await expect(searchCompanies('foo')).rejects.toBeInstanceOf(ApiverketRateLimitError);
  });

  test('searchCompanies normalizes sni_codes from snake_case payload', async () => {
    process.env.APIVERKET_API_KEY = 'sk_test_123';
    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify([
          {
            orgnr: '5560000123',
            name: 'Acme AB',
            legal_form: 'AB',
            sni_codes: ['62010', '62020'],
            address: { street: 'Storg 1', postal_code: '11122', city: 'Stockholm' },
            status: 'Aktiv',
          },
        ]),
        { status: 200 },
      )) as typeof fetch;

    const results = await searchCompanies('acme');
    expect(results).toHaveLength(1);
    expect(results[0]?.sniCodes).toEqual(['62.01', '62.02']);
    expect(results[0]?.address?.postalCode).toBe('11122');
    expect(results[0]?.legalForm).toBe('AB');
  });

  test('searchCompanies unwraps { meta, data: [...] } envelope', async () => {
    process.env.APIVERKET_API_KEY = 'sk_test_123';
    let calledUrl = '';
    globalThis.fetch = (async (url: string) => {
      calledUrl = url;
      return new Response(
        JSON.stringify({
          meta: { request_id: 'req_y', rate_limit: { limit: 100, remaining: 8 } },
          data: [
            {
              org_number: '5560566258',
              name: 'Ericsson AB',
              legal_form: 'AB',
              status: 'Aktivt',
              postal_code: '16480',
              city: 'STOCKHOLM',
              sni_codes: [{ code: '62100', description: 'Dataprogrammering' }],
            },
          ],
        }),
        { status: 200 },
      );
    }) as typeof fetch;

    const results = await searchCompanies('ericsson');
    expect(calledUrl).toContain('/v1/companies/search?q=ericsson');
    expect(calledUrl).toContain('limit=6');
    expect(results).toHaveLength(1);
    expect(results[0]?.orgnr).toBe('5560566258');
    expect(results[0]?.sniCodes).toEqual(['62.10']);
  });

  test('searchCompanies rejects queries shorter than 2 chars without calling upstream', async () => {
    process.env.APIVERKET_API_KEY = 'sk_test_123';
    let called = false;
    globalThis.fetch = (async () => {
      called = true;
      return new Response('{}', { status: 200 });
    }) as typeof fetch;

    expect(await searchCompanies('a')).toEqual([]);
    expect(await searchCompanies(' ')).toEqual([]);
    expect(called).toBe(false);
  });

  test('getCompany unwraps { meta, data } envelope and flattened address', async () => {
    process.env.APIVERKET_API_KEY = 'sk_test_123';
    // Shape mirrors the live 2026-04-27 response from /v1/companies/{orgnr}.
    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          meta: { request_id: 'req_x', rate_limit: { limit: 100, remaining: 9 } },
          data: {
            org_number: '5560566258',
            name: 'Ericsson AB',
            legal_form: 'Övriga aktiebolag',
            status: 'Aktivt',
            address: null,
            postal_code: '16480',
            city: 'STOCKHOLM',
            sni_codes: [
              { code: '62100', description: 'Dataprogrammering' },
              { code: '70100', description: 'Verksamheter som utövas av huvudkontor' },
            ],
          },
        }),
        { status: 200 },
      )) as typeof fetch;

    const result = await getCompany('5560566258');
    expect(result).not.toBeNull();
    expect(result?.orgnr).toBe('5560566258');
    expect(result?.name).toBe('Ericsson AB');
    expect(result?.legalForm).toBe('Övriga aktiebolag');
    expect(result?.status).toBe('Aktivt');
    expect(result?.sniCodes).toEqual(['62.10', '70.10']);
    expect(result?.address?.city).toBe('STOCKHOLM');
    expect(result?.address?.postalCode).toBe('16480');
  });

  test('getCompany rejects orgnr that is not 10 digits without calling upstream', async () => {
    process.env.APIVERKET_API_KEY = 'sk_test_123';
    let called = false;
    globalThis.fetch = (async () => {
      called = true;
      return new Response('{}', { status: 200 });
    }) as typeof fetch;

    expect(await getCompany('123')).toBeNull();
    expect(called).toBe(false);
  });

  test('Bearer token is not echoed in error messages', async () => {
    process.env.APIVERKET_API_KEY = 'sk_test_supersecret_dont_log';
    globalThis.fetch = (async () =>
      new Response('upstream went boom', { status: 500 })) as typeof fetch;

    let caught: unknown;
    try {
      await searchCompanies('foo');
    } catch (e) {
      caught = e;
    }
    expect(String(caught)).not.toContain('sk_test_supersecret_dont_log');
  });
});
