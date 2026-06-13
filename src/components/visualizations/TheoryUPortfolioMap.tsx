import { useMemo } from 'react';
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
import { Waves, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePortfolio } from '@/hooks/usePortfolio';
import { askAIChat } from '@/lib/aiChat';

const PHASES = ['downloading', 'seeing', 'sensing', 'presencing', 'crystallizing', 'prototyping', 'performing'] as const;
type Phase = (typeof PHASES)[number];

const PHASE_DEPTH: Record<Phase, number> = {
  downloading: 3,
  seeing: 2,
  sensing: 1,
  presencing: 0,
  crystallizing: 1,
  prototyping: 2,
  performing: 3,
};

type Zone = 'early' | 'pivot' | 'action';
const PHASE_ZONE: Record<Phase, Zone> = {
  downloading: 'early',
  seeing: 'early',
  sensing: 'early',
  presencing: 'pivot',
  crystallizing: 'action',
  prototyping: 'action',
  performing: 'action',
};
const ZONE_COLORS: Record<Zone, string> = {
  early: '#EF9F27',
  pivot: '#8B5CF6',
  action: '#1D9E75',
};

interface UPoint {
  id: string;
  name: string;
  phase: Phase;
  x: number;
  y: number;
  zone: Zone;
  confidence: number;
}

function readName(name: unknown, lang: string, fallback: string): string {
  if (typeof name === 'string') return name;
  const obj = name as { en?: string; da?: string } | null;
  return obj?.[lang as 'en' | 'da'] || obj?.en || fallback;
}

function readPhase(tu: any): Phase | null {
  if (!tu) return null;
  const raw =
    (typeof tu.currentPhase === 'string' ? tu.currentPhase : tu.currentPhase?.phase) ||
    tu.position ||
    tu.whyHere?.morphologyScoring?.phase;
  if (!raw || typeof raw !== 'string') return null;
  const lower = raw.toLowerCase() as Phase;
  return (PHASES as readonly string[]).includes(lower) ? lower : null;
}

function readConfidence(tu: any): number {
  const raw = tu?.confidence ?? tu?.whyHere?.morphologyScoring?.confidence ?? 0;
  const normalized = raw <= 1 ? raw * 100 : raw;
  return Math.round(normalized);
}

function jitter(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return ((Math.abs(hash) % 1000) / 1000 - 0.5) * 0.45;
}

export function TheoryUPortfolioMap() {
  const { t, i18n } = useTranslation('common');
  const navigate = useNavigate();
  const { data, isLoading } = usePortfolio();

  const points = useMemo<UPoint[]>(() => {
    if (!data) return [];
    return data.projects
      .map((p) => {
        const phase = readPhase(p.theory_u_analysis);
        if (!phase) return null;
        const phaseIndex = PHASES.indexOf(phase);
        return {
          id: p.id,
          name: readName(p.name, i18n.language, t('common.untitled', 'Untitled')),
          phase,
          x: phaseIndex + jitter(p.id),
          y: PHASE_DEPTH[phase] + jitter(p.id + 'y') * 0.5,
          zone: PHASE_ZONE[phase],
          confidence: readConfidence(p.theory_u_analysis),
        } as UPoint;
      })
      .filter((p): p is UPoint => p !== null);
  }, [data, i18n.language, t]);

  const summary = useMemo(() => {
    const total = points.length;
    const early = points.filter((p) => p.zone === 'early').length;
    const action = points.filter((p) => p.zone === 'action').length;
    const avgConfidence = total
      ? Math.round(points.reduce((sum, p) => sum + p.confidence, 0) / total)
      : 0;
    return { total, early, action, avgConfidence };
  }, [points]);

  if (isLoading) return <Skeleton className="h-[520px] w-full" />;
  if (points.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <CardTitle className="flex items-center gap-2">
              <Waves className="h-5 w-5 text-primary" />
              {t('visualizations.theoryUMap.title')}
            </CardTitle>
            <CardDescription>{t('visualizations.theoryUMap.description')}</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => askAIChat(t('visualizations.theoryUMap.aiPrompt'))}
          >
            <Sparkles className="h-4 w-4 mr-1.5" />
            {t('visualizations.askAi')}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg border p-3">
            <p className="text-2xl font-bold">{summary.total}</p>
            <p className="text-xs text-muted-foreground">{t('visualizations.theoryUMap.stats.onTheU')}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-2xl font-bold">{summary.early}</p>
            <p className="text-xs text-muted-foreground">{t('visualizations.theoryUMap.stats.early')}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-2xl font-bold">{summary.action}</p>
            <p className="text-xs text-muted-foreground">{t('visualizations.theoryUMap.stats.action')}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-2xl font-bold">{summary.avgConfidence}%</p>
            <p className="text-xs text-muted-foreground">{t('visualizations.theoryUMap.stats.avgConfidence')}</p>
          </div>
        </div>

        <div className="h-[420px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 24, bottom: 60, left: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                type="number"
                dataKey="x"
                domain={[-0.5, PHASES.length - 0.5]}
                ticks={PHASES.map((_, i) => i)}
                interval={0}
                angle={-30}
                textAnchor="end"
                height={60}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                tickFormatter={(v: number) => t(`visualizations.theoryUMap.phases.${PHASES[v]}`)}
              />
              <YAxis
                type="number"
                dataKey="y"
                domain={[-0.5, 3.5]}
                ticks={[0, 3]}
                reversed
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                tickFormatter={(v: number) =>
                  v === 0 ? t('visualizations.theoryUMap.depth.deep') : t('visualizations.theoryUMap.depth.surface')
                }
                label={{
                  value: t('visualizations.theoryUMap.axis.depth'),
                  angle: -90,
                  position: 'insideLeft',
                  fill: 'hsl(var(--muted-foreground))',
                  fontSize: 12,
                }}
              />
              <ZAxis type="number" range={[120, 260]} />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }: any) => {
                  if (!active || !payload || !payload.length) return null;
                  const p = payload[0].payload as UPoint;
                  return (
                    <div className="rounded-lg border bg-popover p-2 text-popover-foreground shadow-md">
                      <p className="font-medium text-sm">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t(`visualizations.theoryUMap.phases.${p.phase}`)} · {p.confidence}%{' '}
                        {t('blindSpots.confidence', 'confidence')}
                      </p>
                    </div>
                  );
                }}
              />
              <Scatter
                data={points}
                onClick={(node: any) => {
                  const point = (node?.payload ?? node) as UPoint;
                  if (point?.id) navigate(`/projects/${point.id}`);
                }}
                style={{ cursor: 'pointer' }}
              >
                {points.map((p) => (
                  <Cell key={p.id} fill={ZONE_COLORS[p.zone]} stroke={ZONE_COLORS[p.zone]} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          {(['early', 'pivot', 'action'] as Zone[]).map((z) => (
            <div key={z} className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: ZONE_COLORS[z] }} />
              {t(`visualizations.theoryUMap.zones.${z}`)}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
