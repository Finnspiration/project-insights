import { useTranslation } from 'react-i18next';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { WeatherIndex, WeatherReading } from '@/lib/weatherReading';

// The reading, not the rendering: one sentence plus four numbers on one scale.
// This replaces the 21 numbered circles the map used to scatter across the
// canvas, none of which said what the weather actually was.

interface WeatherReadingBandProps {
  reading: WeatherReading;
}

const INDEX_COLORS: Record<WeatherIndex['key'], string> = {
  pressure: 'hsl(var(--destructive))',
  temperature: 'hsl(25, 85%, 55%)',
  visibility: 'hsl(205, 65%, 50%)',
};

function IndexBlock({ index }: { index: WeatherIndex }) {
  const { t } = useTranslation('common');
  const color = INDEX_COLORS[index.key];

  return (
    <div className="min-w-[9rem] flex-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
          >
            {t(`visualizations.weatherReading.indices.${index.key}`)}
            <Info className="h-3 w-3" aria-hidden />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="mb-1.5 font-medium">
            {t('visualizations.weatherReading.drivenBy')}
          </p>
          <ul className="space-y-1">
            {index.drivers.map((driver) => (
              <li key={`${driver.dimensionKey}-${driver.value}`} className="flex justify-between gap-3 text-xs">
                <span className="text-muted-foreground">{t(driver.dimensionKey)}</span>
                <span className="font-mono tabular-nums">
                  {driver.points > 0 ? '+' : ''}
                  {driver.points.toFixed(1)}
                </span>
              </li>
            ))}
          </ul>
        </TooltipContent>
      </Tooltip>

      <div className="mt-1 text-3xl font-bold tracking-tight tabular-nums">
        {index.score.toFixed(1).replace('.', ',')}
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">{t(index.qualifierKey)}</p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${index.score * 10}%`, background: color }}
        />
      </div>
    </div>
  );
}

export function WeatherReadingBand({ reading }: WeatherReadingBandProps) {
  const { t } = useTranslation('common');

  return (
    <div className="border-b border-border px-5 py-5 sm:px-7">
      <h2 className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
        {t(reading.headlineKey)}
      </h2>
      <p className="mt-1.5 max-w-[64ch] text-sm leading-relaxed text-muted-foreground">
        {t(`${reading.headlineKey}_detail`)}
      </p>

      <div className="mt-5 flex flex-wrap gap-x-8 gap-y-5">
        <IndexBlock index={reading.pressure} />
        <IndexBlock index={reading.temperature} />
        <IndexBlock index={reading.visibility} />

        <div className="min-w-[9rem] flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t('visualizations.weatherReading.indices.wind')}
          </div>
          <div className="mt-1 truncate text-3xl font-bold tracking-tight">
            {t(`visualizations.weatherReading.windNames.${reading.wind}`)}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t(`visualizations.weatherReading.wind.${reading.wind}`)}
          </p>
          <div className="mt-2 h-1.5 rounded-full bg-muted" />
        </div>
      </div>
    </div>
  );
}
