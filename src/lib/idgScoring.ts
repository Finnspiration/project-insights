interface IDGContribution {
  source: string;
  sourceKey: string;
  value: number;
  reasoning: string;
  reasoningKey: string;
}

export interface IDGEvidence {
  dimension: string;
  dimensionKey: string;
  baseScore: number;
  contributions: IDGContribution[];
  totalScore: number;
  percentage: number;
  documentScore?: number;
  documentConfidence?: number;
  documentEvidence?: string;
}

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

export function calculateIDGWithEvidence(morphology: any, documents?: any[]): IDGEvidence[] {
  const development = morphology?.development || 'thinking';
  const organizational = morphology?.organizational || 'orange';
  const challenge = morphology?.challenge || 'technical';

  const dimensions = ['being', 'thinking', 'relating', 'collaborating', 'acting'];
  const evidence: IDGEvidence[] = [];

  // Aggregate document-based IDG scores
  const documentScores = aggregateDocumentIDGScores(documents || []);

  for (const dimension of dimensions) {
    const contributions: IDGContribution[] = [];
    let score = 50; // Base score

    // Primary development dimension boost
    if (development === dimension) {
      contributions.push({
        source: 'Primary Development Focus',
        sourceKey: SOURCE_KEYS.development,
        value: 30,
        reasoning: `${dimension} receives +30 because it's your primary development focus`,
        reasoningKey: REASONING_KEYS.developmentBoost,
      });
      score += 30;
    }

    // Organizational stage influences
    if (organizational === 'green' || organizational === 'teal') {
      if (dimension === 'relating') {
        contributions.push({
          source: 'Organizational Stage',
          sourceKey: SOURCE_KEYS.organizational,
          value: 15,
          reasoning: 'Relating receives +15 because Green/Teal organizations emphasize relationships and collaboration',
          reasoningKey: REASONING_KEYS.organizationalGreen,
        });
        score += 15;
      }
      if (dimension === 'collaborating') {
        contributions.push({
          source: 'Organizational Stage',
          sourceKey: SOURCE_KEYS.organizational,
          value: 15,
          reasoning: 'Collaborating receives +15 because Green/Teal organizations emphasize self-management and collective decision-making',
          reasoningKey: REASONING_KEYS.organizationalGreen,
        });
        score += 15;
      }
    }

    if (organizational === 'orange') {
      if (dimension === 'thinking') {
        contributions.push({
          source: 'Organizational Stage',
          sourceKey: SOURCE_KEYS.organizational,
          value: 15,
          reasoning: 'Thinking receives +15 because Orange organizations emphasize rational analysis and strategic thinking',
          reasoningKey: REASONING_KEYS.organizationalOrange,
        });
        score += 15;
      }
      if (dimension === 'acting') {
        contributions.push({
          source: 'Organizational Stage',
          sourceKey: SOURCE_KEYS.organizational,
          value: 10,
          reasoning: 'Acting receives +10 because Orange organizations emphasize results and achievement',
          reasoningKey: REASONING_KEYS.organizationalOrange,
        });
        score += 10;
      }
    }

    if (organizational === 'red' || organizational === 'amber') {
      if (dimension === 'acting') {
        contributions.push({
          source: 'Organizational Stage',
          sourceKey: SOURCE_KEYS.organizational,
          value: 15,
          reasoning: 'Acting receives +15 because Red/Amber organizations emphasize immediate action and control',
          reasoningKey: REASONING_KEYS.organizationalRedAmber,
        });
        score += 15;
      }
    }

    // Challenge type influences
    if (challenge === 'cognitive' && dimension === 'thinking') {
      contributions.push({
        source: 'Challenge Type',
        sourceKey: SOURCE_KEYS.challenge,
        value: 10,
        reasoning: 'Thinking receives +10 because your project faces cognitive challenges requiring analytical reasoning',
        reasoningKey: REASONING_KEYS.challengeCognitive,
      });
      score += 10;
    }

    if (challenge === 'social' && dimension === 'relating') {
      contributions.push({
        source: 'Challenge Type',
        sourceKey: SOURCE_KEYS.challenge,
        value: 10,
        reasoning: 'Relating receives +10 because your project faces social challenges requiring interpersonal skills',
        reasoningKey: REASONING_KEYS.challengeSocial,
      });
      score += 10;
    }

    if (challenge === 'adaptive' && dimension === 'being') {
      contributions.push({
        source: 'Challenge Type',
        sourceKey: SOURCE_KEYS.challenge,
        value: 10,
        reasoning: 'Being receives +10 because your project requires adaptive capacity and self-awareness',
        reasoningKey: REASONING_KEYS.challengeAdaptive,
      });
      score += 10;
    }

    // Document-based contribution (if available)
    const docData = documentScores[dimension];
    if (docData && docData.score > 0) {
      const docBoost = Math.round((docData.score - 50) * 0.3); // 30% weight from documents
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

    // Normalize to 0-100
    const totalScore = Math.min(100, Math.max(0, score));

    evidence.push({
      dimension,
      dimensionKey: `visualizations.idgRadar.dimensions.${dimension}`,
      baseScore: 50,
      contributions,
      totalScore,
      percentage: totalScore,
      documentScore: docData?.score,
      documentConfidence: docData?.confidence,
      documentEvidence: docData?.evidence,
    });
  }

  return evidence;
}

function aggregateDocumentIDGScores(documents: any[]): Record<string, { score: number; confidence: number; evidence: string }> {
  const dimensions = ['being', 'thinking', 'relating', 'collaborating', 'acting'];
  const aggregated: Record<string, { score: number; confidence: number; evidence: string; count: number }> = {};

  for (const dimension of dimensions) {
    aggregated[dimension] = { score: 0, confidence: 0, evidence: '', count: 0 };
  }

  // Aggregate scores from all documents with IDG analysis
  for (const doc of documents) {
    const idgAnalysis = doc?.metadata?.idgAnalysis;
    if (!idgAnalysis) continue;

    for (const dimension of dimensions) {
      const dimData = idgAnalysis[dimension];
      if (dimData && dimData.score) {
        aggregated[dimension].score += dimData.score * (dimData.confidence || 1);
        aggregated[dimension].confidence += (dimData.confidence || 1);
        aggregated[dimension].count++;
        
        // Keep the most recent evidence (or concatenate if needed)
        if (dimData.evidence && !aggregated[dimension].evidence) {
          aggregated[dimension].evidence = dimData.evidence;
        }
      }
    }
  }

  // Calculate weighted averages
  const result: Record<string, { score: number; confidence: number; evidence: string }> = {};
  for (const dimension of dimensions) {
    const data = aggregated[dimension];
    if (data.count > 0) {
      result[dimension] = {
        score: Math.round(data.score / data.confidence),
        confidence: Math.round((data.confidence / data.count) * 100) / 100,
        evidence: data.evidence,
      };
    }
  }

  return result;
}
