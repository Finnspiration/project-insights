

# Fix: Theory U Dashboard - Hvidt felt og forvirrende Open M/H/W

## Problem 1: Stort hvidt felt under "Morfologi Bevis"

**Aarsag:** `DNAEvidenceVisualization` komponenten renderer en SVG med `viewBox="0 0 1600 300"` og `min-width: 1400px`. Denne skaber et enormt horisontalt scrollbart omraade der tager meget plads, selv naar der kun er 5 evidenspunkter. Derudover vises der baade EvidenceBreakdownPanel OG DNA-helix OG collapsible detaljeliste -- tre lag af den samme data.

**Loesning:** Stram sektionen op:
- Fjern `min-width: 1400px` fra DNAEvidenceVisualization SVG'en og goer den responsiv
- Reducer SVG-hoejden fra 300 til 200
- Fjern den redundante collapsible detaljeliste (linjer 902-922) -- EvidenceBreakdownPanel viser allerede de samme data
- Giv DNA-visualiseringen en `max-h` container saa den ikke dominerer siden

---

## Problem 2: Open M/H/W er altid 0 og forvirrende

**Aarsag:** To separate problemer:

1. **Vaerdierne er altid 0** -- Edge funktionen beregner aldrig rigtige Open Mind/Heart/Will scores. `transformTheoryUData` proever `data.diagnostics?.openMind?.score` og `data.openMHW?.mind`, men AI-prompten returnerer ikke disse felter, og den deterministiske mapping i `morphologyMapping.ts` beregner dem heller ikke.

2. **UI'et er forvirrende** -- Selv om vaerdierne var 0, viste barerne fuldt fyldte fordi `bg-secondary` track-farven ligner en udfyldt bar. Brugeren ser tre "fulde" barer med "0/10" tekst -- modstridende signaler.

**Loesning:**

### A) Tilfoej deterministisk Open M/H/W beregning i `morphologyMapping.ts`

Ny funktion `calculateOpenMHW()` der mapper morfologidimensioner til de tre aabninger:

| Aabning | Dimensioner der bidrager | Logik |
|---------|--------------------------|-------|
| **Open Mind** (Suspendere dom) | knowledge, complexity, challenge, thinking (development) | Innovation + kompleksitet + adaptive challenge = hoejere Open Mind |
| **Open Heart** (Empati) | stakeholder, cultural, development (being/relating), organizational (green/teal) | Adversarial stakeholders + cross-cultural + being/relating = hoejere Open Heart |
| **Open Will** (Slippe kontrollen) | change, risk, temporal, information | Disruptive change + extreme risk + transformation + distributed = hoejere Open Will |

Hvert bidrag scorer 0-10. Resultatet bruges i edge funktionen og caches med analysen.

### B) Forbedre UI'et for Open M/H/W

- Tilfoej korte forklaringer under hver bar: "Evnen til at suspendere domsafsigelse og se med friske oejne" (Mind), "Evnen til at lytte med empati og aaben hjertelighed" (Heart), "Evnen til at slippe og lade det nye vise sig" (Will)
- Brug en ikon for hver: Lightbulb (Mind), Heart (Heart), Sparkles (Will)
- Naar alle vaerdier er 0, vis en "beregner..." tilstand i stedet for tomme barer
- Fix farverne saa de altid matcher vaerdien (groen >= 7, gul >= 4, roed < 4)

---

## Filer der aendres

| Fil | AEndring |
|-----|----------|
| `supabase/functions/analyze-theory-u-position/morphologyMapping.ts` | Ny `calculateOpenMHW()` funktion |
| `supabase/functions/analyze-theory-u-position/index.ts` | Kald `calculateOpenMHW()` og inkluder i response |
| `src/components/visualizations/UJourneyTimeline.tsx` | Forbedre M/H/W UI med ikoner + forklaringer; stram Morfologi Bevis sektionen op |
| `src/components/visualizations/theory-u/DNAEvidenceVisualization.tsx` | Fjern `min-width: 1400px`, reducer hoejde, goer responsiv |
| `src/locales/da/common.json` | Tilfoej M/H/W forklaringer, omdoeb "Open M/H/W" til "De Tre Aabninger" |
| `src/locales/en/common.json` | Tilfoej M/H/W forklaringer, omdoeb til "The Three Openings" |

---

## Forventet resultat

- Intet hvidt felt under Morfologi Bevis -- DNA-visualiseringen er kompakt og responsiv
- Open M/H/W viser reelle scores baseret paa morfologien (f.eks. Mind 6/10, Heart 3/10, Will 8/10)
- Hver bar har en ikon og forklaring saa brugeren forstaar hvad den maaler
- Sektionen hedder "De Tre Aabninger" i stedet for det kryptiske "Open M/H/W"

