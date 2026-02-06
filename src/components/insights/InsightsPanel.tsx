import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Sparkles, AlertTriangle, Lightbulb, RefreshCw, TrendingUp } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Citation {
  document: string;
  quote: string;
}

interface Insight {
  recommendations: Array<{
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    rationale: string;
    citations?: Citation[];
  }>;
  blindSpots: Array<{
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    evidence: string;
    citations?: Citation[];
  }>;
  interventions: Array<{
    title: string;
    description: string;
    type: 'workshop' | 'coaching' | 'process' | 'tool' | 'retreat';
    timeframe: string;
  }>;
  documentMetadata?: {
    count: number;
    analyzed: boolean;
  };
}

interface InsightsPanelProps {
  projectId: string;
  projectName: string;
  morphology: any;
}

export function InsightsPanel({ projectId, projectName, morphology }: InsightsPanelProps) {
  const { t } = useTranslation('common');
  const { profile } = useAuth();
  const [insights, setInsights] = useState<Insight | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(true);

  const userLanguage = profile?.preferred_language || 'en';

  // Fetch existing insights on mount
  const fetchExistingInsights = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('patterns')
        .eq('id', projectId)
        .single();

      if (error) throw error;

      if (data?.patterns && data.patterns.recommendations) {
        setInsights(data.patterns);
      }
    } catch (error) {
      console.error('Error fetching existing insights:', error);
    } finally {
      setLoadingExisting(false);
    }
  };

  // Load existing insights on mount
  useEffect(() => {
    fetchExistingInsights();
  }, [projectId]);

  const generateInsights = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-insights', {
        body: {
          morphology,
          language: userLanguage,
          projectName,
          projectId,
        },
      });

      if (error) {
        if (error.message?.includes('429')) {
          toast.error(t('insights.rateLimit'));
        } else if (error.message?.includes('402')) {
          toast.error(t('insights.noCredits'));
        } else {
          toast.error(t('insights.error'));
        }
        throw error;
      }

      setInsights(data);
      toast.success(t('insights.success') || 'Insights generated and saved successfully!');
    } catch (error) {
      console.error('Error generating insights:', error);
    } finally {
      setLoading(false);
    }
  };

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

  if (loadingExisting) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <RefreshCw className="h-8 w-8 mx-auto mb-4 text-muted-foreground animate-spin" />
          <p className="text-muted-foreground">Loading insights...</p>
        </CardContent>
      </Card>
    );
  }

  if (!insights) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {t('insights.title')}
          </CardTitle>
          <CardDescription>
            AI-powered analysis of your project morphology
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12">
          <Sparkles className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-6">{t('insights.noData')}</p>
          <Button onClick={generateInsights} disabled={loading} className="gap-2">
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                {t('insights.generating')}
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {t('insights.generate')}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          {t('insights.title')}
        </h2>
        <Button onClick={generateInsights} disabled={loading} variant="outline" className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {t('insights.regenerate')}
        </Button>
      </div>

      {insights.documentMetadata && insights.documentMetadata.analyzed && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              {userLanguage === 'da' 
                ? `Indsigter baseret på ${insights.documentMetadata.count} uploadede dokument${insights.documentMetadata.count > 1 ? 'er' : ''}`
                : `Insights based on ${insights.documentMetadata.count} uploaded document${insights.documentMetadata.count > 1 ? 's' : ''}`
              }
            </p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="recommendations" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="recommendations">
            <TrendingUp className="h-4 w-4 mr-2" />
            {t('insights.recommendations.title')}
          </TabsTrigger>
          <TabsTrigger value="interventions">
            <Lightbulb className="h-4 w-4 mr-2" />
            {t('insights.interventions.title')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations" className="space-y-4">
          {insights.recommendations.map((rec, index) => (
            <Card key={index} className="animate-fade-in">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{rec.title}</CardTitle>
                  <Badge variant={getPriorityColor(rec.priority)}>
                    {rec.priority}
                  </Badge>
                </div>
                <CardDescription>{rec.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-muted rounded-lg space-y-3">
                  <p className="text-sm text-muted-foreground">
                    <strong>Rationale:</strong> {rec.rationale}
                  </p>
                  {rec.citations && rec.citations.length > 0 && (
                    <div className="space-y-2 border-t border-border pt-3 mt-3">
                      <p className="text-xs font-semibold text-muted-foreground">
                        {userLanguage === 'da' ? 'Dokumentkilder:' : 'Document Sources:'}
                      </p>
                      {rec.citations.map((citation, idx) => (
                        <div key={idx} className="p-3 bg-muted/50 rounded-md border border-border">
                          <p className="text-xs font-semibold text-primary mb-1">📄 {citation.document}</p>
                          <p className="text-xs text-muted-foreground italic">"{citation.quote}"</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>


        <TabsContent value="interventions" className="space-y-4">
          {insights.interventions.map((intervention, index) => (
            <Card key={index} className="animate-fade-in">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{intervention.title}</CardTitle>
                  <Badge variant="secondary">
                    {t(`insights.interventions.types.${intervention.type}`)}
                  </Badge>
                </div>
                <CardDescription>{intervention.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <strong>{t('insights.interventions.timeframe')}:</strong>
                  <span>{intervention.timeframe}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
