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
              strokeWidth="4"
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

      {/* Wind info label - enhanced visual feedback with pulsing animation */}
      <motion.div 
        className="absolute top-16 left-4 bg-background/95 backdrop-blur-md border-2 border-primary/30 rounded-lg px-4 py-3 shadow-xl z-10"
        animate={{
          scale: pattern.speed === 2 ? [1, 1.02, 1] : [1, 1.01, 1],
          borderColor: pattern.speed === 2 
            ? ['hsl(var(--primary) / 0.3)', 'hsl(var(--primary) / 0.6)', 'hsl(var(--primary) / 0.3)']
            : ['hsl(var(--primary) / 0.3)', 'hsl(var(--primary) / 0.4)', 'hsl(var(--primary) / 0.3)']
        }}
        transition={{
          duration: pattern.speed / 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <div className="flex items-center gap-2.5 mb-2">
          <motion.span 
            className="text-lg"
            animate={{ rotate: pattern.speed === 2 ? [0, 360] : pattern.speed === 4 ? [0, 180, 0] : [0, 90, 0] }}
            transition={{
              duration: pattern.speed,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            {pattern.speed === 2 ? '🌪️' : pattern.speed === 4 ? '💨' : pattern.speed === 6 ? '🌬️' : '🍃'}
          </motion.span>
          <div>
            <p className="text-sm font-bold text-foreground">
              {pattern.speed === 2 ? 'Meget hurtig' : pattern.speed === 4 ? 'Hurtig' : pattern.speed === 6 ? 'Moderat' : 'Langsom'}
            </p>
            <p className="text-xs text-muted-foreground font-medium">
              {Math.round(10 / pattern.speed * 10)} km/t
            </p>
          </div>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden mb-1.5">
          <motion.div 
            className="h-full bg-gradient-to-r from-primary via-accent to-primary"
            initial={{ width: 0 }}
            animate={{ 
              width: `${(10 / pattern.speed) * 10}%`,
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
            }}
            transition={{ 
              width: { duration: 1, ease: "easeOut" },
              backgroundPosition: { duration: pattern.speed, repeat: Infinity, ease: "linear" }
            }}
            style={{ backgroundSize: '200% 100%' }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground font-medium capitalize">
          Mønster: {pattern.type === 'radial' ? 'Radial' : pattern.type === 'topdown' ? 'Top-down' : pattern.type === 'network' ? 'Netværk' : 'Distribueret'}
        </p>
      </motion.div>
    </div>
  );
}
