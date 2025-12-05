// Single source of truth for dimension configuration
// Used by BlobDemoMode, EnhancedBlob3DLegend, and ParameterBanner

export interface DimensionInfo {
  key: string;
  icon: string;
  effectKey: string;
  zone: string;
  lobeIndex: number;
}

// Authoritative dimension order - defines order for legend, demo, and banner
export const DIMENSION_ORDER: DimensionInfo[] = [
  { key: 'complexity', icon: '🌀', effectKey: 'spikesRoughness', zone: 'mainShape', lobeIndex: 0 },
  { key: 'stakeholder', icon: '👥', effectKey: 'lobesSpread', zone: 'mainShape', lobeIndex: 1 },
  { key: 'knowledge', icon: '🧠', effectKey: 'wireframePattern', zone: 'innerPattern', lobeIndex: 2 },
  { key: 'cultural', icon: '🌍', effectKey: 'multiHueColors', zone: 'culturalOverlay', lobeIndex: 3 },
  { key: 'organizational', icon: '🏢', effectKey: 'backgroundAtmosphere', zone: 'coreGlow', lobeIndex: 4 },
  { key: 'temporal', icon: '⏱️', effectKey: 'pulseSpeed', zone: 'outerGlow', lobeIndex: 5 },
  { key: 'development', icon: '🌱', effectKey: 'coreVisibility', zone: 'innerPattern', lobeIndex: 6 },
  { key: 'risk', icon: '🔥', effectKey: 'glowWarningAura', zone: 'outerGlow', lobeIndex: 7 },
  { key: 'challenge', icon: '⚡', effectKey: 'spikesParticles', zone: 'mainShape', lobeIndex: 8 },
  { key: 'resources', icon: '💎', effectKey: 'scaleSize', zone: 'mainShape', lobeIndex: 9 },
  { key: 'change', icon: '🔄', effectKey: 'rotationSpeed', zone: 'outerGlow', lobeIndex: 10 },
  { key: 'information', icon: '🕳️', effectKey: 'holesVoids', zone: 'mainShape', lobeIndex: 11 },
];

// Helper to get dimension keys in order
export const DIMENSION_KEYS = DIMENSION_ORDER.map(d => d.key);

// Helper to get icon by key
export const DIMENSION_ICONS: Record<string, string> = Object.fromEntries(
  DIMENSION_ORDER.map(d => [d.key, d.icon])
);

// Zone colors for consistent styling
export const ZONE_COLORS: Record<string, string> = {
  mainShape: 'hsl(220, 70%, 50%)',
  innerPattern: 'hsl(280, 65%, 60%)',
  outerGlow: 'hsl(30, 90%, 50%)',
  coreGlow: 'hsl(45, 80%, 55%)',
  culturalOverlay: 'hsl(340, 75%, 55%)',
};
