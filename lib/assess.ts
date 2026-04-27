export type AssessInput = {
  sectorKey: string | null;
  bilaga: 1 | 2 | null;
  employees: number | null;
  turnover: number | null; // MEUR
  balance: number | null; // MEUR
  specials: string[];
};

export type VerdictCode = 'VASENTLIG' | 'VIKTIG' | 'INDIREKT' | 'EJ_OMFATTAD';

export type SizeClass = 'large' | 'medium' | 'small' | 'unknown';

export type Verdict = {
  code: VerdictCode;
  title: string;
  summary: string;
  sector: string | null;
  size: string;
  tillsyn: string | null;
};

export const SPECIALS = {
  PUBLIC: 'offentlig-aktor',
  DNS_TRUST: 'dns-tillit',
  CER: 'cer',
  SOLE_PROVIDER: 'ensam-leverantor',
  SUPPLIER_TO: 'leverantor-till',
  ONLY_SECURITY_PROTECTION: 'endast-sakerhetsskydd',
} as const;

const SIZE_LABEL: Record<SizeClass, string> = {
  large: 'Stort företag',
  medium: 'Medelstort företag',
  small: 'Litet eller mikroföretag',
  unknown: 'Okänd storlek',
};

const SECTOR_TILLSYN: Record<string, string> = {
  energi: 'Energimyndigheten',
  transport: 'Transportstyrelsen',
  bank: 'Finansinspektionen',
  finans: 'Finansinspektionen',
  'halsa-vard': 'Inspektionen för vård och omsorg (IVO)',
  'halsa-tillv': 'Läkemedelsverket',
  dricksvatten: 'Livsmedelsverket',
  avloppsvatten: 'Naturvårdsverket',
  'digital-infra': 'Post- och telestyrelsen (PTS)',
  'digitala-lev': 'Post- och telestyrelsen (PTS)',
  ikt: 'Post- och telestyrelsen (PTS)',
  offentlig: 'Myndigheten för civilt försvar (MCF)',
  livsmedel: 'Livsmedelsverket',
  tillverkning: 'Myndigheten för civilt försvar (MCF)',
  avfall: 'Naturvårdsverket',
  post: 'Post- och telestyrelsen (PTS)',
  forskning: 'Myndigheten för civilt försvar (MCF)',
};

export function classifySize(input: Pick<AssessInput, 'employees' | 'turnover' | 'balance'>): SizeClass {
  const { employees, turnover, balance } = input;

  if (employees === null && turnover === null && balance === null) {
    return 'unknown';
  }

  const isLargeByHeadcount = employees !== null && employees >= 250;
  const isLargeByFinance = turnover !== null && balance !== null && turnover > 50 && balance > 43;
  if (isLargeByHeadcount || isLargeByFinance) {
    return 'large';
  }

  const isMediumByHeadcount = employees !== null && employees >= 50;
  const isMediumByFinance = turnover !== null && balance !== null && turnover > 10 && balance > 10;
  if (isMediumByHeadcount || isMediumByFinance) {
    return 'medium';
  }

  return 'small';
}

function tillsynFor(sectorKey: string | null): string | null {
  if (!sectorKey) return null;
  return SECTOR_TILLSYN[sectorKey] ?? null;
}

export function assess(input: AssessInput): Verdict {
  const specials = new Set(input.specials);
  const size = classifySize(input);
  const sizeLabel = SIZE_LABEL[size];
  const tillsyn = tillsynFor(input.sectorKey);

  // Explicit opt-out: only handled under säkerhetsskyddslagen.
  if (specials.has(SPECIALS.ONLY_SECURITY_PROTECTION)) {
    return {
      code: 'EJ_OMFATTAD',
      title: 'Verksamheten omfattas inte av cybersäkerhetslagen',
      summary:
        'Verksamhet som enbart bedrivs inom säkerhetsskyddslagens tillämpningsområde undantas från cybersäkerhetslagen.',
      sector: input.sectorKey,
      size: sizeLabel,
      tillsyn: null,
    };
  }

  // CER, public sector and DNS/trust services are väsentliga regardless of size.
  if (specials.has(SPECIALS.CER)) {
    return {
      code: 'VASENTLIG',
      title: 'Väsentlig verksamhetsutövare',
      summary:
        'Aktörer som omfattas av CER-direktivet (kritiska entiteter) klassificeras som väsentliga oavsett storlek.',
      sector: input.sectorKey,
      size: sizeLabel,
      tillsyn: tillsyn ?? 'Myndigheten för civilt försvar (MCF)',
    };
  }

  if (specials.has(SPECIALS.PUBLIC)) {
    return {
      code: 'VASENTLIG',
      title: 'Väsentlig verksamhetsutövare',
      summary:
        'Offentliga aktörer (kommuner, regioner, statliga myndigheter) klassificeras som väsentliga oavsett storlek.',
      sector: input.sectorKey ?? 'offentlig',
      size: sizeLabel,
      tillsyn: 'Myndigheten för civilt försvar (MCF)',
    };
  }

  if (specials.has(SPECIALS.DNS_TRUST)) {
    return {
      code: 'VASENTLIG',
      title: 'Väsentlig verksamhetsutövare',
      summary:
        'DNS-tjänster, toppdomänregister och kvalificerade tillhandahållare av betrodda tjänster är väsentliga oavsett storlek.',
      sector: input.sectorKey ?? 'digital-infra',
      size: sizeLabel,
      tillsyn: 'Post- och telestyrelsen (PTS)',
    };
  }

  // No sector match — possible indirect supplier role, otherwise out of scope.
  if (input.sectorKey === null || input.bilaga === null) {
    if (specials.has(SPECIALS.SUPPLIER_TO)) {
      return {
        code: 'INDIREKT',
        title: 'Indirekt påverkad som leverantör',
        summary:
          'Verksamheten ingår inte i någon NIS2-sektor men kan påverkas indirekt eftersom ni levererar till en omfattad verksamhetsutövare. Räkna med kontraktuella säkerhetskrav.',
        sector: null,
        size: sizeLabel,
        tillsyn: null,
      };
    }

    return {
      code: 'EJ_OMFATTAD',
      title: 'Verksamheten omfattas inte',
      summary:
        'Baserat på ert SNI-område och uppgifter omfattas verksamheten inte av cybersäkerhetslagen i nuläget.',
      sector: null,
      size: sizeLabel,
      tillsyn: null,
    };
  }

  // Sector match: classify by size and bilaga.
  if (input.bilaga === 1) {
    if (size === 'large') {
      return {
        code: 'VASENTLIG',
        title: 'Väsentlig verksamhetsutövare',
        summary:
          'Stort företag inom en bilaga 1-sektor klassas som väsentlig verksamhetsutövare med strängare krav på riskhantering, incidentrapportering och tillsyn.',
        sector: input.sectorKey,
        size: sizeLabel,
        tillsyn,
      };
    }

    if (size === 'medium') {
      return {
        code: 'VIKTIG',
        title: 'Viktig verksamhetsutövare',
        summary:
          'Medelstort företag inom en bilaga 1-sektor klassas som viktig verksamhetsutövare. Ni omfattas av samma kravkatalog som väsentliga, men med reaktiv snarare än proaktiv tillsyn.',
        sector: input.sectorKey,
        size: sizeLabel,
        tillsyn,
      };
    }
  }

  if (input.bilaga === 2) {
    if (size === 'large' || size === 'medium') {
      return {
        code: 'VIKTIG',
        title: 'Viktig verksamhetsutövare',
        summary:
          'Verksamhet inom bilaga 2-sektor (medelstort eller större) klassas som viktig verksamhetsutövare under cybersäkerhetslagen.',
        sector: input.sectorKey,
        size: sizeLabel,
        tillsyn,
      };
    }
  }

  // Small/micro inside a relevant sector — only indirect coverage if leverantör.
  if (specials.has(SPECIALS.SUPPLIER_TO) || specials.has(SPECIALS.SOLE_PROVIDER)) {
    return {
      code: 'INDIREKT',
      title: 'Indirekt påverkad som leverantör',
      summary:
        'Ni är för små för att omfattas direkt, men levererar till någon som omfattas. Räkna med att kontraktuella säkerhetskrav vidareförs i leveranskedjan.',
      sector: input.sectorKey,
      size: sizeLabel,
      tillsyn: null,
    };
  }

  return {
    code: 'EJ_OMFATTAD',
    title: 'Verksamheten omfattas inte',
    summary:
      'Verksamheten är för liten för att omfattas av cybersäkerhetslagen direkt. Kontrollera om ni har CER-status eller är ensam leverantör i sektorn.',
    sector: input.sectorKey,
    size: sizeLabel,
    tillsyn: null,
  };
}
