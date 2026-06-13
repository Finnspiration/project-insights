import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, Edit, Trash2, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Project } from '@/types/project';
import { ProjectProgress } from './ProjectProgress';

interface ProjectCardProps {
  project: Project & { is_demo?: boolean | null; documentCount?: number; hasReviewedActions?: boolean };
  onEdit: (project: Project) => void;
  onDelete: () => void;
  onAssess?: (project: Project) => void;
}


export function ProjectCard({ project, onEdit, onDelete, onAssess }: ProjectCardProps) {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const userLanguage = (profile?.preferred_language || 'en') as 'en' | 'da';
  const projectName = project.name[userLanguage] || project.name.en;
  const projectDescription = project.description?.[userLanguage] || project.description?.en || '';

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', project.id);

      if (error) throw error;

      toast.success(t('projects.delete.success'));
      setDeleteDialogOpen(false);
      onDelete();
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error(t('projects.delete.error'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/projects/${project.id}`)}>
        <CardHeader>
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl mb-2">{projectName}</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                  {project.status}
                </Badge>
                {project.is_demo && (
                  <Badge className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                    {t('projects.card.demoBadge')}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          {projectDescription && (
            <CardDescription className="mt-2 line-clamp-2">
              {projectDescription}
            </CardDescription>
          )}
        </CardHeader>


        <CardContent className="space-y-3">
          {/* DNA Code Badge */}
          {project.dna_code && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-mono text-xs">
                DNA: {project.dna_code.split('-').slice(0, 3).join('-')}...
              </Badge>
            </div>
          )}

          {project.timeline_start && project.timeline_end && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {format(new Date(project.timeline_start), 'MMM dd, yyyy')} {t('projects.card.to')}{' '}
                {format(new Date(project.timeline_end), 'MMM dd, yyyy')}
              </span>
            </div>
          )}

          {project.team_size && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>
                {t('projects.card.teamSize')}: {project.team_size}
              </span>
            </div>
          )}

          <ProjectProgress
            variant="compact"
            flags={{
              hasMorphology: !!project.morphology && Object.keys(project.morphology || {}).length >= 12,
              hasDocuments: (project.documentCount ?? 0) > 0,
              hasDna: !!project.dna_code,
              hasReviewedActions: !!project.hasReviewedActions,
            }}
          />
        </CardContent>


        <CardFooter className="gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
          {!project.dna_code && onAssess && (
            <Button
              variant="default"
              size="sm"
              className="gap-2"
              onClick={() => onAssess(project)}
            >
              <Sparkles className="h-4 w-4" />
              Assess Project
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => onEdit(project)}
          >
            <Edit className="h-4 w-4" />
            {t('projects.card.edit')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-destructive hover:text-destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            {t('projects.card.delete')}
          </Button>
        </CardFooter>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('projects.delete.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('projects.delete.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {t('projects.delete.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? t('projects.create.creating') : t('projects.delete.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
