// Run with: deno test --no-check --sloppy-imports --config tests/deno.json src/components/visualizations/blob3d/blobMapping3D.test.ts
//
// The contract this file holds is the one the blob's own subtitle makes: it
// claims to show twelve dimensions, so all twelve have to stay readable — in
// every combination, not just the tidy ones. Two ways that promise gets broken:
//
//   1. A dimension stops changing anything, so it is in the legend but not in
//      the picture.
//   2. A combination drives some brightness past full, where the centre clips
//      to white and further elements stop being visible at all. That is the
//      failure that prompted these tests: additive layers stacking until the
//      middle of the blob was a white hole.
//
// Both are checked here across every single-dimension variation and a wide
// deterministic sample of whole combinations.

import { assert, assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { mapMorphologyTo3DBlob } from './blobMapping3D.ts';

const OPTIONS: Record<string, string[]> = {
  complexity: ['simple', 'complicated', 'complex', 'chaotic'],
  stakeholder: ['unified', 'cooperative', 'competitive', 'adversarial'],
  knowledge: ['routine', 'adaptive', 'innovative', 'breakthrough'],
  cultural: ['mono', 'crossfunctional', 'crossorg', 'crosscultural'],
  temporal: ['sprint', 'project', 'program', 'transformation'],
  organizational: ['red', 'amber', 'orange', 'green', 'teal'],
  challenge: ['technical', 'social', 'political', 'cognitive', 'adaptive'],
  development: ['being', 'thinking', 'relating', 'collaborating', 'acting'],
  resources: ['rich', 'balanced', 'constrained', 'scarce'],
  change: ['incremental', 'transitional', 'transformational', 'disruptive'],
  information: ['centralized', 'hierarchical', 'network', 'distributed'],
  risk: ['low', 'moderate', 'high', 'extreme'],
};

const DIMENSIONS = Object.keys(OPTIONS);

const BASELINE: Record<string, string> = Object.fromEntries(
  DIMENSIONS.map((d) => [d, OPTIONS[d][1]]),
);

/** Deterministic sample of whole combinations — same set on every run. */
function* sampleCombinations(count: number): Generator<Record<string, string>> {
  let seed = 20260804;
  const next = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff);
  for (let i = 0; i < count; i++) {
    yield Object.fromEntries(
      DIMENSIONS.map((d) => [d, OPTIONS[d][next() % OPTIONS[d].length]]),
    );
  }
}

const describe = (m: Record<string, string>) => JSON.stringify(m);

Deno.test('every dimension changes the picture — none is in the legend only', () => {
  for (const dimension of DIMENSIONS) {
    const renders = OPTIONS[dimension].map((option) =>
      JSON.stringify(mapMorphologyTo3DBlob({ ...BASELINE, [dimension]: option }))
    );
    const distinct = new Set(renders);
    assert(
      distinct.size > 1,
      `${dimension} draws the same blob for all ${OPTIONS[dimension].length} of its answers`,
    );
  }
});

Deno.test('no combination drives a brightness past full', () => {
  // Above 1 an emissive or glow does not get brighter, it gets whiter and
  // flatter — and anything drawn on top of it stops being distinguishable.
  const CEILINGS: Record<string, number> = {
    glowIntensity: 1,
    emissiveIntensity: 1,
    outerAuraIntensity: 1,
    idgOuterIntensity: 1,
    coreGlow: 1,
    coreVisibility: 1,
    knowledgeGlowIntensity: 1,
    culturalGlowIntensity: 1,
  };

  for (const morphology of sampleCombinations(3000)) {
    const data = mapMorphologyTo3DBlob(morphology) as unknown as Record<string, number>;
    for (const [field, ceiling] of Object.entries(CEILINGS)) {
      const value = data[field];
      if (value === undefined) continue;
      assert(
        value >= 0 && value <= ceiling,
        `${field} = ${value} (ceiling ${ceiling}) for ${describe(morphology)}`,
      );
    }
  }
});

Deno.test('the body is never invisible, however the dimensions fall', () => {
  for (const morphology of sampleCombinations(3000)) {
    const data = mapMorphologyTo3DBlob(morphology);

    assert(data.lobeCount >= 1, `no body at all for ${describe(morphology)}`);
    assert(data.lobeSize > 0, `zero-sized body for ${describe(morphology)}`);
    // Fully transmissive glass against a bright environment is a white hole.
    assert(
      data.transmission <= 0.85,
      `transmission ${data.transmission} for ${describe(morphology)}`,
    );
  }
});

Deno.test('a half-finished assessment still draws something', () => {
  const data = mapMorphologyTo3DBlob({ complexity: 'complex' });
  assert(data.lobeCount >= 1);
  assert(Number.isFinite(data.transmission));
  assertEquals(typeof data.primaryColor, 'string');
});

Deno.test('the same assessment always draws the same blob', () => {
  for (const morphology of sampleCombinations(200)) {
    assertEquals(
      JSON.stringify(mapMorphologyTo3DBlob(morphology)),
      JSON.stringify(mapMorphologyTo3DBlob(morphology)),
    );
  }
});
