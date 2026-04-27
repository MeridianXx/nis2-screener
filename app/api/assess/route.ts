import { NextResponse } from 'next/server';
import { z } from 'zod';
import { assess } from '@/lib/assess';
import { fail, ok } from '@/lib/api-response';

const inputSchema = z.object({
  sectorKey: z.string().nullable(),
  bilaga: z.union([z.literal(1), z.literal(2), z.null()]),
  employees: z.number().int().nonnegative().nullable(),
  turnover: z.number().nonnegative().nullable(),
  balance: z.number().nonnegative().nullable(),
  specials: z.array(z.string()),
});

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json(fail('INVALID_JSON', 'Ogiltig JSON i förfrågan.'), { status: 400 });
  }

  const parsed = inputSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      fail('VALIDATION_ERROR', 'Indata kunde inte valideras. Kontrollera fälten och försök igen.'),
      { status: 400 },
    );
  }

  const verdict = assess(parsed.data);
  return NextResponse.json(ok(verdict));
}
