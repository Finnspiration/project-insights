import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, RefreshCw, Sparkles, TrendingUp, TrendingDown, AlertCircle, CheckCircle2, XCircle, Clock, ExternalLink, BookOpen, Video, GraduationCap, MapPin, Lightbulb, BarChart3, FileText, Heart, Star, X, Download, ChevronDown, ChevronUp, Upload, Info, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import goldenUBackground from '@/assets/golden-u-background.jpg';
import { DNAEvidenceVisualization } from './theory-u/DNAEvidenceVisualization';

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
    documentEvidence?: Array<{
      text: string;
      relevance: number;
      source?: string;
    }>;
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
    readyToDescend?: {
      status?: string;
      reason?: string;
      nextSteps?: string[];
    };
    readyToPresence?: {
      status?: string;
      reason?: string;
      nextSteps?: string[];
    };
    readyToAscend?: {
      status?: string;
      reason?: string;
      nextSteps?: string[];
    };
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
const getDefaultTheoryUResources = (language: string) => [{
  type: 'book',
  title: 'Theory U: Leading from the Future as It Emerges',
  link: 'https://www.presencing.org/resource/books/theory-u',
  relevance: language === 'da' ? 'Den originale Theory U bog af Otto Scharmer' : 'The original Theory U book by Otto Scharmer'
}, {
  type: 'tool',
  title: 'Presencing Institute Toolkit',
  link: 'https://www.presencing.org/resource/tools',
  relevance: language === 'da' ? 'Gratis værktøjer til Theory U praksis' : 'Free tools for Theory U practice'
}, {
  type: 'video',
  title: 'Theory U MOOC',
  link: 'https://www.edx.org/course/ulab',
  relevance: language === 'da' ? 'Gratis online kursus i Theory U' : 'Free online course in Theory U'
}];

export function UJourneyTimeline({ morphology, projectId, projectName }: UJourneyTimelineProps) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const language = i18n.language as 'en' | 'da';
  const [analysis, setAnalysis] = useState<TheoryUAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAllQuotes, setShowAllQuotes] = useState(false);
  const [favoriteQuotes, setFavoriteQuotes] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isWhyHereExpanded, setIsWhyHereExpanded] = useState(false);
  const [isTechnicalExpanded, setIsTechnicalExpanded] = useState(false);

  // Helper function to get confidence percentage
  const getConfidencePercent = () => {
    if (!analysis?.confidence) return 0;
    return Math.round(analysis.confidence * 100);
  };

  // Check if data quality is low
  const isLowConfidence = () => {
    return getConfidencePercent() < 20;
  };

  // Helper function to transform Theory U data structure
  const transformTheoryUData = (data: any): TheoryUAnalysis | null => {
    if (!data) return null;

    // Map 7-phase AI system to 5-phase UI system
    const mapPhaseToUI = (phase: string): string => {
      const phaseMap: Record<string, string> = {
        'downloading': 'seeing',
        'seeing': 'seeing',
        'sensing': 'sensing',
        'presencing': 'presencing',
        'crystallizing': 'crystallizing',
        'prototyping': 'prototyping',
        'performing': 'prototyping'
      };
      return phaseMap[phase.toLowerCase()] || 'seeing';
    };

    const rawPhase = data.currentPhase || data.whyHere?.morphologyScoring?.phase || data.position || 'downloading';

    // Transform documentEvidence
    let documentEvidence = data.whyHere?.documentEvidence;
    if (documentEvidence && Array.isArray(documentEvidence)) {
      if (documentEvidence.length > 0 && typeof documentEvidence[0] === 'string') {
        documentEvidence = documentEvidence.map((text: string) => ({
          text,
          relevance: 50,
          source: undefined
        }));
      }
    }

    return {
      position: mapPhaseToUI(rawPhase),
      confidence: data.confidence || data.whyHere?.morphologyScoring?.confidence || 0,
      socialField: data.currentPhase?.socialField || data.socialField || 'downloading',
      depth: data.currentPhase?.depthLevel || data.depth || 'surface',
      openMHW: {
        mind: data.diagnostics?.openMind?.score || data.openMHW?.mind || 0,
        heart: data.diagnostics?.openHeart?.score || data.openMHW?.heart || 0,
        will: data.diagnostics?.openWill?.score || data.openMHW?.will || 0
      },
      whyHere: {
        morphologySynthesis: data.whyHere?.synthesis || data.whyHere?.morphologySynthesis,
        morphologyEvidence: data.whyHere?.morphologyEvidence || [],
        documentEvidence: documentEvidence || [],
        documentStatus: data.whyHere?.documentStatus || 'none',
        processingFiles: data.whyHere?.processingFiles || []
      },
      nextActions: data.nextSteps || data.nextActions || [],
      readinessIndicators: data.readinessIndicators || {},
      theoryUResources: data.theoryUResources || getDefaultTheoryUResources(language)
    };
  };

  useEffect(() => {
    const loadUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data: favorites } = await supabase
          .from('favorite_quotes')
          .select('quote_text')
          .eq('user_id', user.id)
          .eq('project_id', projectId);
        if (favorites) {
          setFavoriteQuotes(favorites.map(f => f.quote_text));
        }
      }
    };
    loadUserId();
  }, [projectId]);

  useEffect(() => {
    fetchAnalysis();
  }, [projectId, morphology]);

  const handleToggleFavorite = async (quoteText: string) => {
    if (!userId) return;

    const isFavorite = favoriteQuotes.includes(quoteText);

    if (isFavorite) {
      const { error } = await supabase
        .from('favorite_quotes')
        .delete()
        .eq('user_id', userId)
        .eq('project_id', projectId)
        .eq('quote_text', quoteText);

      if (!error) {
        setFavoriteQuotes(prev => prev.filter(q => q !== quoteText));
        toast({
          title: t('theoryU.removedFromFavorites'),
          description: t('theoryU.removedFromFavoritesDesc')
        });
      }
    } else {
      const { error } = await supabase
        .from('favorite_quotes')
        .insert({
          user_id: userId,
          project_id: projectId,
          quote_text: quoteText,
          relevance_score: 0,
          theory_u_phase: analysis?.position || 'unknown'
        });

      if (!error) {
        setFavoriteQuotes(prev => [...prev, quoteText]);
        toast({
          title: t('theoryU.addedToFavorites'),
          description: t('theoryU.addedToFavoritesDesc')
        });
      } else {
        toast({
          title: "Error",
          description: t('theoryU.favoriteFailed'),
          variant: 'destructive'
        });
      }
    }
  };

  const handleRejectQuote = async (quoteIndex: number) => {
    if (!analysis?.whyHere?.documentEvidence) return;

    const updatedEvidence = [...analysis.whyHere.documentEvidence];
    updatedEvidence.splice(quoteIndex, 1);

    const { error } = await supabase
      .from('projects')
      .update({
        theory_u_analysis: {
          ...analysis,
          whyHere: {
            ...analysis.whyHere,
            documentEvidence: updatedEvidence
          }
        }
      })
      .eq('id', projectId);

    if (!error) {
      setAnalysis({
        ...analysis,
        whyHere: {
          ...analysis.whyHere,
          documentEvidence: updatedEvidence
        }
      });
      toast({
        title: t('theoryU.quoteRejected'),
        description: t('theoryU.quoteRejectedDesc')
      });
    }
  };

  const handleRegenerateQuotes = async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-theory-u-position', {
        body: { 
          projectId, 
          morphology,
          language,
          regenerateQuotes: true
        }
      });

      if (error) throw error;

      if (data) {
        const transformed = transformTheoryUData(data);
        if (transformed) {
          setAnalysis(transformed);
          toast({
            title: t('theoryU.quotesRegenerated'),
            description: t('theoryU.quotesRegeneratedDesc')
          });
        }
      }
    } catch (error) {
      console.error('Error regenerating quotes:', error);
      toast({
        title: "Error",
        description: t('theoryU.regenerateFailed'),
        variant: 'destructive'
      });
    } finally {
      setRefreshing(false);
    }
  };

  const fetchAnalysis = async () => {
    try {
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('theory_u_analysis, theory_u_analysis_updated_at')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;

      const cacheAge = project.theory_u_analysis_updated_at 
        ? (Date.now() - new Date(project.theory_u_analysis_updated_at).getTime()) / 1000 / 60 
        : Infinity;

      if (project.theory_u_analysis && cacheAge < 60) {
        const transformed = transformTheoryUData(project.theory_u_analysis);
        setAnalysis(transformed);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('analyze-theory-u-position', {
        body: { 
          projectId, 
          morphology,
          language 
        }
      });

      if (error) throw error;

      if (data) {
        const transformed = transformTheoryUData(data);
        setAnalysis(transformed);
      }
    } catch (error) {
      console.error('Error fetching Theory U analysis:', error);
      toast({
        title: t('theoryU.errorTitle'),
        description: t('theoryU.errorDescription'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalysis();
    setRefreshing(false);
  };

  // Render U-curve visualization
  const renderUCurve = () => {
    const phases = ['seeing', 'sensing', 'presencing', 'crystallizing', 'prototyping'];
    const currentIndex = phases.indexOf(analysis?.position || 'seeing');

    const points = [
      { x: 10, y: 20 },
      { x: 25, y: 50 },
      { x: 50, y: 80 },
      { x: 75, y: 50 },
      { x: 90, y: 20 }
    ];

    const pathData = `M ${points.map((p, i) => `${p.x},${p.y}`).join(' L ')}`;

    return (
      <svg viewBox="0 0 100 100" className="w-full h-48">
        <defs>
          <linearGradient id="uGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        <path
          d={pathData}
          fill="none"
          stroke="url(#uGradient)"
          strokeWidth="0.5"
          className="opacity-50"
        />

        {points.map((point, index) => (
          <g key={index}>
            <circle
              cx={point.x}
              cy={point.y}
              r={index === currentIndex ? 3 : 2}
              fill={index === currentIndex ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'}
              className={index === currentIndex ? 'animate-pulse' : ''}
            />
            <text
              x={point.x}
              y={point.y - 8}
              textAnchor="middle"
              className={`text-[4px] ${index === currentIndex ? 'font-bold fill-primary' : 'fill-muted-foreground'}`}
            >
              {t(`theoryU.phases.${phases[index]}`)}
            </text>
          </g>
        ))}
      </svg>
    );
  };

  const getReadinessColor = (status?: string) => {
    if (!status) return 'text-muted-foreground';
    if (status.toLowerCase().includes('ready')) return 'text-green-500';
    if (status.toLowerCase().includes('not')) return 'text-red-500';
    return 'text-yellow-500';
  };

  const getReadinessIcon = (status?: string) => {
    if (!status) return '⏸️';
    if (status.toLowerCase().includes('ready')) return '✅';
    if (status.toLowerCase().includes('not')) return '❌';
    return '⚠️';
  };

  const getPriorityBadge = (priority: number) => {
    if (priority === 1) return <Badge variant="destructive">{t('theoryU.priority.high')}</Badge>;
    if (priority === 2) return <Badge variant="default">{t('theoryU.priority.medium')}</Badge>;
    return <Badge variant="secondary">{t('theoryU.priority.low')}</Badge>;
  };

  const resources = analysis?.theoryUResources || getDefaultTheoryUResources(language);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <CardTitle>{t('theoryU.analyzing')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            {t('theoryU.errorTitle')}
          </CardTitle>
          <CardDescription>{t('theoryU.errorDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {t('theoryU.refresh')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const confidencePercent = getConfidencePercent();
  const lowConfidence = isLowConfidence();

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* PHASE 1: Data Quality Warning */}
        {lowConfidence && (
          <Alert variant="destructive" className="border-orange-500 bg-orange-500/10">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="flex items-center justify-between">
              <span>⚠️ {t('theoryU.dataQuality.lowConfidenceWarning')}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/projects/${projectId}?tab=documents`)}
                className="ml-4"
              >
                <Upload className="mr-2 h-4 w-4" />
                {t('theoryU.dataQuality.uploadDocuments')}
              </Button>
            </AlertTitle>
            <AlertDescription className="mt-2">
              {t('theoryU.dataQuality.lowConfidenceMessage', { confidence: confidencePercent.toFixed(1) })}
              <br />
              {t('theoryU.dataQuality.uploadDocumentsMessage')}
            </AlertDescription>
          </Alert>
        )}

        {/* Theory U Title */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{t('theoryU.title')}</CardTitle>
                <CardDescription>{t('theoryU.description')}</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                {t('theoryU.refresh')}
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* NIVEAU 1: Where You Are - Always Visible */}
        <Card className={lowConfidence ? 'opacity-60' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              {t('theoryU.whereAreYou')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* U-Curve */}
            {renderUCurve()}

            {/* Key Information Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Phase */}
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t('theoryU.phase')}</p>
                <p className="text-lg font-bold text-primary">
                  {t(`theoryU.phases.${analysis.position}`)}
                </p>
                <p className="text-xs text-muted-foreground italic">
                  {t(`theoryU.phaseSubtitles.${analysis.position}`)}
                </p>
              </div>

              {/* Confidence */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      {t('theoryU.confident')}
                      <Info className="h-3 w-3" />
                    </p>
                    <p className="text-lg font-semibold">{confidencePercent}%</p>
                    <Progress value={confidencePercent} className="h-2" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {lowConfidence 
                    ? t('theoryU.dataQuality.uploadDocumentsMessage')
                    : language === 'da' 
                      ? `Analysen er baseret på både morfologi og dokumenter`
                      : `Analysis based on both morphology and documents`
                  }
                </TooltipContent>
              </Tooltip>

              {/* Social Field */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      {t('theoryU.socialField')}
                      <Info className="h-3 w-3" />
                    </p>
                    <p className="text-lg font-semibold">
                      {t(`theoryU.socialFields.${mapSocialFieldKey(analysis.socialField)}`)}
                    </p>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="font-semibold mb-1">{t('theoryU.tooltips.socialField')}</p>
                  <p className="text-sm">
                    {t(`theoryU.tooltips.socialField${mapSocialFieldKey(analysis.socialField).charAt(0).toUpperCase() + mapSocialFieldKey(analysis.socialField).slice(1)}`)}
                  </p>
                </TooltipContent>
              </Tooltip>

              {/* Depth */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      {t('theoryU.depth')}
                      <Info className="h-3 w-3" />
                    </p>
                    <p className="text-lg font-semibold">
                      {t(`theoryU.depths.${analysis.depth}`)}
                    </p>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="font-semibold mb-1">{t('theoryU.tooltips.depth')}</p>
                  <p className="text-sm">
                    {t(`theoryU.tooltips.depth${analysis.depth.charAt(0).toUpperCase() + analysis.depth.slice(1)}`)}
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Open M/H/W with Progress Bars */}
            <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-sm font-medium flex items-center gap-1">
                    {t('theoryU.openMHW')}
                    <Info className="h-3 w-3" />
                  </p>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="font-semibold mb-1">{t('theoryU.tooltips.openMHW')}</p>
                  <p className="text-sm mb-2">{t('theoryU.tooltips.openMind')}</p>
                  <p className="text-sm mb-2">{t('theoryU.tooltips.openHeart')}</p>
                  <p className="text-sm mb-2">{t('theoryU.tooltips.openWill')}</p>
                  <p className="text-sm italic">{t('theoryU.tooltips.lowScores')}</p>
                </TooltipContent>
              </Tooltip>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">{language === 'da' ? 'Åbenhed i sind' : 'Openness of Mind'}</span>
                  <span className="text-sm font-semibold">{analysis.openMHW.mind}/10</span>
                </div>
                <Progress value={analysis.openMHW.mind * 10} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">{language === 'da' ? 'Åbenhed i hjerte' : 'Openness of Heart'}</span>
                  <span className="text-sm font-semibold">{analysis.openMHW.heart}/10</span>
                </div>
                <Progress value={analysis.openMHW.heart * 10} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">{language === 'da' ? 'Åbenhed i vilje' : 'Openness of Will'}</span>
                  <span className="text-sm font-semibold">{analysis.openMHW.will}/10</span>
                </div>
                <Progress value={analysis.openMHW.will * 10} className="h-2" />
              </div>
            </div>

            {/* PHASE 2: What This Means - Narrative */}
            {!lowConfidence && (
              <div className="mt-6 p-6 bg-primary/5 rounded-lg border border-primary/20">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  {t('theoryU.narrative.whatThisMeans')}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {language === 'da' 
                    ? `I denne fase handler det om at ${
                        analysis.position === 'seeing' ? 'observere og se med friske øjne' :
                        analysis.position === 'sensing' ? 'lytte dybt og sanse med åbent hjerte' :
                        analysis.position === 'presencing' ? 'forbinde til den dybeste kilde og slippe det gamle' :
                        analysis.position === 'crystallizing' ? 'krystallisere visionen og sætte retning' :
                        'skabe prototyper og eksperimentere med det nye'
                      }. Fokuser på ${
                        analysis.position === 'seeing' || analysis.position === 'sensing' 
                          ? 'at FORSTÅ før I HANDLER' 
                          : 'at skabe KONKRETE eksperimenter'
                      }.`
                    : `In this phase, it's about ${
                        analysis.position === 'seeing' ? 'observing and seeing with fresh eyes' :
                        analysis.position === 'sensing' ? 'listening deeply and sensing with an open heart' :
                        analysis.position === 'presencing' ? 'connecting to the deepest source and letting go of the old' :
                        analysis.position === 'crystallizing' ? 'crystallizing the vision and setting direction' :
                        'creating prototypes and experimenting with the new'
                      }. Focus on ${
                        analysis.position === 'seeing' || analysis.position === 'sensing'
                          ? 'UNDERSTANDING before you ACT'
                          : 'creating CONCRETE experiments'
                      }.`
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* NIVEAU 2: Why This Phase - Collapsible */}
        <Collapsible open={isWhyHereExpanded} onOpenChange={setIsWhyHereExpanded}>
          <Card>
            <CardHeader>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 hover:bg-transparent">
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    {t('theoryU.whyThisPhase')}
                  </CardTitle>
                  {isWhyHereExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </Button>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="space-y-6 pt-0">
                {/* PHASE 2: Narrative Morphology Synthesis */}
                {analysis.whyHere?.morphologySynthesis && (
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      {t('theoryU.narrative.yourProjectDNA')}
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {analysis.whyHere.morphologySynthesis}
                    </p>
                  </div>
                )}

                {/* Morphology Evidence with DNA Visualization */}
                {analysis.whyHere?.morphologyEvidence && analysis.whyHere.morphologyEvidence.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-4">{t('theoryU.morphologyEvidence')}</h4>
                    <DNAEvidenceVisualization
                      morphology={morphology}
                      evidence={analysis.whyHere.morphologyEvidence}
                      language={language}
                    />
                  </div>
                )}

                {/* Document Evidence */}
                {analysis.whyHere?.documentEvidence && analysis.whyHere.documentEvidence.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        {t('theoryU.documentEvidence')}
                      </h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRegenerateQuotes}
                        disabled={refreshing}
                      >
                        <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                        {language === 'da' ? 'Regenerer' : 'Regenerate'}
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {analysis.whyHere.documentEvidence
                        .slice(0, showAllQuotes ? undefined : 3)
                        .map((quote, idx) => (
                          <Card key={idx} className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <p className="text-sm italic mb-2">"{quote.text}"</p>
                                {quote.source && (
                                  <p className="text-xs text-muted-foreground">
                                    {language === 'da' ? 'Kilde' : 'Source'}: {quote.source}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="secondary" className="text-xs">
                                    {t('theoryU.relevance')}: {quote.relevance}%
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleToggleFavorite(quote.text)}
                                >
                                  <Star
                                    className={`h-4 w-4 ${
                                      favoriteQuotes.includes(quote.text)
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : ''
                                    }`}
                                  />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRejectQuote(idx)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                    </div>

                    {analysis.whyHere.documentEvidence.length > 3 && (
                      <Button
                        variant="outline"
                        onClick={() => setShowAllQuotes(!showAllQuotes)}
                        className="w-full"
                      >
                        {showAllQuotes
                          ? t('theoryU.showLess')
                          : t('theoryU.showMore', {
                              count: analysis.whyHere.documentEvidence.length - 3
                            })}
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Next Actions */}
        {analysis.nextActions && analysis.nextActions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                {t('theoryU.narrative.concreteNext')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {analysis.nextActions.slice(0, 3).map((action, idx) => (
                <Card key={idx} className="p-4 border-l-4 border-l-primary">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{idx + 1}.</span>
                        <p className="font-medium">{action.action}</p>
                        {getPriorityBadge(action.priority)}
                      </div>
                      <p className="text-sm text-muted-foreground">{action.rationale}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {action.timeframe}
                        </span>
                        {action.theoryUPrinciple && (
                          <span className="flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            {action.theoryUPrinciple}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </CardContent>
          </Card>
        )}

        {/* NIVEAU 3: Technical Details - Collapsible */}
        <Collapsible open={isTechnicalExpanded} onOpenChange={setIsTechnicalExpanded}>
          <Card>
            <CardHeader>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 hover:bg-transparent">
                  <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    {t('theoryU.narrative.seeDetails')}
                  </CardTitle>
                  {isTechnicalExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="space-y-2 text-xs font-mono bg-muted/50 p-4 rounded">
                  <div><span className="font-semibold">Position:</span> {analysis.position}</div>
                  <div><span className="font-semibold">Confidence:</span> {confidencePercent}%</div>
                  <div><span className="font-semibold">Social Field:</span> {analysis.socialField}</div>
                  <div><span className="font-semibold">Depth:</span> {analysis.depth}</div>
                  <div><span className="font-semibold">Open M/H/W:</span> {analysis.openMHW.mind}/{analysis.openMHW.heart}/{analysis.openMHW.will}</div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>
    </TooltipProvider>
  );
}
