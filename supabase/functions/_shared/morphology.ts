// Canonical morphology format and DNA code generation.
//
// This module is the single source of truth for BOTH the frontend (imported as
// `@shared/morphology.ts`) and the Supabase edge functions (imported as
// `../_shared/morphology.ts`). It must stay dependency-free so it works
// unchanged in Deno and in the browser bundle.
//
// The stored format is flat strings:
//
//     { complexity: "complex", stakeholder: "cooperative", ... }
//
// Older rows may hold `{ selectedValue, selectedIndex }` objects, written by
// the weather-map live editor and the demo seeder. Those objects are the reason
// DNA codes used to come out as "[object Object]-[object Object]-…":
// `String({selectedValue: "complex"})` is "[object Object]", and every writer
// re-implemented the join slightly differently. normalizeMorphology() accepts
// either shape so old rows keep working; every writer must persist the
// normalized result.

/**
 * The 12 dimensions in the order that defines a DNA code.
 *
 * The DNA code is a project's identity, so this order is part of the data
 * contract — never reorder it, and never derive it from Object.keys(), whose
 * order depends on how the object happened to be built.
 */
export const MORPHOLOGY_DIMENSION_KEYS = [
  'complexity',
  'stakeholder',
  'knowledge',
  'cultural',
  'temporal',
  'organizational',
  'challenge',
  'development',
  'resources',
  'change',
  'information',
  'risk',
] as const;

export type MorphologyDimensionKey = typeof MORPHOLOGY_DIMENSION_KEYS[number];

/** Morphology as stored and consumed everywhere after normalization. */
export type Morphology = Partial<Record<MorphologyDimensionKey, string>>;

/** Anything that has ever been written to the `morphology` column. */
export type RawMorphology = Record<string, unknown> | null | undefined;

/** Historic key spellings still present in some rows. */
const KEY_ALIASES: Record<string, MorphologyDimensionKey> = {
  primary: 'challenge',
  resource: 'resources',
};

/** Extracts the string value of a single dimension, whatever shape it is in. */
export function morphologyValue(raw: RawMorphology, key: string): string | undefined {
  if (!raw || typeof raw !== 'object') return undefined;

  const value = (raw as Record<string, unknown>)[key];

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  if (value && typeof value === 'object' && 'selectedValue' in value) {
    const selected = (value as { selectedValue?: unknown }).selectedValue;
    if (typeof selected === 'string') {
      const trimmed = selected.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }
  }

  return undefined;
}

/**
 * Converts any stored shape into flat strings keyed by the canonical
 * dimension names. Unknown keys are dropped; missing dimensions stay missing
 * (a half-finished assessment must not be silently completed with defaults).
 */
export function normalizeMorphology(raw: RawMorphology): Morphology {
  const normalized: Morphology = {};
  if (!raw || typeof raw !== 'object') return normalized;

  for (const key of MORPHOLOGY_DIMENSION_KEYS) {
    const value = morphologyValue(raw, key);
    if (value !== undefined) normalized[key] = value;
  }

  for (const [alias, key] of Object.entries(KEY_ALIASES)) {
    if (normalized[key] === undefined) {
      const value = morphologyValue(raw, alias);
      if (value !== undefined) normalized[key] = value;
    }
  }

  return normalized;
}

/**
 * Builds the DNA code: dimension values in canonical order, joined by "-".
 * Always derived from the normalized morphology, so the same answers always
 * produce the same code regardless of which screen recorded them.
 */
export function generateDnaCode(raw: RawMorphology): string {
  const normalized = normalizeMorphology(raw);
  return MORPHOLOGY_DIMENSION_KEYS
    .map((key) => normalized[key])
    .filter((value): value is string => Boolean(value))
    .join('-');
}

/** True when every dimension has been answered. */
export function isMorphologyComplete(raw: RawMorphology): boolean {
  const normalized = normalizeMorphology(raw);
  return MORPHOLOGY_DIMENSION_KEYS.every((key) => Boolean(normalized[key]));
}

/** Detects DNA codes produced by stringifying the old object shape. */
export function isDnaCodeCorrupt(dnaCode: string | null | undefined): boolean {
  return typeof dnaCode === 'string' && dnaCode.includes('[object Object]');
}
