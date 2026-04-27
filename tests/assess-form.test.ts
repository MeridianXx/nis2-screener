import {
  decodeFormFromParams,
  encodeFormToParams,
  INITIAL_FORM,
  isStepComplete,
  NONE_SECTOR,
  toAssessInput,
} from '@/lib/assess-form';

describe('isStepComplete', () => {
  test('step 1 requires a sector', () => {
    expect(isStepComplete(INITIAL_FORM, 1)).toBe(false);
    expect(isStepComplete({ ...INITIAL_FORM, sectorKey: 'energi' }, 1)).toBe(true);
    expect(isStepComplete({ ...INITIAL_FORM, sectorKey: NONE_SECTOR }, 1)).toBe(true);
  });

  test('step 2 requires at least one numeric size value', () => {
    expect(isStepComplete(INITIAL_FORM, 2)).toBe(false);
    expect(isStepComplete({ ...INITIAL_FORM, employees: '120' }, 2)).toBe(true);
    expect(isStepComplete({ ...INITIAL_FORM, turnover: '12,5' }, 2)).toBe(true);
  });

  test('step 2 ignores whitespace and rejects negatives', () => {
    expect(isStepComplete({ ...INITIAL_FORM, employees: '  ' }, 2)).toBe(false);
    expect(isStepComplete({ ...INITIAL_FORM, balance: '-5' }, 2)).toBe(false);
  });

  test('step 3 is always considered complete', () => {
    expect(isStepComplete(INITIAL_FORM, 3)).toBe(true);
  });
});

describe('toAssessInput', () => {
  test('drops sector and bilaga when "ingen av dessa" is selected', () => {
    const input = toAssessInput({
      sectorKey: NONE_SECTOR,
      employees: '500',
      turnover: '100',
      balance: '60',
      specials: ['cer'],
    });
    expect(input.sectorKey).toBeNull();
    expect(input.bilaga).toBeNull();
    expect(input.specials).toEqual(['cer']);
  });

  test('resolves bilaga from sector key', () => {
    const input = toAssessInput({ ...INITIAL_FORM, sectorKey: 'tillverkning', employees: '120' });
    expect(input.sectorKey).toBe('tillverkning');
    expect(input.bilaga).toBe(2);
    expect(input.employees).toBe(120);
  });

  test('parses Swedish decimal commas as dots', () => {
    const input = toAssessInput({ ...INITIAL_FORM, sectorKey: 'energi', turnover: '12,5' });
    expect(input.turnover).toBe(12.5);
  });
});

describe('encode/decode form params', () => {
  test('round-trips a fully filled form', () => {
    const original = {
      sectorKey: 'energi',
      employees: '400',
      turnover: '80',
      balance: '60',
      specials: ['cer', 'leverantor-till'],
    };
    const params = encodeFormToParams(original);
    const decoded = decodeFormFromParams(new URLSearchParams(params.toString()));
    expect(decoded).toEqual(original);
  });

  test('decode handles missing keys with sensible defaults', () => {
    const decoded = decodeFormFromParams(new URLSearchParams(''));
    expect(decoded.sectorKey).toBeNull();
    expect(decoded.specials).toEqual([]);
    expect(decoded.employees).toBe('');
  });
});
