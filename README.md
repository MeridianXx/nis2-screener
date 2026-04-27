# NIS2 Screener

Ett screeningverktyg för att preliminärt bedöma om ett företag omfattas av svenska cybersäkerhetslagen (2025:1506) som implementerar NIS2-direktivet i svensk rätt.

**Kort version:** Sök på ett företag eller fyll i uppgifter manuellt. Få en bedömning: väsentlig, viktig, indirekt eller ej berörd. Med motivering genererad av Claude API.

Byggs av Tech Stn för intern kvalificering av kunder och prospects, samt som lead magnet för side hustle-verksamhet.

## Status

🚧 Under utveckling · v1 under byggande enligt `docs/PRD.md`

**Session 1 klar (april 2026):**
- Next.js 14 App Router scaffold (TypeScript strict, Tailwind v4, ESLint + Prettier, Jest + ts-jest)
- Brand tokens (`app/globals.css`) och Google Fonts laddade via `next/font`
- Regelmotor `lib/assess.ts` (ren funktion) med enhetstester
- SNI-mappningsmodul `lib/sni-mapping.ts` med exakt + prefix-lookup
- API-stubbar: `/api/assess` (live), `/api/company/search` och `/api/company/[orgnr]` (mockdata bakom `NEXT_PUBLIC_USE_MOCK_COMPANY_DATA=true`)
- Minimal landing på `/` med sköld-logga och två CTA

**Session 2 klar (april 2026):**
- Manuellt 3-stegsflöde på `/assess` (sektor → storlek → särskilda förhållanden) med URL-synkad navigation så browser-back fungerar
- Resultatvy på `/assess/result` med verdict-hero (VERDICT_STYLES per `docs/brand.md`), faktagrid och officiella resurser
- AI-fördjupning via `/api/explain` (Anthropic `claude-sonnet-4-20250514`, max 1000 tokens, svensk 3-styckesprompt) med skeleton loader och fallback om API-nyckel saknas
- Postgres-baserad `ExplanationCache` (30 dagars TTL) via Prisma — degraderar mjukt till "ingen cache" om databasen inte är konfigurerad
- 45 enhetstester gröna (regelmotor, SNI-mapping, formulärhjälpare, prompt + cache-key)

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
# Fyll i ANTHROPIC_API_KEY och DATABASE_URL i .env.local
pnpm prisma migrate dev --name init
pnpm dev
```

`pnpm install` kör `prisma generate` automatiskt via postinstall — ingen klient-genering behövs separat.

### Driftsättning på Vercel

För att `/api/explain` ska producera AI-fördjupning i molnet behöver två env-variabler sättas i Vercel-projektet (Production + Preview):

| Variabel | Värde | Var den sätts |
|---|---|---|
| `ANTHROPIC_API_KEY` | `sk-ant-...` från https://console.anthropic.com | Project Settings → Environment Variables |
| `DATABASE_URL` | Postgres connection string (Vercel Postgres eller Neon) | Project Settings → Environment Variables |

Efter att `DATABASE_URL` är satt: kör `pnpm prisma migrate deploy` mot databasen (lokalt mot samma URL eller via Vercel CLI) för att skapa `ExplanationCache`-tabellen. Utan databas fungerar appen ändå — `/api/explain` ringer Anthropic varje gång och hoppar över caching.

Utan `ANTHROPIC_API_KEY` returnerar `/api/explain` 503 med `code: 'NOT_CONFIGURED'`; resultatvyn faller då tillbaka till regelmotorns sammanfattning.

## Viktigt för utvecklare

Läs `CLAUDE.md` innan första commit — den innehåller projektets konventioner. `docs/PRD.md` beskriver produktkraven och ska uppdateras när beslut ändras.

## Disclaimers

Verktyget ger **preliminära bedömningar**, inte juridisk rådgivning. Företag ansvarar själva för att bedöma omfattning och anmäla sig till Myndigheten för civilt försvar enligt MCFFS 2026:1.
