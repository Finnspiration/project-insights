import { motion } from "framer-motion";

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
  // Extract the actual string value
  const contextValue = getMorphologyValue(culturalContext, 'mono');
  
  const getTexturePattern = () => {
    switch (contextValue) {
      case 'mono':
        // Glat - ingen tekstur
        return null;
      
      case 'crossfunctional':
        // Let mønster - spredte prikker
        return (
          <pattern id="cultural-crossfunctional" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="1.5" fill="hsl(var(--primary))" opacity="0.08" />
            <circle cx="30" cy="25" r="1.5" fill="hsl(var(--primary))" opacity="0.08" />
            <circle cx="20" cy="35" r="1.5" fill="hsl(var(--primary))" opacity="0.08" />
          </pattern>
        );
      
      case 'crossorg':
        // Grid mønster
        return (
          <pattern id="cultural-crossorg" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 0 0 L 30 0 M 0 0 L 0 30" stroke="hsl(var(--primary))" strokeWidth="0.5" opacity="0.12" fill="none" />
          </pattern>
        );
      
      case 'crosscultural':
        // Kompleks tekstur - kombination af linjer og former
        return (
          <pattern id="cultural-crosscultural" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
            {/* Diagonale linjer */}
            <path d="M 0 0 L 50 50 M 0 50 L 50 0" stroke="hsl(var(--primary))" strokeWidth="0.5" opacity="0.1" fill="none" />
            {/* Små cirkler */}
            <circle cx="15" cy="15" r="2" fill="hsl(var(--secondary))" opacity="0.08" />
            <circle cx="35" cy="35" r="2" fill="hsl(var(--accent))" opacity="0.08" />
            {/* Små firkanter */}
            <rect x="30" y="10" width="3" height="3" fill="hsl(var(--primary))" opacity="0.08" />
            <rect x="10" y="35" width="3" height="3" fill="hsl(var(--primary))" opacity="0.08" />
          </pattern>
        );
      
      default:
        return null;
    }
  };

  const pattern = getTexturePattern();
  
  if (!pattern) {
    return null; // Mono har ingen tekstur
  }

  const patternId = `cultural-${contextValue}`;

  return (
    <motion.div
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
