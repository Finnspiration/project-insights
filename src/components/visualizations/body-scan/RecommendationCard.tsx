import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Quote } from 'lucide-react';

interface RecommendationCardProps {
  recommendation: {
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    rationale?: string;
    citations?: Array<{
      document: string;
      quote: string;
    }>;
  };
  affectedParts: string[];
  index: number;
}

export function RecommendationCard({ recommendation, affectedParts, index }: RecommendationCardProps) {
  const { t } = useTranslation('common');
  
  const priorityColors = {
    high: 'bg-destructive text-destructive-foreground',
    medium: 'bg-chart-3 text-chart-3-foreground',
    low: 'bg-muted text-muted-foreground'
  };
  
  const partIcons: Record<string, string> = {
    head: '🧠',
    face: '😊',
    shoulders: '💪',
    torso: '🫀',
    belly: '⚡',
    spine: '🦴',
    legs: '🦵'
  };
  
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
            {index + 1}
          </div>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-sm">{recommendation.title}</h4>
              <Badge className={priorityColors[recommendation.priority]} variant="secondary">
                {t(`insights.priority.${recommendation.priority}`)}
              </Badge>
            </div>
            
            <p className="text-sm text-muted-foreground">{recommendation.description}</p>
            
            {recommendation.citations && recommendation.citations.length > 0 && (
              <div className="bg-accent/20 rounded-md p-3 border border-accent/30">
                <div className="flex gap-2 items-start">
                  <Quote className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                  <blockquote className="text-xs italic text-foreground">
                    "{recommendation.citations[0].quote}"
                  </blockquote>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  — {recommendation.citations[0].document}
                </p>
              </div>
            )}
            
            {recommendation.rationale && (
              <div className="bg-primary/5 rounded-md p-3 border border-primary/10">
                <p className="text-xs font-medium text-primary mb-1">
                  {t('visualizations.bodyScan.action')}:
                </p>
                <p className="text-xs text-foreground">{recommendation.rationale}</p>
              </div>
            )}
            
            {affectedParts.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{t('visualizations.bodyScan.affectedBodyParts')}:</span>
                <div className="flex gap-1">
                  {affectedParts.map(part => (
                    <span key={part} title={t(`visualizations.bodyScan.parts.${part}`)}>
                      {partIcons[part]}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
