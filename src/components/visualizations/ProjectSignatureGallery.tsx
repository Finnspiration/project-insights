import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { Fingerprint, Sparkles, Wind } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { usePortfolio, type PortfolioProject, type PortfolioBlindSpot } from '@/hooks/usePortfolio';
import { askAIChat } from '@/lib/aiChat';
import { MORPHOLOGY_DIMENSIONS } from '@/lib/morphologyConfig';
import { calculateIDG } from '@/lib/idgScoring';
import { readWeather, type WeatherReading } from '@/lib/weatherReading';
import { BlobSignatureMark } from './BlobSignatureMark';
import { IDG_DIMENSIONS, localized, type Language, type BlindSpot } from '@/types/project';

// One card per assessed project, rendering the three PRISM readings that can be
// derived from stored morphology + DNA alone (no extra fetches): the DNA
// barcode, the IDG radar and the weather indices. All labels come from i18n and
// every mark carries a text equivalent so the section is readable without
// colour or hover.

const ORDINAL_COLORS = [
  'hsl(var(--primary) / 0.25)',
  'hsl(var(--primary) / 0.45)',
  'hsl(var(--primary) / 0.65)',
  'hsl(var(--primary) / 0.85)',
  'hsl(var(--primary))',
];
const NEUTRAL = 'hsl(var(--muted))';

interface Band {
  color: string;
  label: string;
}

interface Signature {
  id: string;
  name: string;
  morphology: PortfolioProject['morphology'];
  bands: Band[];
  radar: { dimension: string; label: string; value: number }[];
  weather: WeatherReading;
}

export function ProjectSignatureGallery() {
  const { t, i18n } = useTranslation('common');
  const navigate = useNavigate();
  const { data, isLoading } = usePortfolio();
  const language = i18n.language as Language;

  const signatures = useMemo<Signature[]>(() => {
    if (!data) return [];
    const spotsByProject = new Map<string, PortfolioBlindSpot[]>();
    for (const spot of data.blindSpots) {
      const list = spotsByProject.get(spot.project_id) ?? [];
      list.push(spot);
      spotsByProject.set(spot.project_id, list);
    }

    return data.projects
      .filter((p: PortfolioProject) => p.morphology)
      .map((project) => {
        const idg = calculateIDG(project.morphology);
        const spots = (spotsByProject.get(project.id) ?? []) as unknown as BlindSpot[];
        const segments = (project.dna_code ?? '').split('-').filter(Boolean);

        const bands: Band[] = MORPHOLOGY_DIMENSIONS.map((dim, index) => {
          const value = segments[index];
          const ordinal = value ? dim.options.findIndex((o) => o.value === value) : -1;
          const optionLabel =
            ordinal >= 0 ? t(dim.options[ordinal].translationKey).split(' - ')[0] : t('common.unknown', '—');
          return {
            color:
              ordinal >= 0
                ? ORDINAL_COLORS[Math.min(ordinal, ORDINAL_COLORS.length - 1)]
                : NEUTRAL,
            label: `${t(dim.translationKey)}: ${optionLabel}`,
          };
        });

        return {
          id: project.id,
          name: localized(project.name as never, language) || t('common.untitled'),
          morphology: project.morphology,
          bands,
          radar: IDG_DIMENSIONS.map((dimension) => ({
            dimension,
            label: t(`visualizations.idgRadar.dimensions.${dimension}`),
            value: idg.radar[dimension],
          })),
          weather: readWeather(project.morphology, spots),
        };
      });
  }, [data, language, t]);

  if (isLoading) return <Skeleton className="h-[420px] w-full" />;
  if (signatures.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
              {t('visualizations.projectSignatures.eyebrow')}
            </p>
            <CardTitle className="flex items-center gap-2">
              <Fingerprint className="h-5 w-5 text-primary" />
              {t('visualizations.projectSignatures.title')}
            </CardTitle>
            <CardDescription>{t('visualizations.projectSignatures.description')}</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => askAIChat(t('visualizations.projectSignatures.aiPrompt'))}
          >
            <Sparkles className="h-4 w-4" />
            {t('visualizations.askAi')}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2" role="list">
          {signatures.map((signature) => (
            <li key={signature.id}>
              <article className="h-full rounded-xl border border-border/70 bg-card p-4 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <h4 className="font-display text-lg font-semibold tracking-tight line-clamp-1">
                    {signature.name}
                  </h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => navigate(`/projects/${signature.id}`)}
                    aria-label={t('visualizations.projectSignatures.openProject', {
                      name: signature.name,
                    })}
                  >
                    {t('dashboard.view')}
                  </Button>
                </div>

                {/* Portrait */}
                <section aria-labelledby={`portrait-${signature.id}`} className="space-y-2">
                  <h5
                    id={`portrait-${signature.id}`}
                    className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground"
                  >
                    {t('visualizations.blobSignature.title')}
                  </h5>
                  <BlobSignatureMark
                    morphology={signature.morphology}
                    className="mx-auto h-32 w-32"
                  />
                </section>

                {/* DNA barcode */}
                <section aria-labelledby={`dna-${signature.id}`} className="space-y-2">
                  <h5
                    id={`dna-${signature.id}`}
                    className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground"
                  >
                    {t('visualizations.projectSignatures.dna')}
                  </h5>
                  <div className="flex h-8 overflow-hidden rounded-md" role="img"
                    aria-label={signature.bands.map((b) => b.label).join('; ')}>
                    {signature.bands.map((band, index) => (
                      <span
                        key={index}
                        className="flex-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        style={{ backgroundColor: band.color }}
                        title={band.label}
                        tabIndex={0}
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                </section>

                {/* IDG radar */}
                <section aria-labelledby={`idg-${signature.id}`} className="space-y-2">
                  <h5
                    id={`idg-${signature.id}`}
                    className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground"
                  >
                    {t('visualizations.projectSignatures.idg')}
                  </h5>
                  <div
                    className="h-40"
                    role="img"
                    aria-label={signature.radar
                      .map((entry) => `${entry.label}: ${entry.value}/100`)
                      .join('; ')}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={signature.radar} outerRadius="72%">
                        <PolarGrid stroke="hsl(var(--border))" />
                        <PolarAngleAxis
                          dataKey="label"
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                        />
                        <Radar
                          dataKey="value"
                          stroke="hsl(var(--primary))"
                          fill="hsl(var(--primary))"
                          fillOpacity={0.35}
                          isAnimationActive={false}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {signature.radar.map((entry) => (
                      <li key={entry.dimension}>
                        {entry.label}: <span className="text-foreground">{entry.value}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                {/* Weather indices */}
                <section aria-labelledby={`weather-${signature.id}`} className="space-y-2">
                  <h5
                    id={`weather-${signature.id}`}
                    className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground"
                  >
                    {t('visualizations.projectSignatures.weather')}
                  </h5>
                  <dl className="space-y-2">
                    {(['pressure', 'temperature', 'visibility'] as const).map((key) => {
                      const index = signature.weather[key];
                      return (
                        <div key={key} className="space-y-1">
                          <div className="flex items-baseline justify-between gap-2 text-xs">
                            <dt className="text-muted-foreground">
                              {t(`visualizations.weatherReading.indices.${key}`)}
                            </dt>
                            <dd className="text-foreground">
                              {index.score.toFixed(1)}/10 · {t(index.qualifierKey)}
                            </dd>
                          </div>
                          <div
                            className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
                            role="meter"
                            aria-valuenow={index.score}
                            aria-valuemin={0}
                            aria-valuemax={10}
                            aria-label={t(`visualizations.weatherReading.indices.${key}`)}
                          >
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${(index.score / 10) * 100}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </dl>
                  <Badge variant="secondary" className="gap-1.5">
                    <Wind className="h-3.5 w-3.5" aria-hidden="true" />
                    {t(`visualizations.projectSignatures.wind.${signature.weather.wind}`)}
                  </Badge>
                </section>
              </article>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
