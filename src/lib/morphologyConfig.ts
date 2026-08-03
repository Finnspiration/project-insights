import { Brain, Globe, Shield, Zap, type LucideIcon } from 'lucide-react';
import { MORPHOLOGY_DIMENSION_KEYS, type MorphologyDimensionKey } from '@shared/morphology.ts';

// The dimension order lives in @shared/morphology.ts because the DNA code is
// built from it in both the browser and the edge functions. This file only adds
// the presentation layer: which category a dimension belongs to and which
// options it offers. MORPHOLOGY_DIMENSIONS is derived from the shared key list,
// so the two can no longer drift apart.

export type DimensionKey = MorphologyDimensionKey;

export type CategoryType = 'context' | 'capacity' | 'dynamics' | 'challenge_and_resources';

export interface DimensionOption {
  value: string;
  translationKey: string;
}

export interface DimensionConfig {
  key: DimensionKey;
  translationKey: string;
  category: CategoryType;
  options: DimensionOption[];
}

interface DimensionDefinition {
  category: CategoryType;
  /** Option values in display order; also the i18n key suffix. */
  options: string[];
}

// Every dimension must appear here — Record<DimensionKey, …> makes a missing
// one a compile error rather than a dimension that silently vanishes from the
// morphological box.
const DIMENSION_DEFINITIONS: Record<DimensionKey, DimensionDefinition> = {
  complexity: {
    category: 'context',
    options: ['simple', 'complicated', 'complex', 'chaotic'],
  },
  stakeholder: {
    category: 'context',
    options: ['unified', 'cooperative', 'competitive', 'adversarial'],
  },
  knowledge: {
    category: 'capacity',
    options: ['routine', 'adaptive', 'innovative', 'breakthrough'],
  },
  cultural: {
    category: 'context',
    options: ['mono', 'crossfunctional', 'crossorg', 'crosscultural'],
  },
  temporal: {
    category: 'dynamics',
    options: ['sprint', 'project', 'program', 'transformation'],
  },
  organizational: {
    category: 'capacity',
    options: ['red', 'amber', 'orange', 'green', 'teal'],
  },
  challenge: {
    category: 'challenge_and_resources',
    options: ['technical', 'social', 'political', 'cognitive', 'adaptive'],
  },
  development: {
    category: 'capacity',
    options: ['being', 'thinking', 'relating', 'collaborating', 'acting'],
  },
  resources: {
    category: 'challenge_and_resources',
    options: ['rich', 'balanced', 'constrained', 'scarce'],
  },
  change: {
    category: 'dynamics',
    options: ['incremental', 'transitional', 'transformational', 'disruptive'],
  },
  information: {
    category: 'dynamics',
    options: ['centralized', 'hierarchical', 'network', 'distributed'],
  },
  risk: {
    category: 'challenge_and_resources',
    options: ['low', 'moderate', 'high', 'extreme'],
  },
};

export const MORPHOLOGY_DIMENSIONS: DimensionConfig[] = MORPHOLOGY_DIMENSION_KEYS.map((key) => {
  const definition = DIMENSION_DEFINITIONS[key];
  return {
    key,
    translationKey: `morphology.dimensions.${key}.title`,
    category: definition.category,
    options: definition.options.map((value) => ({
      value,
      translationKey: `morphology.dimensions.${key}.options.${value}`,
    })),
  };
});

/** Option values for one dimension, in display order. */
export function getDimensionOptions(key: DimensionKey): string[] {
  return DIMENSION_DEFINITIONS[key].options;
}

export const CATEGORY_COLORS: Record<CategoryType, string> = {
  context: '220, 70%, 50%',       // Blue
  capacity: '280, 65%, 60%',      // Purple
  dynamics: '340, 75%, 55%',      // Pink/Magenta
  challenge_and_resources: '30, 90%, 50%',  // Orange
};

// The icon components themselves, not their names. Looking icons up by name
// through `import * as Icons from 'lucide-react'` defeats tree-shaking and
// pulled the entire icon library — ~1.2 MB of source — into the bundle.
export const CATEGORY_ICONS: Record<CategoryType, LucideIcon> = {
  context: Globe,
  capacity: Brain,
  dynamics: Zap,
  challenge_and_resources: Shield,
};
