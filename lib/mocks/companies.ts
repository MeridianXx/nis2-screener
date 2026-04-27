export type CompanyHit = {
  orgnr: string;
  name: string;
  city: string;
};

export type CompanyProfile = CompanyHit & {
  sniCode: string;
  sniLabel: string | null;
  employees: number | null;
  turnover: number | null; // MSEK
  balance: number | null; // MSEK
};

export const MOCK_COMPANIES: CompanyProfile[] = [
  {
    orgnr: '5560000123',
    name: 'Energi Norr AB',
    city: 'Luleå',
    sniCode: '35.13',
    sniLabel: 'Eldistribution',
    employees: 420,
    turnover: 2100,
    balance: 1080,
  },
  {
    orgnr: '5560000456',
    name: 'Vattenpartner Mälardalen AB',
    city: 'Västerås',
    sniCode: '36.00',
    sniLabel: 'Vattenförsörjning',
    employees: 80,
    turnover: 290,
    balance: 215,
  },
  {
    orgnr: '5560000789',
    name: 'Småbageriet Söder AB',
    city: 'Stockholm',
    sniCode: '10.71',
    sniLabel: 'Tillverkning av matbröd',
    employees: 12,
    turnover: 12,
    balance: 6,
  },
  {
    orgnr: '5560000999',
    name: 'Nordic Cloud Services AB',
    city: 'Göteborg',
    sniCode: '63.11',
    sniLabel: 'Databehandling, hosting',
    employees: 140,
    turnover: 520,
    balance: 350,
  },
];

export function searchMockCompanies(query: string, limit = 6): CompanyHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return MOCK_COMPANIES.filter(
    (c) => c.name.toLowerCase().includes(q) || c.orgnr.includes(q),
  )
    .slice(0, limit)
    .map(({ orgnr, name, city }) => ({ orgnr, name, city }));
}

export function getMockCompany(orgnr: string): CompanyProfile | null {
  return MOCK_COMPANIES.find((c) => c.orgnr === orgnr) ?? null;
}
