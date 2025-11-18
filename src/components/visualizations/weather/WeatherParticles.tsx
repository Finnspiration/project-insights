import { motion } from 'framer-motion';
import { useMemo } from 'react';

interface WeatherParticlesProps {
  temporalDynamics: string | { selectedValue: string };
  organizationalStage?: string | { selectedValue: string };
}

// Helper to extract morphology value (handles both string and object formats)
function getMorphologyValue(value: string | { selectedValue: string } | undefined, defaultValue: string = 'project'): string {
  if (!value) return defaultValue;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && 'selectedValue' in value) return value.selectedValue;
  return defaultValue;
}

// Get contrast color based on organizational stage
function getStageContrastColor(stage: string): { color: string; emoji: string } {
  const stageColors = {
    red: { 
      color: 'rgba(59, 130, 246, 0.9)', // Bright blue contrast to red/warm
      emoji: '💎'
    },
    amber: { 
      color: 'rgba(168, 85, 247, 0.9)', // Purple contrast to amber/orange
      emoji: '⭐'
    },
    orange: { 
      color: 'rgba(34, 197, 94, 0.9)', // Green contrast to orange
      emoji: '🌟'
    },
    green: { 
      color: 'rgba(251, 191, 36, 0.9)', // Gold contrast to green
      emoji: '✨'
    },
    teal: { 
      color: 'rgba(236, 72, 153, 0.9)', // Pink contrast to teal/cyan
      emoji: '🔮'
    }
  };
  
  return stageColors[stage as keyof typeof stageColors] || stageColors.orange;
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

export function WeatherParticles({ temporalDynamics, organizationalStage }: WeatherParticlesProps) {
  // Extract the actual values from morphology format
  const temporalValue = getMorphologyValue(temporalDynamics, 'project');
  const stageValue = getMorphologyValue(organizationalStage, 'orange');
  
  // Debug logging
  console.log('🌧️ WeatherParticles - Raw temporal input:', temporalDynamics);
  console.log('🌧️ WeatherParticles - Extracted temporal value:', temporalValue);
  console.log('🌧️ WeatherParticles - Raw organizational input:', organizationalStage);
  console.log('🌧️ WeatherParticles - Extracted organizational value:', stageValue);
  
  // Get contrast color based on organizational stage (recalculate every time)
  const stageContrast = useMemo(() => {
    return getStageContrastColor(stageValue);
  }, [stageValue]);
  
  console.log('🌧️ WeatherParticles - Contrast color:', stageContrast);
  
  const particleConfig = useMemo(() => {
    const configs = {
      sprint: {
        count: 50,
        speed: [0.3, 0.5], // ⚡ EKSTREMT HURTIGT
        type: 'dust' as const,
        color: stageContrast.color,
        emoji: stageContrast.emoji,
        size: [10, 16],
        blur: 1
      },
      project: {
        count: 50,
        speed: [3.0, 4.0], // 🏃 HURTIGT (8x langsommere)
        type: 'dust' as const,
        color: stageContrast.color,
        emoji: stageContrast.emoji,
        size: [10, 16],
        blur: 1
      },
      program: {
        count: 50,
        speed: [10.0, 12.0], // 🚶 MODERAT (30x langsommere)
        type: 'dust' as const,
        color: stageContrast.color,
        emoji: stageContrast.emoji,
        size: [10, 16],
        blur: 1
      },
      transformation: {
        count: 50,
        speed: [20.0, 25.0], // 🐌 MEGET LANGSOMT (60x langsommere)
        type: 'dust' as const,
        color: stageContrast.color,
        emoji: stageContrast.emoji,
        size: [10, 16],
        blur: 1
      }
    };

    const config = configs[temporalValue as keyof typeof configs] || configs.project;
    console.log('🌧️ WeatherParticles - Particle config:', config);
    return config;
  }, [temporalValue, stageContrast]);

  const particles: Particle[] = useMemo(() => {
    const count = particleConfig.count;
    const [minSpeed, maxSpeed] = particleConfig.speed;
    const [minSize, maxSize] = particleConfig.size;
    
    const particleArray = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 800, // ✅ PIXEL RANGE instead of 0-100
      y: Math.random() * 600, // ✅ PIXEL RANGE instead of 0-600
      size: minSize + Math.random() * (maxSize - minSize),
      duration: minSpeed + Math.random() * (maxSpeed - minSpeed),
      delay: Math.random() * 3,
      type: particleConfig.type
    }));
    
    console.log(`🌧️ WeatherParticles - Generated ${particleArray.length} particles (pixel coordinates)`);
    return particleArray;
  }, [particleConfig]);

  return (
    <svg 
      className="absolute inset-0 w-full h-full pointer-events-none" 
      viewBox="0 0 800 600"
      preserveAspectRatio="xMidYMid slice"
    >
      {particles.map((particle) => (
        <motion.g
          key={`${particle.id}-${temporalValue}`}
          initial={{ opacity: 0 }}
          animate={{
            y: [particle.y, 650], // ✅ Move beyond viewBox (600+50)
            x: [particle.x, particle.x + 10, particle.x - 5, particle.x + 8, particle.x],
            opacity: [0, 1, 1, 1, 0],
            scale: [0.5, 1, 1, 0.8],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <circle
            cx={particle.x}
            cy={0}
            r={particle.size / 2}
            fill={particleConfig.color}
            filter={`blur(${particleConfig.blur}px)`}
            style={{
              opacity: 0.9,
            }}
          />
        </motion.g>
      ))}
    </svg>
  );
}
