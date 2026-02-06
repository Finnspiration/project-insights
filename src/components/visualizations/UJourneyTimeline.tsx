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
import { Loader2, RefreshCw, Sparkles, TrendingUp, TrendingDown, AlertCircle, CheckCircle2, XCircle, Clock, ExternalLink, BookOpen, Video, GraduationCap, MapPin, Lightbulb, BarChart3, FileText, Heart, Star, X, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import goldenUBackground from '@/assets/golden-u-background.jpg';
import { DNAEvidenceVisualization } from './theory-u/DNAEvidenceVisualization';
import { EvidenceBreakdownPanel } from './theory-u/EvidenceBreakdownPanel';
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
    aiNuance?: string;
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
  const { t, i18n } = useTranslation('common');
  const { toast } = useToast();
  const [analysis, setAnalysis] = useState<TheoryUAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAllQuotes, setShowAllQuotes] = useState(false);
  const [favoriteQuotes, setFavoriteQuotes] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);




  // Helper function to transform Theory U data structure
  const transformTheoryUData = (data: any): TheoryUAnalysis | null => {
    if (!data) return null;
    console.log('🔍 Transforming data, whyHere.documentEvidence:', data?.whyHere?.documentEvidence);

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

    // Transform from AI response format to component format
    const rawPhase = data.currentPhase || data.whyHere?.morphologyScoring?.phase || data.position || 'downloading';

    // Transform documentEvidence from old format (string[]) to new format (object[])
    let documentEvidence = data.whyHere?.documentEvidence;
    console.log('📝 Raw documentEvidence type:', typeof documentEvidence, Array.isArray(documentEvidence));
    if (documentEvidence && Array.isArray(documentEvidence)) {
      if (documentEvidence.length > 0) {
        const firstItem = documentEvidence[0];
        console.log('🔎 First item type:', typeof firstItem, 'value:', firstItem);
        if (typeof firstItem === 'string') {
          console.log('⚠️ Converting OLD format (strings) to NEW format (objects)');
          documentEvidence = documentEvidence.map((text: string) => ({
            text,
            relevance: 50,
            source: undefined
          }));
        } else {
          console.log('✅ Already in NEW format (objects with relevance scores)');
        }
      }
    }
    console.log('✨ Final transformed documentEvidence:', documentEvidence);

    // Normalize aiNuance - can be at top level OR nested under whyHere
    const aiNuance = data.aiNuance || data.whyHere?.aiNuance || 
      (typeof data.whyHere === 'string' ? data.whyHere : undefined);

    // Normalize nextActions - API may return strings or objects
    let nextActions: TheoryUAnalysis['nextActions'] = [];
    if (Array.isArray(data.nextActions)) {
      nextActions = data.nextActions.map((item: any, idx: number) => {
        if (typeof item === 'string') {
          return { priority: idx < 2 ? 1 : idx < 4 ? 2 : 3, action: item, rationale: '', theoryUPrinciple: '', timeframe: '', expectedImpact: '' };
        }
        return item;
      });
    }

    // Normalize readinessIndicators - API may return string[] or structured object
    let readinessIndicators: TheoryUAnalysis['readinessIndicators'] = undefined;
    if (data.readinessIndicators) {
      if (Array.isArray(data.readinessIndicators)) {
        // Convert string array to structured object: first 2 → descend, next 2 → presence, rest → ascend
        const items = data.readinessIndicators as string[];
        readinessIndicators = {
          readyToDescend: items.length > 0 ? {
            status: 'partially',
            reason: items.slice(0, 2).join(' '),
            nextSteps: items.slice(0, 2)
          } : undefined,
          readyToPresence: items.length > 2 ? {
            status: 'partially',
            reason: items.slice(2, 4).join(' '),
            nextSteps: items.slice(2, 4)
          } : undefined,
          readyToAscend: items.length > 4 ? {
            status: 'partially',
            reason: items.slice(4, 6).join(' '),
            nextSteps: items.slice(4, 6)
          } : undefined,
        };
      } else if (typeof data.readinessIndicators === 'object') {
        readinessIndicators = data.readinessIndicators;
      }
    }

    // Normalize theoryUResources - API may return strings or objects
    let theoryUResources: TheoryUAnalysis['theoryUResources'] = [];
    if (Array.isArray(data.theoryUResources)) {
      theoryUResources = data.theoryUResources.map((item: any) => {
        if (typeof item === 'string') {
          // Extract a title from the string (first part before colon or first 60 chars)
          const colonIdx = item.indexOf(':');
          const title = colonIdx > 0 && colonIdx < 60 ? item.substring(0, colonIdx).trim() : item.substring(0, 60).trim();
          const relevance = colonIdx > 0 ? item.substring(colonIdx + 1).trim() : item;
          return { type: 'tool', title, link: '', relevance };
        }
        return item;
      });
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
        ...(typeof data.whyHere === 'object' && data.whyHere !== null && !Array.isArray(data.whyHere) ? data.whyHere : {}),
        aiNuance,
        documentEvidence
      },
      nextActions,
      readinessIndicators,
      theoryUResources
    };
  };

  // Fetch user ID and favorite quotes
  useEffect(() => {
    const fetchUserAndFavorites = async () => {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);

        // Fetch existing favorites for this project
        const {
          data: favorites
        } = await supabase.from('favorite_quotes').select('quote_text').eq('user_id', user.id).eq('project_id', projectId);
        if (favorites) {
          setFavoriteQuotes(new Set(favorites.map(f => f.quote_text)));
        }
      }
    };
    fetchUserAndFavorites();
  }, [projectId]);
  const handleToggleFavorite = async (quote: {
    text: string;
    relevance: number;
    source?: string;
  }) => {
    if (!userId) return;
    const isFavorite = favoriteQuotes.has(quote.text);
    if (isFavorite) {
      // Remove from favorites
      const {
        error
      } = await supabase.from('favorite_quotes').delete().eq('user_id', userId).eq('project_id', projectId).eq('quote_text', quote.text);
      if (!error) {
        setFavoriteQuotes(prev => {
          const newSet = new Set(prev);
          newSet.delete(quote.text);
          return newSet;
        });
        toast({
          title: t('visualizations.theoryU.removedFromFavorites'),
          description: t('visualizations.theoryU.removedFromFavoritesDesc')
        });
      } else {
        toast({
          title: t('common.error'),
          description: t('visualizations.theoryU.favoriteFailed'),
          variant: 'destructive'
        });
      }
    } else {
      // Add to favorites
      const {
        error
      } = await supabase.from('favorite_quotes').insert({
        user_id: userId,
        project_id: projectId,
        quote_text: quote.text,
        relevance_score: quote.relevance,
        theory_u_phase: analysis?.position || 'unknown',
        source_document: quote.source
      });
      if (!error) {
        setFavoriteQuotes(prev => new Set(prev).add(quote.text));
        toast({
          title: t('visualizations.theoryU.addedToFavorites'),
          description: t('visualizations.theoryU.addedToFavoritesDesc')
        });
      } else {
        toast({
          title: t('common.error'),
          description: t('visualizations.theoryU.favoriteFailed'),
          variant: 'destructive'
        });
      }
    }
  };
  const handleRejectQuote = async (index: number) => {
    if (!analysis?.whyHere?.documentEvidence) return;
    const updatedEvidence = analysis.whyHere.documentEvidence.filter((_: any, idx: number) => idx !== index);

    // Optimistic update
    setAnalysis({
      ...analysis,
      whyHere: {
        ...analysis.whyHere,
        documentEvidence: updatedEvidence
      }
    });

    // Update database
    await supabase.from('projects').update({
      theory_u_analysis: {
        ...analysis,
        whyHere: {
          ...analysis.whyHere,
          documentEvidence: updatedEvidence
        }
      }
    }).eq('id', projectId);
    toast({
      title: t('visualizations.theoryU.quoteRejected'),
      description: t('visualizations.theoryU.quoteRejectedDesc')
    });
  };
  const handleRegenerateQuotes = async () => {
    setRefreshing(true);
    try {
      console.log('🔄 Regenerating quotes with new AI analysis...');
      
      // Normalize morphology to new format
      const normalizedMorphology: Record<string, string> = {};
      Object.keys(morphology).forEach(key => {
        const value = morphology[key];
        normalizedMorphology[key] = typeof value === 'object' && value?.selectedValue 
          ? value.selectedValue 
          : value;
      });
      
      const {
        data,
        error
      } = await supabase.functions.invoke('analyze-theory-u-position', {
        body: {
          projectId,
          morphology: normalizedMorphology,
          language: i18n.language,
          regenerateQuotes: true
        }
      });
      if (error) throw error;
      console.log('✅ Raw AI response:', data);
      console.log('📊 Document evidence:', data?.whyHere?.documentEvidence);
      const transformedData = transformTheoryUData(data);
      console.log('🔧 Transformed data:', transformedData?.whyHere?.documentEvidence);
      setAnalysis(transformedData);
      toast({
        title: t('visualizations.theoryU.quotesRegenerated'),
        description: t('visualizations.theoryU.quotesRegeneratedDesc')
      });
    } catch (error) {
      console.error('❌ Failed to regenerate quotes:', error);
      toast({
        title: t('common.error'),
        description: t('visualizations.theoryU.regenerateFailed'),
        variant: 'destructive'
      });
    } finally {
      setRefreshing(false);
    }
  };
  const fetchAnalysis = async (forceRefresh = false) => {
    if (forceRefresh) setRefreshing(true);else setLoading(true);
    try {
      console.log('📥 Fetching Theory U analysis, forceRefresh:', forceRefresh);

      // Check cache first (skip if forceRefresh)
      if (!forceRefresh) {
        const {
          data: project
        } = await supabase.from('projects').select('theory_u_analysis, theory_u_analysis_updated_at').eq('id', projectId).single();
        if (project?.theory_u_analysis) {
          console.log('💾 Using cached analysis');
          const transformed = transformTheoryUData(project.theory_u_analysis);
          if (transformed) {
            setAnalysis(transformed);
            setLoading(false);
            setRefreshing(false);
            return;
          }
        }
      } else {
        console.log('🔄 Force refresh - calling AI for new analysis');
      }

      // Call edge function
      // Normalize morphology to new format
      const normalizedMorphology: Record<string, string> = {};
      Object.keys(morphology).forEach(key => {
        const value = morphology[key];
        normalizedMorphology[key] = typeof value === 'object' && value?.selectedValue 
          ? value.selectedValue 
          : value;
      });
      
      const {
        data: analysisData,
        error
      } = await supabase.functions.invoke('analyze-theory-u-position', {
        body: {
          projectId,
          morphology: normalizedMorphology,
          language: i18n.language
        }
      });
      if (error) throw error;
      if (!analysisData) throw new Error('No analysis data returned');

      // DEBUG: Log edge function output
      console.log('🔍 EDGE FUNCTION OUTPUT (analyze-theory-u-position):');
      console.log('═══════════════════════════════════════════════════');
      console.log('Raw response:', analysisData);
      console.log('');
      if (analysisData.whyHere?.morphologyScoring) {
        console.log('📊 MORFOLOGISK SCORING:');
        console.log('  Fase:', analysisData.whyHere.morphologyScoring.phase);
        console.log('  Confidence:', (analysisData.whyHere.morphologyScoring.confidence * 100).toFixed(1) + '%');
        console.log('  Score:', analysisData.whyHere.morphologyScoring.score);
        console.log('');
        console.log('  Top bidrag til denne fase:');
        analysisData.whyHere.morphologyScoring.topContributions?.slice(0, 5).forEach((contrib: string, i: number) => {
          console.log(`    ${i + 1}. ${contrib}`);
        });
        console.log('');
        if (analysisData.whyHere.morphologyScoring.allPhaseScores) {
          console.log('  Alle fase scores (top 3):');
          analysisData.whyHere.morphologyScoring.allPhaseScores.forEach((phaseScore: any) => {
            console.log(`    - ${phaseScore.phase}: ${phaseScore.score} points`);
          });
        }
        console.log('');
      }
      if (analysisData.whyHere?.aiNuance) {
        console.log('🤖 AI NUANCE:');
        console.log('  ', analysisData.whyHere.aiNuance);
        console.log('');
      }
      console.log('═══════════════════════════════════════════════════');

      // Transform AI response using helper
      const transformed = transformTheoryUData(analysisData);
      if (!transformed) {
        throw new Error('Failed to transform analysis data');
      }

      // Cache the transformed result
      await supabase.from('projects').update({
        theory_u_analysis: transformed,
        theory_u_analysis_updated_at: new Date().toISOString()
      }).eq('id', projectId);
      setAnalysis(transformed);
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

    // Positioned to match the golden U image
    const phases = [{
      key: 'seeing',
      x: 230,
      y: 77,
      label: t('visualizations.theoryU.phases.seeing'),
      subtitle: t('visualizations.theoryU.phaseSubtitles.seeing')
    }, {
      key: 'sensing',
      x: 180,
      y: 255,
      label: t('visualizations.theoryU.phases.sensing'),
      subtitle: t('visualizations.theoryU.phaseSubtitles.sensing')
    }, {
      key: 'presencing',
      x: 372,
      y: 385,
      label: t('visualizations.theoryU.phases.presencing'),
      subtitle: t('visualizations.theoryU.phaseSubtitles.presencing')
    }, {
      key: 'crystallizing',
      x: 575,
      y: 253,
      label: t('visualizations.theoryU.phases.crystallizing'),
      subtitle: t('visualizations.theoryU.phaseSubtitles.crystallizing')
    }, {
      key: 'prototyping',
      x: 565,
      y: 77,
      label: t('visualizations.theoryU.phases.prototyping'),
      subtitle: t('visualizations.theoryU.phaseSubtitles.prototyping')
    }];

    // Map AI's 7 phases to our 5 visualization phases
    const mapPhaseToVisualization = (aiPhase: string): string => {
      const phaseMap: Record<string, string> = {
        'downloading': 'seeing',
        'performing': 'prototyping'
      };
      return phaseMap[aiPhase] || aiPhase;
    };
    const mappedPhase = analysis?.position ? mapPhaseToVisualization(analysis.position) : null;
    return <svg width={width} height={height} className="mx-auto" viewBox={`0 0 ${width} ${height}`}>
        <defs>
          {/* Glow filter for current phase */}
          <filter id="phaseGlow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background Image - Golden U */}
        <image href={goldenUBackground} width={width} height={height} preserveAspectRatio="xMidYMid meet" opacity={0.85} />

        {/* Phase labels with descriptions */}
        {phases.map((phase, index) => {
        const isCenter = index === 2;
        const isCurrentPhase = phase.key === mappedPhase;
        return <g key={phase.key}>
              {/* Phase marker circle - mother-of-pearl style */}
              <defs>
                <radialGradient id={`pearl-${phase.key}`} cx="30%" cy="30%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                  <stop offset="40%" stopColor="#f0f0f0" stopOpacity="0.8" />
                  <stop offset="70%" stopColor="#e0e0e0" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#d0d0d0" stopOpacity="0.6" />
                </radialGradient>
              </defs>
              <circle cx={phase.x} cy={phase.y} r={isCurrentPhase ? 10.5 : 8.5} fill={`url(#pearl-${phase.key})`} stroke={isCurrentPhase ? '#ffffff' : '#e0e0e0'} strokeWidth={isCurrentPhase ? 2 : 1.5} className="transition-all" style={{
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
          }} />
              
              {/* Current position pulse animation */}
              {isCurrentPhase && <>
                  <circle cx={phase.x} cy={phase.y} r="15" fill="#FFD700" opacity="0.3" className="animate-pulse" />
                </>}

              {/* Phase label */}
              <text x={phase.key === 'sensing' || phase.key === 'seeing' ? phase.x - 25 : phase.key === 'crystallizing' || phase.key === 'prototyping' ? phase.x + 25 : phase.x} y={isCenter ? phase.y + 50 : phase.y - 4.5} textAnchor={phase.key === 'sensing' || phase.key === 'seeing' ? 'end' : phase.key === 'crystallizing' || phase.key === 'prototyping' ? 'start' : 'middle'} className={`font-bold ${isCurrentPhase ? 'text-lg' : 'text-sm'}`} style={{
            fontSize: isCurrentPhase ? '18px' : '16px',
            fill: '#ffffff'
          }}>
                {phase.label}
              </text>
              
              {/* Phase subtitle */}
              <text x={phase.key === 'sensing' || phase.key === 'seeing' ? phase.x - 25 : phase.key === 'crystallizing' || phase.key === 'prototyping' ? phase.x + 25 : phase.x} y={isCenter ? phase.y + 65 : phase.y + 10.5} textAnchor={phase.key === 'sensing' || phase.key === 'seeing' ? 'end' : phase.key === 'crystallizing' || phase.key === 'prototyping' ? 'start' : 'middle'} className="text-xs" style={{
            fontSize: '11px',
            fill: '#ffffff',
            opacity: 0.8
          }}>
                {phase.subtitle}
              </text>
            </g>;
      })}
      </svg>;
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
  // Defensive check for morphology (after all hooks)
  if (!morphology) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('visualizations.theoryU.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{t('visualizations.theoryU.noAnalysis')}</p>
        </CardContent>
      </Card>
    );
  }
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
  const resources = analysis.theoryUResources && analysis.theoryUResources.length > 0 ? analysis.theoryUResources : getDefaultTheoryUResources(i18n.language);
  
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

            {/* Enhanced Info Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Phase + Confidence Card */}
              <div className="space-y-4 p-5 rounded-xl bg-muted/30 border border-border/50">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">{t('visualizations.theoryU.phase')}</p>
                  <span className="text-2xl font-bold block">{t(`visualizations.theoryU.phases.${analysis.position}`)}</span>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t(`visualizations.theoryU.phaseDescriptions.${analysis.position}`, { defaultValue: '' })}
                  </p>
                </div>
                <div className="space-y-2 pt-2 border-t border-border/50">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-muted-foreground">{t('visualizations.theoryU.confident')}</p>
                    <span className={`text-sm font-bold ${
                      (analysis.confidence || 0) >= 70 ? 'text-green-600 dark:text-green-400' :
                      (analysis.confidence || 0) >= 30 ? 'text-amber-600 dark:text-amber-400' :
                      'text-red-600 dark:text-red-400'
                    }`}>{analysis.confidence || 0}%</span>
                  </div>
                  <Progress value={analysis.confidence || 0} className={`h-2 ${
                    (analysis.confidence || 0) >= 70 ? '[&>div]:bg-green-500' :
                    (analysis.confidence || 0) >= 30 ? '[&>div]:bg-amber-500' :
                    '[&>div]:bg-red-500'
                  }`} />
                  <p className="text-xs text-muted-foreground">
                    {t('visualizations.theoryU.confidenceExplanation')} — {
                      (analysis.confidence || 0) >= 70 ? t('visualizations.theoryU.confidenceHigh') :
                      (analysis.confidence || 0) >= 30 ? t('visualizations.theoryU.confidenceMedium') :
                      t('visualizations.theoryU.confidenceLow')
                    }
                  </p>
                </div>
              </div>

              {/* Social Field + Depth Card */}
              <div className="space-y-4 p-5 rounded-xl bg-muted/30 border border-border/50">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">{t('visualizations.theoryU.socialField')}</p>
                  <p className="text-xl font-semibold">
                    {t(`visualizations.theoryU.socialFields.${mappedSocialField}`)}
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t(`visualizations.theoryU.socialFieldDescriptions.${mappedSocialField}`, { defaultValue: '' })}
                  </p>
                </div>
                <div className="space-y-1 pt-2 border-t border-border/50">
                  <p className="text-sm font-medium text-muted-foreground">{t('visualizations.theoryU.depth')}</p>
                  <p className="text-lg font-semibold">
                    {analysis.depth ? t(`visualizations.theoryU.depths.${analysis.depth.toLowerCase()}`) : '-'}
                  </p>
                  {analysis.depth && (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {t(`visualizations.theoryU.depthDescriptions.${analysis.depth.toLowerCase()}`, { defaultValue: '' })}
                    </p>
                  )}
                </div>
              </div>

              {/* Open Mind / Heart / Will Card - Full width */}
              <div className="md:col-span-2 space-y-4 p-5 rounded-xl bg-muted/30 border border-border/50">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">{t('visualizations.theoryU.openMHW')}</p>
                  <p className="text-xs text-muted-foreground">{t('visualizations.theoryU.openMHWDescription')}</p>
                </div>
                <div className="grid grid-cols-3 gap-6">
                  {/* Open Mind */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{t('visualizations.theoryU.openMindLabel')}</span>
                      <span className="text-sm font-bold">{analysis.openMHW?.mind || 0}/10</span>
                    </div>
                    <Progress value={(analysis.openMHW?.mind || 0) * 10} className={`h-3 ${
                      (analysis.openMHW?.mind || 0) >= 7 ? '[&>div]:bg-green-500' :
                      (analysis.openMHW?.mind || 0) >= 4 ? '[&>div]:bg-amber-500' :
                      '[&>div]:bg-red-500'
                    }`} />
                  </div>
                  {/* Open Heart */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{t('visualizations.theoryU.openHeartLabel')}</span>
                      <span className="text-sm font-bold">{analysis.openMHW?.heart || 0}/10</span>
                    </div>
                    <Progress value={(analysis.openMHW?.heart || 0) * 10} className={`h-3 ${
                      (analysis.openMHW?.heart || 0) >= 7 ? '[&>div]:bg-green-500' :
                      (analysis.openMHW?.heart || 0) >= 4 ? '[&>div]:bg-amber-500' :
                      '[&>div]:bg-red-500'
                    }`} />
                  </div>
                  {/* Open Will */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{t('visualizations.theoryU.openWillLabel')}</span>
                      <span className="text-sm font-bold">{analysis.openMHW?.will || 0}/10</span>
                    </div>
                    <Progress value={(analysis.openMHW?.will || 0) * 10} className={`h-3 ${
                      (analysis.openMHW?.will || 0) >= 7 ? '[&>div]:bg-green-500' :
                      (analysis.openMHW?.will || 0) >= 4 ? '[&>div]:bg-amber-500' :
                      '[&>div]:bg-red-500'
                    }`} />
                  </div>
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
            {analysis.whyHere?.morphologySynthesis && <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm leading-relaxed">{analysis.whyHere.morphologySynthesis}</p>
              </div>}

            {/* Morphology Evidence */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold">{t('visualizations.theoryU.morphologyEvidence')}</h3>
                </div>
                <Button variant="ghost" size="sm" onClick={() => fetchAnalysis(true)} disabled={refreshing} className="h-8 px-2">
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              
              {/* Morphology Evidence - DNA Visualization */}
              {analysis.whyHere.morphologyEvidence && analysis.whyHere.morphologyEvidence.length > 0 && morphology && <div className="space-y-4">
                  {/* Evidence Breakdown Panel */}
                  <EvidenceBreakdownPanel
                    morphologyEvidence={analysis.whyHere.morphologyEvidence}
                    dominantPhase={analysis.position}
                  />
                  
                  <h4 className="font-semibold text-sm flex items-center gap-2 mt-6">
                    <Sparkles className="w-4 h-4 text-primary" />
                    {t('visualizations.theoryU.morphologyEvidence')}
                  </h4>
                  
                  {/* DNA Helix Visualization */}
                  <DNAEvidenceVisualization morphology={morphology} evidence={analysis.whyHere.morphologyEvidence} language={i18n.language as 'en' | 'da' || 'en'} />
                  
                  {/* Legend */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground px-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
                      <span>{t('visualizations.theoryU.evidenceDimensions')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-muted" />
                      <span>{t('visualizations.theoryU.otherDimensions')}</span>
                    </div>
                    <span className="ml-auto italic">{t('visualizations.theoryU.clickToExplore')}</span>
                  </div>
                  
                  {/* Collapsible detailed list */}
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-full">
                        <ChevronDown className="w-4 h-4 mr-2" />
                        {t('visualizations.theoryU.showDetails')}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="grid gap-3 mt-4">
                        {analysis.whyHere.morphologyEvidence.map((evidence: any, idx: number) => <div key={idx} className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border border-border">
                            <Badge variant="secondary" className="mt-0.5 shrink-0">
                              {evidence.dimension}
                            </Badge>
                            <div className="flex-1 space-y-1">
                              <p className="font-medium text-sm">{evidence.value}</p>
                              <p className="text-sm text-muted-foreground">{evidence.reasoning}</p>
                            </div>
                          </div>)}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>}
            </div>

            {/* Document Evidence */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold">{t('visualizations.theoryU.documentEvidence')}</h3>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleRegenerateQuotes()} disabled={refreshing} className="h-8 px-2">
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              
              {analysis.whyHere?.documentEvidence && analysis.whyHere.documentEvidence.length > 0 ? <div className="space-y-3">
                  {analysis.whyHere.documentEvidence.slice(0, showAllQuotes ? undefined : 3).map((quote: {
                text: string;
                relevance: number;
                source?: string;
              }, idx: number) => {
                const isFavorite = favoriteQuotes.has(quote.text);
                const relevanceColor = quote.relevance >= 80 ? 'text-green-600 dark:text-green-400' : quote.relevance >= 60 ? 'text-blue-600 dark:text-blue-400' : quote.relevance >= 40 ? 'text-yellow-600 dark:text-yellow-400' : 'text-orange-600 dark:text-orange-400';
                return <div key={idx} className="group relative p-4 rounded-lg bg-accent/10 border-l-4 border-accent shadow-sm hover:shadow-md transition-shadow">
                          {/* Relevance indicator */}
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className={`text-xs ${relevanceColor}`}>
                              {t('visualizations.theoryU.relevance')}: {quote.relevance}%
                            </Badge>
                            <Progress value={quote.relevance} className="h-1.5 w-24" />
                            {quote.source && <span className="text-xs text-muted-foreground ml-auto">📄 {quote.source}</span>}
                          </div>
                          
                          {/* Quote text */}
                          <p className="text-sm italic leading-relaxed text-foreground pr-20">
                            "{quote.text}"
                          </p>
                          
                          {/* Action buttons */}
                          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleToggleFavorite(quote)}>
                              <Star className={`w-4 h-4 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleRejectQuote(idx)}>
                              <X className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>;
              })}
                  
                  {analysis.whyHere.documentEvidence.length > 3 && <Button variant="outline" size="sm" className="w-full" onClick={() => setShowAllQuotes(!showAllQuotes)}>
                      {showAllQuotes ? <>
                          <ChevronUp className="w-4 h-4 mr-2" />
                          {t('visualizations.theoryU.showLess')}
                        </> : <>
                          <ChevronDown className="w-4 h-4 mr-2" />
                          {t('visualizations.theoryU.showMore', {
                    count: analysis.whyHere.documentEvidence.length - 3
                  })}
                        </>}
                    </Button>}
                </div> : analysis.whyHere?.documentStatus === 'processing' ? <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                  <div className="flex items-start gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-amber-600 border-t-transparent" />
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                        {t('visualizations.theoryU.documentsProcessing')}
                      </p>
                      {analysis.whyHere?.processingFiles && <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
                          {analysis.whyHere.processingFiles.map((filename: string, idx: number) => <li key={idx}>📄 {filename}</li>)}
                        </ul>}
                    </div>
                  </div>
                </div> : <div className="p-4 rounded-lg bg-muted/30 border border-dashed border-border">
                  <p className="text-sm text-muted-foreground italic text-center">
                    {t('visualizations.theoryU.noDocuments')}
                  </p>
                </div>}
            </div>
          </CardContent>
        </Card>

        {/* AI Narrative Synthesis */}
        {analysis.whyHere?.aiNuance && (
          <Card className="overflow-hidden border-primary/20">
            <CardContent className="p-0">
              <div className="bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 p-6">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-primary mt-1 shrink-0" />
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">{t('visualizations.theoryU.aiNarrativeTitle')}</h3>
                    <p className="text-sm leading-relaxed text-foreground/90">{analysis.whyHere.aiNuance}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Next Actions */}
        {analysis.nextActions && analysis.nextActions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                {t('visualizations.theoryU.nextActions')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysis.nextActions.map((action, idx) => (
                  <div key={idx} className="flex gap-4 p-4 rounded-lg bg-muted/30 border border-border/50">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">
                      {idx + 1}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getPriorityBadge(action.priority)}
                        <span className="font-semibold text-sm">{action.action}</span>
                      </div>
                      {action.rationale && (
                        <p className="text-sm text-muted-foreground">{action.rationale}</p>
                      )}
                      <div className="flex flex-wrap gap-3 text-xs">
                        {action.theoryUPrinciple && (
                          <span className="flex items-center gap-1 text-primary">
                            <Lightbulb className="w-3 h-3" />
                            {t('visualizations.theoryU.principle')}: {action.theoryUPrinciple}
                          </span>
                        )}
                        {action.timeframe && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {t('visualizations.theoryU.timeframe')}: {action.timeframe}
                          </span>
                        )}
                      </div>
                      {action.expectedImpact && (
                        <p className="text-xs text-muted-foreground border-t border-border/50 pt-2 mt-2">
                          <strong>{t('visualizations.theoryU.expectedImpact')}:</strong> {action.expectedImpact}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Readiness Indicators */}
        {analysis.readinessIndicators && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                {t('visualizations.theoryU.readinessIndicators')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {/* Ready to Descend */}
                {analysis.readinessIndicators.readyToDescend && (
                  <div className="p-4 rounded-lg bg-muted/30 border border-border/50 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getReadinessIcon(analysis.readinessIndicators.readyToDescend.status)}</span>
                      <h4 className="font-semibold text-sm">{t('visualizations.theoryU.readyToDescend')}</h4>
                    </div>
                    {analysis.readinessIndicators.readyToDescend.reason && (
                      <p className="text-xs text-muted-foreground">{analysis.readinessIndicators.readyToDescend.reason}</p>
                    )}
                    {analysis.readinessIndicators.readyToDescend.nextSteps && analysis.readinessIndicators.readyToDescend.nextSteps.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium">{t('visualizations.theoryU.readinessNextSteps')}:</p>
                        <ul className="text-xs text-muted-foreground space-y-0.5">
                          {analysis.readinessIndicators.readyToDescend.nextSteps.map((step, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <span className="text-primary mt-0.5">→</span> {step}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Ready to Presence */}
                {analysis.readinessIndicators.readyToPresence && (
                  <div className="p-4 rounded-lg bg-muted/30 border border-border/50 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getReadinessIcon(analysis.readinessIndicators.readyToPresence.status)}</span>
                      <h4 className="font-semibold text-sm">{t('visualizations.theoryU.readyToPresence')}</h4>
                    </div>
                    {analysis.readinessIndicators.readyToPresence.reason && (
                      <p className="text-xs text-muted-foreground">{analysis.readinessIndicators.readyToPresence.reason}</p>
                    )}
                    {analysis.readinessIndicators.readyToPresence.nextSteps && analysis.readinessIndicators.readyToPresence.nextSteps.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium">{t('visualizations.theoryU.readinessNextSteps')}:</p>
                        <ul className="text-xs text-muted-foreground space-y-0.5">
                          {analysis.readinessIndicators.readyToPresence.nextSteps.map((step, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <span className="text-primary mt-0.5">→</span> {step}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Ready to Ascend */}
                {analysis.readinessIndicators.readyToAscend && (
                  <div className="p-4 rounded-lg bg-muted/30 border border-border/50 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getReadinessIcon(analysis.readinessIndicators.readyToAscend.status)}</span>
                      <h4 className="font-semibold text-sm">{t('visualizations.theoryU.readyToAscend')}</h4>
                    </div>
                    {analysis.readinessIndicators.readyToAscend.reason && (
                      <p className="text-xs text-muted-foreground">{analysis.readinessIndicators.readyToAscend.reason}</p>
                    )}
                    {analysis.readinessIndicators.readyToAscend.nextSteps && analysis.readinessIndicators.readyToAscend.nextSteps.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium">{t('visualizations.theoryU.readinessNextSteps')}:</p>
                        <ul className="text-xs text-muted-foreground space-y-0.5">
                          {analysis.readinessIndicators.readyToAscend.nextSteps.map((step, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <span className="text-primary mt-0.5">→</span> {step}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Theory U Resources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              {t('visualizations.theoryU.resources')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {resources.map((resource, idx) => {
                const ResourceIcon = resource.type === 'book' ? BookOpen : resource.type === 'video' ? Video : GraduationCap;
                const Wrapper = resource.link ? 'a' : 'div';
                const linkProps = resource.link ? { href: resource.link, target: '_blank', rel: 'noopener noreferrer' } : {};
                return (
                  <Wrapper
                    key={idx}
                    {...linkProps as any}
                    className="group p-4 rounded-lg bg-muted/30 border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <ResourceIcon className="w-4 h-4 text-primary" />
                      <span className="font-semibold text-sm group-hover:text-primary transition-colors">{resource.title}</span>
                      {resource.link && <ExternalLink className="w-3 h-3 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />}
                    </div>
                    <p className="text-xs text-muted-foreground">{resource.relevance}</p>
                  </Wrapper>
                );
              })}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}