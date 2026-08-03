import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SlidersHorizontal, X } from 'lucide-react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { WeatherReadingBand } from './weather/WeatherReadingBand';
import { WeatherField } from './weather/WeatherField';
import { WeatherInsightRail } from './weather/WeatherInsightRail';
import { DimensionStrip } from './weather/DimensionStrip';
import { BlindSpotDialog } from './weather/BlindSpotDialog';
import { WeatherControlPanel } from './weather/WeatherControlPanel';
import { readWeather } from '@/lib/weatherReading';
import { deriveWeatherInsights, type InsightAction } from '@/lib/weatherInsights';
import type { RawMorphology, Morphology } from '@shared/morphology.ts';
import type { BlindSpot, IDGScores, Language, ProjectDocument } from '@/types/project';

// Rewritten from the layered version, which stacked seven toggleable layers —
// 12 morphology circles, 5 IDG bubbles, 4 pressure markers, isobars, an
// 8-line wind starburst, a fabricated 3-day forecast and two floating panels
// that covered the map they explained. It rendered every dimension and read
// none of them.
//
// The structure is: read it (band) → look at it (field) → understand it
// (rail) → see the inputs (strip). Editing lives behind one button instead of
// six layer toggles.

interface CulturalWeatherMapProps {
  morphology: RawMorphology;
  idgProfile?: IDGScores;
  blindSpots?: BlindSpot[];
  projectId?: string;
  documents?: ProjectDocument[];
  onMorphologyChange?: (newMorphology: Morphology) => void;
  onIDGChange?: (newIDG: IDGScores) => void;
  onSaveChanges?: () => Promise<void>;
  onReset?: () => void;
  hasChanges?: boolean;
  showControlPanel?: boolean;
  /** Refresh the project queries after a blind spot's status changes. */
  onBlindSpotUpdate?: () => void;
  /** Navigate to another tab when an insight offers a next step. */
  onNavigate?: (action: InsightAction) => void;
}

export function CulturalWeatherMap({
  morphology,
  idgProfile,
  blindSpots = [],
  projectId,
  documents = [],
  onMorphologyChange,
  onIDGChange,
  onSaveChanges,
  onReset,
  hasChanges,
  showControlPanel = false,
  onBlindSpotUpdate,
  onNavigate,
}: CulturalWeatherMapProps) {
  const { t, i18n } = useTranslation('common');
  const language = i18n.language as Language;
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedBlindSpot, setSelectedBlindSpot] = useState<BlindSpot | null>(null);

  const reading = useMemo(
    () => readWeather(morphology, blindSpots, documents),
    [morphology, blindSpots, documents],
  );

  const insights = useMemo(
    () => deriveWeatherInsights(reading, morphology, blindSpots, documents),
    [reading, morphology, blindSpots, documents],
  );

  const canEdit = showControlPanel && !!projectId && !!morphology && !!onMorphologyChange;

  const handleNavigate = (action: InsightAction) => {
    // "Adjust the assessment" is right here; everything else lives on another tab.
    if (action === 'morphology' && canEdit) {
      setEditorOpen(true);
      return;
    }
    onNavigate?.(action);
  };

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-4">
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <WeatherReadingBand reading={reading} />

            <div className="grid lg:grid-cols-[1.5fr_1fr]">
              <WeatherField
                reading={reading}
                blindSpots={blindSpots}
                language={language}
                onSelectBlindSpot={setSelectedBlindSpot}
              />
              <WeatherInsightRail insights={insights} onAction={handleNavigate} />
            </div>

            <DimensionStrip
              morphology={morphology}
              onSelect={canEdit ? () => setEditorOpen(true) : undefined}
            />
          </CardContent>
        </Card>

        {canEdit && (
          <div className="flex justify-end">
            <Button variant={editorOpen ? 'secondary' : 'outline'} size="sm" onClick={() => setEditorOpen(!editorOpen)}>
              {editorOpen ? <X className="mr-2 h-4 w-4" /> : <SlidersHorizontal className="mr-2 h-4 w-4" />}
              {t(editorOpen ? 'visualizations.weatherReading.closeEditor' : 'visualizations.weatherReading.openEditor')}
            </Button>
          </div>
        )}

        {canEdit && editorOpen && (
          <WeatherControlPanel
            projectId={projectId!}
            morphology={morphology}
            idgProfile={idgProfile}
            onMorphologyChange={onMorphologyChange}
            onIDGChange={onIDGChange}
            onSaveChanges={onSaveChanges}
            onReset={onReset}
            hasChanges={hasChanges}
          />
        )}

        <BlindSpotDialog
          blindSpot={selectedBlindSpot}
          onOpenChange={(open) => !open && setSelectedBlindSpot(null)}
          onUpdate={onBlindSpotUpdate}
        />
      </div>
    </TooltipProvider>
  );
}
