import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
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
// Only one visualization is mounted at a time, and three of them pull in
// three.js or recharts. Loading them per tab keeps that weight out of the
// initial ProjectDetail chunk.
const CulturalWeatherMap = lazy(() =>
  import('@/components/visualizations/CulturalWeatherMap').then((m) => ({ default: m.CulturalWeatherMap })));
const UJourneyTimeline = lazy(() =>
  import('@/components/visualizations/UJourneyTimeline').then((m) => ({ default: m.UJourneyTimeline })));
const IDGRadarChart = lazy(() =>
  import('@/components/visualizations/IDGRadarChart').then((m) => ({ default: m.IDGRadarChart })));
const ProjectBodyScan = lazy(() =>
  import('@/components/visualizations/ProjectBodyScan').then((m) => ({ default: m.ProjectBodyScan })));
const MorphologyBlob = lazy(() =>
  import('@/components/visualizations/MorphologyBlob').then((m) => ({ default: m.MorphologyBlob })));
import { InsightsPanel } from '@/components/insights/InsightsPanel';
import { BlindSpotsPanel } from '@/components/insights/BlindSpotsPanel';
import { ArrowLeft, Calendar, Users, Sparkles, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { MorphologyWizard } from '@/components/projects/MorphologyWizard';
import { EditProjectDialog } from '@/components/projects/EditProjectDialog';
import { MorphologicalBox } from '@/components/morphology/MorphologicalBox';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { calculateIDG } from '@/lib/idgScoring';
import { isMorphologyComplete, normalizeMorphology, type Morphology } from '@shared/morphology.ts';
import { ProjectProgress } from '@/components/projects/ProjectProgress';
import { localized, type IDGScores, type Language } from '@/types/project';
import {
  useProject,
  useProjectBlindSpots,
  useProjectDocuments,
  useSaveProjectAssessment,
} from '@/hooks/queries/useProject';
import { projectKeys } from '@/hooks/queries/keys';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

const VisualizationFallback = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('common');
  const { profile } = useAuth();

  const { data: project, isLoading, isError } = useProject(id);
  const { data: documents = [] } = useProjectDocuments(id);
  const { data: blindSpots = [] } = useProjectBlindSpots(id);
  const saveAssessment = useSaveProjectAssessment();
  const queryClient = useQueryClient();

  // The wizard, the edit dialog and the upload panel still write directly.
  // Invalidating the project's subtree refreshes all three queries at once.
  const refetchAll = () =>
    queryClient.invalidateQueries({ queryKey: projectKeys.detail(id) });

  const [morphologyWizardOpen, setMorphologyWizardOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Preview state for live editing (separate from the saved project)
  const [previewMorphology, setPreviewMorphology] = useState<Morphology | null>(null);
  const [previewIDG, setPreviewIDG] = useState<IDGScores | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeVisualizationTab, setActiveVisualizationTab] = useState<string>('weather');
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  const userLanguage = (profile?.preferred_language || 'en') as Language;

  // Scores for the visualizations. Documents are included, so the radar, the
  // weather map and the evidence breakdown all show the same numbers.
  const idg = useMemo(
    () => calculateIDG(previewMorphology ?? project?.morphology, documents),
    [previewMorphology, project?.morphology, documents],
  );

  const handleSaveChanges = async () => {
    // The weather map can change the morphology, the IDG profile, or both.
    // Requiring a morphology change used to make "save" a silent no-op for
    // anyone who had only moved the IDG sliders.
    if (!project || (!previewMorphology && !previewIDG)) return;

    const { toast } = await import('@/hooks/use-toast');

    try {
      await saveAssessment.mutateAsync({
        projectId: project.id,
        morphology: previewMorphology ?? undefined,
        idgProfile: previewIDG ?? undefined,
        currentPatterns: project.patterns,
      });

      setHasUnsavedChanges(false);
      setPreviewMorphology(null);
      setPreviewIDG(null);

      toast({
        title: t('common.success'),
        description: t('weather_control.changes_saved'),
      });
    } catch (error) {
      console.error('Error saving changes:', error);
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
      toast({ title: t('morphology.resetSuccess') });
    });
  };

  // Drop unsaved previews when navigating to a different project.
  useEffect(() => {
    setPreviewMorphology(null);
    setPreviewIDG(null);
    setHasUnsavedChanges(false);
  }, [id]);

  // Warn about unsaved changes before leaving the page
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

  if (isLoading) {
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

  // isError covers a genuine failure (network, RLS); !project covers a project
  // that does not exist. The old code showed "not found" for both, which hid
  // permission and connectivity problems behind a wrong message.
  if (isError || !project) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8 text-center">
          <h2 className="text-2xl font-bold mb-4">
            {isError ? t('projectDetail.loadFailed') : t('projectDetail.notFound')}
          </h2>
          <Button onClick={() => navigate('/projects')}>{t('projectDetail.backToProjects')}</Button>
        </div>
      </DashboardLayout>
    );
  }

  const projectName = localized(project.name, userLanguage);
  const projectDescription = localized(project.description, userLanguage);

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
              onUploadSuccess={refetchAll}
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
                  // mutateAsync rejects on failure, and MorphologicalBox awaits
                  // this before regenerating the Theory U analysis — it must
                  // not regenerate against a row that was never written.
                  await saveAssessment.mutateAsync({
                    projectId: project.id,
                    morphology: normalizeMorphology(updatedMorphology),
                  });
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
                      <Suspense fallback={<VisualizationFallback />}>
                      <CulturalWeatherMap 
                        morphology={previewMorphology || project.morphology}
                        idgProfile={previewIDG ?? idg.weather}
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
                      </Suspense>
                    </ErrorBoundary>
                  )}
                  
                  {activeVisualizationTab === 'ujourney' && (
                    <ErrorBoundary>
                      <Suspense fallback={<VisualizationFallback />}>
                      <UJourneyTimeline 
                        morphology={project.morphology}
                        projectId={project.id}
                        projectName={projectName}
                      />
                      </Suspense>
                    </ErrorBoundary>
                  )}
                  
                  {activeVisualizationTab === 'idg' && (
                    <ErrorBoundary>
                      <Suspense fallback={<VisualizationFallback />}>
                      <IDGRadarChart 
                        morphology={previewMorphology || project.morphology} 
                        documents={documents}
                        precalculatedScores={idg.radar}
                      />
                      </Suspense>
                    </ErrorBoundary>
                  )}
                  
                  {activeVisualizationTab === 'bodyscan' && (
                    <ErrorBoundary>
                      <Suspense fallback={<VisualizationFallback />}>
                      <ProjectBodyScan 
                        morphology={project.morphology}
                        documents={documents}
                        projectPatterns={project.patterns}
                      />
                      </Suspense>
                    </ErrorBoundary>
                  )}
                  
                  {activeVisualizationTab === 'blob' && (
                    <ErrorBoundary>
                      <Suspense fallback={<VisualizationFallback />}>
                      <MorphologyBlob 
                        morphology={project.morphology} 
                        projectId={project.id}
                      />
                      </Suspense>
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
          onSuccess={refetchAll}
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
          onSuccess={refetchAll}
        />
      </div>
    </DashboardLayout>
  );
}
