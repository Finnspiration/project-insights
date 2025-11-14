import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OptionCellProps {
  translationKey: string;
  isSelected: boolean;
  categoryColor: string;
}

export function OptionCell({ translationKey, isSelected, categoryColor }: OptionCellProps) {
  const { t } = useTranslation('common');

  return (
    <div
      className={cn(
        "relative px-3 py-3 text-center text-sm transition-all duration-200 rounded border min-h-[60px] flex items-center justify-center",
        isSelected
          ? "bg-gradient-to-br from-primary/20 to-accent/20 border-primary/40 font-semibold text-foreground shadow-md"
          : "bg-muted/30 border-border/40 text-muted-foreground hover:bg-muted/50"
      )}
      style={
        isSelected
          ? {
              boxShadow: `0 0 12px ${categoryColor}40`,
            }
          : undefined
      }
    >
      {isSelected && (
        <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full p-0.5">
          <Check className="h-3 w-3" />
        </div>
      )}
      <span className="block leading-snug">{t(translationKey)}</span>
    </div>
  );
}
