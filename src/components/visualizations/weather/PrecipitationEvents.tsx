import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { PrecipitationEvent } from './weatherDataMapper';
import { CloudRain, CloudSnow, Sun, Cloud, Zap } from 'lucide-react';
import { useState } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Safe text rendering helper
const safeRenderText = (value: any, fallback: string = ''): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'object' && value !== null) {
    // Handle multilingual objects
    if ('da' in value || 'en' in value) {
      return value.da || value.en || fallback;
    }
    console.warn('Unexpected object in PrecipitationEvents:', value);
  }
  return fallback;
};

interface PrecipitationEventsProps {
  events: PrecipitationEvent[];
}

export function PrecipitationEvents({ events }: PrecipitationEventsProps) {
  const { t } = useTranslation('common');
  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null);

  const getEventIcon = (type: PrecipitationEvent['type']) => {
    switch (type) {
      case 'storm':
        return Zap;
      case 'rain':
        return CloudRain;
      case 'snow':
        return CloudSnow;
      case 'sun':
        return Sun;
      case 'fog':
        return Cloud;
      default:
        return CloudRain;
    }
  };

  const getEventColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'hsl(0, 85%, 60%)';
      case 'medium':
        return 'hsl(45, 95%, 55%)';
      case 'low':
        return 'hsl(145, 60%, 50%)';
      default:
        return 'hsl(220, 70%, 50%)';
    }
  };

  const getEventEmoji = (type: PrecipitationEvent['type']) => {
    switch (type) {
      case 'storm':
        return '⚡';
      case 'rain':
        return '🌧️';
      case 'snow':
        return '❄️';
      case 'sun':
        return '☀️';
      case 'fog':
        return '🌫️';
      default:
        return '🌧️';
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      <TooltipProvider>
        {events.map((event, index) => {
          const Icon = getEventIcon(event.type);
          const color = getEventColor(event.priority);

          return (
            <Tooltip key={event.id}>
              <TooltipTrigger asChild>
                <motion.div
                  initial={{ opacity: 0, y: -20, scale: 0 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    delay: index * 0.2,
                    duration: 0.6,
                    repeat: event.type === 'storm' ? Infinity : 0,
                    repeatType: event.type === 'storm' ? 'reverse' : undefined,
                    repeatDelay: event.type === 'storm' ? 0.5 : 0,
                  }}
                  className="absolute pointer-events-auto cursor-pointer"
                  style={{
                    left: `${event.x}%`,
                    top: `${event.y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  onMouseEnter={() => setHoveredEvent(event.id)}
                  onMouseLeave={() => setHoveredEvent(null)}
                >
                  {/* Glow effect */}
                  <div
                    className="absolute inset-0 blur-xl opacity-50 rounded-full"
                    style={{
                      backgroundColor: color,
                      width: hoveredEvent === event.id ? '60px' : '40px',
                      height: hoveredEvent === event.id ? '60px' : '40px',
                      transition: 'all 0.3s',
                    }}
                  />

                  {/* Icon container */}
                  <div
                    className="relative flex items-center justify-center rounded-full border-2 transition-all duration-300"
                    style={{
                      borderColor: color,
                      backgroundColor: 'hsl(var(--background))',
                      width: hoveredEvent === event.id ? '48px' : '40px',
                      height: hoveredEvent === event.id ? '48px' : '40px',
                    }}
                  >
                    <Icon
                      className="transition-all duration-300"
                      style={{
                        color: color,
                        width: hoveredEvent === event.id ? '24px' : '20px',
                        height: hoveredEvent === event.id ? '24px' : '20px',
                      }}
                    />
                  </div>

                  {/* Priority badge */}
                  {event.priority === 'high' && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full flex items-center justify-center text-[8px] text-white font-bold">
                      !
                    </div>
                  )}

                  {/* Animated particles for storm */}
                  {event.type === 'storm' && (
                    <motion.div
                      className="absolute inset-0"
                      animate={{
                        opacity: [0.3, 0.7, 0.3],
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    >
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div
                          key={i}
                          className="absolute w-1 h-1 bg-yellow-400 rounded-full"
                          style={{
                            left: `${20 + i * 30}%`,
                            top: `${-10 - i * 5}%`,
                          }}
                        />
                      ))}
                    </motion.div>
                  )}

                  {/* Animated raindrops */}
                  {event.type === 'rain' && (
                    <div className="absolute inset-0">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute w-0.5 h-2 bg-blue-400 rounded-full opacity-60"
                          style={{
                            left: `${i * 20}%`,
                            top: '-20%',
                          }}
                          animate={{
                            y: [0, 60],
                            opacity: [0.6, 0],
                          }}
                          transition={{
                            duration: 1,
                            delay: i * 0.2,
                            repeat: Infinity,
                            ease: 'linear',
                          }}
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getEventEmoji(event.type)}</span>
                    <p className="font-semibold text-sm">{safeRenderText(event.title, t('visualizations.precipitationEvents.unknownEvent'))}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{safeRenderText(event.description, t('visualizations.precipitationEvents.noDescription'))}</p>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="capitalize">{t('visualizations.precipitationEvents.sourceLabel')} {event.source === 'blindspot' ? t('visualizations.precipitationEvents.sourceBlindSpot') : event.source === 'recommendation' ? t('visualizations.precipitationEvents.sourceRecommendation') : t('visualizations.precipitationEvents.sourceIntervention')}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="capitalize">{t('visualizations.precipitationEvents.priorityLabel')} {event.priority === 'high' ? t('visualizations.precipitationEvents.priorityHigh') : event.priority === 'medium' ? t('visualizations.precipitationEvents.priorityMedium') : t('visualizations.precipitationEvents.priorityLow')}</span>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </TooltipProvider>
    </div>
  );
}
