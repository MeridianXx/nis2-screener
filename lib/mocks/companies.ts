export type CompanyHit = {
  orgnr: string;
  name: string;
  city: string;
};

export type CompanyProfile = CompanyHit & {
  sniCode: string;
  sniLabel: string | null;
  employees: number | null;
  turnover: number | null; // MEUR
  balance: number | null; // MEUR
};

export const MOCK_COMPANIES: CompanyProfile[] = [
  {
    orgnr: '5560000123',
    name: 'Energi Norr AB',
    city: 'Luleå',
    sniCode: '35.13',
    sniLabel: 'Eldistribution',
    employees: 420,
    turnover: 180,
    balance: 90,
  },
  {
    orgnr: '5560000456',
    name: 'Vattenpartner Mälardalen AB',
    city: 'Västerås',
    sniCode: '36.00',
    sniLabel: 'Vattenförsörjning',
    employees: 80,
    turnover: 25,
    balance: 18,
  },
  {
    orgnr: '5560000789',
    name: 'Småbageriet Söder AB',
    city: 'Stockholm',
    sniCode: '10.71',
    sniLabel: 'Tillverkning av matbröd',
    employees: 12,
    turnover: 1,
    balance: 0.5,
  },
  {
    orgnr: '5560000999',
    name: 'Nordic Cloud Services AB',
    city: 'Göteborg',
    sniCode: '63.11',
    sniLabel: 'Databehandling, hosting',
    employees: 140,
    turnover: 45,
    balance: 30,
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
