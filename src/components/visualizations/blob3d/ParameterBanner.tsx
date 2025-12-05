import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DIMENSION_ORDER, DIMENSION_ICONS } from './dimensionConfig';
import { MORPHOLOGY_DIMENSIONS } from '@/lib/morphologyConfig';

interface ParameterBannerProps {
  morphology: Record<string, string>;
  activeDimension?: string | null;
  onMorphologyChange?: (key: string, value: string) => void;
  className?: string;
}

export function ParameterBanner({ morphology, activeDimension, onMorphologyChange, className }: ParameterBannerProps) {
  const { t, i18n } = useTranslation('common');
  const language = i18n.language as 'en' | 'da';
  
  const [isVisible, setIsVisible] = useState(() => {
    const saved = localStorage.getItem('blob3d-banner-visible');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('blob3d-banner-visible', JSON.stringify(isVisible));
  }, [isVisible]);

  const getMorphologyValue = (key: string): string => {
    const value = morphology?.[key];
    if (typeof value === 'object' && value !== null) {
      return (value as any).selectedValue || '';
    }
    return value || '';
  };

  // Get options for a dimension
  const getDimensionOptions = (key: string) => {
    const dimension = MORPHOLOGY_DIMENSIONS.find(d => d.key === key);
    return dimension?.options || [];
  };

  // Get short translated value (first word or short form)
  const getShortValue = (key: string): string => {
    const value = getMorphologyValue(key);
    if (!value) return '—';
    
    const translated = t(`morphology.dimensions.${key}.options.${value}`);
    // Take first word or first 10 chars
    const firstPart = translated.split(' ')[0].split('-')[0];
    return firstPart.length > 12 ? firstPart.substring(0, 10) + '…' : firstPart;
  };

  // Cycle to next option when clicking
  const handleParameterClick = (key: string) => {
    if (!onMorphologyChange) return;
    
    const options = getDimensionOptions(key);
    if (options.length === 0) return;
    
    const currentValue = getMorphologyValue(key);
    const currentIndex = options.findIndex(o => o.value === currentValue);
    const nextIndex = (currentIndex + 1) % options.length;
    const nextValue = options[nextIndex].value;
    
    onMorphologyChange(key, nextValue);
  };

  // Split dimensions into two rows
  const firstRow = DIMENSION_ORDER.slice(0, 6);
  const secondRow = DIMENSION_ORDER.slice(6, 12);

  // Toggle button when banner is hidden
  if (!isVisible) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsVisible(true)}
        className={cn(
          "absolute bottom-4 left-1/2 -translate-x-1/2 z-10 gap-2",
          "bg-background/80 backdrop-blur-sm border-border/50",
          "hover:bg-primary/10 hover:border-primary/50",
          "transition-all duration-200",
          className
        )}
      >
        <Eye className="h-4 w-4" />
        <span className="text-xs">
          {language === 'da' ? 'Vis parametre' : 'Show parameters'}
        </span>
      </Button>
    );
  }

  const renderParameterItem = (dim: typeof DIMENSION_ORDER[0]) => {
    const isActive = activeDimension === dim.key;
    const value = getShortValue(dim.key);
    const options = getDimensionOptions(dim.key);
    const currentValue = getMorphologyValue(dim.key);
    const currentIndex = options.findIndex(o => o.value === currentValue);
    const isInteractive = !!onMorphologyChange;
    
    return (
      <button
        key={dim.key}
        onClick={() => handleParameterClick(dim.key)}
        disabled={!isInteractive}
        className={cn(
          "flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-all duration-200",
          "text-xs whitespace-nowrap min-w-[90px]",
          isInteractive && "cursor-pointer hover:scale-105 active:scale-95",
          !isInteractive && "cursor-default",
          isActive 
            ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/50" 
            : "bg-muted/60 hover:bg-muted border border-border/30",
          isActive && "animate-pulse"
        )}
        title={`${t(`morphology.dimensions.${dim.key}.title`)} - ${language === 'da' ? 'Klik for at skifte' : 'Click to change'}`}
      >
        <span className="text-base">{DIMENSION_ICONS[dim.key]}</span>
        <div className="flex flex-col items-start">
          <span className={cn(
            "font-semibold leading-tight",
            isActive ? "text-primary-foreground" : "text-foreground"
          )}>
            {value}
          </span>
          {/* Option indicator dots */}
          {options.length > 0 && (
            <div className="flex gap-0.5 mt-0.5">
              {options.map((_, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "w-1 h-1 rounded-full transition-colors",
                    idx === currentIndex
                      ? isActive ? "bg-primary-foreground" : "bg-primary"
                      : isActive ? "bg-primary-foreground/40" : "bg-muted-foreground/30"
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </button>
    );
  };

  return (
    <div
      className={cn(
        "absolute bottom-0 left-0 right-0 z-10",
        "bg-background/95 backdrop-blur-md",
        "border-t border-border/50",
        "animate-in slide-in-from-bottom-2 duration-300",
        className
      )}
    >
      <div className="flex items-start gap-2 p-2">
        {/* Hide button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsVisible(false)}
          className="h-8 w-8 flex-shrink-0 mt-2"
          title={language === 'da' ? 'Skjul parametre' : 'Hide parameters'}
        >
          <EyeOff className="h-4 w-4" />
        </Button>
        
        <div className="h-16 w-px bg-border/50 flex-shrink-0" />
        
        {/* Two rows of parameters */}
        <div className="flex-1 flex flex-col gap-1.5 py-0.5">
          {/* First row */}
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            {firstRow.map(renderParameterItem)}
          </div>
          
          {/* Second row */}
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            {secondRow.map(renderParameterItem)}
          </div>
        </div>
      </div>
    </div>
  );
}
