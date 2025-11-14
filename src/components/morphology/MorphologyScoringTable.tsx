import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { BarChart3, TrendingUp, Info } from 'lucide-react';

interface MorphologyScoringProps {
  morphologyScoring: {
    phase: string;
    confidence: number;
    score?: number;
    topContributions?: string[];
    allPhaseScores?: Array<{
      phase: string;
      score: number;
      topContributions?: Array<{
        dimension: string;
        value: string;
        contribution: number;
        reasoning: string;
      }>;
    }>;
  };
  aiNuance?: string;
}

export function MorphologyScoringTable({ morphologyScoring, aiNuance }: MorphologyScoringProps) {
  const { t } = useTranslation('common');

  if (!morphologyScoring) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {t('morphology.scoring.title')}
          </CardTitle>
          <CardDescription>
            {t('morphology.scoring.noData')}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const getPhaseColor = (phase: string) => {
    const colors: Record<string, string> = {
      downloading: 'bg-slate-500',
      seeing: 'bg-blue-500',
      sensing: 'bg-cyan-500',
      presencing: 'bg-purple-500',
      crystallizing: 'bg-pink-500',
      prototyping: 'bg-orange-500',
      performing: 'bg-green-500',
    };
    return colors[phase] || 'bg-gray-500';
  };

  return (
    <div className="space-y-6">
      {/* Header Card with Overall Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {t('morphology.scoring.title')}
          </CardTitle>
          <CardDescription>
            {t('morphology.scoring.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Dominant Phase */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                {t('morphology.scoring.dominantPhase')}
              </p>
              <div className="flex items-center gap-2">
                <Badge className={`${getPhaseColor(morphologyScoring.phase)} text-white`}>
                  {morphologyScoring.phase}
                </Badge>
                <span className="text-2xl font-bold">
                  {(morphologyScoring.confidence * 100).toFixed(0)}%
                </span>
                <span className="text-sm text-muted-foreground">confidence</span>
              </div>
            </div>
            {morphologyScoring.score && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-1">Total Score</p>
                <p className="text-2xl font-bold">{morphologyScoring.score}</p>
              </div>
            )}
          </div>

          {/* Top Contributions */}
          {morphologyScoring.topContributions && morphologyScoring.topContributions.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                {t('morphology.scoring.topContributions')}
              </h4>
              <div className="space-y-2">
                {morphologyScoring.topContributions.map((contrib, index) => (
                  <div key={index} className="flex items-start gap-2 p-3 bg-muted/30 rounded-md">
                    <Badge variant="outline" className="mt-0.5">{index + 1}</Badge>
                    <p className="text-sm flex-1">{contrib}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Phase Scores */}
      {morphologyScoring.allPhaseScores && morphologyScoring.allPhaseScores.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {t('morphology.scoring.allPhases')}
            </CardTitle>
            <CardDescription>
              {t('morphology.scoring.allPhasesDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {morphologyScoring.allPhaseScores.map((phaseScore, index) => (
                <AccordionItem key={phaseScore.phase} value={phaseScore.phase}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-3">
                        <Badge 
                          className={`${getPhaseColor(phaseScore.phase)} text-white`}
                          variant="default"
                        >
                          #{index + 1}
                        </Badge>
                        <span className="font-semibold">{phaseScore.phase}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">{phaseScore.score}</span>
                        <span className="text-sm text-muted-foreground">points</span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {phaseScore.topContributions && phaseScore.topContributions.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t('morphology.scoring.dimension')}</TableHead>
                            <TableHead>{t('morphology.scoring.value')}</TableHead>
                            <TableHead className="text-right">{t('morphology.scoring.contribution')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {phaseScore.topContributions.map((contrib, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="font-medium">
                                {contrib.dimension}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{contrib.value}</Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex flex-col items-end gap-1">
                                  <Badge variant="secondary">
                                    +{contrib.contribution}
                                  </Badge>
                                  <p className="text-xs text-muted-foreground max-w-xs text-right">
                                    {contrib.reasoning}
                                  </p>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-sm text-muted-foreground py-4">
                        {t('morphology.scoring.noContributions')}
                      </p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* AI Nuance */}
      {aiNuance && (
        <Card className="border-purple-200 dark:border-purple-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
              <Info className="h-5 w-5" />
              {t('morphology.scoring.aiNuance')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{aiNuance}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
