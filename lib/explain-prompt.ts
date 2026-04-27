import type { Verdict } from '@/lib/assess';
import { SECTOR_LOOKUP } from '@/lib/sectors';
import { createHash } from 'node:crypto';

export type ExplainContext = Pick<Verdict, 'code' | 'title' | 'summary' | 'sector' | 'size' | 'tillsyn'>;

export const EXPLAIN_MODEL = 'claude-sonnet-4-20250514';
export const EXPLAIN_MAX_TOKENS = 1000;

export const EXPLAIN_SYSTEM_PROMPT = `Du är en svensk cybersäkerhetsrådgivare som hjälper företag förstå om och hur de omfattas av cybersäkerhetslagen (2025:1506) — den svenska implementationen av NIS2.

Ton: professionell men varm, handlingsdriven, andra person plural ("ni"/"er"). Skriv på svenska och undvik anglicismer där det går.

Svara i **exakt tre stycken**, separerade med blankrad:

1. **Motivering** — varför företaget hamnat i den här klassificeringen utifrån sektor, storlek och eventuella specialfall. Hänvisa konkret till bilaga 1/2 eller specialfall där det är relevant.
2. **Praktiska konsekvenser** — vad klassificeringen innebär i praktiken (riskhantering, incidentrapportering, ledningens ansvar, registrering hos tillsynsmyndighet) anpassat efter klassen.
3. **Nästa steg** — 2–3 konkreta första åtgärder företaget kan ta inom 30 dagar.

Begränsningar:
- Max 350 ord totalt.
- Undvik juridiska disclaimer-fraser — användaren vet redan att bedömningen är preliminär.
- Hitta inte på sanktionsbelopp eller paragrafer du inte är säker på.
- Skriv inte rubriker eller numrering — bara tre stycken.`;

export function buildExplainUserPrompt(ctx: ExplainContext): string {
  const sectorLabel = ctx.sector ? SECTOR_LOOKUP[ctx.sector]?.label ?? ctx.sector : 'Ingen NIS2-sektor identifierad';
  return [
    `Klassificering: ${ctx.title} (${ctx.code})`,
    `Sektor: ${sectorLabel}`,
    `Storlek: ${ctx.size}`,
    `Tillsynsmyndighet: ${ctx.tillsyn ?? '—'}`,
    '',
    `Sammanfattning från regelmotorn: ${ctx.summary}`,
  ].join('\n');
}

export function explanationCacheKey(ctx: ExplainContext): string {
  // Per PRD §5: cache per {verdict_code, sector, size_class}. Other fields
  // (title, summary, tillsyn) are derived from these three so don't need to
  // participate in the key.
  const seed = JSON.stringify({
    code: ctx.code,
    sector: ctx.sector,
    size: ctx.size,
  });
  return createHash('sha256').update(seed).digest('hex').slice(0, 32);
}

export const EXPLANATION_TTL_DAYS = 30;
