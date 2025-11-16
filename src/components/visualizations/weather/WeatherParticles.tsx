import { motion } from 'framer-motion';
import { useMemo } from 'react';

interface WeatherParticlesProps {
  temporalDynamics: string;
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

    return configs[temporalDynamics as keyof typeof configs] || configs.project;
  }, [temporalDynamics]);

  const particles: Particle[] = useMemo(() => {
    return Array.from({ length: particleConfig.count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * -20 - 10, // Start above viewport
      size: Math.random() * 3 + 2,
      duration: particleConfig.speed[0] + Math.random() * (particleConfig.speed[1] - particleConfig.speed[0]),
      delay: Math.random() * 2,
      type: particleConfig.type,
    }));
  }, [particleConfig]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute"
          style={{
            left: `${particle.x}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
          }}
          initial={{ y: `${particle.y}%`, opacity: 0 }}
          animate={{
            y: '120%',
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
              className="text-xs"
              style={{
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
              }}
            >
              {particleConfig.emoji}
            </div>
          )}
        </motion.div>
      ))}

      {/* Particle info label */}
      <motion.div 
        className="absolute top-32 left-4 bg-background/95 backdrop-blur-md border-2 border-primary/30 rounded-lg px-4 py-3 shadow-xl z-10"
        animate={{
          scale: [1, 1.02, 1],
          borderColor: ['hsl(var(--primary) / 0.3)', 'hsl(var(--primary) / 0.5)', 'hsl(var(--primary) / 0.3)']
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <div className="flex items-center gap-2.5 mb-2">
          <span className="text-lg">{particleConfig.emoji}</span>
          <div>
            <p className="text-sm font-bold text-foreground">
              {temporalDynamics === 'sprint' ? 'Sprint' : 
               temporalDynamics === 'project' ? 'Projekt' : 
               temporalDynamics === 'program' ? 'Program' : 'Transformation'}
            </p>
            <p className="text-xs text-muted-foreground font-medium">
              {particleConfig.count} partikler
            </p>
          </div>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden mb-1.5">
          <motion.div 
            className="h-full"
            style={{ background: particleConfig.color.replace('0.3', '0.8').replace('0.4', '0.8').replace('0.5', '0.8') }}
            initial={{ width: 0 }}
            animate={{ 
              width: `${(particleConfig.count / 40) * 100}%`,
            }}
            transition={{ 
              duration: 1,
              ease: "easeOut"
            }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground font-medium">
          Tempo: {temporalDynamics === 'sprint' ? 'Meget hurtigt' : 
                  temporalDynamics === 'project' ? 'Hurtigt' : 
                  temporalDynamics === 'program' ? 'Moderat' : 'Langsomt'}
        </p>
      </motion.div>
    </div>
  );
}
