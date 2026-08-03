import { useTranslation } from 'react-i18next';
import { MORPHOLOGY_DIMENSIONS, CATEGORY_COLORS } from '@/lib/morphologyConfig';
import { morphologyValue, type RawMorphology } from '@shared/morphology.ts';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

// The 12 dimensions used to be drawn on the map itself as labelled circles,
// which is what made it unreadable: they are context for the reading, not the
// reading. Here they are a compact strip — position within the scale is the
// only thing being encoded, and the label is one hover away.

interface DimensionStripProps {
  morphology: RawMorphology;
  /** Called when a dimension is clicked, so the strip can double as an editor. */
  onSelect?: (dimensionKey: string) => void;
}

export function DimensionStrip({ morphology, onSelect }: DimensionStripProps) {
  const { t } = useTranslation('common');

  return (
    <div className="border-t border-border px-5 py-4 sm:px-7">
      <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {t('visualizations.weatherReading.dimensionStrip')}
      </h3>

      <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-12 sm:gap-1">
        {MORPHOLOGY_DIMENSIONS.map((dimension) => {
          const value = morphologyValue(morphology, dimension.key);
          const index = value ? dimension.options.findIndex((option) => option.value === value) : -1;
          // Fraction of the way along this dimension's own scale.
          const position = index >= 0 ? (index + 1) / dimension.options.length : 0;
          const label = value
            ? t(dimension.options[index]?.translationKey ?? value)
            : t('visualizations.weatherReading.unanswered');

          return (
            <Tooltip key={dimension.key}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => onSelect?.(dimension.key)}
                  disabled={!onSelect}
                  aria-label={`${t(dimension.translationKey)}: ${label}`}
                  className="group min-w-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                >
                  <div className="relative h-10 overflow-hidden rounded border border-border/60 bg-muted/40 transition-colors group-hover:bg-muted group-enabled:cursor-pointer">
                    <div
                      className="absolute inset-x-0 bottom-0 rounded transition-[height] duration-500"
                      style={{
                        height: `${Math.max(position * 100, value ? 14 : 0)}%`,
                        background: `hsl(${CATEGORY_COLORS[dimension.category]})`,
                        opacity: value ? 0.9 : 0.25,
                      }}
                    />
                  </div>
                  <div className="mt-1.5 truncate text-[9.5px] leading-tight text-muted-foreground">
                    {t(dimension.translationKey).split(/[ -]/)[0]}
                  </div>
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">{t(dimension.translationKey)}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
