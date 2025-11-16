import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { IDGEvidence } from '@/lib/idgScoring';

interface IDGEvidenceBreakdownPanelProps {
  evidence: IDGEvidence[];
}

export function IDGEvidenceBreakdownPanel({ evidence }: IDGEvidenceBreakdownPanelProps) {
  const { t } = useTranslation('common');
  const [isOpen, setIsOpen] = useState(false);

  // Get color based on score
  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600 dark:text-green-400';
    if (score >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getProgressColor = (score: number) => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-primary/20">
        <CollapsibleTrigger className="w-full">
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">
                  {t('visualizations.idgRadar.evidence.title')}
                </CardTitle>
              </div>
              <ChevronDown
                className={`h-5 w-5 text-muted-foreground transition-transform ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
            </div>
            <CardDescription className="text-left">
              {t('visualizations.idgRadar.evidence.description')}
            </CardDescription>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-4 pt-0">
            {evidence.map((item) => (
              <Card key={item.dimension} className="border-muted">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span className="capitalize">{t(item.dimensionKey)}</span>
                    <span className={`text-2xl font-bold ${getScoreColor(item.totalScore)}`}>
                      {item.totalScore}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Base Score */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t('visualizations.idgRadar.evidence.baseScore')}
                    </span>
                    <span className="font-medium">{item.baseScore}</span>
                  </div>

                  {/* Contributions */}
                  {item.contributions.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">
                        {t('visualizations.idgRadar.evidence.contributions')}
                      </div>
                      {item.contributions.map((contrib, idx) => (
                        <div key={idx} className="pl-3 border-l-2 border-primary/30 space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{t(contrib.sourceKey)}</span>
                            <span className="text-primary font-bold">+{contrib.value}</span>
                          </div>
                          <p className="text-xs text-muted-foreground italic">
                            {t(contrib.reasoningKey, { dimension: t(item.dimensionKey) })}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Document evidence */}
                  {item.documentEvidence && (
                    <div className="mt-3 p-3 bg-accent/20 rounded-md border border-accent/30">
                      <p className="text-xs font-semibold text-accent-foreground mb-1">
                        {t('visualizations.idgRadar.evidence.documentEvidence')}
                      </p>
                      <blockquote className="text-xs italic text-muted-foreground border-l-2 border-accent pl-2">
                        "{item.documentEvidence}"
                      </blockquote>
                    </div>
                  )}

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{t('visualizations.idgRadar.evidence.totalScore')}</span>
                      <span>{item.totalScore}/100</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${getProgressColor(
                          item.totalScore
                        )}`}
                        style={{ width: `${item.totalScore}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
