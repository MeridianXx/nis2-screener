# NIS2 Screener

Ett screeningverktyg för att preliminärt bedöma om ett företag omfattas av svenska cybersäkerhetslagen (2025:1506) som implementerar NIS2-direktivet i svensk rätt.

**Kort version:** Sök på ett företag eller fyll i uppgifter manuellt. Få en bedömning: väsentlig, viktig, indirekt eller ej berörd. Med motivering genererad av Claude API.

Byggs av Tech Stn för intern kvalificering av kunder och prospects, samt som lead magnet för side hustle-verksamhet.

## Status

🚧 Under utveckling · v1 under byggande enligt `docs/PRD.md`

**Session 1 klar (april 2026):**
- Next.js 14 App Router scaffold (TypeScript strict, Tailwind v4, ESLint + Prettier, Jest + ts-jest)
- Brand tokens (`app/globals.css`) och Google Fonts laddade via `next/font`
- Regelmotor `lib/assess.ts` (ren funktion) med 21 enhetstester gröna
- SNI-mappningsmodul `lib/sni-mapping.ts` med exakt + prefix-lookup
- API-stubbar: `/api/assess` (live), `/api/explain` (501, kopplas i session 2),
  `/api/company/search` och `/api/company/[orgnr]` (mockdata bakom
  `NEXT_PUBLIC_USE_MOCK_COMPANY_DATA=true`, Roaring kopplas i session 3)
- Minimal landing på `/` med sköld-logga och två CTA

## Teknisk stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS v4
- Prisma + Postgres (Vercel Postgres / Neon)
- Claude API för fördjupad analys
- Roaring API för företagsuppslag (v1.1)
- Vercel för hosting

## Kom igång

```bash
pnpm install
cp .env.example .env.local
# Fyll i ANTHROPIC_API_KEY och DATABASE_URL
pnpm prisma migrate dev
pnpm dev
```

## Viktigt för utvecklare

Läs `CLAUDE.md` innan första commit — den innehåller projektets konventioner. `docs/PRD.md` beskriver produktkraven och ska uppdateras när beslut ändras.

## Disclaimers

Verktyget ger **preliminära bedömningar**, inte juridisk rådgivning. Företag ansvarar själva för att bedöma omfattning och anmäla sig till Myndigheten för civilt försvar enligt MCFFS 2026:1.
