import { SECTOR_LOOKUP } from '@/lib/sectors';
import type { AssessInput } from '@/lib/assess';
import { msekToMeur } from '@/lib/currency';

export type FormState = {
  sectorKey: string | null;
  employees: string;
  turnover: string;
  balance: string;
  specials: string[];
};

export const NONE_SECTOR = 'none';

export const INITIAL_FORM: FormState = {
  sectorKey: null,
  employees: '',
  turnover: '',
  balance: '',
  specials: [],
};

function parseNumber(raw: string): number | null {
  const trimmed = raw.trim().replace(',', '.');
  if (!trimmed) return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

export function isStepComplete(form: FormState, step: 1 | 2 | 3): boolean {
  if (step === 1) return form.sectorKey !== null;
  if (step === 2) {
    const fields = [form.employees, form.turnover, form.balance];
    return fields.some((v) => parseNumber(v) !== null);
  }
  return true;
}

export function toAssessInput(form: FormState): AssessInput {
  const sector = form.sectorKey && form.sectorKey !== NONE_SECTOR
    ? SECTOR_LOOKUP[form.sectorKey] ?? null
    : null;

  // The form collects financials in MSEK for the Swedish audience;
  // the rule engine works in MEUR per EU's SME definition.
  const turnoverMsek = parseNumber(form.turnover);
  const balanceMsek = parseNumber(form.balance);

  return {
    sectorKey: sector ? sector.key : null,
    bilaga: sector ? sector.bilaga : null,
    employees: parseNumber(form.employees),
    turnover: turnoverMsek === null ? null : msekToMeur(turnoverMsek),
    balance: balanceMsek === null ? null : msekToMeur(balanceMsek),
    specials: form.specials,
  };
}

export function encodeFormToParams(form: FormState, orgnr?: string | null): URLSearchParams {
  const params = new URLSearchParams();
  if (form.sectorKey) params.set('sector', form.sectorKey);
  if (form.employees) params.set('employees', form.employees);
  if (form.turnover) params.set('turnover', form.turnover);
  if (form.balance) params.set('balance', form.balance);
  if (form.specials.length) params.set('specials', form.specials.join(','));
  if (orgnr) params.set('orgnr', orgnr);
  return params;
}

export function decodeFormFromParams(params: URLSearchParams): FormState {
  const specials = params.get('specials');
  return {
    sectorKey: params.get('sector'),
    employees: params.get('employees') ?? '',
    turnover: params.get('turnover') ?? '',
    balance: params.get('balance') ?? '',
    specials: specials ? specials.split(',').filter(Boolean) : [],
  };
}
