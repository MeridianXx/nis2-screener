# NIS2 Screener

Ett screeningverktyg för att preliminärt bedöma om ett företag omfattas av svenska cybersäkerhetslagen (2025:1506) som implementerar NIS2-direktivet i svensk rätt.

**Kort version:** Sök på ett företag eller fyll i uppgifter manuellt. Få en bedömning: väsentlig, viktig, indirekt eller ej berörd. Med motivering genererad av Claude API.

Byggs av Tech Stn för intern kvalificering av kunder och prospects, samt som lead magnet för side hustle-verksamhet.

## Status

🚧 Under utveckling · v1 under byggande enligt `docs/PRD.md`

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
