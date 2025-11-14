import { useTranslation } from 'react-i18next';
import { DimensionConfig, CATEGORY_COLORS } from '@/lib/morphologyConfig';
import { OptionCell } from './OptionCell';
import { cn } from '@/lib/utils';

interface DimensionRowProps {
  dimension: DimensionConfig;
  selectedValue?: string;
  onSelect?: (dimensionKey: string, value: string) => void;
}

export function DimensionRow({ dimension, selectedValue, onSelect }: DimensionRowProps) {
  const { t } = useTranslation('common');
  const categoryColor = CATEGORY_COLORS[dimension.category];

  return (
    <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-2 md:gap-4 p-3 border-b border-border/50 hover:bg-muted/20 transition-colors">
      {/* Dimension Name */}
      <div className="flex items-center">
        <div
          className="w-1 h-full md:h-8 mr-3 rounded-full"
          style={{ backgroundColor: categoryColor }}
        />
        <h4 className="font-medium text-sm md:text-base text-foreground">
          {t(dimension.translationKey)}
        </h4>
      </div>

      {/* Options Grid */}
      <div className={cn(
        "grid gap-2",
        dimension.options.length === 4 && "grid-cols-2 sm:grid-cols-4",
        dimension.options.length === 5 && "grid-cols-2 sm:grid-cols-5"
      )}>
        {dimension.options.map((option) => (
          <OptionCell
            key={option.value}
            translationKey={option.translationKey}
            isSelected={selectedValue === option.value}
            categoryColor={categoryColor}
            onClick={() => onSelect?.(dimension.key, option.value)}
          />
        ))}
      </div>
    </div>
  );
}
