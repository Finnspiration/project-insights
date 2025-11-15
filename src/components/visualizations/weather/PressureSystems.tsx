import { motion } from 'framer-motion';
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
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [hoveredFront, setHoveredFront] = useState<string | null>(null);

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

          {/* Pressure Fronts - Visual Only */}
          {systems.fronts.map((front, index) => {
            const pathData = `M ${front.points.map(p => `${p.x} ${p.y}`).join(' L ')}`;
            const midPointIndex = Math.floor(front.points.length / 2);
            const midPoint = front.points[midPointIndex];
            
            const getStrokeColor = (intensity: number) => {
              if (intensity >= 8) return 'hsl(0, 80%, 55%)';
              if (intensity >= 5) return 'hsl(30, 85%, 55%)';
              return 'hsl(200, 70%, 55%)';
            };

            return (
              <motion.g
                key={front.id}
                initial={{ opacity: 0, pathLength: 0 }}
                animate={{ opacity: 1, pathLength: 1 }}
                transition={{ delay: index * 0.3, duration: 0.8 }}
              >
                {/* Front line */}
                <path
                  d={pathData}
                  fill="none"
                  stroke={getStrokeColor(front.intensity)}
                  strokeWidth={front.intensity >= 7 ? "4" : "3"}
                  strokeOpacity="0.8"
                  strokeLinecap="round"
                  strokeDasharray={front.type === 'occluded' ? '10,5' : 'none'}
                />

                {/* Front symbols */}
                {front.points.map((point, i) => {
                  if (i % 3 !== 0) return null;

                  if (front.type === 'cold') {
                    return (
                      <polygon
                        key={`symbol-${i}`}
                        points={`${point.x},${point.y - 1.5} ${point.x - 1.2},${point.y + 1.5} ${point.x + 1.2},${point.y + 1.5}`}
                        fill={getStrokeColor(front.intensity)}
                        opacity="0.9"
                      />
                    );
                  } else if (front.type === 'warm') {
                    return (
                      <circle
                        key={`symbol-${i}`}
                        cx={point.x}
                        cy={point.y}
                        r="1.2"
                        fill={getStrokeColor(front.intensity)}
                        opacity="0.9"
                      />
                    );
                  } else {
                    return i % 6 === 0 ? (
                      <polygon
                        key={`symbol-${i}`}
                        points={`${point.x},${point.y - 1.5} ${point.x - 1.2},${point.y + 1.5} ${point.x + 1.2},${point.y + 1.5}`}
                        fill={getStrokeColor(front.intensity)}
                        opacity="0.9"
                      />
                    ) : (
                      <circle
                        key={`symbol-${i}`}
                        cx={point.x}
                        cy={point.y}
                        r="1.2"
                        fill={getStrokeColor(front.intensity)}
                        opacity="0.9"
                      />
                    );
                  }
                })}
              </motion.g>
            );
          })}
        </svg>

        {/* Interactive Layer - HTML Div Overlays for Tooltips - MUST be above all other layers */}
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 50 }}>
        {systems.zones.map((zone, index) => (
          <Tooltip key={`tooltip-zone-${zone.id}`}>
            <TooltipTrigger asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.2 + 0.3 }}
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
                }}
                onMouseEnter={() => setHoveredZone(zone.id)}
                onMouseLeave={() => setHoveredZone(null)}
              />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">
                    {zone.type === 'H' ? 'Højtrykssystem' : 'Lavtrykssystem'}
                  </span>
                  {zone.metadata?.source === 'blind_spot' && (
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Intensitet: {zone.intensity}/10
                </p>
                {zone.metadata?.blindSpotTitle && (
                  <p className="text-sm font-medium">{zone.metadata.blindSpotTitle}</p>
                )}
                {zone.metadata?.description && (
                  <p className="text-xs text-muted-foreground">{zone.metadata.description}</p>
                )}
                {zone.metadata?.source === 'blind_spot' && (
                  <p className="text-xs text-destructive">⚠️ Kritisk blind vinkel</p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        ))}

        {systems.fronts.map((front, index) => {
          const midPointIndex = Math.floor(front.points.length / 2);
          const midPoint = front.points[midPointIndex];
          
          return (
            <Tooltip key={`tooltip-front-${front.id}`}>
              <TooltipTrigger asChild>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.3 + 0.5 }}
                  className="absolute pointer-events-auto cursor-pointer"
                  style={{
                    left: `${midPoint.x}%`,
                    top: `${midPoint.y}%`,
                    transform: 'translate(-50%, -50%)',
                    width: hoveredFront === front.id ? '100px' : '80px',
                    height: hoveredFront === front.id ? '40px' : '30px',
                    borderRadius: '20px',
                    transition: 'all 0.3s',
                    border: hoveredFront === front.id ? '2px solid rgba(255,255,255,0.4)' : '2px solid transparent',
                    backgroundColor: hoveredFront === front.id ? 'rgba(255,255,255,0.05)' : 'transparent',
                  }}
                  onMouseEnter={() => setHoveredFront(front.id)}
                  onMouseLeave={() => setHoveredFront(null)}
                />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <div className="space-y-2">
                  <div className="font-semibold">
                    {front.type === 'cold' && 'Koldfront'}
                    {front.type === 'warm' && 'Varmefront'}
                    {front.type === 'occluded' && 'Okkluderet front'}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Intensitet: {front.intensity}/10
                  </p>
                  {front.metadata?.description && (
                    <p className="text-xs text-muted-foreground">{front.metadata.description}</p>
                  )}
                  <p className="text-xs">
                    {front.type === 'cold' && '▼ Kold luft presser ind - skaber turbulens'}
                    {front.type === 'warm' && '● Varm luft stiger - gradvis forandring'}
                    {front.type === 'occluded' && '▼● Kompleks front - blandet dynamik'}
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
        </div>
      </TooltipProvider>
    </div>
  );
}
