import { motion } from 'framer-motion';
import { useState } from 'react';

interface IDGScore {
  dimension: string;
  label: { en: string; da: string };
  score: number;
  temperature: number;
  color: string;
  position: { x: number; y: number };
}

interface IDGOverlayProps {
  idgScores: {
    being: number;
    thinking: number;
    relating: number;
    collaborating: number;
    acting: number;
  };
  language?: 'en' | 'da';
}

// Map IDG score (0-10) to temperature (-10 to 30°C)
const mapScoreToTemperature = (score: number): number => {
  return -10 + (score * 4);
};

// Get color based on temperature
const getTemperatureColor = (temperature: number): string => {
  if (temperature <= 0) return '#3b82f6'; // Blue (cold)
  if (temperature <= 10) return '#06b6d4'; // Cyan
  if (temperature <= 20) return '#10b981'; // Green
  if (temperature <= 25) return '#f59e0b'; // Orange
  return '#ef4444'; // Red (hot)
};

export function IDGOverlay({ idgScores, language = 'en' }: IDGOverlayProps) {
  const [hoveredDimension, setHoveredDimension] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);

  // Define IDG dimensions with positions forming a pentagon around the map
  const idgDimensions: IDGScore[] = [
    {
      dimension: 'being',
      label: { en: 'Being', da: 'Væren' },
      score: idgScores.being,
      temperature: mapScoreToTemperature(idgScores.being),
      color: getTemperatureColor(mapScoreToTemperature(idgScores.being)),
      position: { x: 50, y: 15 } // Top center
    },
    {
      dimension: 'thinking',
      label: { en: 'Thinking', da: 'Tænkning' },
      score: idgScores.thinking,
      temperature: mapScoreToTemperature(idgScores.thinking),
      color: getTemperatureColor(mapScoreToTemperature(idgScores.thinking)),
      position: { x: 82, y: 35 } // Top right
    },
    {
      dimension: 'relating',
      label: { en: 'Relating', da: 'Relationsdannelse' },
      score: idgScores.relating,
      temperature: mapScoreToTemperature(idgScores.relating),
      color: getTemperatureColor(mapScoreToTemperature(idgScores.relating)),
      position: { x: 72, y: 75 } // Bottom right
    },
    {
      dimension: 'collaborating',
      label: { en: 'Collaborating', da: 'Samarbejde' },
      score: idgScores.collaborating,
      temperature: mapScoreToTemperature(idgScores.collaborating),
      color: getTemperatureColor(mapScoreToTemperature(idgScores.collaborating)),
      position: { x: 28, y: 75 } // Bottom left
    },
    {
      dimension: 'acting',
      label: { en: 'Acting', da: 'Handling' },
      score: idgScores.acting,
      temperature: mapScoreToTemperature(idgScores.acting),
      color: getTemperatureColor(mapScoreToTemperature(idgScores.acting)),
      position: { x: 18, y: 35 } // Top left
    }
  ];

  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg className="w-full h-full">
        <defs>
          {/* Radial gradients for each IDG dimension */}
          {idgDimensions.map((idg) => (
            <radialGradient key={`idg-gradient-${idg.dimension}`} id={`idg-${idg.dimension}`}>
              <stop offset="0%" stopColor={idg.color} stopOpacity="0.5" />
              <stop offset="50%" stopColor={idg.color} stopOpacity="0.2" />
              <stop offset="100%" stopColor={idg.color} stopOpacity="0" />
            </radialGradient>
          ))}
          
          {/* Pentagon outline connecting all IDG points */}
          <filter id="idg-glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Pentagon connecting lines */}
        <g opacity="0.3" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeDasharray="5,5" fill="none">
          <polygon
            points={idgDimensions.map(idg => `${idg.position.x}%,${idg.position.y}%`).join(' ')}
            filter="url(#idg-glow)"
          />
        </g>

        {/* IDG dimension circles */}
        {idgDimensions.map((idg, index) => (
          <motion.g
            key={idg.dimension}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 + index * 0.1, duration: 0.6 }}
            onMouseEnter={(e) => {
              setHoveredDimension(idg.dimension);
              const svg = e.currentTarget.ownerSVGElement;
              if (svg) {
                const rect = svg.getBoundingClientRect();
                const x = rect.left + (idg.position.x / 100) * rect.width;
                const y = rect.top + (idg.position.y / 100) * rect.height;
                setTooltipPosition({ x, y });
              }
            }}
            onMouseLeave={() => {
              setHoveredDimension(null);
              setTooltipPosition(null);
            }}
            className="pointer-events-auto cursor-pointer"
          >
            {/* Glow circle */}
            <motion.circle
              cx={`${idg.position.x}%`}
              cy={`${idg.position.y}%`}
              r={hoveredDimension === idg.dimension ? '8%' : '6%'}
              fill={`url(#idg-${idg.dimension})`}
              transition={{ duration: 0.3 }}
            />

            {/* Core circle */}
            <circle
              cx={`${idg.position.x}%`}
              cy={`${idg.position.y}%`}
              r="2%"
              fill={idg.color}
              stroke="white"
              strokeWidth={hoveredDimension === idg.dimension ? 2 : 1}
              opacity={0.9}
            />

            {/* Label */}
            <text
              x={`${idg.position.x}%`}
              y={`${idg.position.y - 4}%`}
              textAnchor="middle"
              className="fill-foreground text-xs font-semibold"
              style={{ textShadow: '0 0 6px hsl(var(--background)), 0 0 3px hsl(var(--background))' }}
            >
              {idg.label[language]}
            </text>

            {/* Score */}
            <text
              x={`${idg.position.x}%`}
              y={`${idg.position.y + 0.5}%`}
              textAnchor="middle"
              className="fill-foreground text-sm font-bold"
              style={{ textShadow: '0 0 6px hsl(var(--background)), 0 0 3px hsl(var(--background))' }}
            >
              {idg.score}
            </text>
          </motion.g>
        ))}
      </svg>

      {/* Hover tooltip */}
      {hoveredDimension && tooltipPosition && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            position: 'fixed',
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y - 90}px`,
            transform: 'translateX(-50%)',
          }}
          className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 pointer-events-none shadow-lg z-50"
        >
          <p className="text-sm font-semibold whitespace-nowrap">
            {idgDimensions.find(d => d.dimension === hoveredDimension)?.label[language]}
          </p>
          <p className="text-xs text-muted-foreground">
            IDG Score: {idgDimensions.find(d => d.dimension === hoveredDimension)?.score}/10
          </p>
          <div className="flex items-center gap-2 mt-1">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: idgDimensions.find(d => d.dimension === hoveredDimension)?.color }}
            />
            <p className="text-xs">
              {Math.round(idgDimensions.find(d => d.dimension === hoveredDimension)?.temperature || 0)}°C
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
