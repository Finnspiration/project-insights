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
resolve; `bun run typecheck` covers types for the same files.

## Typechecking

```sh
bun run typecheck   # tsc -p tsconfig.app.json --noEmit
```

Use the script, not `tsc --noEmit`. The root `tsconfig.json` is a
solution-style config with `"files": []` and project references, so running
`tsc` against it checks **zero files** and exits 0 — it looks like a passing
typecheck while verifying nothing. That silence let a refactor ship with
missing `useRef` imports; the correct invocation catches it as TS2304.

Current coverage:

| Module | What it pins down |
|---|---|
| `_shared/morphology.ts` | DNA code generation, the legacy `{selectedValue}` shape, key ordering |
| `_shared/subscription.ts` | Tier limits, including the `pro` / `professional` spelling split |
| `src/lib/idgScoring.ts` | That the radar, weather and evidence numbers agree, and the scoring rules |
| `src/lib/weatherReading.ts` | The four weather indices: bounds, headroom for evidence, and that each explains itself |
| `src/lib/weatherInsights.ts` | That each interpretation rule fires for the right reason — and stays quiet otherwise |
| `src/lib/blobGestures.ts` | The five blob gestures: bounds, direction, and that each names its own drivers |
| `src/lib/blobSignature.ts` | The flat portrait mark: determinism, that shapes stay inside the box, and that two assessments never collapse onto the same mark |
| `src/lib/morphologyDiff.ts` | What changed between two assessments: direction, distance, and which gestures moved |
