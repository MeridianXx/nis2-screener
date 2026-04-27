# Första prompten till Claude Code

Öppna Claude Code i projektmappen (`cd nis2-screener && claude`) och klistra in följande som första meddelande:

---

## Kopiera detta till Claude Code

```
Läs följande filer i ordning innan du gör något:

1. README.md
2. docs/PRD.md (hela)
3. docs/brand.md (hela)
4. CLAUDE.md
5. data/sni-mapping.json (bara strukturen, inte alla värden)

Din uppgift i denna session:

Scaffolda Next.js 14-projektet enligt PRD och CLAUDE.md. Inkludera:

SETUP:
- Next.js 14 med App Router, TypeScript strict mode, Tailwind CSS v4
- Package manager: pnpm
- ESLint + Prettier med standardkonfiguration
- Jest + ts-jest för enhetstester

GRUNDSTRUKTUR:
Skapa mappstrukturen enligt PRD avsnitt 6. Lägg till placeholder-filer så strukturen är tydlig, men implementera inte vyer än — det gör vi i kommande sessioner.

BRAND TOKENS:
I app/globals.css, definiera alla CSS custom properties från docs/brand.md under :root. Konfigurera Tailwind config att mappa dessa tokens så de kan användas som className="bg-deep text-surface border-border". Importera också Newsreader, Inter och JetBrains Mono från Google Fonts i app/layout.tsx.

REGELMOTOR (prioriterat):
Implementera lib/assess.ts som en ren TypeScript-funktion enligt PRD 4.3. Inputtyp:
  type AssessInput = {
    sectorKey: string | null
    bilaga: 1 | 2 | null
    employees: number | null
    turnover: number | null   // MEUR
    balance: number | null    // MEUR
    specials: string[]
  }
Outputtyp:
  type Verdict = {
    code: 'VASENTLIG' | 'VIKTIG' | 'INDIREKT' | 'EJ_OMFATTAD'
    title: string
    summary: string
    sector: string | null
    size: string
    tillsyn: string | null
  }

Använd EU:s SMF-definition exakt enligt PRD:
- Large: employees >= 250 OR (turnover > 50 AND balance > 43)
- Medium: employees >= 50 OR (turnover > 10 AND balance > 10)

Specials ska vara en array av strängar. Hanterade värden:
'offentlig-aktor', 'dns-tillit', 'cer', 'ensam-leverantor', 'leverantor-till', 'endast-sakerhetsskydd'

TESTER:
Skapa tests/assess.test.ts med minst 15 testfall som täcker:
- Stort bilaga 1 → VASENTLIG
- Medelstort bilaga 1 → VIKTIG
- Medelstort bilaga 2 → VIKTIG
- Stort bilaga 2 → VIKTIG
- Litet bilaga 1 → EJ_OMFATTAD
- Litet + leverantor-till → INDIREKT
- Utanför sektor → EJ_OMFATTAD
- Utanför sektor + leverantor-till → INDIREKT
- CER-special → VASENTLIG oavsett storlek
- Offentlig aktör → VASENTLIG oavsett storlek
- DNS/tillit → VASENTLIG oavsett storlek
- endast-sakerhetsskydd → EJ_OMFATTAD
- Gränsfall: exakt 50 anställda, exakt 10 MEUR, exakt 250 anställda
- Turnover > 10 men balance <= 10 (ska INTE räknas som medium)

Alla tester ska vara gröna innan du committar.

DATAFIL:
Kopiera data/sni-mapping.json som den är (jag har förberett den). Skapa lib/sni-mapping.ts som importerar JSON:en och exporterar:
  function lookupSNI(code: string): SNIMapping | null
Som ska matcha exakt kod först, sedan prefix (t.ex. "10.51" ska matcha prefix "10." om ingen exakt match finns).

API-STUB:
Skapa app/api/assess/route.ts som tar POST med AssessInput, kör assess(), returnerar { data: Verdict, error: null }. Validera input med zod.

Skapa app/api/explain/route.ts som stub med TODO-kommentar för Anthropic-integration (vi implementerar i session 2).

Skapa app/api/company/search/route.ts och app/api/company/[orgnr]/route.ts som stubbar som returnerar mockdata från en local mocks-fil (vi kopplar Roaring i session 3). Feature flag via NEXT_PUBLIC_USE_MOCK_COMPANY_DATA=true.

LANDING:
Implementera app/page.tsx med endast en enkel landing som visar projektnamnet, den lilla sköld-loggan från prototypen (sköld + lime-stapel under), och två knappar: "Sök företag" (disabled med "Kommer snart") och "Starta manuell bedömning" (leder till /assess). Ingen sökfunktionalitet än — det kommer i session 3.

COMMIT-STRATEGI:
Gör separata commits för:
1. chore: initial Next.js scaffold
2. chore: add brand tokens and fonts
3. feat: implement assess rule engine
4. test: add assess rule engine tests
5. feat: add SNI mapping module
6. feat: add API route stubs
7. feat: add minimal landing page

README-UPPDATERING:
Uppdatera "Status" i README.md när allt ovan är klart och tester grönt.

VERIFIERING INNAN DU AVSLUTAR:
- `pnpm install` kör utan fel
- `pnpm test` visar minst 15 gröna tester
- `pnpm dev` startar på http://localhost:3000 och visar landing
- `pnpm build` bygger utan fel

Fråga mig innan du:
- Installerar paket som inte är nämnda här eller i PRD
- Gör arkitekturbeslut som avviker från CLAUDE.md
- Skapar abstraktioner som inte är motiverade av aktuellt behov

Börja nu. Rapportera efter varje större milstolpe vad som är klart och vilka commits du gjort.
```

---

## Innan du klistrar in

Se först till att:

**1. Repo-setupen är klar lokalt**
```bash
git clone https://github.com/MeridianXx/nis2-screener.git
cd nis2-screener
```

**2. Alla kit-filerna ligger på plats.** Kopiera följande från startkitet till repot:
- `README.md` → repo-rot
- `CLAUDE.md` → repo-rot
- `.gitignore` → repo-rot
- `.env.example` → repo-rot
- `docs/PRD.md` → `docs/` (skapa mappen)
- `docs/brand.md` → `docs/`
- `data/sni-mapping.json` → `data/` (skapa mappen)

**3. Initial commit är gjord**
```bash
git add .
git commit -m "chore: add PRD, brand guide, and SNI mapping"
git push
```

**4. pnpm och node är installerade**
```bash
node --version  # behöver vara 20+
pnpm --version  # behöver vara 8+
```

Om inte: `curl -fsSL https://get.pnpm.io/install.sh | sh`

**5. Anthropic API-nyckel är klar** från https://console.anthropic.com — du behöver den till `.env.local` senare.

---

## Efter session 1

När Claude Code är färdig med första sessionen ska du ha:
- Fungerande Next.js-app på localhost:3000 med landing
- Grön testsvit för regelmotorn (din viktigaste säkerhetsnät)
- Alla API-rutter som stubbar, redo att fyllas i
- 7 rena commits i git-historiken

Gå in och verifiera manuellt:
```bash
pnpm test       # Ska visa minst 15 gröna tester
pnpm dev        # Starta dev-server
pnpm build      # Ska bygga utan fel
```

Pusha till GitHub:
```bash
git push
```

Deploya till Vercel:
1. Logga in på vercel.com
2. "Add New Project" → välj `nis2-screener` från GitHub
3. Framework: Next.js (auto-detekteras)
4. Innan deploy: lägg till env-variabler från `.env.example`
5. Deploy

Efter första deployen har du en live URL, preview per branch, och varje push till main auto-deployar.

---

## Session 2 (när du kör igen)

```
Läs CLAUDE.md och docs/PRD.md först.

Session 1 är klar. I denna session:

1. Implementera /assess 3-stegsflödet (sektor, storlek, specials)
   - En vy per steg med progress-indicator enligt docs/brand.md
   - Använd brand tokens från globals.css, inga inline styles
   - Formulär-state i React useState (ingen state manager)
   - Disabled-state på "Nästa" när steget är ofullständigt
   - Browser back-knapp ska fungera naturligt (använd router)

2. Implementera /assess/result som visar verdict
   - Använd VERDICT_STYLES-mappningen från design-refs
   - Fact-grid med sektor/storlek/tillsyn
   - Skeleton loader för AI-förklaring

3. Anslut Anthropic API i /api/explain
   - Server-side endast
   - Modell: claude-sonnet-4-20250514
   - Max tokens: 1000
   - Prompt enligt prototypen (se docs/design-refs/prompt.md om den finns, annars be mig om prompt-mallen)
   - Cache resultat i Postgres 30 dagar

4. Deploya databasen
   - pnpm prisma init
   - Skapa schemat från PRD
   - prisma migrate dev
   - Verifiera att ExplanationCache funkar

Commit efter varje logisk bit. Tester för allt som har logik. Fråga innan du avviker från PRD.
```

Session 3 (företagsuppslag med Roaring) skriver vi när session 2 är klar och du har Roaring provkonto aktiverat.
