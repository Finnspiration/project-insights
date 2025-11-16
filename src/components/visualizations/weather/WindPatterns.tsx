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
            markerWidth="10"
            markerHeight="10"
            refX="5"
            refY="5"
            orient="auto"
            markerUnits="userSpaceOnUse"
          >
            <path d="M0,0 L10,5 L0,10 z" fill="white" opacity="0.95" />
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
              stroke="rgba(255, 255, 255, 0.9)"
              strokeWidth={pattern.speed === 2 ? "4" : pattern.speed === 4 ? "3.5" : "3"}
              strokeDasharray="10,5"
              strokeLinecap="round"
              markerEnd="url(#wind-arrow)"
              filter="url(#wind-glow)"
              initial={{ opacity: 0.7 }}
              animate={{ 
                opacity: [0.7, 1, 0.7],
                strokeDashoffset: [0, -50],
              }}
              transition={{
                duration: pattern.speed,
                delay: index * 0.3,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          ))}
        </g>
        
        {/* Static fallback lines if animation doesn't work */}
        <g opacity="0.5">
          {pattern.lines.map((line, index) => (
            <line
              key={`static-wind-${index}`}
              x1={`${line.x1}%`}
              y1={`${line.y1}%`}
              x2={`${line.x2}%`}
              y2={`${line.y2}%`}
              stroke="white"
              strokeWidth="2"
              strokeDasharray="8,4"
              opacity="0.3"
            />
          ))}
        </g>
      </svg>

      {/* Wind info label - enhanced visual feedback */}
      <div className="absolute top-16 left-4 bg-background/95 backdrop-blur-md border-2 border-primary/30 rounded-lg px-4 py-2.5 shadow-xl z-10">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-base">
            {pattern.speed === 2 ? '🌪️' : pattern.speed === 4 ? '💨' : pattern.speed === 6 ? '🌬️' : '🍃'}
          </span>
          <div>
            <p className="text-xs font-bold text-foreground">
              {pattern.speed === 2 ? 'Meget hurtig' : pattern.speed === 4 ? 'Hurtig' : pattern.speed === 6 ? 'Moderat' : 'Langsom'}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {Math.round(10 / pattern.speed * 10)} km/t
            </p>
          </div>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-primary to-accent"
            initial={{ width: 0 }}
            animate={{ width: `${(10 / pattern.speed) * 10}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
        <p className="text-[9px] text-muted-foreground mt-1 capitalize">
          {pattern.type === 'radial' ? 'Radial' : pattern.type === 'topdown' ? 'Top-down' : pattern.type === 'network' ? 'Netværk' : 'Distribueret'}
        </p>
      </div>
    </div>
  );
}
