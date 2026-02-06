

# PRISM - Komplet Analyse: Fejl, Mangler og Muligheder

## 1. FEJL (Bugs)

### 1.1 InsightsPanel: Forkert brug af useState som useEffect (KRITISK)
**Fil:** `src/components/insights/InsightsPanel.tsx` linje 81-83
```tsx
useState(() => {
  fetchExistingInsights();
});
```
`useState` bruges som `useEffect` til at kalde `fetchExistingInsights()` ved mount. Dette er en anti-pattern, der kan foraarsage uforudsigeligt opfoersel. `useState`'s initializer er beregnet til at beregne en startvaerdi, IKKE til at udfoere side-effekter. Det boer vaere `useEffect`.

### 1.2 Dashboard: Manglende user_id filter paa projects-query
**Fil:** `src/pages/Dashboard.tsx` linje 53-56
```tsx
const { data: projects } = await supabase
  .from('projects')
  .select('id, name, description, dna_code, status, created_at')
  .order('created_at', { ascending: false });
```
Der mangler `.eq('user_id', user.id)` filter. Kun RLS forhindrer at andre brugeres projekter vises. I `Projects.tsx` bruges korrekt `.eq('user_id', user.id)`. Bor tilfojes for konsistens og defense-in-depth.

### 1.3 MorphologyBlob: Redundant null-check
**Fil:** `src/components/visualizations/MorphologyBlob.tsx` linje 250
En anden `if (!morphology)` check eksisterer paa linje 250, men er allerede haandteret paa linje 33-43. Den yderste returnerer et Card, mens den indre returnerer et andet Card. Den indre er unoedvendig og kan aldrig naaes.

### 1.4 Footer copyright er forældet
**Fil:** `src/locales/en/common.json` og `src/locales/da/common.json`
Copyright viser "2025" men nuvaerende dato er 2026. Bor vaere dynamisk eller opdateret.

### 1.5 ErrorBoundary er hardcoded paa dansk
**Fil:** `src/components/ErrorBoundary.tsx`
Tekst er hardcoded paa dansk ("Der opstod en fejl", "Noget gik galt...", "Prøv igen") uden i18n support. Boer bruge oversaettelsessystemet.

### 1.6 MorphologyBlob: `onMorphologyUpdate` prop sendes stadig fra ProjectDetail
**Fil:** `src/pages/ProjectDetail.tsx` linje 536-537
```tsx
<MorphologyBlob 
  morphology={project.morphology} 
  projectId={project.id}
  onMorphologyUpdate={updateProjectMorphology}
/>
```
Selvom vi netop har separeret blob-aendringer fra database-persistering, sendes `onMorphologyUpdate` stadig til `MorphologyBlob`. Denne prop bruges ikke laengere og bor fjernes for at undgaa forvirring.

### 1.7 Auth: Hardcoded tekst uden i18n
**Fil:** `src/pages/Auth.tsx`
Flere tekster er ikke oversat:
- Linje 120: `'Welcome to PRISM!'` (hardcoded)
- Linje 153: `'Access your project intelligence platform'` (hardcoded)
- Linje 147: `'See What You Cannot See'` (hardcoded)

### 1.8 Settings page mangler DashboardLayout
**Fil:** `src/pages/Settings.tsx`
Settings bruger sin egen header-layout i stedet for `DashboardLayout`, hvilket goer at sidebar forsvinder paa Settings-siden. Alle andre sider (Dashboard, Projects, ProjectDetail) bruger `DashboardLayout`.

---

## 2. SIKKERHEDSPROBLEMER

### 2.1 RLS Policies: Overly Permissive (WARN fra linter)
Database-linteren rapporterer 2 warnings om "RLS Policy Always True" - der er mindst to policies med `USING (true)` eller `WITH CHECK (true)` paa INSERT/UPDATE/DELETE operationer. Disse bor strammes til at checke `auth.uid() = user_id`.

### 2.2 Leaked Password Protection Disabled
Password-sikkerhed: Leaked password protection er deaktiveret. Bor aktiveres for at forhindre brugere i at bruge kendte kompromitterede passwords.

### 2.3 Function Search Path Mutable
Database-funktioner har ikke sat `search_path` parameteren, hvilket kan vaere en sikkerheds-saarbarhed.

---

## 3. MANGLER (Missing Features ifølge PRD)

### 3.1 Pricing/Subscription side mangler
PRD specificerer en Pricing-side med 4 tiers (Free, Professional, Team, Enterprise). Navbar viser "Coming Soon" badge ved Pricing-link. Der er ingen pricing-side implementeret.

### 3.2 Stripe integration mangler
PRD kraever Stripe integration til betalingshaandtering. Der er en `subscriptions` tabel, men ingen Stripe-integration er implementeret. Tier-aendringer er ikke mulige.

### 3.3 "Watch Demo" CTA goer ingenting
Landing page Hero har en "Watch Demo" knap, men den linker ikke til noget.

### 3.4 Hero CTA "Start Free" linker ikke
"Start Free"-knappen paa landing page navigerer ikke til `/auth`.

### 3.5 AI Chat: Beskeder gemmes ikke i database
Ifoelje PRD skal chat-beskeder gemmes i `chat_messages` tabellen, men den tabel eksisterer ikke i types.ts. Beskederne holdes kun i React state og forsvinder ved page reload.

### 3.6 AI Message Counter nulstilles aldrig
`ai_messages_used_this_month` inkrementeres men nulstilles aldrig ved maanedsskifte. Der mangler en cron-job eller database-funktion til at resette taelleren.

### 3.7 Manglende "Forgot Password" funktionalitet
Auth-siden har oversaettelses-noegler til "Forgot password?" men der er ingen implementering af password-reset flow.

### 3.8 About-sektion mangler
Navbar linker til `#about`, men der er ingen About-sektion paa landing page.

### 3.9 Index.tsx er en ubrugt placeholder
`src/pages/Index.tsx` viser "Welcome to Your Blank App" men bruges aldrig (landing page er paa `/`).

---

## 4. KODEQUALITET OG ARKITEKTUR

### 4.1 Inkonsistent sprog-haandtering
Nogle steder bruges `i18n.language`, andre `profile?.preferred_language`. F.eks.:
- `MorphologyBlob` bruger `i18n.language`
- `ProjectDetail` bruger `profile?.preferred_language`
- `Dashboard` bruger `i18n.language` for project names

### 4.2 Duplikeret Project interface
`Project` interface er defineret separat i:
- `Dashboard.tsx`
- `Projects.tsx`
- `ProjectDetail.tsx`
- `ProjectCard.tsx`

Bor centraliseres i en delt types-fil.

### 4.3 Ingen loading state for sprog-skift
Naar sproget aendres, re-renderes hele applikationen men der er ingen loading indikator eller smooth transition.

### 4.4 date-fns locale mangler
`formatDistanceToNow` og `format` i Dashboard og ProjectDetail bruger altid engelsk datoformat, uanset valgt sprog. Dansk locale bor importeres og bruges.

---

## 5. MULIGHEDER (Opportunities)

### 5.1 Offline/Caching support
Ingen data caching - hver navigation henter alle data fra scratch. React Query er installeret men bruges kun i `useArchetype`. Alle andre data-fetches bruger direkte useState+useEffect.

### 5.2 Realtime updates
Supabase Realtime er tilgaengelig men ikke brugt. Kunne bruges til:
- Live opdateringer naar dokumenter processeres
- Samarbejds-funktionalitet (Team tier)

### 5.3 Export funktionalitet
PRD naevner eksport af visualiseringer som PNG og eksport af samtaler som insights. Ingen af disse er implementeret.

### 5.4 Responsive forbedringer
AI Chat panelet er hardcoded til `w-96` (384px) og har ikke mobil-tilpasning. Paa mobil vil det daekke hele skaermen uhensigtsmæssigt.

### 5.5 Dark mode
`next-themes` er installeret men dark mode toggle er ikke eksponeret i UI'et.

### 5.6 Onboarding flow
Der er ingen guided onboarding for nye brugere. PRD beskriver en 5-trins onboarding flow (Create Project -> Upload Documents -> Morphological Assessment -> Processing -> Dashboard Reveal).

### 5.7 Team collaboration
PRD specificerer Team tier med 5 team seats og delt adgang. Ingen team/workspace-funktionalitet er implementeret.

---

## 6. ANBEFALET PRIORITERING

### Høj prioritet (fix nu):
1. Fix InsightsPanel `useState` bug (kan foraarsage uforudsigeligt opfoersel)
2. Tilfoej `user_id` filter i Dashboard queries
3. Fjern ubrugt `onMorphologyUpdate` prop fra MorphologyBlob
4. Fix Settings page til at bruge DashboardLayout
5. Fix RLS policies (sikkerhed)

### Medium prioritet:
6. Tilfoej navigation til Hero CTA knapper
7. Implementer i18n i ErrorBoundary og Auth hardcoded tekst
8. Centraliser Project type-definition
9. Tilfoej date-fns dansk locale
10. Fix copyright aarstal

### Lav prioritet (fremtidige features):
11. Pricing-side og Stripe integration
12. Password reset flow
13. Chat-besked persistering
14. AI message counter reset (cron job)
15. Export funktionalitet
16. Dark mode toggle
17. Mobil-optimering af AI Chat

