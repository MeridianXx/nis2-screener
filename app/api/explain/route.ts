import { NextResponse } from 'next/server';
import { z } from 'zod';
import { fail, ok } from '@/lib/api-response';
import {
  MissingAnthropicKeyError,
  generateExplanation,
} from '@/lib/anthropic';
import { explanationCacheKey, type ExplainContext } from '@/lib/explain-prompt';
import { getExplanationCache, setExplanationCache } from '@/lib/cache';

const inputSchema = z.object({
  verdict: z.enum(['VASENTLIG', 'VIKTIG', 'INDIREKT', 'EJ_OMFATTAD']),
  title: z.string().min(1),
  summary: z.string().min(1),
  sector: z.string().nullable(),
  size: z.string().min(1),
  tillsyn: z.string().nullable(),
});

export const runtime = 'nodejs';

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
      fail('VALIDATION_ERROR', 'Indata till AI-fördjupningen kunde inte valideras.'),
      { status: 400 },
    );
  }

  const ctx: ExplainContext = {
    code: parsed.data.verdict,
    title: parsed.data.title,
    summary: parsed.data.summary,
    sector: parsed.data.sector,
    size: parsed.data.size,
    tillsyn: parsed.data.tillsyn,
  };

  const cacheKey = explanationCacheKey(ctx);
  const cached = await getExplanationCache(cacheKey);
  if (cached) return NextResponse.json(ok({ text: cached, source: 'cache' as const }));

  try {
    const text = await generateExplanation(ctx);
    await setExplanationCache(cacheKey, text);
    return NextResponse.json(ok({ text, source: 'live' as const }));
  } catch (err) {
    if (err instanceof MissingAnthropicKeyError) {
      return NextResponse.json(
        fail('NOT_CONFIGURED', 'AI-fördjupning är inte konfigurerad i denna miljö.'),
        { status: 503 },
      );
    }
    console.error('[explain] generation failed:', err);
    return NextResponse.json(
      fail('UPSTREAM_ERROR', 'AI-fördjupningen kunde inte hämtas. Försök igen om en stund.'),
      { status: 502 },
    );
  }
}
