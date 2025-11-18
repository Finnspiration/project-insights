// Maps 12 PRISM morphology dimensions to visual blob properties

export interface BlobVisualData {
  // Shape
  roughness: number;        // 0.1 - 0.9 (complexity)
  arms: number;             // 2 - 8 (stakeholder)
  symmetry: number;         // 0.3 - 1.0 (information)
  
  // Color
  baseHue: number;          // 0-360 (organizational)
  colorSpread: number;      // 1-4 colors (cultural)
  saturation: number;       // 40-90% (resources)
  brightness: number;       // 40-80% (resources)
  
  // Animation
  pulseSpeed: number;       // 2-10s (temporal)
  rotationSpeed: number;    // 0-120 deg/s (change)
  
  // Effects
  noiseIntensity: number;   // 0.2-0.9 (challenge)
  coreGlow: number;         // 0.3-1.0 (development)
  outerGlowColor: string;   // color (risk)
  outerGlowIntensity: number; // 0-1 (risk)
  
  // Pattern
  innerPattern: 'grid' | 'waves' | 'particles' | 'chaos'; // knowledge
  
  // Scale
  resourceScale: number;    // 0.6-1.3 (resources)
}

// Complexity → Kontur-ujævnhed
function mapComplexity(complexity?: string): number {
  const map: Record<string, number> = {
    simple: 0.1,
    complicated: 0.3,
    complex: 0.6,
    chaotic: 0.9
  };
  return map[complexity || 'simple'] || 0.3;
}

// Stakeholder → Antal "arme"
function mapStakeholder(stakeholder?: string): number {
  const map: Record<string, number> = {
    unified: 2,
    cooperative: 4,
    competitive: 6,
    adversarial: 8
  };
  return map[stakeholder || 'unified'] || 4;
}

// Knowledge → Indre mønster
function mapKnowledge(knowledge?: string): 'grid' | 'waves' | 'particles' | 'chaos' {
  const map: Record<string, 'grid' | 'waves' | 'particles' | 'chaos'> = {
    routine: 'grid',
    adaptive: 'waves',
    innovative: 'particles',
    breakthrough: 'chaos'
  };
  return map[knowledge || 'adaptive'] || 'waves';
}

// Cultural → Farvevariation
function mapCultural(cultural?: string): number {
  const map: Record<string, number> = {
    mono: 1,
    crossfunctional: 2,
    crossorg: 3,
    crosscultural: 4
  };
  return map[cultural || 'mono'] || 1;
}

// Temporal → Puls-hastighed (seconds)
function mapTemporal(temporal?: string): number {
  const map: Record<string, number> = {
    sprint: 2,
    project: 4,
    program: 6,
    transformation: 10
  };
  return map[temporal || 'project'] || 4;
}

// Organizational → Base-farve (HSL hue)
function mapOrganizational(organizational?: string): number {
  const map: Record<string, number> = {
    red: 0,        // #DC2626
    amber: 35,     // #F59E0B
    orange: 25,    // #F97316
    green: 145,    // #10B981
    teal: 190      // #06B6D4
  };
  return map[organizational || 'orange'] || 25;
}

// Challenge → Indre støj
function mapChallenge(challenge?: string): number {
  const map: Record<string, number> = {
    technical: 0.2,
    social: 0.4,
    political: 0.6,
    cognitive: 0.7,
    adaptive: 0.9
  };
  return map[challenge || 'technical'] || 0.4;
}

// Development → Indre kernes lysstyrke
function mapDevelopment(development?: string): number {
  const map: Record<string, number> = {
    being: 1.0,
    thinking: 0.8,
    relating: 0.6,
    collaborating: 0.6,
    acting: 0.4
  };
  return map[development || 'relating'] || 0.6;
}

// Resources → Størrelse + mætning
function mapResources(resources?: string): { saturation: number; brightness: number; scale: number } {
  const map: Record<string, { saturation: number; brightness: number; scale: number }> = {
    rich: { saturation: 90, brightness: 70, scale: 1.3 },
    balanced: { saturation: 70, brightness: 60, scale: 1.0 },
    constrained: { saturation: 50, brightness: 45, scale: 0.8 },
    scarce: { saturation: 40, brightness: 35, scale: 0.6 }
  };
  return map[resources || 'balanced'] || map.balanced;
}

// Change → Rotation hastighed (degrees per second)
function mapChange(change?: string): number {
  const map: Record<string, number> = {
    incremental: 0,
    transitional: 30,
    transformational: 60,
    disruptive: 120
  };
  return map[change || 'incremental'] || 0;
}

// Information → Symmetri
function mapInformation(information?: string): number {
  const map: Record<string, number> = {
    centralized: 1.0,
    hierarchical: 0.7,
    network: 0.4,
    distributed: 0.3
  };
  return map[information || 'hierarchical'] || 0.7;
}

// Risk → Ydre glød
function mapRisk(risk?: string): { color: string; intensity: number } {
  const map: Record<string, { color: string; intensity: number }> = {
    low: { color: '#10B981', intensity: 0.3 },
    moderate: { color: '#F59E0B', intensity: 0.5 },
    high: { color: '#F97316', intensity: 0.7 },
    extreme: { color: '#EF4444', intensity: 1.0 }
  };
  return map[risk || 'low'] || map.low;
}

// Main mapping function
export function mapMorphologyToBlob(morphology: any): BlobVisualData {
  const resourceData = mapResources(morphology?.resources?.selectedValue || morphology?.resources);
  const riskData = mapRisk(morphology?.risk?.selectedValue || morphology?.risk);
  
  return {
    // Shape
    roughness: mapComplexity(morphology?.complexity?.selectedValue || morphology?.complexity),
    arms: mapStakeholder(morphology?.stakeholder?.selectedValue || morphology?.stakeholder),
    symmetry: mapInformation(morphology?.information?.selectedValue || morphology?.information),
    
    // Color
    baseHue: mapOrganizational(morphology?.organizational?.selectedValue || morphology?.organizational),
    colorSpread: mapCultural(morphology?.cultural?.selectedValue || morphology?.cultural),
    saturation: resourceData.saturation,
    brightness: resourceData.brightness,
    
    // Animation
    pulseSpeed: mapTemporal(morphology?.temporal?.selectedValue || morphology?.temporal),
    rotationSpeed: mapChange(morphology?.change?.selectedValue || morphology?.change),
    
    // Effects
    noiseIntensity: mapChallenge(morphology?.challenge?.selectedValue || morphology?.challenge),
    coreGlow: mapDevelopment(morphology?.development?.selectedValue || morphology?.development),
    outerGlowColor: riskData.color,
    outerGlowIntensity: riskData.intensity,
    
    // Pattern
    innerPattern: mapKnowledge(morphology?.knowledge?.selectedValue || morphology?.knowledge),
    
    // Scale
    resourceScale: resourceData.scale
  };
}
