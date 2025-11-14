import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

interface OptionCardProps {
  translationKey: string;
  isSelected: boolean;
  categoryColor: string;
  onSelect?: () => void;
  disabled?: boolean;
}

export function OptionCard({ 
  translationKey, 
  isSelected, 
  categoryColor, 
  onSelect, 
  disabled 
}: OptionCardProps) {
  const { t } = useTranslation('common');
  
  const displayText = t(translationKey, { defaultValue: translationKey });

  return (
    <Card
      onClick={!disabled && onSelect ? onSelect : undefined}
      className={cn(
        "relative p-4 text-center transition-all duration-300 cursor-pointer min-h-[100px] flex items-center justify-center",
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
        "text-base font-medium",
        isSelected ? "text-foreground" : "text-muted-foreground"
      )}>
        {displayText}
      </p>
    </Card>
  );
}
