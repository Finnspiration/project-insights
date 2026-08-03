import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Plus, FolderPlus } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { CreateProjectDialog } from '@/components/projects/CreateProjectDialog';
import { EditProjectDialog } from '@/components/projects/EditProjectDialog';
import { MorphologyWizard } from '@/components/projects/MorphologyWizard';
import { EmptyState } from '@/components/empty/EmptyState';
import type { Project } from '@/types/project';
import { useProjectsFull } from '@/hooks/queries/useProject';
import { projectKeys } from '@/hooks/queries/keys';



export default function Projects() {
  const { t } = useTranslation('common');
  const { data: projects = [], isLoading } = useProjectsFull();
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [morphologyWizardOpen, setMorphologyWizardOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // The create/edit/assess dialogs still write directly; invalidating the
  // project queries refreshes this list and any open detail page at once.
  const fetchProjects = () => queryClient.invalidateQueries({ queryKey: projectKeys.all });

  const handleEdit = (project: Project) => {
    setSelectedProject(project);
    setEditDialogOpen(true);
  };

  const handleAssess = (project: Project) => {
    setSelectedProject(project);
    setMorphologyWizardOpen(true);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">{t('projects.loading')}</p>
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
              {t('projects.count', { count: projects.length })}
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-5 w-5" />
            {t('projects.create.title')}
          </Button>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <EmptyState
            icon={FolderPlus}
            eyebrow={t('projects.emptyState.eyebrow')}
            title={t('projects.emptyState.title')}
            description={t('projects.emptyState.description')}
            primaryAction={{
              label: t('projects.emptyState.action'),
              onClick: () => setCreateDialogOpen(true),
              icon: Plus,
            }}
          />

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
