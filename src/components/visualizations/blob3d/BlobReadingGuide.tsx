import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, ChevronDown, Eye } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface LayerInfo {
  number: number;
  colorClass: string;
  borderColor: string;
  i18nKey: string;
  dimensionKeys: string[];
}

const LAYERS: LayerInfo[] = [
  {
    number: 7,
    colorClass: 'bg-red-500/20',
    borderColor: '#ef4444',
    i18nKey: 'background',
    dimensionKeys: ['risk'],
  },
  {
    number: 6,
    colorClass: 'bg-orange-500/20',
    borderColor: '#f97316',
    i18nKey: 'surface',
    dimensionKeys: ['complexity', 'challenge'],
  },
  {
    number: 5,
    colorClass: 'bg-blue-500/20',
    borderColor: '#3b82f6',
    i18nKey: 'mainShape',
    dimensionKeys: ['stakeholder', 'resources', 'information'],
  },
  {
    number: 4,
    colorClass: 'bg-purple-500/20',
    borderColor: '#a855f7',
    i18nKey: 'openings',
    dimensionKeys: ['information'],
  },
  {
    number: 3,
    colorClass: 'bg-green-500/20',
    borderColor: '#22c55e',
    i18nKey: 'innerGrid',
    dimensionKeys: ['knowledge'],
  },
  {
    number: 2,
    colorClass: 'bg-cyan-500/20',
    borderColor: '#06b6d4',
    i18nKey: 'orbiters',
    dimensionKeys: ['temporal', 'change'],
  },
  {
    number: 1,
    colorClass: 'bg-yellow-500/20',
    borderColor: '#eab308',
    i18nKey: 'core',
    dimensionKeys: ['development'],
  },
];

export function BlobReadingGuide() {
  const { t } = useTranslation('common');
  const [isOpen, setIsOpen] = useState(false);

  const guideKey = 'visualizations.blob.readingGuide';

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-6">
      <CollapsibleTrigger className="flex items-center justify-between w-full group px-4 py-3 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{t(`${guideKey}.toggle`)}</span>
          <span className="text-xs text-muted-foreground">— {t(`${guideKey}.subtitle`)}</span>
        </div>
        <ChevronDown className={cn(
          "h-4 w-4 text-muted-foreground transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-3 space-y-4 animate-in slide-in-from-top-2 duration-200">
        {/* Layer strips */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1 mb-2">
            {t(`${guideKey}.layersTitle`)}
          </p>
          {LAYERS.map((layer) => (
            <div
              key={layer.number}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
                layer.colorClass,
                "hover:brightness-110"
              )}
              style={{ borderLeft: `4px solid ${layer.borderColor}` }}
            >
              {/* Layer number badge */}
              <Badge
                variant="outline"
                className="h-6 w-6 p-0 flex items-center justify-center text-xs font-bold shrink-0"
                style={{ borderColor: layer.borderColor, color: layer.borderColor }}
              >
                {layer.number}
              </Badge>

              {/* Title + description */}
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium">
                  {t(`${guideKey}.layers.${layer.i18nKey}.title`)}
                </span>
                <span className="text-xs text-muted-foreground ml-2">
                  — {t(`${guideKey}.layers.${layer.i18nKey}.what`)}
                </span>
              </div>

              {/* Dimension badge(s) */}
              <div className="flex gap-1 shrink-0">
                {layer.dimensionKeys.map((dk) => (
                  <Badge
                    key={dk}
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0"
                  >
                    {t(`${guideKey}.layers.${layer.i18nKey}.dimension`)}
                  </Badge>
                )).slice(0, 1)}
              </div>
            </div>
          ))}
        </div>

        {/* What to look for */}
        <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Eye className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold">{t(`${guideKey}.lookFor.title`)}</p>
          </div>
          <ul className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="text-primary mt-0.5">→</span>
                <span>{t(`${guideKey}.lookFor.item${i}`)}</span>
              </li>
            ))}
          </ul>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
