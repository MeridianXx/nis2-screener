import { NextResponse } from 'next/server';
import { z } from 'zod';
import { fail, ok } from '@/lib/api-response';
import { findCompanyHits } from '@/lib/company';
import { ApiverketNotConfiguredError, ApiverketRateLimitError } from '@/lib/apiverket';

const querySchema = z.object({
  q: z.string().min(1).max(120),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = querySchema.safeParse({ q: url.searchParams.get('q') ?? '' });
  if (!parsed.success) {
    return NextResponse.json(
      fail('VALIDATION_ERROR', 'Sökfrågan saknas eller är ogiltig.'),
      { status: 400 },
    );
  }

  try {
    const hits = await findCompanyHits(parsed.data.q);
    return NextResponse.json(ok(hits));
  } catch (err) {
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
    console.error('[company/search] failed:', err);
    return NextResponse.json(
      fail('UPSTREAM_ERROR', 'Företagssökningen är inte tillgänglig just nu.'),
      { status: 502 },
    );
  }
}
