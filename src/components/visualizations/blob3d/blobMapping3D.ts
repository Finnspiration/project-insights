// 3D Blob mapping - converts morphology to 3D visual properties
// Maps ALL 12 PRISM morphology dimensions to visual blob properties

export interface Blob3DData {
  // Shape - from complexity & stakeholder
  lobeCount: number;           // 3-8 based on stakeholder
  lobeSize: number;            // 0.3-0.8 based on resources
  lobeSpread: number;          // How far lobes spread from center
  surfaceRoughness: number;    // 0.1-0.9 - surface deformation (complexity)
  symmetry: number;            // 0.3-1.0 (information flow)
  
  // NEW: Complexity-driven base shape
  baseShape: 'sphere' | 'regular_crystal' | 'irregular_crystal' | 'chaotic_blob';
  crystalFaces: number;        // Number of faces for crystal shapes (4-20)
  hasHolesInSurface: boolean;  // For chaotic: holes in the surface
  hasCraters: boolean;         // For chaotic: crater-like depressions
  hasSharpEdges: boolean;      // For chaotic: some sharp angular parts
  deformationIntensity: number; // 0-1 how much the shape is deformed
  
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
  
  // NEW: Cultural neon glow effect
  culturalGlowIntensity: number;  // 0-1 neon glow based on cultural diversity
  
  // NEW: Knowledge-specific visual properties
  surfaceSmoothing: number;        // 0 = faceted/crystalline, 1 = smooth/organic
  outerParticleCount: number;      // 50-250 orbiting particles
  outerParticleOrganization: number; // 1 = organized ring, 0 = chaotic cloud
  knowledgeGlowIntensity: number;  // Separate glow for knowledge
  knowledgeGlowSharpness: number;  // 1 = sharp edge, 0 = diffuse aura
  knowledgeGlowColor: string;      // Edge glow color
  
  // NEW: Knowledge shape visualization
  knowledgeShape: 'grid3d' | 'mesh_sphere' | 'crystal' | 'supernova';
  knowledgeShapeIntensity: number;   // 0-1 how prominent the shape is
  knowledgeShapeScale: number;       // Overall scale of knowledge shape
  knowledgeShapeColor: string;       // Color of knowledge shape
  supernovaRayCount: number;         // For supernova: number of rays
  supernovaExpansionRate: number;    // For supernova: how fast it expands
  
  // NEW: Organizational-based background
  backgroundColors: { top: string; bottom: string };
  organizationalAmbientColor: string;
  organizationalAmbientIntensity: number;
  
  // NEW: Stakeholder dynamics properties
  stakeholderMode: 'unified' | 'cooperative' | 'competitive' | 'adversarial';
  showConnections: boolean;           // Show tubes/strings between lobes
  connectionThickness: number;        // Tube thickness
  lobesTouching: boolean;             // Lobes should overlap/touch
  lobeMovementPattern: 'static' | 'gentle' | 'diverging' | 'chaotic';
  collisionIntensity: number;         // 0-1 how much lobes collide
  fragmentationChance: number;        // 0-1 chance of spawning fragments
}

// Convert HSL values to full HSL color string
function hslToString(hue: number, saturation: number, lightness: number): string {
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

// Generate multi-hue colors with DRAMATICALLY distinct colors for Cultural dimension
function generateMultiHueColors(baseHue: number, colorCount: number, saturation: number, lightness: number): string[] {
  // MONO: All colors exactly the same
  if (colorCount === 1) {
    return [hslToString(baseHue, saturation, lightness)];
  }
  
  // CROSS-FUNCTIONAL (2 colors): Complementary colors - opposite on color wheel
  if (colorCount === 2) {
    return [
      hslToString(baseHue, Math.min(100, saturation + 5), lightness),
      hslToString((baseHue + 180) % 360, Math.min(100, saturation + 5), lightness)
    ];
  }
  
  // CROSS-ORGANIZATIONAL (3 colors): Triadic - evenly spaced, with saturation variation
  if (colorCount === 3) {
    return [
      hslToString(baseHue, Math.min(100, saturation + 10), lightness),
      hslToString((baseHue + 120) % 360, Math.min(100, saturation + 15), lightness + 5),
      hslToString((baseHue + 240) % 360, Math.min(100, saturation + 10), lightness - 5)
    ];
  }
  
  // CROSS-CULTURAL (4 colors): NEON - maximum vibrancy with high saturation
  if (colorCount === 4) {
    const neonSat = Math.min(100, saturation + 25); // Boost saturation for neon effect
    const neonLight = Math.min(70, lightness + 10); // Brighter for neon
    return [
      hslToString(baseHue, neonSat, neonLight),                           // Neon base
      hslToString((baseHue + 85) % 360, 100, 60),                          // Neon warm (full saturation)
      hslToString((baseHue + 180) % 360, 100, 55),                         // Neon complement (full saturation)
      hslToString((baseHue + 270) % 360, 95, 65)                           // Neon cool
    ];
  }
  
  // Fallback
  return [hslToString(baseHue, saturation, lightness)];
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

// Complexity → Base shape + Surface roughness/deformation AND spikes
function mapComplexityToEffects(complexity?: string): { 
  roughness: number; 
  spikeContribution: number;
  baseShape: 'sphere' | 'regular_crystal' | 'irregular_crystal' | 'chaotic_blob';
  crystalFaces: number;
  hasHolesInSurface: boolean;
  hasCraters: boolean;
  hasSharpEdges: boolean;
  deformationIntensity: number;
} {
  const map: Record<string, { 
    roughness: number; 
    spikeContribution: number;
    baseShape: 'sphere' | 'regular_crystal' | 'irregular_crystal' | 'chaotic_blob';
    crystalFaces: number;
    hasHolesInSurface: boolean;
    hasCraters: boolean;
    hasSharpEdges: boolean;
    deformationIntensity: number;
  }> = {
    // Simple: Perfect smooth spheres
    simple: { 
      roughness: 0.05, 
      spikeContribution: 0,
      baseShape: 'sphere',
      crystalFaces: 64,
      hasHolesInSurface: false,
      hasCraters: false,
      hasSharpEdges: false,
      deformationIntensity: 0
    },
    // Complicated: Regular crystals (platonic solids - clean geometric)
    complicated: { 
      roughness: 0.2, 
      spikeContribution: 0.2,
      baseShape: 'regular_crystal',
      crystalFaces: 20, // Icosahedron
      hasHolesInSurface: false,
      hasCraters: false,
      hasSharpEdges: true,
      deformationIntensity: 0.1
    },
    // Complex: Irregular crystals (deformed, asymmetric)
    complex: { 
      roughness: 0.5, 
      spikeContribution: 0.5,
      baseShape: 'irregular_crystal',
      crystalFaces: 12, // Dodecahedron base, but deformed
      hasHolesInSurface: false,
      hasCraters: true,
      hasSharpEdges: true,
      deformationIntensity: 0.6
    },
    // Chaotic: Irregular soft blobs with holes, edges, craters
    chaotic: { 
      roughness: 0.9, 
      spikeContribution: 0.8,
      baseShape: 'chaotic_blob',
      crystalFaces: 8,
      hasHolesInSurface: true,
      hasCraters: true,
      hasSharpEdges: true,
      deformationIntensity: 1.0
    }
  };
  return map[complexity || 'simple'] || map.simple;
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
    unified: 0.3,      // Very close - touching
    cooperative: 0.6,  // Close but with visible connections
    competitive: 1.0,  // Spread apart, moving away
    adversarial: 1.4   // Far apart, colliding
  };
  return map[stakeholder || 'unified'] || 0.8;
}

// NEW: Stakeholder → Full dynamics configuration
function mapStakeholderToDynamics(stakeholder?: string): {
  mode: 'unified' | 'cooperative' | 'competitive' | 'adversarial';
  showConnections: boolean;
  connectionThickness: number;
  lobesTouching: boolean;
  lobeMovementPattern: 'static' | 'gentle' | 'diverging' | 'chaotic';
  collisionIntensity: number;
  fragmentationChance: number;
} {
  const map: Record<string, {
    mode: 'unified' | 'cooperative' | 'competitive' | 'adversarial';
    showConnections: boolean;
    connectionThickness: number;
    lobesTouching: boolean;
    lobeMovementPattern: 'static' | 'gentle' | 'diverging' | 'chaotic';
    collisionIntensity: number;
    fragmentationChance: number;
  }> = {
    // Unified: All blobs touch each other, gentle breathing motion
    unified: {
      mode: 'unified',
      showConnections: false,
      connectionThickness: 0,
      lobesTouching: true,
      lobeMovementPattern: 'static',
      collisionIntensity: 0,
      fragmentationChance: 0
    },
    // Cooperative: Connected with tubes/strings, gentle synchronized movement
    cooperative: {
      mode: 'cooperative',
      showConnections: true,
      connectionThickness: 0.04,
      lobesTouching: false,
      lobeMovementPattern: 'gentle',
      collisionIntensity: 0,
      fragmentationChance: 0
    },
    // Competitive: Moving in different directions, no connections
    competitive: {
      mode: 'competitive',
      showConnections: false,
      connectionThickness: 0,
      lobesTouching: false,
      lobeMovementPattern: 'diverging',
      collisionIntensity: 0.3,
      fragmentationChance: 0
    },
    // Adversarial: Colliding, breaking apart, spawning fragments
    adversarial: {
      mode: 'adversarial',
      showConnections: false,
      connectionThickness: 0,
      lobesTouching: false,
      lobeMovementPattern: 'chaotic',
      collisionIntensity: 0.8,
      fragmentationChance: 0.5
    }
  };
  return map[stakeholder || 'unified'] || map.unified;
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
  // NEW: Distinct knowledge shape
  knowledgeShape: 'grid3d' | 'mesh_sphere' | 'crystal' | 'supernova';
  knowledgeShapeIntensity: number;
  knowledgeShapeScale: number;
  supernovaRayCount: number;
  supernovaExpansionRate: number;
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
    knowledgeShape: 'grid3d' | 'mesh_sphere' | 'crystal' | 'supernova';
    knowledgeShapeIntensity: number;
    knowledgeShapeScale: number;
    supernovaRayCount: number;
    supernovaExpansionRate: number;
  }> = {
    // Routine: 3D Grid structure - predictability
    routine: { 
      pattern: 'grid', 
      wireframeOpacity: 0.6, 
      wobble: 0.1,
      surfaceSmoothing: 0,
      outerParticleCount: 120,
      outerParticleOrganization: 1.0,
      knowledgeGlowIntensity: 0.9,
      knowledgeGlowSharpness: 1.0,
      knowledgeShape: 'grid3d',
      knowledgeShapeIntensity: 1.0,
      knowledgeShapeScale: 1.2,
      supernovaRayCount: 0,
      supernovaExpansionRate: 0
    },
    // Adaptive: Mesh sphere - flexible structure
    adaptive: { 
      pattern: 'waves', 
      wireframeOpacity: 0.3, 
      wobble: 0.3,
      surfaceSmoothing: 0.35,
      outerParticleCount: 90,
      outerParticleOrganization: 0.7,
      knowledgeGlowIntensity: 0.6,
      knowledgeGlowSharpness: 0.7,
      knowledgeShape: 'mesh_sphere',
      knowledgeShapeIntensity: 0.9,
      knowledgeShapeScale: 1.0,
      supernovaRayCount: 0,
      supernovaExpansionRate: 0
    },
    // Innovative: Multi-faceted crystal - creative structures
    innovative: { 
      pattern: 'particles', 
      wireframeOpacity: 0.1, 
      wobble: 0.5,
      surfaceSmoothing: 0.75,
      outerParticleCount: 70,
      outerParticleOrganization: 0.3,
      knowledgeGlowIntensity: 0.4,
      knowledgeGlowSharpness: 0.4,
      knowledgeShape: 'crystal',
      knowledgeShapeIntensity: 0.85,
      knowledgeShapeScale: 1.1,
      supernovaRayCount: 0,
      supernovaExpansionRate: 0
    },
    // Breakthrough: Supernova - breaking all boundaries
    breakthrough: { 
      pattern: 'chaos', 
      wireframeOpacity: 0, 
      wobble: 0.8,
      surfaceSmoothing: 1.0,
      outerParticleCount: 180,
      outerParticleOrganization: 0,
      knowledgeGlowIntensity: 0.7,
      knowledgeGlowSharpness: 0.1,
      knowledgeShape: 'supernova',
      knowledgeShapeIntensity: 1.0,
      knowledgeShapeScale: 1.5,
      supernovaRayCount: 24,
      supernovaExpansionRate: 0.8
    }
  };
  return map[knowledge || 'adaptive'] || map.adaptive;
}

// Cultural → Color count AND glow intensity
function mapCulturalToEffects(cultural?: string): { colorCount: number; glowIntensity: number } {
  const map: Record<string, { colorCount: number; glowIntensity: number }> = {
    mono: { colorCount: 1, glowIntensity: 0 },
    crossfunctional: { colorCount: 2, glowIntensity: 0.2 },
    crossorg: { colorCount: 3, glowIntensity: 0.5 },
    crosscultural: { colorCount: 4, glowIntensity: 1.0 }  // Full neon glow
  };
  return map[cultural || 'mono'] || map.mono;
}

// Temporal → Pulse speed - DRAMATICALLY different speeds
function mapTemporalToPulse(temporal?: string): number {
  const map: Record<string, number> = {
    sprint: 8.0,          // Very fast, frantic pulsing
    project: 3.0,         // Moderate speed
    program: 1.0,         // Slow, deliberate
    transformation: 0.25  // Very slow, almost meditative
  };
  return map[temporal || 'project'] || 3.0;
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

// NEW: Organizational → Background colors and ambient light (Laloux colors)
function mapOrganizationalToBackground(organizational?: string): {
  topColor: string;
  bottomColor: string;
  ambientColor: string;
  ambientIntensity: number;
} {
  const map: Record<string, {
    topColor: string;
    bottomColor: string;
    ambientColor: string;
    ambientIntensity: number;
  }> = {
    red: {
      topColor: '#2d1a1a',     // Dark maroon
      bottomColor: '#1a1010',  // Deep red-black
      ambientColor: '#ff4444', // Red ambient
      ambientIntensity: 0.35
    },
    amber: {
      topColor: '#2d2816',     // Warm amber
      bottomColor: '#1a1810',  // Golden brown
      ambientColor: '#ffaa44', // Amber ambient
      ambientIntensity: 0.45
    },
    orange: {
      topColor: '#2d2018',     // Orange-brown
      bottomColor: '#1a1412',  // Warm orange
      ambientColor: '#ff8844', // Orange ambient
      ambientIntensity: 0.40
    },
    green: {
      topColor: '#1a2d1a',     // Forest green
      bottomColor: '#101a10',  // Deep green
      ambientColor: '#44ff88', // Green ambient
      ambientIntensity: 0.50
    },
    teal: {
      topColor: '#1a2a2d',     // Cyan-teal
      bottomColor: '#101820',  // Deep teal
      ambientColor: '#44ddff', // Teal ambient
      ambientIntensity: 0.55
    }
  };
  return map[organizational || 'orange'] || map.orange;
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

// Risk → Glow color, intensity, background style, and aura - ENHANCED visibility
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
      color: '#22C55E',  // Brighter green
      intensity: 0.35, 
      backgroundStyle: 'neutral',
      auraIntensity: 0.25,  // Increased from 0.1
      auraColor: '#22C55E'
    },
    moderate: { 
      color: '#FBBF24',  // Brighter amber
      intensity: 0.6,    // Increased 
      backgroundStyle: 'warm',
      auraIntensity: 0.55,  // Increased from 0.4
      auraColor: '#F59E0B'
    },
    high: { 
      color: '#F97316',  // Orange
      intensity: 0.85,   // Increased
      backgroundStyle: 'danger',
      auraIntensity: 0.8,   // Increased from 0.7
      auraColor: '#EF4444'
    },
    extreme: { 
      color: '#EF4444',  // Red
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
  const culturalEffects = mapCulturalToEffects(cultural);
  const colorCount = culturalEffects.colorCount;
  const complexityEffects = mapComplexityToEffects(complexity);
  const challengeEffects = mapChallengeToEffects(challenge);
  const developmentCore = mapDevelopmentToCore(development);
  const knowledgeVisuals = mapKnowledgeToVisuals(knowledge);
  const informationEffects = mapInformationToEffects(information);
  const riskEffects = mapRiskToEffects(risk);
  const backgroundEffects = mapOrganizationalToBackground(organizational);
  const stakeholderDynamics = mapStakeholderToDynamics(stakeholder);
  
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
    
    // NEW: Complexity-driven base shape
    baseShape: complexityEffects.baseShape,
    crystalFaces: complexityEffects.crystalFaces,
    hasHolesInSurface: complexityEffects.hasHolesInSurface,
    hasCraters: complexityEffects.hasCraters,
    hasSharpEdges: complexityEffects.hasSharpEdges,
    deformationIntensity: complexityEffects.deformationIntensity,
    
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
    culturalGlowIntensity: culturalEffects.glowIntensity,
    
    // NEW Knowledge-specific properties
    surfaceSmoothing: knowledgeVisuals.surfaceSmoothing,
    outerParticleCount: knowledgeVisuals.outerParticleCount,
    outerParticleOrganization: knowledgeVisuals.outerParticleOrganization,
    knowledgeGlowIntensity: knowledgeVisuals.knowledgeGlowIntensity,
    knowledgeGlowSharpness: knowledgeVisuals.knowledgeGlowSharpness,
    knowledgeGlowColor: hslToString(hue, resourceData.saturation, Math.min(85, resourceData.brightness + 20)),
    
    // NEW Knowledge shape visualization
    knowledgeShape: knowledgeVisuals.knowledgeShape,
    knowledgeShapeIntensity: knowledgeVisuals.knowledgeShapeIntensity,
    knowledgeShapeScale: knowledgeVisuals.knowledgeShapeScale,
    knowledgeShapeColor: hslToString(hue, Math.min(100, resourceData.saturation + 10), 70),
    supernovaRayCount: knowledgeVisuals.supernovaRayCount,
    supernovaExpansionRate: knowledgeVisuals.supernovaExpansionRate,
    
    // NEW Organizational-based background
    backgroundColors: {
      top: backgroundEffects.topColor,
      bottom: backgroundEffects.bottomColor
    },
    organizationalAmbientColor: backgroundEffects.ambientColor,
    organizationalAmbientIntensity: backgroundEffects.ambientIntensity,
    
    // NEW Stakeholder dynamics
    stakeholderMode: stakeholderDynamics.mode,
    showConnections: stakeholderDynamics.showConnections,
    connectionThickness: stakeholderDynamics.connectionThickness,
    lobesTouching: stakeholderDynamics.lobesTouching,
    lobeMovementPattern: stakeholderDynamics.lobeMovementPattern,
    collisionIntensity: stakeholderDynamics.collisionIntensity,
    fragmentationChance: stakeholderDynamics.fragmentationChance
  };
}
