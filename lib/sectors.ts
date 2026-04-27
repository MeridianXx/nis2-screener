export type SectorDef = {
  key: string;
  label: string;
  bilaga: 1 | 2;
  examples?: string;
};

// 11 + 7 = 18 sectors per NIS2 bilaga 1 + bilaga 2 (cybersäkerhetslagen
// 2025:1506). Every entry has a one-line example so the picker grid lays
// out evenly. Long official names are abbreviated in the label and the
// expansion lives in the example to keep card heights uniform.
export const SECTORS: SectorDef[] = [
  // Bilaga 1 — väsentliga
  { key: 'energi', label: 'Energi', bilaga: 1, examples: 'el, gas, fjärrvärme, oljeprodukter' },
  { key: 'transport', label: 'Transporter', bilaga: 1, examples: 'väg, järnväg, sjö, luft' },
  { key: 'bank', label: 'Bankverksamhet', bilaga: 1, examples: 'kreditinstitut, kortbetalningar' },
  { key: 'finans', label: 'Finansmarknadsinfrastruktur', bilaga: 1, examples: 'börser, central motpart, värdepapper' },
  { key: 'halsa-vard', label: 'Hälso- och sjukvård', bilaga: 1, examples: 'vårdgivare, lab, EU-referenscenter' },
  { key: 'dricksvatten', label: 'Dricksvatten', bilaga: 1, examples: 'kommunala vattenverk, distributörer' },
  { key: 'avloppsvatten', label: 'Avloppsvatten', bilaga: 1, examples: 'reningsverk, ledningsnät' },
  { key: 'digital-infra', label: 'Digital infrastruktur', bilaga: 1, examples: 'datacenter, moln, CDN, DNS, telekom' },
  { key: 'ikt', label: 'IKT-tjänsteförvaltning (B2B)', bilaga: 1, examples: 'managed services, managed security' },
  { key: 'offentlig', label: 'Offentlig förvaltning', bilaga: 1, examples: 'myndigheter, regioner, kommuner' },
  { key: 'rymden', label: 'Rymden', bilaga: 1, examples: 'markbaserad infrastruktur för rymdtjänster' },

  // Bilaga 2 — viktiga
  { key: 'post', label: 'Post- och budtjänster', bilaga: 2, examples: 'brev, paket, bud' },
  { key: 'avfall', label: 'Avfallshantering', bilaga: 2, examples: 'insamling, återvinning, deponi' },
  { key: 'kemikalier', label: 'Kemikalier', bilaga: 2, examples: 'tillverkning och hantering' },
  { key: 'livsmedel', label: 'Livsmedel', bilaga: 2, examples: 'produktion, distribution, partihandel' },
  { key: 'tillverkning', label: 'Tillverkning', bilaga: 2, examples: 'medicintekniska produkter, datorer, fordon, maskiner' },
  { key: 'digitala-lev', label: 'Digitala leverantörer', bilaga: 2, examples: 'marknadsplatser, sökmotorer, sociala plattformar' },
  { key: 'forskning', label: 'Forskning', bilaga: 2, examples: 'forskningsorganisationer (ej universitet)' },
];

export const SECTOR_LOOKUP: Record<string, SectorDef> = Object.fromEntries(
  SECTORS.map((s) => [s.key, s]),
);

export function sectorsByBilaga(bilaga: 1 | 2): SectorDef[] {
  return SECTORS.filter((s) => s.bilaga === bilaga);
}
