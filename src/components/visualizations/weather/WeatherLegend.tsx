import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';

export function WeatherLegend() {
  const { t } = useTranslation('common');
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5, duration: 0.4 }}
      className="absolute bottom-4 right-4 bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg z-20 pointer-events-auto"
      style={{ maxWidth: '240px' }}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors rounded-t-lg"
      >
        <h3 className="text-xs font-semibold text-foreground">{t('visualizations.weatherLegend.title')}</h3>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-2 p-3 pt-0">
        
        {/* Temperature Zones Section */}
        <div>
          <h4 className="text-xs font-semibold text-foreground mb-1">{t('visualizations.weatherLegend.temperatureZones')}</h4>
          <div className="flex items-center gap-2 text-xs mb-0.5">
            <svg width="24" height="24" viewBox="0 0 28 28">
              <circle cx="14" cy="14" r="10" fill="hsl(0, 80%, 60%)" opacity="0.4" />
              <circle cx="14" cy="14" r="6" fill="hsl(0, 80%, 60%)" opacity="0.6" />
              <circle cx="14" cy="14" r="2.5" fill="hsl(0, 80%, 60%)" opacity="0.8" />
            </svg>
            <span className="text-muted-foreground">{t('visualizations.weatherLegend.idgAreas')}</span>
          </div>
          <p className="text-[10px] text-muted-foreground italic pl-1">
            {t('visualizations.weatherLegend.colorStrength')}
          </p>
        </div>

        <div className="border-t border-border pt-1.5">
          <h4 className="text-xs font-semibold text-foreground mb-1">{t('visualizations.weatherLegend.pressureSystems')}</h4>
        
        {/* High Pressure */}
        <div className="flex items-center gap-2 text-xs mb-0.5">
          <div className="flex flex-col items-center">
            <svg width="24" height="24" viewBox="0 0 28 28">
              <circle cx="14" cy="14" r="8" fill="none" stroke="hsl(0, 70%, 55%)" strokeWidth="1.5" strokeOpacity="0.5" strokeDasharray="2,1" />
              <circle cx="14" cy="14" r="2.5" fill="hsl(0, 80%, 60%)" opacity="0.8" />
              <text x="14" y="16" textAnchor="middle" className="fill-white text-[10px] font-bold">H</text>
            </svg>
          </div>
          <span className="text-muted-foreground">{t('visualizations.weatherLegend.highPressureRisk')}</span>
        </div>

        {/* High Pressure from Blind Spot */}
        <div className="flex items-center gap-2 text-xs mb-0.5">
          <div className="flex flex-col items-center">
            <svg width="24" height="24" viewBox="0 0 28 28">
              <circle cx="14" cy="14" r="8" fill="none" stroke="hsl(0, 85%, 45%)" strokeWidth="2" strokeOpacity="0.7" strokeDasharray="2,1" />
              <circle cx="14" cy="14" r="2.5" fill="hsl(0, 90%, 55%)" opacity="0.8" />
              <text x="14" y="16" textAnchor="middle" className="fill-white text-[10px] font-bold">H</text>
            </svg>
          </div>
          <span className="text-muted-foreground">{t('visualizations.weatherLegend.highPressureBlindSpot')}</span>
        </div>

        {/* Low Pressure */}
        <div className="flex items-center gap-2 text-xs mb-0.5">
          <div className="flex flex-col items-center">
            <svg width="24" height="24" viewBox="0 0 28 28">
              <circle cx="14" cy="14" r="8" fill="none" stroke="hsl(220, 70%, 50%)" strokeWidth="1.5" strokeOpacity="0.5" strokeDasharray="2,1" />
              <circle cx="14" cy="14" r="2.5" fill="hsl(220, 80%, 60%)" opacity="0.8" />
              <text x="14" y="16" textAnchor="middle" className="fill-white text-[10px] font-bold">L</text>
            </svg>
          </div>
          <span className="text-muted-foreground">{t('visualizations.weatherLegend.lowPressure')}</span>
        </div>
        </div>

        <div className="border-t border-border pt-1.5">
          <h4 className="text-xs font-semibold text-foreground mb-1">{t('visualizations.weatherLegend.fronts')}</h4>
          
          {/* Cold Front */}
          <div className="flex items-center gap-2 text-xs mb-0.5">
            <svg width="28" height="12" viewBox="0 0 28 12">
              <line x1="0" y1="6" x2="28" y2="6" stroke="hsl(220, 80%, 50%)" strokeWidth="1.5" opacity="0.8" />
              <polygon points="8,4 9,8 10,4" fill="hsl(220, 80%, 50%)" opacity="0.9" />
              <polygon points="18,4 19,8 20,4" fill="hsl(220, 80%, 50%)" opacity="0.9" />
            </svg>
            <span className="text-muted-foreground">{t('visualizations.weatherLegend.coldFront')}</span>
          </div>

          {/* Warm Front */}
          <div className="flex items-center gap-2 text-xs">
            <svg width="28" height="12" viewBox="0 0 28 12">
              <line x1="0" y1="6" x2="28" y2="6" stroke="hsl(0, 80%, 50%)" strokeWidth="1.5" opacity="0.8" />
              <circle cx="9" cy="6" r="1.5" fill="hsl(0, 80%, 50%)" opacity="0.9" />
              <circle cx="19" cy="6" r="1.5" fill="hsl(0, 80%, 50%)" opacity="0.9" />
            </svg>
            <span className="text-muted-foreground">{t('visualizations.weatherLegend.warmFront')}</span>
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground mt-2 italic">
          {t('visualizations.weatherLegend.intensityNote')}
        </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
