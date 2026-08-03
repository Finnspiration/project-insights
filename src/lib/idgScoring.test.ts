// Run with: deno test --no-check src/lib/idgScoring.test.ts
//
// The invariant that matters: the radar number, the weather number and the
// evidence breakdown all come from one calculation. They used to come from
// three, and only one of them counted the document analysis, so a project
// could show 65 on the radar and a breakdown that summed to 74.

import { assert, assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { calculateIDG } from './idgScoring.ts';

const MORPHOLOGY = {
  development: 'relating',
  organizational: 'green',
  challenge: 'social',
};

function documentWith(dimension: string, score: number, confidence = 1) {
  return {
    metadata: { idgAnalysis: { [dimension]: { score, confidence, evidence: 'quoted line' } } },
  // deno-lint-ignore no-explicit-any
  } as any;
}

Deno.test('radar, weather and evidence always agree', () => {
  const result = calculateIDG(MORPHOLOGY, [documentWith('being', 90)]);

  for (const item of result.evidence) {
    assertEquals(result.radar[item.dimension], item.totalScore);
    assertEquals(result.weather[item.dimension], item.totalScore / 10);
  }
});

Deno.test('every score equals its base plus its listed contributions', () => {
  const result = calculateIDG(MORPHOLOGY, [documentWith('thinking', 20), documentWith('being', 95)]);

  for (const item of result.evidence) {
    const summed = item.baseScore + item.contributions.reduce((total, c) => total + c.value, 0);
    assertEquals(item.totalScore, Math.min(100, Math.max(0, summed)));
  }
});

Deno.test('morphology rules score as documented', () => {
  const { radar } = calculateIDG(MORPHOLOGY);
  // development +30, green +15, social +10 = 105, clamped to 100
  assertEquals(radar.relating, 100);
  assertEquals(radar.collaborating, 50 + 15); // green
  assertEquals(radar.being, 50);
  assertEquals(radar.thinking, 50);
  assertEquals(radar.acting, 50);
});

Deno.test('teal scores like green and amber like red', () => {
  const green = calculateIDG({ organizational: 'green' }).radar;
  const teal = calculateIDG({ organizational: 'teal' }).radar;
  assertEquals(teal, green);

  const red = calculateIDG({ organizational: 'red' }).radar;
  const amber = calculateIDG({ organizational: 'amber' }).radar;
  assertEquals(amber, red);
});

Deno.test('documents move the score and are reported as a contribution', () => {
  const withoutDocs = calculateIDG(MORPHOLOGY);
  const withDocs = calculateIDG(MORPHOLOGY, [documentWith('being', 90)]);

  assertEquals(withoutDocs.usedDocuments, false);
  assertEquals(withDocs.usedDocuments, true);

  // (90 - 50) * 0.3 = +12
  assertEquals(withDocs.radar.being, withoutDocs.radar.being + 12);

  const beingEvidence = withDocs.evidence.find((e) => e.dimension === 'being')!;
  assert(beingEvidence.contributions.some((c) => c.value === 12));
  assertEquals(beingEvidence.documentEvidence, 'quoted line');
});

Deno.test('a document below the baseline lowers the score', () => {
  const result = calculateIDG(MORPHOLOGY, [documentWith('thinking', 20)]);
  // (20 - 50) * 0.3 = -9
  assertEquals(result.radar.thinking, 41);
  const thinking = result.evidence.find((e) => e.dimension === 'thinking')!;
  assert(thinking.contributions.some((c) => c.value === -9));
});

Deno.test('document scores are averaged by confidence', () => {
  const result = calculateIDG(MORPHOLOGY, [
    documentWith('acting', 100, 1),
    documentWith('acting', 50, 3),
  ]);
  // (100*1 + 50*3) / 4 = 62.5 -> 63; (63 - 50) * 0.3 = 3.9 -> 4
  assertEquals(result.evidence.find((e) => e.dimension === 'acting')!.documentScore, 63);
  assertEquals(result.radar.acting, 54);
});

Deno.test('scores stay within 0-100', () => {
  const maxed = calculateIDG(
    { development: 'relating', organizational: 'green', challenge: 'social' },
    [documentWith('relating', 100)],
  );
  assertEquals(maxed.radar.relating, 100);
  assert(Object.values(maxed.radar).every((score) => score >= 0 && score <= 100));
});

Deno.test('legacy object-shaped morphology scores identically', () => {
  const flat = calculateIDG(MORPHOLOGY).radar;
  const legacy = calculateIDG({
    development: { selectedValue: 'relating' },
    organizational: { selectedValue: 'green' },
    challenge: { selectedValue: 'social' },
  }).radar;
  assertEquals(legacy, flat);
});

Deno.test('missing morphology falls back to the documented defaults', () => {
  // development 'thinking', organizational 'orange', challenge 'technical'
  const { radar } = calculateIDG(null);
  assertEquals(radar.thinking, 50 + 30 + 15);
  assertEquals(radar.acting, 50 + 10);
  assertEquals(radar.being, 50);
});
