import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import { Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { calculateIDGScoresFromMorphology } from '@/lib/idgScoring';

const COMPLEXITY = ['simple', 'complicated', 'complex', 'chaotic'] as const;
const ORG_STAGE = ['red', 'amber', 'orange', 'green', 'teal'] as const;
const FOCUS = ['being', 'thinking', 'relating', 'collaborating', 'acting'] as const;
type FocusKey = (typeof FOCUS)[number];

const FOCUS_COLORS: Record<FocusKey, string> = {
  being: '#8B5CF6',
  thinking: '#3B82F6',
  relating: '#EC4899',
  collaborating: '#10B981',
  acting: '#F59E0B',
};
const RISK_STROKE = 'hsl(var(--destructive))';

interface ConstellationPoint {
  id: string;
  name: string;
  x: number;
  y: number;
  team: number;
  blind: number;
  focus: FocusKey;
  idg: number;
}

function readDim(morphology: any, key: string): string | undefined {
  if (!morphology) return undefined;
  const value = morphology[key];
  if (!value) return undefined;
  return typeof value === 'string' ? value : value.selectedValue;
}

function jitter(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return ((Math.abs(hash) % 1000) / 1000 - 0.5) * 0.5;
}

export function ProjectConstellation() {
  const { t, i18n } = useTranslation('common');
  const navigate = useNavigate();
  const { user } = useAuth();
  const [points, setPoints] = useState<ConstellationPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchConstellation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, i18n.language]);

  const fetchConstellation = async () => {
    try {
      setLoading(true);
      const { data: projects } = await supabase
        .from('projects')
        .select('id, name, morphology, team_size, dna_code')
        .eq('user_id', user!.id)
        .not('morphology', 'is', null);

      const assessed = (projects || []).filter((p) => p.morphology);
      const ids = assessed.map((p) => p.id);
      const openByProject: Record<string, number> = {};
      if (ids.length > 0) {
        const { data: blindSpots } = await supabase
          .from('blind_spots')
          .select('project_id, status')
          .in('project_id', ids);
        (blindSpots || []).forEach((bs: any) => {
          if (bs.status !== 'addressed') {
            openByProject[bs.project_id] = (openByProject[bs.project_id] || 0) + 1;
          }
        });
      }

      const mapped: ConstellationPoint[] = assessed.map((p: any) => {
        const complexity = readDim(p.morphology, 'complexity') ?? 'complex';
        const organizational = readDim(p.morphology, 'organizational') ?? 'orange';
        const development = (readDim(p.morphology, 'development') ?? 'thinking') as FocusKey;
        const focus = (FOCUS as readonly string[]).includes(development) ? development : 'thinking';
        const xIndex = Math.max(0, COMPLEXITY.indexOf(complexity as (typeof COMPLEXITY)[number]));
        const yIndex = Math.max(0, ORG_STAGE.indexOf(organizational as (typeof ORG_STAGE)[number]));
        const radar = calculateIDGScoresFromMorphology(p.morphology).radarScores;
        const idg = Math.round(
          (radar.being + radar.thinking + radar.relating + radar.collaborating + radar.acting) / 5
        );
        const nameField = p.name as { en?: string; da?: string } | string | null;
        const name =
          typeof nameField === 'string'
            ? nameField
            : nameField?.[i18n.language as 'en' | 'da'] || nameField?.en || t('common.untitled', 'Untitled');
        return {
          id: p.id,
          name,
          x: xIndex + jitter(p.id),
          y: yIndex + jitter(p.id + 'y'),
          team: p.team_size || 3,
          blind: openByProject[p.id] || 0,
          focus,
          idg,
        };
      });
      setPoints(mapped);
    } catch (error) {
      console.error('Error building project constellation:', error);
    } finally {
      setLoading(false);
    }
  };

  const summary = useMemo(() => {
    const total = points.length;
    const openBlind = points.reduce((s, p) => s + p.blind, 0);
    const atRisk = points.filter((p) => p.blind > 0).length;
    const avgIdg = total ? Math.round(points.reduce((s, p) => s + p.idg, 0) / total) : 0;
    return { total, openBlind, atRisk, avgIdg };
  }, [points]);

  if (loading) return <Skeleton className="h-[520px] w-full" />;
  if (points.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          {t('visualizations.constellation.title')}
        </CardTitle>
        <CardDescription>{t('visualizations.constellation.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg border p-3">
            <p className="text-2xl font-bold">{summary.total}</p>
            <p className="text-xs text-muted-foreground">
              {t('visualizations.constellation.stats.projects')}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-2xl font-bold">{summary.openBlind}</p>
            <p className="text-xs text-muted-foreground">
              {t('visualizations.constellation.stats.openBlindSpots')}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-2xl font-bold">{summary.atRisk}</p>
            <p className="text-xs text-muted-foreground">
              {t('visualizations.constellation.stats.atRisk')}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-2xl font-bold">{summary.avgIdg}</p>
            <p className="text-xs text-muted-foreground">
              {t('visualizations.constellation.stats.avgIdg')}
            </p>
          </div>
        </div>

        <div className="h-[420px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 24, bottom: 32, left: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                type="number"
                dataKey="x"
                domain={[-0.5, COMPLEXITY.length - 0.5]}
                ticks={COMPLEXITY.map((_, i) => i)}
                tickFormatter={(v: number) =>
                  t(`morphology.dimensions.complexity.options.${COMPLEXITY[v]}`)
                    .split(' ')[0]
                    .replace(/[-–]/, '')
                }
                label={{
                  value: t('morphology.dimensions.complexity.title'),
                  position: 'insideBottom',
                  offset: -12,
                  fill: 'hsl(var(--muted-foreground))',
                  fontSize: 12,
                }}
              />
              <YAxis
                type="number"
                dataKey="y"
                domain={[-0.5, ORG_STAGE.length - 0.5]}
                ticks={ORG_STAGE.map((_, i) => i)}
                tickFormatter={(v: number) =>
                  t(`morphology.dimensions.organizational.options.${ORG_STAGE[v]}`)
                    .split(' ')[0]
                    .replace(/[-–]/, '')
                }
                label={{
                  value: t('morphology.dimensions.organizational.title'),
                  angle: -90,
                  position: 'insideLeft',
                  fill: 'hsl(var(--muted-foreground))',
                  fontSize: 12,
                }}
              />
              <ZAxis type="number" dataKey="team" range={[80, 400]} />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }: any) => {
                  if (!active || !payload || !payload.length) return null;
                  const p = payload[0].payload as ConstellationPoint;
                  return (
                    <div className="rounded-lg border bg-popover p-2 text-popover-foreground shadow-md">
                      <p className="font-medium text-sm">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t('visualizations.idgRadar.dimensions.' + p.focus)} ·{' '}
                        {t('visualizations.constellation.tooltip.team', { count: p.team })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t('visualizations.constellation.tooltip.blindSpots', { count: p.blind })} · IDG {p.idg}
                      </p>
                    </div>
                  );
                }}
              />
              <Scatter
                data={points}
                onClick={(node: any) => {
                  const point = node as unknown as ConstellationPoint;
                  if (point?.id) navigate(`/projects/${point.id}`);
                }}
                style={{ cursor: 'pointer' }}
              >
                {points.map((p) => (
                  <Cell
                    key={p.id}
                    fill={FOCUS_COLORS[p.focus]}
                    stroke={p.blind > 0 ? RISK_STROKE : FOCUS_COLORS[p.focus]}
                    strokeWidth={p.blind > 0 ? 3 : 1}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          {FOCUS.map((f) => (
            <div key={f} className="flex items-center gap-1.5">
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: FOCUS_COLORS[f] }}
              />
              {t('visualizations.idgRadar.dimensions.' + f)}
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block h-3 w-3 rounded-full border-2"
              style={{ borderColor: RISK_STROKE }}
            />
            {t('visualizations.constellation.legend.blindSpots')}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
