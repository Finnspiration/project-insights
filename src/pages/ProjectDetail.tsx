import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DocumentUpload } from '@/components/projects/DocumentUpload';
import { CulturalWeatherMap } from '@/components/visualizations/CulturalWeatherMap';
import { UJourneyTimeline } from '@/components/visualizations/UJourneyTimeline';
import { IDGRadarChart } from '@/components/visualizations/IDGRadarChart';
import { ProjectBodyScan } from '@/components/visualizations/ProjectBodyScan';
import { MorphologyBlob } from '@/components/visualizations/MorphologyBlob';
import { InsightsPanel } from '@/components/insights/InsightsPanel';
import { BlindSpotsPanel } from '@/components/insights/BlindSpotsPanel';
import { ArrowLeft, Calendar, Users, Sparkles, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { MorphologyWizard } from '@/components/projects/MorphologyWizard';
import { EditProjectDialog } from '@/components/projects/EditProjectDialog';
import { MorphologicalBox } from '@/components/morphology/MorphologicalBox';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { calculateIDGScoresFromMorphology, IDGScoresCalculation } from '@/lib/idgScoring';
import { generateDnaCode, isMorphologyComplete, normalizeMorphology } from '@shared/morphology.ts';
import { ProjectProgress } from '@/components/projects/ProjectProgress';
import type { Project } from '@/types/project';


interface Document {
  id: string;
  filename: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  uploaded_at: string;
  processed: boolean | null;
  content: string | null;
  metadata: any;
}

interface BlindSpot {
  id: string;
  title: any;
  description: any;
  priority: string;
  status: string;
  evidence?: any;
  consequences?: any;
  recommendations?: any;
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('common');
  const { profile } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [blindSpots, setBlindSpots] = useState<BlindSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [morphologyWizardOpen, setMorphologyWizardOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  // Preview state for live editing (separate from saved state)
  const [previewMorphology, setPreviewMorphology] = useState<any>(null);
  const [previewIDG, setPreviewIDG] = useState<any>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalMorphology, setOriginalMorphology] = useState<any>(null);
  const [activeVisualizationTab, setActiveVisualizationTab] = useState<string>('weather');
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  
  // IDG scores calculated from morphology (both scales)
  const [projectIDGScores, setProjectIDGScores] = useState<IDGScoresCalculation | null>(null);

  const userLanguage = (profile?.preferred_language || 'en') as 'en' | 'da';

  const fetchProject = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      // Normalize on read so every consumer below sees the canonical flat
      // format, whatever shape the row happens to be stored in.
      if (data.morphology) {
        data.morphology = normalizeMorphology(data.morphology);
      }

      // Repair DNA codes written by older code paths (either stringified
      // objects, or a different dimension order).
      const expectedDnaCode = generateDnaCode(data.morphology);
      if (expectedDnaCode && data.dna_code !== expectedDnaCode) {
        data.dna_code = expectedDnaCode;
        const { error: repairError } = await supabase
          .from('projects')
          .update({ dna_code: expectedDnaCode })
          .eq('id', id);
        if (repairError) {
          console.error('Failed to repair dna_code:', repairError);
        }
      }

      setProject(data);

      // Calculate IDG scores from morphology immediately
      if (data.morphology) {
        setProjectIDGScores(calculateIDGScoresFromMorphology(data.morphology));
      }
    } catch (error) {
      console.error('Error fetching project:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    // The weather map can change the morphology, the IDG profile, or both.
    // Bailing out on a missing previewMorphology used to make "save" a silent
    // no-op for anyone who had only moved the IDG sliders.
    if (!project || (!previewMorphology && !previewIDG)) return;

    try {
      const update: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      let normalized = project.morphology;
      let newDnaCode = project.dna_code;

      if (previewMorphology) {
        normalized = normalizeMorphology(previewMorphology);
        newDnaCode = generateDnaCode(normalized);
        update.morphology = normalized;
        update.dna_code = newDnaCode;
      }

      // idg_profile lives inside `patterns` alongside insights and
      // recommendations, so merge rather than replace.
      const patterns = previewIDG
        ? { ...(project.patterns || {}), idg_profile: previewIDG }
        : project.patterns;

      if (previewIDG) {
        update.patterns = patterns;
      }

      const { error } = await supabase
        .from('projects')
        .update(update)
        .eq('id', project.id);

      if (error) throw error;

      // Update local state
      setProject({ ...project, morphology: normalized, dna_code: newDnaCode, patterns });
      setOriginalMorphology(normalized);
      setHasUnsavedChanges(false);
      setPreviewMorphology(null);
      setPreviewIDG(null);

      const { toast } = await import('@/hooks/use-toast');
      toast({
        title: t('common.success'),
        description: t('weather_control.changes_saved'),
      });
    } catch (error) {
      console.error('Error saving changes:', error);
      const { toast } = await import('@/hooks/use-toast');
      toast({
        title: t('common.error'),
        description: t('weather_control.save_failed'),
        variant: 'destructive',
      });
    }
  };

  const handleReset = () => {
    setPreviewMorphology(null);
    setPreviewIDG(null);
    setHasUnsavedChanges(false);

    import('@/hooks/use-toast').then(({ toast }) => {
      toast({
        title: t('morphology.resetSuccess'),
      });
    });
  };

  // Initialize preview state when project loads
  useEffect(() => {
    if (project?.morphology) {
      setPreviewMorphology(null);
      setPreviewIDG(null);
      setOriginalMorphology(project.morphology);
      setHasUnsavedChanges(false);
    }
  }, [project?.id]);

  const fetchDocuments = async () => {
    if (!id) return;

    try {
    const { data, error } = await supabase
      .from('documents')
      .select('id, filename, file_path, file_type, file_size, uploaded_at, processed, content, metadata')
      .eq('project_id', id)
      .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const fetchBlindSpots = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('blind_spots')
        .select('*')
        .eq('project_id', id)
        .order('priority', { ascending: false });

      if (error) throw error;
      setBlindSpots(data || []);
    } catch (error) {
      console.error('Error fetching blind spots:', error);
    }
  };

  useEffect(() => {
    fetchProject();
    fetchDocuments();
    fetchBlindSpots();
  }, [id]);

  // Warn about unsaved changes before leaving page
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // beforeunload only covers reloads and tab closes — react-router navigation
  // never triggers it, so leaving via the in-page controls used to discard
  // unsaved edits silently. Route those clicks through here instead.
  const requestNavigation = (path: string) => {
    if (hasUnsavedChanges) {
      setPendingNavigation(path);
      return;
    }
    navigate(path);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">{t('projectDetail.loading')}</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8 text-center">
          <h2 className="text-2xl font-bold mb-4">{t('projectDetail.notFound')}</h2>
          <Button onClick={() => navigate('/projects')}>{t('projectDetail.backToProjects')}</Button>
        </div>
      </DashboardLayout>
    );
  }

  const projectName = project.name[userLanguage] || project.name.en;
  const projectDescription = project.description?.[userLanguage] || project.description?.en || '';

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => requestNavigation('/projects')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{projectName}</h1>
            <div className="flex items-center gap-2">
              <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                {project.status}
              </Badge>
              {project.dna_code && (
                <Badge variant="secondary" className="font-mono text-xs">
                  DNA: {project.dna_code.split('-').slice(0, 3).join('-')}...
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
              <Edit className="h-4 w-4 mr-2" />
              {t('projectDetail.edit')}
            </Button>
            {!project.dna_code && (
              <Button onClick={() => setMorphologyWizardOpen(true)}>
                <Sparkles className="h-4 w-4 mr-2" />
                {t('projectDetail.assessProject')}
              </Button>
            )}
          </div>
        </div>

        {/* Project Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t('projectDetail.projectInformation')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {projectDescription && (
              <div>
                <h3 className="text-sm font-medium mb-1">{t('projectDetail.description')}</h3>
                <p className="text-muted-foreground">{projectDescription}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {project.timeline_start && project.timeline_end && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {format(new Date(project.timeline_start), 'MMM dd, yyyy', { locale: userLanguage === 'da' ? da : undefined })} -{' '}
                    {format(new Date(project.timeline_end), 'MMM dd, yyyy', { locale: userLanguage === 'da' ? da : undefined })}
                  </span>
                </div>
              )}

              {project.team_size && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{t('projectDetail.teamSize')}: {project.team_size}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Project Progress */}
        <Card>
          <CardContent className="pt-6">
            <ProjectProgress
              variant="full"
              flags={{
                hasMorphology: isMorphologyComplete(project.morphology),
                hasDocuments: documents.length > 0,
                hasDna: !!project.dna_code,
                hasReviewedActions: blindSpots.some(
                  (bs) => bs.status === 'acknowledged' || bs.status === 'addressed',
                ),
              }}
            />
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="documents" className="space-y-6">

          <TabsList>
            <TabsTrigger value="documents">{t('projectDetail.tabs.documents')} ({documents.length})</TabsTrigger>
            <TabsTrigger value="morphology" disabled={!project.dna_code}>
              {t('projectDetail.tabs.morphology')}
            </TabsTrigger>
            <TabsTrigger value="insights" disabled={!project.dna_code}>
              {t('projectDetail.tabs.aiInsights')}
            </TabsTrigger>
            <TabsTrigger value="blind-spots">
              {t('projectDetail.tabs.blindSpots')}
            </TabsTrigger>
            <TabsTrigger value="visualizations" disabled={!project.dna_code}>
              {t('projectDetail.tabs.visualizations')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="documents">
            <DocumentUpload
              projectId={project.id}
              documents={documents}
              onUploadSuccess={fetchDocuments}
            />
          </TabsContent>

          <TabsContent value="morphology">
            {project.dna_code && project.morphology && (
              <MorphologicalBox
                morphology={project.morphology}
                dnaCode={project.dna_code}
                onReassess={() => setMorphologyWizardOpen(true)}
                projectId={project.id}
                language={i18n.language as 'en' | 'da'}
                onMorphologyChange={async (updatedMorphology) => {
                  const normalized = normalizeMorphology(updatedMorphology);
                  const newDnaCode = generateDnaCode(normalized);

                  const { error } = await supabase
                    .from('projects')
                    .update({
                      morphology: normalized,
                      dna_code: newDnaCode
                    })
                    .eq('id', id);

                  // Throw rather than return: MorphologicalBox awaits this
                  // before regenerating the Theory U analysis, and must not
                  // regenerate against a row that was never written.
                  if (error) throw error;

                  setProject(prev => prev ? {
                    ...prev,
                    morphology: normalized,
                    dna_code: newDnaCode
                  } : null);
                }}
              />
            )}
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            {project.dna_code && project.morphology && (
              <InsightsPanel
                projectId={project.id}
                projectName={projectName}
                morphology={project.morphology}
              />
            )}
          </TabsContent>

          <TabsContent value="blind-spots" className="space-y-6">
            <BlindSpotsPanel projectId={project.id} />
          </TabsContent>

          <TabsContent value="visualizations" className="space-y-6">
            {project.dna_code && project.morphology && (
              <Tabs value={activeVisualizationTab} onValueChange={setActiveVisualizationTab} className="space-y-6">
                <TabsList>
                  <TabsTrigger value="weather">
                    {t('visualizations.culturalWeather.title')}
                  </TabsTrigger>
                  <TabsTrigger value="ujourney">
                    {t('visualizations.uJourney.title')}
                  </TabsTrigger>
                  <TabsTrigger value="idg">
                    {t('visualizations.idgRadar.title')}
                  </TabsTrigger>
                  <TabsTrigger value="bodyscan">
                    {t('visualizations.bodyScan.title')}
                  </TabsTrigger>
                  <TabsTrigger value="blob">
                    {t('visualizations.blob.title')}
                  </TabsTrigger>
                </TabsList>
                
                <div className="min-h-[400px]">
                  {activeVisualizationTab === 'weather' && (
                    <ErrorBoundary>
                      <CulturalWeatherMap 
                        morphology={previewMorphology || project.morphology}
                        idgProfile={
                          previewIDG || 
                          projectIDGScores?.weatherScores || 
                          project.patterns?.idg_profile
                        }
                        theoryUAnalysis={project.theory_u_analysis}
                        recommendations={project.patterns?.recommendations || []}
                        interventions={project.patterns?.interventions || []}
                        blindSpots={blindSpots}
                        projectId={project.id}
                        documents={documents}
                        onMorphologyChange={(updated) => {
                          setPreviewMorphology(updated);
                          setHasUnsavedChanges(true);
                        }}
                        onIDGChange={(updated) => {
                          setPreviewIDG(updated);
                          setHasUnsavedChanges(true);
                        }}
                        onSaveChanges={handleSaveChanges}
                        onReset={handleReset}
                        hasChanges={hasUnsavedChanges}
                        showControlPanel={true}
                      />
                    </ErrorBoundary>
                  )}
                  
                  {activeVisualizationTab === 'ujourney' && (
                    <ErrorBoundary>
                      <UJourneyTimeline 
                        morphology={project.morphology}
                        projectId={project.id}
                        projectName={projectName}
                      />
                    </ErrorBoundary>
                  )}
                  
                  {activeVisualizationTab === 'idg' && (
                    <ErrorBoundary>
                      <IDGRadarChart 
                        morphology={previewMorphology || project.morphology} 
                        documents={documents}
                        precalculatedScores={projectIDGScores?.radarScores}
                      />
                    </ErrorBoundary>
                  )}
                  
                  {activeVisualizationTab === 'bodyscan' && (
                    <ErrorBoundary>
                      <ProjectBodyScan 
                        morphology={project.morphology}
                        documents={documents}
                        projectPatterns={project.patterns}
                      />
                    </ErrorBoundary>
                  )}
                  
                  {activeVisualizationTab === 'blob' && (
                    <ErrorBoundary>
                      <MorphologyBlob 
                        morphology={project.morphology} 
                        projectId={project.id}
                      />
                    </ErrorBoundary>
                  )}
                </div>
              </Tabs>
            )}
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <MorphologyWizard
          open={morphologyWizardOpen}
          onOpenChange={setMorphologyWizardOpen}
          projectId={project.id}
          onSuccess={fetchProject}
        />

        <AlertDialog
          open={pendingNavigation !== null}
          onOpenChange={(open) => { if (!open) setPendingNavigation(null); }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('projectDetail.unsavedChanges.title')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('projectDetail.unsavedChanges.description')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('projectDetail.unsavedChanges.stay')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  const target = pendingNavigation;
                  setPendingNavigation(null);
                  setHasUnsavedChanges(false);
                  if (target) navigate(target);
                }}
              >
                {t('projectDetail.unsavedChanges.leave')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <EditProjectDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          project={project}
          onSuccess={fetchProject}
        />
      </div>
    </DashboardLayout>
  );
}
