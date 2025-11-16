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
    // Synkroniser partikler i bølger (5 bølger af 10 partikler hver)
    const wavesCount = 5;
    const particlesPerWave = particleConfig.count / wavesCount;
    
    const particleArray = Array.from({ length: particleConfig.count }, (_, i) => {
      const waveIndex = Math.floor(i / particlesPerWave);
      const waveDelay = waveIndex * 0.5; // Hver bølge starter 0.5 sek efter den forrige
      
      return {
        id: i,
        x: Math.random() * 100,
        y: (waveIndex * 20) + Math.random() * 15, // Spred bølger over hele højden (0%, 20%, 40%, 60%, 80%)
        size: particleConfig.size[0] + Math.random() * (particleConfig.size[1] - particleConfig.size[0]),
        duration: particleConfig.speed[0] + Math.random() * (particleConfig.speed[1] - particleConfig.speed[0]),
        delay: waveDelay + (Math.random() * 0.3), // Lille variation inden for bølgen
        type: particleConfig.type,
      };
    });
    console.log(`🌧️ WeatherParticles - Generated ${particleArray.length} particles in ${wavesCount} waves`);
    return particleArray;
  }, [particleConfig]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible">
      {particles.map((particle) => (
        <motion.div
          key={`${particle.id}-${temporalValue}`}
          className="absolute z-50"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
          }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{
            y: ['0%', '120%'],
            opacity: [0, 1, 1, 1, 0],
            x: [0, 10, -5, 8, 0], // Subtle sway for all particles
            rotate: [0, 180, 360], // Gentle rotation
            scale: [0.5, 1, 1, 0.8],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {/* All particles use dust/glow style */}
          <div
            className="w-full h-full rounded-full"
            style={{
              background: `radial-gradient(circle, ${particleConfig.color} 0%, transparent 70%)`,
              filter: `blur(${particleConfig.blur}px)`,
            }}
          />
        </motion.div>
      ))}
    </div>
  );
}
