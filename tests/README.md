# Tests

The test suite runs on [Deno](https://deno.com), which needs no dependencies
beyond the runtime itself — the project's own toolchain (bun/vite) stays
untouched.

```sh
# Shared modules used by both the frontend and the edge functions
deno test supabase/functions/_shared/

# Frontend modules that import through the @/ and @shared/ aliases
deno test --no-check --sloppy-imports --config tests/deno.json src/lib/
```

`--no-check` skips type-checking the React-flavoured imports Deno does not
resolve; `bunx tsc --noEmit` covers types for the same files.

Current coverage:

| Module | What it pins down |
|---|---|
| `_shared/morphology.ts` | DNA code generation, the legacy `{selectedValue}` shape, key ordering |
| `_shared/subscription.ts` | Tier limits, including the `pro` / `professional` spelling split |
| `src/lib/idgScoring.ts` | That the radar, weather and evidence numbers agree, and the scoring rules |
| `src/lib/weatherReading.ts` | The four weather indices: bounds, headroom for evidence, and that each explains itself |
| `src/lib/weatherInsights.ts` | That each interpretation rule fires for the right reason — and stays quiet otherwise |
