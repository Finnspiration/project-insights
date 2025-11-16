import { motion, AnimatePresence } from 'framer-motion';
import { ForecastDay } from './weatherDataMapper';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface WeatherForecastProps {
  forecast: ForecastDay[];
}

export function WeatherForecast({ forecast }: WeatherForecastProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="absolute top-4 right-4 w-64 space-y-3 z-50">
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="bg-background/80 backdrop-blur-sm border-border/50">
          <CardContent className="p-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">
                Vejrudsigt
              </h3>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="pointer-events-auto p-1 hover:bg-accent/50 rounded transition-colors"
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-3">
                    {forecast.map((day, index) => (
                      <motion.div
                        key={day.day}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 + index * 0.1 }}
                        className="space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{day.icon}</span>
                            <div>
                              <p className="text-xs font-semibold">{day.day}</p>
                              <p className="text-xs text-muted-foreground">{day.condition}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-medium">{day.confidence}%</p>
                            <p className="text-[10px] text-muted-foreground">tillid</p>
                          </div>
                        </div>

                        {/* Confidence bar */}
                        <Progress value={day.confidence} className="h-1" />

                        {/* Description */}
                        <p className="text-[11px] text-muted-foreground italic leading-tight">
                          {day.description}
                        </p>

                        {/* Divider except for last item */}
                        {index < forecast.length - 1 && (
                          <div className="border-t border-border/30 pt-2" />
                        )}
                      </motion.div>
                    ))}
                  </div>

                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
