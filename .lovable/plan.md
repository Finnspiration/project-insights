
# Global Design Refresh — Emerald Prestige + Architectural

Replace the default Inter + blue/purple stack with a cohesive Emerald Prestige palette and Urbanist/Epilogue typography. Light mode primary; dark mode kept consistent. Existing component code keeps working because we change only tokens — then we layer in a focused restyle of the landing page and dashboard for impact.

## 1. Typography — load Urbanist + Epilogue

**`index.html`** — replace the Inter `<link>` with:
- Urbanist (weights 500/600/700/800) — headings & display
- Epilogue (weights 400/500/600) — body & UI

**`tailwind.config.ts`** — extend `fontFamily`:
- `sans` → `['Epilogue', 'system-ui', 'sans-serif']` (body default)
- `display` → `['Urbanist', 'system-ui', 'sans-serif']` (headings)

**`src/index.css`** — under `@layer base`, add `h1,h2,h3,h4,h5 { @apply font-display tracking-tight; }` so existing headings adopt Urbanist with zero component edits.

## 2. Palette — Emerald Prestige tokens (HSL)

Rewrite `:root` and `.dark` in `src/index.css`. Anchors:
- Emerald deep `#064e3b` → `158 85% 13%`
- Emerald mid `#0d7a5f` → `162 80% 26%`
- Gold `#c9a84c` → `44 56% 54%`
- Cream `#f5f0e0` → `45 56% 92%`

**Light (`:root`):**
- `--background: 45 40% 97%` (warm cream-tinted off-white)
- `--foreground: 158 50% 10%` (deep emerald-black)
- `--card: 0 0% 100%`, `--card-foreground: 158 50% 10%`
- `--primary: 162 80% 22%` (emerald mid-deep), `--primary-foreground: 45 56% 95%`
- `--secondary: 44 56% 54%` (gold), `--secondary-foreground: 158 60% 10%`
- `--accent: 44 70% 65%` (lighter gold), `--accent-foreground: 158 60% 10%`
- `--muted: 45 25% 93%`, `--muted-foreground: 158 15% 35%`
- `--success: 162 70% 32%` (in-palette green, replaces teal)
- `--warning: 38 85% 48%` (warmer amber that harmonizes with gold)
- `--destructive: 0 70% 45%` (slightly desaturated to sit beside emerald)
- `--border: 45 20% 86%`, `--input: 45 20% 86%`, `--ring: 162 80% 30%`
- Sidebar tokens shifted to cream/emerald family (background `45 30% 96%`, accent `45 25% 90%`, primary `158 85% 15%`)

**Dark (`.dark`):**
- `--background: 158 50% 7%`, `--foreground: 45 40% 94%`
- `--card: 158 45% 11%`, `--primary: 44 56% 58%` (gold leads in dark for contrast), `--secondary: 162 70% 30%`
- `--border / --input: 158 30% 18%`, `--ring: 44 56% 58%`
- Sidebar mirrors with emerald-charcoal surfaces

**Custom tokens (rewritten):**
- `--gradient-primary: linear-gradient(135deg, hsl(162 80% 22%), hsl(44 56% 54%))` — emerald → gold
- `--gradient-hero: linear-gradient(180deg, hsl(45 40% 97%), hsl(162 30% 92%))`
- `--shadow-elegant: 0 20px 50px -20px hsl(162 80% 15% / 0.25)`
- `--shadow-gold: 0 0 40px hsl(44 56% 54% / 0.25)`
- Keep `--transition-smooth` as-is

The `.gradient-primary`, `.gradient-hero`, `.text-gradient` utilities already read these tokens — every existing `from-primary to-secondary`, `gradient-primary`, `text-gradient` usage updates automatically.

## 3. Hardcoded color sweep

Audit shows minimal hardcoded values; clean the few that exist:
- `selected-row` keyframe in `index.css` uses raw `rgba(59,130,246,...)` (blue) → swap to `hsl(var(--primary) / ...)`.
- Dashboard stat-card icons currently use `text-green-500`, `text-orange-500`, `text-blue-500`, `text-purple-500` → re-token to `text-success`, `text-warning`, `text-accent`, `text-primary` for a unified palette.

## 4. Landing page restyle

Goal: editorial, architectural feel — generous whitespace, big Urbanist display type, gold as the precise accent (never the dominant color).

- **`Hero.tsx`**: switch CTA from `gradient-primary text-white` to solid `bg-primary text-primary-foreground` with `shadow-elegant`; add a `font-display` class on the headline with tighter `leading-[0.95] tracking-tight`; reduce gradient orb opacity, swap blur color to emerald.
- **`Navbar.tsx`**: drop `text-gradient` on the wordmark in favor of solid `font-display font-bold tracking-tight text-foreground` with a small gold dot/accent — feels more premium than gradient text. Primary CTA → `bg-primary text-primary-foreground`.
- **`Features.tsx`**: card icons go from `gradient-primary` round squares to outlined cards with a gold underline on hover; card padding up.
- **`HowItWorks.tsx`**: numbered circles become outlined emerald rings with gold numerals (`border-2 border-primary text-secondary font-display`).
- **`CallToAction.tsx`**: keep `gradient-primary` band (emerald→gold reads beautifully here); ensure interior text uses `text-primary-foreground`.
- **`Footer.tsx`**: replace `text-gradient` wordmark with the same Navbar treatment for consistency.

## 5. Dashboard restyle

- **`DashboardLayout.tsx`**: replace the gradient page-title with `font-display font-semibold text-foreground` plus a thin gold rule beneath.
- **`Dashboard.tsx`**:
  - Empty-state heading: drop gradient text → `font-display` with a single gold accent word.
  - Stat cards: switch flat `Card` to a tighter variant — increase header padding, use `font-display` for the big number, replace bespoke icon colors with semantic tokens (step 3).
  - Section headers (`Overview`, `Recent Projects`, `Recommended Actions`): `font-display font-semibold` with a small uppercase eyebrow label above in `text-secondary tracking-widest text-xs`.
  - Recommendation card icon backgrounds: `bg-secondary/10 text-secondary` (gold accent) instead of `bg-primary/10`.
- **`AppSidebar.tsx`** (light touch): active item uses `bg-primary/10 text-primary border-l-2 border-secondary` for an editorial accent rail.

## 6. Verification

- Build passes with no TS errors.
- Visit `/` (landing), `/dashboard`, `/projects`, `/auth` — palette reads emerald + gold, headings are Urbanist, body is Epilogue, no leftover blue/purple.
- Dark mode toggle (if exposed) renders without contrast regressions on cards, buttons, sidebar.
- Existing visualizations (ProjectConstellation, IDG radar, etc.) keep working — they already read from `--primary`, `--success`, `--warning`.

## Technical notes

- All changes are token-level + a handful of presentation classes; no business logic, no i18n keys, no data flow touched.
- Files edited: `index.html`, `tailwind.config.ts`, `src/index.css`, `src/pages/Dashboard.tsx`, `src/pages/Auth.tsx` (gradient text only), `src/components/landing/{Hero,Features,HowItWorks,CallToAction}.tsx`, `src/components/layout/{Navbar,Footer,DashboardLayout,AppSidebar}.tsx`.
- A `mem://design/global-tokens` memory file will be added recording the palette + type system so future work stays consistent.
