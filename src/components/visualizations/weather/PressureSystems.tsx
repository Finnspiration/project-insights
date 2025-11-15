import { motion } from 'framer-motion';
import { PressureZone, PressureFront } from './weatherDataMapper';
import { AlertTriangle } from 'lucide-react';

interface PressureSystemsProps {
  systems: {
    zones: PressureZone[];
    fronts: PressureFront[];
  };
}

export function PressureSystems({ systems }: PressureSystemsProps) {
  return (
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
          <motion.g
            key={zone.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.2, duration: 0.6 }}
          >
            {/* Isobar circles */}
            {Array.from({ length: zone.intensity }).map((_, i) => (
              <circle
                key={`isobar-${zone.id}-${i}`}
                cx={`${zone.x}%`}
                cy={`${zone.y}%`}
                r={`${8 + i * 4}%`}
                fill="none"
                stroke={zone.type === 'H' ? 'hsl(0, 70%, 50%)' : 'hsl(220, 70%, 50%)'}
                strokeWidth="1"
                strokeOpacity="0.4"
                strokeDasharray="4,2"
              />
            ))}

            {/* Center marker */}
            <circle
              cx={`${zone.x}%`}
              cy={`${zone.y}%`}
              r="2%"
              fill={zone.type === 'H' ? 'hsl(0, 80%, 60%)' : 'hsl(220, 80%, 60%)'}
              opacity="0.7"
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
              className="fill-white text-xs font-semibold"
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
        ))}

        {/* Fronts */}
        {systems.fronts.map((front, index) => {
          const pathData = `M ${front.points.map((p) => `${p.x},${p.y}`).join(' L ')}`;

          return (
            <motion.g
              key={front.id}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.7 }}
              transition={{ delay: 0.5 + index * 0.15, duration: 1.2 }}
            >
              {/* Front line */}
              <path
                d={pathData}
                fill="none"
                stroke={
                  front.type === 'cold'
                    ? 'hsl(220, 80%, 50%)'
                    : front.type === 'warm'
                    ? 'hsl(0, 80%, 50%)'
                    : 'hsl(280, 80%, 50%)'
                }
                strokeWidth={front.intensity}
                strokeDasharray={front.type === 'occluded' ? '8,4' : 'none'}
              />

              {/* Front symbols (triangles for cold, semi-circles for warm) */}
              {front.points.slice(1).map((point, i) => (
                <g key={`symbol-${i}`}>
                  {front.type === 'cold' ? (
                    <polygon
                      points={`${point.x - 1},${point.y + 2} ${point.x},${point.y - 2} ${point.x + 1},${point.y + 2}`}
                      fill="hsl(220, 80%, 50%)"
                    />
                  ) : (
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r="1.5"
                      fill="hsl(0, 80%, 50%)"
                    />
                  )}
                </g>
              ))}
            </motion.g>
          );
        })}
      </svg>
    </div>
  );
}
