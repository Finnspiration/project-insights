
# Onboarding-pakke #1: "Forstå PRISM på 60 sekunder"

Fire sammenhængende tiltag der løfter første-gangs-oplevelsen. Brugeren skal opleve værdi før de uploader noget, og altid vide hvad næste skridt er.

## 1. Database — onboarding-felter + demo-flag

Ét migrations-trin tilføjer:

**`user_profiles`**
- `onboarded_at TIMESTAMPTZ NULL` — sættes når welcome modal lukkes
- `onboarding_step TEXT NULL` — valgfri, så vi kan fortsætte hvor brugeren slap (`welcome`, `demo_seen`, `done`)

**`projects`**
- `is_demo BOOLEAN NOT NULL DEFAULT false` — markerer auto-genererede demo-projekter, så de kan filtreres/slettes nemt

Ingen RLS-ændringer kræves — eksisterende `user_id`-policies dækker.

## 2. Welcome modal (forslag #1)

**Ny komponent:** `src/components/onboarding/WelcomeModal.tsx`

- Vises automatisk på første dashboard-besøg når `profile.onboarded_at` er `NULL`
- Brandet PRISM-design: emerald header, gold-accent rule, Urbanist display-tekst
- Indhold (i18n):
  - Hilsen: "Velkommen til PRISM, [fornavn]"
  - Subtekst: "Lad os vise dig hvordan du afdækker det usynlige i dine projekter"
  - 3 punkter med ikon: opret projekt → udforsk morfologi → få indsigt fra AI
  - To CTA'er: **"Udforsk demo-projekt"** (primary, emerald) og **"Spring over og opret mit eget"** (ghost)
- Begge handlinger sætter `onboarded_at = now()` så modalen ikke kommer igen
- "Udforsk demo" kalder en edge function der seeder demo-projektet (#3) og navigerer dertil
- "Spring over" lukker bare og åbner CreateProjectDialog

i18n-nøgler tilføjes til `common.json` (en + da).

## 3. Demo-projekt (forslag #3)

**Ny edge function:** `supabase/functions/seed-demo-project/index.ts`

- Modtager: ingen body (bruger auth-context)
- Logik: indsætter ét færdigt projekt med:
  - Navn: "Demo: Bæredygtig byomstilling" / "Demo: Sustainable Urban Transition" (JSONB)
  - Realistisk beskrivelse
  - Komplet `morphology` for alle 12 dimensioner (et "Complex-Cooperative-Innovative-CrossOrg-Transformation-Green-Adaptive-Relating-Balanced-Transformational-Network-Moderate" eksempel)
  - Genereret `dna_code`
  - 3-4 prækalkulerede `blind_spots` rows med titel/beskrivelse/recommendations på begge sprog
  - `is_demo = true`
- Returnerer det nye projekts ID, frontend navigerer til `/projects/<id>`
- Idempotent: hvis brugeren allerede har et `is_demo = true` projekt, returneres dets ID i stedet for at lave et nyt

**Slet-knap:** I `ProjectCard.tsx` vises et lille "Demo"-badge (gold) når `is_demo`, og menupunktet "Fjern demo-projekt" er tilgængeligt — almindelig delete-flow.

## 4. Tom-tilstand-coaching (forslag #4)

**Ny genbrugskomponent:** `src/components/empty/EmptyState.tsx`

Props: `icon`, `title`, `description`, `primaryAction?`, `secondaryAction?`, `illustration?`.

Konsistent stil: stort cirkulært emerald-tonet ikon, Urbanist-overskrift, gold-rule, kort forklaring, 1-2 CTA-knapper. Erstatter ad-hoc tom-tilstande i:

- **`Dashboard.tsx`** — den nuværende empty-state får retfit (allerede god, men bringes ind i komponenten for konsistens)
- **`Projects.tsx`** — i stedet for blank liste når der ingen projekter er
- **`BlindSpotsPanel.tsx`** — når et projekt ikke har blind spots endnu, vis "Upload dokumenter eller bed AI'en analysere" med CTA
- **`InsightsPanel.tsx`** — tilsvarende coaching når ingen indsigter
- **Visualiserings-kort på Dashboard** — guard'es allerede på `stats.assessed`; tilføj fælles "Vurder dit første projekt for at åbne dette"-mini-empty-state i de tilfælde hvor man har ét projekt men 0 vurderede

i18n-nøgler under `emptyStates.*`.

## 5. Progress-indikator pr. projekt (forslag #11)

**Ny komponent:** `src/components/projects/ProjectProgress.tsx`

5 trin med tjek-logik baseret på eksisterende felter:

| Trin | Færdig når |
|------|-----------|
| 1. Projekt oprettet | altid (når kortet vises) |
| 2. Morfologi udfyldt | `morphology` har alle 12 dimensioner |
| 3. Dokumenter uploadet | `documents.count > 0` for projektet |
| 4. AI-indsigt genereret | `dna_code !== null` |
| 5. Handlinger reviewet | mindst én `blind_spots.status = 'acknowledged'` eller `'addressed'` |

**Vises to steder:**
- **`ProjectCard.tsx`** — kompakt: en 5-prikket linje med tooltip på hver, plus tekst "3 af 5 trin" og en tynd gold progress-bar
- **`ProjectDetail.tsx`** øverst — fuld variant med klikbare trin der scroller/navigerer til den relevante sektion, og en "Næste skridt"-CTA der peger på første ufærdige trin

Tællingen sker via et nyt hook `usePortfolio`-udvidelse: vi henter `documents` count per projekt og blind-spot statusser i samme query (én ekstra `select` med `count`).

## 6. Project knowledge — husk hele forslagslisten

Tilføj `mem://product/ux-improvement-roadmap.md` (type: feature) der opsummerer alle 18 forslag fra forrige tur, grupperet under: Onboarding, Hjælp i konteksten, Navigation, Mikrointeraktioner, Tilgængelighed. Marker #1, #3, #4, #11 som "leveret" og resten som "afventer". Tilføj reference i `mem://index.md`.

## Verifikation

- Ny bruger: signup → dashboard → welcome modal pops op → "Udforsk demo" → lander på demo-projekt med fuld data → kan se progress (5/5) og DNA-kode
- Eksisterende bruger med `onboarded_at`: ingen modal
- Tomme tilstande viser ny coaching-komponent på Dashboard, Projects, Blind Spots, Insights
- ProjectCard viser progress-prikker; ProjectDetail viser fuld progress-stripe øverst
- Demo-projekt har gold "Demo"-badge og kan slettes
- Mem-fil opdateret og synlig i index

## Tekniske noter

- Edge function til demo bruger service-role klient internt; godkender brugeren via `Authorization` header som de andre PRISM-edge functions
- Ingen ændringer i `morphologyConfig.ts`-strukturen; demo-data lægges ind med samme `{selectedIndex, selectedValue}`-format
- Filer der ændres/oprettes:
  - Migration (én)
  - `src/components/onboarding/WelcomeModal.tsx` (ny)
  - `src/components/empty/EmptyState.tsx` (ny)
  - `src/components/projects/ProjectProgress.tsx` (ny)
  - `supabase/functions/seed-demo-project/index.ts` (ny) + tilføjelse i `supabase/config.toml`
  - `src/hooks/usePortfolio.ts` (udvidelse med doc count + blind spot status)
  - `src/pages/Dashboard.tsx` (mount WelcomeModal + brug EmptyState)
  - `src/pages/Projects.tsx`, `src/pages/ProjectDetail.tsx`
  - `src/components/projects/ProjectCard.tsx` (badge + progress)
  - `src/components/insights/BlindSpotsPanel.tsx`, `InsightsPanel.tsx`
  - `src/locales/en/common.json` + `src/locales/da/common.json`
  - `mem://product/ux-improvement-roadmap.md` + `mem://index.md`
