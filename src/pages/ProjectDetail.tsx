import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { MorphologyWizard } from '@/components/projects/MorphologyWizard';
import { EditProjectDialog } from '@/components/projects/EditProjectDialog';
import { MorphologicalBox } from '@/components/morphology/MorphologicalBox';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface Project {
  id: string;
  name: { en: string; da: string };
  description?: { en: string; da: string };
  timeline_start?: string;
  timeline_end?: string;
  team_size?: number;
  status: string;
  dna_code?: string;
  morphology?: any;
  patterns?: any;
  theory_u_analysis?: any;
}

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
      setProject(data);
    } catch (error) {
      console.error('Error fetching project:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProjectMorphology = async (newMorphology: any) => {
    if (!project) return;
    
    // Optimistic update - no loading state flash
    setProject({
      ...project,
      morphology: newMorphology
    });
  };

  const handleSaveChanges = async () => {
    if (!previewMorphology || !project) return;
    
    try {
      // Generate new DNA code from preview morphology
      const dimensionKeys = Object.keys(previewMorphology);
      const newDnaCode = dimensionKeys
        .map(key => previewMorphology[key]?.selectedValue || '')
        .filter(Boolean)
        .join('-');
      
      // Save to database
      const { error } = await supabase
        .from('projects')
        .update({
          morphology: previewMorphology,
          dna_code: newDnaCode,
          updated_at: new Date().toISOString()
        })
        .eq('id', project.id);
      
      if (error) throw error;
      
      // Update local state
      setProject({ ...project, morphology: previewMorphology, dna_code: newDnaCode });
      setOriginalMorphology(previewMorphology);
      setHasUnsavedChanges(false);
      setPreviewMorphology(null);
      setPreviewIDG(null);
      
      const { toast } = await import('@/hooks/use-toast');
      toast({
        title: t('common.success'),
        description: 'Ændringer gemt!',
      });
    } catch (error) {
      console.error('Error saving changes:', error);
      const { toast } = await import('@/hooks/use-toast');
      toast({
        title: t('common.error'),
        description: 'Kunne ikke gemme ændringer',
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
        title: 'Nulstillet',
        description: 'Gået tilbage til original morfologi',
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading project...</p>
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
          <h2 className="text-2xl font-bold mb-4">Project not found</h2>
          <Button onClick={() => navigate('/projects')}>Back to Projects</Button>
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
          <Button variant="ghost" size="icon" onClick={() => navigate('/projects')}>
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
                    {format(new Date(project.timeline_start), 'MMM dd, yyyy')} -{' '}
                    {format(new Date(project.timeline_end), 'MMM dd, yyyy')}
                  </span>
                </div>
              )}

              {project.team_size && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Team Size: {project.team_size}</span>
                </div>
              )}
            </div>
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
                  // Generate new DNA code
                  const dnaSegments = Object.entries(updatedMorphology).map(([_, value]) => value);
                  const newDnaCode = dnaSegments.join('-');
                  
                  // Update database
                  const { error } = await supabase
                    .from('projects')
                    .update({ 
                      morphology: updatedMorphology,
                      dna_code: newDnaCode 
                    })
                    .eq('id', id);
                  
                  if (!error) {
                    // Update local state
                    setProject(prev => prev ? { 
                      ...prev, 
                      morphology: updatedMorphology,
                      dna_code: newDnaCode 
                    } : null);
                  }
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
                        idgProfile={previewIDG || project.patterns?.idg_profile}
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
                      <IDGRadarChart morphology={project.morphology} documents={documents} />
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
                        onMorphologyUpdate={updateProjectMorphology}
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
