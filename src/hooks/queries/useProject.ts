import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { generateDnaCode, normalizeMorphology, type Morphology } from '@shared/morphology.ts';
import type { BlindSpot, Project, ProjectDocument, ProjectPatterns } from '@/types/project';
import { projectKeys } from './keys';

const DOCUMENT_COLUMNS =
  'id, project_id, filename, file_path, file_type, file_size, uploaded_at, processed, content, language, metadata';

/**
 * One project, with its morphology normalized to the canonical flat format.
 *
 * A stale dna_code (written before the format was unified) is repaired here
 * rather than by every reader, so the value the UI shows is always the
 * canonical one for the stored morphology.
 */
async function fetchProject(projectId: string): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (error) throw error;

  const project = data as unknown as Project;

  if (project.morphology) {
    project.morphology = normalizeMorphology(project.morphology);
  }

  const expectedDnaCode = generateDnaCode(project.morphology);
  if (expectedDnaCode && project.dna_code !== expectedDnaCode) {
    project.dna_code = expectedDnaCode;
    const { error: repairError } = await supabase
      .from('projects')
      .update({ dna_code: expectedDnaCode })
      .eq('id', projectId);
    if (repairError) {
      console.error('Failed to repair dna_code:', repairError);
    }
  }

  return project;
}

export function useProject(projectId: string | undefined) {
  return useQuery({
    queryKey: projectKeys.detail(projectId),
    queryFn: () => fetchProject(projectId!),
    enabled: !!projectId,
  });
}

export function useProjectDocuments(projectId: string | undefined) {
  return useQuery({
    queryKey: projectKeys.documents(projectId),
    queryFn: async (): Promise<ProjectDocument[]> => {
      const { data, error } = await supabase
        .from('documents')
        .select(DOCUMENT_COLUMNS)
        .eq('project_id', projectId!)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as unknown as ProjectDocument[];
    },
    enabled: !!projectId,
  });
}

export function useProjectBlindSpots(projectId: string | undefined) {
  return useQuery({
    queryKey: projectKeys.blindSpots(projectId),
    queryFn: async (): Promise<BlindSpot[]> => {
      const { data, error } = await supabase
        .from('blind_spots')
        .select('*')
        .eq('project_id', projectId!)
        .order('priority', { ascending: false });

      if (error) throw error;
      return (data ?? []) as unknown as BlindSpot[];
    },
    enabled: !!projectId,
  });
}

export interface DnaSnapshot {
  id: string;
  dna_code: string | null;
  morphology: Morphology;
  recorded_at: string;
}

/**
 * The project's assessment over time, oldest first.
 *
 * Written by a database trigger on projects.morphology, so it captures every
 * write path — the wizard, the morphological box, the weather-map editor and
 * the edge functions — without any of them having to remember.
 */
export function useProjectDnaHistory(projectId: string | undefined) {
  return useQuery({
    queryKey: projectKeys.dnaHistory(projectId),
    queryFn: async (): Promise<DnaSnapshot[]> => {
      const { data, error } = await supabase
        .from('project_dna_history')
        .select('id, dna_code, morphology, recorded_at')
        .eq('project_id', projectId!)
        .order('recorded_at', { ascending: true });

      // The table arrives with a migration; until it is applied the timeline
      // should be absent, not an error page.
      if (error) {
        console.warn('DNA history unavailable:', error.message);
        return [];
      }
      return (data ?? []) as unknown as DnaSnapshot[];
    },
    enabled: !!projectId,
    retry: false,
  });
}

export interface ProjectListItem {
  id: string;
  name: Project['name'];
  description: Project['description'];
  dna_code: string | null;
  status: string;
  created_at: string;
  is_demo: boolean;
}

export function useProjects() {
  const { user } = useAuth();
  return useQuery({
    queryKey: projectKeys.list(user?.id),
    queryFn: async (): Promise<ProjectListItem[]> => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, description, dna_code, status, created_at, is_demo')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as unknown as ProjectListItem[];
    },
    enabled: !!user,
  });
}

/** Full project rows, for the projects list which renders cards from them. */
export function useProjectsFull() {
  const { user } = useAuth();
  return useQuery({
    queryKey: [...projectKeys.list(user?.id), 'full'] as const,
    queryFn: async (): Promise<Project[]> => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as unknown as Project[];
    },
    enabled: !!user,
  });
}

export interface SaveMorphologyInput {
  projectId: string;
  morphology?: Morphology | null;
  idgProfile?: ProjectPatterns['idg_profile'];
  currentPatterns?: ProjectPatterns | null;
}

/**
 * Saves a morphology and/or IDG profile edit.
 *
 * The DNA code is always derived from the morphology, and `patterns` is merged
 * rather than replaced — it also carries the generated insights and the
 * aggregation metadata.
 */
export function useSaveProjectAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, morphology, idgProfile, currentPatterns }: SaveMorphologyInput) => {
      const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

      if (morphology) {
        const normalized = normalizeMorphology(morphology);
        update.morphology = normalized;
        update.dna_code = generateDnaCode(normalized);
      }

      if (idgProfile) {
        update.patterns = { ...(currentPatterns ?? {}), idg_profile: idgProfile };
      }

      const { error } = await supabase.from('projects').update(update).eq('id', projectId);
      if (error) throw error;

      return update;
    },
    onSuccess: (_result, { projectId }) => {
      // detail() is the parent key of documents, blindSpots and dnaHistory, so
      // this refreshes the timeline the trigger has just appended to.
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}
