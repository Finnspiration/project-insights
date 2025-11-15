import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CloudRain } from 'lucide-react';
import { useState } from 'react';
import { BaseClimate } from './weather/BaseClimate';
import { TemperatureZones } from './weather/TemperatureZones';
import { WeatherForecast } from './weather/WeatherForecast';
import { LayerControls } from './weather/LayerControls';
import { mapProjectToWeatherData } from './weather/weatherDataMapper';

interface CulturalWeatherMapProps {
  morphology: any;
  idgProfile?: { being: number; thinking: number; relating: number; collaborating: number; acting: number };
  theoryUAnalysis?: any;
}

export function CulturalWeatherMap({ morphology, idgProfile, theoryUAnalysis }: CulturalWeatherMapProps) {
  const { t } = useTranslation('common');
  
  // Layer visibility state
  const [layers, setLayers] = useState({
    temperatureZones: true,
    forecast: true,
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
    theoryUAnalysis
  );

  const handleLayerToggle = (layer: 'temperatureZones' | 'forecast') => {
    setLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CloudRain className="h-5 w-5 text-primary" />
          {t('visualizations.culturalWeather.title')}
        </CardTitle>
        <CardDescription>
          Multi-layer weather system showing organizational climate, temperature zones, and forecast
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative w-full h-[600px] rounded-lg overflow-hidden border border-border">
          {/* Layer 1: Base Climate (always visible) */}
          <BaseClimate data={weatherData.baseClimate} />

          {/* Layer 2: Temperature Zones (toggleable) */}
          {layers.temperatureZones && (
            <TemperatureZones zones={weatherData.temperatureZones} />
          )}

          {/* Layer 3: Forecast (toggleable) */}
          {layers.forecast && <WeatherForecast forecast={weatherData.forecast} />}

          {/* Layer Controls */}
          <LayerControls layers={layers} onLayerToggle={handleLayerToggle} />
        </div>
      </CardContent>
    </Card>
  );
}
