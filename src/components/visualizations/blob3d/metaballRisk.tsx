// Risk layer: the warning ring, its arcs and particles.
// Extracted verbatim from MetaballBlob.tsx, which had grown to 2,944 lines.

import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ACCENT_BLENDING, AREA_BLENDING, accentOpacity, areaOpacity } from './blobCompositing';

// Risk Particles - floating particles around risk ring
function RiskParticles({ 
  count, 
  radius, 
  color, 
  speed,
  chaotic 
}: { 
  count: number;
  radius: number;
  color: THREE.Color;
  speed: number;
  chaotic: boolean;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const initialPositions = useRef<Float32Array | null>(null);
  
  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const r = radius + (Math.random() - 0.5) * 0.2;
      positions[i * 3] = Math.cos(angle) * r;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 0.3;
      positions[i * 3 + 2] = Math.sin(angle) * r;
    }
    initialPositions.current = positions.slice();
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [count, radius]);
  
  useFrame((state) => {
    if (!pointsRef.current || !initialPositions.current) return;
    const time = state.clock.elapsedTime;
    const positions = pointsRef.current.geometry.attributes.position;
    
    for (let i = 0; i < positions.count; i++) {
      const initX = initialPositions.current[i * 3];
      const initZ = initialPositions.current[i * 3 + 2];
      const angle = Math.atan2(initZ, initX) + time * speed;
      const r = Math.sqrt(initX * initX + initZ * initZ);
      
      if (chaotic) {
        positions.setX(i, Math.cos(angle) * r + Math.sin(time * 3 + i) * 0.1);
        positions.setY(i, initialPositions.current[i * 3 + 1] + Math.sin(time * 5 + i * 0.5) * 0.15);
        positions.setZ(i, Math.sin(angle) * r + Math.cos(time * 4 + i) * 0.1);
      } else {
        positions.setX(i, Math.cos(angle) * r);
        positions.setY(i, initialPositions.current[i * 3 + 1] + Math.sin(time * 2 + i * 0.3) * 0.05);
        positions.setZ(i, Math.sin(angle) * r);
      }
    }
    positions.needsUpdate = true;
  });
  
  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={chaotic ? 0.06 : 0.04}
        color={color}
        transparent
        opacity={accentOpacity(0.9)}
        sizeAttenuation
        blending={ACCENT_BLENDING}
      />
    </points>
  );
}

// Electric Arc component for extreme risk
function ElectricArc({ color, radius }: { color: THREE.Color; radius: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const [points, setPoints] = useState<THREE.Vector3[]>([]);
  
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    // Regenerate arc points periodically for flickering effect
    if (Math.floor(time * 8) !== Math.floor((time - 0.016) * 8)) {
      const newPoints: THREE.Vector3[] = [];
      const segments = 12;
      const startAngle = Math.random() * Math.PI * 2;
      const arcLength = 0.5 + Math.random() * 1.5;
      
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const angle = startAngle + t * arcLength;
        const r = radius + (Math.random() - 0.5) * 0.15;
        const y = (Math.random() - 0.5) * 0.2;
        newPoints.push(new THREE.Vector3(
          Math.cos(angle) * r,
          y,
          Math.sin(angle) * r
        ));
      }
      setPoints(newPoints);
    }
  });
  
  if (points.length < 2) return null;
  
  return (
    <group ref={groupRef}>
      {points.slice(0, -1).map((point, i) => {
        const nextPoint = points[i + 1];
        const midPoint = point.clone().add(nextPoint).multiplyScalar(0.5);
        const direction = nextPoint.clone().sub(point);
        const length = direction.length();
        
        return (
          <mesh key={i} position={midPoint} rotation={[0, Math.atan2(direction.x, direction.z), 0]}>
            <boxGeometry args={[0.015, 0.015, length]} />
            <meshBasicMaterial 
              color={color} 
              transparent 
              opacity={accentOpacity(0.9)} 
              blending={ACCENT_BLENDING}
            />
          </mesh>
        );
      })}
    </group>
  );
}

// Risk Ring - DRAMATICALLY distinct visual for each risk level
export function RiskRing({ 
  riskLevel 
}: { 
  riskLevel: 'low' | 'moderate' | 'high' | 'extreme';
}) {
  const ringRef = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);
  const verticalRingRef = useRef<THREE.Mesh>(null);
  const hexRingRef = useRef<THREE.Group>(null);
  const fragmentsRef = useRef<THREE.Group>(null);
  
  // NEON colors - maximum brightness and saturation
  const config = useMemo(() => {
    switch (riskLevel) {
      case 'low':
        return {
          color: new THREE.Color('#00FF66'), // Neon green - fluorescent
          secondaryColor: new THREE.Color('#00CC55'),
          thickness: 0.02,
          radius: 1.15,
          pulseSpeed: 0.6,
          opacity: 0.85,
          glowOpacity: 0.15,
          rotationSpeed: 0.2,
          geometry: 'circle' as const,
          particleCount: 0,
          showVerticalRing: false,
          fragmentCount: 0
        };
      case 'moderate':
        return {
          color: new THREE.Color('#FFD700'), // Electric gold
          secondaryColor: new THREE.Color('#FFA500'),
          thickness: 0.035,
          radius: 1.25,
          pulseSpeed: 1.2,
          opacity: 0.9,
          glowOpacity: 0.25,
          rotationSpeed: 0.5,
          geometry: 'oval' as const,
          particleCount: 30,
          showVerticalRing: false,
          fragmentCount: 0
        };
      case 'high':
        return {
          color: new THREE.Color('#FF6600'), // Intense orange
          secondaryColor: new THREE.Color('#FF3300'),
          thickness: 0.05,
          radius: 1.35,
          pulseSpeed: 2.5,
          opacity: 0.95,
          glowOpacity: 0.35,
          rotationSpeed: 1.0,
          geometry: 'hexagon' as const,
          particleCount: 60,
          showVerticalRing: true,
          fragmentCount: 0
        };
      case 'extreme':
        return {
          color: new THREE.Color('#FF0000'), // Pure red - maximum intensity
          secondaryColor: new THREE.Color('#CC0000'),
          thickness: 0.07,
          radius: 1.45,
          pulseSpeed: 6.0,
          opacity: 1.0,
          glowOpacity: 0.5,
          rotationSpeed: 2.0,
          geometry: 'fragmented' as const,
          particleCount: 100,
          showVerticalRing: true,
          fragmentCount: 8
        };
    }
  }, [riskLevel]);
  
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    // LOW: Gentle breathing, slow rotation
    if (riskLevel === 'low' && ringRef.current) {
      const breathe = 1 + Math.sin(time * config.pulseSpeed) * 0.03;
      ringRef.current.scale.setScalar(breathe);
      ringRef.current.rotation.z = time * config.rotationSpeed;
      const mat = ringRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = config.opacity * (0.8 + Math.sin(time * config.pulseSpeed) * 0.2);
    }
    
    // MODERATE: Oval rotation, medium pulse
    if (riskLevel === 'moderate' && ringRef.current) {
      const pulse = 1 + Math.sin(time * config.pulseSpeed) * 0.06;
      ringRef.current.scale.set(pulse * 1.15, pulse, pulse);
      ringRef.current.rotation.y = time * config.rotationSpeed;
      ringRef.current.rotation.z = Math.sin(time * 0.5) * 0.1;
      const mat = ringRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = config.opacity * (0.7 + Math.sin(time * config.pulseSpeed * 1.5) * 0.3);
    }
    
    // HIGH: Hexagon with vertical ring, fast pulse
    if (riskLevel === 'high') {
      if (hexRingRef.current) {
        const pulse = 1 + Math.sin(time * config.pulseSpeed) * 0.08;
        hexRingRef.current.scale.setScalar(pulse);
        hexRingRef.current.rotation.y = time * config.rotationSpeed;
        hexRingRef.current.rotation.z = Math.sin(time * 2) * 0.15;
      }
      if (verticalRingRef.current) {
        verticalRingRef.current.rotation.x = time * config.rotationSpeed * 1.5;
        verticalRingRef.current.rotation.z = Math.sin(time * 1.5) * 0.2;
        const mat = verticalRingRef.current.material as THREE.MeshBasicMaterial;
        mat.opacity = config.opacity * 0.7 * (0.6 + Math.sin(time * config.pulseSpeed + 1) * 0.4);
      }
    }
    
    // EXTREME: Fragmented chaos, flicker, erratic movement
    if (riskLevel === 'extreme') {
      if (fragmentsRef.current) {
        fragmentsRef.current.children.forEach((child, i) => {
          const offset = i * 0.8;
          const chaos = Math.sin(time * 7 + offset) * 0.1 + Math.random() * 0.02;
          child.rotation.z = time * (0.5 + i * 0.3) + chaos;
          child.rotation.x = Math.sin(time * 3 + offset) * 0.15;
          child.rotation.y = Math.cos(time * 4 + offset) * 0.15;
          
          const mesh = child as THREE.Mesh;
          const mat = mesh.material as THREE.MeshBasicMaterial;
          mat.opacity = config.opacity * (0.5 + Math.random() * 0.5);
        });
      }
      if (verticalRingRef.current) {
        verticalRingRef.current.rotation.x = time * 1.5 + Math.sin(time * 5) * 0.3;
        verticalRingRef.current.rotation.y = Math.cos(time * 3) * 0.4;
        const mat = verticalRingRef.current.material as THREE.MeshBasicMaterial;
        mat.opacity = config.opacity * 0.6 * (0.4 + Math.random() * 0.6);
      }
      if (ring2Ref.current) {
        ring2Ref.current.rotation.x = Math.PI / 3 + Math.sin(time * 4) * 0.2;
        ring2Ref.current.rotation.y = time * 0.8;
        const mat = ring2Ref.current.material as THREE.MeshBasicMaterial;
        mat.opacity = config.opacity * 0.5 * (0.3 + Math.random() * 0.7);
      }
      if (ring3Ref.current) {
        ring3Ref.current.rotation.x = Math.PI / 4 + Math.cos(time * 3) * 0.25;
        ring3Ref.current.rotation.z = time * 1.2;
        const mat = ring3Ref.current.material as THREE.MeshBasicMaterial;
        mat.opacity = config.opacity * 0.4 * (0.3 + Math.random() * 0.7);
      }
    }
  });
  
  // Generate hexagon points
  const hexagonPoints = useMemo(() => {
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      points.push(new THREE.Vector3(
        Math.cos(angle) * config.radius,
        0,
        Math.sin(angle) * config.radius
      ));
    }
    return points;
  }, [config.radius]);
  
  // Generate fragment arcs for extreme
  const fragmentArcs = useMemo(() => {
    if (riskLevel !== 'extreme') return [];
    const arcs: { startAngle: number; arcLength: number }[] = [];
    let currentAngle = 0;
    for (let i = 0; i < config.fragmentCount; i++) {
      const gap = 0.2 + Math.random() * 0.3;
      const length = 0.4 + Math.random() * 0.5;
      arcs.push({ startAngle: currentAngle + gap, arcLength: length });
      currentAngle += gap + length;
    }
    return arcs;
  }, [riskLevel, config.fragmentCount]);
  
  return (
    <group>
      {/* === LOW: Simple glowing circle === */}
      {riskLevel === 'low' && (
        <>
          <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[config.radius, config.thickness, 16, 64]} />
            <meshBasicMaterial
              color={config.color}
              transparent
              opacity={accentOpacity(config.opacity)}
              blending={ACCENT_BLENDING}
            />
          </mesh>
          {/* Soft glow */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[config.radius, config.thickness * 3, 16, 64]} />
            <meshBasicMaterial
              color={config.color}
              transparent
              opacity={accentOpacity(config.glowOpacity)}
              blending={ACCENT_BLENDING}
            />
          </mesh>
        </>
      )}
      
      {/* === MODERATE: Oval ring with particles === */}
      {riskLevel === 'moderate' && (
        <>
          <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[config.radius, config.thickness, 16, 64]} />
            <meshBasicMaterial
              color={config.color}
              transparent
              opacity={accentOpacity(config.opacity)}
              blending={ACCENT_BLENDING}
            />
          </mesh>
          {/* Outer glow ring */}
          <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1.15, 1, 1]}>
            <torusGeometry args={[config.radius, config.thickness * 2.5, 16, 64]} />
            <meshBasicMaterial
              color={config.secondaryColor}
              transparent
              opacity={accentOpacity(config.glowOpacity)}
              blending={ACCENT_BLENDING}
            />
          </mesh>
          {/* Particles */}
          <RiskParticles 
            count={config.particleCount} 
            radius={config.radius} 
            color={config.color}
            speed={0.3}
            chaotic={false}
          />
        </>
      )}
      
      {/* === HIGH: Hexagon with vertical ring === */}
      {riskLevel === 'high' && (
        <>
          {/* Hexagonal ring */}
          <group ref={hexRingRef}>
            <line>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={hexagonPoints.length}
                  array={new Float32Array(hexagonPoints.flatMap(p => [p.x, p.y, p.z]))}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial color={config.color} linewidth={3} transparent opacity={accentOpacity(config.opacity)} />
            </line>
            {/* Hexagon vertices - glowing points */}
            {hexagonPoints.slice(0, 6).map((point, i) => (
              <mesh key={i} position={point}>
                <sphereGeometry args={[0.04, 16, 16]} />
                <meshBasicMaterial 
                  color={config.color} 
                  transparent 
                  opacity={1}
                  blending={AREA_BLENDING}
                />
              </mesh>
            ))}
            {/* Inner glow ring. Six segments made this a hexagon, which read
                as a flat angular slab rather than a ring. */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[config.radius * 0.85, config.radius, 64]} />
              <meshBasicMaterial
                color={config.secondaryColor}
                transparent
                opacity={areaOpacity(config.glowOpacity)}
                side={THREE.DoubleSide}
                blending={AREA_BLENDING}
              />
            </mesh>
          </group>
          {/* Vertical ring */}
          <mesh ref={verticalRingRef}>
            <torusGeometry args={[config.radius * 0.9, config.thickness * 0.7, 16, 64]} />
            <meshBasicMaterial
              color={config.color}
              transparent
              opacity={accentOpacity(config.opacity * 0.7)}
              blending={ACCENT_BLENDING}
            />
          </mesh>
          {/* Fire particles */}
          <RiskParticles 
            count={config.particleCount} 
            radius={config.radius} 
            color={config.color}
            speed={0.8}
            chaotic={true}
          />
        </>
      )}
      
      {/* === EXTREME: Fragmented chaos with electric arcs === */}
      {riskLevel === 'extreme' && (
        <>
          {/* Fragmented ring pieces */}
          <group ref={fragmentsRef}>
            {fragmentArcs.map((arc, i) => (
              <mesh key={i} rotation={[Math.PI / 2, 0, arc.startAngle]}>
                <torusGeometry args={[config.radius, config.thickness, 16, Math.floor(arc.arcLength * 20)]} />
                <meshBasicMaterial
                  color={config.color}
                  transparent
                  opacity={accentOpacity(config.opacity)}
                  blending={ACCENT_BLENDING}
                />
              </mesh>
            ))}
          </group>
          
          {/* Chaotic additional rings */}
          <mesh ref={ring2Ref}>
            <torusGeometry args={[config.radius * 1.1, config.thickness * 0.6, 16, 64]} />
            <meshBasicMaterial
              color={config.color}
              transparent
              opacity={accentOpacity(config.opacity * 0.5)}
              blending={ACCENT_BLENDING}
            />
          </mesh>
          <mesh ref={ring3Ref}>
            <torusGeometry args={[config.radius * 0.85, config.thickness * 0.5, 16, 64]} />
            <meshBasicMaterial
              color={config.secondaryColor}
              transparent
              opacity={accentOpacity(config.opacity * 0.4)}
              blending={ACCENT_BLENDING}
            />
          </mesh>
          
          {/* Vertical ring - tilted */}
          <mesh ref={verticalRingRef}>
            <torusGeometry args={[config.radius * 0.95, config.thickness * 0.8, 16, 64]} />
            <meshBasicMaterial
              color={config.color}
              transparent
              opacity={accentOpacity(config.opacity * 0.6)}
              blending={ACCENT_BLENDING}
            />
          </mesh>
          
          {/* Electric arcs */}
          <ElectricArc color={config.color} radius={config.radius} />
          <ElectricArc color={config.color} radius={config.radius * 1.1} />
          <ElectricArc color={config.secondaryColor} radius={config.radius * 0.9} />
          
          {/* Chaotic particles */}
          <RiskParticles 
            count={config.particleCount} 
            radius={config.radius} 
            color={config.color}
            speed={1.5}
            chaotic={true}
          />
          
          {/* Danger glow sphere */}
          <mesh>
            <sphereGeometry args={[config.radius * 0.9, 32, 32]} />
            <meshBasicMaterial
              color={config.color}
              transparent
              opacity={areaOpacity(config.glowOpacity)}
              side={THREE.BackSide}
              blending={AREA_BLENDING}
            />
          </mesh>
        </>
      )}
      
      {/* Universal inner glow aura */}
      <mesh>
        <sphereGeometry args={[config.radius * 0.8, 32, 32]} />
        <meshBasicMaterial
          color={config.color}
          transparent
          opacity={areaOpacity(config.glowOpacity * 0.5)}
          side={THREE.BackSide}
          blending={AREA_BLENDING}
        />
      </mesh>
    </group>
  );
}
