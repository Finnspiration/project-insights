export interface BodyData {
  head: {
    complexity: string;
    knowledge: string;
    color: string;
    clarity: number;
  };
  face: {
    expression: 'smile' | 'neutral' | 'tense' | 'frown';
    eyes: 'calm' | 'focused' | 'sharp' | 'stressed';
    tension: number;
    color: string;
  };
  shoulders: {
    width: number;
    color: string;
    tension: number;
    icons: string[];
  };
  torso: {
    color: string;
    openness: number;
    heartStrength: number;
  };
  belly: {
    stability: number;
    color: string;
    pattern: 'solid' | 'dots' | 'stripes' | 'waves';
    turbulence: number;
  };
  spine: {
    structure: 'rigid' | 'hierarchical' | 'network' | 'distributed';
    strength: number;
    segments: number;
    color: string;
  };
  legs: {
    stability: number;
    momentum: number;
    stance: 'forward' | 'neutral' | 'backward';
  };
  warnings: Array<{
    x: number;
    y: number;
    icon: string;
    severity: 'low' | 'medium' | 'high';
  }>;
}

function getMorphologyValue(value: any, defaultValue: string = ''): string {
  if (!value) return defaultValue;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value.selectedValue) return value.selectedValue;
  return defaultValue;
}

function normalizeMorphology(morphology: any): Record<string, string> {
  if (!morphology) return {};
  const normalized: Record<string, string> = {};
  const keys = ['complexity', 'stakeholder', 'knowledge', 'cultural', 'temporal',
    'organizational', 'challenge', 'development', 'resources', 'change', 'information', 'risk'];
  for (const key of keys) {
    normalized[key] = getMorphologyValue(morphology[key], '');
  }
  return normalized;
}

const HEALTH_COLORS = {
  healthy: '#10B981',    // Green (success)
  attention: '#F59E0B',  // Yellow/Orange (warning)
  critical: '#EF4444',   // Red (destructive)
  danger: '#DC2626'      // Dark red (extreme danger)
};

function getComplexityColor(complexity?: string): string {
  const map: Record<string, string> = {
    simple: HEALTH_COLORS.healthy,
    complicated: HEALTH_COLORS.attention,
    complex: HEALTH_COLORS.critical,
    chaotic: HEALTH_COLORS.danger
  };
  return map[complexity || 'simple'] || HEALTH_COLORS.healthy;
}

function getKnowledgeClarity(knowledge?: string): number {
  const map: Record<string, number> = {
    routine: 1.0,
    adaptive: 0.8,
    innovative: 0.6,
    breakthrough: 0.4
  };
  return map[knowledge || 'routine'] || 1.0;
}

function getStakeholderExpression(stakeholder?: string): 'smile' | 'neutral' | 'tense' | 'frown' {
  const map: Record<string, 'smile' | 'neutral' | 'tense' | 'frown'> = {
    unified: 'smile',
    cooperative: 'neutral',
    competitive: 'tense',
    adversarial: 'frown'
  };
  return map[stakeholder || 'unified'] || 'neutral';
}

function getChallengeEyes(challenge?: string): 'calm' | 'focused' | 'sharp' | 'stressed' {
  const map: Record<string, 'calm' | 'focused' | 'sharp' | 'stressed'> = {
    technical: 'focused',
    social: 'calm',
    political: 'sharp',
    cognitive: 'focused',
    adaptive: 'stressed'
  };
  return map[challenge || 'technical'] || 'calm';
}

function getStakeholderTension(stakeholder?: string): number {
  const map: Record<string, number> = {
    unified: 0,
    cooperative: 0.3,
    competitive: 0.7,
    adversarial: 1.0
  };
  return map[stakeholder || 'unified'] || 0;
}

function getFaceColor(stakeholder?: string): string {
  const tension = getStakeholderTension(stakeholder);
  if (tension >= 0.7) return HEALTH_COLORS.critical; // Red
  if (tension >= 0.3) return HEALTH_COLORS.attention; // Yellow
  return HEALTH_COLORS.healthy; // Green
}

function getResourceWidth(resources?: string): number {
  const map: Record<string, number> = {
    rich: 1.3,
    balanced: 1.0,
    constrained: 0.7,
    scarce: 0.5
  };
  return map[resources || 'balanced'] || 1.0;
}

function getResourceColor(resources?: string): string {
  const map: Record<string, string> = {
    rich: HEALTH_COLORS.healthy,
    balanced: HEALTH_COLORS.attention,
    constrained: HEALTH_COLORS.critical,
    scarce: HEALTH_COLORS.danger
  };
  return map[resources || 'balanced'] || HEALTH_COLORS.attention;
}

function getTemporalTension(temporal?: string): number {
  const map: Record<string, number> = {
    sprint: 1.0,
    project: 0.6,
    program: 0.4,
    transformation: 0.2
  };
  return map[temporal || 'project'] || 0.5;
}

function getShoulderIcons(resources?: string): string[] {
  if (resources === 'scarce') return ['⚡', '⚡'];
  if (resources === 'constrained') return ['⚡'];
  return [];
}

function getOrganizationalColor(organizational?: string): string {
  const map: Record<string, string> = {
    red: 'hsl(0, 70%, 50%)',
    amber: 'hsl(35, 70%, 50%)',
    orange: 'hsl(25, 70%, 55%)',
    green: 'hsl(120, 50%, 45%)',
    teal: 'hsl(180, 60%, 45%)'
  };
  return map[organizational || 'orange'] || map.orange;
}

function getCultureOpenness(culture?: string): number {
  const map: Record<string, number> = {
    mono: 0.3,
    'cross-functional': 0.5,
    'cross-org': 0.7,
    'cross-cultural': 1.0
  };
  return map[culture || 'mono'] || 0.5;
}

function getOrganizationalStrength(organizational?: string): number {
  const map: Record<string, number> = {
    red: 0.3,
    amber: 0.5,
    orange: 0.6,
    green: 0.8,
    teal: 1.0
  };
  return map[organizational || 'orange'] || 0.6;
}

function getTorsoHealthColor(organizational?: string): string {
  const strength = getOrganizationalStrength(organizational);
  if (strength >= 0.8) return HEALTH_COLORS.healthy; // Green (Teal, Green)
  if (strength >= 0.5) return HEALTH_COLORS.attention; // Yellow (Orange, Amber)
  return HEALTH_COLORS.critical; // Red (Red)
}

function getChangeStability(change?: string): number {
  const map: Record<string, number> = {
    incremental: 1.0,
    transitional: 0.7,
    transformational: 0.4,
    disruptive: 0.1
  };
  return map[change || 'incremental'] || 0.7;
}

function getRiskColor(risk?: string): string {
  const map: Record<string, string> = {
    low: HEALTH_COLORS.healthy,
    moderate: HEALTH_COLORS.attention,
    high: HEALTH_COLORS.critical,
    extreme: HEALTH_COLORS.danger
  };
  return map[risk || 'moderate'] || HEALTH_COLORS.attention;
}

function getRiskPattern(risk?: string): 'solid' | 'dots' | 'stripes' | 'waves' {
  const map: Record<string, 'solid' | 'dots' | 'stripes' | 'waves'> = {
    low: 'solid',
    moderate: 'dots',
    high: 'stripes',
    extreme: 'waves'
  };
  return map[risk || 'moderate'] || 'dots';
}

function getChangeTurbulence(change?: string): number {
  const map: Record<string, number> = {
    incremental: 0,
    transitional: 0.3,
    transformational: 0.7,
    disruptive: 1.0
  };
  return map[change || 'incremental'] || 0.3;
}

function getInformationStructure(information?: string): 'rigid' | 'hierarchical' | 'network' | 'distributed' {
  const map: Record<string, 'rigid' | 'hierarchical' | 'network' | 'distributed'> = {
    centralized: 'rigid',
    hierarchical: 'hierarchical',
    network: 'network',
    distributed: 'distributed'
  };
  return map[information || 'hierarchical'] || 'hierarchical';
}

function getDevelopmentStrength(development?: string): number {
  const map: Record<string, number> = {
    being: 0.8,
    thinking: 0.7,
    relating: 0.8,
    collaborating: 0.9,
    acting: 0.6
  };
  return map[development || 'thinking'] || 0.7;
}

function getSpineSegments(information?: string): number {
  const map: Record<string, number> = {
    centralized: 1,
    hierarchical: 3,
    network: 5,
    distributed: 7
  };
  return map[information || 'hierarchical'] || 3;
}

function getSpineColor(information?: string, development?: string): string {
  const strength = getDevelopmentStrength(development);
  if (strength >= 0.8) return HEALTH_COLORS.healthy;
  if (strength >= 0.6) return HEALTH_COLORS.attention;
  return HEALTH_COLORS.critical;
}

function calculateStability(morphology: any): number {
  const resourceScore = { rich: 1, balanced: 0.7, constrained: 0.4, scarce: 0.2 }[morphology.resources || 'balanced'] || 0.7;
  const orgScore = { red: 0.3, amber: 0.5, orange: 0.6, green: 0.8, teal: 1.0 }[morphology.organizational || 'orange'] || 0.6;
  const riskScore = { low: 1, moderate: 0.7, high: 0.4, extreme: 0.1 }[morphology.risk || 'moderate'] || 0.7;
  
  return (resourceScore + orgScore + riskScore) / 3;
}

function calculateMomentum(morphology: any): number {
  const changeScore = { incremental: 0.3, transitional: 0.5, transformational: 0.8, disruptive: 1.0 }[morphology.change || 'transitional'] || 0.5;
  const temporalScore = { sprint: 1.0, project: 0.7, program: 0.5, transformation: 0.3 }[morphology.temporal || 'project'] || 0.7;
  
  return (changeScore + temporalScore) / 2;
}

function getLegStance(morphology: any): 'forward' | 'neutral' | 'backward' {
  const momentum = calculateMomentum(morphology);
  if (momentum > 0.7) return 'forward';
  if (momentum < 0.4) return 'backward';
  return 'neutral';
}

function generateWarnings(morphology: any): Array<{ x: number; y: number; icon: string; severity: 'low' | 'medium' | 'high' }> {
  const warnings: Array<{ x: number; y: number; icon: string; severity: 'low' | 'medium' | 'high' }> = [];
  
  if (morphology.resources === 'scarce' || morphology.resources === 'constrained') {
    warnings.push({ x: 60, y: 90, icon: '⚡', severity: 'high' });
  }
  
  if (morphology.risk === 'extreme' || morphology.risk === 'high') {
    warnings.push({ x: 100, y: 200, icon: '⚠️', severity: 'high' });
  }
  
  if (morphology.stakeholder === 'adversarial') {
    warnings.push({ x: 100, y: 60, icon: '⚠️', severity: 'medium' });
  }
  
  if (morphology.change === 'disruptive') {
    warnings.push({ x: 100, y: 220, icon: '🌊', severity: 'medium' });
  }
  
  return warnings;
}

// Helper to get average IDG scores from documents
function getAverageIDGScores(documents?: any[]) {
  if (!documents || documents.length === 0) return null;
  
  const validDocs = documents.filter(d => d.metadata?.idgAnalysis);
  if (validDocs.length === 0) return null;
  
  const totals = { being: 0, thinking: 0, relating: 0, collaborating: 0, acting: 0 };
  
  validDocs.forEach(doc => {
    const idg = doc.metadata.idgAnalysis;
    totals.being += idg.being || 0;
    totals.thinking += idg.thinking || 0;
    totals.relating += idg.relating || 0;
    totals.collaborating += idg.collaborating || 0;
    totals.acting += idg.acting || 0;
  });
  
  const count = validDocs.length;
  return {
    being: totals.being / count,
    thinking: totals.thinking / count,
    relating: totals.relating / count,
    collaborating: totals.collaborating / count,
    acting: totals.acting / count
  };
}

export function calculateBodyData(rawMorphology: any, documents?: any[], patterns?: any): BodyData {
  // Normalize all morphology values from objects to strings
  const morphology = normalizeMorphology(rawMorphology);
  
  const idgScores = getAverageIDGScores(documents);
  // HEAD - Enhanced with IDG Thinking
  let headClarity = getKnowledgeClarity(morphology?.knowledge);
  if (idgScores && idgScores.thinking) {
    headClarity = (headClarity * 0.5) + ((idgScores.thinking / 10) * 0.5);
  }
  
  // FACE - Enhanced with IDG Relating
  let faceTension = getStakeholderTension(morphology?.stakeholder);
  if (idgScores && idgScores.relating) {
    const idgTensionFactor = 1 - (idgScores.relating / 10);
    faceTension = (faceTension * 0.5) + (idgTensionFactor * 0.5);
  }
  
  // SHOULDERS - Enhanced with blind spots pressure
  let shoulderTension = getTemporalTension(morphology?.temporal);
  if (patterns?.blindSpots) {
    const highPriorityCount = patterns.blindSpots.filter((bs: any) => bs.priority === 'high').length;
    if (highPriorityCount > 2) {
      shoulderTension = Math.min(1.0, shoulderTension + 0.3);
    }
  }
  
  // TORSO - Enhanced with IDG Being + Relating (heart strength)
  let heartStrength = getOrganizationalStrength(morphology?.organizational);
  if (idgScores) {
    const heartIDG = ((idgScores.being + idgScores.relating) / 20);
    heartStrength = (heartStrength * 0.5) + (heartIDG * 0.5);
  }
  
  // BELLY - Enhanced with recommendations pressure
  let bellyTurbulence = getChangeTurbulence(morphology?.change);
  if (patterns?.recommendations) {
    const criticalRecsCount = patterns.recommendations.filter((r: any) => r.priority === 'high').length;
    if (criticalRecsCount > 3) {
      bellyTurbulence = Math.min(1.0, bellyTurbulence + 0.2);
    }
  }
  
  // LEGS - Enhanced with IDG Acting + Collaborating
  let legStability = calculateStability(morphology);
  let legMomentum = calculateMomentum(morphology);
  
  if (idgScores) {
    const idgStability = idgScores.collaborating / 10;
    const idgMomentum = idgScores.acting / 10;
    
    legStability = (legStability * 0.5) + (idgStability * 0.5);
    legMomentum = (legMomentum * 0.5) + (idgMomentum * 0.5);
  }
  
  // WARNINGS - Enhanced with IDG-based warnings
  const warnings = generateWarnings(morphology);
  
  if (idgScores) {
    if (idgScores.being < 4) {
      warnings.push({ x: 50, y: 40, icon: '❤️‍🩹', severity: 'high' });
    }
    if (idgScores.thinking < 4) {
      warnings.push({ x: 50, y: 15, icon: '🧠', severity: 'high' });
    }
    if (idgScores.relating < 4) {
      warnings.push({ x: 45, y: 22, icon: '😟', severity: 'medium' });
    }
    if (idgScores.acting < 4) {
      warnings.push({ x: 50, y: 85, icon: '⚠️', severity: 'high' });
    }
  }
  
  if (patterns?.blindSpots) {
    const criticalBlindSpots = patterns.blindSpots.filter((bs: any) => bs.priority === 'high');
    if (criticalBlindSpots.length > 0) {
      warnings.push({ x: 55, y: 20, icon: '👁️', severity: 'high' });
    }
  }

  return {
    head: {
      complexity: morphology?.complexity || 'simple',
      knowledge: morphology?.knowledge || 'routine',
      color: getComplexityColor(morphology?.complexity),
      clarity: headClarity
    },
    
    face: {
      expression: getStakeholderExpression(morphology?.stakeholder),
      eyes: getChallengeEyes(morphology?.challenge),
      tension: faceTension,
      color: getFaceColor(morphology?.stakeholder)
    },
    
    shoulders: {
      width: getResourceWidth(morphology?.resources),
      color: getResourceColor(morphology?.resources),
      tension: shoulderTension,
      icons: getShoulderIcons(morphology?.resources)
    },
    
    torso: {
      color: getTorsoHealthColor(morphology?.organizational),
      openness: getOrganizationalStrength(morphology?.organizational),
      heartStrength: heartStrength
    },
    
    belly: {
      stability: getChangeStability(morphology?.risk),
      color: getRiskColor(morphology?.risk),
      pattern: getRiskPattern(morphology?.risk),
      turbulence: bellyTurbulence
    },
    
    spine: {
      structure: getInformationStructure(morphology?.information),
      strength: getDevelopmentStrength(morphology?.development),
      segments: getSpineSegments(morphology?.information),
      color: getSpineColor(morphology?.information, morphology?.development)
    },
    
    legs: {
      stability: legStability,
      momentum: legMomentum,
      stance: getLegStance(morphology)
    },
    
    warnings
  };
}
