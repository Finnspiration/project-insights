

# Fix: Stort hvidt felt under Morfologi Bevis

## Problem

Screenshottet viser et stort hvidt felt mellem "Morfologi Bevis" overskriften og legenden. Aarsagen er overraskende simpel:

**SVG'en i `DNAEvidenceVisualization.tsx` er TOM.** Den beregner helix-punkter (linjer 83-112) og connections (linjer 114-118), men renderer **ingen SVG-elementer** overhovedet. Soegning efter `circle`, `rect`, `path`, `line`, `text` i filen finder KUN matches i "no data" early return. SVG-tagget `<svg viewBox="0 0 1600 200">` indeholder ingenting - det er en blank hvid firkant der fylder ~150-200px.

Sektionen i `UJourneyTimeline.tsx` (linjer 906-925) renderer tre ting under EvidenceBreakdownPanel:

```text
1. Heading: "Morfologi Bevis" (med Sparkles ikon)     <-- overfloedigt
2. DNAEvidenceVisualization (tom SVG = hvidt felt)     <-- TOM, intet indhold
3. Legend (Understoettende/Andre dimensioner)          <-- legend for ingenting
```

Alle tre er overflodige fordi `EvidenceBreakdownPanel` (linje 901-904) allerede viser den samme evidens-data i et laeseligt format.

## Loesning

Fjern den tomme DNA-visualiseringssektion fuldstaendigt: overskriften, den tomme `DNAEvidenceVisualization` komponent, og legenden. EvidenceBreakdownPanel forbliver som den primaere visning af morfologisk evidens.

## Filer der aendres

| Fil | AEndring |
|-----|----------|
| `src/components/visualizations/UJourneyTimeline.tsx` | Fjern linjer 906-925: heading, DNAEvidenceVisualization og legend |

Koden der fjernes (linjer 906-925):
```tsx
// ALT DETTE FJERNES:
<h4 className="font-semibold text-sm flex items-center gap-2 mt-6">
  <Sparkles className="w-4 h-4 text-primary" />
  {t('visualizations.theoryU.morphologyEvidence')}
</h4>

<DNAEvidenceVisualization morphology={morphology} 
  evidence={analysis.whyHere.morphologyEvidence} 
  language={i18n.language as 'en' | 'da' || 'en'} />

<div className="flex items-center gap-4 text-xs text-muted-foreground px-2">
  ... (legend)
</div>
```

## Forventet resultat

- Intet hvidt felt -- sektionen gaar direkte fra EvidenceBreakdownPanel til Dokument Bevis
- Morfologisk evidens vises stadig klart i EvidenceBreakdownPanel (som kan foldes ud)
- Ingen tom SVG der fylder plads uden at vise noget

