import { motion } from 'framer-motion';
import { WindPattern } from './weatherDataMapper';

interface WindPatternsProps {
  pattern: WindPattern;
}

export function WindPatterns({ pattern }: WindPatternsProps) {
  // Debug logging
  console.log('🌬️ Wind Patterns:', pattern);
  
  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg className="w-full h-full">
        <defs>
          {/* Arrow marker for wind direction */}
          <marker
            id="wind-arrow"
            markerWidth="8"
            markerHeight="8"
            refX="6"
            refY="4"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,8 L8,4 z" fill="white" opacity="0.9" />
          </marker>
          
          {/* Glow filter for wind lines */}
          <filter id="wind-glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <g>
          {pattern.lines.map((line, index) => (
            <motion.line
              key={`wind-${index}`}
              x1={`${line.x1}%`}
              y1={`${line.y1}%`}
              x2={`${line.x2}%`}
              y2={`${line.y2}%`}
              stroke="white"
              strokeWidth="4"
              strokeDasharray="12,6"
              markerEnd="url(#wind-arrow)"
              filter="url(#wind-glow)"
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: [0, 0.9, 0.9, 0],
              }}
              transition={{
                duration: pattern.speed,
                delay: index * 0.2,
                repeat: Infinity,
                repeatType: 'loop',
                ease: 'easeInOut',
              }}
            />
          ))}
        </g>
      </svg>

      {/* Wind info label - moved to fixed position */}
      <div className="absolute top-16 left-4 bg-background/90 backdrop-blur-sm border border-border/50 rounded-lg px-3 py-2 shadow-lg z-10">
        <p className="text-xs font-semibold">
          Vindhastighed: {pattern.speed === 2 ? 'Hurtig' : pattern.speed === 4 ? 'Mellem' : pattern.speed === 6 ? 'Langsom' : 'Meget langsom'}
        </p>
        <p className="text-[10px] text-muted-foreground capitalize">
          Mønster: {pattern.type === 'radial' ? 'Radial' : pattern.type === 'topdown' ? 'Top-down' : pattern.type === 'network' ? 'Netværk' : 'Distribueret'}
        </p>
        <p className="text-[10px] text-muted-foreground">
          Linjer: {pattern.lines.length}
        </p>
      </div>
    </div>
  );
}
