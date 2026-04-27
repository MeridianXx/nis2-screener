import rawMapping from '@/data/sni-mapping.json';

export type DisambiguationOption = {
  label: string;
  maps: { sector: string | null; bilaga: 1 | 2 | null };
};

export type Disambiguation = {
  question: string;
  options: DisambiguationOption[];
};

export type SNIMapping = {
  code: string;
  sector: string | null;
  bilaga: 1 | 2 | null;
  confidence: 'high' | 'medium' | 'low';
  label: string;
  prefix?: boolean;
  note?: string;
  disambiguation?: Disambiguation;
};

type RawEntry = Omit<SNIMapping, 'code'>;
type RawData = {
  $schema?: string;
  $notes?: string;
  mappings: Record<string, RawEntry>;
};

const data = rawMapping as RawData;

function toMapping(code: string, entry: RawEntry): SNIMapping {
  return { code, ...entry };
}

export function lookupSNI(code: string): SNIMapping | null {
  if (!code) return null;
  const trimmed = code.trim();

  const exact = data.mappings[trimmed];
  if (exact) return toMapping(trimmed, exact);

  // Prefix match — look up "10.51" → try "10.51", "10.5", "10.", "10".
  // The mapping file uses keys like "10" and "20." for prefixes, so try both forms.
  const candidates = new Set<string>();
  for (let i = trimmed.length - 1; i > 0; i--) {
    const slice = trimmed.slice(0, i);
    candidates.add(slice);
    if (!slice.endsWith('.')) candidates.add(`${slice}.`);
  }

  for (const candidate of candidates) {
    const entry = data.mappings[candidate];
    if (entry?.prefix) return toMapping(candidate, entry);
  }

  return null;
}

export function listMappings(): SNIMapping[] {
  return Object.entries(data.mappings).map(([code, entry]) => toMapping(code, entry));
}
