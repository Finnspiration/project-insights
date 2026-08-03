import type { Tables } from '@/integrations/supabase/types';
import type { Morphology } from '@shared/morphology.ts';

// Domain types layered on top of the generated Supabase row types. The
// generated types describe every jsonb column as `Json`, which is accurate but
// useless at the call site — these narrow the columns we actually rely on.

/** A user-facing string stored per language. Older rows hold a plain string. */
export type LocalizedText = { en?: string; da?: string } | string;

export type Language = 'en' | 'da';

/** Reads a localized field, falling back to the other language, then to ''. */
export function localized(value: LocalizedText | null | undefined, language: Language): string {
  if (typeof value === 'string') return value;
  if (!value) return '';
  return value[language] ?? value.en ?? value.da ?? '';
}

export const IDG_DIMENSIONS = ['being', 'thinking', 'relating', 'collaborating', 'acting'] as const;
export type IDGDimension = typeof IDG_DIMENSIONS[number];

/** IDG scores. The radar uses 0-100, the weather map 0-10 — see idgScoring.ts. */
export type IDGScores = Record<IDGDimension, number>;

/**
 * The `patterns` column: a shared bag written by several code paths.
 * Anything writing to it must merge rather than replace.
 */
export interface ProjectPatterns {
  idg_profile?: IDGScores;
  recommendations?: unknown[];
  interventions?: unknown[];
  blindSpots?: unknown[];
  aggregationMetadata?: {
    method?: string;
    analyzedDocuments?: number;
    totalDocuments?: number;
    overallConfidence?: number;
    overallAgreement?: number;
    aggregatedAt?: string;
    details?: Record<string, unknown>;
  };
  generated_at?: string;
  language?: string;
  [key: string]: unknown;
}

export interface DocumentMetadata {
  word_count?: number;
  character_count?: number;
  processing?: boolean;
  failed?: boolean;
  error?: string;
  failed_at?: string;
  idgAnalysis?: Partial<Record<IDGDimension, {
    score?: number;
    confidence?: number;
    evidence?: string;
  }>>;
  morphologySuggestions?: Record<string, { value?: string; confidence?: number; evidence?: string }>;
  overallConfidence?: number;
  sourceDocument?: { analyzedIndividually?: boolean };
  [key: string]: unknown;
}

type ProjectRow = Tables<'projects'>;
type DocumentRow = Tables<'documents'>;
type BlindSpotRow = Tables<'blind_spots'>;

export interface Project extends Omit<ProjectRow, 'name' | 'description' | 'morphology' | 'patterns' | 'theory_u_analysis'> {
  name: LocalizedText;
  description?: LocalizedText | null;
  morphology?: Morphology | null;
  patterns?: ProjectPatterns | null;
  theory_u_analysis?: TheoryUAnalysis | null;
}

export interface ProjectDocument extends Omit<DocumentRow, 'metadata'> {
  metadata?: DocumentMetadata | null;
}

export interface BlindSpot extends Omit<BlindSpotRow, 'title' | 'description' | 'evidence' | 'consequences' | 'recommendations'> {
  title: LocalizedText;
  description: LocalizedText;
  evidence?: unknown;
  consequences?: unknown;
  recommendations?: unknown;
}

/** Loosely typed — the shape is produced by the analyze-theory-u-position function. */
export interface TheoryUAnalysis {
  position?: { x?: number; y?: number };
  dominantPhase?: string;
  openness?: { mind?: number; heart?: number; will?: number };
  whyHere?: Record<string, unknown>;
  quotes?: Array<{ text?: string; relevance?: number; source?: string }>;
  [key: string]: unknown;
}
