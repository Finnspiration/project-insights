import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Plus, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { CreateProjectDialog } from '@/components/projects/CreateProjectDialog';
import { EditProjectDialog } from '@/components/projects/EditProjectDialog';
import { MorphologyWizard } from '@/components/projects/MorphologyWizard';

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
}

export default function Projects() {
  const { t } = useTranslation('common');
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [morphologyWizardOpen, setMorphologyWizardOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const fetchProjects = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [user]);

  const handleEdit = (project: Project) => {
    setSelectedProject(project);
    setEditDialogOpen(true);
  };

  const handleAssess = (project: Project) => {
    setSelectedProject(project);
    setMorphologyWizardOpen(true);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading projects...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t('projects.title')}</h1>
            <p className="text-muted-foreground">
              {projects.length} {projects.length === 1 ? 'project' : 'projects'}
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-5 w-5" />
            {t('projects.create.title')}
          </Button>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 blur-3xl rounded-full" />
              <Sparkles className="relative h-24 w-24 text-primary" />
            </div>
            
            <h2 className="text-2xl font-bold mb-4">
              {t('projects.emptyState.title')}
            </h2>
            
            <p className="text-muted-foreground mb-8 max-w-md">
              {t('projects.emptyState.description')}
            </p>
            
            <Button size="lg" onClick={() => setCreateDialogOpen(true)} className="gap-2">
              <Plus className="h-5 w-5" />
              {t('projects.emptyState.action')}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onEdit={handleEdit}
                onDelete={fetchProjects}
                onAssess={handleAssess}
              />
            ))}
          </div>
        )}

        {/* Dialogs */}
        <CreateProjectDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSuccess={fetchProjects}
        />

        <EditProjectDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          project={selectedProject}
          onSuccess={fetchProjects}
        />

        {selectedProject && (
          <MorphologyWizard
            open={morphologyWizardOpen}
            onOpenChange={setMorphologyWizardOpen}
            projectId={selectedProject.id}
            onSuccess={fetchProjects}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
