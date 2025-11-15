import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '@/lib/morphologyConfig';
import * as Icons from 'lucide-react';

interface DimensionDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dimension: {
    key: string;
    translationKey: string;
    category: string;
  };
  selectedOption: {
    value: string;
    translationKey: string;
  };
  allOptions: Array<{
    value: string;
    translationKey: string;
  }>;
  onOptionSelect?: (optionValue: string) => void;
}

export function DimensionDetailDialog({
  open,
  onOpenChange,
  dimension,
  selectedOption,
  allOptions,
  onOptionSelect,
}: DimensionDetailDialogProps) {
  const { t, i18n } = useTranslation('common');
  const currentLanguage = i18n.language as 'en' | 'da';

  // Defensive check - prevent crash if dimension or selectedOption is undefined
  if (!dimension || !selectedOption) {
    return null;
  }

  const categoryColor = CATEGORY_COLORS[dimension.category as keyof typeof CATEGORY_COLORS];
  const categoryIconName = CATEGORY_ICONS[dimension.category as keyof typeof CATEGORY_ICONS];
  
  // Get the icon component
  const IconComponent = Icons[categoryIconName as keyof typeof Icons] as React.ComponentType<{ className?: string }>;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            {IconComponent && (
              <div 
                className="p-2 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `hsl(${categoryColor} / 0.1)`, color: `hsl(${categoryColor})` }}
              >
                <IconComponent className="h-6 w-6" />
              </div>
            )}
            <div className="flex-1">
              <DialogTitle className="text-xl">
                {t(dimension.translationKey, { lng: currentLanguage })}
              </DialogTitle>
              <Badge 
                variant="secondary" 
                className="mt-1"
                style={{ 
                  backgroundColor: `hsl(${categoryColor} / 0.15)`,
                  color: `hsl(${categoryColor})`,
                  borderColor: `hsl(${categoryColor} / 0.3)`
                }}
              >
                {t(`morphology.category.${dimension.category}`, { lng: currentLanguage })}
              </Badge>
            </div>
          </div>
          <DialogDescription>
            {t(`${dimension.translationKey}.description`, { 
              lng: currentLanguage,
              defaultValue: t(`${dimension.translationKey}.info`, { 
                lng: currentLanguage,
                defaultValue: ''
              })
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6">
          <h3 className="font-semibold mb-3 text-sm text-muted-foreground">
            {currentLanguage === 'da' ? 'Valgt værdi' : 'Selected value'}
          </h3>
          <div 
            className="p-4 rounded-lg border-2"
            style={{ 
              backgroundColor: `hsl(${categoryColor} / 0.05)`,
              borderColor: `hsl(${categoryColor})`
            }}
          >
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: `hsl(${categoryColor})` }}
              />
              <span className="font-semibold">
                {t(selectedOption.translationKey, { lng: currentLanguage })}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="font-semibold mb-3 text-sm text-muted-foreground">
            {currentLanguage === 'da' ? 'Alle muligheder' : 'All options'}
          </h3>
          <div className="grid gap-2">
            {allOptions.map((option) => {
              const isSelected = option.value === selectedOption.value;
              return (
                <div
                  key={option.value}
                  onClick={() => {
                    if (!isSelected && onOptionSelect) {
                      onOptionSelect(option.value);
                      onOpenChange(false);
                    }
                  }}
                  className={`p-3 rounded-lg border transition-all ${
                    isSelected 
                      ? 'border-primary/50 bg-primary/5' 
                      : 'border-border bg-muted/30 hover:bg-muted/50 hover:border-primary/30 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className={`w-2 h-2 rounded-full ${
                        isSelected ? 'opacity-100' : 'opacity-30'
                      }`}
                      style={{ 
                        backgroundColor: isSelected 
                          ? `hsl(${categoryColor})` 
                          : 'hsl(var(--muted-foreground))'
                      }}
                    />
                    <span className={isSelected ? 'font-medium' : 'text-muted-foreground'}>
                      {t(option.translationKey, { lng: currentLanguage })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
