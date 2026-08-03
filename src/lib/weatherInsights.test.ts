// Run with: deno test --no-check --sloppy-imports --config tests/deno.json src/lib/weatherInsights.test.ts
//
// These sentences are the part of the weather map a facilitator will actually
// repeat out loud in a room, so each rule has to fire for a reason that holds
// up — and, just as importantly, stay quiet when it does not apply.

import { assert, assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { readWeather } from './weatherReading.ts';
import { deriveWeatherInsights } from './weatherInsights.ts';

const FULL = {
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

// deno-lint-ignore no-explicit-any
const spot = (priority: string, status = 'unaddressed') => ({ id: crypto.randomUUID(), priority, status }) as any;
// deno-lint-ignore no-explicit-any
const doc = () => ({ processed: true, metadata: { idgAnalysis: { being: { score: 60 } } } }) as any;

const insightsFor = (morphology: Record<string, string>, spots = [], docs = [], limit = 10) =>
  deriveWeatherInsights(readWeather(morphology, spots, docs), morphology, spots, docs, limit);

const keys = (list: ReturnType<typeof deriveWeatherInsights>) => list.map((i) => i.key);

Deno.test('an assessment resting on defaults is flagged above everything else', () => {
  const barelyStarted = { complexity: 'chaotic', risk: 'extreme' };
  const result = insightsFor(barelyStarted);

  assertEquals(result[0].key, 'incompleteAssessment');
  assertEquals(result[0].values?.count, 10);
  assertEquals(result[0].values?.total, 12);
});

Deno.test('a complete assessment is not flagged as incomplete', () => {
  assert(!keys(insightsFor(FULL)).includes('incompleteAssessment'));
});

Deno.test('moving fast with no visibility is called out', () => {
  const fastAndFoggy = {
    ...FULL,
    temporal: 'sprint',
    change: 'disruptive',
    organizational: 'red',
    challenge: 'political',
    complexity: 'chaotic',
    knowledge: 'breakthrough',
    cultural: 'crosscultural',
  };
  const reading = readWeather(fastAndFoggy);
  assert(reading.temperature.score >= 6.5, `temperature ${reading.temperature.score}`);
  assert(reading.visibility.score <= 4, `visibility ${reading.visibility.score}`);
  assert(keys(insightsFor(fastAndFoggy)).includes('heatWithoutClarity'));
});

Deno.test('tension with no momentum behind it is called out', () => {
  const stuck = {
    ...FULL,
    stakeholder: 'adversarial',
    risk: 'extreme',
    resources: 'scarce',
    temporal: 'transformation',
    change: 'incremental',
    organizational: 'teal',
    challenge: 'technical',
  };
  const reading = readWeather(stuck);
  assert(reading.pressure.score >= 6.5, `pressure ${reading.pressure.score}`);
  assert(reading.temperature.score <= 4, `temperature ${reading.temperature.score}`);
  assert(keys(insightsFor(stuck)).includes('tensionWithoutEnergy'));
});

Deno.test('open high-priority blind spots are reported with a count', () => {
  const spots = [spot('high'), spot('high'), spot('medium'), spot('high', 'addressed')];
  const result = insightsFor(FULL, spots as never);
  const insight = result.find((i) => i.key === 'unaddressedHighPriority')!;

  assertEquals(insight.values?.count, 2); // the addressed one does not count
  assertEquals(insight.values?.total, 3);
  assertEquals(insight.action, 'blindSpots');
});

Deno.test('no blind spots means no blind spot insight', () => {
  assert(!keys(insightsFor(FULL)).includes('unaddressedHighPriority'));
  assert(!keys(insightsFor(FULL, [spot('high', 'addressed')] as never)).includes('unaddressedHighPriority'));
});

Deno.test('high pressure names its largest single source', () => {
  const tense = { ...FULL, stakeholder: 'adversarial', risk: 'extreme', resources: 'scarce', change: 'disruptive' };
  const insight = insightsFor(tense).find((i) => i.key === 'pressureSource')!;

  assert(insight, 'pressureSource did not fire');
  assert(String(insight.values?.dimension).startsWith('morphology.dimensions.'));
});

Deno.test('fog is attributed to missing evidence only when there is none', () => {
  const foggy = { ...FULL, complexity: 'chaotic', knowledge: 'breakthrough', cultural: 'crosscultural' };

  const withoutDocs = keys(insightsFor(foggy));
  assert(withoutDocs.includes('fogFromMissingEvidence'));
  assert(!withoutDocs.includes('fogDespiteEvidence'));

  const withDocs = insightsFor(foggy, [], [doc(), doc(), doc()] as never);
  assert(keys(withDocs).includes('fogDespiteEvidence'));
  assert(!keys(withDocs).includes('fogFromMissingEvidence'));
  assertEquals(withDocs.find((i) => i.key === 'fogDespiteEvidence')!.values?.count, 3);
});

Deno.test('sideways decision-making inside a sprint is flagged', () => {
  assert(keys(insightsFor({ ...FULL, information: 'network', temporal: 'sprint' })).includes('windPaceMismatch'));
  // Same structure, no sprint clock — nothing to say.
  assert(!keys(insightsFor({ ...FULL, information: 'network', temporal: 'program' })).includes('windPaceMismatch'));
  // Sprint under top-down decisions is not the same mismatch.
  assert(!keys(insightsFor({ ...FULL, information: 'hierarchical', temporal: 'sprint' })).includes('windPaceMismatch'));
});

Deno.test('a flat reading with no evidence behind it is called unexamined, not calm', () => {
  const neutral = {
    complexity: 'complicated', stakeholder: 'cooperative', knowledge: 'adaptive', cultural: 'crossfunctional',
    temporal: 'project', organizational: 'orange', challenge: 'cognitive', development: 'thinking',
    resources: 'balanced', change: 'transitional', information: 'network', risk: 'moderate',
  };
  const result = keys(insightsFor(neutral));
  // Only fires when there is genuinely nothing behind the reading.
  assertEquals(result.includes('calmButUnexamined'), true);
  assert(!keys(insightsFor(neutral, [], [doc()] as never)).includes('calmButUnexamined'));
  assert(!keys(insightsFor(neutral, [spot('low')] as never)).includes('calmButUnexamined'));
});

Deno.test('risks are ranked above attention items, and only three are returned', () => {
  const bad = {
    complexity: 'chaotic', stakeholder: 'adversarial', knowledge: 'breakthrough', cultural: 'crosscultural',
    temporal: 'sprint', organizational: 'red', challenge: 'political', development: 'acting',
    resources: 'scarce', change: 'disruptive', information: 'distributed', risk: 'extreme',
  };
  const result = deriveWeatherInsights(
    readWeather(bad, [spot('high')] as never, []),
    bad,
    [spot('high')] as never,
    [],
  );

  assertEquals(result.length, 3);
  const ranks = result.map((i) => ({ risk: 0, attention: 1, neutral: 2 })[i.severity]);
  assertEquals(ranks, [...ranks].sort((a, b) => a - b));
  assertEquals(result[0].severity, 'risk');
});

Deno.test('every insight carries a usable i18n key and, where it makes sense, an action', () => {
  const seen = new Set<string>();
  const cases: Record<string, string>[] = [
    FULL,
    { complexity: 'chaotic' },
    { ...FULL, stakeholder: 'adversarial', risk: 'extreme', resources: 'scarce', change: 'disruptive' },
    { ...FULL, complexity: 'chaotic', knowledge: 'breakthrough', cultural: 'crosscultural' },
    { ...FULL, information: 'network', temporal: 'sprint' },
  ];

  for (const morphology of cases) {
    for (const insight of insightsFor(morphology, [spot('high')] as never, [], 10)) {
      seen.add(insight.key);
      assert(/^[a-zA-Z]+$/.test(insight.key), `bad key: ${insight.key}`);
      assert(['risk', 'attention', 'neutral'].includes(insight.severity));
    }
  }

  // The rules that exist to prompt a next step must offer one.
  assert(seen.size >= 5, `only exercised ${seen.size} rules`);
});

Deno.test('the pressure-source insight names a morphology answer, never the blind spots', () => {
  // Blind spots have their own insight; naming them here was circular, and the
  // "adjust the assessment" action cannot change them.
  const tense = {
    ...FULL, stakeholder: 'adversarial', risk: 'extreme', resources: 'scarce', change: 'disruptive',
  };
  const manySpots = [spot('high'), spot('high'), spot('high'), spot('high')];
  const insight = insightsFor(tense, manySpots as never, [], 10).find((i) => i.key === 'pressureSource')!;

  assert(insight, 'pressureSource did not fire');
  assert(
    String(insight.values?.dimension).startsWith('morphology.dimensions.'),
    `named a non-morphology driver: ${insight.values?.dimension}`,
  );
});
