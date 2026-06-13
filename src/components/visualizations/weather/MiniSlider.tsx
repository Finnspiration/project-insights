import { useTranslation } from 'react-i18next';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DimensionConfig, DimensionKey } from '@/lib/morphologyConfig';
import { Info } from 'lucide-react';

interface MiniSliderProps {
  dimension: DimensionConfig;
  currentIndex: number;
  onChange: (index: number) => void;
}

// Dimensions that have an "affects the weather" explanation in the tooltip.
// The descriptions and element labels live in the locale files under
// visualizations.miniSlider.impact.<dimensionKey>.
const IMPACT_DIMENSIONS: DimensionKey[] = [
  'complexity', 'organizational', 'cultural', 'information', 'temporal', 'risk',
  'stakeholder', 'knowledge', 'challenge', 'change', 'resources', 'development',
];

export function MiniSlider({ dimension, currentIndex, onChange }: MiniSliderProps) {
  const { t } = useTranslation('common');
  
  const currentOption = dimension.options[currentIndex];

  return (
    <div className="space-y-1.5 @container">
      <div className="flex items-start justify-between gap-2 min-h-[20px]">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span className="text-xs font-medium text-foreground truncate">
            {t(dimension.translationKey)}
          </span>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3 w-3 text-muted-foreground flex-shrink-0 cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <div className="space-y-2">
                  <p className="text-xs font-semibold">{t(dimension.translationKey)}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {dimension.options.map(opt => t(opt.translationKey)).join(' → ')}
                  </p>
                  {IMPACT_DIMENSIONS.includes(dimension.key) && (
                    <div className="pt-1.5 mt-1.5 border-t border-border">
                      <p className="text-[10px] font-medium text-primary mb-0.5">{t('visualizations.miniSlider.affects')}</p>
                      <p className="text-[9px] text-muted-foreground mb-1">
                        {t(`visualizations.miniSlider.impact.${dimension.key}.description`)}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {(t(`visualizations.miniSlider.impact.${dimension.key}.elements`, { returnObjects: true }) as string[]).map(el => (
                          <span key={el} className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                            {el}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <span className="text-[10px] text-muted-foreground text-right truncate max-w-[40%] @[240px]:inline hidden">
          {t(currentOption?.translationKey || '')}
        </span>
      </div>
      
      <div className="w-full group">
        <Slider
          value={[currentIndex]}
          onValueChange={([value]) => onChange(value)}
          min={0}
          max={dimension.options.length - 1}
          step={1}
          className="w-full transition-all group-hover:scale-[1.01]"
        />
      </div>
      
      <div className="@[240px]:hidden flex justify-end mt-0.5">
        <span className="text-[9px] text-muted-foreground">
          {t(currentOption?.translationKey || '')}
        </span>
      </div>
    </div>
  );
}
