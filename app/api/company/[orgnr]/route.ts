import { NextResponse } from 'next/server';
import { z } from 'zod';
import { fail, ok } from '@/lib/api-response';
import { getMockCompany } from '@/lib/mocks/companies';

const orgnrSchema = z.string().regex(/^\d{10}$/, 'Organisationsnummer ska vara 10 siffror.');

const useMock = process.env.NEXT_PUBLIC_USE_MOCK_COMPANY_DATA === 'true';

export async function GET(_req: Request, { params }: { params: { orgnr: string } }) {
  const parsed = orgnrSchema.safeParse(params.orgnr);
  if (!parsed.success) {
    return NextResponse.json(
      fail('VALIDATION_ERROR', 'Organisationsnummer ska vara 10 siffror utan bindestreck.'),
      { status: 400 },
    );
  }

  if (useMock) {
    const company = getMockCompany(parsed.data);
    if (!company) {
      return NextResponse.json(
        fail('NOT_FOUND', 'Företaget kunde inte hittas. Försök med organisationsnummer istället.'),
        { status: 404 },
      );
    }
    return NextResponse.json(ok(company));
  }

  // TODO(session 3): Implement Roaring /company proxy with 60-day Postgres cache.
  return NextResponse.json(
    fail('NOT_IMPLEMENTED', 'Företagsuppslag är inte aktiverat i denna miljö.'),
    { status: 501 },
  );
}
