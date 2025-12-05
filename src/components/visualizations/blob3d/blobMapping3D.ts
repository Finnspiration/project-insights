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
  
  // NEW: Enhanced visual properties
  spikeCount: number;          // 0-20 spikes based on complexity + challenge
  spikeLength: number;         // 0.1-0.5 spike length
  holeCount: number;           // 0-8 holes based on information (distributed = many)
  holeSize: number;            // 0.1-0.3 hole radius
  wireframeOpacity: number;    // 0-1 wireframe visibility (knowledge)
  coreVisibility: number;      // 0-1 how visible the core is (development)
  backgroundStyle: 'neutral' | 'warm' | 'danger' | 'critical'; // Based on risk
  outerAuraIntensity: number;  // 0-1 outer glow aura
  outerAuraColor: string;      // Aura color
  multiHueColors: string[];    // Distinct hue colors for cultural
  
  // NEW: Knowledge-specific visual properties
  surfaceSmoothing: number;        // 0 = faceted/crystalline, 1 = smooth/organic
  outerParticleCount: number;      // 50-250 orbiting particles
  outerParticleOrganization: number; // 1 = organized ring, 0 = chaotic cloud
  knowledgeGlowIntensity: number;  // Separate glow for knowledge
  knowledgeGlowSharpness: number;  // 1 = sharp edge, 0 = diffuse aura
  knowledgeGlowColor: string;      // Edge glow color
}

// Convert HSL values to full HSL color string
function hslToString(hue: number, saturation: number, lightness: number): string {
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

// Generate multi-hue colors with VERY distinct hues for Cultural
function generateMultiHueColors(baseHue: number, colorCount: number, saturation: number, lightness: number): string[] {
  if (colorCount === 1) {
    return [hslToString(baseHue, saturation, lightness)];
  }
  
  // Use maximally different hues for each color count
  const hueOffsets: Record<number, number[]> = {
    2: [0, 180],           // Complementary
    3: [0, 120, 240],      // Triadic
    4: [0, 90, 180, 270],  // Tetradic
  };
  
  const offsets = hueOffsets[colorCount] || [0];
  return offsets.map(offset => {
    const hue = (baseHue + offset) % 360;
    return hslToString(hue, saturation, lightness);
  });
}

// Generate color array based on hue and colorCount (legacy - less distinct)
function generateColors(baseHue: number, colorCount: number, saturation: number, lightness: number): string[] {
  const colors: string[] = [];
  const hueStep = 360 / Math.max(colorCount, 1);
  
  for (let i = 0; i < colorCount; i++) {
    const hue = (baseHue + i * hueStep * 0.3) % 360;
    colors.push(hslToString(hue, saturation, lightness));
  }
  
  return colors;
}

// Get complementary color
function getSecondaryColor(hue: number, saturation: number, lightness: number): string {
  const secondaryHue = (hue + 40) % 360;
  return hslToString(secondaryHue, saturation * 0.9, lightness + 5);
}

// Complexity → Surface roughness/deformation AND spikes
function mapComplexityToEffects(complexity?: string): { roughness: number; spikeContribution: number } {
  const map: Record<string, { roughness: number; spikeContribution: number }> = {
    simple: { roughness: 0.1, spikeContribution: 0 },
    complicated: { roughness: 0.35, spikeContribution: 0.3 },
    complex: { roughness: 0.6, spikeContribution: 0.6 },
    chaotic: { roughness: 0.9, spikeContribution: 1.0 }
  };
  return map[complexity || 'simple'] || { roughness: 0.3, spikeContribution: 0.2 };
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

// Knowledge → ENHANCED visual properties with dramatic differences
function mapKnowledgeToVisuals(knowledge?: string): { 
  pattern: 'grid' | 'waves' | 'particles' | 'chaos'; 
  wireframeOpacity: number;
  wobble: number;
  // NEW enhanced properties
  surfaceSmoothing: number;        // 0 = faceted/crystalline, 1 = smooth/organic
  outerParticleCount: number;      // Visible outer particles
  outerParticleOrganization: number; // 1 = ring, 0 = chaotic cloud
  knowledgeGlowIntensity: number;  // Edge glow strength
  knowledgeGlowSharpness: number;  // 1 = sharp, 0 = diffuse
} {
  const map: Record<string, { 
    pattern: 'grid' | 'waves' | 'particles' | 'chaos'; 
    wireframeOpacity: number; 
    wobble: number;
    surfaceSmoothing: number;
    outerParticleCount: number;
    outerParticleOrganization: number;
    knowledgeGlowIntensity: number;
    knowledgeGlowSharpness: number;
  }> = {
    // Routine: Crystalline/faceted, organized ring, sharp edge glow
    routine: { 
      pattern: 'grid', 
      wireframeOpacity: 0.6, 
      wobble: 0.1,
      surfaceSmoothing: 0,          // Faceted surface
      outerParticleCount: 120,      // Many particles in organized ring
      outerParticleOrganization: 1.0,
      knowledgeGlowIntensity: 0.9,  // Strong edge glow
      knowledgeGlowSharpness: 1.0   // Sharp, concentrated
    },
    // Adaptive: Partially faceted, undulating ring, medium glow
    adaptive: { 
      pattern: 'waves', 
      wireframeOpacity: 0.3, 
      wobble: 0.3,
      surfaceSmoothing: 0.35,
      outerParticleCount: 90,
      outerParticleOrganization: 0.7,
      knowledgeGlowIntensity: 0.6,
      knowledgeGlowSharpness: 0.7
    },
    // Innovative: Smooth surface, scattered particles, diffuse glow
    innovative: { 
      pattern: 'particles', 
      wireframeOpacity: 0.1, 
      wobble: 0.5,
      surfaceSmoothing: 0.75,
      outerParticleCount: 70,
      outerParticleOrganization: 0.3,
      knowledgeGlowIntensity: 0.4,
      knowledgeGlowSharpness: 0.4
    },
    // Breakthrough: Organic with distortion, chaotic cloud, pulsing diffuse aura
    breakthrough: { 
      pattern: 'chaos', 
      wireframeOpacity: 0, 
      wobble: 0.8,
      surfaceSmoothing: 1.0,        // Completely smooth/organic
      outerParticleCount: 180,      // Many particles in chaotic cloud
      outerParticleOrganization: 0, // Fully chaotic
      knowledgeGlowIntensity: 0.7,  // Strong but diffuse
      knowledgeGlowSharpness: 0.1   // Very diffuse aura
    }
  };
  return map[knowledge || 'adaptive'] || map.adaptive;
}

// Cultural → Color count (now with multi-hue)
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

// Organizational → Base hue (more distinct colors)
function mapOrganizationalToHue(organizational?: string): number {
  const map: Record<string, number> = {
    red: 0,      // Pure red
    amber: 40,   // Orange-yellow
    orange: 25,  // Orange
    green: 140,  // Green
    teal: 185    // Cyan-teal
  };
  return map[organizational || 'orange'] || 25;
}

// Challenge → Noise intensity AND spike contribution
function mapChallengeToEffects(challenge?: string): { noise: number; spikeContribution: number } {
  const map: Record<string, { noise: number; spikeContribution: number }> = {
    technical: { noise: 0.2, spikeContribution: 0.1 },
    social: { noise: 0.4, spikeContribution: 0.3 },
    political: { noise: 0.6, spikeContribution: 0.5 },
    cognitive: { noise: 0.7, spikeContribution: 0.7 },
    adaptive: { noise: 0.9, spikeContribution: 1.0 }
  };
  return map[challenge || 'technical'] || { noise: 0.4, spikeContribution: 0.3 };
}

// Development → Core glow intensity AND core visibility
function mapDevelopmentToCore(development?: string): { 
  glow: number; 
  visibility: number; 
  transmission: number;
} {
  const map: Record<string, { glow: number; visibility: number; transmission: number }> = {
    being: { glow: 1.0, visibility: 1.0, transmission: 0.95 },      // Highly visible glowing core
    thinking: { glow: 0.8, visibility: 0.8, transmission: 0.85 },
    relating: { glow: 0.6, visibility: 0.6, transmission: 0.75 },
    collaborating: { glow: 0.5, visibility: 0.5, transmission: 0.7 },
    acting: { glow: 0.3, visibility: 0.2, transmission: 0.5 }       // Almost hidden core
  };
  return map[development || 'relating'] || { glow: 0.6, visibility: 0.6, transmission: 0.75 };
}

// Resources → Size, saturation, brightness, scale
function mapResources(resources?: string): { 
  size: number; 
  saturation: number; 
  brightness: number; 
  scale: number 
} {
  const map: Record<string, { size: number; saturation: number; brightness: number; scale: number }> = {
    rich: { size: 0.8, saturation: 95, brightness: 65, scale: 1.3 },
    balanced: { size: 0.6, saturation: 85, brightness: 55, scale: 1.0 },
    constrained: { size: 0.45, saturation: 70, brightness: 50, scale: 0.85 },
    scarce: { size: 0.3, saturation: 55, brightness: 45, scale: 0.7 }
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

// Information → Symmetry AND holes
function mapInformationToEffects(information?: string): { 
  symmetry: number; 
  holeCount: number;
  holeSize: number;
} {
  const map: Record<string, { symmetry: number; holeCount: number; holeSize: number }> = {
    centralized: { symmetry: 1.0, holeCount: 0, holeSize: 0 },        // No holes, perfect symmetry
    hierarchical: { symmetry: 0.8, holeCount: 2, holeSize: 0.12 },
    network: { symmetry: 0.6, holeCount: 4, holeSize: 0.18 },
    distributed: { symmetry: 0.3, holeCount: 8, holeSize: 0.25 }      // Many holes, asymmetric
  };
  return map[information || 'hierarchical'] || { symmetry: 0.7, holeCount: 2, holeSize: 0.12 };
}

// Risk → Glow color, intensity, background style, and aura
function mapRiskToEffects(risk?: string): { 
  color: string; 
  intensity: number;
  backgroundStyle: 'neutral' | 'warm' | 'danger' | 'critical';
  auraIntensity: number;
  auraColor: string;
} {
  const map: Record<string, { 
    color: string; 
    intensity: number; 
    backgroundStyle: 'neutral' | 'warm' | 'danger' | 'critical';
    auraIntensity: number;
    auraColor: string;
  }> = {
    low: { 
      color: '#10B981', 
      intensity: 0.3, 
      backgroundStyle: 'neutral',
      auraIntensity: 0.1,
      auraColor: '#10B981'
    },
    moderate: { 
      color: '#F59E0B', 
      intensity: 0.5, 
      backgroundStyle: 'warm',
      auraIntensity: 0.4,
      auraColor: '#F59E0B'
    },
    high: { 
      color: '#F97316', 
      intensity: 0.75, 
      backgroundStyle: 'danger',
      auraIntensity: 0.7,
      auraColor: '#EF4444'
    },
    extreme: { 
      color: '#EF4444', 
      intensity: 1.0, 
      backgroundStyle: 'critical',
      auraIntensity: 1.0,
      auraColor: '#DC2626'
    }
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
  
  // Get derived values
  const hue = mapOrganizationalToHue(organizational);
  const resourceData = mapResources(resources);
  const colorCount = mapCulturalToColorCount(cultural);
  const complexityEffects = mapComplexityToEffects(complexity);
  const challengeEffects = mapChallengeToEffects(challenge);
  const developmentCore = mapDevelopmentToCore(development);
  const knowledgeVisuals = mapKnowledgeToVisuals(knowledge);
  const informationEffects = mapInformationToEffects(information);
  const riskEffects = mapRiskToEffects(risk);
  
  // Generate colors
  const colors = generateColors(hue, colorCount, resourceData.saturation, resourceData.brightness);
  const multiHueColors = generateMultiHueColors(hue, colorCount, resourceData.saturation, resourceData.brightness);
  
  // Calculate spike count from complexity + challenge
  const totalSpikeIntensity = (complexityEffects.spikeContribution + challengeEffects.spikeContribution) / 2;
  const spikeCount = Math.round(totalSpikeIntensity * 20);
  const spikeLength = 0.1 + totalSpikeIntensity * 0.4;
  
  return {
    // Shape
    lobeCount: mapStakeholderToLobes(stakeholder),
    lobeSize: resourceData.size,
    lobeSpread: mapStakeholderToSpread(stakeholder),
    surfaceRoughness: complexityEffects.roughness,
    symmetry: informationEffects.symmetry,
    
    // Color - now with multi-hue
    primaryColor: hslToString(hue, resourceData.saturation, resourceData.brightness),
    secondaryColor: getSecondaryColor(hue, resourceData.saturation, resourceData.brightness),
    colorCount,
    colors: multiHueColors, // Use distinct multi-hue colors
    saturation: resourceData.saturation,
    brightness: resourceData.brightness,
    
    // Material
    transmission: developmentCore.transmission,
    roughness: 0.15,
    thickness: 2.5,
    ior: 1.5,
    
    // Animation
    pulseSpeed: mapTemporalToPulse(temporal),
    rotationSpeed: mapChangeToRotation(change),
    wobbleIntensity: knowledgeVisuals.wobble,
    
    // Effects
    glowColor: riskEffects.color,
    glowIntensity: riskEffects.intensity,
    noiseIntensity: challengeEffects.noise,
    coreGlow: developmentCore.glow,
    
    // Pattern
    innerPattern: knowledgeVisuals.pattern,
    
    // Scale
    resourceScale: resourceData.scale,
    
    // Emissive
    emissiveIntensity: 0.3,
    
    // NEW enhanced properties
    spikeCount,
    spikeLength,
    holeCount: informationEffects.holeCount,
    holeSize: informationEffects.holeSize,
    wireframeOpacity: knowledgeVisuals.wireframeOpacity,
    coreVisibility: developmentCore.visibility,
    backgroundStyle: riskEffects.backgroundStyle,
    outerAuraIntensity: riskEffects.auraIntensity,
    outerAuraColor: riskEffects.auraColor,
    multiHueColors,
    
    // NEW Knowledge-specific properties
    surfaceSmoothing: knowledgeVisuals.surfaceSmoothing,
    outerParticleCount: knowledgeVisuals.outerParticleCount,
    outerParticleOrganization: knowledgeVisuals.outerParticleOrganization,
    knowledgeGlowIntensity: knowledgeVisuals.knowledgeGlowIntensity,
    knowledgeGlowSharpness: knowledgeVisuals.knowledgeGlowSharpness,
    knowledgeGlowColor: hslToString(hue, resourceData.saturation, Math.min(85, resourceData.brightness + 20))
  };
}
