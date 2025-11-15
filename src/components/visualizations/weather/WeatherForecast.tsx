import { motion } from 'framer-motion';
import { ForecastDay } from './weatherDataMapper';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface WeatherForecastProps {
  forecast: ForecastDay[];
}

export function WeatherForecast({ forecast }: WeatherForecastProps) {
  return (
    <div className="absolute top-4 right-4 w-64 space-y-3">
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="bg-background/80 backdrop-blur-sm border-border/50">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <span>🔮</span>
              <span>Theory U Vejrudsigt</span>
            </h3>

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

            {/* Legend */}
            <div className="mt-4 pt-3 border-t border-border/30">
              <p className="text-[10px] text-muted-foreground">
                Baseret på Theory U position og beredskapsindikatorer
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
