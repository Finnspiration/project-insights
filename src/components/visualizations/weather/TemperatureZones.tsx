import { motion } from 'framer-motion';
import { TemperatureRegion } from './weatherDataMapper';
import { useState } from 'react';

interface TemperatureZonesProps {
  zones: TemperatureRegion[];
}

export function TemperatureZones({ zones }: TemperatureZonesProps) {
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);

  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg className="w-full h-full">
        <defs>
          {/* Radial gradients for each zone */}
          {zones.map((zone) => (
            <radialGradient key={`gradient-${zone.id}`} id={`temp-${zone.id}`}>
              <stop offset="0%" stopColor={zone.color} stopOpacity="0.6" />
              <stop offset="50%" stopColor={zone.color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={zone.color} stopOpacity="0" />
            </radialGradient>
          ))}
        </defs>

        {/* Temperature zones as circles */}
        {zones.map((zone, index) => (
          <motion.g
            key={zone.id}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.15, duration: 0.8 }}
            onMouseEnter={(e) => {
              setHoveredZone(zone.id);
              const svg = e.currentTarget.ownerSVGElement;
              if (svg) {
                const rect = svg.getBoundingClientRect();
                const x = rect.left + (zone.position.x / 100) * rect.width;
                const y = rect.top + (zone.position.y / 100) * rect.height;
                setTooltipPosition({ x, y });
              }
            }}
            onMouseLeave={() => {
              setHoveredZone(null);
              setTooltipPosition(null);
            }}
            className="pointer-events-auto cursor-pointer"
          >
            {/* Zone circle */}
            <motion.circle
              cx={`${zone.position.x}%`}
              cy={`${zone.position.y}%`}
              r={hoveredZone === zone.id ? '18%' : '15%'}
              fill={`url(#temp-${zone.id})`}
              stroke={zone.color}
              strokeWidth={hoveredZone === zone.id ? 3 : 1.5}
              strokeOpacity={0.5}
              transition={{ duration: 0.3 }}
            />

            {/* Temperature indicator */}
            <circle
              cx={`${zone.position.x}%`}
              cy={`${zone.position.y}%`}
              r="3%"
              fill={zone.color}
              opacity={0.8}
            />

            {/* Label */}
            <text
              x={`${zone.position.x}%`}
              y={`${zone.position.y - 6}%`}
              textAnchor="middle"
              className="fill-white text-sm font-bold"
              style={{ textShadow: '0 0 8px rgba(0,0,0,1), 0 0 4px rgba(0,0,0,1)' }}
            >
              {zone.name}
            </text>

            {/* Score */}
            <text
              x={`${zone.position.x}%`}
              y={`${zone.position.y + 1}%`}
              textAnchor="middle"
              className="fill-white text-lg font-bold"
              style={{ textShadow: '0 0 8px rgba(0,0,0,1), 0 0 4px rgba(0,0,0,1)' }}
            >
              {zone.score}/10
            </text>

            {/* Temperature value in celsius */}
            <text
              x={`${zone.position.x}%`}
              y={`${zone.position.y + 5}%`}
              textAnchor="middle"
              className="fill-white text-xs font-semibold"
              style={{ textShadow: '0 0 8px rgba(0,0,0,1), 0 0 4px rgba(0,0,0,1)' }}
            >
              {Math.round(zone.temperature)}°C
            </text>
          </motion.g>
        ))}

        {/* Connecting lines between zones (subtle) */}
        <g opacity="0.2" stroke="white" strokeWidth="1" strokeDasharray="4,4">
          <line x1="20%" y1="20%" x2="50%" y2="50%" />
          <line x1="80%" y1="20%" x2="50%" y2="50%" />
          <line x1="20%" y1="80%" x2="50%" y2="50%" />
          <line x1="80%" y1="80%" x2="50%" y2="50%" />
        </g>
      </svg>

      {/* Hover tooltip */}
      {hoveredZone && tooltipPosition && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            position: 'fixed',
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y - 80}px`,
            transform: 'translateX(-50%)',
          }}
          className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 pointer-events-none shadow-lg z-50"
        >
          <p className="text-sm font-semibold whitespace-nowrap">
            {zones.find((z) => z.id === hoveredZone)?.name}
          </p>
          <p className="text-xs text-muted-foreground">
            IDG Score: {zones.find((z) => z.id === hoveredZone)?.score}/10
          </p>
          <div className="flex items-center gap-2 mt-1">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: zones.find((z) => z.id === hoveredZone)?.color }}
            />
            <p className="text-xs">
              Temp: {Math.round(zones.find((z) => z.id === hoveredZone)?.temperature || 0)}°C
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
