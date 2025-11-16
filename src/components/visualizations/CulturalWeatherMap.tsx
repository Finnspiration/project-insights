import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CloudRain, Eye } from 'lucide-react';
import { useState } from 'react';
import { BaseClimate } from './weather/BaseClimate';
import { TemperatureZones } from './weather/TemperatureZones';
import { WeatherForecast } from './weather/WeatherForecast';
import { LayerControls } from './weather/LayerControls';
import { WindPatterns } from './weather/WindPatterns';
import { PressureSystems } from './weather/PressureSystems';
import { WeatherLegend } from './weather/WeatherLegend';
import { PrecipitationEvents } from './weather/PrecipitationEvents';
import { WeatherControlPanel } from './weather/WeatherControlPanel';
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
  });

  const [showPanels, setShowPanels] = useState(true);

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

  const handleLayerToggle = (layer: 'windPatterns' | 'pressureSystems' | 'temperatureZones' | 'precipitation' | 'forecast') => {
    setLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  const handleTogglePanels = () => {
    setShowPanels(!showPanels);
  };

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
          <div className="relative w-full h-[600px] rounded-lg overflow-hidden border border-border">
          {/* Layer 1: Base Climate (always visible) */}
          <BaseClimate data={weatherData.baseClimate} />

          {/* Layer 2: Wind Patterns (toggleable) - MOVED TO TOP for visibility */}
          {layers.windPatterns && (
            <div className="absolute inset-0 z-50 pointer-events-none">
              <WindPatterns 
                key={`wind-${morphology.information_flow}-${morphology.temporal_dynamics}`}
                pattern={weatherData.windPatterns} 
              />
            </div>
          )}

          {/* Layer 3: Temperature Zones (toggleable) - MOVED BEFORE Pressure Systems */}
          {layers.temperatureZones && (
            <TemperatureZones zones={weatherData.temperatureZones} />
          )}

          {/* Layer 4: Pressure Systems (toggleable) - MOVED AFTER Temperature to be on top */}
          {layers.pressureSystems && (
            <>
              <PressureSystems systems={weatherData.pressureSystems} />
              {showPanels && <WeatherLegend />}
            </>
          )}

          {/* Layer 5: Precipitation & Events (toggleable) */}
          {layers.precipitation && (
            <PrecipitationEvents events={weatherData.precipitation} />
          )}

          {/* Layer 6: Forecast (toggleable) */}
          {layers.forecast && showPanels && <WeatherForecast forecast={weatherData.forecast} />}

          {/* Layer Controls */}
          {showPanels && (
            <LayerControls 
              layers={layers} 
              onLayerToggle={handleLayerToggle}
              showPanels={showPanels}
              onTogglePanels={handleTogglePanels}
            />
          )}

          {/* Master Toggle (always visible when panels hidden) */}
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
      </CardContent>
    </Card>

    {/* Interactive Control Panel */}
    {showControlPanel && showPanels && projectId && morphology && (
      <div className="mt-6">
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
      </div>
    )}
  </div>
  );
}
