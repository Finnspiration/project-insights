import { motion } from 'framer-motion';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Layers } from 'lucide-react';

interface LayerControlsProps {
  layers: {
    temperatureZones: boolean;
    forecast: boolean;
  };
  onLayerToggle: (layer: 'temperatureZones' | 'forecast') => void;
}

export function LayerControls({ layers, onLayerToggle }: LayerControlsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
      className="absolute bottom-4 left-4"
    >
      <Card className="bg-background/80 backdrop-blur-sm border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="h-4 w-4" />
            <h3 className="text-sm font-semibold">Layers</h3>
          </div>

          <div className="space-y-3">
            {/* Base Climate - always on */}
            <div className="flex items-center justify-between opacity-50">
              <Label htmlFor="base-climate" className="text-xs cursor-not-allowed">
                Base Climate
              </Label>
              <Switch id="base-climate" checked disabled />
            </div>

            {/* Temperature Zones */}
            <div className="flex items-center justify-between">
              <Label htmlFor="temperature-zones" className="text-xs cursor-pointer">
                Temperature Zones
              </Label>
              <Switch
                id="temperature-zones"
                checked={layers.temperatureZones}
                onCheckedChange={() => onLayerToggle('temperatureZones')}
              />
            </div>

            {/* Forecast */}
            <div className="flex items-center justify-between">
              <Label htmlFor="forecast" className="text-xs cursor-pointer">
                Forecast
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
