import { lookupSNI } from '@/lib/sni-mapping';

describe('lookupSNI', () => {
  test('exakt kod-träff', () => {
    const result = lookupSNI('35.13');
    expect(result?.sector).toBe('energi');
    expect(result?.bilaga).toBe(1);
    expect(result?.confidence).toBe('high');
  });

  test('prefix-träff (10.51 → 10)', () => {
    const result = lookupSNI('10.51');
    expect(result?.sector).toBe('livsmedel');
    expect(result?.bilaga).toBe(2);
    expect(result?.code).toBe('10');
  });

  test('prefix-träff med punkt-suffix (28.41 → 28.)', () => {
    const result = lookupSNI('28.41');
    expect(result?.sector).toBe('tillverkning');
    expect(result?.code).toBe('28.');
  });

  test('exakt har företräde över prefix', () => {
    const result = lookupSNI('26.20');
    expect(result?.code).toBe('26.20');
    expect(result?.label).toBe('Tillverkning av datorer och kringutrustning');
  });

  test('ingen träff returnerar null', () => {
    expect(lookupSNI('99.99')).toBeNull();
  });

  test('tom sträng returnerar null', () => {
    expect(lookupSNI('')).toBeNull();
  });
});
