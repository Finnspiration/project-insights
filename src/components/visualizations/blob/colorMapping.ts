import { BlobVisualData } from './blobMapping';

export interface ZoneVisualStyle {
  gradient: string;
  icon: string;
  borderColor: string;
  accentColor: string;
}

export function getZoneStyles(zone: string, blobData: BlobVisualData): ZoneVisualStyle {
  const baseHue = blobData.baseHue;
  const glowColor = blobData.outerGlowColor;
  
  const zoneMap: Record<string, ZoneVisualStyle> = {
    outerGlow: {
      gradient: `linear-gradient(135deg, ${glowColor}15, ${glowColor}35)`,
      icon: '✨',
      borderColor: glowColor,
      accentColor: glowColor
    },
    mainShape: {
      gradient: `linear-gradient(135deg, hsl(${baseHue}, 50%, 97%), hsl(${baseHue}, 40%, 92%))`,
      icon: '🧬',
      borderColor: `hsl(${baseHue}, 60%, 55%)`,
      accentColor: `hsl(${baseHue}, 70%, 60%)`
    },
    culturalOverlay: {
      gradient: `linear-gradient(135deg, hsl(${baseHue + 30}, 35%, 95%), hsl(${baseHue + 30}, 30%, 90%))`,
      icon: '🎨',
      borderColor: `hsl(${baseHue + 30}, 50%, 60%)`,
      accentColor: `hsl(${baseHue + 30}, 60%, 65%)`
    },
    innerPattern: {
      gradient: `linear-gradient(135deg, hsl(${baseHue}, 30%, 96%), hsl(${baseHue}, 25%, 92%))`,
      icon: '🔷',
      borderColor: `hsl(${baseHue}, 45%, 65%)`,
      accentColor: `hsl(${baseHue}, 55%, 70%)`
    },
    coreGlow: {
      gradient: `radial-gradient(circle, hsl(${baseHue + 60}, 50%, 95%), hsl(${baseHue + 60}, 40%, 90%))`,
      icon: '💡',
      borderColor: `hsl(${baseHue + 60}, 60%, 60%)`,
      accentColor: `hsl(${baseHue + 60}, 70%, 65%)`
    }
  };
  
  return zoneMap[zone] || zoneMap.mainShape;
}

export interface DimensionVisuals {
  color: string;
  icon: string;
  pattern?: 'dots' | 'lines' | 'grid' | 'smooth' | 'chaos';
}

export function getDimensionVisuals(dimension: string, blobData: BlobVisualData): DimensionVisuals {
  const dimensionMap: Record<string, DimensionVisuals> = {
    complexity: { color: `hsl(0, 60%, 65%)`, icon: '🌀' },
    stakeholder: { color: `hsl(${blobData.baseHue}, 60%, 60%)`, icon: '👥' },
    knowledge: { color: `hsl(200, 60%, 60%)`, icon: '🧠', pattern: blobData.innerPattern as any },
    organizational: { color: `hsl(${blobData.baseHue}, 70%, 55%)`, icon: '🏢' },
    temporal: { color: `hsl(280, 60%, 65%)`, icon: '⏱️' },
    change: { color: `hsl(30, 70%, 60%)`, icon: '🔄' },
    risk: { color: blobData.outerGlowColor, icon: '✨' },
    cultural: { color: `hsl(${blobData.baseHue + 30}, 60%, 60%)`, icon: '🌍' },
    development: { color: `hsl(150, 60%, 55%)`, icon: '🌱' },
    // 4 previously missing dimensions
    challenge: { color: `hsl(340, 65%, 55%)`, icon: '⚡' },      // Challenge → noise particles
    resources: { color: `hsl(45, 70%, 55%)`, icon: '💎' },      // Resources → scale/size
    information: { color: `hsl(180, 60%, 50%)`, icon: '🔗' }    // Information → symmetry
  };
  
  return dimensionMap[dimension] || { color: 'hsl(0, 0%, 50%)', icon: '○' };
}

export function getPatternPreview(pattern: string): string {
  const patterns: Record<string, string> = {
    dots: '⚫⚪⚫⚪',
    lines: '━ ━ ━ ━',
    grid: '▦',
    smooth: '▬',
    chaos: '✦✧✦✧'
  };
  
  return patterns[pattern] || '○';
}
