// Run with: deno test supabase/functions/_shared/morphology.test.ts
//
// The DNA code is a project's identity, so these cases pin down the two things
// that used to break it: the legacy { selectedValue } shape stringifying to
// "[object Object]", and the code depending on JS object key order.

import { assert, assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import {
  generateDnaCode,
  isDnaCodeCorrupt,
  isMorphologyComplete,
  MORPHOLOGY_DIMENSION_KEYS,
  normalizeMorphology,
} from './morphology.ts';

const FLAT = {
  complexity: 'complex',
  stakeholder: 'cooperative',
  knowledge: 'innovative',
  cultural: 'crossorg',
  temporal: 'transformation',
  organizational: 'green',
  challenge: 'adaptive',
  development: 'relating',
  resources: 'balanced',
  change: 'transformational',
  information: 'network',
  risk: 'moderate',
};

const LEGACY_OBJECT_SHAPE = Object.fromEntries(
  Object.entries(FLAT).map(([key, value], index) => [key, { selectedValue: value, selectedIndex: index }]),
);

const EXPECTED_DNA =
  'complex-cooperative-innovative-crossorg-transformation-green-adaptive-relating-balanced-transformational-network-moderate';

Deno.test('there are 12 dimensions', () => {
  assertEquals(MORPHOLOGY_DIMENSION_KEYS.length, 12);
});

Deno.test('flat morphology produces the DNA code', () => {
  assertEquals(generateDnaCode(FLAT), EXPECTED_DNA);
});

Deno.test('legacy object shape produces the same DNA code', () => {
  assertEquals(generateDnaCode(LEGACY_OBJECT_SHAPE), EXPECTED_DNA);
});

Deno.test('legacy object shape normalizes to flat strings', () => {
  assertEquals(normalizeMorphology(LEGACY_OBJECT_SHAPE), FLAT);
});

Deno.test('a row holding both shapes still produces the same DNA code', () => {
  const mixed = { ...FLAT, risk: { selectedValue: 'moderate' }, cultural: { selectedValue: 'crossorg' } };
  assertEquals(generateDnaCode(mixed), EXPECTED_DNA);
});

Deno.test('key insertion order does not affect the DNA code', () => {
  const reversed = Object.fromEntries(Object.entries(FLAT).reverse());
  assertEquals(generateDnaCode(reversed), EXPECTED_DNA);
});

Deno.test('the old join produced [object Object], the new one never does', () => {
  // What the previous implementations did, for the record.
  assert(Object.values(LEGACY_OBJECT_SHAPE).join('-').includes('[object Object]'));
  assert(!isDnaCodeCorrupt(generateDnaCode(LEGACY_OBJECT_SHAPE)));
});

Deno.test('historic key spellings are mapped to canonical dimensions', () => {
  assertEquals(normalizeMorphology({ primary: 'social' }).challenge, 'social');
  assertEquals(normalizeMorphology({ resource: 'scarce' }).resources, 'scarce');
  // A real value must win over the alias.
  assertEquals(normalizeMorphology({ challenge: 'technical', primary: 'social' }).challenge, 'technical');
});

Deno.test('a half-finished assessment stays half-finished', () => {
  assertEquals(generateDnaCode({ complexity: 'simple', risk: 'low' }), 'simple-low');
  assert(!isMorphologyComplete({ complexity: 'simple' }));
  assert(isMorphologyComplete(FLAT));
});

Deno.test('junk input is dropped rather than propagated', () => {
  assertEquals(generateDnaCode(null), '');
  assertEquals(generateDnaCode(undefined), '');
  assertEquals(
    normalizeMorphology({ complexity: 42, risk: '   ', cultural: null, temporal: 'sprint', bogus: 'x' }),
    { temporal: 'sprint' },
  );
});
