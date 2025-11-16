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
        count: 80,
        speed: [1.5, 2.5], // seconds (fast)
        type: 'rain' as const,
        color: 'rgba(59, 130, 246, 0.8)', // blue rain - more visible
        emoji: '💧',
        size: [6, 12] // larger particles
      },
      project: {
        count: 50,
        speed: [3, 4.5],
        type: 'dust' as const,
        color: 'rgba(168, 85, 247, 0.7)', // purple dust - more visible
        emoji: '✨',
        size: [8, 14]
      },
      program: {
        count: 35,
        speed: [5, 7],
        type: 'leaf' as const,
        color: 'rgba(34, 197, 94, 0.7)', // green leaves - more visible
        emoji: '🍃',
        size: [20, 28]
      },
      transformation: {
        count: 25,
        speed: [8, 12], // seconds (slow)
        type: 'leaf' as const,
        color: 'rgba(251, 191, 36, 0.6)', // golden leaves - more visible
        emoji: '🍂',
        size: [22, 30]
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
      y: Math.random() * 100, // Spread across entire height
      size: particleConfig.size[0] + Math.random() * (particleConfig.size[1] - particleConfig.size[0]),
      duration: particleConfig.speed[0] + Math.random() * (particleConfig.speed[1] - particleConfig.speed[0]),
      delay: Math.random() * 5,
      type: particleConfig.type,
    }));
    console.log(`🌧️ WeatherParticles - Generated ${particleArray.length} particles`);
    return particleArray;
  }, [particleConfig]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute z-50"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.type === 'leaf' ? `${particle.size}px` : `${particle.size}px`,
            height: particle.type === 'leaf' ? `${particle.size}px` : `${particle.size}px`,
          }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{
            y: ['0%', '120%'],
            opacity: [0, 1, 1, 1, 0],
            x: particle.type === 'leaf' ? [0, 30, -20, 25, 0] : [0, 10, 0], // More sway
            rotate: particle.type === 'leaf' ? [0, 360, 720] : [0, 0],
            scale: [0.5, 1, 1, 0.8],
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
                boxShadow: `0 0 ${particle.size * 3}px ${particleConfig.color}`,
              }}
            />
          )}
          {particle.type === 'dust' && (
            <div
              className="w-full h-full rounded-full"
              style={{
                background: `radial-gradient(circle, ${particleConfig.color} 0%, transparent 70%)`,
                filter: 'blur(2px)',
              }}
            />
          )}
          {particle.type === 'leaf' && (
            <div
              style={{
                fontSize: `${particle.size}px`,
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
