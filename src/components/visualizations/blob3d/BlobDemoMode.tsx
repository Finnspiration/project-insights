import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Play, Pause, Square, SkipForward, RotateCcw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { MORPHOLOGY_DIMENSIONS, DimensionConfig } from '@/lib/morphologyConfig';

interface BlobDemoModeProps {
  baseMorphology: Record<string, string>;
  onDemoMorphologyChange: (morphology: Record<string, string>) => void;
  onDemoStateChange: (isActive: boolean, currentDimension: string | null) => void;
  className?: string;
}

// Dimension icons for display
const DIMENSION_ICONS: Record<string, string> = {
  complexity: '🌀',
  stakeholder: '👥',
  knowledge: '🧠',
  cultural: '🌍',
  organizational: '🏢',
  temporal: '⏱️',
  development: '🌱',
  risk: '🔥',
  challenge: '⚡',
  resources: '💎',
  change: '🔄',
  information: '🕳️',
};

// Order dimensions for best visual demonstration flow
const DEMO_DIMENSION_ORDER = [
  'risk',        // Start with dramatic background changes
  'complexity',  // Spikes
  'challenge',   // More spikes + particles
  'information', // Holes
  'knowledge',   // Orbit + glow + surface
  'stakeholder', // Lobe count
  'cultural',    // Multi-colors
  'organizational', // Base hue
  'development', // Core visibility
  'resources',   // Scale/size
  'temporal',    // Pulse speed
  'change',      // Rotation speed
];

export function BlobDemoMode({
  baseMorphology,
  onDemoMorphologyChange,
  onDemoStateChange,
  className
}: BlobDemoModeProps) {
  const { t, i18n } = useTranslation('common');
  const language = i18n.language as 'en' | 'da';
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentDimensionIndex, setCurrentDimensionIndex] = useState(0);
  const [currentOptionIndex, setCurrentOptionIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const CYCLE_INTERVAL = 1500; // ms between option changes
  
  // Get current dimension config
  const currentDimensionKey = DEMO_DIMENSION_ORDER[currentDimensionIndex];
  const currentDimension = MORPHOLOGY_DIMENSIONS.find(d => d.key === currentDimensionKey);
  const currentOptions = currentDimension?.options || [];
  const currentOption = currentOptions[currentOptionIndex];
  
  // Calculate overall progress
  const totalSteps = DEMO_DIMENSION_ORDER.reduce((sum, key) => {
    const dim = MORPHOLOGY_DIMENSIONS.find(d => d.key === key);
    return sum + (dim?.options.length || 0);
  }, 0);
  
  const completedSteps = DEMO_DIMENSION_ORDER.slice(0, currentDimensionIndex).reduce((sum, key) => {
    const dim = MORPHOLOGY_DIMENSIONS.find(d => d.key === key);
    return sum + (dim?.options.length || 0);
  }, 0) + currentOptionIndex;
  
  const overallProgress = (completedSteps / totalSteps) * 100;
  
  // Generate demo morphology with current override
  const generateDemoMorphology = useCallback(() => {
    if (!currentDimension || !currentOption) return baseMorphology;
    
    return {
      ...baseMorphology,
      [currentDimensionKey]: currentOption.value
    };
  }, [baseMorphology, currentDimensionKey, currentDimension, currentOption]);
  
  // Advance to next option/dimension
  const advance = useCallback(() => {
    if (!currentDimension) return;
    
    if (currentOptionIndex < currentOptions.length - 1) {
      // Next option in same dimension
      setCurrentOptionIndex(prev => prev + 1);
    } else if (currentDimensionIndex < DEMO_DIMENSION_ORDER.length - 1) {
      // Next dimension
      setCurrentDimensionIndex(prev => prev + 1);
      setCurrentOptionIndex(0);
    } else {
      // Loop back to start
      setCurrentDimensionIndex(0);
      setCurrentOptionIndex(0);
    }
  }, [currentDimension, currentOptionIndex, currentOptions.length, currentDimensionIndex]);
  
  // Skip to next dimension
  const skipDimension = useCallback(() => {
    if (currentDimensionIndex < DEMO_DIMENSION_ORDER.length - 1) {
      setCurrentDimensionIndex(prev => prev + 1);
      setCurrentOptionIndex(0);
    } else {
      setCurrentDimensionIndex(0);
      setCurrentOptionIndex(0);
    }
  }, [currentDimensionIndex]);
  
  // Reset to start
  const reset = useCallback(() => {
    setCurrentDimensionIndex(0);
    setCurrentOptionIndex(0);
    setIsPlaying(false);
    onDemoMorphologyChange(baseMorphology);
    onDemoStateChange(false, null);
  }, [baseMorphology, onDemoMorphologyChange, onDemoStateChange]);
  
  // Toggle play/pause
  const togglePlay = useCallback(() => {
    setIsPlaying(prev => !prev);
    if (!isPlaying) {
      setIsExpanded(true);
    }
  }, [isPlaying]);
  
  // Effect: Update morphology when option changes
  useEffect(() => {
    if (isPlaying || isExpanded) {
      const demoMorphology = generateDemoMorphology();
      onDemoMorphologyChange(demoMorphology);
      onDemoStateChange(true, currentDimensionKey);
    }
  }, [isPlaying, isExpanded, currentDimensionIndex, currentOptionIndex, generateDemoMorphology, onDemoMorphologyChange, onDemoStateChange, currentDimensionKey]);
  
  // Effect: Auto-advance when playing
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(advance, CYCLE_INTERVAL);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, advance]);
  
  // Effect: Reset demo state when collapsed
  useEffect(() => {
    if (!isExpanded && !isPlaying) {
      onDemoMorphologyChange(baseMorphology);
      onDemoStateChange(false, null);
    }
  }, [isExpanded, isPlaying, baseMorphology, onDemoMorphologyChange, onDemoStateChange]);
  
  // Collapsed state - just show demo button
  if (!isExpanded) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsExpanded(true)}
        className={cn(
          "absolute top-4 left-4 z-10 gap-2",
          "bg-background/80 backdrop-blur-sm border-border/50",
          "hover:bg-primary/10 hover:border-primary/50",
          "transition-all duration-200",
          className
        )}
      >
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-xs font-medium">
          {language === 'da' ? 'Demo' : 'Demo'}
        </span>
      </Button>
    );
  }
  
  return (
    <div
      className={cn(
        "absolute top-4 left-4 z-10",
        "bg-background/95 backdrop-blur-md",
        "border border-border/50 rounded-xl shadow-2xl",
        "animate-in fade-in-0 slide-in-from-left-2 duration-300",
        "w-72",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border/30">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">
            {language === 'da' ? 'Demo Mode' : 'Demo Mode'}
          </span>
          {isPlaying && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 animate-pulse">
              {language === 'da' ? 'Afspiller' : 'Playing'}
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setIsExpanded(false);
            setIsPlaying(false);
          }}
          className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
        >
          <Square className="h-3 w-3" />
        </Button>
      </div>
      
      {/* Current Dimension Display */}
      <div className="p-3 space-y-3">
        {/* Current dimension indicator */}
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{DIMENSION_ICONS[currentDimensionKey]}</span>
            <div>
              <p className="text-xs text-muted-foreground">
                {language === 'da' ? 'Viser' : 'Showing'}
              </p>
              <p className="text-sm font-semibold text-primary">
                {t(`morphology.dimensions.${currentDimensionKey}.title`)}
              </p>
            </div>
          </div>
          
          {/* Current value */}
          {currentOption && (
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-medium">
                {t(currentOption.translationKey)}
              </span>
            </div>
          )}
          
          {/* Option progress */}
          <div className="flex gap-1 mt-2">
            {currentOptions.map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  idx <= currentOptionIndex ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>
        </div>
        
        {/* Overall progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>{language === 'da' ? 'Samlet fremdrift' : 'Overall progress'}</span>
            <span>{currentDimensionIndex + 1} / {DEMO_DIMENSION_ORDER.length}</span>
          </div>
          <Progress value={overallProgress} className="h-1" />
        </div>
        
        {/* Dimension queue preview */}
        <div className="flex flex-wrap gap-1">
          {DEMO_DIMENSION_ORDER.map((key, idx) => (
            <div
              key={key}
              className={cn(
                "w-6 h-6 rounded flex items-center justify-center text-xs transition-all",
                idx === currentDimensionIndex 
                  ? "bg-primary text-primary-foreground scale-110" 
                  : idx < currentDimensionIndex 
                    ? "bg-muted text-muted-foreground opacity-50"
                    : "bg-muted/50 text-muted-foreground"
              )}
              title={t(`morphology.dimensions.${key}.title`)}
            >
              {DIMENSION_ICONS[key]}
            </div>
          ))}
        </div>
        
        {/* Controls */}
        <div className="flex items-center gap-2 pt-2 border-t border-border/30">
          <Button
            variant={isPlaying ? "secondary" : "default"}
            size="sm"
            onClick={togglePlay}
            className="flex-1 gap-1"
          >
            {isPlaying ? (
              <>
                <Pause className="h-3 w-3" />
                <span className="text-xs">{language === 'da' ? 'Pause' : 'Pause'}</span>
              </>
            ) : (
              <>
                <Play className="h-3 w-3" />
                <span className="text-xs">{language === 'da' ? 'Afspil' : 'Play'}</span>
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={skipDimension}
            className="h-8 w-8"
            title={language === 'da' ? 'Næste dimension' : 'Next dimension'}
          >
            <SkipForward className="h-3 w-3" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={reset}
            className="h-8 w-8"
            title={language === 'da' ? 'Nulstil' : 'Reset'}
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        </div>
      </div>
      
      {/* Footer hint */}
      <div className="px-3 py-2 border-t border-border/30 bg-muted/30">
        <p className="text-[10px] text-muted-foreground text-center">
          {language === 'da' 
            ? 'Se hvordan hver parameter påvirker blob\'en' 
            : 'See how each parameter affects the blob'}
        </p>
      </div>
    </div>
  );
}