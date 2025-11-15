import { motion } from 'framer-motion';
import { BaseClimateData } from './weatherDataMapper';

interface BaseClimateProps {
  data: BaseClimateData;
}

export function BaseClimate({ data }: BaseClimateProps) {
  // Generate cloud positions based on sky density
  const clouds = Array.from({ length: data.skyDensity }, (_, i) => ({
    id: i,
    x: (i * 73 + 10) % 90, // Pseudo-random x position
    y: (i * 37 + 5) % 40, // Keep clouds in upper portion
    size: 40 + (i * 17) % 40, // Varying sizes
    opacity: 0.3 + (i * 0.05) % 0.4,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Background gradient */}
      <div
        className="absolute inset-0"
        style={{ background: data.backgroundColor }}
      />

      {/* Clouds */}
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <filter id="cloud-blur">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
          </filter>
        </defs>
        {clouds.map((cloud) => (
          <motion.g
            key={cloud.id}
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: cloud.opacity }}
            transition={{
              duration: 2 + cloud.id * 0.3,
              ease: 'easeOut',
            }}
          >
            {/* Cloud shape using multiple circles */}
            <ellipse
              cx={`${cloud.x}%`}
              cy={`${cloud.y}%`}
              rx={cloud.size * 0.6}
              ry={cloud.size * 0.4}
              fill={data.skyColor}
              filter="url(#cloud-blur)"
            />
            <ellipse
              cx={`${cloud.x + 2}%`}
              cy={`${cloud.y - 1}%`}
              rx={cloud.size * 0.5}
              ry={cloud.size * 0.35}
              fill={data.skyColor}
              filter="url(#cloud-blur)"
            />
            <ellipse
              cx={`${cloud.x - 2}%`}
              cy={`${cloud.y - 0.5}%`}
              rx={cloud.size * 0.4}
              ry={cloud.size * 0.3}
              fill={data.skyColor}
              filter="url(#cloud-blur)"
            />
          </motion.g>
        ))}
      </svg>

      {/* Info overlay (bottom left) */}
      <div className="absolute bottom-4 left-4 text-white/90 text-sm space-y-1 bg-black/20 backdrop-blur-sm px-3 py-2 rounded-lg">
        <p className="font-semibold capitalize">Stage: {data.organizationalStage}</p>
        <p className="text-xs opacity-80 capitalize">Complexity: {data.complexity}</p>
      </div>
    </div>
  );
}
