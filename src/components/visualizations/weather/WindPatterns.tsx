import { motion } from 'framer-motion';
import { WindPattern } from './weatherDataMapper';

interface WindPatternsProps {
  pattern: WindPattern;
}

export function WindPatterns({ pattern }: WindPatternsProps) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg className="w-full h-full" style={{ opacity: 0.4 }}>
        <defs>
          {/* Arrow marker for wind direction */}
          <marker
            id="wind-arrow"
            markerWidth="6"
            markerHeight="6"
            refX="5"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,6 L6,3 z" fill="white" opacity="0.8" />
          </marker>
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
              strokeWidth="2"
              strokeDasharray="8,4"
              markerEnd="url(#wind-arrow)"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.6 }}
              transition={{
                duration: pattern.speed,
                delay: index * 0.1,
                repeat: Infinity,
                repeatType: 'loop',
                ease: 'linear',
              }}
            />
          ))}
        </g>
      </svg>

      {/* Wind info label */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-background/80 backdrop-blur-sm border border-border/50 rounded-lg px-3 py-2">
        <p className="text-xs font-semibold text-center">
          Vindhastighed: {pattern.speed === 2 ? 'Hurtig' : pattern.speed === 4 ? 'Mellem' : pattern.speed === 6 ? 'Langsom' : 'Meget langsom'}
        </p>
        <p className="text-[10px] text-muted-foreground text-center capitalize">
          Mønster: {pattern.type === 'radial' ? 'Radial' : pattern.type === 'topdown' ? 'Top-down' : pattern.type === 'network' ? 'Netværk' : 'Distribueret'}
        </p>
      </div>
    </div>
  );
}
