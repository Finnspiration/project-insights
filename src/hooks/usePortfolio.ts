import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Raw rows shared by all portfolio-level dashboard visualizations. Each consumer
// derives its own view (constellation points, IDG scores, risk matrix) from this
// single cached fetch instead of querying projects/blind_spots independently.
export interface PortfolioProject {
  id: string;
  name: unknown; // { en, da } | string
  morphology: any;
  team_size: number | null;
  dna_code: string | null;
  theory_u_analysis: any;
  is_demo?: boolean | null;
  documentCount?: number;
  hasReviewedActions?: boolean;
}

export interface PortfolioBlindSpot {
  id: string;
  project_id: string;
  title: unknown; // { en, da } | string
  priority: string | null;
  confidence: number | null;
  status: string | null;
}

export interface PortfolioData {
  projects: PortfolioProject[];
  blindSpots: PortfolioBlindSpot[];
}

async function fetchPortfolio(userId: string): Promise<PortfolioData> {
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('id, name, morphology, team_size, dna_code, theory_u_analysis, is_demo')
    .eq('user_id', userId)
    .not('morphology', 'is', null);

  if (projectsError) throw projectsError;

  const assessed = (projects || []).filter((p) => p.morphology) as PortfolioProject[];
  const ids = assessed.map((p) => p.id);

  if (ids.length === 0) {
    return { projects: assessed, blindSpots: [] };
  }

  const [blindSpotsRes, documentsRes] = await Promise.all([
    supabase
      .from('blind_spots')
      .select('id, project_id, title, priority, confidence, status')
      .in('project_id', ids),
    supabase
      .from('documents')
      .select('project_id')
      .in('project_id', ids),
  ]);

  if (blindSpotsRes.error) throw blindSpotsRes.error;

  const blindSpots = (blindSpotsRes.data || []) as PortfolioBlindSpot[];
  const docs = documentsRes.data || [];

  // Per-project enrichment for progress indicator.
  const docCountByProject = new Map<string, number>();
  for (const d of docs) {
    docCountByProject.set(d.project_id, (docCountByProject.get(d.project_id) || 0) + 1);
  }
  const reviewedByProject = new Map<string, boolean>();
  for (const bs of blindSpots) {
    if (bs.status === 'acknowledged' || bs.status === 'addressed') {
      reviewedByProject.set(bs.project_id, true);
    }
  }

  for (const p of assessed) {
    p.documentCount = docCountByProject.get(p.id) || 0;
    p.hasReviewedActions = reviewedByProject.get(p.id) || false;
  }

  return { projects: assessed, blindSpots };
}


// Shared across ProjectConstellation, PortfolioIDGRadar and BlindSpotRiskMatrix so
// the dashboard makes one projects + one blind_spots request instead of three each.
export function usePortfolio() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['portfolio', user?.id],
    queryFn: () => fetchPortfolio(user!.id),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}
