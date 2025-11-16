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
}

const REASONING_KEYS = {
  developmentBoost: 'visualizations.idgRadar.evidence.reasoning.developmentBoost',
  organizationalGreen: 'visualizations.idgRadar.evidence.reasoning.organizationalGreen',
  organizationalOrange: 'visualizations.idgRadar.evidence.reasoning.organizationalOrange',
  organizationalRedAmber: 'visualizations.idgRadar.evidence.reasoning.organizationalRedAmber',
  challengeCognitive: 'visualizations.idgRadar.evidence.reasoning.challengeCognitive',
  challengeSocial: 'visualizations.idgRadar.evidence.reasoning.challengeSocial',
  challengeAdaptive: 'visualizations.idgRadar.evidence.reasoning.challengeAdaptive',
};

const SOURCE_KEYS = {
  development: 'visualizations.idgRadar.evidence.sources.development',
  organizational: 'visualizations.idgRadar.evidence.sources.organizational',
  challenge: 'visualizations.idgRadar.evidence.sources.challenge',
};

export function calculateIDGWithEvidence(morphology: any): IDGEvidence[] {
  const development = morphology?.development || 'thinking';
  const organizational = morphology?.organizational || 'orange';
  const challenge = morphology?.challenge || 'technical';

  const dimensions = ['being', 'thinking', 'relating', 'collaborating', 'acting'];
  const evidence: IDGEvidence[] = [];

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

    // Normalize to 0-100
    const totalScore = Math.min(100, Math.max(0, score));

    evidence.push({
      dimension,
      dimensionKey: `visualizations.idgRadar.dimensions.${dimension}`,
      baseScore: 50,
      contributions,
      totalScore,
      percentage: totalScore,
    });
  }

  return evidence;
}
