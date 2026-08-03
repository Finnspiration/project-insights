import { morphologyValue, type RawMorphology } from '@shared/morphology.ts';

// Five gestures instead of seventy-six parameters.
//
// The blob mapped twelve dimensions onto 76 visual properties, which nobody
// can invert: given a blob you could not recover the assessment. Three
// dimensions moved a single parameter each and were invisible; five competed
// for the same surface. What came out was generative art wearing the label of
// a chart — and on a busy project it stopped reading as an object at all.
//
// A portrait does not need to be complete. It needs to be recognisable, and
// recognisable means a handful of traits a person can name out loud. These are
// the five, each a spectrum a facilitator could describe without a legend:
//
//   cohesion   whole            <-> split apart
//   roughness  smooth           <-> agitated
//   clarity    opaque           <-> see-through
//   orbit      still            <-> circling
//   strain     calm             <-> under pressure
//
// The remaining seven dimensions stay in the picture as seeded variation: they
// keep every project's blob unique without pretending to be legible.

export type GestureKey = 'cohesion' | 'roughness' | 'clarity' | 'orbit' | 'strain';

export interface GestureDriver {
  /** i18n key of the dimension that moved this gesture. */
  dimensionKey: string;
  value: string;
  /** Its contribution, 0-1 on the gesture's own scale. */
  weight: number;
}

export interface Gesture {
  key: GestureKey;
  /** 0-1. */
  value: number;
  drivers: GestureDriver[];
}

export type BlobGestures = Record<GestureKey, Gesture>;

/** Each gesture reads one or two dimensions. Values are the gesture's 0-1 scale. */
const SCALES: Record<GestureKey, Record<string, Record<string, number>>> = {
  // One body, or several drifting apart.
  cohesion: {
    stakeholder: { unified: 1.0, cooperative: 0.72, competitive: 0.35, adversarial: 0.05 },
  },
  // How disturbed the surface is.
  roughness: {
    complexity: { simple: 0.05, complicated: 0.3, complex: 0.65, chaotic: 1.0 },
  },
  // Can you see into it? Inverted: 1 means clear.
  clarity: {
    knowledge: { routine: 0.9, adaptive: 0.65, innovative: 0.4, breakthrough: 0.2 },
    cultural: { mono: 0.9, crossfunctional: 0.65, crossorg: 0.45, crosscultural: 0.3 },
  },
  // How much circles the body.
  orbit: {
    temporal: { sprint: 0.9, project: 0.6, program: 0.4, transformation: 0.3 },
    change: { incremental: 0.1, transitional: 0.4, transformational: 0.75, disruptive: 1.0 },
  },
  // Pressure showing in the surface.
  strain: {
    risk: { low: 0.1, moderate: 0.4, high: 0.75, extreme: 1.0 },
    resources: { rich: 0.05, balanced: 0.35, constrained: 0.7, scarce: 0.9 },
  },
};

/** Used when a dimension is unanswered, so a half-finished assessment still draws. */
const NEUTRAL = 0.5;

function buildGesture(key: GestureKey, morphology: RawMorphology): Gesture {
  const drivers: GestureDriver[] = [];

  for (const [dimension, scale] of Object.entries(SCALES[key])) {
    const answer = morphologyValue(morphology, dimension);
    const weight = answer !== undefined ? scale[answer] : undefined;
    if (weight === undefined) continue;

    drivers.push({
      dimensionKey: `morphology.dimensions.${dimension}.title`,
      value: answer!,
      weight,
    });
  }

  const value = drivers.length
    ? drivers.reduce((total, d) => total + d.weight, 0) / drivers.length
    : NEUTRAL;

  return { key, value: Math.round(value * 100) / 100, drivers };
}

export function readBlobGestures(morphology: RawMorphology): BlobGestures {
  return {
    cohesion: buildGesture('cohesion', morphology),
    roughness: buildGesture('roughness', morphology),
    clarity: buildGesture('clarity', morphology),
    orbit: buildGesture('orbit', morphology),
    strain: buildGesture('strain', morphology),
  };
}

/** Plain values, for the render path that does not need the explanation. */
export function gestureValues(morphology: RawMorphology): Record<GestureKey, number> {
  const gestures = readBlobGestures(morphology);
  return {
    cohesion: gestures.cohesion.value,
    roughness: gestures.roughness.value,
    clarity: gestures.clarity.value,
    orbit: gestures.orbit.value,
    strain: gestures.strain.value,
  };
}

/** Linear interpolation helper for the mapping pass. */
export function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * Math.min(1, Math.max(0, t));
}
