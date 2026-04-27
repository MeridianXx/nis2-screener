import { NextResponse } from 'next/server';
import { fail } from '@/lib/api-response';

// TODO(session 2): Implement Anthropic integration.
// - Read ANTHROPIC_API_KEY from env (server-side only).
// - Accept { verdict, sector, sizeClass, companyName? } as input, validated with zod.
// - Call claude-sonnet-4-20250514 with a Swedish system prompt that produces
//   a 3-paragraph explanation: motivering, praktiska konsekvenser, nästa steg.
// - Cache result in ExplanationCache (Postgres) keyed by hash of verdict+sector+size.
// - Return { data: { text }, error: null } per ApiResponse<T>.
export async function POST() {
  return NextResponse.json(
    fail('NOT_IMPLEMENTED', 'AI-fördjupning kopplas in i nästa session.'),
    { status: 501 },
  );
}
