import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { da as daLocale } from 'date-fns/locale';
import { ArrowRight, History } from 'lucide-react';
import { BlobSignatureMark } from './BlobSignatureMark';
import { useProjectDnaHistory, type DnaSnapshot } from '@/hooks/queries/useProject';
import { diffMorphology } from '@/lib/morphologyDiff';
import type { Language } from '@/types/project';

// "See how the project breathes and evolves" has been the blob's subtitle all
// along, with no history behind it. This is that: every recorded assessment as
// a portrait, and — the part that is actually useful — what moved between the
// one you pick and today.

interface ProjectTimelineProps {
  projectId: string;
}

export function ProjectTimeline({ projectId }: ProjectTimelineProps) {
  const { t, i18n } = useTranslation('common');
  const language = i18n.language as Language;
  const { data: history = [], isLoading } = useProjectDnaHistory(projectId);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const latest: DnaSnapshot | undefined = history[history.length - 1];
  const selected = useMemo(
    () => history.find((snapshot) => snapshot.id === selectedId) ?? history[0],
    [history, selectedId],
  );

  const diff = useMemo(
    () => (selected && latest && selected.id !== latest.id
      ? diffMorphology(selected.morphology, latest.morphology)
      : null),
    [selected, latest],
  );

  // One snapshot is a starting point, not a history — nothing to compare yet.
  if (isLoading || history.length < 2) return null;

  const dateFormat = (value: string) =>
    format(new Date(value), 'd. MMM yyyy', { locale: language === 'da' ? daLocale : undefined });

  return (
    <section className="rounded-xl border border-border/70 bg-card p-4 space-y-4">
      <div className="flex items-center gap-2">
        <History className="h-4 w-4 text-muted-foreground" />
        <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          {t('visualizations.timeline.title')}
        </h4>
      </div>

      <ol className="flex flex-wrap gap-2" role="list">
        {history.map((snapshot) => {
          const isLatest = snapshot.id === latest?.id;
          const isSelected = snapshot.id === selected?.id;
          return (
            <li key={snapshot.id}>
              <button
                type="button"
                onClick={() => setSelectedId(snapshot.id)}
                aria-pressed={isSelected}
                className={`rounded-lg border p-1.5 transition-colors ${
                  isSelected ? 'border-primary bg-primary/5' : 'border-border/60 hover:border-border'
                }`}
              >
                <BlobSignatureMark morphology={snapshot.morphology} className="h-14 w-14" />
                <span className="mt-1 block text-[9.5px] leading-tight text-muted-foreground">
                  {isLatest ? t('visualizations.timeline.now') : dateFormat(snapshot.recorded_at)}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {diff && (
        <div className="border-t border-border/60 pt-3">
          <p className="mb-2 text-xs text-muted-foreground">
            {t('visualizations.timeline.since', { date: dateFormat(selected!.recorded_at) })}
          </p>

          {diff.unchanged ? (
            <p className="text-sm text-muted-foreground">{t('visualizations.timeline.noChange')}</p>
          ) : (
            <ul className="space-y-1.5">
              {diff.changes.map((change) => (
                <li key={change.dimension} className="flex flex-wrap items-center gap-1.5 text-[13px]">
                  <span className="font-medium">{t(change.dimensionKey)}</span>
                  <span className="text-muted-foreground">
                    {change.from
                      ? t(`morphology.dimensions.${change.dimension}.options.${change.from}`).split(' - ')[0]
                      : t('visualizations.timeline.unanswered')}
                  </span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" aria-hidden />
                  <span className="font-medium">
                    {change.to
                      ? t(`morphology.dimensions.${change.dimension}.options.${change.to}`).split(' - ')[0]
                      : t('visualizations.timeline.unanswered')}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {diff.gestures.length > 0 && (
            <p className="mt-3 text-[12.5px] leading-relaxed text-muted-foreground">
              {t('visualizations.timeline.shapeMoved')}{' '}
              {diff.gestures
                .map((gesture) =>
                  t(`visualizations.timeline.gestures.${gesture.gesture}.${gesture.delta > 0 ? 'up' : 'down'}`),
                )
                .join(', ')}
              .
            </p>
          )}
        </div>
      )}
    </section>
  );
}
