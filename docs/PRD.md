# Product Requirements Document — NIS2-kollen

**Version:** 1.0 (April 2026)
**Status:** För implementation
**Ägare:** Tech Stn / Adam

## 1. Syfte och bakgrund

Cybersäkerhetslagen (2025:1506) trädde i kraft 15 januari 2026 och implementerar NIS2-direktivet i svensk rätt. Den utökar antalet sektorer som omfattas av tvingande cybersäkerhetskrav från 7 till 18, och berör därmed en betydande del av svenskt näringsliv.

Många företag är osäkra på om de omfattas, och i så fall som väsentlig eller viktig verksamhetsutövare. Bedömningen kräver förståelse för både sektorstillhörighet (enligt bilaga 1 eller 2), storlekskrav (EU:s SMF-definition) och specialfall.

Det finns en myndighets-självutvärdering på MCF:s webbplats, men den är bred och generell. Detta verktyg ska vara **snabbare, tydligare och mer handlingsdrivet**.

## 2. Målgrupper och användningsfall

### Primär: Intern användning på Tech Stn

Säljare och rådgivare som snabbt vill kvalificera kunder och prospects. Typiskt scenario: en säljare har en lista med 30 potentiella kunder och vill på en eftermiddag få en prioriteringslista över vilka som troligen behöver hjälp med NIS2-compliance.

**Framgångskriterium:** En säljare kan gå igenom 20 företag på 30 minuter.

### Sekundär: Lead magnet för side hustle

Externa besökare som googlar "omfattas mitt företag av NIS2" och hittar verktyget. De gör en bedömning, ser potentiella konsekvenser, och får en naturlig väg att kontakta Tech Stn för hjälp.

**Framgångskriterium:** Konvertering från bedömning → kontaktformulär >5 %.

## 3. Produktprinciper

1. **Indikativt, inte juridiskt bindande.** All kommunikation är tydlig med att det är en preliminär bedömning.
2. **Hastighet före uttömmande precision.** Verktyget ska ge 80 %-svar snabbt, inte 100 %-svar långsamt.
3. **Respekt för användarens tid.** Minsta möjliga antal frågor för att få ett meningsfullt svar.
4. **Handlingsorienterat resultat.** Varje bedömning åtföljs av konkreta nästa steg.
5. **Transparens kring begränsningar.** Verktyget ska erkänna vad det *inte* kan avgöra (t.ex. koncernsammanslagning, CER-status).

## 4. Funktionella krav

### 4.1 Företagsuppslag (primärt flöde)

Användaren skriver företagsnamn eller organisationsnummer. Verktyget:

- Debouncar input (350ms) och anropar Apiverket för sökning
- Visar dropdown med upp till 6 träffar (namn, orgnr, stad)
- Vid val: hämtar företagsprofil (SNI-kod, namn, säte) från Apiverket
- Mappar SNI-kod mot NIS2-sektorer via `data/sni-mapping.json`
- På bekräftelsesidan fyller användaren själv i anställda, omsättning och balansomslutning — Apiverket levererar inte storleksuppgifter

Vid **tvetydig SNI-mappning** (t.ex. 62.02 = datakonsult som kan vara utvecklingskonsult ELLER MSP): visa disambigueringsfråga innan bedömning.

Vid **ingen SNI-match**: låt användaren välja sektor manuellt.

### 4.2 Manuell bedömning (fallback)

3-stegsflöde:

**Steg 1 — Sektor:** Välj bland de 18 sektorerna grupperat per bilaga, eller "ingen av ovanstående"
**Steg 2 — Storlek:** Ange antal anställda, årsomsättning, balansomslutning
**Steg 3 — Särskilda förhållanden:** Kryssa för CER, offentlig aktör, DNS/tillitstjänst, ensam leverantör, leverantör till annan verksamhetsutövare, eller endast säkerhetskänslig verksamhet

### 4.3 Regelmotor

Ren TypeScript-funktion `assess(input): Verdict` som implementerar MCF:s bedömningstrappa. Inga sidoeffekter, enkel att enhetstesta.

**Storlekslogik** (EU:s SMF-definition):
- Stort: ≥250 anställda eller (omsättning >50 MEUR OCH balansomslutning >43 MEUR)
- Medelstort: ≥50 anställda eller (omsättning >10 MEUR OCH balansomslutning >10 MEUR)
- Små/mikro: under dessa tröskelvärden

**Klassificering:**
- Bilaga 1 + stort → väsentlig
- Bilaga 1 + medelstort → viktig
- Bilaga 2 + medelstort/stort → viktig
- Oavsett storlek + CER eller offentlig sektor eller DNS/tillitstjänst → väsentlig
- Leverantör till omfattad verksamhet → indirekt påverkan
- Annars → ej omfattad

Alla klassificeringsfall måste täckas av enhetstester (mål: 100 % branch coverage i `assess`).

### 4.4 AI-genererad fördjupning

Efter att regelmotorn producerat en verdict:

- Anropa Claude API (server-side, modell: `claude-sonnet-4-20250514`)
- Skicka verdict + företagsdata som kontext
- Generera 3-styckes förklaring på svenska: motivering, praktiska konsekvenser, nästa steg
- Visa skeleton loader under väntetid (~2-4 sekunder)
- Fallback om API misslyckas: visa bara regelmotor-baserad motivering

### 4.5 Resultatvy

Innehåller:
- Hero med verdict-kategori (Väsentlig/Viktig/Indirekt/Ej berörd) och kort motivering
- Faktaöversikt (företag, sektor, storlek, tillsynsmyndighet)
- AI-genererad fördjupning (3 stycken)
- Lista med officiella resurser (MCF-vägledning, MCFFS 2026:1, anmälningsportal)
- Tech Stn CTA ("Behöver ni hjälp att komma igång?")
- Knapp för ny bedömning

## 5. Icke-funktionella krav

### Prestanda
- Initial page load <2s på 4G
- Sökträffar <500ms efter sista tangenttryck
- Regelmotor ska köra synkront (<10ms)

### Tillgänglighet
- WCAG 2.1 AA-nivå
- Full tangentbordsnavigation
- Tydliga focus-states (använd lime-färgen från paletten)
- Semantiska HTML-element

### Säkerhet
- Alla externa API-nycklar (Apiverket, Claude) server-side endast
- Rate limiting per IP på publika endpoints (3 uppslag/minut utan auth)
- Ingen PII sparas utan explicit samtycke
- HTTPS enforced

### Caching
- Företagsprofildata cachas i Postgres med 90 dagars TTL (anpassat efter Apiverkets 200/dag-gräns på gratisplanen)
- Söklisteresultat cachas i 7 dagar med hash av query som nyckel
- Samma företag ska inte slå Apiverket två gånger inom TTL:n
- AI-förklaringar cachas per `{verdict_code, sector, size_category}` i 30 dagar

## 6. Teknisk arkitektur

### Stack
- Next.js 14 App Router, TypeScript strict mode
- Tailwind CSS v4 med Tech Stn brand tokens
- Prisma ORM + Postgres (Vercel Postgres eller Neon)
- Vercel deployment med preview deployments per branch
- GitHub Actions CI: lint, typecheck, test på varje PR

### Projektstruktur
```
app/
  page.tsx                 # Landing med sök/starta manuellt
  assess/                  # Manuellt 3-stegsflöde
  api/
    company/search/        # Apiverket /v1/companies?q= proxy
    company/[orgnr]/       # Apiverket /v1/companies/{orgnr} proxy med caching
    assess/                # Regelmotor som endpoint
    explain/               # Claude API proxy
components/
  landing/
  assessment/
  results/
  ui/                      # Delade UI-primitiv
lib/
  assess.ts                # Regelmotor (ren funktion)
  sni-mapping.ts           # SNI→NIS2 lookup
  apiverket.ts             # Apiverket-klient (svensk företagsdata)
  anthropic.ts             # Claude API-klient
  cache.ts                 # Cache-helpers mot Postgres
data/
  sni-mapping.json         # SNI → NIS2-sektor mappning
prisma/
  schema.prisma
tests/
  assess.test.ts           # Enhetstester för regelmotor
  sni-mapping.test.ts      # Tester för mappningslogik
```

### Datamodell (Prisma)

```prisma
model CompanyCache {
  orgnr       String   @id
  name        String
  city        String?
  sniCode     String
  sniLabel    String?
  employees   Int?
  turnover    Float?   // MEUR
  balance     Float?   // MEUR
  fetchedAt   DateTime @default(now())
  expiresAt   DateTime
}

model AssessmentLog {
  id          String   @id @default(cuid())
  orgnr       String?
  verdict     String   // VASENTLIG | VIKTIG | INDIREKT | EJ_OMFATTAD
  sector      String?
  sizeClass   String?
  createdAt   DateTime @default(now())
}

model ExplanationCache {
  cacheKey    String   @id  // hash av {verdict, sector, sizeClass}
  text        String
  createdAt   DateTime @default(now())
  expiresAt   DateTime
}
```

## 7. Ut-av-scope för v1

Följande är explicit **inte** med i första versionen men är kända framtida utbyggnader:

- Koncernsammanslagning av dotter- och partnerföretag (kräver ägarstrukturdata)
- Automatisk CER-statuskontroll (ingen publik lista finns)
- Detaljerad sanktionskalkylator
- Export av bedömning som PDF-rapport
- Inloggning och sparade bedömningar
- Multi-user admin-dashboard för Tech Stn-säljare
- Integration med CRM för automatisk synk

## 8. Designprinciper och brand

Använd Tech Stn färgpalett (se `docs/brand.md`). Typografi:
- **Display:** Newsreader (Google Fonts) — serif, optisk storlek 6-72
- **Brödtext:** Inter — sans, vikt 300-700
- **Teknisk/mono:** JetBrains Mono för SNI-koder, orgnr, timestamps

Designprinciper:
- Djup petrol (#192b2d) som primärfärg på alla CTA:er och verdict-hero för Väsentlig/Viktig
- Lime (#c3c200) som signaturaccent — används disciplinerat på 2-3 signaturmoment per vy
- Ljus yta (#e8f2f4) som bakgrund, vita kort skapar naturlig djup
- Inga dropshadows utom mycket subtila på dropdown-menyer
- Tydlig visuell hierarki mellan "kritisk åtgärd krävs" (mörk hero) och "inget att göra" (ljus hero)

## 9. Framgångsmått

### Intern användning
- 5+ Tech Stn-säljare använder verktyget minst 1 gång/vecka inom 30 dagar
- Genomsnittlig tid per bedömning <2 minuter
- Kvalitativ feedback: säljare rapporterar att det "sparar tid"

### Lead magnet (om och när det släpps publikt)
- 100+ bedömningar/månad inom 3 månader
- Konvertering bedömning → kontaktformulär >5 %
- 3+ bokade möten/månad från verktyget

## 10. Öppna frågor

- Ska verktyget lagra email från användare för uppföljning? (GDPR-implikation)
- Ska disambigueringsfrågorna loggas för analys av vilka SNI-koder som är mest tvetydiga?
- Ska "Kontakta oss"-CTA:n leda till formulär på verktygssidan, eller länka ut till Tech Stn:s huvudsida?
