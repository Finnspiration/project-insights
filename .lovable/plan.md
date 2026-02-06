

## Plan: Redesign "Sådan Læses Visualiseringen" sektionen

### Problem
Guiden er svær at forstå fordi den bruger teknisk jargon, ligner kode, og mangler visuel forbindelse til den faktiske 3D blob. Den tager også meget plads og bruger hardcoded sprog i stedet for i18n.

### Løsning: Visuelt lag-diagram med farvestrip og collapsible layout

#### Ændring 1: Ny visuelt intuitiv guide-komponent

**Fil:** `src/components/visualizations/blob3d/BlobReadingGuide.tsx` (NY)

Opretter en dedikeret komponent der erstatter den nuværende inline-guide med:

1. **Collapsible sektion** - starter lukket, kan åbnes med et klik
2. **Visuelle lag-strips** - hver lag vises som en farvet strip der matcher blobbens faktiske farver:
   - Lag 7 (yderst): Rød/orange strip for "Baggrund og atmosfære" med forklaring "Farven afspejler risikoniveau"
   - Lag 6: Orange strip for "Overfladestruktur" med "Pigge og ujævnheder viser kompleksitet"
   - Lag 5: Blå strip for "Hovedform" med "Formen afspejler projektets DNA"
   - Lag 4: Lilla strip for "Åbninger" med "Huller viser informationsflow"
   - Lag 3: Grøn strip for "Indre gitter" med "Gitterstruktur viser vidensniveau"
   - Lag 2: Cyan strip for "Orbiter og partikler" med "Kredsende elementer viser temporal dynamik"
   - Lag 1 (inderst): Gul strip for "Kerne" med "Kernens form viser udviklingsstadie"

3. **"Hvad skal du kigge efter"** sektion med 3-4 korte, actionable tips:
   - "Er formen glat eller takket? → Glat = simpelt projekt, takket = komplekst"
   - "Hvilken farve dominerer baggrunden? → Grøn = lav risiko, rød = høj risiko"
   - "Kan du se en lysende kerne? → Stærk kerne = fokus på indre udvikling"

4. **Interaktiv kobling** - hover over et lag-item highlighter den tilsvarende dimension i ParameterBanner

#### Ændring 2: i18n nøgler

**Filer:** `src/locales/en/common.json` og `src/locales/da/common.json`

Tilføjer nye oversættelsesnøgler under `visualizations.blob.readingGuide`:

```text
readingGuide:
  toggle: "Vis guide" / "Show guide"
  subtitle: "Forstå hvad du ser" / "Understand what you see"
  layers:
    7: title: "Baggrund & Atmosfære" / "Background & Atmosphere"
       what: "Farven afspejler risikoniveau" / "Color reflects risk level"
       dimension: "Risiko" / "Risk"
    6: title: "Overfladestruktur" / "Surface Structure"  
       what: "Pigge og ujævnheder" / "Spikes and roughness"
       dimension: "Kompleksitet + Udfordring" / "Complexity + Challenge"
    ... (alle 7 lag)
  lookFor:
    title: "Hvad skal du kigge efter?" / "What to look for?"
    items: [3-4 actionable observation tips]
```

#### Ændring 3: Erstat inline-guide i MorphologyBlob

**Fil:** `src/components/visualizations/MorphologyBlob.tsx`

- Fjern hele den nuværende "How to Read Guide" Card (linje 529-618)
- Erstat med `<BlobReadingGuide />` komponent
- Fjern alle `i18n.language === 'da'` ternaries (erstattet af i18n nøgler)

### Tekniske detaljer

**Visuelt design:**
- Bruger en `Collapsible` komponent fra shadcn/ui
- Hvert lag-item er en lille horisontalt Card med:
  - Farvet venstre-border (4px) der matcher lagfarven
  - Lag-nummer badge
  - Titel + kort forklaring
  - Dimension-badge (subtilt)
- Layout er kompakt og visuelt skanbart
- Starter som lukket med en "Vis guide" knap der matcher visuelt

**Komponent-struktur:**
```text
BlobReadingGuide
  ├── CollapsibleTrigger ("Vis guide" / "Show guide")
  └── CollapsibleContent
      ├── LayerStrips (7 lag, yderst til inderst)
      │   └── LayerItem (farvet border, titel, forklaring)
      └── LookForSection (3-4 observationstips)
```

### Filer der ændres:
1. `src/components/visualizations/blob3d/BlobReadingGuide.tsx` - NY komponent
2. `src/components/visualizations/MorphologyBlob.tsx` - Erstat gammel guide
3. `src/locales/en/common.json` - Nye i18n nøgler
4. `src/locales/da/common.json` - Nye i18n nøgler

