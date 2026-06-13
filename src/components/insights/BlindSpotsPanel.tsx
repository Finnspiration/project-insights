import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { BlindSpotCard } from './BlindSpotCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/empty/EmptyState';


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

interface BlindSpotsPanelProps {
  projectId: string;
}

export function BlindSpotsPanel({ projectId }: BlindSpotsPanelProps) {
  const { t } = useTranslation('common');
  const [blindSpots, setBlindSpots] = useState<BlindSpot[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBlindSpots = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('blind_spots')
        .select('*')
        .eq('project_id', projectId)
        .order('priority', { ascending: false })
        .order('detected_at', { ascending: false });

      if (error) throw error;
      setBlindSpots(data || []);
    } catch (error) {
      console.error('Error fetching blind spots:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlindSpots();
  }, [projectId]);

  const unaddressedSpots = blindSpots.filter(bs => bs.status === 'unaddressed');
  const acknowledgedSpots = blindSpots.filter(bs => bs.status === 'acknowledged');
  const addressedSpots = blindSpots.filter(bs => bs.status === 'addressed');

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          {t('blindSpots.loading') || 'Loading blind spots...'}
        </CardContent>
      </Card>
    );
  }

  if (blindSpots.length === 0) {
    return (
      <Card>
        <CardContent className="p-0">
          <EmptyState
            icon={AlertTriangle}
            eyebrow={t('blindSpots.title') || 'Blind Spots'}
            title={t('blindSpots.empty.title') || 'No blind spots yet'}
            description={
              t('blindSpots.empty.description') ||
              'Upload documents or generate AI insights to surface what your team may be missing.'
            }
            compact
          />
        </CardContent>
      </Card>
    );
  }


  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
          <AlertTriangle className="h-6 w-6 text-primary" />
          {t('blindSpots.title') || 'Blind Spots'}
        </h2>
        <p className="text-muted-foreground">
          {t('blindSpots.description') || 'Potential blind spots and overlooked dimensions detected in your project'}
        </p>
      </div>

      <Tabs defaultValue="unaddressed" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="unaddressed">
            {t('blindSpots.unaddressed') || 'Unaddressed'} ({unaddressedSpots.length})
          </TabsTrigger>
          <TabsTrigger value="acknowledged">
            {t('blindSpots.acknowledged') || 'Acknowledged'} ({acknowledgedSpots.length})
          </TabsTrigger>
          <TabsTrigger value="addressed">
            {t('blindSpots.addressed') || 'Addressed'} ({addressedSpots.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="unaddressed" className="space-y-4 mt-4">
          {unaddressedSpots.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                {t('blindSpots.noUnaddressed') || 'No unaddressed blind spots'}
              </CardContent>
            </Card>
          ) : (
            unaddressedSpots.map(bs => (
              <BlindSpotCard key={bs.id} blindSpot={bs} onUpdate={fetchBlindSpots} />
            ))
          )}
        </TabsContent>

        <TabsContent value="acknowledged" className="space-y-4 mt-4">
          {acknowledgedSpots.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                {t('blindSpots.noAcknowledged') || 'No acknowledged blind spots'}
              </CardContent>
            </Card>
          ) : (
            acknowledgedSpots.map(bs => (
              <BlindSpotCard key={bs.id} blindSpot={bs} onUpdate={fetchBlindSpots} />
            ))
          )}
        </TabsContent>

        <TabsContent value="addressed" className="space-y-4 mt-4">
          {addressedSpots.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                {t('blindSpots.noAddressed') || 'No addressed blind spots'}
              </CardContent>
            </Card>
          ) : (
            addressedSpots.map(bs => (
              <BlindSpotCard key={bs.id} blindSpot={bs} onUpdate={fetchBlindSpots} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}