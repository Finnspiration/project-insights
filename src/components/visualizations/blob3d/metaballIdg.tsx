// Inner Development Goals layer: energy manifesting outside the body.
// Extracted verbatim from MetaballBlob.tsx, which had grown to 2,944 lines.

import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// NEW: IDG Outer Manifestation - energy extending beyond the blob
export function IDGOuterManifestation({
  manifestationType,
  radius,
  intensity,
  particleCount,
  color,
  animationSpeed,
  primaryColor
}: {
  manifestationType: 'aura' | 'geometric_rays' | 'connection_bands' | 'energy_fields' | 'explosive_rays';
  radius: number;
  intensity: number;
  particleCount: number;
  color: string;
  animationSpeed: number;
  primaryColor: THREE.Color;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const threeColor = useMemo(() => new THREE.Color(color), [color]);
  
  // Aura component - large, still aura for "Being" (Væren)
  const BeingAura = () => {
    const meshRef = useRef<THREE.Mesh>(null);
    const innerMeshRef = useRef<THREE.Mesh>(null);
    
    useFrame((state) => {
      if (!meshRef.current) return;
      const time = state.clock.elapsedTime;
      
      // Very slow, gentle breathing
      const breathe = 1 + Math.sin(time * animationSpeed) * 0.05;
      meshRef.current.scale.setScalar(breathe);
      
      const mat = meshRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.15 + Math.sin(time * animationSpeed * 0.5) * 0.05;
      
      if (innerMeshRef.current) {
        innerMeshRef.current.scale.setScalar(1 + Math.sin(time * animationSpeed * 0.7) * 0.03);
      }
    });
    
    return (
      <group>
        {/* Inner soft glow */}
        <mesh ref={innerMeshRef}>
          <sphereGeometry args={[radius * 0.6, 48, 48]} />
          <meshBasicMaterial
            color={threeColor}
            transparent
            opacity={0.12 * intensity}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        {/* Large outer aura */}
        <mesh ref={meshRef}>
          <sphereGeometry args={[radius, 48, 48]} />
          <meshBasicMaterial
            color={threeColor}
            transparent
            opacity={0.08 * intensity}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        {/* Subtle pulsing ring */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[radius * 0.8, 0.02, 8, 64]} />
          <meshBasicMaterial
            color={threeColor}
            transparent
            opacity={0.3 * intensity}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>
    );
  };
  
  // Pulsating ripples that breathe in and out from center for "Thinking" (Tænkning)
  // Uses 3D torusGeometry on multiple planes for visibility from all angles
  const ThinkingRipples = () => {
    const groupRef = useRef<THREE.Group>(null);
    const ringRefs = useRef<THREE.Mesh[]>([]);
    const centerGlowRef = useRef<THREE.Mesh>(null);
    
    // Ring configurations: 4 rings on different planes for visibility from all angles
    const rings = useMemo(() => [
      { rotation: [Math.PI / 2, 0, 0] as [number, number, number], phaseOffset: 0 },           // XY plane (horizontal)
      { rotation: [0, 0, 0] as [number, number, number], phaseOffset: Math.PI * 0.5 },         // XZ plane (vertical front)
      { rotation: [0, Math.PI / 2, 0] as [number, number, number], phaseOffset: Math.PI },     // YZ plane (vertical side)
      { rotation: [Math.PI / 4, Math.PI / 4, 0] as [number, number, number], phaseOffset: Math.PI * 1.5 }, // Diagonal
    ], []);
    
    // Light blue color for all rings
    const ringColors = useMemo(() => rings.map(() => {
      return new THREE.Color().setHSL(0.55, 0.7, 0.75); // Light cyan-blue
    }), [rings.length]);
    
    const glowColor = new THREE.Color().setHSL(0.55, 0.6, 0.85);
    
    useFrame((state) => {
      if (!groupRef.current) return;
      const time = state.clock.elapsedTime;
      
      // Central glow pulsing
      if (centerGlowRef.current) {
        const glowPulse = 0.6 + Math.sin(time * animationSpeed * 1.5) * 0.4;
        centerGlowRef.current.scale.setScalar(glowPulse);
        (centerGlowRef.current.material as THREE.MeshBasicMaterial).opacity = 
          Math.max(0.4, 0.6 * intensity * glowPulse);
      }
      
      // Update each ring - pulsating in and out
      ringRefs.current.forEach((ring, i) => {
        if (!ring) return;
        
        const phaseOffset = rings[i]?.phaseOffset || 0;
        const breathe = Math.sin(time * animationSpeed * 1.5 + phaseOffset);
        
        // Pulse between 1.0 and 1.8 radius
        const baseRadius = 1.3;
        const pulseAmount = 0.5;
        const currentScale = baseRadius + breathe * pulseAmount;
        
        ring.scale.setScalar(currentScale);
        
        // Opacity varies with position
        const normalizedPos = (breathe + 1) / 2;
        const opacity = Math.max(0.5, (0.5 + normalizedPos * 0.3) * intensity);
        (ring.material as THREE.MeshBasicMaterial).opacity = opacity;
      });
    });
    
    return (
      <group ref={groupRef}>
        {/* Central pulsing glow sphere */}
        <mesh ref={centerGlowRef}>
          <sphereGeometry args={[0.5, 24, 24]} />
          <meshBasicMaterial
            color={glowColor}
            transparent
            opacity={0.6}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        
        {/* 3D Torus rings on multiple planes */}
        {rings.map((ring, i) => (
          <mesh 
            key={`thinking-ring-${i}`}
            ref={(el) => { if (el) ringRefs.current[i] = el; }}
            rotation={ring.rotation}
          >
            {/* torusGeometry: radius, tube thickness (0.01 = 1/4 of 0.04), radial segments, tubular segments */}
            <torusGeometry args={[1.0, 0.01, 16, 64]} />
            <meshStandardMaterial
              color={new THREE.Color().setHSL(0.55, 0.9, 0.65)}
              emissive={new THREE.Color().setHSL(0.55, 1.0, 0.5)}
              emissiveIntensity={0.8}
              opacity={1.0}
            />
          </mesh>
        ))}
      </group>
    );
  };
  
  // Connection bands for "Relating" (Relationsdannelse)
  const RelatingBands = () => {
    const groupRef = useRef<THREE.Group>(null);
    const bandRefs = useRef<THREE.Mesh[]>([]);
    
    const bands = useMemo(() => {
      const items: { radius: number; tilt: number; rotationOffset: number }[] = [];
      for (let i = 0; i < 3; i++) {
        items.push({
          radius: radius * 0.7 + i * 0.3,
          tilt: (i - 1) * 0.4,
          rotationOffset: i * Math.PI / 3
        });
      }
      return items;
    }, [radius]);
    
    useFrame((state) => {
      if (!groupRef.current) return;
      const time = state.clock.elapsedTime;
      
      bandRefs.current.forEach((band, i) => {
        if (band) {
          band.rotation.z = time * animationSpeed * (i % 2 === 0 ? 0.5 : -0.3) + bands[i]?.rotationOffset;
        }
      });
    });
    
    return (
      <group ref={groupRef}>
        {bands.map((band, i) => (
          <mesh 
            key={i} 
            ref={(el) => { if (el) bandRefs.current[i] = el; }}
            rotation={[Math.PI / 2 + band.tilt, 0, band.rotationOffset]}
          >
            <torusGeometry args={[band.radius, 0.025, 8, 64]} />
            <meshBasicMaterial
              color={threeColor}
              transparent
              opacity={0.5 * intensity}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        ))}
        {/* Flowing particles on bands */}
        {Array.from({ length: Math.min(particleCount, 24) }).map((_, i) => {
          const bandIndex = i % 3;
          const angle = (i / 8) * Math.PI * 2;
          const bandRadius = radius * 0.7 + bandIndex * 0.3;
          
          return (
            <FlowingParticle 
              key={i} 
              bandRadius={bandRadius} 
              startAngle={angle}
              speed={animationSpeed * (0.5 + bandIndex * 0.2)}
              color={threeColor}
              intensity={intensity}
            />
          );
        })}
      </group>
    );
  };
  
  // Energy fields for "Collaborating" (Samarbejde)
  const CollaboratingFields = () => {
    const groupRef = useRef<THREE.Group>(null);
    
    const fields = useMemo(() => {
      return [
        { radius: radius * 0.8, axis: new THREE.Vector3(1, 0, 0), opacity: 0.15 },
        { radius: radius * 0.75, axis: new THREE.Vector3(0, 1, 0), opacity: 0.12 },
        { radius: radius * 0.85, axis: new THREE.Vector3(0, 0, 1), opacity: 0.1 },
        { radius: radius * 0.7, axis: new THREE.Vector3(1, 1, 0).normalize(), opacity: 0.08 },
      ];
    }, [radius]);
    
    useFrame((state) => {
      if (!groupRef.current) return;
      const time = state.clock.elapsedTime;
      
      groupRef.current.children.forEach((child, i) => {
        child.rotation.x = time * animationSpeed * 0.3 * (i % 2 === 0 ? 1 : -1);
        child.rotation.y = time * animationSpeed * 0.2 * (i % 3 === 0 ? 1 : -0.5);
      });
    });
    
    return (
      <group ref={groupRef}>
        {fields.map((field, i) => (
          <mesh key={i} rotation={[field.axis.x, field.axis.y, field.axis.z]}>
            <sphereGeometry args={[field.radius, 24, 24]} />
            <meshBasicMaterial
              color={threeColor}
              transparent
              opacity={field.opacity * intensity}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
              wireframe
            />
          </mesh>
        ))}
        {/* Floating collaboration particles */}
        {Array.from({ length: Math.min(particleCount, 60) }).map((_, i) => (
          <CollaborationParticle
            key={i}
            index={i}
            radius={radius}
            speed={animationSpeed}
            color={threeColor}
            intensity={intensity}
          />
        ))}
      </group>
    );
  };
  
  // Explosive rays for "Acting" (Handling) - SHARP, ORGANIZED, DIRECTIONAL
  const ActingRays = () => {
    const groupRef = useRef<THREE.Group>(null);
    const raysRef = useRef<THREE.Group>(null);
    
    // Create organized, symmetrical rays - fewer but more impactful
    const rays = useMemo(() => {
      const items: { direction: THREE.Vector3; baseLength: number; delay: number }[] = [];
      
      // 6 main axis rays (up, down, left, right, front, back)
      const mainDirections = [
        new THREE.Vector3(0, 1, 0),    // Up
        new THREE.Vector3(0, -1, 0),   // Down
        new THREE.Vector3(1, 0, 0),    // Right
        new THREE.Vector3(-1, 0, 0),   // Left
        new THREE.Vector3(0, 0, 1),    // Front
        new THREE.Vector3(0, 0, -1),   // Back
      ];
      
      // Main cardinal rays - longest
      mainDirections.forEach((dir, i) => {
        items.push({
          direction: dir,
          baseLength: radius * 1.2,
          delay: i * 0.1
        });
      });
      
      // 8 diagonal rays - medium length
      const diagonals = [
        new THREE.Vector3(1, 1, 0).normalize(),
        new THREE.Vector3(-1, 1, 0).normalize(),
        new THREE.Vector3(1, -1, 0).normalize(),
        new THREE.Vector3(-1, -1, 0).normalize(),
        new THREE.Vector3(0, 1, 1).normalize(),
        new THREE.Vector3(0, 1, -1).normalize(),
        new THREE.Vector3(0, -1, 1).normalize(),
        new THREE.Vector3(0, -1, -1).normalize(),
      ];
      
      diagonals.forEach((dir, i) => {
        items.push({
          direction: dir,
          baseLength: radius * 0.9,
          delay: 0.3 + i * 0.05
        });
      });
      
      return items;
    }, [radius]);
    
    useFrame((state) => {
      if (!raysRef.current) return;
      const time = state.clock.elapsedTime;
      
      raysRef.current.children.forEach((rayGroup, i) => {
        const ray = rays[i];
        if (!ray) return;
        
        // Sharp, rhythmic pulse - rays shoot out decisively
        const phase = (time * animationSpeed * 2 + ray.delay * Math.PI * 2) % (Math.PI * 2);
        const pulse = Math.pow(Math.max(0, Math.sin(phase)), 0.5); // Sharp attack, gradual decay
        const currentLength = ray.baseLength * (0.2 + pulse * 0.8);
        
        const rayLine = rayGroup.children[0] as THREE.Mesh;
        const tip = rayGroup.children[1] as THREE.Mesh;
        const trail = rayGroup.children[2] as THREE.Mesh;
        
        if (rayLine && tip) {
          // Scale ray
          rayLine.scale.y = currentLength / ray.baseLength;
          rayLine.position.copy(ray.direction.clone().multiplyScalar(currentLength * 0.5 + 0.15));
          
          // Move tip to end of ray
          tip.position.copy(ray.direction.clone().multiplyScalar(currentLength + 0.15));
          tip.scale.setScalar(0.5 + pulse * 0.5);
          
          // Tip brightness follows pulse
          const tipMat = tip.material as THREE.MeshBasicMaterial;
          tipMat.opacity = (0.3 + pulse * 0.7) * intensity;
        }
        
        if (trail) {
          // Trail follows behind
          trail.position.copy(ray.direction.clone().multiplyScalar(0.2));
          trail.scale.y = (currentLength * 0.3) / ray.baseLength;
          const trailMat = trail.material as THREE.MeshBasicMaterial;
          trailMat.opacity = pulse * 0.4 * intensity;
        }
      });
      
      // No rotation - stable, directional
    });
    
    return (
      <group ref={groupRef}>
        <group ref={raysRef}>
          {rays.map((ray, i) => {
            // Calculate rotation to point along ray direction
            const up = new THREE.Vector3(0, 1, 0);
            const quaternion = new THREE.Quaternion().setFromUnitVectors(up, ray.direction);
            const euler = new THREE.Euler().setFromQuaternion(quaternion);
            
            const isMainRay = i < 6;
            const rayWidth = isMainRay ? 0.035 : 0.025;
            const tipSize = isMainRay ? 0.08 : 0.05;
            
            return (
              <group key={i}>
                {/* Sharp ray line */}
                <mesh rotation={euler}>
                  <cylinderGeometry args={[rayWidth * 0.3, rayWidth, ray.baseLength, 8]} />
                  <meshBasicMaterial
                    color={threeColor}
                    transparent
                    opacity={0.9 * intensity}
                    blending={THREE.AdditiveBlending}
                  />
                </mesh>
                {/* Arrow tip - diamond shape */}
                <mesh rotation={euler}>
                  <octahedronGeometry args={[tipSize, 0]} />
                  <meshBasicMaterial
                    color={threeColor}
                    transparent
                    opacity={intensity}
                    blending={THREE.AdditiveBlending}
                  />
                </mesh>
                {/* Inner glow trail */}
                <mesh rotation={euler}>
                  <cylinderGeometry args={[rayWidth * 0.15, rayWidth * 0.5, ray.baseLength * 0.5, 6]} />
                  <meshBasicMaterial
                    color={primaryColor}
                    transparent
                    opacity={0.5 * intensity}
                    blending={THREE.AdditiveBlending}
                  />
                </mesh>
              </group>
            );
          })}
        </group>
        {/* Central action core - pulsing */}
        <mesh>
          <octahedronGeometry args={[0.2, 0]} />
          <meshBasicMaterial
            color={threeColor}
            transparent
            opacity={0.6 * intensity}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        {/* Inner core glow */}
        <mesh>
          <sphereGeometry args={[0.15, 12, 12]} />
          <meshBasicMaterial
            color={primaryColor}
            transparent
            opacity={0.8 * intensity}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>
    );
  };
  
  if (intensity < 0.1) return null;
  
  return (
    <group ref={groupRef}>
      {manifestationType === 'aura' && <BeingAura />}
      {manifestationType === 'geometric_rays' && <ThinkingRipples />}
      {manifestationType === 'connection_bands' && <RelatingBands />}
      {manifestationType === 'energy_fields' && <CollaboratingFields />}
      {manifestationType === 'explosive_rays' && <ActingRays />}
    </group>
  );
}

// Helper: Flowing particle for Relating bands
function FlowingParticle({
  bandRadius,
  startAngle,
  speed,
  color,
  intensity
}: {
  bandRadius: number;
  startAngle: number;
  speed: number;
  color: THREE.Color;
  intensity: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    const angle = startAngle + time * speed;
    
    meshRef.current.position.x = Math.cos(angle) * bandRadius;
    meshRef.current.position.z = Math.sin(angle) * bandRadius;
    meshRef.current.position.y = Math.sin(angle * 2) * 0.1;
  });
  
  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.03, 6, 6]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.7 * intensity}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

// Helper: Collaboration particle for Collaborating fields
function CollaborationParticle({
  index,
  radius,
  speed,
  color,
  intensity
}: {
  index: number;
  radius: number;
  speed: number;
  color: THREE.Color;
  intensity: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const offset = useMemo(() => ({
    theta: Math.random() * Math.PI * 2,
    phi: Math.random() * Math.PI,
    radiusOffset: 0.5 + Math.random() * 0.5,
    speedOffset: 0.5 + Math.random()
  }), []);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    
    const r = radius * offset.radiusOffset;
    const theta = offset.theta + time * speed * 0.3 * offset.speedOffset;
    const phi = offset.phi + Math.sin(time * speed * 0.2) * 0.3;
    
    meshRef.current.position.x = r * Math.sin(phi) * Math.cos(theta);
    meshRef.current.position.y = r * Math.sin(phi) * Math.sin(theta);
    meshRef.current.position.z = r * Math.cos(phi);
  });
  
  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.02, 6, 6]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.5 * intensity}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}
