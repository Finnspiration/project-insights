import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CulturalContextIndicatorProps {
  culturalContext: string | { selectedValue: string } | undefined;
}

// Helper function to extract value
function getMorphologyValue(value: string | { selectedValue: string } | undefined, defaultValue: string = 'mono'): string {
  if (!value) return defaultValue;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && 'selectedValue' in value) return value.selectedValue;
  return defaultValue;
}

const contextConfig = {
  mono: {
    emoji: '🏢',
    label: 'Mono',
    description: 'Single organizational culture - smooth, unified texture',
    descriptionDa: 'Enkelt organisationskultur - glat, ensartet tekstur'
  },
  crossfunctional: {
    emoji: '🔀',
    label: 'Cross-functional',
    description: 'Cross-functional teams - scattered dots show collaboration points',
    descriptionDa: 'Tværfaglige teams - spredte prikker viser samarbejdspunkter'
  },
  crossorg: {
    emoji: '🌐',
    label: 'Cross-org',
    description: 'Cross-organizational - grid pattern shows structural boundaries',
    descriptionDa: 'Tværorganisatorisk - gittermønster viser strukturelle grænser'
  },
  crosscultural: {
    emoji: '🌍',
    label: 'Cross-cultural',
    description: 'Cross-cultural - complex texture shows high cultural diversity',
    descriptionDa: 'Tværkulturel - kompleks tekstur viser høj kulturel diversitet'
  }
};

export function CulturalContextIndicator({ culturalContext }: CulturalContextIndicatorProps) {
  const contextValue = getMorphologyValue(culturalContext, 'mono');
  const config = contextConfig[contextValue as keyof typeof contextConfig] || contextConfig.mono;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            key={`indicator-${contextValue}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute top-4 right-4 z-20 bg-background/90 backdrop-blur-sm border border-border/50 rounded-lg px-3 py-2 shadow-lg cursor-help"
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              <span className="text-xl">{config.emoji}</span>
              <span className="text-foreground">{config.label}</span>
            </div>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <p className="text-sm">{config.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
