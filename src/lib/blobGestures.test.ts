// Run with: deno test --no-check --sloppy-imports --config tests/deno.json src/lib/blobGestures.test.ts
//
// The whole point of the five gestures is that a person can name what they are
// looking at. So each one has to move in the direction its name promises, and
// two projects that differ in an obvious way have to differ in the gestures.

import { assert, assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { gestureValues, readBlobGestures } from './blobGestures.ts';

const UNIFIED_SIMPLE = {
  complexity: 'simple', stakeholder: 'unified', knowledge: 'routine', cultural: 'mono',
  temporal: 'transformation', organizational: 'teal', challenge: 'technical', development: 'being',
  resources: 'rich', change: 'incremental', information: 'centralized', risk: 'low',
};

const SPLIT_CHAOTIC = {
  complexity: 'chaotic', stakeholder: 'adversarial', knowledge: 'breakthrough', cultural: 'crosscultural',
  temporal: 'sprint', organizational: 'red', challenge: 'political', development: 'acting',
  resources: 'scarce', change: 'disruptive', information: 'distributed', risk: 'extreme',
};

Deno.test('every gesture stays within 0-1', () => {
  for (const morphology of [UNIFIED_SIMPLE, SPLIT_CHAOTIC, {}, null]) {
    for (const [key, value] of Object.entries(gestureValues(morphology))) {
      assert(value >= 0 && value <= 1, `${key} = ${value}`);
    }
  }
});

Deno.test('an unanswered assessment sits in the middle rather than at an extreme', () => {
  const values = gestureValues({});
  for (const [key, value] of Object.entries(values)) {
    assertEquals(value, 0.5, `${key} should be neutral`);
  }
});

Deno.test('the gestures move in the direction their names promise', () => {
  const calm = gestureValues(UNIFIED_SIMPLE);
  const wild = gestureValues(SPLIT_CHAOTIC);

  assert(calm.cohesion > 0.9, `whole body expected, got ${calm.cohesion}`);
  assert(wild.cohesion < 0.15, `split apart expected, got ${wild.cohesion}`);

  assert(calm.roughness < 0.15, `smooth expected, got ${calm.roughness}`);
  assert(wild.roughness > 0.9, `agitated expected, got ${wild.roughness}`);

  assert(calm.clarity > 0.8, `see-through expected, got ${calm.clarity}`);
  assert(wild.clarity < 0.35, `opaque expected, got ${wild.clarity}`);

  assert(calm.orbit < 0.3, `still expected, got ${calm.orbit}`);
  assert(wild.orbit > 0.9, `circling expected, got ${wild.orbit}`);

  assert(calm.strain < 0.15, `calm expected, got ${calm.strain}`);
  assert(wild.strain > 0.9, `under pressure expected, got ${wild.strain}`);
});

Deno.test('a dimension that moves a gesture is reported as its driver', () => {
  const gestures = readBlobGestures(SPLIT_CHAOTIC);

  assertEquals(gestures.cohesion.drivers.length, 1);
  assertEquals(gestures.cohesion.drivers[0].value, 'adversarial');
  assert(gestures.cohesion.drivers[0].dimensionKey.endsWith('stakeholder.title'));

  // The two-dimension gestures name both.
  assertEquals(gestures.strain.drivers.map((d) => d.value).sort(), ['extreme', 'scarce']);
  assertEquals(gestures.orbit.drivers.map((d) => d.value).sort(), ['disruptive', 'sprint']);
});

Deno.test('a gesture is the mean of the dimensions that feed it', () => {
  const gestures = readBlobGestures(SPLIT_CHAOTIC);
  for (const gesture of Object.values(gestures)) {
    const mean = gesture.drivers.reduce((t, d) => t + d.weight, 0) / gesture.drivers.length;
    assertEquals(gesture.value, Math.round(mean * 100) / 100, gesture.key);
  }
});

Deno.test('the three previously invisible dimensions now drive something', () => {
  // temporal and change were worth one visual parameter each out of 76.
  const still = gestureValues({ ...UNIFIED_SIMPLE, temporal: 'transformation', change: 'incremental' });
  const circling = gestureValues({ ...UNIFIED_SIMPLE, temporal: 'sprint', change: 'disruptive' });
  assert(circling.orbit - still.orbit > 0.6, 'temporal and change must be visible');
});

Deno.test('a single answer changes the picture, so the portrait is not all-or-nothing', () => {
  const base = gestureValues(UNIFIED_SIMPLE);
  const oneChange = gestureValues({ ...UNIFIED_SIMPLE, stakeholder: 'adversarial' });
  assert(base.cohesion - oneChange.cohesion > 0.9);
  // and nothing else moved
  assertEquals(oneChange.roughness, base.roughness);
  assertEquals(oneChange.strain, base.strain);
});

Deno.test('legacy object-shaped morphology reads identically', () => {
  const flat = gestureValues(SPLIT_CHAOTIC);
  const legacy = gestureValues(
    Object.fromEntries(Object.entries(SPLIT_CHAOTIC).map(([k, v]) => [k, { selectedValue: v }])),
  );
  assertEquals(legacy, flat);
});
