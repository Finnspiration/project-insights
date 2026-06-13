import { useMemo, useState } from 'react';
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
  ReferenceArea,
  ResponsiveContainer,
} from 'recharts';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { usePortfolio } from '@/hooks/usePortfolio';

const PRIORITY = ['low', 'medium', 'high'] as const;
const STATUS = ['unaddressed', 'acknowledged', 'addressed'] as const;
type StatusKey = (typeof STATUS)[number];

const STATUS_COLORS: Record<StatusKey, string> = {
  unaddressed: '#E24B4A',
  acknowledged: '#EF9F27',
  addressed: '#888780',
};

interface SpotPoint {
  id: string;
  projectId: string;
  title: string;
  x: number;
  y: number;
  status: StatusKey;
  confidence: number;
}

function readText(value: unknown, lang: string, fallback: string): string {
  if (typeof value === 'string') return value;
  const obj = value as { en?: string; da?: string } | null;
  return obj?.[lang as 'en' | 'da'] || obj?.en || fallback;
}

function jitter(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return ((Math.abs(hash) % 1000) / 1000 - 0.5) * 0.32;
}

export function BlindSpotRiskMatrix() {
  const { t, i18n } = useTranslation('common');
  const navigate = useNavigate();
  const { data, isLoading } = usePortfolio();
  const [hidden, setHidden] = useState<Set<StatusKey>>(new Set());

  const spots = useMemo<SpotPoint[]>(() => {
    if (!data) return [];
    return data.blindSpots.map((bs) => {
      const status = (STATUS as readonly string[]).includes(bs.status ?? '')
        ? (bs.status as StatusKey)
        : 'unaddressed';
      const priorityIndex = Math.max(0, PRIORITY.indexOf(bs.priority as (typeof PRIORITY)[number]));
      const confidence = Math.round((bs.confidence ?? 0.5) * 100);
      return {
        id: bs.id,
        projectId: bs.project_id,
        title: readText(bs.title, i18n.language, t('blindSpots.untitled', 'Blind spot')),
        x: confidence,
        y: priorityIndex + jitter(bs.id),
        status,
        confidence,
      };
    });
  }, [data, i18n.language, t]);

  const summary = useMemo(() => {
    const open = spots.filter((s) => s.status !== 'addressed');
    const actNow = spots.filter(
      (s) => s.status === 'unaddressed' && s.y >= 1.5 && s.confidence >= 50
    ).length;
    const acknowledged = spots.filter((s) => s.status === 'acknowledged').length;
    const avgConfidence = open.length
      ? Math.round(open.reduce((sum, s) => sum + s.confidence, 0) / open.length)
      : 0;
    return { open: open.length, actNow, acknowledged, avgConfidence };
  }, [spots]);

  const toggle = (key: StatusKey) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (loading) {
    return <Skeleton className="h-[480px] w-full" />;
  }

  if (spots.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-primary" />
          {t('visualizations.riskMatrix.title')}
        </CardTitle>
        <CardDescription>{t('visualizations.riskMatrix.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-lg border bg-card p-3">
              <div className="text-2xl font-bold">{summary.open}</div>
              <div className="text-xs text-muted-foreground">{t('visualizations.riskMatrix.stats.open')}</div>
            </div>
            <div className="rounded-lg border bg-card p-3">
              <div className="text-2xl font-bold" style={{ color: STATUS_COLORS.unaddressed }}>{summary.actNow}</div>
              <div className="text-xs text-muted-foreground">{t('visualizations.riskMatrix.stats.actNow')}</div>
            </div>
            <div className="rounded-lg border bg-card p-3">
              <div className="text-2xl font-bold" style={{ color: STATUS_COLORS.acknowledged }}>{summary.acknowledged}</div>
              <div className="text-xs text-muted-foreground">{t('visualizations.riskMatrix.stats.acknowledged')}</div>
            </div>
            <div className="rounded-lg border bg-card p-3">
              <div className="text-2xl font-bold">{summary.avgConfidence}%</div>
              <div className="text-xs text-muted-foreground">{t('visualizations.riskMatrix.stats.avgConfidence')}</div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {STATUS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => toggle(s)}
                className="flex items-center gap-1.5 transition-opacity"
                style={{ opacity: hidden.has(s) ? 0.4 : 1 }}
              >
                <span className="inline-block h-3 w-3 rounded-full" style={{ background: STATUS_COLORS[s] }} />
                {t(`blindSpots.status.${s}`)}
              </button>
            ))}
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="inline-block h-3 w-3 rounded-sm border border-destructive/40 bg-destructive/10" />
              {t('visualizations.riskMatrix.legend.actNow')}
            </span>
          </div>

          {/* Matrix */}
          <div className="h-[420px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <ReferenceArea x1={50} x2={100} y1={1.5} y2={2.5} fill="#E24B4A" fillOpacity={0.08} stroke="#E24B4A" strokeOpacity={0.3} />
                <XAxis
                  type="number"
                  dataKey="x"
                  domain={[0, 100]}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  tickFormatter={(v) => `${v}%`}
                  label={{
                    value: t('visualizations.riskMatrix.axis.confidence'),
                    position: 'insideBottom',
                    offset: -12,
                    fill: 'hsl(var(--muted-foreground))',
                    fontSize: 12,
                  }}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  domain={[-0.5, 2.5]}
                  ticks={[0, 1, 2]}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  tickFormatter={(v) => t(`blindSpots.priority.${PRIORITY[v as 0 | 1 | 2]}`)}
                  label={{
                    value: t('visualizations.riskMatrix.axis.priority'),
                    angle: -90,
                    position: 'insideLeft',
                    fill: 'hsl(var(--muted-foreground))',
                    fontSize: 12,
                  }}
                />
                <ZAxis range={[80, 80]} />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const s = payload[0].payload as SpotPoint;
                    return (
                      <div className="rounded-md border bg-popover p-2 text-xs shadow-md">
                        <div className="font-semibold">{s.title}</div>
                        <div className="text-muted-foreground">
                          {t(`blindSpots.status.${s.status}`)} · {s.confidence}% {t('blindSpots.confidence', 'confidence')}
                        </div>
                      </div>
                    );
                  }}
                />
                {STATUS.filter((s) => !hidden.has(s)).map((s) => (
                  <Scatter
                    key={s}
                    name={t(`blindSpots.status.${s}`)}
                    data={spots.filter((p) => p.status === s)}
                    fill={STATUS_COLORS[s]}
                    fillOpacity={0.8}
                    className="cursor-pointer"
                    onClick={(node: any) => {
                      const point = (node?.payload ?? node) as SpotPoint | undefined;
                      if (point?.projectId) navigate(`/projects/${point.projectId}`);
                    }}
                  />
                ))}
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
