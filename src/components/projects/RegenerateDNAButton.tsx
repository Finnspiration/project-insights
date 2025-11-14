import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface RegenerateDNAButtonProps {
  projectId?: string; // If provided, only regenerate this project. Otherwise, all user projects
  onSuccess?: () => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

export function RegenerateDNAButton({ 
  projectId, 
  onSuccess,
  variant = 'outline',
  size = 'sm'
}: RegenerateDNAButtonProps) {
  const { t } = useTranslation('common');
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('regenerate-dna-codes', {
        body: { projectId }
      });

      if (error) {
        console.error('Error regenerating DNA codes:', error);
        toast.error(t('morphology.regenerateError') || 'Failed to regenerate DNA codes');
        return;
      }

      console.log('DNA regeneration result:', data);

      if (data.updated > 0) {
        toast.success(
          t('morphology.regenerateSuccess', { count: data.updated }) || 
          `Successfully regenerated ${data.updated} DNA code(s)`
        );
        onSuccess?.();
      } else if (data.skipped > 0) {
        toast.info(
          t('morphology.regenerateSkipped') || 
          'All DNA codes are already correct'
        );
      } else {
        toast.info(t('morphology.regenerateNoProjects') || 'No projects found to regenerate');
      }
    } catch (err) {
      console.error('Error:', err);
      toast.error(t('morphology.regenerateError') || 'Failed to regenerate DNA codes');
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={isRegenerating}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
          {t('morphology.regenerateDNA') || 'Regenerate DNA'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t('morphology.regenerateDNATitle') || 'Regenerate DNA Code?'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {projectId 
              ? (t('morphology.regenerateDNADescSingle') || 'This will regenerate the DNA code for this project based on its morphology data. The DNA code will be updated to use the correct dimension order.')
              : (t('morphology.regenerateDNADescAll') || 'This will regenerate DNA codes for ALL your projects based on their morphology data. This ensures all DNA codes use the correct dimension order.')
            }
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            {t('common.cancel') || 'Cancel'}
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleRegenerate}>
            {t('common.continue') || 'Continue'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
