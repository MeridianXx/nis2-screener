export type SectorDef = {
  key: string;
  label: string;
  bilaga: 1 | 2;
  examples?: string;
};

// 11 + 7 = 18 sectors per NIS2 bilaga 1 + bilaga 2 (cybersäkerhetslagen 2025:1506).
export const SECTORS: SectorDef[] = [
  // Bilaga 1 — väsentliga
  { key: 'energi', label: 'Energi', bilaga: 1, examples: 'el, gas, fjärrvärme, oljeprodukter' },
  { key: 'transport', label: 'Transporter', bilaga: 1, examples: 'väg, järnväg, sjö, luft' },
  { key: 'bank', label: 'Bankverksamhet', bilaga: 1 },
  { key: 'finans', label: 'Finansmarknadsinfrastruktur', bilaga: 1, examples: 'börser, central motpart' },
  { key: 'halsa-vard', label: 'Hälso- och sjukvård', bilaga: 1, examples: 'vårdgivare, lab, EU-referenscenter' },
  { key: 'dricksvatten', label: 'Dricksvatten', bilaga: 1 },
  { key: 'avloppsvatten', label: 'Avloppsvatten', bilaga: 1 },
  { key: 'digital-infra', label: 'Digital infrastruktur', bilaga: 1, examples: 'IXP, DNS, TLD, datacenter, moln, CDN, telekom, betrodda tjänster' },
  { key: 'ikt', label: 'IKT-tjänsteförvaltning (B2B)', bilaga: 1, examples: 'managed services, managed security' },
  { key: 'offentlig', label: 'Offentlig förvaltning', bilaga: 1, examples: 'statliga och regionala myndigheter, kommuner' },
  { key: 'rymden', label: 'Rymden', bilaga: 1, examples: 'markbaserad infrastruktur för rymdtjänster' },

  // Bilaga 2 — viktiga
  { key: 'post', label: 'Post- och budtjänster', bilaga: 2 },
  { key: 'avfall', label: 'Avfallshantering', bilaga: 2 },
  { key: 'kemikalier', label: 'Kemikalietillverkning och -hantering', bilaga: 2 },
  { key: 'livsmedel', label: 'Livsmedelsproduktion, distribution och partihandel', bilaga: 2 },
  { key: 'tillverkning', label: 'Tillverkning', bilaga: 2, examples: 'medicintekniska produkter, datorer, fordon, maskiner' },
  { key: 'digitala-lev', label: 'Digitala leverantörer', bilaga: 2, examples: 'marknadsplatser, sökmotorer, sociala plattformar' },
  { key: 'forskning', label: 'Forskning', bilaga: 2 },
];

export const SECTOR_LOOKUP: Record<string, SectorDef> = Object.fromEntries(
  SECTORS.map((s) => [s.key, s]),
);

export function sectorsByBilaga(bilaga: 1 | 2): SectorDef[] {
  return SECTORS.filter((s) => s.bilaga === bilaga);
}
