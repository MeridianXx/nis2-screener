# Brand — Tech Stn

## Färgpalett

### Primära (djupa petrol-toner)

| Token | Hex | RGB | Användning |
|-------|-----|-----|-----------|
| `ink` | `#071d1e` | 7 29 30 | Brödtext, headers |
| `deep` | `#192b2d` | 25 43 45 | Primärfärg, CTA-bakgrund, mörk hero |
| `slate` | `#2c3a3d` | 44 58 61 | Sekundär mörk yta |
| `mid` | `#405257` | 64 82 87 | Muted text, sekundär information |

### Neutraler (ljusa blå-grå)

| Token | Hex | RGB | Användning |
|-------|-----|-----|-----------|
| `subtle` | `#d9e7eb` | 217 231 235 | Sekundära ytor, borders |
| `surface` | `#e8f2f4` | 232 242 244 | Sidbakgrund |
| `white` | `#ffffff` | 255 255 255 | Kort, inputs |

### Accent (signaturfärg)

| Token | Hex | RGB | Användning |
|-------|-----|-----|-----------|
| `lime` | `#c3c200` | 195 194 0 | Signaturaccent — använd disciplinerat |

### Härledda (definiera i `globals.css`)

| Token | Värde | Användning |
|-------|-------|-----------|
| `border` | `#c4d5d9` | Border på inputs, kort |
| `muted` | `#7a8a8d` | Placeholder text |
| `lime-soft` | `rgba(195,194,0,0.12)` | Focus rings, subtila highlights |

## Limeprinciper

Lime är Tech Stn:s signaturfärg. Använd den:

**JA** — på 2-3 signaturmoment per vy
- Aktiv step-indicator i progress bar
- Verdict-label på resultatheader ("Bedömning · Väsentlig")
- Accentstrek under logotyp
- Focus rings på inputs
- Checkbox-fyllningar när markerade

**NEJ** — överanvänd inte
- Aldrig för brödtext (för låg kontrast på ljus bakgrund)
- Aldrig för hela knappytor (tappar accent-kvalitet)
- Aldrig för alla hovers samtidigt (skapar visuell kakofoni)

## Typografi

Använd Google Fonts. Ladda endast de vikter som faktiskt används.

### Display — Newsreader
- Serif med optisk storlek 6-72
- Vikter: 400, 500
- Använd för: rubriker, verdict-titel, hero-text
- CSS: `font-family: 'Newsreader', Georgia, serif; font-optical-sizing: auto;`

### Body — Inter
- Sans, vikter: 300, 400, 500, 600, 700
- Använd för: all löpande text, knappar, formulär
- CSS: `font-family: 'Inter', -apple-system, sans-serif;`

### Mono — JetBrains Mono
- Vikter: 400, 500
- Använd för: SNI-koder, organisationsnummer, steg-numrering, tekniska etiketter
- CSS: `font-family: 'JetBrains Mono', monospace;`

## Typografisk hierarki

| Element | Font | Storlek | Vikt | Letter-spacing |
|---------|------|---------|------|----------------|
| H1 (landing hero) | Newsreader | 56px | 400 | -0.02em |
| H2 (sidrubriker) | Newsreader | 34px | 500 | normal |
| H3 (kortrubriker) | Newsreader | 20px | 500 | normal |
| Brödtext stor | Inter | 18px | 400 | normal |
| Brödtext | Inter | 15px | 400 | normal |
| Brödtext liten | Inter | 13px | 400 | normal |
| Eyebrow-labels | JetBrains Mono | 10-11px | 400 | 0.15em, uppercase |
| Tekniska värden | JetBrains Mono | 12-13px | 400 | normal |

## Ikoner

Lucide React. Stroke-width 2 som standard. Storlekar: 14px (inline), 16px (knappar), 18-20px (display).

## Spacing

Tailwind default scale. Var generös med luft mellan sektioner (48-56px), snål inom komponenter (8-16px).

## Radii

- `rounded-lg` (10px) — inputs, mindre kort
- `rounded-xl` (12px) — större kort
- `rounded-2xl` (16px) — verdict hero
- `rounded-full` — badges, prickar

## Shadows

Använd sparsamt. Endast på:
- Dropdown-menyer: `0 4px 24px rgba(25,43,45,0.08)`
- Inte på kort, inte på knappar

## Animationer

- Transitions: 200ms ease-out som standard
- Fadein vid vystyte: 400ms
- Hover: translateX(2-3px) för klickbara rader
- Ingen bounce, inga spring-animationer
- Respektera `prefers-reduced-motion`
