
# Fix: Kryptisk Tillid-grafik (0.525% og misvisende bar)

## Problem

Screenshottet viser to sammenkoblede fejl:

1. **Confidence-vaerdien er paa forkert skala**: Edge funktionen (`morphologyMapping.ts` linje 596) returnerer confidence som et decimaltal mellem 0 og 1 (f.eks. `0.525`). UI'et forventer 0-100 og viser det direkte som `0.525%` -- fuldstaendig meningloest for brugeren.

2. **Progress-baren er misvisende**: Baren viser en lille roed/orange stump til venstre (den faktiske 0.525% vaerdi) og resten er udfyldt med lilla (`bg-secondary` track-farven). Det ligner en FULD bar, men vaerdien er naesten nul. Brugeren ser "fuld bar" + "0.525%" = forvirring.

## Aarsag (teknisk)

```text
morphologyMapping.ts: getDominantPhase()
  -> confidence = Math.min(0.95, 0.5 + (scoreDiff / maxPossibleScore) * 0.5)
  -> Returnerer 0.525 (decimal, 0-1 skala)

index.ts (edge function):
  -> confidence: morphologyAnalysis.confidence   // stadig 0.525

UJourneyTimeline.tsx: transformTheoryUData()
  -> confidence: data.confidence || 0            // stadig 0.525

UJourneyTimeline.tsx: render
  -> {analysis.confidence || 0}%                 // viser "0.525%"
  -> <Progress value={0.525} />                  // 0.525% fyldt, resten er track
```

Progress-komponentens track har `bg-secondary` (lilla), og indikatoren bruger `translateX(-99.475%)` -- saa 99.5% af baren er lilla track, og den lille synlige stump er indikatoren. Det ser ud som en fuld bar.

## Loesning

### AEndring 1: Normaliser confidence til 0-100 i `transformTheoryUData`

**Fil:** `src/components/visualizations/UJourneyTimeline.tsx` (linje 234)

Tilfoej normalisering: Hvis confidence er under 1, gange med 100. Afrund til heltal for ren visning.

```typescript
// FoER:
confidence: data.confidence || data.whyHere?.morphologyScoring?.confidence || 0,

// EFTER:
confidence: (() => {
  const raw = data.confidence || data.whyHere?.morphologyScoring?.confidence || 0;
  const normalized = raw <= 1 ? raw * 100 : raw;
  return Math.round(normalized);
})(),
```

### AEndring 2: Fix Progress-barens track-farve

**Fil:** `src/components/visualizations/UJourneyTimeline.tsx` (linje 758)

Tilfoej eksplicit graa track-farve saa den tomme del IKKE ligner en udfyldt bar:

```tsx
// FoER:
<Progress value={analysis.confidence || 0} className={`h-2 ${...}`} />

// EFTER:
<Progress value={analysis.confidence || 0} className={`h-2 bg-muted/50 ${...}`} />
```

`bg-muted/50` giver en lys graa track i stedet for den maettede lilla `bg-secondary`, saa det tydeligt fremgaar hvad der er fyldt vs tomt.

## Filer der aendres

| Fil | AEndring |
|-----|----------|
| `src/components/visualizations/UJourneyTimeline.tsx` | Normaliser confidence 0-1 til 0-100 (linje 234); fix track-farve paa Progress-bar (linje 758) |

## Forventet resultat

- Confidence vises som f.eks. **53%** i stedet for "0.525%"
- Progress-baren viser ~53% groen/gul/roed fyld med graa baggrund
- Farvekodningen matcher: groen >= 70%, gul 30-70%, roed < 30%
- Ingen kryptiske decimaltal eller misvisende farver
