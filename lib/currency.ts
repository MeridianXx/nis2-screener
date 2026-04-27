// EU's SME definition is fixed in euros, so the rule engine in lib/assess.ts
// always works in MEUR (PRD §4.3 contract). The Swedish UI accepts MSEK and
// converts here. Update this constant when the official guidance shifts.
//
// Source: Riksbanken dagskurs EUR/SEK ~11,50 (april 2026). Picking a slightly
// conservative round figure means companies just over the SEK threshold are
// flagged rather than missed — the screener is meant to over-include borderline
// cases since users can always rule themselves out manually.
export const EUR_SEK_RATE = 11.5;

export function msekToMeur(msek: number): number {
  return msek / EUR_SEK_RATE;
}

export function meurToMsek(meur: number): number {
  return meur * EUR_SEK_RATE;
}
