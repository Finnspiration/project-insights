import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { PressureZone, PressureFront } from './weatherDataMapper';
import { AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useState } from 'react';

interface PressureSystemsProps {
  systems: {
    zones: PressureZone[];
    fronts: PressureFront[];
  };
}

export function PressureSystems({ systems }: PressureSystemsProps) {
  const { t } = useTranslation('common');
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [hoveredFront, setHoveredFront] = useState<string | null>(null);

  // Debug logging
  console.log('🌊 Pressure Fronts:', systems.fronts.length, systems.fronts);

  return (
    <div className="absolute inset-0 pointer-events-none">
      <TooltipProvider>
        {/* SVG Layer - Pure Visual (no interactivity) */}
        <svg className="w-full h-full">
          <defs>
            {/* Isobar gradient */}
            <radialGradient id="pressure-gradient-h">
              <stop offset="0%" stopColor="hsl(0, 70%, 50%)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="hsl(0, 70%, 50%)" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="pressure-gradient-l">
              <stop offset="0%" stopColor="hsl(220, 70%, 50%)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="hsl(220, 70%, 50%)" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Pressure Zones - Visual Only */}
          {systems.zones.map((zone, index) => (
            <motion.g
              key={zone.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.2, duration: 0.6 }}
            >
              {/* Isobar circles with increased visibility */}
              {Array.from({ length: zone.intensity }).map((_, i) => {
                const isBlindSpotSource = zone.metadata?.source === 'blind_spot';
                const isLowPressure = zone.type === 'L';
                
                const strokeWidth = isBlindSpotSource ? '3' : isLowPressure ? '2' : '2.5';
                const strokeOpacity = isBlindSpotSource ? '0.9' : isLowPressure ? '0.6' : '0.7';
                
                const getZoneColor = () => {
                  if (zone.type === 'H') {
                    return isBlindSpotSource 
                      ? 'hsl(0, 85%, 45%)'
                      : 'hsl(0, 70%, 55%)';
                  } else {
                    return 'hsl(220, 70%, 50%)';
                  }
                };

                return (
                  <circle
                    key={`isobar-${zone.id}-${i}`}
                    cx={`${zone.x}%`}
                    cy={`${zone.y}%`}
                    r={`${8 + i * 4}%`}
                    fill="none"
                    stroke={getZoneColor()}
                    strokeWidth={strokeWidth}
                    strokeOpacity={strokeOpacity}
                    strokeDasharray="6,3"
                  />
                );
              })}

              {/* Center marker */}
              <circle
                cx={`${zone.x}%`}
                cy={`${zone.y}%`}
                r="2%"
                fill={zone.type === 'H' 
                  ? (zone.metadata?.source === 'blind_spot' ? 'hsl(0, 90%, 55%)' : 'hsl(0, 80%, 60%)')
                  : 'hsl(220, 80%, 60%)'}
                opacity="0.8"
              />

              {/* Label */}
              <text
                x={`${zone.x}%`}
                y={`${zone.y}%`}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-white text-2xl font-bold"
                style={{ textShadow: '0 0 8px rgba(0,0,0,1), 0 0 4px rgba(0,0,0,1)' }}
              >
                {zone.type}
              </text>

              {/* Warning icon for blind spots */}
              {zone.metadata?.source === 'blind_spot' && (
                <g transform={`translate(${zone.x}, ${zone.y - 4})`}>
                  <circle
                    cx="0"
                    cy="0"
                    r="3%"
                    fill="hsl(0, 90%, 50%)"
                    opacity="0.9"
                  />
                </g>
              )}
            </motion.g>
          ))}

          {/* Front lines with visual styling */}
          {systems.fronts.map((front, index) => (
            <motion.g
              key={front.id}
              initial={{ opacity: 0.8 }}
              animate={{
                opacity: hoveredFront === front.id ? 1 : 0.8,
              }}
              transition={{ delay: index * 0.3, duration: 0.8 }}
            >
              {/* Front line - INCREASED VISIBILITY */}
              <motion.polyline
                points={front.points.map(p => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke={front.type === 'cold' ? 'hsl(220, 90%, 60%)' : 'hsl(0, 90%, 60%)'}
                strokeWidth="5"
                strokeDasharray="8,4"
                strokeLinecap="round"
                animate={{
                  strokeWidth: hoveredFront === front.id ? 6 : 5,
                  opacity: hoveredFront === front.id ? 1 : 0.8,
                }}
                transition={{ duration: 0.2 }}
              />

              {/* Front symbols - USING NATIVE SVG COORDINATES */}
              <g style={{ pointerEvents: 'none' }}>
                {front.points.map((point, pointIndex) => {
                  if (pointIndex % 2 !== 0) return null;
                  
                  const nextPoint = front.points[pointIndex + 1];
                  if (!nextPoint) return null;
                  
                  const angle = Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x) * (180 / Math.PI);
                  
                  return (
                    <g key={`symbol-${front.id}-${pointIndex}`}>
                      {front.type === 'cold' ? (
                        <polygon
                          points={`${point.x - 1.5},${point.y - 1} ${point.x + 1.5},${point.y + 1} ${point.x - 1.5},${point.y + 1}`}
                          fill="hsl(220, 90%, 60%)"
                          stroke="white"
                          strokeWidth="0.5"
                          transform={`rotate(${angle} ${point.x} ${point.y})`}
                        />
                      ) : (
                        <circle
                          cx={point.x}
                          cy={point.y}
                          r="1.5"
                          fill="hsl(0, 90%, 60%)"
                          stroke="white"
                          strokeWidth="0.5"
                        />
                      )}
                    </g>
                  );
                })}
              </g>
            </motion.g>
          ))}

          {/* HOVER DETECTION LAYER - Invisible thick lines for easy front detection */}
          <g className="front-hover-layer">
            {systems.fronts.map((front) => (
              <polyline
                key={`hover-${front.id}`}
                points={front.points.map(p => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke="transparent"
                strokeWidth="20"
                strokeLinecap="round"
                className="cursor-pointer"
                style={{ pointerEvents: 'stroke' }}
                onMouseEnter={() => setHoveredFront(front.id)}
                onMouseLeave={() => setHoveredFront(null)}
              />
            ))}
          </g>
        </svg>

        {/* HTML Layer - Interactive Tooltips */}
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 100 }}>
          {/* Zone tooltips */}
          {systems.zones.map((zone) => (
            <Tooltip key={zone.id}>
              <TooltipTrigger asChild>
                <motion.div
                  className="absolute pointer-events-auto cursor-pointer"
                  style={{
                    left: `${zone.x}%`,
                    top: `${zone.y}%`,
                    transform: 'translate(-50%, -50%)',
                    width: hoveredZone === zone.id ? '80px' : '60px',
                    height: hoveredZone === zone.id ? '80px' : '60px',
                    borderRadius: '50%',
                    transition: 'all 0.3s',
                    border: hoveredZone === zone.id ? '2px solid rgba(255,255,255,0.4)' : '2px solid transparent',
                    backgroundColor: hoveredZone === zone.id ? 'rgba(255,255,255,0.05)' : 'transparent',
                    zIndex: hoveredZone === zone.id ? 110 : 100,
                  }}
                  onMouseEnter={() => setHoveredZone(zone.id)}
                  onMouseLeave={() => setHoveredZone(null)}
                />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">
                    {zone.type === 'H' ? t('visualizations.pressureSystems.highPressure') : t('visualizations.pressureSystems.lowPressure')}
                  </span>
                  {zone.metadata?.source === 'blind_spot' && (
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('visualizations.pressureSystems.intensity', { value: zone.intensity })}
                </p>
                {zone.metadata?.blindSpotTitle && (
                  <p className="text-sm font-medium">{zone.metadata.blindSpotTitle}</p>
                )}
                {zone.metadata?.description && (
                  <p className="text-xs text-muted-foreground">{zone.metadata.description}</p>
                )}
                {zone.metadata?.source === 'blind_spot' && (
                  <p className="text-xs text-destructive">{t('visualizations.pressureSystems.criticalBlindSpot')}</p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        ))}

          {/* Front tooltips - ONE per front at center point */}
          {hoveredFront && systems.fronts.map((front) => {
            if (front.id !== hoveredFront) return null;
            
            const midPointIndex = Math.floor(front.points.length / 2);
            const midPoint = front.points[midPointIndex];
            
            return (
              <motion.div
                key={`front-tooltip-${front.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute pointer-events-none"
                style={{
                  left: `${midPoint.x}%`,
                  top: `${midPoint.y}%`,
                  transform: 'translate(-50%, -120%)',
                  zIndex: 100,
                }}
              >
                <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg max-w-xs">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-sm">
                      {front.type === 'cold' ? '❄️ Kold Front' : '🌡️ Varm Front'}
                    </h4>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                      Intensitet: {front.intensity}/10
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {front.metadata?.description || 'Stakeholder dynamik'}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </TooltipProvider>

      {/* Visual feedback when hovering over a front - highlight the entire front line */}
      {hoveredFront && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 55 }}>
          {systems.fronts
            .filter(f => f.id === hoveredFront)
            .map(front => {
              const pathData = `M ${front.points.map(p => `${p.x} ${p.y}`).join(' L ')}`;
              const getStrokeColor = (intensity: number) => {
                if (intensity >= 8) return 'hsl(0, 80%, 55%)';
                if (intensity >= 5) return 'hsl(30, 85%, 55%)';
                return 'hsl(200, 70%, 55%)';
              };
              
              return (
                <motion.path
                  key={`highlight-${front.id}`}
                  d={pathData}
                  fill="none"
                  stroke={getStrokeColor(front.intensity)}
                  strokeWidth="6"
                  strokeOpacity="0.6"
                  strokeLinecap="round"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                />
              );
            })}
        </svg>
      )}
    </div>
  );
}

