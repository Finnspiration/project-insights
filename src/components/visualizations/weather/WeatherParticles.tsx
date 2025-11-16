import { motion } from 'framer-motion';
import { useMemo } from 'react';

interface WeatherParticlesProps {
  temporalDynamics: string | { selectedValue: string };
}

// Helper to extract morphology value (handles both string and object formats)
function getMorphologyValue(value: string | { selectedValue: string } | undefined, defaultValue: string = 'project'): string {
  if (!value) return defaultValue;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && 'selectedValue' in value) return value.selectedValue;
  return defaultValue;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  type: 'rain' | 'leaf' | 'dust';
}

export function WeatherParticles({ temporalDynamics }: WeatherParticlesProps) {
  // Extract the actual value from morphology format
  const temporalValue = getMorphologyValue(temporalDynamics, 'project');
  
  // Debug logging
  console.log('🌧️ WeatherParticles - Raw input:', temporalDynamics);
  console.log('🌧️ WeatherParticles - Extracted value:', temporalValue);
  
  const particleConfig = useMemo(() => {
    const configs = {
      sprint: {
        count: 40,
        speed: [1.5, 2.5], // seconds (fast)
        type: 'rain' as const,
        color: 'rgba(59, 130, 246, 0.5)', // blue rain
        emoji: '💧'
      },
      project: {
        count: 25,
        speed: [3, 4.5],
        type: 'dust' as const,
        color: 'rgba(168, 85, 247, 0.4)', // purple dust
        emoji: '✨'
      },
      program: {
        count: 15,
        speed: [5, 7],
        type: 'leaf' as const,
        color: 'rgba(34, 197, 94, 0.4)', // green leaves
        emoji: '🍃'
      },
      transformation: {
        count: 8,
        speed: [8, 12], // seconds (slow)
        type: 'leaf' as const,
        color: 'rgba(251, 191, 36, 0.3)', // golden leaves
        emoji: '🍂'
      }
    };

    const config = configs[temporalValue as keyof typeof configs] || configs.project;
    console.log('🌧️ WeatherParticles - Particle config:', config);
    return config;
  }, [temporalValue]);

  const particles: Particle[] = useMemo(() => {
    const particleArray = Array.from({ length: particleConfig.count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * -20 - 10, // Start above viewport
      size: Math.random() * 3 + 2,
      duration: particleConfig.speed[0] + Math.random() * (particleConfig.speed[1] - particleConfig.speed[0]),
      delay: Math.random() * 2,
      type: particleConfig.type,
    }));
    console.log(`🌧️ WeatherParticles - Generated ${particleArray.length} particles`);
    return particleArray;
  }, [particleConfig]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute z-50"
          style={{
            left: `${particle.x}%`,
            width: particle.type === 'leaf' ? '16px' : `${particle.size}px`,
            height: particle.type === 'leaf' ? '16px' : `${particle.size}px`,
          }}
          initial={{ y: '0%', opacity: 0 }}
          animate={{
            y: '110%',
            opacity: [0, 1, 1, 0],
            x: particle.type === 'leaf' ? [0, 20, -10, 15, 0] : [0, 0], // Leaves sway
            rotate: particle.type === 'leaf' ? [0, 360] : [0, 0],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: particle.type === 'rain' ? 'linear' : 'easeInOut',
          }}
        >
          {particle.type === 'rain' && (
            <div
              className="w-full h-full rounded-full"
              style={{
                background: particleConfig.color,
                boxShadow: `0 0 ${particle.size * 2}px ${particleConfig.color}`,
              }}
            />
          )}
          {particle.type === 'dust' && (
            <div
              className="w-full h-full rounded-full"
              style={{
                background: `radial-gradient(circle, ${particleConfig.color} 0%, transparent 70%)`,
                filter: 'blur(1px)',
              }}
            />
          )}
          {particle.type === 'leaf' && (
            <div
              className="text-base"
              style={{
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
              }}
            >
              {particleConfig.emoji}
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
