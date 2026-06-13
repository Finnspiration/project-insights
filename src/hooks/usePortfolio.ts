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
    .select('id, name, morphology, team_size, dna_code, theory_u_analysis')
    .eq('user_id', userId)
    .not('morphology', 'is', null);

  if (projectsError) throw projectsError;

  const assessed = (projects || []).filter((p) => p.morphology) as PortfolioProject[];
  const ids = assessed.map((p) => p.id);

  if (ids.length === 0) {
    return { projects: assessed, blindSpots: [] };
  }

  const { data: blindSpots, error: blindSpotsError } = await supabase
    .from('blind_spots')
    .select('id, project_id, title, priority, confidence, status')
    .in('project_id', ids);

  if (blindSpotsError) throw blindSpotsError;

  return { projects: assessed, blindSpots: (blindSpots || []) as PortfolioBlindSpot[] };
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
