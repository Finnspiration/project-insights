import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, BarChart3 } from 'lucide-react';
import { useState } from 'react';

interface EvidenceBreakdownPanelProps {
  morphologyEvidence?: Array<{
    dimension: string;
    value: string;
    reasoning: string;
  }>;
  dominantPhase: string;
}

export function EvidenceBreakdownPanel({ morphologyEvidence, dominantPhase }: EvidenceBreakdownPanelProps) {
  const { t } = useTranslation('common');
  const [isOpen, setIsOpen] = useState(false);

  if (!morphologyEvidence || morphologyEvidence.length === 0) {
    return null;
  }

  // Calculate contribution scores (normalized percentages)
  const totalContributions = morphologyEvidence.length;
  const contributionPerItem = 100 / totalContributions;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CollapsibleTrigger className="w-full">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">
                  {t('visualizations.theoryU.evidenceBreakdown.title', 'Evidence Breakdown')}
                </CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {morphologyEvidence.length} {t('visualizations.theoryU.evidenceBreakdown.dimensions', 'dimensioner')}
                </Badge>
                <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-3 pt-0">
            <p className="text-sm text-muted-foreground mb-4">
              {t('visualizations.theoryU.evidenceBreakdown.description', 
                'Disse morfologiske dimensioner har bidraget til placering i')} <span className="font-semibold text-foreground">{dominantPhase}</span>:
            </p>

            {morphologyEvidence.map((evidence, index) => {
              const contribution = contributionPerItem;
              
              return (
                <Card key={index} className="border-border/50 bg-muted/30">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs font-medium">
                            {t(`morphology.dimensions.${evidence.dimension}`, evidence.dimension)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">→</span>
                          <span className="text-sm font-medium text-foreground">
                            {t(`morphology.options.${evidence.dimension}.${evidence.value}`, evidence.value)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {evidence.reasoning}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 min-w-[80px]">
                        <Badge className="bg-primary/10 text-primary border-primary/20">
                          {contribution.toFixed(0)}%
                        </Badge>
                        <Progress value={contribution} className="h-1.5 w-16" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            <div className="pt-2 border-t border-border/50 mt-4">
              <p className="text-xs text-muted-foreground italic">
                💡 {t('visualizations.theoryU.evidenceBreakdown.hint', 
                  'Ændr morfologiske valg i Morphological Box for at se hvordan det påvirker Theory U positionen')}
              </p>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
