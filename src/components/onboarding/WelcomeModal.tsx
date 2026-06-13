import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Compass, MessageSquare, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface WelcomeModalProps {
  /** Called when user picks "create my own" so the parent can open its CreateProjectDialog. */
  onCreateOwn?: () => void;
}

/**
 * First-run welcome. Pops automatically on Dashboard when user_profiles.onboarded_at is null.
 * Two paths: seed a fully-populated demo project, or skip straight to creating their own.
 * Both paths mark onboarding as complete so the modal never reappears.
 */
export function WelcomeModal({ onCreateOwn }: WelcomeModalProps) {
  const { t } = useTranslation('common');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // Check onboarded_at on mount.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setChecking(true);
      const { data } = await supabase
        .from('user_profiles')
        .select('onboarded_at')
        .eq('id', user.id)
        .maybeSingle();
      if (cancelled) return;
      if (!data?.onboarded_at) setOpen(true);
      setChecking(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const markOnboarded = async (step: string) => {
    if (!user) return;
    await supabase
      .from('user_profiles')
      .update({ onboarded_at: new Date().toISOString(), onboarding_step: step })
      .eq('id', user.id);
  };

  const handleExploreDemo = async () => {
    if (!user) return;
    setSeeding(true);
    try {
      const { data, error } = await supabase.functions.invoke('seed-demo-project');
      if (error) throw error;
      const id = (data as { id?: string } | null)?.id;
      await markOnboarded('demo_seen');
      setOpen(false);
      toast.success(t('welcome.demoReadyToast'));
      if (id) navigate(`/projects/${id}`);
    } catch (err) {
      console.error('seed-demo-project failed', err);
      toast.error(t('welcome.demoError'));
    } finally {
      setSeeding(false);
    }
  };

  const handleSkip = async () => {
    await markOnboarded('done');
    setOpen(false);
    onCreateOwn?.();
  };

  if (checking) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !seeding && setOpen(o)}>
      <DialogContent className="max-w-xl">
        <DialogHeader className="text-center sm:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary mb-2">
            {t('welcome.eyebrow')}
          </p>
          <DialogTitle className="font-display text-3xl tracking-tight">
            {t('welcome.title')}
          </DialogTitle>
          <div className="h-[2px] w-12 bg-secondary mt-3" aria-hidden />
          <DialogDescription className="text-base text-muted-foreground pt-3">
            {t('welcome.subtitle')}
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-3 mt-2">
          {[
            { icon: Compass, key: 'characterize' },
            { icon: Sparkles, key: 'visualize' },
            { icon: MessageSquare, key: 'askAi' },
          ].map(({ icon: Icon, key }) => (
            <li key={key} className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </span>
              <div>
                <p className="font-medium text-sm">{t(`welcome.steps.${key}.title`)}</p>
                <p className="text-sm text-muted-foreground">
                  {t(`welcome.steps.${key}.description`)}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            className="flex-1 gap-2"
            onClick={handleExploreDemo}
            disabled={seeding}
          >
            {seeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {seeding ? t('welcome.seeding') : t('welcome.exploreDemo')}
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleSkip}
            disabled={seeding}
          >
            {t('welcome.skip')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
