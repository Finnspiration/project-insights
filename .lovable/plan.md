

# Fix: Projekt Kropsscanning Vitale Tegn Fejl

## Problem-analyse

Screenshottet viser at items 2-6 i "Vitale Tegn" viser raa oversaettelsesnoegler som:
```
visualizations.bodyScan.descriptions.face.[object Object]
visualizations.bodyScan.descriptions.shoulders.[object Object]
```

Der er **tre separate fejl** der tilsammen skaber dette problem:

---

## Fejl 1: Morfologi-vaerdier er objekter, ikke strenge

Database-data viser at morfologi-dimensioner er gemt som objekter:
```json
{
  "stakeholder": {"selectedIndex": 0, "selectedValue": "unified"},
  "resources": {"selectedIndex": 0, "selectedValue": "rich"},
  ...
}
```

Men baade `BodyPartExplanation.tsx` og `bodyDataCalculator.ts` bruger vaerdierne direkte som strenge:
```tsx
// BodyPartExplanation linje 127:
t(`visualizations.bodyScan.descriptions.face.${morphology?.stakeholder || 'unified'}`)
// Resultat: "...face.[object Object]"

// bodyDataCalculator linje 268-269:
{ rich: 1, ... }[morphology.resources || 'balanced']
// Resultat: undefined (lookup med objekt som noegle)
```

Andre visualiseringer (MorphologyBlob, WeatherMap) har allerede en `getMorphologyValue()` helper til dette - men body scan mangler den.

---

## Fejl 2: Duplikerede `parts` noegler i JSON

Baade `en/common.json` og `da/common.json` har **to** `parts` objekter under `bodyScan`:

```json
"parts": {
  "head": "Hoved",        // <-- Anatomiske navne (OVERSKREVET)
  "face": "Ansigt",
  ...
},
"parts": {                 // <-- Beskrivende navne (VINDER)
  "head": "Strategi & Klarhed",
  "face": "Kommunikation & Konflikt",
  ...
}
```

I JSON overskriver den sidste duplicate noegle den foerste. De anatomiske navne er tabt. Loesningen er at omdoebe den anden til `partLabels`.

---

## Fejl 3: bodyDataCalculator returnerer objekter i stedet for strenge

`calculateBodyData()` passer raa morfologi-objekter videre til alle lookup-funktioner. Fordi objekter aldrig matcher string-noeglen, returneres altid default-vaerdier. Det betyder at farverne og status-beregningerne er forkerte - projektet viser sandsynligvis forkerte farver paa badge-numrene.

---

## Loesning

### AEndring 1: `bodyDataCalculator.ts` - Normaliser morfologi ved indgang

Tilfoej en `getMorphologyValue` helper i toppen af filen og normaliser **alle** morfologi-vaerdier i starten af `calculateBodyData()`:

```typescript
function getMorphologyValue(value: any, defaultValue: string = ''): string {
  if (!value) return defaultValue;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value.selectedValue) return value.selectedValue;
  return defaultValue;
}
```

I `calculateBodyData()`: normaliser morfologien foerst, saa alle downstream funktioner modtager rene strenge. Tilsvarende fix i `calculateStability()`, `calculateMomentum()`, `getLegStance()` og `generateWarnings()` der ogsaa laesser raa morfologi.

### AEndring 2: `BodyPartExplanation.tsx` - Normaliser morfologi-vaerdier

Tilfoej samme `getMorphologyValue` helper og brug den i:
- `getDescription()` (linje 122-146) - alle `morphology?.dimension` lookups
- `getStatus()` (linje 56-111) - `morphology?.resources` og `morphology?.risk` lookups

### AEndring 3: `da/common.json` og `en/common.json` - Fix duplikerede parts

Omdoeb den anden `parts` til `partLabels`:

```json
"parts": {
  "head": "Hoved",
  "face": "Ansigt",
  ...
},
"partLabels": {
  "head": "Strategi & Klarhed",
  "face": "Kommunikation & Konflikt",
  ...
}
```

Opdater `BodyPartExplanation.tsx` til at bruge `partLabels` for de beskrivende navne (som vises i listen).

---

## Filer der aendres

| Fil | AEndring |
|-----|----------|
| `src/components/visualizations/body-scan/bodyDataCalculator.ts` | Tilfoej `getMorphologyValue` helper, normaliser alle morfologi-inputs |
| `src/components/visualizations/body-scan/BodyPartExplanation.tsx` | Normaliser morfologi-vaerdier i `getDescription()` og `getStatus()` |
| `src/locales/da/common.json` | Omdoeb duplikeret `parts` til `partLabels` |
| `src/locales/en/common.json` | Omdoeb duplikeret `parts` til `partLabels` |

## Forventet resultat

- Alle 7 vitale tegn viser korrekte danske/engelske beskrivelser
- Farvekoderne paa badge-numrene matcher de faktiske morfologi-vaerdier
- Statusetiketter ("Sund", "Farezonen" osv.) er korrekte
- Ingen `[object Object]` i UI'et

