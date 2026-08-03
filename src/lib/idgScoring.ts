import { morphologyValue, type RawMorphology } from '@shared/morphology.ts';
import { IDG_DIMENSIONS, type IDGDimension, type IDGScores } from '@/types/project';
import type { ProjectDocument } from '@/types/project';

// One IDG model.
//
// There used to be three: calculateIDGScoresFromMorphology() for the radar and
// weather map, calculateIDGWithEvidence() for the "why this number" panel, and
// a third copy inlined in IDGRadarChart. Only the evidence version counted the
// document analysis, so the radar could show 65 while its own breakdown summed
// to 74. The scores below are now derived from the evidence, so the number and
// its explanation cannot disagree.

export interface IDGContribution {
  source: string;
  sourceKey: string;
  value: number;
  reasoning: string;
  reasoningKey: string;
}

export interface IDGEvidence {
  dimension: IDGDimension;
  dimensionKey: string;
  baseScore: number;
  contributions: IDGContribution[];
  totalScore: number;
  percentage: number;
  documentScore?: number;
  documentConfidence?: number;
  documentEvidence?: string;
}

export interface IDGCalculation {
  /** 0-100, used by the radar chart and the portfolio views. */
  radar: IDGScores;
  /** 0-10, used by the cultural weather map. */
  weather: IDGScores;
  evidence: IDGEvidence[];
  /** True when at least one document contributed to the scores. */
  usedDocuments: boolean;
}

const BASE_SCORE = 50;

/** Share of a document's IDG score that is allowed to move the morphology-based score. */
const DOCUMENT_WEIGHT = 0.3;

const REASONING_KEYS = {
  developmentBoost: 'visualizations.idgRadar.evidence.reasoning.developmentBoost',
  organizationalGreen: 'visualizations.idgRadar.evidence.reasoning.organizationalGreen',
  organizationalOrange: 'visualizations.idgRadar.evidence.reasoning.organizationalOrange',
  organizationalRedAmber: 'visualizations.idgRadar.evidence.reasoning.organizationalRedAmber',
  challengeCognitive: 'visualizations.idgRadar.evidence.reasoning.challengeCognitive',
  challengeSocial: 'visualizations.idgRadar.evidence.reasoning.challengeSocial',
  challengeAdaptive: 'visualizations.idgRadar.evidence.reasoning.challengeAdaptive',
  documentBoost: 'visualizations.idgRadar.evidence.reasoning.documentBoost',
};

const SOURCE_KEYS = {
  development: 'visualizations.idgRadar.evidence.sources.development',
  organizational: 'visualizations.idgRadar.evidence.sources.organizational',
  challenge: 'visualizations.idgRadar.evidence.sources.challenge',
  documents: 'visualizations.idgRadar.evidence.sources.documents',
};

interface Rule {
  /** Dimensions this rule applies to. */
  dimensions: IDGDimension[];
  points: number;
  source: string;
  sourceKey: string;
  reasoning: string;
  reasoningKey: string;
}

/** Rules keyed by the morphology answer that triggers them. */
const DEVELOPMENT_RULE = (dimension: IDGDimension): Rule => ({
  dimensions: [dimension],
  points: 30,
  source: 'Primary Development Focus',
  sourceKey: SOURCE_KEYS.development,
  reasoning: `${dimension} receives +30 because it's your primary development focus`,
  reasoningKey: REASONING_KEYS.developmentBoost,
});

const ORGANIZATIONAL_RULES: Record<string, Rule[]> = {
  green: [
    {
      dimensions: ['relating'],
      points: 15,
      source: 'Organizational Stage',
      sourceKey: SOURCE_KEYS.organizational,
      reasoning: 'Relating receives +15 because Green/Teal organizations emphasize relationships and collaboration',
      reasoningKey: REASONING_KEYS.organizationalGreen,
    },
    {
      dimensions: ['collaborating'],
      points: 15,
      source: 'Organizational Stage',
      sourceKey: SOURCE_KEYS.organizational,
      reasoning: 'Collaborating receives +15 because Green/Teal organizations emphasize self-management and collective decision-making',
      reasoningKey: REASONING_KEYS.organizationalGreen,
    },
  ],
  orange: [
    {
      dimensions: ['thinking'],
      points: 15,
      source: 'Organizational Stage',
      sourceKey: SOURCE_KEYS.organizational,
      reasoning: 'Thinking receives +15 because Orange organizations emphasize rational analysis and strategic thinking',
      reasoningKey: REASONING_KEYS.organizationalOrange,
    },
    {
      dimensions: ['acting'],
      points: 10,
      source: 'Organizational Stage',
      sourceKey: SOURCE_KEYS.organizational,
      reasoning: 'Acting receives +10 because Orange organizations emphasize results and achievement',
      reasoningKey: REASONING_KEYS.organizationalOrange,
    },
  ],
  red: [
    {
      dimensions: ['acting'],
      points: 15,
      source: 'Organizational Stage',
      sourceKey: SOURCE_KEYS.organizational,
      reasoning: 'Acting receives +15 because Red/Amber organizations emphasize immediate action and control',
      reasoningKey: REASONING_KEYS.organizationalRedAmber,
    },
  ],
};
ORGANIZATIONAL_RULES.teal = ORGANIZATIONAL_RULES.green;
ORGANIZATIONAL_RULES.amber = ORGANIZATIONAL_RULES.red;

const CHALLENGE_RULES: Record<string, Rule[]> = {
  cognitive: [
    {
      dimensions: ['thinking'],
      points: 10,
      source: 'Challenge Type',
      sourceKey: SOURCE_KEYS.challenge,
      reasoning: 'Thinking receives +10 because your project faces cognitive challenges requiring analytical reasoning',
      reasoningKey: REASONING_KEYS.challengeCognitive,
    },
  ],
  social: [
    {
      dimensions: ['relating'],
      points: 10,
      source: 'Challenge Type',
      sourceKey: SOURCE_KEYS.challenge,
      reasoning: 'Relating receives +10 because your project faces social challenges requiring interpersonal skills',
      reasoningKey: REASONING_KEYS.challengeSocial,
    },
  ],
  adaptive: [
    {
      dimensions: ['being'],
      points: 10,
      source: 'Challenge Type',
      sourceKey: SOURCE_KEYS.challenge,
      reasoning: 'Being receives +10 because your project requires adaptive capacity and self-awareness',
      reasoningKey: REASONING_KEYS.challengeAdaptive,
    },
  ],
};

interface AggregatedDocumentScore {
  score: number;
  confidence: number;
  evidence: string;
}

/** Confidence-weighted average of the per-document IDG analyses. */
function aggregateDocumentIDGScores(
  documents: ProjectDocument[] | undefined,
): Partial<Record<IDGDimension, AggregatedDocumentScore>> {
  const totals: Record<string, { weighted: number; confidence: number; count: number; evidence: string }> = {};
  for (const dimension of IDG_DIMENSIONS) {
    totals[dimension] = { weighted: 0, confidence: 0, count: 0, evidence: '' };
  }

  for (const doc of documents ?? []) {
    const analysis = doc?.metadata?.idgAnalysis;
    if (!analysis) continue;

    for (const dimension of IDG_DIMENSIONS) {
      const entry = analysis[dimension];
      if (!entry || typeof entry.score !== 'number') continue;

      const confidence = typeof entry.confidence === 'number' ? entry.confidence : 1;
      totals[dimension].weighted += entry.score * confidence;
      totals[dimension].confidence += confidence;
      totals[dimension].count += 1;

      if (entry.evidence && !totals[dimension].evidence) {
        totals[dimension].evidence = entry.evidence;
      }
    }
  }

  const result: Partial<Record<IDGDimension, AggregatedDocumentScore>> = {};
  for (const dimension of IDG_DIMENSIONS) {
    const data = totals[dimension];
    if (data.count === 0 || data.confidence === 0) continue;
    result[dimension] = {
      score: Math.round(data.weighted / data.confidence),
      confidence: Math.round((data.confidence / data.count) * 100) / 100,
      evidence: data.evidence,
    };
  }

  return result;
}

function clamp(score: number): number {
  return Math.min(100, Math.max(0, score));
}

/**
 * Scores the five IDG dimensions from the morphological assessment, and from
 * the uploaded documents when they carry an IDG analysis.
 *
 * Pass `documents` wherever they are available. Portfolio-level views that do
 * not load documents can omit them; `usedDocuments` then reports false so the
 * UI can say the score is based on the assessment alone.
 */
export function calculateIDG(
  morphology: RawMorphology,
  documents?: ProjectDocument[],
): IDGCalculation {
  const development = morphologyValue(morphology, 'development') ?? 'thinking';
  const organizational = morphologyValue(morphology, 'organizational') ?? 'orange';
  const challenge = morphologyValue(morphology, 'challenge') ?? 'technical';

  const documentScores = aggregateDocumentIDGScores(documents);
  const rules: Rule[] = [
    ...(IDG_DIMENSIONS.includes(development as IDGDimension)
      ? [DEVELOPMENT_RULE(development as IDGDimension)]
      : []),
    ...(ORGANIZATIONAL_RULES[organizational] ?? []),
    ...(CHALLENGE_RULES[challenge] ?? []),
  ];

  const evidence: IDGEvidence[] = IDG_DIMENSIONS.map((dimension) => {
    const contributions: IDGContribution[] = [];
    let score = BASE_SCORE;

    for (const rule of rules) {
      if (!rule.dimensions.includes(dimension)) continue;
      contributions.push({
        source: rule.source,
        sourceKey: rule.sourceKey,
        value: rule.points,
        reasoning: rule.reasoning,
        reasoningKey: rule.reasoningKey,
      });
      score += rule.points;
    }

    const docData = documentScores[dimension];
    if (docData) {
      const docBoost = Math.round((docData.score - BASE_SCORE) * DOCUMENT_WEIGHT);
      if (docBoost !== 0) {
        contributions.push({
          source: 'Document Analysis',
          sourceKey: SOURCE_KEYS.documents,
          value: docBoost,
          reasoning: `${dimension} receives ${docBoost > 0 ? '+' : ''}${docBoost} based on analysis of uploaded documents`,
          reasoningKey: REASONING_KEYS.documentBoost,
        });
        score += docBoost;
      }
    }

    const totalScore = clamp(score);

    return {
      dimension,
      dimensionKey: `visualizations.idgRadar.dimensions.${dimension}`,
      baseScore: BASE_SCORE,
      contributions,
      totalScore,
      percentage: totalScore,
      documentScore: docData?.score,
      documentConfidence: docData?.confidence,
      documentEvidence: docData?.evidence,
    };
  });

  const radar = Object.fromEntries(
    evidence.map((item) => [item.dimension, item.totalScore]),
  ) as IDGScores;

  const weather = Object.fromEntries(
    evidence.map((item) => [item.dimension, item.totalScore / 10]),
  ) as IDGScores;

  return {
    radar,
    weather,
    evidence,
    usedDocuments: Object.keys(documentScores).length > 0,
  };
}
