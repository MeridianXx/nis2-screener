import { NextResponse } from 'next/server';
import { z } from 'zod';
import { fail, ok } from '@/lib/api-response';
import { searchMockCompanies } from '@/lib/mocks/companies';

const querySchema = z.object({
  q: z.string().min(1).max(120),
});

const useMock = process.env.NEXT_PUBLIC_USE_MOCK_COMPANY_DATA === 'true';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = querySchema.safeParse({ q: url.searchParams.get('q') ?? '' });
  if (!parsed.success) {
    return NextResponse.json(
      fail('VALIDATION_ERROR', 'Sökfrågan saknas eller är ogiltig.'),
      { status: 400 },
    );
  }

  if (useMock) {
    return NextResponse.json(ok(searchMockCompanies(parsed.data.q)));
  }

  // TODO(session 3): Implement Roaring /search proxy with rate limiting.
  return NextResponse.json(
    fail('NOT_IMPLEMENTED', 'Företagsuppslag är inte aktiverat i denna miljö.'),
    { status: 501 },
  );
}
