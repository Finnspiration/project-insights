import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Target } from 'lucide-react';
import { calculateIDG } from '@/lib/idgScoring';
import { IDGEvidenceBreakdownPanel } from './idg/IDGEvidenceBreakdownPanel';
import { IDG_DIMENSIONS, type IDGScores, type ProjectDocument } from '@/types/project';
import { morphologyValue, type RawMorphology } from '@shared/morphology.ts';

interface IDGRadarChartProps {
  morphology: RawMorphology;
  documents?: ProjectDocument[];
  precalculatedScores?: IDGScores;
}

export function IDGRadarChart({ morphology, documents = [], precalculatedScores }: IDGRadarChartProps) {
  const { t } = useTranslation('common');

  // One calculation feeds the chart, the average and the breakdown panel, so
  // the number and its explanation cannot disagree. precalculatedScores lets
  // the parent pass a result it has already computed (e.g. from a live edit).
  const { radar, evidence } = useMemo(
    () => calculateIDG(morphology, documents),
    [morphology, documents],
  );
  const scores = precalculatedScores ?? radar;

  // Defensive check for morphology
  if (!morphology) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            {t('visualizations.idgRadar.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{t('visualizations.noMorphologyData')}</p>
        </CardContent>
      </Card>
    );
  }

  // Ensure all data points have valid numeric values for Recharts
  const data = IDG_DIMENSIONS.map((dim) => ({
    dimension: t(`visualizations.idgRadar.dimensions.${dim}`),
    score: typeof scores[dim] === 'number' && !isNaN(scores[dim]) ? scores[dim] : 50,
    fullMark: 100,
  }));

  // Calculate average score with safety checks
  const avgScore = Math.round(
    IDG_DIMENSIONS.reduce((sum, dim) => {
      const score = scores[dim];
      return sum + (typeof score === 'number' && !isNaN(score) ? score : 50);
    }, 0) / IDG_DIMENSIONS.length
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          {t('visualizations.idgRadar.title')}
        </CardTitle>
        <CardDescription>
          {t('visualizations.idgRadar.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Average Score */}
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">{avgScore}</div>
              <p className="text-sm text-muted-foreground">{t('visualizations.idgRadar.averageScore')}</p>
            </div>
          </div>

          {/* Radar Chart */}
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={data}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis
                dataKey="dimension"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <Radar
                name="Score"
                dataKey="score"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.3}
                strokeWidth={2}
                className="animate-fade-in"
              />
            </RadarChart>
          </ResponsiveContainer>

          {/* Dimension Scores */}
          <div className="space-y-2">
            {IDG_DIMENSIONS.map((dim) => {
              const score = typeof scores[dim] === 'number' && !isNaN(scores[dim]) ? scores[dim] : 50;
              return (
                <div key={dim} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium capitalize">
                      {t(`visualizations.idgRadar.dimensions.${dim}`)}
                    </span>
                    <span className="text-muted-foreground">{score}/100</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500 rounded-full"
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Evidence Breakdown Panel - only show if we have evidence */}
          {evidence && evidence.length > 0 && (
            <IDGEvidenceBreakdownPanel evidence={evidence} />
          )}

          {/* Context Info */}
          <div className="grid grid-cols-2 gap-4 text-center text-sm">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-muted-foreground mb-1">{t('visualizations.idgRadar.primaryFocus')}</p>
              <p className="font-medium capitalize">
                {morphologyValue(morphology, 'development') || t('common.notAvailable')}
              </p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-muted-foreground mb-1">{t('visualizations.idgRadar.orgStage')}</p>
              <p className="font-medium capitalize">
                {morphologyValue(morphology, 'organizational') || t('common.notAvailable')}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
