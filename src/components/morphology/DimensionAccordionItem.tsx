import { useTranslation } from 'react-i18next';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { OptionCard } from './OptionCard';
import { DimensionConfig } from '@/lib/morphologyConfig';

interface DimensionAccordionItemProps {
  dimension: DimensionConfig;
  selectedValue: string;
  categoryColor: string;
  onSelect?: (value: string) => void;
  disabled?: boolean;
}

export function DimensionAccordionItem({
  dimension,
  selectedValue,
  categoryColor,
  onSelect,
  disabled
}: DimensionAccordionItemProps) {
  const { t } = useTranslation('common');
  
  const dimensionLabel = t(dimension.translationKey, { defaultValue: dimension.key });
  const selectedOption = dimension.options.find(opt => opt.value === selectedValue);
  const selectedLabel = selectedOption 
    ? t(selectedOption.translationKeyShort, { defaultValue: selectedOption.value })
    : '';

  return (
    <AccordionItem value={dimension.key} className="border rounded-lg mb-2 bg-card">
      <AccordionTrigger className="px-4 hover:no-underline">
        <div className="flex items-center gap-3 flex-1">
          <Badge 
            variant="outline" 
            className="shrink-0"
            style={{ 
              borderColor: categoryColor,
              color: categoryColor 
            }}
          >
            {t(`morphology.categories.${dimension.category}`, { defaultValue: dimension.category })}
          </Badge>
          <span className="font-semibold text-foreground">{dimensionLabel}</span>
          {selectedLabel && (
            <span className="text-sm text-muted-foreground ml-auto mr-2">
              → {selectedLabel}
            </span>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-2">
          {dimension.options.map((option) => (
            <OptionCard
              key={option.value}
              translationKeyShort={option.translationKeyShort}
              translationKeyLong={option.translationKeyLong}
              isSelected={selectedValue === option.value}
              categoryColor={categoryColor}
              onSelect={onSelect && !disabled ? () => onSelect(option.value) : undefined}
              disabled={disabled}
            />
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
