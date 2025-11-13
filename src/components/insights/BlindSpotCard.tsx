import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle2, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BlindSpot {
  id: string;
  title: Record<string, string>;
  description?: Record<string, string>;
  priority: 'high' | 'medium' | 'low';
  confidence?: number;
  evidence?: any;
  consequences?: Record<string, string>;
  recommendations?: Record<string, string>;
  status: 'unaddressed' | 'acknowledged' | 'addressed';
  detected_at: string;
  addressed_at?: string;
}

interface BlindSpotCardProps {
  blindSpot: BlindSpot;
  onUpdate?: () => void;
}

export function BlindSpotCard({ blindSpot, onUpdate }: BlindSpotCardProps) {
  const { t, i18n } = useTranslation('common');
  const [updating, setUpdating] = useState(false);
  const lang = i18n.language as 'en' | 'da';

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'addressed':
        return 'default';
      case 'acknowledged':
        return 'secondary';
      case 'unaddressed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const updateStatus = async (newStatus: 'acknowledged' | 'addressed') => {
    setUpdating(true);
    try {
      const updateData: any = { status: newStatus };
      if (newStatus === 'addressed') {
        updateData.addressed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('blind_spots')
        .update(updateData)
        .eq('id', blindSpot.id);

      if (error) throw error;

      toast.success(
        newStatus === 'addressed' 
          ? t('blindSpots.markedAsAddressed') || 'Marked as addressed'
          : t('blindSpots.markedAsAcknowledged') || 'Marked as acknowledged'
      );
      onUpdate?.();
    } catch (error) {
      console.error('Error updating blind spot:', error);
      toast.error(t('blindSpots.updateError') || 'Failed to update blind spot');
    } finally {
      setUpdating(false);
    }
  };

  const title = blindSpot.title[lang] || blindSpot.title.en || Object.values(blindSpot.title)[0];
  const description = blindSpot.description?.[lang] || blindSpot.description?.en || '';
  const consequences = blindSpot.consequences?.[lang] || blindSpot.consequences?.en || '';
  const recommendations = blindSpot.recommendations?.[lang] || blindSpot.recommendations?.en || '';
  const evidence = typeof blindSpot.evidence === 'object' ? blindSpot.evidence.text : blindSpot.evidence;

  return (
    <Card className={blindSpot.status === 'unaddressed' ? 'border-destructive/50' : ''}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className={`h-4 w-4 ${
                blindSpot.priority === 'high' ? 'text-destructive' : 
                blindSpot.priority === 'medium' ? 'text-warning' : 
                'text-muted-foreground'
              }`} />
              <CardTitle className="text-lg">{title}</CardTitle>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Badge variant={getPriorityColor(blindSpot.priority)}>
                {t(`blindSpots.priority.${blindSpot.priority}`) || blindSpot.priority}
              </Badge>
              <Badge variant={getStatusColor(blindSpot.status)}>
                {t(`blindSpots.status.${blindSpot.status}`) || blindSpot.status}
              </Badge>
              {blindSpot.confidence && (
                <Badge variant="outline">
                  {Math.round(blindSpot.confidence * 100)}% {t('blindSpots.confidence') || 'confidence'}
                </Badge>
              )}
            </div>
          </div>
        </div>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>

      <CardContent className="space-y-4">
        {evidence && (
          <div>
            <h4 className="text-sm font-semibold mb-1">{t('blindSpots.evidence') || 'Evidence'}</h4>
            <p className="text-sm text-muted-foreground italic">"{evidence}"</p>
          </div>
        )}

        {consequences && (
          <div>
            <h4 className="text-sm font-semibold mb-1">{t('blindSpots.consequences') || 'Potential Consequences'}</h4>
            <p className="text-sm text-muted-foreground">{consequences}</p>
          </div>
        )}

        {recommendations && (
          <div>
            <h4 className="text-sm font-semibold mb-1">{t('blindSpots.recommendations') || 'Recommendations'}</h4>
            <p className="text-sm text-muted-foreground">{recommendations}</p>
          </div>
        )}

        <div className="flex gap-2 pt-2 border-t">
          {blindSpot.status === 'unaddressed' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateStatus('acknowledged')}
              disabled={updating}
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              {t('blindSpots.acknowledge') || 'Acknowledge'}
            </Button>
          )}
          {blindSpot.status !== 'addressed' && (
            <Button
              size="sm"
              variant="default"
              onClick={() => updateStatus('addressed')}
              disabled={updating}
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              {t('blindSpots.markAsAddressed') || 'Mark as Addressed'}
            </Button>
          )}
          {blindSpot.status === 'addressed' && blindSpot.addressed_at && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {t('blindSpots.addressedOn') || 'Addressed on'} {new Date(blindSpot.addressed_at).toLocaleDateString()}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}