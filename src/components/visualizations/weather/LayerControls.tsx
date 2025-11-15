import { motion } from 'framer-motion';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Layers, Eye, EyeOff } from 'lucide-react';

interface LayerControlsProps {
  layers: {
    windPatterns: boolean;
    pressureSystems: boolean;
    temperatureZones: boolean;
    precipitation: boolean;
    forecast: boolean;
  };
  onLayerToggle: (layer: 'windPatterns' | 'pressureSystems' | 'temperatureZones' | 'precipitation' | 'forecast') => void;
  showPanels: boolean;
  onTogglePanels: () => void;
}

export function LayerControls({ layers, onLayerToggle, showPanels, onTogglePanels }: LayerControlsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
      className="absolute bottom-4 left-4 w-80"
    >
      <Card className="bg-background/80 backdrop-blur-sm border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              <h3 className="text-sm font-semibold">Lag</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onTogglePanels}
              className="h-7 px-2 text-xs"
            >
              <EyeOff className="h-3 w-3 mr-1" />
              Skjul paneler
            </Button>
          </div>

          <div className="space-y-3">
            {/* Base Climate - always on */}
            <div className="flex items-center justify-between opacity-50">
              <Label htmlFor="base-climate" className="text-xs cursor-not-allowed">
                Basisklima
              </Label>
              <Switch id="base-climate" checked disabled />
            </div>

            {/* Wind Patterns */}
            <div className="flex items-center justify-between">
              <Label htmlFor="wind-patterns" className="text-xs cursor-pointer">
                Vindmønstre
              </Label>
              <Switch
                id="wind-patterns"
                checked={layers.windPatterns}
                onCheckedChange={() => onLayerToggle('windPatterns')}
              />
            </div>

            {/* Pressure Systems */}
            <div className="flex items-center justify-between">
              <Label htmlFor="pressure-systems" className="text-xs cursor-pointer">
                Trykssystemer
              </Label>
              <Switch
                id="pressure-systems"
                checked={layers.pressureSystems}
                onCheckedChange={() => onLayerToggle('pressureSystems')}
              />
            </div>

            {/* Temperature Zones */}
            <div className="flex items-center justify-between">
              <Label htmlFor="temperature-zones" className="text-xs cursor-pointer">
                Temperaturzoner
              </Label>
              <Switch
                id="temperature-zones"
                checked={layers.temperatureZones}
                onCheckedChange={() => onLayerToggle('temperatureZones')}
              />
            </div>

            {/* Precipitation */}
            <div className="flex items-center justify-between">
              <Label htmlFor="precipitation" className="text-xs cursor-pointer">
                Nedbør & Hændelser
              </Label>
              <Switch
                id="precipitation"
                checked={layers.precipitation}
                onCheckedChange={() => onLayerToggle('precipitation')}
              />
            </div>

            {/* Forecast */}
            <div className="flex items-center justify-between">
              <Label htmlFor="forecast" className="text-xs cursor-pointer">
                Vejrudsigt
              </Label>
              <Switch
                id="forecast"
                checked={layers.forecast}
                onCheckedChange={() => onLayerToggle('forecast')}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
