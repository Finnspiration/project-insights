import { useTranslation } from 'react-i18next';
import { WeatherImpact } from './impactMapping';

interface ImpactIndicatorProps {
  dimension: string;
  value: string;
  impacts: WeatherImpact[];
}

export function ImpactIndicator({ dimension, value, impacts }: ImpactIndicatorProps) {
  const { i18n } = useTranslation();
  const language = i18n.language as 'en' | 'da';

  if (!impacts || impacts.length === 0) return null;

  return (
    <div className="mt-2 p-2 bg-muted/30 rounded-md border border-border/40">
      <p className="text-xs font-medium text-muted-foreground mb-1">
        {language === 'da' ? 'Påvirkning på vejr:' : 'Impact on weather:'}
      </p>
      <div className="flex flex-wrap gap-2">
        {impacts.map((impact, idx) => (
          <span key={idx} className="text-xs flex items-center gap-1 text-foreground/80">
            <span className="text-base">{impact.icon}</span>
            {impact.text[language]}
          </span>
        ))}
      </div>
    </div>
  );
}
