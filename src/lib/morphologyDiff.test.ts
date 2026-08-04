// Run with: deno test --no-check --sloppy-imports --config tests/deno.json src/lib/morphologyDiff.test.ts
//
// The timeline shows that a project changed shape. This is the sentence that
// says what moved, so it has to be right about direction and size — "risk went
// from moderate to extreme" is a different conversation from "risk changed".

import { assert, assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { diffMorphology } from './morphologyDiff.ts';

const JUNE = {
  complexity: 'complicated', stakeholder: 'cooperative', knowledge: 'adaptive', cultural: 'crossfunctional',
  temporal: 'project', organizational: 'orange', challenge: 'technical', development: 'thinking',
  resources: 'balanced', change: 'transitional', information: 'network', risk: 'moderate',
};

Deno.test('an unchanged assessment reports nothing', () => {
  const diff = diffMorphology(JUNE, JUNE);
  assertEquals(diff.changes, []);
  assertEquals(diff.gestures, []);
  assertEquals(diff.unchanged, true);
});

Deno.test('a change carries its direction and how far it moved', () => {
  const diff = diffMorphology(JUNE, { ...JUNE, risk: 'extreme' });
  assertEquals(diff.changes.length, 1);

  const [change] = diff.changes;
  assertEquals(change.dimension, 'risk');
  assertEquals(change.from, 'moderate');
  assertEquals(change.to, 'extreme');
  assertEquals(change.direction, 'forward');
  assertEquals(change.steps, 2); // moderate -> high -> extreme
});

Deno.test('moving back down the scale is reported as backward', () => {
  const diff = diffMorphology(JUNE, { ...JUNE, complexity: 'simple' });
  assertEquals(diff.changes[0].direction, 'backward');
  assertEquals(diff.changes[0].steps, 1);
});

Deno.test('answering a dimension for the first time is not the same as changing it', () => {
  const partial = { complexity: 'complex' };
  const diff = diffMorphology(partial, { ...partial, risk: 'high' });
  assertEquals(diff.changes[0].direction, 'set');
  assertEquals(diff.changes[0].from, undefined);
});

Deno.test('the biggest move is reported first', () => {
  const diff = diffMorphology(JUNE, {
    ...JUNE,
    risk: 'extreme',        // 2 steps
    complexity: 'complex',  // 1 step
    stakeholder: 'adversarial', // 2 steps
  });
  const steps = diff.changes.map((c) => c.steps);
  assertEquals(steps, [...steps].sort((a, b) => b - a));
  assertEquals(diff.changes.length, 3);
});

Deno.test('gesture shifts explain what the portrait will look like', () => {
  const diff = diffMorphology(JUNE, { ...JUNE, stakeholder: 'adversarial' });
  const cohesion = diff.gestures.find((g) => g.gesture === 'cohesion')!;

  assert(cohesion, 'a stakeholder change must move cohesion');
  assert(cohesion.delta < -0.5, `expected the body to split, got ${cohesion.delta}`);
});

Deno.test('a change too small to see in the portrait is not claimed', () => {
  // challenge feeds none of the five gestures, so the shape does not move.
  const diff = diffMorphology(JUNE, { ...JUNE, challenge: 'political' });
  assertEquals(diff.changes.length, 1);
  assertEquals(diff.gestures, []);
});

Deno.test('gesture shifts are ordered by how much they move', () => {
  const diff = diffMorphology(JUNE, {
    ...JUNE,
    stakeholder: 'adversarial',
    complexity: 'chaotic',
    risk: 'extreme',
    resources: 'scarce',
  });
  const sizes = diff.gestures.map((g) => Math.abs(g.delta));
  assertEquals(sizes, [...sizes].sort((a, b) => b - a));
});

Deno.test('legacy object-shaped snapshots compare correctly against flat ones', () => {
  const legacy = Object.fromEntries(Object.entries(JUNE).map(([k, v]) => [k, { selectedValue: v }]));
  assertEquals(diffMorphology(legacy, JUNE).unchanged, true);

  const diff = diffMorphology(legacy, { ...JUNE, risk: 'extreme' });
  assertEquals(diff.changes.length, 1);
  assertEquals(diff.changes[0].from, 'moderate');
});
