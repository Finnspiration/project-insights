// Run with: deno test --no-check --sloppy-imports --config tests/deno.json src/lib/blobSignature.test.ts
//
// The gallery is where the portrait is actually judged: twelve marks side by
// side, each a couple of centimetres across. Two things have to hold. The same
// assessment must always draw the same mark — a portrait that reshuffles on
// reload is not a portrait. And two projects that differ must produce outlines
// you can tell apart without reading the label.

import { assert, assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { buildBlobSignature } from './blobSignature.ts';

const WHOLE_CALM = {
  complexity: 'simple', stakeholder: 'unified', knowledge: 'routine', cultural: 'mono',
  temporal: 'transformation', organizational: 'teal', challenge: 'technical', development: 'being',
  resources: 'rich', change: 'incremental', information: 'centralized', risk: 'low',
};

const SPLIT_STORMY = {
  complexity: 'chaotic', stakeholder: 'adversarial', knowledge: 'breakthrough', cultural: 'crosscultural',
  temporal: 'sprint', organizational: 'red', challenge: 'political', development: 'acting',
  resources: 'scarce', change: 'disruptive', information: 'distributed', risk: 'extreme',
};

Deno.test('the same assessment always draws the same mark', () => {
  const a = buildBlobSignature(WHOLE_CALM);
  const b = buildBlobSignature(WHOLE_CALM);
  assertEquals(JSON.stringify(a), JSON.stringify(b));
});

Deno.test('a whole project is one body, a split one is several', () => {
  assertEquals(buildBlobSignature(WHOLE_CALM).lobes.length, 1);
  assert(buildBlobSignature(SPLIT_STORMY).lobes.length >= 3);
});

Deno.test('a split project is not simply a smaller one', () => {
  // Total ink stays comparable, so cohesion reads as arrangement rather than size.
  const area = (s: ReturnType<typeof buildBlobSignature>) =>
    s.lobes.reduce((total, lobe) => total + Math.PI * lobe.r * lobe.r, 0);

  const whole = area(buildBlobSignature(WHOLE_CALM));
  const split = area(buildBlobSignature(SPLIT_STORMY));
  const ratio = split / whole;
  assert(ratio > 0.6 && ratio < 1.7, `ink ratio ${ratio.toFixed(2)} is too lopsided`);
});

Deno.test('roughness changes the outline and nothing else', () => {
  const smooth = buildBlobSignature({ ...WHOLE_CALM, complexity: 'simple' });
  const rough = buildBlobSignature({ ...WHOLE_CALM, complexity: 'chaotic' });

  assertEquals(smooth.lobes.length, rough.lobes.length);
  assert(smooth.lobes[0].path !== rough.lobes[0].path, 'outline should differ');
  assertEquals(smooth.orbits.length, rough.orbits.length);
  assertEquals(smooth.fillOpacity, rough.fillOpacity);
});

Deno.test('a smooth body really is nearly circular', () => {
  const { lobes } = buildBlobSignature({ ...WHOLE_CALM, complexity: 'simple' });
  const lobe = lobes[0];
  const radii = lobe.path
    .slice(1, -1)
    .split('L')
    .map((point) => {
      const [x, y] = point.split(',').map(Number);
      return Math.hypot(x - lobe.cx, y - lobe.cy);
    });
  const spread = (Math.max(...radii) - Math.min(...radii)) / lobe.r;
  assert(spread < 0.06, `a simple project should be round, deviation was ${spread.toFixed(3)}`);
});

Deno.test('an agitated body is visibly disturbed but still one closed shape', () => {
  const { lobes } = buildBlobSignature({ ...WHOLE_CALM, complexity: 'chaotic' });
  const lobe = lobes[0];
  const radii = lobe.path
    .slice(1, -1)
    .split('L')
    .map((point) => {
      const [x, y] = point.split(',').map(Number);
      return Math.hypot(x - lobe.cx, y - lobe.cy);
    });
  const spread = (Math.max(...radii) - Math.min(...radii)) / lobe.r;
  assert(spread > 0.15, `expected a visible wobble, got ${spread.toFixed(3)}`);
  assert(Math.min(...radii) > 0, 'the outline must never fold through its own centre');
  assert(lobe.path.startsWith('M') && lobe.path.endsWith('Z'), 'path must be closed');
});

Deno.test('circling shows as orbits, stillness shows as none', () => {
  assertEquals(buildBlobSignature({ ...WHOLE_CALM, temporal: 'transformation', change: 'incremental' }).orbits.length, 0);
  assert(buildBlobSignature({ ...WHOLE_CALM, temporal: 'sprint', change: 'disruptive' }).orbits.length >= 2);
});

Deno.test('clarity drives how solid the body reads', () => {
  const clear = buildBlobSignature({ ...WHOLE_CALM, knowledge: 'routine', cultural: 'mono' });
  const opaque = buildBlobSignature({ ...WHOLE_CALM, knowledge: 'breakthrough', cultural: 'crosscultural' });
  assert(opaque.fillOpacity > clear.fillOpacity + 0.3);
});

Deno.test('everything stays inside the 100x100 box', () => {
  const cases = [WHOLE_CALM, SPLIT_STORMY, {}, { stakeholder: 'adversarial', complexity: 'chaotic' }];
  for (const morphology of cases) {
    for (const lobe of buildBlobSignature(morphology).lobes) {
      for (const point of lobe.path.slice(1, -1).split('L')) {
        const [x, y] = point.split(',').map(Number);
        assert(x > -2 && x < 102 && y > -2 && y < 102, `point ${x},${y} escapes the box`);
      }
    }
  }
});

Deno.test('different assessments produce different marks', () => {
  const seen = new Set<string>();
  const variants = [
    WHOLE_CALM,
    SPLIT_STORMY,
    { ...WHOLE_CALM, stakeholder: 'competitive' },
    { ...WHOLE_CALM, complexity: 'complex' },
    { ...WHOLE_CALM, change: 'disruptive' },
    { ...WHOLE_CALM, knowledge: 'breakthrough' },
  ];
  for (const morphology of variants) {
    seen.add(JSON.stringify(buildBlobSignature(morphology)));
  }
  assertEquals(seen.size, variants.length, 'two assessments collapsed onto the same mark');
});
