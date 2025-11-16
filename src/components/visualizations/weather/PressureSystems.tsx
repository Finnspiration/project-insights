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
            const isHovered = hoveredFront === front.id;
            const strokeColor = front.type === 'cold' ? 'hsl(220, 80%, 55%)' : 'hsl(0, 70%, 55%)';
            const strokeWidth = isHovered ? '7' : front.intensity > 2 ? '5' : '4';

            return (
              <motion.g
                key={front.id}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ delay: index * 0.3, duration: 1.2 }}
              >
                {/* Main front line - FIXED: Using % coordinates */}
                <motion.polyline
                  points={front.points.map(p => `${p.x}%,${p.y}%`).join(' ')}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={isHovered ? 0.95 : 0.75}
                  style={{
                    filter: isHovered ? `drop-shadow(0 0 16px ${strokeColor})` : 'none',
                  }}
                />

                {/* Front symbols - FIXED: Using % coordinates */}
                {front.points.map((point, i) => {
                  if (i % 3 !== 0) return null;

                  if (front.type === 'cold') {
                    return (
                      <polygon
                        key={`symbol-${i}`}
                        points={`${point.x}%,${point.y - 1.5}% ${point.x - 1.2}%,${point.y + 1.5}% ${point.x + 1.2}%,${point.y + 1.5}%`}
                        fill={strokeColor}
                        opacity={isHovered ? 1 : 0.9}
                      />
                    );
                  } else if (front.type === 'warm') {
                    return (
                      <circle
                        key={`symbol-${i}`}
                        cx={`${point.x}%`}
                        cy={`${point.y}%`}
                        r="1.2%"
                        fill={strokeColor}
                        opacity={isHovered ? 1 : 0.9}
                      />
                    );
                  }
                  return null;
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

        {/* Front tooltips - one interactive area per point along the front line */}
        {systems.fronts.map((front, frontIndex) => {
          const midPointIndex = Math.floor(front.points.length / 2);
          const midPoint = front.points[midPointIndex];
          
          return (
            <div key={`front-interactive-${front.id}`}>
              {/* Create interactive areas at each point along the front */}
              {front.points.map((point, pointIndex) => {
                // Only create interactive areas every 2 points to avoid too many overlaps
                if (pointIndex % 2 !== 0) return null;
                
                return (
                  <Tooltip key={`tooltip-front-${front.id}-${pointIndex}`}>
                    <TooltipTrigger asChild>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: frontIndex * 0.3 + 0.3 }}
                        className="absolute pointer-events-auto cursor-pointer"
                        style={{
                          left: `${point.x}%`,
                          top: `${point.y}%`,
                          transform: 'translate(-50%, -50%)',
                          width: hoveredFront === front.id ? '90px' : '80px',
                          height: hoveredFront === front.id ? '90px' : '80px',
                          transition: 'all 0.2s ease',
                          zIndex: 60, // Higher than zones
                          cursor: 'pointer',
                        }}
                        onMouseEnter={() => setHoveredFront(front.id)}
                        onMouseLeave={() => setHoveredFront(null)}
                      />
                    </TooltipTrigger>
                    <TooltipContent 
                      side="top" 
                      className={`bg-background/95 backdrop-blur-sm border-border ${
                        hoveredFront === front.id ? 'min-w-[240px]' : 'min-w-[200px]'
                      }`}
                      style={{ zIndex: 70 }}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-sm">
                            {front.type === 'cold' ? '❄️ Kold Front' : 
                             front.type === 'warm' ? '🌡️ Varm Front' : 
                             '🌪️ Okkluderet Front'}
                          </h4>
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                            Intensitet: {front.intensity}/10
                          </span>
                        </div>
                        
                        <p className="text-xs text-muted-foreground">
                          {front.metadata?.description || 
                            (front.type === 'cold' ? 'Kold luft presser ind - skaber turbulens' : 
                             front.type === 'warm' ? 'Varm luft stiger - gradvis forandring' : 
                             'Kompleks front - blandet dynamik')}
                        </p>

                        {front.metadata?.source && (
                          <div className="text-xs bg-muted/50 p-2 rounded">
                            <span className="font-medium">Kilde: </span>
                            {front.metadata.source === 'stakeholder_tension' && 'Interessent spændinger'}
                            {front.metadata.source === 'change_intensity' && 'Ændringsintensitet'}
                            {front.metadata.source === 'blind_spot' && '🔴 Blind Spot'}
                          </div>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
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

