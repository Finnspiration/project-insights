import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'ghost';
  icon?: LucideIcon;
}

interface EmptyStateProps {
  icon: LucideIcon;
  eyebrow?: string;
  title: string;
  description: string;
  primaryAction?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  className?: string;
  compact?: boolean;
}

/**
 * Branded empty state used across pages and panels for consistent first-use
 * coaching. Emerald-tinted icon, Urbanist title, gold rule, concise body.
 */
export function EmptyState({
  icon: Icon,
  eyebrow,
  title,
  description,
  primaryAction,
  secondaryAction,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'py-10 px-6' : 'py-16 px-6 min-h-[40vh]',
        className,
      )}
    >
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-primary/15 blur-3xl rounded-full" aria-hidden />
        <div
          className={cn(
            'relative flex items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/15',
            compact ? 'h-14 w-14' : 'h-20 w-20',
          )}
        >
          <Icon className={compact ? 'h-7 w-7' : 'h-10 w-10'} />
        </div>
      </div>

      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary mb-2">
          {eyebrow}
        </p>
      )}

      <h3
        className={cn(
          'font-display font-semibold tracking-tight text-foreground',
          compact ? 'text-xl' : 'text-3xl',
        )}
      >
        {title}
      </h3>

      <div className="h-[2px] w-12 bg-secondary mx-auto my-4" aria-hidden />

      <p className={cn('text-muted-foreground max-w-md', compact ? 'text-sm' : 'text-base')}>
        {description}
      </p>

      {(primaryAction || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
          {primaryAction && (
            <Button
              onClick={primaryAction.onClick}
              variant={primaryAction.variant ?? 'default'}
              className="gap-2"
            >
              {primaryAction.icon && <primaryAction.icon className="h-4 w-4" />}
              {primaryAction.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              onClick={secondaryAction.onClick}
              variant={secondaryAction.variant ?? 'ghost'}
              className="gap-2"
            >
              {secondaryAction.icon && <secondaryAction.icon className="h-4 w-4" />}
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
