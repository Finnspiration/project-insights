import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Loader2, RefreshCw, TrendingDown, TrendingUp, AlertCircle, BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UJourneyTimelineProps {
  morphology: any;
  projectId: string;
  projectName: string;
}

interface TheoryUAnalysis {
  currentPhase: {
    phase: string;
    confidence: number;
    socialField: string;
    depthLevel: string;
  };
  diagnostics: {
    openMind: { score: number; evidence: string[] };
    openHeart: { score: number; evidence: string[] };
    openWill: { score: number; evidence: string[] };
  };
  whyHere: {
    morphologyEvidence: Array<{
      dimension: string;
      value: string;
      reasoning: string;
    }>;
    documentEvidence: Array<{
      quote: string;
      analysis: string;
    }>;
  };
  nextActions: Array<{
    priority: number;
    action: string;
    rationale: string;
    theoryUPrinciple: string;
    timeframe: string;
    expectedImpact: string;
  }>;
  readinessIndicators: {
    readyToDescend: { status: string; reason: string };
    readyToPresence: { status: string; reason: string };
    readyToAscend: { status: string; reason: string };
  };
  theoryUResources?: Array<{
    type: string;
    title: string;
    link: string;
    relevance: string;
  }>;
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

export function UJourneyTimeline({ morphology, projectId, projectName }: UJourneyTimelineProps) {
  const { t, i18n } = useTranslation('common');
  const { toast } = useToast();
  const [analysis, setAnalysis] = useState<TheoryUAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalysis = async (forceRefresh = false) => {
    try {
      setLoading(true);

      // Check cache first
      if (!forceRefresh) {
        const { data: project } = await supabase
          .from('projects')
          .select('theory_u_analysis, theory_u_analysis_updated_at')
          .eq('id', projectId)
          .single();

        if (project?.theory_u_analysis) {
          setAnalysis(project.theory_u_analysis as TheoryUAnalysis);
          setLoading(false);
          return;
        }
      }

      // Call edge function
      const { data, error } = await supabase.functions.invoke('analyze-theory-u-position', {
        body: {
          projectId,
          morphology,
          language: i18n.language
        }
      });

      if (error) throw error;
      setAnalysis(data as TheoryUAnalysis);
    } catch (error) {
      console.error('Error fetching Theory U analysis:', error);
      toast({
        title: t('visualizations.theoryU.errorTitle'),
        description: t('visualizations.theoryU.errorDescription'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, [projectId]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalysis(true);
  };

  const getCurrentPhaseData = () => {
    if (!analysis) return U_PHASES[2]; // default to sensing
    const phaseKey = analysis.currentPhase.phase.toLowerCase();
    return U_PHASES.find(p => p.key === phaseKey) || U_PHASES[2];
  };

  const getPriorityColor = (priority: number) => {
    if (priority === 1) return 'destructive';
    if (priority === 2) return 'default';
    return 'secondary';
  };

  const getPriorityLabel = (priority: number) => {
    if (priority === 1) return t('visualizations.theoryU.priority.high');
    if (priority === 2) return t('visualizations.theoryU.priority.medium');
    return t('visualizations.theoryU.priority.low');
  };

  const getReadinessColor = (status: string) => {
    if (status === 'green') return 'text-green-600 dark:text-green-400';
    if (status === 'yellow') return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getReadinessIcon = (status: string) => {
    if (status === 'green') return '🟢';
    if (status === 'yellow') return '🟡';
    return '🔴';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">{t('visualizations.theoryU.analyzing')}</span>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">{t('visualizations.theoryU.noAnalysis')}</p>
          <Button onClick={() => fetchAnalysis(true)} className="mt-4">
            {t('visualizations.theoryU.runAnalysis')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const currentPhase = getCurrentPhaseData();
  const isDescending = currentPhase.position <= 3;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isDescending ? (
              <TrendingDown className="h-5 w-5 text-primary" />
            ) : (
              <TrendingUp className="h-5 w-5 text-primary" />
            )}
            <CardTitle>{t('visualizations.theoryU.title')}</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {t('visualizations.theoryU.refresh')}
          </Button>
        </div>
        <CardDescription>{t('visualizations.theoryU.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* WHERE YOU ARE Section */}
        <div className="grid md:grid-cols-[200px_1fr] gap-6">
          {/* Compact U-Curve */}
          <div className="relative h-40 bg-gradient-to-b from-background to-muted rounded-lg p-4">
            <svg className="w-full h-full" viewBox="0 0 700 150" preserveAspectRatio="xMidYMid meet">
              <defs>
                <linearGradient id="uGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
                  <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
                </linearGradient>
              </defs>
              <path
                d="M 50 20 Q 150 60, 200 105 Q 250 120, 350 120 Q 450 120, 500 105 Q 550 60, 650 20"
                fill="none"
                stroke="url(#uGradient)"
                strokeWidth="3"
              />
              {U_PHASES.map((phase, index) => {
                const x = 50 + (index * 100);
                const y = 20 + (phase.depth * 1.05);
                const isCurrent = phase.key === currentPhase.key;

                return (
                  <g key={phase.key}>
                    <circle
                      cx={x}
                      cy={y}
                      r={isCurrent ? 8 : 4}
                      fill={isCurrent ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'}
                      className={isCurrent ? 'animate-pulse' : ''}
                    />
                    {isCurrent && (
                      <circle
                        cx={x}
                        cy={y}
                        r={12}
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

          {/* Where You Are Details */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">{t('visualizations.theoryU.whereYouAre')}</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">{t('visualizations.theoryU.phase')}</p>
                <p className="font-medium">{t(`visualizations.uJourney.phases.${currentPhase.key}`)}</p>
                <Badge variant="secondary" className="mt-1 text-xs">
                  {Math.round(analysis.currentPhase.confidence * 100)}% {t('visualizations.theoryU.confidence')}
                </Badge>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">{t('visualizations.theoryU.socialField')}</p>
                <p className="font-medium">{t(`visualizations.theoryU.socialFields.${analysis.currentPhase.socialField}`)}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">{t('visualizations.theoryU.depth')}</p>
                <p className="font-medium capitalize">{analysis.currentPhase.depthLevel}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">{t('visualizations.theoryU.diagnostics.title')}</p>
                <div className="flex gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">M: {analysis.diagnostics.openMind.score}</Badge>
                  <Badge variant="outline" className="text-xs">H: {analysis.diagnostics.openHeart.score}</Badge>
                  <Badge variant="outline" className="text-xs">W: {analysis.diagnostics.openWill.score}</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* WHY THIS PHASE Section */}
        <div>
          <h3 className="text-lg font-semibold mb-3">{t('visualizations.theoryU.whyThisPhase')}</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {/* Morphology Evidence */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <span className="text-primary">📊</span>
                {t('visualizations.theoryU.morphologyEvidence')}
              </h4>
              <div className="space-y-2">
                {analysis.whyHere.morphologyEvidence.map((evidence, idx) => (
                  <div key={idx} className="text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-xs capitalize">
                        {evidence.dimension}
                      </Badge>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-medium capitalize">{evidence.value}</span>
                    </div>
                    <p className="text-muted-foreground text-xs">{evidence.reasoning}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Document Evidence */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <span className="text-primary">📄</span>
                {t('visualizations.theoryU.documentEvidence')}
              </h4>
              {analysis.whyHere.documentEvidence.length > 0 ? (
                <Accordion type="single" collapsible>
                  {analysis.whyHere.documentEvidence.slice(0, 3).map((evidence, idx) => (
                    <AccordionItem key={idx} value={`doc-${idx}`}>
                      <AccordionTrigger className="text-sm hover:no-underline">
                        <span className="text-left line-clamp-1">"{evidence.quote.substring(0, 50)}..."</span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 text-sm">
                          <p className="italic text-muted-foreground">"{evidence.quote}"</p>
                          <p className="text-xs">{evidence.analysis}</p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  {t('visualizations.theoryU.noDocuments')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* YOUR NEXT 3 ACTIONS Section */}
        <div>
          <h3 className="text-lg font-semibold mb-3">{t('visualizations.theoryU.yourNextActions')}</h3>
          <div className="space-y-3">
            {analysis.nextActions.map((action, idx) => (
              <div
                key={idx}
                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                    {action.priority}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={getPriorityColor(action.priority)}>
                        {getPriorityLabel(action.priority)}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {action.theoryUPrinciple}
                      </Badge>
                    </div>
                    <p className="font-medium mb-1">{action.action}</p>
                    <p className="text-sm text-muted-foreground italic mb-2">{action.rationale}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>⏱️ {action.timeframe}</span>
                      <span>📈 {t(`visualizations.theoryU.impact.${action.expectedImpact}`)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* READINESS INDICATORS Section */}
        <div>
          <h3 className="text-lg font-semibold mb-3">{t('visualizations.theoryU.readinessIndicators')}</h3>
          <div className="grid md:grid-cols-3 gap-3">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium mb-2 flex items-center gap-2">
                <span>{getReadinessIcon(analysis.readinessIndicators.readyToDescend.status)}</span>
                {t('visualizations.theoryU.readyToDescend')}
              </p>
              <p className={`text-xs ${getReadinessColor(analysis.readinessIndicators.readyToDescend.status)}`}>
                {analysis.readinessIndicators.readyToDescend.reason}
              </p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium mb-2 flex items-center gap-2">
                <span>{getReadinessIcon(analysis.readinessIndicators.readyToPresence.status)}</span>
                {t('visualizations.theoryU.readyToPresence')}
              </p>
              <p className={`text-xs ${getReadinessColor(analysis.readinessIndicators.readyToPresence.status)}`}>
                {analysis.readinessIndicators.readyToPresence.reason}
              </p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium mb-2 flex items-center gap-2">
                <span>{getReadinessIcon(analysis.readinessIndicators.readyToAscend.status)}</span>
                {t('visualizations.theoryU.readyToAscend')}
              </p>
              <p className={`text-xs ${getReadinessColor(analysis.readinessIndicators.readyToAscend.status)}`}>
                {analysis.readinessIndicators.readyToAscend.reason}
              </p>
            </div>
          </div>
        </div>

        {/* THEORY U RESOURCES (Optional) */}
        {analysis.theoryUResources && analysis.theoryUResources.length > 0 && (
          <Accordion type="single" collapsible>
            <AccordionItem value="resources">
              <AccordionTrigger className="text-sm">
                <span className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  {t('visualizations.theoryU.resources')}
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {analysis.theoryUResources.map((resource, idx) => (
                    <a
                      key={idx}
                      href={resource.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">{resource.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{resource.relevance}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">{resource.type}</Badge>
                      </div>
                    </a>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}