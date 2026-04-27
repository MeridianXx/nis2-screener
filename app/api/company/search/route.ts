import { NextResponse } from 'next/server';
import { z } from 'zod';
import { fail, ok } from '@/lib/api-response';
import { findCompanyHits } from '@/lib/company';
import { RoaringNotConfiguredError } from '@/lib/roaring';

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
    if (err instanceof RoaringNotConfiguredError) {
      return NextResponse.json(
        fail('NOT_CONFIGURED', 'Företagsuppslag är inte aktiverat i denna miljö.'),
        { status: 503 },
      );
    }
    console.error('[company/search] failed:', err);
    return NextResponse.json(
      fail('UPSTREAM_ERROR', 'Företagssökningen är inte tillgänglig just nu.'),
      { status: 502 },
    );
  }
}
