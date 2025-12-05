import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Info, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface DimensionInfo {
  key: string;
  icon: string;
  effect: string;
  effectKey: string;
  zone: string;
}

const DIMENSION_MAP: DimensionInfo[] = [
  { key: 'complexity', icon: '🌀', effect: 'Surface roughness/deformation', effectKey: 'surfaceRoughness', zone: 'mainShape' },
  { key: 'stakeholder', icon: '👥', effect: 'Number of lobes and spread', effectKey: 'lobesSpread', zone: 'mainShape' },
  { key: 'knowledge', icon: '🧠', effect: 'Inner pattern and wobble', effectKey: 'innerPatternWobble', zone: 'innerPattern' },
  { key: 'cultural', icon: '🌍', effect: 'Color count and variety', effectKey: 'colorVariety', zone: 'culturalOverlay' },
  { key: 'organizational', icon: '🏢', effect: 'Primary color hue', effectKey: 'primaryHue', zone: 'coreGlow' },
  { key: 'temporal', icon: '⏱️', effect: 'Pulse/breathing speed', effectKey: 'pulseSpeed', zone: 'outerGlow' },
  { key: 'development', icon: '🌱', effect: 'Core glow and transmission', effectKey: 'coreGlowTransmission', zone: 'innerPattern' },
  { key: 'risk', icon: '✨', effect: 'Outer glow color and intensity', effectKey: 'outerGlow', zone: 'outerGlow' },
  { key: 'challenge', icon: '⚡', effect: 'Noise particle intensity', effectKey: 'noiseParticles', zone: 'mainShape' },
  { key: 'resources', icon: '💎', effect: 'Overall scale and size', effectKey: 'scaleSize', zone: 'mainShape' },
  { key: 'change', icon: '🔄', effect: 'Rotation speed', effectKey: 'rotationSpeed', zone: 'outerGlow' },
  { key: 'information', icon: '🔗', effect: 'Shape symmetry', effectKey: 'symmetry', zone: 'mainShape' },
];

const ZONE_COLORS: Record<string, string> = {
  mainShape: 'hsl(220, 70%, 50%)',
  innerPattern: 'hsl(280, 65%, 60%)',
  outerGlow: 'hsl(30, 90%, 50%)',
  coreGlow: 'hsl(45, 80%, 55%)',
  culturalOverlay: 'hsl(340, 75%, 55%)',
};

interface Blob3DLegendProps {
  morphology: Record<string, string>;
  className?: string;
}

export function Blob3DLegend({ morphology, className }: Blob3DLegendProps) {
  const { t, i18n } = useTranslation('common');
  const language = i18n.language as 'en' | 'da';
  
  // Load preference from localStorage
  const [isOpen, setIsOpen] = useState(() => {
    const saved = localStorage.getItem('blob3d-legend-open');
    return saved ? JSON.parse(saved) : false;
  });
  
  const [isExpanded, setIsExpanded] = useState(true);

  // Save preference to localStorage
  useEffect(() => {
    localStorage.setItem('blob3d-legend-open', JSON.stringify(isOpen));
  }, [isOpen]);

  // Keyboard shortcut (L to toggle)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'l' || e.key === 'L') {
        // Don't trigger if user is typing in an input
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
          return;
        }
        setIsOpen(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getMorphologyValue = (key: string): string => {
    const value = morphology?.[key];
    if (typeof value === 'object' && value !== null) {
      return (value as any).selectedValue || '';
    }
    return value || '';
  };

  const getEffectTranslation = (effectKey: string): string => {
    const effects: Record<string, { en: string; da: string }> = {
      surfaceRoughness: { en: 'Surface roughness', da: 'Overflade-ruhed' },
      lobesSpread: { en: 'Lobes & spread', da: 'Arme & spredning' },
      innerPatternWobble: { en: 'Inner pattern', da: 'Indre mønster' },
      colorVariety: { en: 'Color variety', da: 'Farvevariation' },
      primaryHue: { en: 'Primary hue', da: 'Primær farvetone' },
      pulseSpeed: { en: 'Pulse speed', da: 'Pulshastighed' },
      coreGlowTransmission: { en: 'Core glow', da: 'Kerneglød' },
      outerGlow: { en: 'Outer glow', da: 'Ydre glød' },
      noiseParticles: { en: 'Noise particles', da: 'Støjpartikler' },
      scaleSize: { en: 'Scale & size', da: 'Skala & størrelse' },
      rotationSpeed: { en: 'Rotation speed', da: 'Rotationshastighed' },
      symmetry: { en: 'Shape symmetry', da: 'Formsymmetri' },
    };
    
    return effects[effectKey]?.[language] || effectKey;
  };

  if (!isOpen) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        className={cn(
          "absolute top-2 right-2 z-10 h-8 w-8 rounded-full",
          "bg-background/80 backdrop-blur-sm border border-border/50",
          "hover:bg-background/90 hover:border-border",
          "transition-all duration-200",
          className
        )}
        title={language === 'da' ? 'Vis parameter guide (L)' : 'Show parameter guide (L)'}
      >
        <Info className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div
      className={cn(
        "absolute top-2 right-2 z-10 w-72",
        "bg-background/85 backdrop-blur-md",
        "border border-border/50 rounded-xl shadow-xl",
        "animate-in fade-in-0 slide-in-from-right-2 duration-300",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border/30">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">
            {language === 'da' ? 'Parameter Guide' : 'Parameter Guide'}
          </span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            12
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 w-6"
          >
            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
      
      {/* Content */}
      {isExpanded && (
        <ScrollArea className="max-h-[400px]">
          <div className="p-2 space-y-1">
            {DIMENSION_MAP.map((dim) => {
              const value = getMorphologyValue(dim.key);
              const translatedName = t(`morphology.dimensions.${dim.key}.title`);
              const translatedValue = value 
                ? t(`morphology.dimensions.${dim.key}.options.${value}`)
                : (language === 'da' ? 'Ikke sat' : 'Not set');
              const zoneColor = ZONE_COLORS[dim.zone];
              
              return (
                <div
                  key={dim.key}
                  className={cn(
                    "flex items-start gap-2 p-2 rounded-lg",
                    "hover:bg-muted/50 transition-colors cursor-default",
                    "group"
                  )}
                >
                  {/* Icon with zone color indicator */}
                  <div className="relative flex-shrink-0">
                    <span className="text-lg">{dim.icon}</span>
                    <div 
                      className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-background"
                      style={{ backgroundColor: zoneColor }}
                      title={dim.zone}
                    />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-medium truncate">
                        {translatedName}
                      </span>
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate">
                      {translatedValue.split(' - ')[0]}
                    </div>
                    <div 
                      className="text-[9px] mt-0.5 opacity-60 group-hover:opacity-100 transition-opacity"
                      style={{ color: zoneColor }}
                    >
                      → {getEffectTranslation(dim.effectKey)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}
      
      {/* Footer hint */}
      <div className="px-3 py-1.5 border-t border-border/30 bg-muted/30">
        <p className="text-[9px] text-muted-foreground text-center">
          {language === 'da' ? 'Tryk L for at toggle' : 'Press L to toggle'}
        </p>
      </div>
    </div>
  );
}