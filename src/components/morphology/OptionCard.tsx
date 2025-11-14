import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface OptionCardProps {
  translationKeyShort: string;
  translationKeyLong: string;
  isSelected: boolean;
  categoryColor: string;
  onSelect?: () => void;
  disabled?: boolean;
}

export function OptionCard({ 
  translationKeyShort,
  translationKeyLong,
  isSelected, 
  categoryColor, 
  onSelect, 
  disabled 
}: OptionCardProps) {
  const { t } = useTranslation('common');
  
  const shortText = t(translationKeyShort, { defaultValue: translationKeyShort.split('.').pop() || '' });
  const longText = t(translationKeyLong, { defaultValue: shortText });

  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <Card
          onClick={!disabled && onSelect ? onSelect : undefined}
          className={cn(
            "relative p-3 text-center transition-all duration-300 cursor-pointer min-h-[80px] flex items-center justify-center",
            isSelected
              ? "bg-gradient-to-br from-primary/20 to-accent/20 border-primary shadow-lg scale-105"
              : "bg-card hover:bg-muted/50 border-border hover:border-primary/30",
            (!onSelect || disabled) && "cursor-default opacity-60"
          )}
          style={
            isSelected
              ? {
                  boxShadow: `0 0 20px ${categoryColor}30`,
                  borderColor: categoryColor,
                }
              : undefined
          }
        >
          {isSelected && (
            <div 
              className="absolute -top-2 -right-2 rounded-full p-1.5 shadow-md"
              style={{ backgroundColor: categoryColor }}
            >
              <Check className="h-4 w-4 text-white" />
            </div>
          )}
          <p className={cn(
            "text-sm font-medium break-words hyphens-auto text-center px-1",
            isSelected ? "text-foreground" : "text-muted-foreground"
          )}>
            {shortText}
          </p>
        </Card>
      </TooltipTrigger>
      <TooltipContent className="max-w-[300px] text-center">
        <p>{longText}</p>
      </TooltipContent>
    </Tooltip>
  );
}
