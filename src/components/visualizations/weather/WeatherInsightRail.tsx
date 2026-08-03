import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import type { InsightAction, WeatherInsight } from '@/lib/weatherInsights';

// The column that answers "so what?". Without it the map states four numbers
// and leaves the interpretation to the reader — which is exactly the work
// PRISM is supposed to be doing.

interface WeatherInsightRailProps {
  insights: WeatherInsight[];
  onAction?: (action: InsightAction) => void;
}

const SEVERITY_BORDER: Record<WeatherInsight['severity'], string> = {
  risk: 'border-l-destructive',
  attention: 'border-l-[hsl(43,72%,52%)]',
  neutral: 'border-l-primary',
};

export function WeatherInsightRail({ insights, onAction }: WeatherInsightRailProps) {
  const { t } = useTranslation('common');

  return (
    <div className="flex flex-col gap-4 border-t border-border px-5 py-5 sm:px-6 lg:border-l lg:border-t-0">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {t('visualizations.weatherReading.meaning')}
      </h3>

      {insights.length === 0 && (
        <p className="text-sm text-muted-foreground">
          {t('visualizations.weatherReading.noInsights')}
        </p>
      )}

      {insights.map((insight) => {
        // Values may name an i18n key (e.g. the dimension that drives the
        // pressure), so translate those before interpolating.
        const values = Object.fromEntries(
          Object.entries(insight.values ?? {}).map(([key, value]) => [
            key,
            typeof value === 'string' && value.includes('.') ? t(value) : value,
          ]),
        );

        return (
          <div key={insight.key} className={`border-l-[3px] pl-3 ${SEVERITY_BORDER[insight.severity]}`}>
            <b className="block text-[13.5px] font-semibold leading-snug">
              {t(`visualizations.weatherReading.insights.${insight.key}.title`, values)}
            </b>
            <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
              {t(`visualizations.weatherReading.insights.${insight.key}.body`, values)}
            </p>
            {insight.action && onAction && (
              <button
                type="button"
                onClick={() => onAction(insight.action!)}
                className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                {t(`visualizations.weatherReading.actions.${insight.action}`)}
                <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
