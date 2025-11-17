import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, Clock } from 'lucide-react';

interface InterventionCardProps {
  intervention: {
    type: 'coaching' | 'workshop' | 'process' | 'tool';
    title: string;
    description: string;
    timeframe?: string;
    status?: 'not_started' | 'in_progress' | 'completed';
  };
  onStatusChange?: (newStatus: 'not_started' | 'in_progress' | 'completed') => void;
}

export function InterventionCard({ intervention, onStatusChange }: InterventionCardProps) {
  const { t } = useTranslation('common');
  const [status, setStatus] = useState(intervention.status || 'not_started');
  
  const typeColors = {
    coaching: 'bg-chart-1 text-chart-1-foreground',
    workshop: 'bg-chart-2 text-chart-2-foreground',
    process: 'bg-chart-3 text-chart-3-foreground',
    tool: 'bg-chart-4 text-chart-4-foreground'
  };
  
  const typeIcons = {
    coaching: '🎯',
    workshop: '🛠️',
    process: '⚙️',
    tool: '🔧'
  };
  
  const handleStatusChange = (newStatus: 'not_started' | 'in_progress' | 'completed') => {
    setStatus(newStatus);
    onStatusChange?.(newStatus);
  };
  
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">{typeIcons[intervention.type]}</span>
              <div>
                <h4 className="font-semibold text-sm">{intervention.title}</h4>
                <Badge className={typeColors[intervention.type]} variant="secondary">
                  {t(`visualizations.bodyScan.interventionTypes.${intervention.type}`)}
                  {t(`visualizations.bodyScan.interventionTypes.${intervention.type}`)}
                </Badge>
              </div>
            </div>
            
            {status === 'completed' ? (
              <CheckCircle2 className="w-5 h-5 text-chart-1" />
            ) : status === 'in_progress' ? (
              <Circle className="w-5 h-5 text-chart-3 fill-chart-3" />
            ) : (
              <Circle className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
          
          <p className="text-sm text-muted-foreground">{intervention.description}</p>
          
          {intervention.timeframe && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{t('visualizations.bodyScan.timeframe')}: {intervention.timeframe}</span>
            </div>
          )}
          
          <div className="flex gap-2">
            {status === 'not_started' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusChange('in_progress')}
                className="text-xs"
              >
                {t('visualizations.bodyScan.markAsStarted')}
              </Button>
            )}
            {status === 'in_progress' && (
              <Button
                size="sm"
                variant="default"
                onClick={() => handleStatusChange('completed')}
                className="text-xs"
              >
                {t('visualizations.bodyScan.markAsCompleted')}
              </Button>
            )}
            {status === 'completed' && (
              <Badge variant="secondary" className="bg-chart-1 text-chart-1-foreground">
                {t('visualizations.bodyScan.completed')}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
