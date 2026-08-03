import { useTranslation } from 'react-i18next';
import { dimensionImpacts, isWindDimension } from '@/lib/weatherReading';

// Shows what the currently selected option does to the reading. Derived from
// weatherReading.ts rather than a hand-maintained table, so it always matches
// what the map actually shows.

interface DimensionImpactProps {
  dimension: string;
  value: string | undefined;
  className?: string;
}

export function DimensionImpact({ dimension, value, className }: DimensionImpactProps) {
  const { t } = useTranslation('common');

  if (!value) return null;

  if (isWindDimension(dimension)) {
    return (
      <p className={className}>
        <span className="text-muted-foreground">{t('visualizations.weatherReading.indices.wind')}: </span>
        {t(`visualizations.weatherReading.wind.${value}`, { defaultValue: '' })}
      </p>
    );
  }

  const impacts = dimensionImpacts(dimension, value);
  if (impacts.length === 0) {
    return <p className={className}>{t('visualizations.weatherReading.noImpact')}</p>;
  }

  return (
    <p className={className}>
      {impacts.map((impact, i) => (
        <span key={impact.index}>
          {i > 0 && <span className="text-muted-foreground"> · </span>}
          <span className="text-muted-foreground">
            {t(`visualizations.weatherReading.indices.${impact.index}`)}{' '}
          </span>
          <span className={impact.points > 0 ? 'font-semibold text-destructive' : 'font-semibold text-primary'}>
            {impact.points > 0 ? '+' : '−'}
            {Math.abs(impact.points).toFixed(1).replace('.', ',')}
          </span>
        </span>
      ))}
    </p>
  );
}
