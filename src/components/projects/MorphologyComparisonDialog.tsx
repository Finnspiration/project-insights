import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Sparkles, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface MorphologyComparisonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userChoices: Record<string, string | undefined>;
  aiSuggestions: Record<string, { value: string; confidence: number; evidence?: string } | undefined>;
}

type DimensionKey = 
  | 'complexity' 
  | 'stakeholder' 
  | 'knowledge' 
  | 'cultural' 
  | 'temporal' 
  | 'organizational' 
  | 'challenge' 
  | 'development' 
  | 'resources' 
  | 'change' 
  | 'information' 
  | 'risk';

const DIMENSIONS: DimensionKey[] = [
  'complexity',
  'stakeholder',
  'knowledge',
  'cultural',
  'temporal',
  'organizational',
  'challenge',
  'development',
  'resources',
  'change',
  'information',
  'risk',
];

export function MorphologyComparisonDialog({ 
  open, 
  onOpenChange, 
  userChoices, 
  aiSuggestions 
}: MorphologyComparisonDialogProps) {
  const { t } = useTranslation('common');

  const getOptionLabel = (dimension: DimensionKey, value: string) => {
    return t(`morphology.dimensions.${dimension}.options.${value}`);
  };

  const comparisons = DIMENSIONS.map(dimension => {
    const userChoice = userChoices[dimension];
    const aiSuggestion = aiSuggestions?.[dimension];
    const matches = userChoice === aiSuggestion?.value;

    return {
      dimension,
      userChoice,
      aiChoice: aiSuggestion?.value,
      matches,
      confidence: aiSuggestion?.confidence,
      evidence: aiSuggestion?.evidence,
    };
  }).filter(comp => comp.userChoice); // Only show dimensions where user made a choice

  const agreementCount = comparisons.filter(c => c.matches).length;
  const totalCount = comparisons.length;
  const agreementPercentage = totalCount > 0 ? Math.round((agreementCount / totalCount) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {t('morphology.comparison.title') || 'Sammenligning: Dine Valg vs AI-Forslag'}
          </DialogTitle>
          <DialogDescription>
            {t('morphology.comparison.subtitle') || 'Se hvordan dine valg stemmer overens med AI-analysens anbefalinger'}
          </DialogDescription>
        </DialogHeader>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{agreementCount}</div>
            <div className="text-xs text-muted-foreground">
              {t('morphology.comparison.agreements') || 'Enige'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-500">{totalCount - agreementCount}</div>
            <div className="text-xs text-muted-foreground">
              {t('morphology.comparison.disagreements') || 'Uenige'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{agreementPercentage}%</div>
            <div className="text-xs text-muted-foreground">
              {t('morphology.comparison.agreement') || 'Enighed'}
            </div>
          </div>
        </div>

        {/* Detailed Comparison */}
        <div className="space-y-3">
          {comparisons.map(({ dimension, userChoice, aiChoice, matches, confidence }) => (
            <div
              key={dimension}
              className={`border rounded-lg p-4 ${
                matches 
                  ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' 
                  : 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-medium flex items-center gap-2">
                    {matches ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-orange-600" />
                    )}
                    {t(`morphology.dimensions.${dimension}.title`)}
                  </h4>
                </div>
                {confidence && (
                  <Badge variant="outline" className="text-xs">
                    AI: {Math.round(confidence * 100)}%
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* User Choice */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <User className="h-3 w-3" />
                    {t('morphology.comparison.yourChoice') || 'Dit Valg'}
                  </div>
                  <div className="text-sm font-medium pl-5">
                    {getOptionLabel(dimension, userChoice)}
                  </div>
                </div>

                {/* AI Choice */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Sparkles className="h-3 w-3" />
                    {t('morphology.comparison.aiChoice') || 'AI-Forslag'}
                  </div>
                  <div className="text-sm font-medium pl-5">
                    {aiChoice ? getOptionLabel(dimension, aiChoice) : (
                      <span className="text-muted-foreground italic">
                        {t('morphology.comparison.noSuggestion') || 'Ingen forslag'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {!matches && aiChoice && (
                <div className="mt-3 pt-3 border-t border-border/50">
                  <p className="text-xs text-muted-foreground">
                    💡 {t('morphology.comparison.difference') || 'Du valgte anderledes end AI\'ens anbefaling. Det kan være baseret på din kontekst og erfaring.'}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={() => onOpenChange(false)}>
            {t('common.close') || 'Luk'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
