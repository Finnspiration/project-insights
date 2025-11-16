import { useTranslation } from 'react-i18next';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DimensionConfig } from '@/lib/morphologyConfig';
import { Info } from 'lucide-react';

interface MiniSliderProps {
  dimension: DimensionConfig;
  currentIndex: number;
  onChange: (index: number) => void;
}

export function MiniSlider({ dimension, currentIndex, onChange }: MiniSliderProps) {
  const { t } = useTranslation('common');
  
  const currentOption = dimension.options[currentIndex];

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs font-medium text-foreground truncate">
            {t(dimension.translationKey)}
          </span>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3 w-3 text-muted-foreground flex-shrink-0 cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <p className="text-xs">{t(dimension.translationKey)}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
          {t(currentOption?.translationKey || '')}
        </span>
      </div>
      
      <Slider
        value={[currentIndex]}
        onValueChange={([value]) => onChange(value)}
        min={0}
        max={dimension.options.length - 1}
        step={1}
        className="w-full"
      />
    </div>
  );
}
