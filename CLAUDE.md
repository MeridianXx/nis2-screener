# CLAUDE.md — Projektkonventioner

Detta dokument läses automatiskt av Claude Code vid varje session. Håll det kort och konkret — det är inte dokumentation, det är instruktioner.

## Läs först

1. `docs/PRD.md` — produktkrav och arkitekturbeslut
2. `docs/brand.md` — färger, typografi, designspråk

## Språk

- **Användargränssnitt:** svenska
- **Kod, kommentarer, variabelnamn, commit-meddelanden:** engelska
- **Användartexter i UI:** svenska, formell men vänlig ton (andra person plural: "ni"/"er" för företag, "du"/"dig" för individ)
- **Felmeddelanden till användare:** svenska, handlingsbara ("Företaget kunde inte hittas. Försök med organisationsnummer istället.")

## Kodstil

- TypeScript strict mode, inga `any` utan mycket god anledning
- Funktionella komponenter, inga klasser
- React hooks: `useState`, `useEffect`, `useMemo` efter behov — inga oberoende state-bibliotek i v1
- Async/await, inga `.then()`-kedjor
- Prefererar tidig return framför nestade if:ar
- Filnamn i kebab-case (`company-search.tsx`, inte `CompanySearch.tsx`)
- Komponenter PascalCase i export (`export function CompanySearch`)
- Inga default exports förutom för Next.js sidor och layouts

## API-konventioner

Alla interna API-rutter returnerar:
```typescript
type ApiResponse<T> = { data: T; error: null } | { data: null; error: { message: string; code: string } }
```

Rutter validerar input med `zod`. Externa API-fel ska fångas och översättas till användarvänliga meddelanden.

Alla externa API-anrop (Roaring, Anthropic) sker **server-side only**. Nycklar finns i env-variabler, aldrig på klienten.

## Arkitekturregler

- Regelmotorn (`lib/assess.ts`) är en ren funktion utan sidoeffekter. Ingen nätverkslogik, ingen databas, ingen React. Den ska kunna testas med Jest utan mockar.
- SNI-mappningen (`data/sni-mapping.json`) är källa till sanning. `lib/sni-mapping.ts` exporterar typade hjälpfunktioner men ändrar inte datan.
- Database access sker endast via Prisma, endast i API-rutter, aldrig i komponenter
- Caching-logik ska vara explicit och visuellt synlig i koden — inga osynliga cache-lager

## Commit-meddelanden

Följer Conventional Commits:
- `feat: add company search autocomplete`
- `fix: correct size threshold for large companies`
- `refactor: extract verdict styles to tokens`
- `test: add edge cases for CER-companies`
- `docs: update PRD with caching strategy`

En commit per logisk förändring. Commita när något nytt fungerar — inte när dagen är slut.

## Testning

- Regelmotorn har enhetstester med minst 15 testfall (alla klassificeringar + edge cases)
- Mål: 100 % branch coverage i `assess`, 80 %+ i övriga `lib/`
- Komponenttester endast för kritiska interaktioner (söksuggestion, disambiguering)
- Kör tester innan varje push: `pnpm test`

## Styling

- Tailwind CSS v4, använd brand tokens definierade i `app/globals.css`
- **Inga** inline styles utom för värden som beräknas dynamiskt (progressbar-bredd etc.)
- Designtokens är sanning — hårdkoda aldrig färger eller typografivärden utanför `globals.css`
- Bygg återanvändbara primitiv i `components/ui/` (Button, Input, Card) — men inte en egen hel komponentbibliotek
- Inspiration från prototypen i `docs/design-refs/`, men implementera i Tailwind från grunden, inte från prototypkoden

## Säkerhet och integritet

- Ingen personlig data (email, namn, etc.) lagras utan explicit samtycke
- `AssessmentLog` lagrar orgnr men inte användaridentitet
- GDPR: Lägg till integritetspolicy-sida i footer
- Rate limiting på publika endpoints via Vercel Edge Middleware

## Git

- `main` är alltid deploy:bar
- Feature-branches: `feat/company-search`, `fix/size-threshold`
- Inga force-pushes till main någonsin
- `.env.local` är gitignorerad, aldrig committad

## Vad man INTE ska göra

- Inga nya npm-paket utan motivering i PR-beskrivning
- Ingen CSS-in-JS (styled-components, emotion) — bara Tailwind
- Ingen state management utöver React built-ins i v1 (ingen Redux, Zustand, Jotai)
- Inga komplexa animationer (Framer Motion ok om det behövs, men CSS-transitions räcker för det mesta)
- Ingen logik i useEffect som borde vara i event handlers
- Inga tolkningar eller gissningar om vad användaren menar — fråga istället för att anta
