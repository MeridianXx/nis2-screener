import {
  buildExplainUserPrompt,
  explanationCacheKey,
  EXPLAIN_MODEL,
  EXPLAIN_MAX_TOKENS,
} from '@/lib/explain-prompt';
import type { Verdict } from '@/lib/assess';

const baseCtx: Pick<Verdict, 'code' | 'title' | 'summary' | 'sector' | 'size' | 'tillsyn'> = {
  code: 'VASENTLIG',
  title: 'Väsentlig verksamhetsutövare',
  summary: 'Stort företag inom bilaga 1.',
  sector: 'energi',
  size: 'Stort företag',
  tillsyn: 'Energimyndigheten',
};

describe('buildExplainUserPrompt', () => {
  test('includes verdict code and translated sector label', () => {
    const prompt = buildExplainUserPrompt(baseCtx);
    expect(prompt).toContain('VASENTLIG');
    expect(prompt).toContain('Energi');
    expect(prompt).toContain('Stort företag');
    expect(prompt).toContain('Energimyndigheten');
  });

  test('falls back gracefully when sector is null', () => {
    const prompt = buildExplainUserPrompt({ ...baseCtx, sector: null });
    expect(prompt).toContain('Ingen NIS2-sektor identifierad');
  });

  test('shows em dash when tillsyn is missing', () => {
    const prompt = buildExplainUserPrompt({ ...baseCtx, tillsyn: null });
    expect(prompt).toContain('Tillsynsmyndighet: —');
  });
});

describe('explanationCacheKey', () => {
  test('is deterministic for the same verdict/sector/size', () => {
    expect(explanationCacheKey(baseCtx)).toEqual(explanationCacheKey(baseCtx));
  });

  test('changes when verdict code changes', () => {
    const a = explanationCacheKey(baseCtx);
    const b = explanationCacheKey({ ...baseCtx, code: 'VIKTIG' });
    expect(a).not.toEqual(b);
  });

  test('ignores fields outside the documented key (title, summary, tillsyn)', () => {
    const a = explanationCacheKey(baseCtx);
    const b = explanationCacheKey({
      ...baseCtx,
      title: 'Annan titel',
      summary: 'Annan sammanfattning',
      tillsyn: 'Annan myndighet',
    });
    expect(a).toEqual(b);
  });

  test('returns a 32-char hex string', () => {
    expect(explanationCacheKey(baseCtx)).toMatch(/^[0-9a-f]{32}$/);
  });
});

describe('explain prompt constants', () => {
  test('uses claude-sonnet-4 model per PRD §4.4', () => {
    expect(EXPLAIN_MODEL).toBe('claude-sonnet-4-20250514');
  });

  test('caps response length at 1000 tokens', () => {
    expect(EXPLAIN_MAX_TOKENS).toBe(1000);
  });
});
