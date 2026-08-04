import {
  MORPHOLOGY_DIMENSION_KEYS,
  morphologyValue,
  type MorphologyDimensionKey,
  type RawMorphology,
} from '@shared/morphology.ts';
import { gestureValues, type GestureKey } from './blobGestures';

// What changed between two assessments.
//
// A timeline of portraits shows *that* a project changed shape; this says what
// moved. Both are needed: the picture is what makes someone look, the sentence
// is what they can act on.

export interface DimensionChange {
  dimension: MorphologyDimensionKey;
  /** i18n key for the dimension name. */
  dimensionKey: string;
  from: string | undefined;
  to: string | undefined;
  /** Which way along the dimension's own option order it moved. */
  direction: 'forward' | 'backward' | 'set' | 'cleared';
  /** How many steps along that scale. */
  steps: number;
}

export interface GestureChange {
  gesture: GestureKey;
  from: number;
  to: number;
  delta: number;
}

export interface MorphologyDiff {
  changes: DimensionChange[];
  /** Gesture shifts of at least 0.1, largest first — what the portrait shows. */
  gestures: GestureChange[];
  unchanged: boolean;
}

/**
 * Option order per dimension, so a change can be described as a direction
 * rather than just a swap. Kept here rather than imported from morphologyConfig
 * so this module stays free of React and can be tested on its own.
 */
const OPTION_ORDER: Record<MorphologyDimensionKey, string[]> = {
  complexity: ['simple', 'complicated', 'complex', 'chaotic'],
  stakeholder: ['unified', 'cooperative', 'competitive', 'adversarial'],
  knowledge: ['routine', 'adaptive', 'innovative', 'breakthrough'],
  cultural: ['mono', 'crossfunctional', 'crossorg', 'crosscultural'],
  temporal: ['sprint', 'project', 'program', 'transformation'],
  organizational: ['red', 'amber', 'orange', 'green', 'teal'],
  challenge: ['technical', 'social', 'political', 'cognitive', 'adaptive'],
  development: ['being', 'thinking', 'relating', 'collaborating', 'acting'],
  resources: ['rich', 'balanced', 'constrained', 'scarce'],
  change: ['incremental', 'transitional', 'transformational', 'disruptive'],
  information: ['centralized', 'hierarchical', 'network', 'distributed'],
  risk: ['low', 'moderate', 'high', 'extreme'],
};

const GESTURE_KEYS: GestureKey[] = ['cohesion', 'roughness', 'clarity', 'orbit', 'strain'];

/** Below this a gesture shift is not visible in the portrait, so it is not reported. */
const GESTURE_THRESHOLD = 0.1;

export function diffMorphology(before: RawMorphology, after: RawMorphology): MorphologyDiff {
  const changes: DimensionChange[] = [];

  for (const dimension of MORPHOLOGY_DIMENSION_KEYS) {
    const from = morphologyValue(before, dimension);
    const to = morphologyValue(after, dimension);
    if (from === to) continue;

    const order = OPTION_ORDER[dimension];
    const fromIndex = from ? order.indexOf(from) : -1;
    const toIndex = to ? order.indexOf(to) : -1;

    let direction: DimensionChange['direction'];
    if (from === undefined) direction = 'set';
    else if (to === undefined) direction = 'cleared';
    else if (fromIndex >= 0 && toIndex >= 0) direction = toIndex > fromIndex ? 'forward' : 'backward';
    else direction = 'set';

    changes.push({
      dimension,
      dimensionKey: `morphology.dimensions.${dimension}.title`,
      from,
      to,
      direction,
      steps: fromIndex >= 0 && toIndex >= 0 ? Math.abs(toIndex - fromIndex) : 1,
    });
  }

  const beforeGestures = gestureValues(before);
  const afterGestures = gestureValues(after);
  const gestures: GestureChange[] = GESTURE_KEYS
    .map((gesture) => ({
      gesture,
      from: beforeGestures[gesture],
      to: afterGestures[gesture],
      delta: Math.round((afterGestures[gesture] - beforeGestures[gesture]) * 100) / 100,
    }))
    .filter((change) => Math.abs(change.delta) >= GESTURE_THRESHOLD)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  // Biggest moves first — a four-step slide matters more than four one-step nudges.
  changes.sort((a, b) => b.steps - a.steps);

  return { changes, gestures, unchanged: changes.length === 0 };
}
