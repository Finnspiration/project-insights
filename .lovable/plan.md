

# Fix: Morfologi Bevis "returned an object instead of string"

## Problem

Screenshottet viser at "Evidence Breakdown" panelet viser fejlbeskeder som:
```
key 'morphology.dimensions.risk (da)' returned an object instead of string.
```

Dette sker for alle 5 dimensioner (risk, change, information, organizational, cultural).

## Aarsag

I `EvidenceBreakdownPanel.tsx` bruger to oversaettelsesnoegler forkerte stier:

**Linje 69 -- Dimensionsnavn:**
```tsx
// NUVAERENDE (FEJL):
t(`morphology.dimensions.${evidence.dimension}`, evidence.dimension)
// Resolves til: morphology.dimensions.risk -> OBJEKT {title, description, options}

// KORREKT:
t(`morphology.dimensions.${evidence.dimension}.title`, evidence.dimension)
// Resolves til: morphology.dimensions.risk.title -> "Risikoprofil"
```

**Linje 73 -- Dimensionsvaerdi:**
```tsx
// NUVAERENDE (FEJL):
t(`morphology.options.${evidence.dimension}.${evidence.value}`, evidence.value)
// Stien "morphology.options" eksisterer slet ikke i JSON-filen

// KORREKT:
t(`morphology.dimensions.${evidence.dimension}.options.${evidence.value}`, evidence.value)
// Resolves til: morphology.dimensions.risk.options.extreme -> "Ekstrem - ..."
```

## Loesning

Ret de to oversaettelsesnoegler i `EvidenceBreakdownPanel.tsx`:

| Linje | Nuvaerende sti | Korrekt sti |
|-------|----------------|-------------|
| 69 | `morphology.dimensions.${dim}` | `morphology.dimensions.${dim}.title` |
| 73 | `morphology.options.${dim}.${val}` | `morphology.dimensions.${dim}.options.${val}` |

## Fil der aendres

| Fil | AEndring |
|-----|----------|
| `src/components/visualizations/theory-u/EvidenceBreakdownPanel.tsx` | Ret 2 oversaettelsesnoegler (linje 69 og 73) |

## Forventet resultat

- "risk" vises som "Risikoprofil" (da) / "Risk Profile" (en)
- "extreme" vises som "Ekstrem - Kritiske konsekvenser..." i stedet for raa vaerdi
- Ingen fejlbeskeder i Evidence Breakdown panelet

