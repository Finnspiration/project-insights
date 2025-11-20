import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Target } from 'lucide-react';
import { calculateIDGWithEvidence } from '@/lib/idgScoring';
import { IDGEvidenceBreakdownPanel } from './idg/IDGEvidenceBreakdownPanel';

interface IDGRadarChartProps {
  morphology: any;
  documents?: any[];
  onScoresCalculated?: (scores: { being: number; thinking: number; relating: number; collaborating: number; acting: number }) => void;
}

const IDG_DIMENSIONS = ['being', 'thinking', 'relating', 'collaborating', 'acting'];

export function IDGRadarChart({ morphology, documents = [], onScoresCalculated }: IDGRadarChartProps) {
  const { t } = useTranslation('common');

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
          <p className="text-muted-foreground">Ingen morfologi data tilgængelig endnu.</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate scores based on morphology with defensive defaults
  const calculateScores = (): Record<string, number> => {
    try {
      const development = morphology?.development?.selectedValue || morphology?.development || 'thinking';
      const organizational = morphology?.organizational?.selectedValue || morphology?.organizational || 'orange';
      const challenge = morphology?.challenge?.selectedValue || morphology?.challenge || 'technical';

      // Base scores
      const scores: Record<string, number> = {
        being: 50,
        thinking: 50,
        relating: 50,
        collaborating: 50,
        acting: 50,
      };

      // Boost primary development dimension
      if (development && scores[development] !== undefined) {
        scores[development] += 30;
      }

      // Organizational stage influences
      if (organizational === 'green' || organizational === 'teal') {
        scores.relating += 15;
        scores.collaborating += 15;
      }
      if (organizational === 'orange') {
        scores.thinking += 15;
        scores.acting += 10;
      }
      if (organizational === 'red' || organizational === 'amber') {
        scores.acting += 15;
      }

      // Challenge type influences
      if (challenge === 'cognitive') {
        scores.thinking += 10;
      }
      if (challenge === 'social') {
        scores.relating += 10;
      }
      if (challenge === 'adaptive') {
        scores.being += 10;
      }

      // Normalize to 0-100
      Object.keys(scores).forEach((key) => {
        scores[key] = Math.min(100, Math.max(0, scores[key]));
      });

      return scores;
    } catch (error) {
      console.error('Error calculating IDG scores:', error);
      // Return safe defaults
      return {
        being: 50,
        thinking: 50,
        relating: 50,
        collaborating: 50,
        acting: 50,
      };
    }
  };

  const scores = calculateScores();
  
  // Notify parent component of calculated scores (normalized to 0-10 scale for weather map)
  useEffect(() => {
    if (onScoresCalculated) {
      const normalizedScores = {
        being: scores.being / 10,
        thinking: scores.thinking / 10,
        relating: scores.relating / 10,
        collaborating: scores.collaborating / 10,
        acting: scores.acting / 10,
      };
      onScoresCalculated(normalizedScores);
    }
  }, [scores.being, scores.thinking, scores.relating, scores.collaborating, scores.acting, onScoresCalculated]);
  
  // Safely calculate evidence with error handling
  let evidence = [];
  try {
    evidence = calculateIDGWithEvidence(morphology, documents || []);
  } catch (error) {
    console.error('Error calculating IDG evidence:', error);
    // Provide empty evidence if calculation fails
    evidence = [];
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
              <p className="text-sm text-muted-foreground">Average Score</p>
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
              <p className="text-muted-foreground mb-1">Primary Focus</p>
              <p className="font-medium capitalize">
                {morphology?.development?.selectedValue || morphology?.development || 'N/A'}
              </p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-muted-foreground mb-1">Org Stage</p>
              <p className="font-medium capitalize">
                {morphology?.organizational?.selectedValue || morphology?.organizational || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
