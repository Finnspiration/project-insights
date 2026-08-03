// Run with: deno test --no-check --sloppy-imports --config tests/deno.json src/lib/weatherReading.test.ts
//
// The indices replace 21 marks on the canvas with four numbers, so those four
// numbers have to be defensible: bounded, explainable, and moving in the
// direction a facilitator would expect.

import { assert, assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { readWeather } from './weatherReading.ts';

const CALM = {
  complexity: 'simple',
  stakeholder: 'unified',
  knowledge: 'routine',
  cultural: 'mono',
  temporal: 'program',
  organizational: 'teal',
  challenge: 'technical',
  development: 'being',
  resources: 'rich',
  change: 'incremental',
  information: 'centralized',
  risk: 'low',
};

const STORMY = {
  complexity: 'chaotic',
  stakeholder: 'adversarial',
  knowledge: 'breakthrough',
  cultural: 'crosscultural',
  temporal: 'sprint',
  organizational: 'red',
  challenge: 'political',
  development: 'acting',
  resources: 'scarce',
  change: 'disruptive',
  information: 'distributed',
  risk: 'extreme',
};

// deno-lint-ignore no-explicit-any
const blindSpot = (priority: string, status = 'unaddressed') => ({ priority, status }) as any;
// deno-lint-ignore no-explicit-any
const analysedDoc = () => ({ processed: true, metadata: { idgAnalysis: { being: { score: 60 } } } }) as any;

Deno.test('every index stays within 0-10', () => {
  for (const morphology of [CALM, STORMY, {}, null]) {
    const reading = readWeather(morphology, [
      blindSpot('high'), blindSpot('high'), blindSpot('high'), blindSpot('high'), blindSpot('high'),
    ]);
    for (const index of [reading.pressure, reading.temperature, reading.visibility]) {
      assert(index.score >= 0 && index.score <= 10, `${index.key} = ${index.score}`);
    }
  }
});

Deno.test('a neutral project reads as the baseline', () => {
  const reading = readWeather({});
  assertEquals(reading.pressure.score, 5);
  assertEquals(reading.temperature.score, 5);
  assertEquals(reading.visibility.score, 5);
  assertEquals(reading.headlineKey, 'visualizations.weatherReading.headlines.settled');
});

Deno.test('adversarial, scarce and risky raises pressure; unified and rich lowers it', () => {
  assert(readWeather(STORMY).pressure.score > 8);
  assert(readWeather(CALM).pressure.score < 3);
});

Deno.test('chaotic and cross-cultural lowers visibility; simple and mono raises it', () => {
  assert(readWeather(STORMY).visibility.score < 2.5);
  assert(readWeather(CALM).visibility.score > 7.5);
});

Deno.test('every index can explain itself', () => {
  const reading = readWeather(STORMY);
  for (const index of [reading.pressure, reading.temperature, reading.visibility]) {
    assert(index.drivers.length > 0, `${index.key} has no drivers`);
    // Baseline plus the listed drivers must equal the score, before clamping.
    const summed = 5 + index.drivers.reduce((total, d) => total + d.points, 0);
    assertEquals(index.score, Math.round(Math.min(10, Math.max(0, summed)) * 10) / 10);
  }
});

Deno.test('drivers are ordered by influence', () => {
  const { pressure } = readWeather(STORMY);
  const magnitudes = pressure.drivers.map((d) => Math.abs(d.points));
  assertEquals(magnitudes, [...magnitudes].sort((a, b) => b - a));
});

Deno.test('open blind spots add pressure, addressed ones do not', () => {
  const base = readWeather(CALM).pressure.score;
  const withOpen = readWeather(CALM, [blindSpot('high'), blindSpot('medium')]).pressure.score;
  const withAddressed = readWeather(CALM, [blindSpot('high', 'addressed')]).pressure.score;

  assert(withOpen > base);
  assertEquals(withAddressed, base);
});

Deno.test('blind spot pressure is capped so a long list cannot swamp the morphology', () => {
  const many = Array.from({ length: 40 }, () => blindSpot('high'));
  const driver = readWeather(CALM, many).pressure.drivers.find((d) => d.dimensionKey.includes('blindSpots'))!;
  assertEquals(driver.points, 2);
});

Deno.test('analysed documents improve visibility with diminishing returns', () => {
  const none = readWeather(STORMY).visibility.score;
  const one = readWeather(STORMY, [], [analysedDoc()]).visibility.score;
  const eight = readWeather(STORMY, [], Array.from({ length: 8 }, analysedDoc)).visibility.score;

  assert(one > none);
  assert(eight > one);
  assert(eight - one < one - none + 1.5); // growth slows
  assertEquals(readWeather(STORMY, [], [analysedDoc()]).usedDocuments, true);
  assertEquals(readWeather(STORMY).usedDocuments, false);
});

Deno.test('the headline names at most the two strongest signals', () => {
  // In STORMY pressure and temperature both sit +3.6 from the baseline while
  // visibility is -3.4, so the headline names the first two.
  assertEquals(
    readWeather(STORMY).headlineKey,
    'visualizations.weatherReading.headlines.pressure_high__temperature_high',
  );
  // A single signal produces a one-part headline.
  assertEquals(
    readWeather({ risk: 'extreme' }).headlineKey,
    'visualizations.weatherReading.headlines.pressure_high',
  );
  // Contrasting signals are named in order of strength.
  assertEquals(
    readWeather({ complexity: 'chaotic', stakeholder: 'adversarial' }).headlineKey,
    'visualizations.weatherReading.headlines.visibility_low__pressure_high',
  );
});

Deno.test('an all-extreme morphology leaves headroom for later evidence', () => {
  // The morphology alone must not reach the bounds — otherwise blind spots and
  // documents would be invisible on exactly the projects that need them most.
  const stormy = readWeather(STORMY);
  assert(stormy.pressure.score < 10, 'pressure saturated');
  assert(stormy.visibility.score > 0, 'visibility saturated');

  const withEvidence = readWeather(STORMY, [blindSpot('high'), blindSpot('high')], [analysedDoc()]);
  assert(withEvidence.pressure.score > stormy.pressure.score);
  assert(withEvidence.visibility.score > stormy.visibility.score);
});

Deno.test('wind is the information dimension, defaulting to network', () => {
  assertEquals(readWeather({ information: 'hierarchical' }).wind, 'hierarchical');
  assertEquals(readWeather({}).wind, 'network');
  assertEquals(readWeather({ information: 'nonsense' }).wind, 'network');
});

Deno.test('legacy object-shaped morphology reads identically', () => {
  const flat = readWeather(STORMY);
  const legacy = readWeather(
    Object.fromEntries(Object.entries(STORMY).map(([k, v]) => [k, { selectedValue: v }])),
  );
  assertEquals(legacy.pressure.score, flat.pressure.score);
  assertEquals(legacy.visibility.score, flat.visibility.score);
  assertEquals(legacy.headlineKey, flat.headlineKey);
});
