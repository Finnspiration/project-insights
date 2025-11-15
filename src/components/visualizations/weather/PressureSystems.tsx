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
    <TooltipProvider>
      <div className="absolute inset-0 pointer-events-none">
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

        {/* Pressure Zones */}
        {systems.zones.map((zone, index) => (
          <g key={zone.id}>
            {/* Visual elements (SVG graphics) */}
            <motion.g
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.2, duration: 0.6 }}
            >
              {/* Isobar circles with increased visibility */}
              {Array.from({ length: zone.intensity }).map((_, i) => {
                // Determine stroke style based on source
                const isBlindSpotSource = zone.metadata?.source === 'blind_spot';
                const isLowPressure = zone.type === 'L';
                
                // Enhanced stroke widths for better visibility
                const strokeWidth = isBlindSpotSource ? '3' : isLowPressure ? '2' : '2.5';
                const strokeOpacity = isBlindSpotSource ? '0.9' : isLowPressure ? '0.6' : '0.7';
                
                // Get color based on type and source
                const getZoneColor = () => {
                  if (zone.type === 'H') {
                    return isBlindSpotSource 
                      ? 'hsl(0, 85%, 45%)' // Darker red for blind spot H zones
                      : 'hsl(0, 70%, 55%)'; // Normal red for risk profile H zones
                  } else {
                    return 'hsl(220, 70%, 50%)'; // Blue for L zones
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

              {/* Zone name */}
              <text
                x={`${zone.x}%`}
                y={`${zone.y + 4}%`}
                textAnchor="middle"
                className="fill-white text-xs font-medium"
                style={{ textShadow: '0 0 8px rgba(0,0,0,1), 0 0 4px rgba(0,0,0,1)' }}
              >
                {zone.label}
              </text>

              {/* Storm warning icon for high pressure */}
              {zone.type === 'H' && zone.intensity >= 3 && (
                <g transform={`translate(${zone.x + 8}%, ${zone.y - 8}%)`}>
                  <circle r="2%" fill="hsl(0, 100%, 50%)" opacity="0.9" />
                  <foreignObject x="-1.5%" y="-1.5%" width="3%" height="3%">
                    <div className="flex items-center justify-center w-full h-full">
                      <AlertTriangle className="text-white w-1/2 h-1/2" />
                    </div>
                  </foreignObject>
                </g>
              )}
            </motion.g>

            {/* Interactive tooltip trigger (native SVG circle) */}
            <Tooltip>
              <TooltipTrigger asChild>
                <circle
                  cx={`${zone.x}%`}
                  cy={`${zone.y}%`}
                  r={hoveredZone === zone.id ? "9%" : "8%"}
                  fill="transparent"
                  className="cursor-pointer transition-all duration-300"
                  style={{ pointerEvents: 'all' }}
                  onMouseEnter={() => setHoveredZone(zone.id)}
                  onMouseLeave={() => setHoveredZone(null)}
                  stroke={hoveredZone === zone.id ? 'rgba(255,255,255,0.3)' : 'transparent'}
                  strokeWidth="2"
                />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <div className="space-y-1">
                  <p className="font-semibold">{zone.type === 'H' ? 'Højtryk' : 'Lavtryk'}: {zone.label}</p>
                  <p className="text-sm">{zone.metadata?.description}</p>
                  {zone.metadata?.blindSpotTitle && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Blind spot: {zone.metadata.blindSpotTitle}
                    </p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </g>
        ))}

        {/* Fronts */}
        {systems.fronts.map((front, index) => {
          const pathData = `M ${front.points.map((p) => `${p.x},${p.y}`).join(' L ')}`;
          const midPoint = front.points[Math.floor(front.points.length / 2)];

          return (
            <g key={front.id}>
              {/* Visual elements (SVG graphics) */}
              <motion.g
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.7 }}
                transition={{ delay: 0.5 + index * 0.15, duration: 1.2 }}
              >
                {/* Front line with intensity-based colors */}
                <path
                  d={pathData}
                  fill="none"
                  stroke={
                    front.type === 'cold'
                      ? `hsl(220, 80%, ${50 - (front.intensity * 5)}%)` // Darker blue for higher intensity
                      : front.type === 'warm'
                      ? `hsl(0, 80%, ${50 - (front.intensity * 5)}%)` // Darker red for higher intensity
                      : `hsl(280, 80%, ${50 - (front.intensity * 5)}%)` // Darker purple for occluded
                  }
                  strokeWidth={front.intensity * 1.5} // Thicker lines for higher intensity
                  strokeLinecap="round"
                />

                {/* Front symbols */}
                {front.points.map((point, i) => {
                  if (i % 3 !== 0) return null; // Only show symbols at intervals

                  if (front.type === 'cold') {
                    // Cold front: triangles
                    return (
                      <polygon
                        key={`symbol-${i}`}
                        points={`${point.x - 4},${point.y - 6} ${point.x},${point.y + 2} ${point.x + 4},${point.y - 6}`}
                        fill={`hsl(220, 80%, ${50 - (front.intensity * 5)}%)`}
                        opacity="0.9"
                      />
                    );
                  } else if (front.type === 'warm') {
                    // Warm front: circles
                    return (
                      <circle
                        key={`symbol-${i}`}
                        cx={point.x}
                        cy={point.y}
                        r="3"
                        fill={`hsl(0, 80%, ${50 - (front.intensity * 5)}%)`}
                        opacity="0.9"
                      />
                    );
                  } else {
                    // Occluded front: alternating triangles and circles
                    return i % 6 === 0 ? (
                      <polygon
                        key={`symbol-${i}`}
                        points={`${point.x - 3},${point.y - 5} ${point.x},${point.y + 1} ${point.x + 3},${point.y - 5}`}
                        fill={`hsl(280, 80%, ${50 - (front.intensity * 5)}%)`}
                        opacity="0.9"
                      />
                    ) : (
                      <circle
                        key={`symbol-${i}`}
                        cx={point.x}
                        cy={point.y}
                        r="2.5"
                        fill={`hsl(280, 80%, ${50 - (front.intensity * 5)}%)`}
                        opacity="0.9"
                      />
                    );
                  }
                })}
              </motion.g>

              {/* Interactive tooltip trigger (transparent path over front line) */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <path
                    d={pathData}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={hoveredFront === front.id ? "20" : "15"}
                    className="cursor-pointer transition-all duration-300"
                    style={{ pointerEvents: 'all' }}
                    onMouseEnter={() => setHoveredFront(front.id)}
                    onMouseLeave={() => setHoveredFront(null)}
                    strokeLinecap="round"
                  />
                </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <div className="space-y-1">
                  <p className="font-semibold">
                    {front.type === 'cold' ? 'Kold front' : front.type === 'warm' ? 'Varm front' : 'Okkluderet front'}
                  </p>
                  {front.metadata?.description && (
                    <p className="text-sm">{front.metadata.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground">Intensitet: {front.intensity}/5</p>
                </div>
              </TooltipContent>
              </Tooltip>
            </g>
          );
        })}
        </svg>
      </div>
    </TooltipProvider>
  );
}
