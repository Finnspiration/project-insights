import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, CloudRain } from 'lucide-react';
import { BaseClimate } from './weather/BaseClimate';
import { WindPatterns } from './weather/WindPatterns';
import { TemperatureZones } from './weather/TemperatureZones';
import { PressureSystems } from './weather/PressureSystems';
import { PrecipitationEvents } from './weather/PrecipitationEvents';
import { WeatherForecast } from './weather/WeatherForecast';
import { WeatherParticles } from './weather/WeatherParticles';
import { LayerControls } from './weather/LayerControls';
import { WeatherLegend } from './weather/WeatherLegend';
import { WeatherControlPanel } from './weather/WeatherControlPanel';
import { CompactSplitLayout } from './weather/CompactSplitLayout';
import { mapProjectToWeatherData } from './weather/weatherDataMapper';

interface CulturalWeatherMapProps {
  morphology: any;
  idgProfile?: { being: number; thinking: number; relating: number; collaborating: number; acting: number };
  theoryUAnalysis?: any;
  recommendations?: any[];
  interventions?: any[];
  blindSpots?: any[];
  projectId?: string;
  onMorphologyChange?: (newMorphology: any) => void;
  onIDGChange?: (newIDG: any) => void;
  onSaveChanges?: () => Promise<void>;
  onReset?: () => void;
  hasChanges?: boolean;
  showControlPanel?: boolean;
}

export function CulturalWeatherMap({ 
  morphology, 
  idgProfile, 
  theoryUAnalysis,
  recommendations,
  interventions,
  blindSpots,
  projectId,
  onMorphologyChange,
  onIDGChange,
  onSaveChanges,
  onReset,
  hasChanges,
  showControlPanel = false,
}: CulturalWeatherMapProps) {
  const { t } = useTranslation('common');
  
  // Layer visibility state
  const [layers, setLayers] = useState({
    windPatterns: true,
    pressureSystems: true,
    temperatureZones: true,
    precipitation: true,
    forecast: true,
    particles: true,
  });

  const [showPanels, setShowPanels] = useState(true);
  const [layoutMode, setLayoutMode] = useState<'compact' | 'detailed'>(() => {
    return (localStorage.getItem('weatherControlLayout') as 'compact' | 'detailed') || 'compact';
  });
  const [idgScores, setIdgScores] = useState(idgProfile || {
    being: 5,
    thinking: 5,
    relating: 5,
    collaborating: 5,
    acting: 5
  });

  // Use default IDG profile if not provided
  const defaultIDG = {
    being: 5,
    thinking: 7,
    relating: 6,
    collaborating: 5,
    acting: 6,
  };

  const weatherData = mapProjectToWeatherData(
    morphology,
    idgProfile || defaultIDG,
    theoryUAnalysis,
    recommendations,
    interventions,
    blindSpots
  );

  const handleLayerToggle = (layer: 'windPatterns' | 'pressureSystems' | 'temperatureZones' | 'precipitation' | 'forecast' | 'particles') => {
    setLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  const handleTogglePanels = () => {
    setShowPanels(!showPanels);
  };

  // Weather map content (to be used in split layout)
  const weatherMapContent = (
    <div className="relative w-full h-full rounded-lg overflow-visible border border-border">
      {/* Layer 1: Base Climate (always visible) */}
      <BaseClimate data={weatherData.baseClimate} />

      {/* Layer 2: Weather Particles (toggleable) */}
      {layers.particles && (
        <WeatherParticles 
          temporalDynamics={morphology.temporal || morphology.temporal_dynamics || 'project'}
          organizationalStage={morphology.organizational_stage || 'orange'}
        />
      )}

      {/* Layer 3: Wind Patterns (toggleable) */}
      {layers.windPatterns && (
        <div className="absolute inset-0 z-45 pointer-events-none">
          <WindPatterns
            key={`wind-${morphology.information_flow}-${morphology.temporal_dynamics}`}
            pattern={weatherData.windPatterns} 
          />
        </div>
      )}

      {/* Layer 4: Temperature Zones (toggleable) */}
      {layers.temperatureZones && (
        <TemperatureZones zones={weatherData.temperatureZones} />
      )}

      {/* Layer 4: Pressure Systems (toggleable) */}
      {layers.pressureSystems && (
        <PressureSystems systems={weatherData.pressureSystems} />
      )}

      {/* Layer 5: Precipitation (toggleable) */}
      {layers.precipitation && (
        <PrecipitationEvents events={weatherData.precipitation} />
      )}

      {/* Layer 6: Forecast (toggleable) */}
      {layers.forecast && (
        <WeatherForecast forecast={weatherData.forecast} />
      )}

      {/* Controls */}
      {showPanels && (
        <>
          <LayerControls 
            layers={layers} 
            onLayerToggle={handleLayerToggle}
            showPanels={showPanels}
            onTogglePanels={handleTogglePanels}
          />
          <WeatherLegend />
        </>
      )}

      {/* Toggle Panels Button */}
      {!showPanels && (
        <Button
          variant="secondary"
          size="sm"
          onClick={handleTogglePanels}
          className="absolute top-4 right-4 shadow-lg"
        >
          <Eye className="h-4 w-4 mr-2" />
          Vis paneler
        </Button>
      )}
    </div>
  );

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CloudRain className="h-5 w-5 text-primary" />
            {t('visualizations.culturalWeather.title')}
          </CardTitle>
          <CardDescription>
            Multi-lags vejrsystem der viser organisatorisk klima, temperaturzoner, og vejrudsigt
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showControlPanel && layoutMode === 'compact' && projectId && morphology && onMorphologyChange ? (
            <CompactSplitLayout
              morphology={morphology}
              onMorphologyChange={onMorphologyChange}
              weatherMapContent={weatherMapContent}
              idgScores={idgScores}
              onIdgScoresChange={(newScores) => {
                setIdgScores(newScores);
                if (onIDGChange) onIDGChange(newScores);
              }}
            />
          ) : (
            <div className="relative w-full h-[600px]">
              {weatherMapContent}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Interactive Control Panel (Detailed Mode) */}
      {showControlPanel && showPanels && projectId && morphology && (
        <WeatherControlPanel
          projectId={projectId}
          morphology={morphology}
          idgProfile={idgProfile}
          onMorphologyChange={onMorphologyChange}
          onIDGChange={onIDGChange}
          onSaveChanges={onSaveChanges}
          onReset={onReset}
          hasChanges={hasChanges}
        />
      )}
    </div>
  );
}
