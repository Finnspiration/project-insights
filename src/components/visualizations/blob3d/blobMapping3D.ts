// 3D Blob mapping - converts morphology to 3D visual properties
// Maps ALL 12 PRISM morphology dimensions to visual blob properties

export interface Blob3DData {
  // Shape - from complexity & stakeholder
  lobeCount: number;           // 3-8 based on stakeholder
  lobeSize: number;            // 0.3-0.8 based on resources
  lobeSpread: number;          // How far lobes spread from center
  surfaceRoughness: number;    // 0.1-0.9 - surface deformation (complexity)
  symmetry: number;            // 0.3-1.0 (information flow)
  
  // Color - from organizational, cultural, resources
  primaryColor: string;        // HSL string based on organizational
  secondaryColor: string;      // Complementary/analogous
  colorCount: number;          // 1-4 distinct colors (cultural)
  colors: string[];            // Array of colors based on colorCount
  saturation: number;          // 40-90% (resources)
  brightness: number;          // 40-80% (resources)
  
  // Material
  transmission: number;        // 0.4-0.95 subsurface scattering
  roughness: number;           // 0.1-0.4 for specular highlights
  thickness: number;           // Material thickness
  ior: number;                 // Index of refraction
  
  // Animation - from temporal, change
  pulseSpeed: number;          // Breathing animation speed (temporal)
  rotationSpeed: number;       // Orbit rotation speed (change)
  wobbleIntensity: number;     // How much lobes wobble (knowledge)
  
  // Effects - from risk, challenge, development
  glowColor: string;           // Outer glow color (risk)
  glowIntensity: number;       // Outer glow intensity (risk)
  noiseIntensity: number;      // 0.2-0.9 noise particles (challenge)
  coreGlow: number;            // 0.3-1.0 core brightness (development)
  
  // Pattern - from knowledge
  innerPattern: 'grid' | 'waves' | 'particles' | 'chaos';
  
  // Scale - from resources
  resourceScale: number;       // 0.6-1.3 overall scale
  
  // Emissive
  emissiveIntensity: number;
}

// Convert HSL values to full HSL color string
function hslToString(hue: number, saturation: number, lightness: number): string {
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

// Generate color array based on hue and colorCount
function generateColors(baseHue: number, colorCount: number, saturation: number, lightness: number): string[] {
  const colors: string[] = [];
  const hueStep = 360 / Math.max(colorCount, 1);
  
  for (let i = 0; i < colorCount; i++) {
    const hue = (baseHue + i * hueStep * 0.3) % 360; // Spread colors by 30% of step
    colors.push(hslToString(hue, saturation, lightness));
  }
  
  return colors;
}

// Get complementary color
function getSecondaryColor(hue: number, saturation: number, lightness: number): string {
  const secondaryHue = (hue + 40) % 360; // Analogous color
  return hslToString(secondaryHue, saturation * 0.9, lightness + 5);
}

// Complexity → Surface roughness/deformation
function mapComplexityToRoughness(complexity?: string): number {
  const map: Record<string, number> = {
    simple: 0.1,
    complicated: 0.35,
    complex: 0.6,
    chaotic: 0.9
  };
  return map[complexity || 'simple'] || 0.3;
}

// Stakeholder → Lobe count (arms)
function mapStakeholderToLobes(stakeholder?: string): number {
  const map: Record<string, number> = {
    unified: 3,
    cooperative: 5,
    competitive: 6,
    adversarial: 8
  };
  return map[stakeholder || 'unified'] || 4;
}

// Stakeholder → Lobe spread
function mapStakeholderToSpread(stakeholder?: string): number {
  const map: Record<string, number> = {
    unified: 0.6,
    cooperative: 0.8,
    competitive: 1.0,
    adversarial: 1.3
  };
  return map[stakeholder || 'unified'] || 0.8;
}

// Knowledge → Inner pattern type
function mapKnowledgeToPattern(knowledge?: string): 'grid' | 'waves' | 'particles' | 'chaos' {
  const map: Record<string, 'grid' | 'waves' | 'particles' | 'chaos'> = {
    routine: 'grid',
    adaptive: 'waves',
    innovative: 'particles',
    breakthrough: 'chaos'
  };
  return map[knowledge || 'adaptive'] || 'waves';
}

// Knowledge → Wobble intensity
function mapKnowledgeToWobble(knowledge?: string): number {
  const map: Record<string, number> = {
    routine: 0.1,
    adaptive: 0.3,
    innovative: 0.5,
    breakthrough: 0.8
  };
  return map[knowledge || 'adaptive'] || 0.3;
}

// Cultural → Color count
function mapCulturalToColorCount(cultural?: string): number {
  const map: Record<string, number> = {
    mono: 1,
    crossfunctional: 2,
    crossorg: 3,
    crosscultural: 4
  };
  return map[cultural || 'mono'] || 1;
}

// Temporal → Pulse speed
function mapTemporalToPulse(temporal?: string): number {
  const map: Record<string, number> = {
    sprint: 3.0,
    project: 2.0,
    program: 1.2,
    transformation: 0.6
  };
  return map[temporal || 'project'] || 2.0;
}

// Organizational → Base hue
function mapOrganizationalToHue(organizational?: string): number {
  const map: Record<string, number> = {
    red: 0,
    amber: 35,
    orange: 25,
    green: 145,
    teal: 190
  };
  return map[organizational || 'orange'] || 25;
}

// Challenge → Noise intensity
function mapChallengeToNoise(challenge?: string): number {
  const map: Record<string, number> = {
    technical: 0.2,
    social: 0.4,
    political: 0.6,
    cognitive: 0.7,
    adaptive: 0.9
  };
  return map[challenge || 'technical'] || 0.4;
}

// Development → Core glow intensity
function mapDevelopmentToCoreGlow(development?: string): number {
  const map: Record<string, number> = {
    being: 1.0,
    thinking: 0.8,
    relating: 0.6,
    collaborating: 0.6,
    acting: 0.4
  };
  return map[development || 'relating'] || 0.6;
}

// Development → Transmission
function mapDevelopmentToTransmission(development?: string): number {
  const map: Record<string, number> = {
    being: 0.95,
    thinking: 0.85,
    relating: 0.75,
    collaborating: 0.7,
    acting: 0.6
  };
  return map[development || 'relating'] || 0.75;
}

// Resources → Size, saturation, brightness, scale
function mapResources(resources?: string): { 
  size: number; 
  saturation: number; 
  brightness: number; 
  scale: number 
} {
  const map: Record<string, { size: number; saturation: number; brightness: number; scale: number }> = {
    rich: { size: 0.8, saturation: 90, brightness: 70, scale: 1.3 },
    balanced: { size: 0.6, saturation: 70, brightness: 60, scale: 1.0 },
    constrained: { size: 0.45, saturation: 50, brightness: 50, scale: 0.85 },
    scarce: { size: 0.3, saturation: 40, brightness: 40, scale: 0.7 }
  };
  return map[resources || 'balanced'] || map.balanced;
}

// Change → Rotation speed
function mapChangeToRotation(change?: string): number {
  const map: Record<string, number> = {
    incremental: 0.1,
    transitional: 0.3,
    transformational: 0.6,
    disruptive: 1.0
  };
  return map[change || 'incremental'] || 0.3;
}

// Information → Symmetry
function mapInformationToSymmetry(information?: string): number {
  const map: Record<string, number> = {
    centralized: 1.0,
    hierarchical: 0.7,
    network: 0.5,
    distributed: 0.3
  };
  return map[information || 'hierarchical'] || 0.7;
}

// Risk → Glow color and intensity
function mapRiskToGlow(risk?: string): { color: string; intensity: number } {
  const map: Record<string, { color: string; intensity: number }> = {
    low: { color: '#10B981', intensity: 0.3 },
    moderate: { color: '#F59E0B', intensity: 0.5 },
    high: { color: '#F97316', intensity: 0.75 },
    extreme: { color: '#EF4444', intensity: 1.0 }
  };
  return map[risk || 'low'] || map.low;
}

// Helper to get morphology value (handles both direct and nested formats)
function getValue(morphology: any, key: string): string {
  const value = morphology?.[key];
  if (typeof value === 'object' && value !== null) {
    return value.selectedValue || '';
  }
  return value || '';
}

// Main 3D mapping function
export function mapMorphologyTo3DBlob(morphology: any): Blob3DData {
  const complexity = getValue(morphology, 'complexity');
  const stakeholder = getValue(morphology, 'stakeholder');
  const resources = getValue(morphology, 'resource') || getValue(morphology, 'resources');
  const temporal = getValue(morphology, 'temporal');
  const change = getValue(morphology, 'change');
  const knowledge = getValue(morphology, 'knowledge');
  const organizational = getValue(morphology, 'organizational');
  const risk = getValue(morphology, 'risk');
  const development = getValue(morphology, 'development');
  const cultural = getValue(morphology, 'cultural');
  const information = getValue(morphology, 'information');
  const challenge = getValue(morphology, 'challenge');
  
  const hue = mapOrganizationalToHue(organizational);
  const riskData = mapRiskToGlow(risk);
  const resourceData = mapResources(resources);
  const colorCount = mapCulturalToColorCount(cultural);
  const colors = generateColors(hue, colorCount, resourceData.saturation, resourceData.brightness);
  
  return {
    // Shape
    lobeCount: mapStakeholderToLobes(stakeholder),
    lobeSize: resourceData.size,
    lobeSpread: mapStakeholderToSpread(stakeholder),
    surfaceRoughness: mapComplexityToRoughness(complexity),
    symmetry: mapInformationToSymmetry(information),
    
    // Color
    primaryColor: hslToString(hue, resourceData.saturation, resourceData.brightness),
    secondaryColor: getSecondaryColor(hue, resourceData.saturation, resourceData.brightness),
    colorCount,
    colors,
    saturation: resourceData.saturation,
    brightness: resourceData.brightness,
    
    // Material
    transmission: mapDevelopmentToTransmission(development),
    roughness: 0.15,
    thickness: 2.5,
    ior: 1.5,
    
    // Animation
    pulseSpeed: mapTemporalToPulse(temporal),
    rotationSpeed: mapChangeToRotation(change),
    wobbleIntensity: mapKnowledgeToWobble(knowledge),
    
    // Effects
    glowColor: riskData.color,
    glowIntensity: riskData.intensity,
    noiseIntensity: mapChallengeToNoise(challenge),
    coreGlow: mapDevelopmentToCoreGlow(development),
    
    // Pattern
    innerPattern: mapKnowledgeToPattern(knowledge),
    
    // Scale
    resourceScale: resourceData.scale,
    
    // Emissive
    emissiveIntensity: 0.3
  };
}
