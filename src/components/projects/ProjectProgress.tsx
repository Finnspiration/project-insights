import { useTranslation } from 'react-i18next';
import { Check, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ProgressFlags {
  hasMorphology: boolean;
  hasDocuments: boolean;
  hasDna: boolean;
  hasReviewedActions: boolean;
}

interface ProjectProgressProps {
  flags: ProgressFlags;
  variant?: 'compact' | 'full';
  onStepClick?: (stepId: ProgressStepId) => void;
  className?: string;
}

export type ProgressStepId =
  | 'created'
  | 'morphology'
  | 'documents'
  | 'dna'
  | 'reviewed';

function buildSteps(flags: ProgressFlags) {
  return [
    { id: 'created' as const, key: 'created', done: true },
    { id: 'morphology' as const, key: 'morphology', done: flags.hasMorphology },
    { id: 'documents' as const, key: 'documents', done: flags.hasDocuments },
    { id: 'dna' as const, key: 'dna', done: flags.hasDna },
    { id: 'reviewed' as const, key: 'reviewed', done: flags.hasReviewedActions },
  ];
}

/** Per-project 5-step completion indicator. */
export function ProjectProgress({
  flags,
  variant = 'full',
  onStepClick,
  className,
}: ProjectProgressProps) {
  const { t } = useTranslation('common');
  const steps = buildSteps(flags);
  const completed = steps.filter((s) => s.done).length;
  const total = steps.length;
  const pct = Math.round((completed / total) * 100);
  const nextStep = steps.find((s) => !s.done);

  if (variant === 'compact') {
    return (
      <div className={cn('space-y-1.5', className)}>
        <div className="flex items-center gap-1.5">
          {steps.map((s) => (
            <span
              key={s.id}
              title={t(`projectProgress.steps.${s.key}`)}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-colors',
                s.done ? 'bg-secondary' : 'bg-muted',
              )}
            />
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">
          {t('projectProgress.summary', { completed, total })}
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
          {t('projectProgress.eyebrow')}
        </p>
        <p className="text-sm font-medium text-muted-foreground">
          {t('projectProgress.summary', { completed, total })}
        </p>
      </div>

      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-secondary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      <ol className="grid grid-cols-1 sm:grid-cols-5 gap-2">
        {steps.map((s, idx) => {
          const Icon = s.done ? Check : Circle;
          const interactive = !!onStepClick;
          return (
            <li key={s.id}>
              <button
                type="button"
                disabled={!interactive}
                onClick={() => onStepClick?.(s.id)}
                className={cn(
                  'w-full text-left p-3 rounded-lg border transition-colors',
                  s.done
                    ? 'border-secondary/40 bg-secondary/5'
                    : 'border-border bg-card',
                  interactive && 'hover:border-primary/40 cursor-pointer',
                  !interactive && 'cursor-default',
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={cn(
                      'flex h-5 w-5 items-center justify-center rounded-full',
                      s.done ? 'bg-secondary text-secondary-foreground' : 'bg-muted text-muted-foreground',
                    )}
                  >
                    <Icon className="h-3 w-3" />
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {idx + 1}
                  </span>
                </div>
                <p className="text-sm font-medium leading-snug">
                  {t(`projectProgress.steps.${s.key}`)}
                </p>
              </button>
            </li>
          );
        })}
      </ol>

      {nextStep && (
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">
            {t('projectProgress.nextLabel')}:
          </span>{' '}
          {t(`projectProgress.steps.${nextStep.key}`)}
        </p>
      )}
    </div>
  );
}
