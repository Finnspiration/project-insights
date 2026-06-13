---
name: UX Improvement Roadmap
description: Full list of 18 UX improvements proposed for PRISM; tracks which are shipped vs pending
type: feature
---
# UX Improvement Roadmap

Tracks the 18 UX improvements proposed in the brainstorming session. Use this as the source of truth before suggesting new UX work — check if it's already on the list and update status when items ship.

## Status legend
- ✅ Shipped
- ⏳ Pending

## Onboarding & first experience
1. ✅ **Welcome modal** — first-run dialog on Dashboard, two paths (explore demo / create own)
2. ⏳ Product tour / walkthrough with spotlight on sidebar, AI button, dashboard cards
3. ✅ **Demo project** — `seed-demo-project` edge function, idempotent, marked `is_demo`
4. ✅ **Empty-state coaching** — shared `EmptyState` component on Dashboard, Projects, BlindSpotsPanel

## Help & context
5. ⏳ "?" popovers on each visualization
6. ⏳ Coach tips in Morphology Wizard per dimension
7. ⏳ AI-suggested first questions in GlobalAIChat based on current page
8. ⏳ Keyboard shortcuts + cheatsheet

## Navigation & orientation
9. ⏳ Breadcrumbs on inner pages
10. ⏳ Global search in topbar
11. ✅ **Progress indicator per project** — `ProjectProgress` (compact on cards, full on ProjectDetail)

## Microinteractions & feedback
12. ⏳ Loading skeletons + optimistic updates (partial today)
13. ⏳ Branded toasts for all actions
14. ⏳ Tooltips on icon-only buttons
15. ⏳ Confirmation dialogs for destructive actions (partial — delete project covered)

## Accessibility & polish
16. ⏳ Full a11y pass (alt texts, aria-labels, contrast)
17. ⏳ Danish-first proofreading of i18n strings
18. ⏳ Responsive fixes for visualizations on mobile

## Related implementation notes
- Onboarding state lives on `user_profiles.onboarded_at` (+ `onboarding_step`).
- Demo projects flagged via `projects.is_demo = true`; show gold "Demo" badge on `ProjectCard`.
- 5 progress steps: created → morphology → documents → dna → reviewed (any blind_spot status acknowledged/addressed).
- `usePortfolio` enriches each project with `documentCount` and `hasReviewedActions` for the compact progress strip.
