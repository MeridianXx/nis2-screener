import { NextResponse } from 'next/server';
import { z } from 'zod';
import { fail, ok } from '@/lib/api-response';
import { CompanyNotFoundError, fetchCompanyProfile } from '@/lib/company';
import { ApiverketNotConfiguredError, ApiverketRateLimitError } from '@/lib/apiverket';

const orgnrSchema = z.string().regex(/^\d{10}$/, 'Organisationsnummer ska vara 10 siffror.');

export async function GET(_req: Request, { params }: { params: { orgnr: string } }) {
  const parsed = orgnrSchema.safeParse(params.orgnr);
  if (!parsed.success) {
    return NextResponse.json(
      fail('VALIDATION_ERROR', 'Organisationsnummer ska vara 10 siffror utan bindestreck.'),
      { status: 400 },
    );
  }

  try {
    const profile = await fetchCompanyProfile(parsed.data);
    return NextResponse.json(ok(profile));
  } catch (err) {
    if (err instanceof CompanyNotFoundError) {
      return NextResponse.json(
        fail('NOT_FOUND', 'Företaget kunde inte hittas. Försök med organisationsnummer istället.'),
        { status: 404 },
      );
    }
    if (err instanceof ApiverketNotConfiguredError) {
      return NextResponse.json(
        fail('NOT_CONFIGURED', 'Företagsuppslag är inte aktiverat i denna miljö.'),
        { status: 503 },
      );
    }
    if (err instanceof ApiverketRateLimitError) {
      const retry = err.retryAfterSeconds;
      const message = err.diagnostic.isDaily
        ? 'Företagsuppslagets dagliga gräns är nådd. Försök igen imorgon eller uppgradera planen.'
        : 'Företagsuppslaget är tillfälligt blockerat — vänta en stund och försök igen.';
      return NextResponse.json(fail('RATE_LIMITED', message, err.diagnostic), {
        status: 429,
        headers: retry != null ? { 'Retry-After': String(retry) } : undefined,
      });
    }
    console.error('[company/[orgnr]] failed:', err);
    return NextResponse.json(
      fail('UPSTREAM_ERROR', 'Företagsuppslag är inte tillgängligt just nu.'),
      { status: 502 },
    );
  }
}
