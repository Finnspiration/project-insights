import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DIMENSION_ORDER, DIMENSION_ICONS } from './dimensionConfig';

interface ParameterBannerProps {
  morphology: Record<string, string>;
  activeDimension?: string | null;
  className?: string;
}

export function ParameterBanner({ morphology, activeDimension, className }: ParameterBannerProps) {
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

  // Get short translated value (first word or short form)
  const getShortValue = (key: string): string => {
    const value = getMorphologyValue(key);
    if (!value) return '—';
    
    const translated = t(`morphology.dimensions.${key}.options.${value}`);
    // Take first word or first 10 chars
    const firstPart = translated.split(' ')[0].split('-')[0];
    return firstPart.length > 10 ? firstPart.substring(0, 8) + '…' : firstPart;
  };

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
      <div className="flex items-center gap-1 p-2 overflow-x-auto">
        {/* Hide button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsVisible(false)}
          className="h-8 w-8 flex-shrink-0"
          title={language === 'da' ? 'Skjul parametre' : 'Hide parameters'}
        >
          <EyeOff className="h-4 w-4" />
        </Button>
        
        <div className="h-6 w-px bg-border/50 mx-1 flex-shrink-0" />
        
        {/* Parameter items */}
        <div className="flex items-center gap-1 flex-1 justify-center flex-wrap">
          {DIMENSION_ORDER.map((dim) => {
            const isActive = activeDimension === dim.key;
            const value = getShortValue(dim.key);
            
            return (
              <div
                key={dim.key}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-md transition-all duration-200",
                  "text-xs whitespace-nowrap",
                  isActive 
                    ? "bg-primary text-primary-foreground scale-105 shadow-md" 
                    : "bg-muted/50 hover:bg-muted",
                  isActive && "animate-pulse"
                )}
                title={t(`morphology.dimensions.${dim.key}.title`)}
              >
                <span className="text-sm">{DIMENSION_ICONS[dim.key]}</span>
                <span className={cn(
                  "font-medium",
                  isActive ? "text-primary-foreground" : "text-muted-foreground"
                )}>
                  {value}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
