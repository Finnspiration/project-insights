import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface CulturalTextureProps {
  culturalContext: string | { selectedValue: string } | undefined;
}

// Helper function to extract value from morphology data
function getMorphologyValue(value: string | { selectedValue: string } | undefined, defaultValue: string = 'mono'): string {
  if (!value) return defaultValue;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && 'selectedValue' in value) return value.selectedValue;
  return defaultValue;
}

export function CulturalTexture({ culturalContext }: CulturalTextureProps) {
  // Extract and normalize the actual string value
  let contextValue = getMorphologyValue(culturalContext, 'mono');
  
  // Normalize cross_functional to crossfunctional, cross_organizational to crossorg, etc.
  const normalizeValue = (val: string): string => {
    return val
      .toLowerCase()
      .replace(/_/g, '')
      .replace('organizational', 'org')
      .replace('cultural', 'cultural');
  };
  
  contextValue = normalizeValue(contextValue);
  
  // Generate unique ID for this render to force SVG update
  const [uniqueId] = useState(() => `cultural-${Date.now()}-${Math.random()}`);
  
  // Debug logging
  useEffect(() => {
    console.log('🎨 CulturalTexture render:', {
      contextValue,
      uniqueId,
      rawInput: culturalContext
    });
  }, [contextValue, uniqueId, culturalContext]);
  
  const getTexturePattern = () => {
    switch (contextValue) {
      case 'mono':
        console.log('🎨 CulturalTexture: Mono context - no texture rendered');
        return null;
      
      case 'crossfunctional':
        // Let mønster - spredte prikker (MORE VISIBLE)
        const cfId = `${uniqueId}-crossfunctional`;
        return (
          <pattern id={cfId} x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="4" fill="hsl(var(--primary))" opacity="0.25" />
            <circle cx="30" cy="25" r="4" fill="hsl(var(--primary))" opacity="0.25" />
            <circle cx="20" cy="35" r="4" fill="hsl(var(--primary))" opacity="0.25" />
            <circle cx="35" cy="10" r="3.5" fill="hsl(var(--primary))" opacity="0.25" />
            <circle cx="15" cy="25" r="3.5" fill="hsl(var(--primary))" opacity="0.25" />
            <circle cx="5" cy="35" r="3.5" fill="hsl(var(--primary))" opacity="0.25" />
          </pattern>
        );
      
      case 'crossorg':
        // Grid mønster (MORE VISIBLE)
        const coId = `${uniqueId}-crossorg`;
        return (
          <pattern id={coId} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 0 0 L 20 0 M 0 0 L 0 20" stroke="hsl(var(--primary))" strokeWidth="2" opacity="0.3" fill="none" />
          </pattern>
        );
      
      case 'crosscultural':
        // Kompleks tekstur - kombination af linjer og former (MORE VISIBLE)
        const ccId = `${uniqueId}-crosscultural`;
        return (
          <pattern id={ccId} x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
            {/* Diagonale linjer */}
            <path d="M 0 0 L 50 50 M 0 50 L 50 0" stroke="hsl(var(--primary))" strokeWidth="1.5" opacity="0.25" fill="none" />
            {/* Større cirkler */}
            <circle cx="15" cy="15" r="5" fill="hsl(var(--secondary))" opacity="0.3" />
            <circle cx="35" cy="35" r="5" fill="hsl(var(--accent))" opacity="0.3" />
            {/* Større firkanter */}
            <rect x="28" y="8" width="6" height="6" fill="hsl(var(--primary))" opacity="0.35" />
            <rect x="8" y="33" width="6" height="6" fill="hsl(var(--primary))" opacity="0.35" />
          </pattern>
        );
      
      default:
        return null;
    }
  };

  const pattern = getTexturePattern();
  
  if (!pattern) {
    console.log('🎨 CulturalTexture: No pattern generated (mono context)');
    return null;
  }

  // ✅ Add pattern validation
  if (!pattern.props || !pattern.props.id) {
    console.error('🎨 CulturalTexture: Invalid pattern structure', pattern);
    return null;
  }

  // Extract pattern ID from the pattern element
  const patternId = pattern.props.id;

  return (
    <motion.div
      key={`texture-${contextValue}-${uniqueId}`} // Force remount on change
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 5 }}
    >
      <svg className="w-full h-full">
        <defs>
          {pattern}
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill={`url(#${patternId})`}
        />
      </svg>
    </motion.div>
  );
}
