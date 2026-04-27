import type { VerdictCode } from '@/lib/assess';

export type VerdictStyle = {
  tone: 'critical' | 'medium' | 'calm';
  heroBg: string;
  heroText: string;
  heroBorder: string;
  eyebrow: string;
  eyebrowAccent: string;
  badgeLabel: string;
};

// Tone is derived from docs/brand.md: dark deep hero for "kritisk åtgärd krävs"
// (Väsentlig/Viktig), medium slate for indirect impact, light surface for
// "inget direkt att göra". Lime accent on the eyebrow per limeprinciper.
export const VERDICT_STYLES: Record<VerdictCode, VerdictStyle> = {
  VASENTLIG: {
    tone: 'critical',
    heroBg: 'bg-deep',
    heroText: 'text-surface',
    heroBorder: 'border-deep',
    eyebrow: 'Bedömning · Väsentlig',
    eyebrowAccent: 'text-lime',
    badgeLabel: 'Väsentlig verksamhetsutövare',
  },
  VIKTIG: {
    tone: 'critical',
    heroBg: 'bg-deep',
    heroText: 'text-surface',
    heroBorder: 'border-deep',
    eyebrow: 'Bedömning · Viktig',
    eyebrowAccent: 'text-lime',
    badgeLabel: 'Viktig verksamhetsutövare',
  },
  INDIREKT: {
    tone: 'medium',
    heroBg: 'bg-slate',
    heroText: 'text-surface',
    heroBorder: 'border-slate',
    eyebrow: 'Bedömning · Indirekt påverkad',
    eyebrowAccent: 'text-lime',
    badgeLabel: 'Indirekt påverkad',
  },
  EJ_OMFATTAD: {
    tone: 'calm',
    heroBg: 'bg-white',
    heroText: 'text-ink',
    heroBorder: 'border-border',
    eyebrow: 'Bedömning · Ej omfattad',
    eyebrowAccent: 'text-mid',
    badgeLabel: 'Ej omfattad',
  },
};
