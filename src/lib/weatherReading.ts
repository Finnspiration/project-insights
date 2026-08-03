import { morphologyValue, type RawMorphology } from '@shared/morphology.ts';
import type { BlindSpot, ProjectDocument } from '@/types/project';

// The weather map used to draw all 12 morphology dimensions as circles on the
// canvas, plus 5 IDG bubbles and 4 pressure markers — 21 marks in one visual
// language, none of them saying what the weather actually *is*.
//
// This module reads the weather instead: four composite indices on one 0-10
// scale, each able to explain which answers produced it. The dimensions
// themselves belong in the morphological box, not on the map.

export type IndexKey = 'pressure' | 'temperature' | 'visibility';

/** How much a single morphology answer pushes an index, on the 0-10 scale. */
interface Driver {
  /** i18n key for the dimension that caused it. */
  dimensionKey: string;
  /** The chosen option, for the explanation. */
  value: string;
  /** Signed contribution. */
  points: number;
}

export interface WeatherIndex {
  key: IndexKey;
  /** 0-10, one decimal. */
  score: number;
  /** i18n key for the one-word reading, e.g. "Rising tension". */
  qualifierKey: string;
  drivers: Driver[];
}

export type WindPatternKey = 'centralized' | 'hierarchical' | 'network' | 'distributed';

export interface WeatherReading {
  pressure: WeatherIndex;
  temperature: WeatherIndex;
  visibility: WeatherIndex;
  /** Categorical — information flow has a direction, not a magnitude. */
  wind: WindPatternKey;
  /** i18n key for the headline, chosen from the extremes of the indices. */
  headlineKey: string;
  /** True when documents contributed to visibility. */
  usedDocuments: boolean;
}

const BASELINE = 5;

/**
 * How far the morphology alone may move an index from the baseline.
 *
 * Deliberately less than the full range: an all-extreme assessment lands near
 * 8.5, not at 10, so evidence gathered afterwards — open blind spots, analysed
 * documents — still has room to register. Without this headroom the indices
 * clamped, and a project with three blind spots read exactly like the same
 * project with none.
 */
const MORPHOLOGY_SPAN = 3.5;

/**
 * Per-dimension scales, in points added to the 5.0 baseline.
 *
 * These are deliberately explicit rather than derived: a facilitator has to be
 * able to disagree with a specific number, and "adversarial stakeholders add
 * +2.5 to pressure" is arguable in a way that a hidden weighting is not.
 */
const PRESSURE_DRIVERS: Record<string, Record<string, number>> = {
  stakeholder: { unified: -2, cooperative: -1, competitive: 1.5, adversarial: 2.5 },
  risk: { low: -1.5, moderate: 0, high: 1.5, extreme: 2.5 },
  resources: { rich: -1.5, balanced: 0, constrained: 1, scarce: 2 },
  change: { incremental: -1, transitional: 0, transformational: 1, disruptive: 2 },
};

const TEMPERATURE_DRIVERS: Record<string, Record<string, number>> = {
  temporal: { sprint: 2, project: 0.5, program: -0.5, transformation: -1 },
  change: { incremental: -1.5, transitional: -0.5, transformational: 1, disruptive: 2 },
  challenge: { technical: -1, social: 0.5, political: 1.5, cognitive: 0, adaptive: 1 },
  organizational: { red: 1.5, amber: 0.5, orange: 1, green: -0.5, teal: -1 },
};

const VISIBILITY_DRIVERS: Record<string, Record<string, number>> = {
  complexity: { simple: 2.5, complicated: 1, complex: -1.5, chaotic: -2.5 },
  knowledge: { routine: 1.5, adaptive: 0.5, innovative: -1, breakthrough: -2 },
  information: { centralized: 0.5, hierarchical: 0, network: 0.5, distributed: -1 },
  cultural: { mono: 1, crossfunctional: 0, crossorg: -1, crosscultural: -1.5 },
};

const WIND_PATTERNS: Record<string, WindPatternKey> = {
  centralized: 'centralized',
  hierarchical: 'hierarchical',
  network: 'network',
  distributed: 'distributed',
};

/** Each unaddressed blind spot adds pressure, weighted by priority. */
const BLIND_SPOT_PRESSURE: Record<string, number> = { high: 0.6, medium: 0.3, low: 0.15 };

/** Cap so a long blind-spot list cannot swamp the morphology. */
const MAX_BLIND_SPOT_PRESSURE = 2;

/** Analysed documents sharpen the picture, with diminishing returns. */
const MAX_DOCUMENT_VISIBILITY = 1.5;

function clamp(score: number): number {
  return Math.round(Math.min(10, Math.max(0, score)) * 10) / 10;
}

/** Largest deviation the table can produce, used to normalise onto MORPHOLOGY_SPAN. */
function tableReach(table: Record<string, Record<string, number>>): number {
  return Object.values(table).reduce(
    (total, scale) => total + Math.max(...Object.values(scale).map(Math.abs)),
    0,
  );
}

function buildIndex(
  key: IndexKey,
  morphology: RawMorphology,
  table: Record<string, Record<string, number>>,
  extraDrivers: Driver[] = [],
): WeatherIndex {
  const factor = MORPHOLOGY_SPAN / tableReach(table);
  const drivers: Driver[] = [];

  for (const [dimension, scale] of Object.entries(table)) {
    const value = morphologyValue(morphology, dimension);
    if (!value) continue;

    const raw = scale[value];
    if (raw === undefined || raw === 0) continue;

    // Rounded here rather than at display time, so the numbers the user is
    // shown are the numbers that actually produced the score.
    const points = Math.round(raw * factor * 10) / 10;
    if (points === 0) continue;

    drivers.push({ dimensionKey: `morphology.dimensions.${dimension}.title`, value, points });
  }

  drivers.push(...extraDrivers);

  // Strongest influence first — the explanation should lead with what matters.
  drivers.sort((a, b) => Math.abs(b.points) - Math.abs(a.points));

  const score = clamp(BASELINE + drivers.reduce((total, driver) => total + driver.points, 0));

  return { key, score, qualifierKey: qualifierFor(key, score), drivers };
}

function qualifierFor(key: IndexKey, score: number): string {
  const band = score >= 7 ? 'high' : score >= 4 ? 'mid' : 'low';
  return `visualizations.weatherReading.qualifiers.${key}.${band}`;
}

function blindSpotDriver(blindSpots: BlindSpot[] | undefined): Driver | null {
  const open = (blindSpots ?? []).filter((spot) => spot.status !== 'addressed');
  if (open.length === 0) return null;

  const points = Math.min(
    MAX_BLIND_SPOT_PRESSURE,
    open.reduce((total, spot) => total + (BLIND_SPOT_PRESSURE[spot.priority ?? 'low'] ?? 0.15), 0),
  );

  if (points === 0) return null;

  return {
    dimensionKey: 'visualizations.weatherReading.drivers.blindSpots',
    value: String(open.length),
    points: Math.round(points * 10) / 10,
  };
}

function documentDriver(documents: ProjectDocument[] | undefined): Driver | null {
  const analysed = (documents ?? []).filter((doc) => doc.processed && doc.metadata?.idgAnalysis);
  if (analysed.length === 0) return null;

  // 1 doc = +0.6, 2 = +0.9, 4 = +1.2, capped at +1.5.
  const points = Math.min(MAX_DOCUMENT_VISIBILITY, Math.round(Math.log2(analysed.length + 1) * 0.6 * 10) / 10);

  return {
    dimensionKey: 'visualizations.weatherReading.drivers.documents',
    value: String(analysed.length),
    points,
  };
}

/**
 * Picks the headline from whichever indices are furthest from neutral.
 *
 * Only the two strongest signals get named — a headline that mentions
 * everything says nothing.
 */
function headlineFor(pressure: WeatherIndex, temperature: WeatherIndex, visibility: WeatherIndex): string {
  const signals = [
    { key: 'pressure', deviation: pressure.score - BASELINE },
    { key: 'temperature', deviation: temperature.score - BASELINE },
    { key: 'visibility', deviation: visibility.score - BASELINE },
  ]
    .filter((signal) => Math.abs(signal.deviation) >= 1)
    .sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation));

  if (signals.length === 0) {
    return 'visualizations.weatherReading.headlines.settled';
  }

  const parts = signals.slice(0, 2).map((signal) => {
    const direction = signal.deviation > 0 ? 'high' : 'low';
    return `${signal.key}_${direction}`;
  });

  return `visualizations.weatherReading.headlines.${parts.join('__')}`;
}

export interface DimensionImpact {
  index: IndexKey;
  /** Signed, on the same 0-10 scale as the index itself. */
  points: number;
}

const INDEX_TABLES: Record<IndexKey, Record<string, Record<string, number>>> = {
  pressure: PRESSURE_DRIVERS,
  temperature: TEMPERATURE_DRIVERS,
  visibility: VISIBILITY_DRIVERS,
};

/**
 * What choosing `value` for `dimension` does to the reading.
 *
 * Derived from the same tables that produce the indices, so the editor can
 * never again promise an effect the map does not have. The old version was a
 * 300-line hand-written table describing clouds, isobars and degrees Celsius —
 * none of which the map draws any more.
 */
export function dimensionImpacts(dimension: string, value: string): DimensionImpact[] {
  const impacts: DimensionImpact[] = [];

  for (const [key, table] of Object.entries(INDEX_TABLES) as [IndexKey, typeof PRESSURE_DRIVERS][]) {
    const raw = table[dimension]?.[value];
    if (raw === undefined || raw === 0) continue;

    const points = Math.round(raw * (MORPHOLOGY_SPAN / tableReach(table)) * 10) / 10;
    if (points !== 0) impacts.push({ index: key, points });
  }

  return impacts.sort((a, b) => Math.abs(b.points) - Math.abs(a.points));
}

/** True when the dimension only steers the wind, which has direction but no magnitude. */
export function isWindDimension(dimension: string): boolean {
  return dimension === 'information';
}

export function readWeather(
  morphology: RawMorphology,
  blindSpots?: BlindSpot[],
  documents?: ProjectDocument[],
): WeatherReading {
  const spotDriver = blindSpotDriver(blindSpots);
  const docDriver = documentDriver(documents);

  const pressure = buildIndex('pressure', morphology, PRESSURE_DRIVERS, spotDriver ? [spotDriver] : []);
  const temperature = buildIndex('temperature', morphology, TEMPERATURE_DRIVERS);
  const visibility = buildIndex('visibility', morphology, VISIBILITY_DRIVERS, docDriver ? [docDriver] : []);

  const information = morphologyValue(morphology, 'information');

  return {
    pressure,
    temperature,
    visibility,
    wind: WIND_PATTERNS[information ?? ''] ?? 'network',
    headlineKey: headlineFor(pressure, temperature, visibility),
    usedDocuments: docDriver !== null,
  };
}
