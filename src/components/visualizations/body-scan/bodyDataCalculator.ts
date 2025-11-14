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

export function calculateBodyData(morphology: any): BodyData {
  return {
    head: {
      complexity: morphology?.complexity || 'simple',
      knowledge: morphology?.knowledge || 'routine',
      color: getComplexityColor(morphology?.complexity),
      clarity: getKnowledgeClarity(morphology?.knowledge)
    },
    
    face: {
      expression: getStakeholderExpression(morphology?.stakeholder),
      eyes: getChallengeEyes(morphology?.challenge),
      tension: getStakeholderTension(morphology?.stakeholder)
    },
    
    shoulders: {
      width: getResourceWidth(morphology?.resources),
      color: getResourceColor(morphology?.resources),
      tension: getTemporalTension(morphology?.temporal),
      icons: getShoulderIcons(morphology?.resources)
    },
    
    torso: {
      color: getOrganizationalColor(morphology?.organizational),
      openness: getCultureOpenness(morphology?.culture),
      heartStrength: getOrganizationalStrength(morphology?.organizational)
    },
    
    belly: {
      stability: getChangeStability(morphology?.change),
      color: getRiskColor(morphology?.risk),
      pattern: getRiskPattern(morphology?.risk),
      turbulence: getChangeTurbulence(morphology?.change)
    },
    
    spine: {
      structure: getInformationStructure(morphology?.information),
      strength: getDevelopmentStrength(morphology?.inner_development),
      segments: getSpineSegments(morphology?.information)
    },
    
    legs: {
      stability: calculateStability(morphology),
      momentum: calculateMomentum(morphology),
      stance: getLegStance(morphology)
    },
    
    warnings: generateWarnings(morphology)
  };
}
