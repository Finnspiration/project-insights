import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend,
} from 'recharts';
import { Target } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePortfolio } from '@/hooks/usePortfolio';
import { calculateIDGScoresFromMorphology } from '@/lib/idgScoring';

const IDG_DIMENSIONS = ['being', 'thinking', 'relating', 'collaborating', 'acting'] as const;
type DimensionKey = (typeof IDG_DIMENSIONS)[number];
type Scores = Record<DimensionKey, number>;
interface PortfolioProject { id: string; name: string; scores: Scores; }

function readName(name: unknown, lang: string, fallback: string): string {
  if (typeof name === 'string') return name;
  const obj = name as { en?: string; da?: string } | null;
  return obj?.[lang as 'en' | 'da'] || obj?.en || fallback;
}
const avg = (values: number[]) =>
  values.length ? Math.round(values.reduce((sum, v) => sum + v, 0) / values.length) : 0;

export function PortfolioIDGRadar() {
  const { t, i18n } = useTranslation('common');
  const { user } = useAuth();
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, i18n.language]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data } = await supabase
        .from('projects').select('id, name, morphology')
        .eq('user_id', user!.id).not('morphology', 'is', null);
      const mapped: PortfolioProject[] = (data || [])
        .filter((p) => p.morphology)
        .map((p) => ({
          id: p.id,
          name: readName(p.name, i18n.language, t('common.untitled', 'Untitled')),
          scores: calculateIDGScoresFromMorphology(p.morphology).radarScores as Scores,
        }));
      setProjects(mapped);
      setSelectedId((prev) => (mapped.some((p) => p.id === prev) ? prev : mapped[0]?.id || ''));
    } catch (error) {
      console.error('Error building portfolio IDG radar:', error);
    } finally { setLoading(false); }
  };

  const portfolioScores = useMemo(() => {
    const result = { being: 0, thinking: 0, relating: 0, collaborating: 0, acting: 0 };
    IDG_DIMENSIONS.forEach((dim) => { result[dim] = avg(projects.map((p) => p.scores[dim] ?? 50)); });
    return result;
  }, [projects]);

  const selected = projects.find((p) => p.id === selectedId);
  const chartData = IDG_DIMENSIONS.map((dim) => ({
    dimension: t(`visualizations.idgRadar.dimensions.${dim}`),
    portfolio: portfolioScores[dim],
    project: selected?.scores[dim] ?? 0,
  }));

  const deltas = useMemo(() => {
    if (!selected) return null;
    const list = IDG_DIMENSIONS.map((dim) => ({
      dim, label: t(`visualizations.idgRadar.dimensions.${dim}`),
      delta: (selected.scores[dim] ?? 0) - portfolioScores[dim],
    }));
    const sorted = [...list].sort((a, b) => b.delta - a.delta);
    return { strongest: sorted[0], weakest: sorted[sorted.length - 1] };
  }, [selected, portfolioScores, t]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-64 w-full" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (projects.length < 2) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          {t('visualizations.portfolioIdg.title')}
        </CardTitle>
        <CardDescription>
          {t('visualizations.portfolioIdg.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Project selector */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium whitespace-nowrap">
              {t('visualizations.portfolioIdg.overlayLabel')}
            </span>
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Radar Chart */}
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={chartData}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis
                dataKey="dimension"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
              <Radar
                name={t('visualizations.portfolioIdg.legend.portfolio')}
                dataKey="portfolio"
                stroke="hsl(var(--muted-foreground))"
                fill="hsl(var(--muted-foreground))"
                fillOpacity={0.1}
                strokeDasharray="6 4"
                strokeWidth={2}
              />
              <Radar
                name={t('visualizations.portfolioIdg.legend.project')}
                dataKey="project"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.25}
                strokeWidth={2}
              />
              <Legend
                wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
              />
            </RadarChart>
          </ResponsiveContainer>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-muted rounded-lg text-center">
              <div className="text-2xl font-bold">
                {avg(IDG_DIMENSIONS.map((d) => portfolioScores[d]))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('visualizations.portfolioIdg.stats.portfolioAvg')}
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg text-center">
              <div className="text-2xl font-bold text-primary">
                {selected ? avg(IDG_DIMENSIONS.map((d) => selected.scores[d])) : 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('visualizations.portfolioIdg.stats.projectAvg')}
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">
                {deltas ? `${deltas.strongest.label} +${deltas.strongest.delta}` : '—'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('visualizations.portfolioIdg.stats.strongest')}
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg text-center">
              <div className="text-2xl font-bold text-orange-500">
                {deltas ? `${deltas.weakest.label} ${deltas.weakest.delta}` : '—'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('visualizations.portfolioIdg.stats.biggestGap')}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
