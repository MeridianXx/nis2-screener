import { assess, classifySize, SPECIALS, type AssessInput } from '@/lib/assess';

const baseInput: AssessInput = {
  sectorKey: null,
  bilaga: null,
  employees: null,
  turnover: null,
  balance: null,
  specials: [],
};

const withInput = (overrides: Partial<AssessInput>): AssessInput => ({
  ...baseInput,
  ...overrides,
});

describe('assess — main classification rules', () => {
  test('Stort bilaga 1 → VASENTLIG', () => {
    const v = assess(
      withInput({ sectorKey: 'energi', bilaga: 1, employees: 400, turnover: 80, balance: 60 }),
    );
    expect(v.code).toBe('VASENTLIG');
    expect(v.tillsyn).toBe('Energimyndigheten');
  });

  test('Medelstort bilaga 1 → VIKTIG', () => {
    const v = assess(
      withInput({ sectorKey: 'transport', bilaga: 1, employees: 120, turnover: 30, balance: 20 }),
    );
    expect(v.code).toBe('VIKTIG');
  });

  test('Medelstort bilaga 2 → VIKTIG', () => {
    const v = assess(
      withInput({ sectorKey: 'tillverkning', bilaga: 2, employees: 80, turnover: 20, balance: 12 }),
    );
    expect(v.code).toBe('VIKTIG');
  });

  test('Stort bilaga 2 → VIKTIG', () => {
    const v = assess(
      withInput({ sectorKey: 'tillverkning', bilaga: 2, employees: 600, turnover: 120, balance: 80 }),
    );
    expect(v.code).toBe('VIKTIG');
  });

  test('Litet bilaga 1 → EJ_OMFATTAD', () => {
    const v = assess(
      withInput({ sectorKey: 'energi', bilaga: 1, employees: 10, turnover: 2, balance: 1 }),
    );
    expect(v.code).toBe('EJ_OMFATTAD');
  });

  test('Litet bilaga 1 + leverantor-till → INDIREKT', () => {
    const v = assess(
      withInput({
        sectorKey: 'energi',
        bilaga: 1,
        employees: 10,
        turnover: 2,
        balance: 1,
        specials: [SPECIALS.SUPPLIER_TO],
      }),
    );
    expect(v.code).toBe('INDIREKT');
  });

  test('Utanför sektor → EJ_OMFATTAD', () => {
    const v = assess(withInput({ employees: 500, turnover: 100, balance: 80 }));
    expect(v.code).toBe('EJ_OMFATTAD');
  });

  test('Utanför sektor + leverantor-till → INDIREKT', () => {
    const v = assess(
      withInput({
        employees: 500,
        turnover: 100,
        balance: 80,
        specials: [SPECIALS.SUPPLIER_TO],
      }),
    );
    expect(v.code).toBe('INDIREKT');
  });
});

describe('assess — special cases override size', () => {
  test('CER-special → VASENTLIG oavsett storlek', () => {
    const v = assess(withInput({ employees: 5, specials: [SPECIALS.CER] }));
    expect(v.code).toBe('VASENTLIG');
  });

  test('Offentlig aktör → VASENTLIG oavsett storlek', () => {
    const v = assess(
      withInput({ sectorKey: 'offentlig', bilaga: 1, employees: 8, specials: [SPECIALS.PUBLIC] }),
    );
    expect(v.code).toBe('VASENTLIG');
    expect(v.tillsyn).toBe('Myndigheten för civilt försvar (MCF)');
  });

  test('DNS/tillit → VASENTLIG oavsett storlek', () => {
    const v = assess(withInput({ employees: 12, specials: [SPECIALS.DNS_TRUST] }));
    expect(v.code).toBe('VASENTLIG');
    expect(v.tillsyn).toBe('Post- och telestyrelsen (PTS)');
  });

  test('endast-sakerhetsskydd → EJ_OMFATTAD trots stort bilaga 1', () => {
    const v = assess(
      withInput({
        sectorKey: 'energi',
        bilaga: 1,
        employees: 800,
        turnover: 200,
        balance: 100,
        specials: [SPECIALS.ONLY_SECURITY_PROTECTION],
      }),
    );
    expect(v.code).toBe('EJ_OMFATTAD');
  });
});

describe('classifySize — EU SME thresholds', () => {
  test('exakt 50 anställda räknas som medium', () => {
    expect(classifySize({ employees: 50, turnover: 0, balance: 0 })).toBe('medium');
  });

  test('exakt 250 anställda räknas som large', () => {
    expect(classifySize({ employees: 250, turnover: 0, balance: 0 })).toBe('large');
  });

  test('exakt 10 MEUR turnover OCH 10 MEUR balance räknas INTE som medium (kräver >10)', () => {
    expect(classifySize({ employees: 20, turnover: 10, balance: 10 })).toBe('small');
  });

  test('turnover > 10 men balance <= 10 räknas INTE som medium', () => {
    expect(classifySize({ employees: 20, turnover: 30, balance: 5 })).toBe('small');
  });

  test('turnover > 50 men balance <= 43 räknas INTE som large', () => {
    expect(classifySize({ employees: 100, turnover: 80, balance: 20 })).toBe('medium');
  });

  test('alla värden null → unknown', () => {
    expect(classifySize({ employees: null, turnover: null, balance: null })).toBe('unknown');
  });
});

describe('assess — verdict shape', () => {
  test('returnerar size-label på svenska', () => {
    const v = assess(
      withInput({ sectorKey: 'energi', bilaga: 1, employees: 400, turnover: 80, balance: 60 }),
    );
    expect(v.size).toBe('Stort företag');
  });

  test('ensam leverantör i sektor utan storlek → INDIREKT', () => {
    const v = assess(
      withInput({
        sectorKey: 'transport',
        bilaga: 1,
        employees: 5,
        turnover: 1,
        balance: 1,
        specials: [SPECIALS.SOLE_PROVIDER],
      }),
    );
    expect(v.code).toBe('INDIREKT');
  });

  test('CER prioriteras före endast-sakerhetsskydd? Nej — säkerhetsskydd vinner', () => {
    const v = assess(
      withInput({
        sectorKey: 'energi',
        bilaga: 1,
        employees: 800,
        specials: [SPECIALS.ONLY_SECURITY_PROTECTION, SPECIALS.CER],
      }),
    );
    expect(v.code).toBe('EJ_OMFATTAD');
  });
});
