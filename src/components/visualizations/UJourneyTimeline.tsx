import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingDown, TrendingUp } from 'lucide-react';

interface UJourneyTimelineProps {
  morphology: any;
}

const U_PHASES = [
  { key: 'downloading', position: 0, depth: 0 },
  { key: 'seeing', position: 1, depth: 20 },
  { key: 'sensing', position: 2, depth: 50 },
  { key: 'presencing', position: 3, depth: 70 },
  { key: 'crystallizing', position: 4, depth: 50 },
  { key: 'prototyping', position: 5, depth: 20 },
  { key: 'performing', position: 6, depth: 0 },
];

export function UJourneyTimeline({ morphology }: UJourneyTimelineProps) {
  const { t } = useTranslation('common');

  // Determine current phase based on morphology
  const getCurrentPhase = () => {
    const complexity = morphology?.complexity || 'complicated';
    const knowledge = morphology?.knowledge || 'adaptive';
    const change = morphology?.change || 'transitional';

    // Simple projects: likely in downloading/seeing
    if (complexity === 'simple' && knowledge === 'routine') {
      return U_PHASES[0]; // downloading
    }

    // Complicated projects: likely in seeing/sensing
    if (complexity === 'complicated' && knowledge === 'adaptive') {
      return U_PHASES[1]; // seeing
    }

    // Complex + transformational: likely in presencing
    if (complexity === 'complex' && change === 'transformational') {
      return U_PHASES[3]; // presencing
    }

    // Innovative work: likely in crystallizing/prototyping
    if (knowledge === 'innovative' || knowledge === 'breakthrough') {
      return U_PHASES[4]; // crystallizing
    }

    // Default: sensing
    return U_PHASES[2];
  };

  const currentPhase = getCurrentPhase();
  const isDescending = currentPhase.position <= 3;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isDescending ? (
            <TrendingDown className="h-5 w-5 text-primary" />
          ) : (
            <TrendingUp className="h-5 w-5 text-primary" />
          )}
          {t('visualizations.uJourney.title')}
        </CardTitle>
        <CardDescription>
          {t('visualizations.uJourney.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Current Phase Badge */}
          <div className="flex items-center justify-center">
            <Badge variant="secondary" className="text-sm px-4 py-2">
              {t('visualizations.uJourney.current')}: {t(`visualizations.uJourney.phases.${currentPhase.key}`)}
            </Badge>
          </div>

          {/* U-Curve Visualization */}
          <div className="relative h-64 bg-gradient-to-b from-background to-muted rounded-lg p-6">
            {/* SVG Path for U-curve */}
            <svg className="w-full h-full" viewBox="0 0 700 200" preserveAspectRatio="xMidYMid meet">
              {/* U-curve path */}
              <path
                d="M 50 20 Q 150 80, 200 140 Q 250 160, 350 160 Q 450 160, 500 140 Q 550 80, 650 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="text-primary/30"
              />

              {/* Gradient overlay */}
              <defs>
                <linearGradient id="uGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
                  <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
                </linearGradient>
              </defs>

              <path
                d="M 50 20 Q 150 80, 200 140 Q 250 160, 350 160 Q 450 160, 500 140 Q 550 80, 650 20"
                fill="none"
                stroke="url(#uGradient)"
                strokeWidth="4"
                className="animate-fade-in"
                strokeDasharray="1000"
                strokeDashoffset="0"
              />

              {/* Phase markers */}
              {U_PHASES.map((phase, index) => {
                const x = 50 + (index * 100);
                const y = 20 + (phase.depth * 1.4);
                const isCurrent = phase.key === currentPhase.key;

                return (
                  <g key={phase.key}>
                    <circle
                      cx={x}
                      cy={y}
                      r={isCurrent ? 10 : 6}
                      fill={isCurrent ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'}
                      className={isCurrent ? 'animate-pulse' : ''}
                    />
                    {isCurrent && (
                      <circle
                        cx={x}
                        cy={y}
                        r={15}
                        fill="none"
                        stroke="hsl(var(--primary))"
                        strokeWidth="2"
                        opacity="0.5"
                      />
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Phase Labels */}
          <div className="grid grid-cols-7 gap-1 text-xs text-center">
            {U_PHASES.map((phase) => {
              const isCurrent = phase.key === currentPhase.key;
              return (
                <div
                  key={phase.key}
                  className={`transition-all ${
                    isCurrent ? 'font-bold text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {t(`visualizations.uJourney.phases.${phase.key}`)}
                </div>
              );
            })}
          </div>

          {/* Context Info */}
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-muted-foreground mb-1">Complexity</p>
              <p className="font-medium capitalize">{morphology?.complexity || 'N/A'}</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-muted-foreground mb-1">Knowledge</p>
              <p className="font-medium capitalize">{morphology?.knowledge || 'N/A'}</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-muted-foreground mb-1">Change</p>
              <p className="font-medium capitalize">{morphology?.change || 'N/A'}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
