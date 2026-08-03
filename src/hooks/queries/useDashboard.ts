import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { profileKeys, projectKeys } from './keys';

/**
 * Number of documents across the given projects.
 *
 * Scoped explicitly rather than relying on RLS: an admin's policy spans every
 * project, so an unfiltered count reported the whole instance on their
 * dashboard.
 */
export function useDocumentCount(projectIds: string[], enabled = true) {
  return useQuery({
    queryKey: [...projectKeys.all, 'documentCount', [...projectIds].sort()] as const,
    queryFn: async (): Promise<number> => {
      if (projectIds.length === 0) return 0;

      const { count, error } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .in('project_id', projectIds);

      if (error) throw error;
      return count ?? 0;
    },
    enabled,
  });
}

export interface UserProfileSummary {
  ai_messages_used_this_month: number;
  subscription_tier: string;
}

export function useUserProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: profileKeys.detail(user?.id),
    queryFn: async (): Promise<UserProfileSummary | null> => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('ai_messages_used_this_month, subscription_tier')
        .eq('id', user!.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}
