import { MORPHOLOGY_DIMENSION_KEYS, morphologyValue, type RawMorphology } from '@shared/morphology.ts';
import type { BlindSpot, ProjectDocument } from '@/types/project';
import type { WeatherIndex, WeatherReading } from './weatherReading';

// "What the weather means" — the readings turned into things a facilitator can
// act on. The map can show that pressure is 8.0; only this can say that most
// of it comes from one place, or that the fog is not a data problem.
//
// These are rules, not AI output: deterministic, free, instant, and available
// offline in both languages. Each one states a relationship the numbers alone
// do not make visible. An AI pass could later add themes across blind spots —
// which needs to read their text — but it should sit on top of this, not
// replace it, because a facilitator in a room cannot wait for a round-trip.

export type InsightSeverity = 'risk' | 'attention' | 'neutral';

/** Where the "do something about it" link should go. */
export type InsightAction = 'blindSpots' | 'documents' | 'morphology' | 'insights';

export interface WeatherInsight {
  /** Stable id, also the i18n key suffix. */
  key: string;
  severity: InsightSeverity;
  /** Interpolation values for the i18n string. */
  values?: Record<string, string | number>;
  action?: InsightAction;
}

const HIGH = 6.5;
const LOW = 4;

/** Rules are evaluated in this order; the first three that fire are shown. */
const SEVERITY_RANK: Record<InsightSeverity, number> = { risk: 0, attention: 1, neutral: 2 };

/**
 * The strongest driver in one direction, ignoring the evidence-based ones.
 *
 * Blind spots and documents have their own insights; naming them here made
 * the rail say "most of the pressure comes from your open blind spots" right
 * underneath the insight about the open blind spots, and pointed the reader at
 * the assessment editor, which cannot change them.
 */
function topMorphologyDriver(index: WeatherIndex, direction: 'up' | 'down') {
  return index.drivers.find(
    (driver) =>
      driver.dimensionKey.startsWith('morphology.dimensions.') &&
      (direction === 'up' ? driver.points > 0 : driver.points < 0),
  );
}

function analysedDocumentCount(documents: ProjectDocument[] | undefined): number {
  return (documents ?? []).filter((doc) => doc.processed && doc.metadata?.idgAnalysis).length;
}

function unansweredDimensions(morphology: RawMorphology): number {
  return MORPHOLOGY_DIMENSION_KEYS.filter((key) => !morphologyValue(morphology, key)).length;
}

export function deriveWeatherInsights(
  reading: WeatherReading,
  morphology: RawMorphology,
  blindSpots: BlindSpot[] = [],
  documents: ProjectDocument[] = [],
  limit = 3,
): WeatherInsight[] {
  const insights: WeatherInsight[] = [];

  const open = blindSpots.filter((spot) => spot.status !== 'addressed');
  const highPriority = open.filter((spot) => spot.priority === 'high');
  const docCount = analysedDocumentCount(documents);
  const unanswered = unansweredDimensions(morphology);

  // An assessment resting on defaults is not a reading of anything. This
  // outranks everything else, because every number below is affected.
  if (unanswered >= 4) {
    insights.push({
      key: 'incompleteAssessment',
      severity: 'risk',
      values: { count: unanswered, total: MORPHOLOGY_DIMENSION_KEYS.length },
      action: 'morphology',
    });
  }

  // Moving fast with no view of where you are going.
  if (reading.temperature.score >= HIGH && reading.visibility.score <= LOW) {
    insights.push({ key: 'heatWithoutClarity', severity: 'risk', action: 'insights' });
  }

  // Tension with no momentum to resolve it — it will still be there next month.
  if (reading.pressure.score >= HIGH && reading.temperature.score <= LOW) {
    insights.push({ key: 'tensionWithoutEnergy', severity: 'risk' });
  }

  if (highPriority.length > 0) {
    insights.push({
      key: 'unaddressedHighPriority',
      severity: 'risk',
      values: { count: highPriority.length, total: open.length },
      action: 'blindSpots',
    });
  }

  // Where the pressure actually comes from, rather than that it is high.
  if (reading.pressure.score >= HIGH) {
    const driver = topMorphologyDriver(reading.pressure, 'up');
    if (driver) {
      insights.push({
        key: 'pressureSource',
        severity: 'attention',
        values: { dimension: driver.dimensionKey, points: driver.points.toFixed(1).replace('.', ',') },
        action: 'morphology',
      });
    }
  }

  // Low visibility has two very different causes and two different responses.
  if (reading.visibility.score <= LOW) {
    if (docCount === 0) {
      insights.push({ key: 'fogFromMissingEvidence', severity: 'attention', action: 'documents' });
    } else {
      const driver = topMorphologyDriver(reading.visibility, 'down');
      insights.push({
        key: 'fogDespiteEvidence',
        severity: 'attention',
        values: { count: docCount, dimension: driver?.dimensionKey ?? '' },
        action: 'insights',
      });
    }
  }

  // Sideways decision-making inside a sprint cadence: the structure and the
  // clock are pulling against each other.
  const temporal = morphologyValue(morphology, 'temporal');
  if ((reading.wind === 'network' || reading.wind === 'distributed') && temporal === 'sprint') {
    insights.push({ key: 'windPaceMismatch', severity: 'attention', action: 'morphology' });
  }

  // A flat reading with nothing behind it usually means an unexamined project.
  //
  // The tolerance is deliberately wide: across twelve dimensions it is rare for
  // all three indices to land within a point of the baseline, so a tighter
  // threshold would mean this never fires on the middle-of-the-road assessments
  // it exists to catch.
  const flat = [reading.pressure, reading.temperature, reading.visibility].every(
    (index) => Math.abs(index.score - 5) <= 1.5,
  );
  if (flat && docCount === 0 && open.length === 0) {
    insights.push({ key: 'calmButUnexamined', severity: 'neutral', action: 'documents' });
  }

  // Worth saying out loud when it is true — it is the only state in which
  // committing to a direction is cheap.
  if (reading.visibility.score >= HIGH && reading.pressure.score <= LOW) {
    insights.push({ key: 'clearAndCalm', severity: 'neutral', action: 'insights' });
  }

  return insights
    .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity])
    .slice(0, limit);
}
