import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Loader2, RefreshCw, TrendingDown, TrendingUp, AlertCircle, BookOpen, MapPin, Lightbulb, BarChart3, FileText, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UJourneyTimelineProps {
  morphology: any;
  projectId: string;
  projectName: string;
}

interface TheoryUAnalysis {
  position: string;
  confidence: number;
  socialField: string;
  depth: string;
  openMHW: {
    mind: number;
    heart: number;
    will: number;
  };
  whyHere?: {
    morphologySynthesis?: string;
    morphologyEvidence?: Array<{
      dimension: string;
      value: string;
      reasoning: string;
    }>;
    documentEvidence?: string[];
    documentStatus?: 'processing' | 'ready' | 'none';
    processingFiles?: string[];
  };
  nextActions?: Array<{
    priority: number;
    action: string;
    rationale: string;
    theoryUPrinciple: string;
    timeframe: string;
    expectedImpact: string;
  }>;
  readinessIndicators?: {
    readyToDescend?: { status?: string; reason?: string; nextSteps?: string[] };
    readyToPresence?: { status?: string; reason?: string; nextSteps?: string[] };
    readyToAscend?: { status?: string; reason?: string; nextSteps?: string[] };
  };
  theoryUResources?: Array<{
    type: string;
    title: string;
    link: string;
    relevance: string;
  }>;
}

// Map social field from AI output to translation keys
const mapSocialFieldKey = (field: string): string => {
  const mapping: Record<string, string> = {
    'politeness': 'downloading',
    'routine': 'downloading',
    'downloading': 'downloading',
    'debating': 'debating',
    'conflict': 'debating',
    'dialogue': 'dialogue',
    'reflective dialogue': 'dialogue',
    'collective creativity': 'collective_creativity',
    'flow': 'collective_creativity',
    'co-creation': 'collective_creativity'
  };
  return mapping[field?.toLowerCase()] || 'downloading';
};

// Default Theory U resources
const getDefaultTheoryUResources = (language: string) => [
  {
    type: 'book',
    title: 'Theory U: Leading from the Future as It Emerges',
    link: 'https://www.presencing.org/resource/books/theory-u',
    relevance: language === 'da' ? 'Den originale Theory U bog af Otto Scharmer' : 'The original Theory U book by Otto Scharmer'
  },
  {
    type: 'tool',
    title: 'Presencing Institute Toolkit',
    link: 'https://www.presencing.org/resource/tools',
    relevance: language === 'da' ? 'Gratis værktøjer til Theory U praksis' : 'Free tools for Theory U practice'
  },
  {
    type: 'video',
    title: 'Theory U MOOC',
    link: 'https://www.edx.org/course/ulab',
    relevance: language === 'da' ? 'Gratis online kursus i Theory U' : 'Free online course in Theory U'
  }
];

export function UJourneyTimeline({ morphology, projectId }: UJourneyTimelineProps) {
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

  // Render U-curve with current position (redesigned to match Theory U reference)
  const renderUCurve = () => {
    const width = 800;
    const height = 500;
    const padding = 60;

    const phases = [
      { key: 'seeing', x: padding + 20, y: height * 0.18, label: t('visualizations.theoryU.phases.seeing'), subtitle: t('visualizations.theoryU.phaseSubtitles.seeing') },
      { key: 'sensing', x: width * 0.25, y: height * 0.42, label: t('visualizations.theoryU.phases.sensing'), subtitle: t('visualizations.theoryU.phaseSubtitles.sensing') },
      { key: 'presencing', x: width * 0.5, y: height * 0.72, label: t('visualizations.theoryU.phases.presencing'), subtitle: t('visualizations.theoryU.phaseSubtitles.presencing') },
      { key: 'crystallizing', x: width * 0.75, y: height * 0.42, label: t('visualizations.theoryU.phases.crystallizing'), subtitle: t('visualizations.theoryU.phaseSubtitles.crystallizing') },
      { key: 'prototyping', x: width - padding - 20, y: height * 0.18, label: t('visualizations.theoryU.phases.prototyping'), subtitle: t('visualizations.theoryU.phaseSubtitles.prototyping') },
    ];

    return (
      <svg width={width} height={height} className="mx-auto" viewBox={`0 0 ${width} ${height}`}>
        <defs>
          {/* Golden gradient for the U curve */}
          <linearGradient id="uGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#DAA520" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#FFD700" stopOpacity="1" />
            <stop offset="100%" stopColor="#DAA520" stopOpacity="0.9" />
          </linearGradient>

          {/* Glow filter for current phase */}
          <filter id="phaseGlow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Third stroke layer for hand-drawn depth */}
        <path
          d={`
            M ${phases[0].x} ${phases[0].y}
            C ${phases[0].x + 85} ${phases[0].y + 95}, ${phases[1].x - 25} ${phases[1].y - 15}, ${phases[1].x} ${phases[1].y}
            S ${phases[2].x - 130} ${phases[2].y - 25}, ${phases[2].x} ${phases[2].y}
            S ${phases[3].x + 25} ${phases[3].y - 15}, ${phases[3].x} ${phases[3].y}
            C ${phases[3].x + 25} ${phases[3].y - 15}, ${phases[4].x - 85} ${phases[4].y + 95}, ${phases[4].x} ${phases[4].y}
          `}
          fill="none"
          stroke="#B8860B"
          strokeWidth="18"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.35"
          transform="translate(-2, 2)"
        />

        {/* Secondary stroke for hand-drawn effect */}
        <path
          d={`
            M ${phases[0].x} ${phases[0].y}
            C ${phases[0].x + 85} ${phases[0].y + 95}, ${phases[1].x - 25} ${phases[1].y - 15}, ${phases[1].x} ${phases[1].y}
            S ${phases[2].x - 130} ${phases[2].y - 25}, ${phases[2].x} ${phases[2].y}
            S ${phases[3].x + 25} ${phases[3].y - 15}, ${phases[3].x} ${phases[3].y}
            C ${phases[3].x + 25} ${phases[3].y - 15}, ${phases[4].x - 85} ${phases[4].y + 95}, ${phases[4].x} ${phases[4].y}
          `}
          fill="none"
          stroke="url(#uGradient)"
          strokeWidth="16"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.65"
          transform="translate(1.5, -1.5)"
        />

        {/* Main U-curve path with smooth bezier and golden color */}
        <path
          d={`
            M ${phases[0].x} ${phases[0].y}
            C ${phases[0].x + 85} ${phases[0].y + 95}, ${phases[1].x - 25} ${phases[1].y - 15}, ${phases[1].x} ${phases[1].y}
            S ${phases[2].x - 130} ${phases[2].y - 25}, ${phases[2].x} ${phases[2].y}
            S ${phases[3].x + 25} ${phases[3].y - 15}, ${phases[3].x} ${phases[3].y}
            C ${phases[3].x + 25} ${phases[3].y - 15}, ${phases[4].x - 85} ${phases[4].y + 95}, ${phases[4].x} ${phases[4].y}
          `}
          fill="none"
          stroke="#DAA520"
          strokeWidth="22"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.9"
        />

        {/* Phase labels with descriptions */}
        {phases.map((phase, index) => {
          const isCenter = index === 2;
          const isCurrentPhase = phase.key === analysis?.position;
          
          return (
            <g key={phase.key}>
              {/* Phase marker circle */}
              <circle
                cx={phase.x}
                cy={phase.y}
                r={isCurrentPhase ? 16 : 10}
                fill={isCurrentPhase ? 'hsl(var(--primary))' : 'hsl(var(--background))'}
                stroke={isCurrentPhase ? 'hsl(var(--primary))' : 'hsl(var(--border))'}
                strokeWidth={isCurrentPhase ? 4 : 2}
                className="transition-all"
              />
              
              {/* Current position pulse animation */}
              {isCurrentPhase && (
                <>
                  <circle
                    cx={phase.x}
                    cy={phase.y}
                    r="24"
                    fill="hsl(var(--primary))"
                    opacity="0.2"
                    className="animate-pulse"
                  />
                  <circle
                    cx={phase.x}
                    cy={phase.y}
                    r="8"
                    fill="hsl(var(--background))"
                  />
                </>
              )}

              {/* Phase label */}
              <text
                x={phase.x}
                y={isCenter ? phase.y + 50 : (index < 2 ? phase.y - 25 : phase.y - 25)}
                textAnchor="middle"
                className={`font-bold fill-foreground ${isCurrentPhase ? 'text-lg' : 'text-sm'}`}
                style={{ fontSize: isCurrentPhase ? '18px' : '14px' }}
              >
                {phase.label}
              </text>

              {/* Phase subtitle */}
              <text
                x={phase.x}
                y={isCenter ? phase.y + 70 : (index < 2 ? phase.y - 10 : phase.y - 10)}
                textAnchor="middle"
                className="text-xs fill-muted-foreground"
                style={{ fontSize: '11px', maxWidth: '120px' }}
              >
                {phase.subtitle}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  const getReadinessColor = (status?: string) => {
    if (!status) return 'text-muted-foreground';
    switch (status.toLowerCase()) {
      case 'ready':
      case 'yes':
        return 'text-green-600 dark:text-green-400';
      case 'partially':
      case 'maybe':
        return 'text-amber-600 dark:text-amber-400';
      case 'not ready':
      case 'no':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-muted-foreground';
    }
  };

  const getReadinessIcon = (status?: string) => {
    if (!status) return '⚪';
    switch (status.toLowerCase()) {
      case 'ready':
      case 'yes':
        return '🟢';
      case 'partially':
      case 'maybe':
        return '🟡';
      case 'not ready':
      case 'no':
        return '🔴';
      default:
        return '⚪';
    }
  };

  const getPriorityBadge = (priority: number) => {
    if (priority === 1) return <Badge variant="destructive" className="text-xs">{t('visualizations.theoryU.priority.high')}</Badge>;
    if (priority === 2) return <Badge variant="secondary" className="text-xs">{t('visualizations.theoryU.priority.medium')}</Badge>;
    return <Badge variant="outline" className="text-xs">{t('visualizations.theoryU.priority.low')}</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('visualizations.theoryU.title')}</CardTitle>
          <CardDescription>{t('visualizations.theoryU.description')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
          <p className="text-sm text-muted-foreground">{t('visualizations.theoryU.analyzing')}</p>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('visualizations.theoryU.title')}</CardTitle>
          <CardDescription>{t('visualizations.theoryU.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-4">{t('visualizations.theoryU.errorDescription')}</p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              {t('visualizations.theoryU.refresh')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const mappedSocialField = mapSocialFieldKey(analysis.socialField);
  const resources = analysis.theoryUResources && analysis.theoryUResources.length > 0 
    ? analysis.theoryUResources 
    : getDefaultTheoryUResources(i18n.language);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-2">{t('visualizations.theoryU.title')}</h2>
          <p className="text-muted-foreground">{t('visualizations.theoryU.description')}</p>
        </div>
        <Button onClick={handleRefresh} variant="outline" disabled={refreshing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {t('visualizations.theoryU.refresh')}
        </Button>
      </div>

      <div className="space-y-6">
        {/* Where Are You Section - Redesigned with larger U-curve */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <MapPin className="w-6 h-6 text-primary" />
              {t('visualizations.theoryU.whereAreYou')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            {/* Large U-Curve Visualization */}
            <div className="bg-gradient-to-br from-background via-primary/5 to-accent/5 rounded-2xl p-8 border border-border/50 shadow-lg">
              {renderUCurve()}
            </div>

            {/* Current Phase Info Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2 p-4 rounded-lg bg-muted/30 border border-border/50">
                <p className="text-sm font-medium text-muted-foreground">{t('visualizations.theoryU.phase')}</p>
                <div className="space-y-1">
                  <span className="text-2xl font-bold block">{t(`visualizations.theoryU.phases.${analysis.position}`)}</span>
                  <Badge variant="secondary" className="text-xs">
                    {analysis.confidence}% {t('visualizations.theoryU.confident')}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2 p-4 rounded-lg bg-muted/30 border border-border/50">
                <p className="text-sm font-medium text-muted-foreground">{t('visualizations.theoryU.socialField')}</p>
                <p className="text-xl font-semibold">
                  {t(`visualizations.theoryU.socialFields.${mappedSocialField}`)}
                </p>
              </div>

              <div className="space-y-2 p-4 rounded-lg bg-muted/30 border border-border/50">
                <p className="text-sm font-medium text-muted-foreground">{t('visualizations.theoryU.depth')}</p>
                <p className="text-xl font-semibold capitalize">{analysis.depth}</p>
              </div>

              <div className="space-y-2 p-4 rounded-lg bg-muted/30 border border-border/50">
                <p className="text-sm font-medium text-muted-foreground">{t('visualizations.theoryU.openMHW')}</p>
                <div className="flex gap-4 text-base font-semibold">
                  <span><strong className="text-primary">M:</strong> {analysis.openMHW?.mind || 0}</span>
                  <span><strong className="text-primary">H:</strong> {analysis.openMHW?.heart || 0}</span>
                  <span><strong className="text-primary">W:</strong> {analysis.openMHW?.will || 0}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Why This Phase Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-primary" />
              {t('visualizations.theoryU.whyThisPhase')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Morphology Synthesis */}
            {analysis.whyHere?.morphologySynthesis && (
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm leading-relaxed">{analysis.whyHere.morphologySynthesis}</p>
              </div>
            )}

            {/* Morphology Evidence */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                <h3 className="font-semibold">{t('visualizations.theoryU.morphologyEvidence')}</h3>
              </div>
              <div className="grid gap-3">
                {analysis.whyHere?.morphologyEvidence?.map((evidence: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-3 p-4 rounded-lg bg-gradient-to-r from-muted/50 to-muted/30 border border-border/50">
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="w-1 h-12 bg-primary rounded-full" />
                      <Badge variant="secondary" className="text-xs font-medium">
                        {evidence.dimension}
                      </Badge>
                    </div>
                    <div className="space-y-1 flex-1">
                      <p className="text-sm font-semibold text-foreground">{evidence.value}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{evidence.reasoning}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Document Evidence */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <h3 className="font-semibold">{t('visualizations.theoryU.documentEvidence')}</h3>
              </div>
              
              {/* Check if documents are being processed */}
              {analysis.whyHere?.documentStatus === 'processing' ? (
                <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                  <div className="flex items-start gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-amber-600 border-t-transparent" />
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                        {t('visualizations.theoryU.documentsProcessing')}
                      </p>
                      {analysis.whyHere?.processingFiles && (
                        <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
                          {analysis.whyHere.processingFiles.map((filename: string, idx: number) => (
                            <li key={idx}>📄 {filename}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              ) : analysis.whyHere?.documentEvidence && analysis.whyHere.documentEvidence.length > 0 ? (
                <div className="space-y-3">
                  {analysis.whyHere.documentEvidence.slice(0, 3).map((quote: string, idx: number) => (
                    <div key={idx} className="p-4 rounded-lg bg-accent/10 border-l-4 border-accent shadow-sm">
                      <p className="text-sm italic leading-relaxed text-foreground">"{quote}"</p>
                    </div>
                  ))}
                  {analysis.whyHere.documentEvidence.length > 3 && (
                    <p className="text-xs text-muted-foreground text-center">
                      {t('visualizations.theoryU.moreEvidence', { count: analysis.whyHere.documentEvidence.length - 3 })}
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-muted/30 border border-dashed border-border">
                  <p className="text-sm text-muted-foreground italic text-center">
                    {t('visualizations.theoryU.noDocuments')}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Next 3 Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              {t('visualizations.theoryU.nextActions')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analysis.nextActions?.slice(0, 3).map((action: any, idx: number) => (
                <div key={idx} className="p-4 rounded-lg border border-border bg-gradient-to-br from-background to-muted/20 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm shrink-0">
                      {action.priority}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-base leading-tight">{action.action}</h4>
                        {getPriorityBadge(action.priority)}
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{action.rationale}</p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <Badge variant="outline" className="gap-1">
                          <span className="font-medium">{t('visualizations.theoryU.principle')}:</span> {action.theoryUPrinciple}
                        </Badge>
                        <Badge variant="outline" className="gap-1">
                          <span className="font-medium">{t('visualizations.theoryU.timeframe')}:</span> {action.timeframe}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Readiness Indicators - Interactive */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-primary" />
              {t('visualizations.theoryU.readinessIndicators')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="space-y-3">
              {/* Ready to Descend */}
              <AccordionItem value="descend" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3 text-left">
                    <span className="text-2xl">{getReadinessIcon(analysis.readinessIndicators?.readyToDescend?.status)}</span>
                    <div>
                      <p className={`font-semibold ${getReadinessColor(analysis.readinessIndicators?.readyToDescend?.status)}`}>
                        {t('visualizations.theoryU.readyToDescend')}
                      </p>
                      <p className="text-xs text-muted-foreground">{analysis.readinessIndicators?.readyToDescend?.status}</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 space-y-3">
                  <div>
                    <p className="text-sm font-medium mb-1">{t('visualizations.theoryU.readinessWhy')}</p>
                    <p className="text-sm text-muted-foreground">{analysis.readinessIndicators?.readyToDescend?.reason}</p>
                  </div>
                  {analysis.readinessIndicators?.readyToDescend?.nextSteps && (
                    <div>
                      <p className="text-sm font-medium mb-2">{t('visualizations.theoryU.readinessNextSteps')}</p>
                      <ul className="space-y-1">
                        {analysis.readinessIndicators.readyToDescend.nextSteps.map((step: string, idx: number) => (
                          <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-primary mt-0.5">•</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* Ready to Presence */}
              <AccordionItem value="presence" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3 text-left">
                    <span className="text-2xl">{getReadinessIcon(analysis.readinessIndicators?.readyToPresence?.status)}</span>
                    <div>
                      <p className={`font-semibold ${getReadinessColor(analysis.readinessIndicators?.readyToPresence?.status)}`}>
                        {t('visualizations.theoryU.readyToPresence')}
                      </p>
                      <p className="text-xs text-muted-foreground">{analysis.readinessIndicators?.readyToPresence?.status}</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 space-y-3">
                  <div>
                    <p className="text-sm font-medium mb-1">{t('visualizations.theoryU.readinessWhy')}</p>
                    <p className="text-sm text-muted-foreground">{analysis.readinessIndicators?.readyToPresence?.reason}</p>
                  </div>
                  {analysis.readinessIndicators?.readyToPresence?.nextSteps && (
                    <div>
                      <p className="text-sm font-medium mb-2">{t('visualizations.theoryU.readinessNextSteps')}</p>
                      <ul className="space-y-1">
                        {analysis.readinessIndicators.readyToPresence.nextSteps.map((step: string, idx: number) => (
                          <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-primary mt-0.5">•</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* Ready to Ascend */}
              <AccordionItem value="ascend" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3 text-left">
                    <span className="text-2xl">{getReadinessIcon(analysis.readinessIndicators?.readyToAscend?.status)}</span>
                    <div>
                      <p className={`font-semibold ${getReadinessColor(analysis.readinessIndicators?.readyToAscend?.status)}`}>
                        {t('visualizations.theoryU.readyToAscend')}
                      </p>
                      <p className="text-xs text-muted-foreground">{analysis.readinessIndicators?.readyToAscend?.status}</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 space-y-3">
                  <div>
                    <p className="text-sm font-medium mb-1">{t('visualizations.theoryU.readinessWhy')}</p>
                    <p className="text-sm text-muted-foreground">{analysis.readinessIndicators?.readyToAscend?.reason}</p>
                  </div>
                  {analysis.readinessIndicators?.readyToAscend?.nextSteps && (
                    <div>
                      <p className="text-sm font-medium mb-2">{t('visualizations.theoryU.readinessNextSteps')}</p>
                      <ul className="space-y-1">
                        {analysis.readinessIndicators.readyToAscend.nextSteps.map((step: string, idx: number) => (
                          <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-primary mt-0.5">•</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Theory U Resources */}
        {resources && resources.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                {t('visualizations.theoryU.resources')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {resources.map((resource: any, idx: number) => (
                  <a
                    key={idx}
                    href={resource.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-4 p-4 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary shrink-0">
                      {resource.type === 'book' && '📚'}
                      {resource.type === 'tool' && '🛠️'}
                      {resource.type === 'video' && '🎥'}
                      {resource.type === 'article' && '📄'}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-sm group-hover:text-primary transition-colors">{resource.title}</h4>
                        <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                      </div>
                      <p className="text-xs text-muted-foreground">{resource.relevance}</p>
                    </div>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
