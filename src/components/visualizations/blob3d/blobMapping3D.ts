// 3D Blob mapping - converts morphology to 3D visual properties
import { BlobVisualData } from '../blob/blobMapping';

export interface Blob3DData {
  // Spheres/lobes configuration
  lobeCount: number;           // 3-8 based on complexity/stakeholder
  lobeSize: number;            // 0.3-0.8 based on resources
  lobeSpread: number;          // How far lobes spread from center
  
  // Color
  primaryColor: string;        // HSL string based on organizational
  secondaryColor: string;      // Complementary/analogous
  emissiveIntensity: number;   // Glow intensity
  
  // Material
  transmission: number;        // 0.4-0.95 subsurface scattering
  roughness: number;           // 0.1-0.4 for specular highlights
  thickness: number;           // Material thickness
  ior: number;                 // Index of refraction
  
  // Animation
  pulseSpeed: number;          // Breathing animation speed
  rotationSpeed: number;       // Orbit rotation speed
  wobbleIntensity: number;     // How much lobes wobble
  
  // Risk glow
  glowColor: string;
  glowIntensity: number;
}

// Convert HSL hue to full HSL color string
function hueToHSL(hue: number, saturation: number, lightness: number): string {
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

// Get complementary color
function getSecondaryColor(hue: number): string {
  const secondaryHue = (hue + 40) % 360; // Analogous color
  return hueToHSL(secondaryHue, 70, 55);
}

// Map complexity to lobe count
function mapComplexityToLobes(complexity?: string): number {
  const map: Record<string, number> = {
    simple: 3,
    complicated: 5,
    complex: 6,
    chaotic: 8
  };
  return map[complexity || 'simple'] || 4;
}

// Map stakeholder to lobe spread
function mapStakeholderToSpread(stakeholder?: string): number {
  const map: Record<string, number> = {
    unified: 0.6,
    cooperative: 0.8,
    competitive: 1.0,
    adversarial: 1.3
  };
  return map[stakeholder || 'unified'] || 0.8;
}

// Map resources to lobe size
function mapResourcesToSize(resources?: string): number {
  const map: Record<string, number> = {
    rich: 0.8,
    balanced: 0.6,
    constrained: 0.45,
    scarce: 0.3
  };
  return map[resources || 'balanced'] || 0.6;
}

// Map temporal to pulse speed
function mapTemporalToPulse(temporal?: string): number {
  const map: Record<string, number> = {
    sprint: 3.0,
    project: 2.0,
    program: 1.2,
    transformation: 0.6
  };
  return map[temporal || 'project'] || 2.0;
}

// Map change to rotation
function mapChangeToRotation(change?: string): number {
  const map: Record<string, number> = {
    incremental: 0.1,
    transitional: 0.3,
    transformational: 0.6,
    disruptive: 1.0
  };
  return map[change || 'incremental'] || 0.3;
}

// Map knowledge to wobble
function mapKnowledgeToWobble(knowledge?: string): number {
  const map: Record<string, number> = {
    routine: 0.1,
    adaptive: 0.3,
    innovative: 0.5,
    breakthrough: 0.8
  };
  return map[knowledge || 'adaptive'] || 0.3;
}

// Map organizational to hue
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

// Map risk to glow
function mapRiskToGlow(risk?: string): { color: string; intensity: number } {
  const map: Record<string, { color: string; intensity: number }> = {
    low: { color: '#10B981', intensity: 0.2 },
    moderate: { color: '#F59E0B', intensity: 0.4 },
    high: { color: '#F97316', intensity: 0.6 },
    extreme: { color: '#EF4444', intensity: 0.9 }
  };
  return map[risk || 'low'] || map.low;
}

// Map development to transmission (more developed = more transparent/glowing)
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

// Helper to get morphology value
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
  const resources = getValue(morphology, 'resource');
  const temporal = getValue(morphology, 'temporal');
  const change = getValue(morphology, 'change');
  const knowledge = getValue(morphology, 'knowledge');
  const organizational = getValue(morphology, 'organizational');
  const risk = getValue(morphology, 'risk');
  const development = getValue(morphology, 'development');
  
  const hue = mapOrganizationalToHue(organizational);
  const riskData = mapRiskToGlow(risk);
  
  return {
    lobeCount: mapComplexityToLobes(complexity),
    lobeSize: mapResourcesToSize(resources),
    lobeSpread: mapStakeholderToSpread(stakeholder),
    
    primaryColor: hueToHSL(hue, 75, 55),
    secondaryColor: getSecondaryColor(hue),
    emissiveIntensity: 0.3,
    
    transmission: mapDevelopmentToTransmission(development),
    roughness: 0.15,
    thickness: 2.5,
    ior: 1.5,
    
    pulseSpeed: mapTemporalToPulse(temporal),
    rotationSpeed: mapChangeToRotation(change),
    wobbleIntensity: mapKnowledgeToWobble(knowledge),
    
    glowColor: riskData.color,
    glowIntensity: riskData.intensity
  };
}
