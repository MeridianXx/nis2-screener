# NIS2-kollen

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

**Session 3 klar (april 2026):**
- Företagssök på landing: debouncad autocomplete (350ms) som anropar `/api/company/search` och länkar vidare till `/assess/confirm`
- `/assess/confirm` hämtar företagsprofil server-side, mappar SNI → NIS2-sektor och låter användaren fylla i storleksuppgifter + specialfall innan bedömningen körs
- SNI-disambiguering för 62.01, 62.02 och 63.11 — användaren får välja vilken typ av IT/hosting-verksamhet det rör sig om innan resultat genereras
- `lib/apiverket.ts` är klienten mot [apiverket.se](https://apiverket.se). Aktiveras genom att sätta `APIVERKET_API_KEY` och flippa `NEXT_PUBLIC_USE_MOCK_COMPANY_DATA=false`. Tills dess används mock-data
- `CompanyCache` (90 dagars TTL) och `SearchCache` (7 dagars TTL) ligger framför Apiverket så samma orgnr/söksträng inte slår API:et två gånger inom TTL:n
- `AssessmentLog` skrivs vid varje resultatvisning (orgnr om hämtad, verdict, sektor, storleksklass — ingen PII)
- Rate limiting på `/api/company/*` via Next.js middleware (3 uppslag/IP/min, in-memory token bucket per Vercel-instans)
- Apiverket levererar inte anställda/omsättning/balansomslutning — användaren fyller i dessa manuellt på `/assess/confirm` efter företagsuppslag

## Teknisk stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS v4
- Prisma + Postgres (Neon)
- Claude API för fördjupad analys
- Apiverket för svensk företagsdata (orgnr, namn, SNI, säte)
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

För full funktionalitet behöver följande env-variabler sättas i Vercel-projektet (Production + Preview):

| Variabel | Värde | När den behövs |
|---|---|---|
| `ANTHROPIC_API_KEY` | `sk-ant-...` från https://console.anthropic.com | För AI-fördjupning på `/api/explain` |
| `DATABASE_URL` | Pooled connection string (auto-injiceras av Neon-integrationen) | För ExplanationCache, CompanyCache och AssessmentLog |
| `DATABASE_URL_UNPOOLED` | Direkt connection string (auto-injiceras av Neon) | Används av `prisma migrate` under bygget |
| `NEXT_PUBLIC_USE_MOCK_COMPANY_DATA` | `true` (mock) eller `false` (Apiverket) | `true` tills Apiverket-nyckel finns |
| `APIVERKET_API_KEY` | Bearer-token från https://apiverket.se | När mock-flaggan flippas till `false` |

Migrationerna körs automatiskt vid varje deploy via `vercel-build` (`prisma migrate deploy && next build`), så nya tabeller hamnar i databasen utan manuella steg.

Beteende när env saknas:
- Utan `ANTHROPIC_API_KEY` returnerar `/api/explain` 503 (`NOT_CONFIGURED`); resultatvyn faller tillbaka till regelmotorns sammanfattning.
- Utan `DATABASE_URL` skippas all caching och loggning tyst — appen fungerar men varje förfrågan slår upstream.
- Med `NEXT_PUBLIC_USE_MOCK_COMPANY_DATA=true` returneras 4 mockföretag istället för riktiga Apiverket-träffar.
- Apiverket levererar inte storleksuppgifter (anställda, omsättning, balansomslutning) — `/assess/confirm` ber användaren fylla i dem efter företagsuppslag.

## Viktigt för utvecklare

Läs `CLAUDE.md` innan första commit — den innehåller projektets konventioner. `docs/PRD.md` beskriver produktkraven och ska uppdateras när beslut ändras.

## Disclaimers

Verktyget ger **preliminära bedömningar**, inte juridisk rådgivning. Företag ansvarar själva för att bedöma omfattning och anmäla sig till Myndigheten för civilt försvar enligt MCFFS 2026:1.
