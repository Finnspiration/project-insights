import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BlindSpotCard } from '@/components/insights/BlindSpotCard';
import type { BlindSpot } from '@/types/project';

// Clicking a storm cell opens the blind spot itself, rather than a tooltip
// that tells you to go and find it on another tab. BlindSpotCard already
// renders the evidence, consequences and recommendations and owns the status
// change, so the map reuses it instead of growing a second version.

interface BlindSpotDialogProps {
  blindSpot: BlindSpot | null;
  onOpenChange: (open: boolean) => void;
  /** Invalidate the queries so the map, the list and the reading all update. */
  onUpdate?: () => void;
}

export function BlindSpotDialog({ blindSpot, onOpenChange, onUpdate }: BlindSpotDialogProps) {
  const { t } = useTranslation('common');

  return (
    <Dialog open={!!blindSpot} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>{t('visualizations.weatherReading.blindSpotDialogTitle')}</DialogTitle>
        </DialogHeader>
        {blindSpot && (
          <BlindSpotCard
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            blindSpot={blindSpot as any}
            onUpdate={() => {
              onUpdate?.();
              onOpenChange(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
