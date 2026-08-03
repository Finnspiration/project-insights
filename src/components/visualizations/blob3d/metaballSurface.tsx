// Surface detail: spikes, voids, wireframe and noise applied to the main body.
// Extracted verbatim from MetaballBlob.tsx, which had grown to 2,944 lines.

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Spikes component for Complexity + Challenge visualization
export function Spikes({ 
  count, 
  length, 
  color,
  glowColor,
  glowIntensity 
}: { 
  count: number; 
  length: number;
  color: THREE.Color;
  glowColor: THREE.Color;
  glowIntensity: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  
  const spikes = useMemo(() => {
    const items: { position: THREE.Vector3; rotation: THREE.Euler; scale: number }[] = [];
    
    for (let i = 0; i < count; i++) {
      // Distribute spikes on sphere surface using golden spiral
      const goldenRatio = (1 + Math.sqrt(5)) / 2;
      const theta = 2 * Math.PI * i / goldenRatio;
      const phi = Math.acos(1 - 2 * (i + 0.5) / count);
      
      const x = Math.sin(phi) * Math.cos(theta);
      const y = Math.sin(phi) * Math.sin(theta);
      const z = Math.cos(phi);
      
      const position = new THREE.Vector3(x * 0.7, y * 0.7, z * 0.7);
      
      // Point spike outward
      const direction = position.clone().normalize();
      const rotation = new THREE.Euler(
        Math.atan2(direction.y, Math.sqrt(direction.x ** 2 + direction.z ** 2)),
        Math.atan2(direction.x, direction.z),
        0
      );
      
      const scale = 0.8 + Math.random() * 0.4;
      items.push({ position, rotation, scale });
    }
    
    return items;
  }, [count]);
  
  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.elapsedTime;
    
    // Subtle pulsing of spikes
    groupRef.current.children.forEach((child, i) => {
      const scale = 1 + Math.sin(time * 2 + i * 0.5) * 0.1;
      child.scale.y = scale;
    });
  });
  
  if (count === 0) return null;
  
  // Mix primary color with glow color based on risk intensity
  const spikeColor = color.clone().lerp(glowColor, glowIntensity * 0.5);
  
  return (
    <group ref={groupRef}>
      {spikes.map((spike, i) => (
        <mesh 
          key={i} 
          position={spike.position}
          rotation={spike.rotation}
        >
          <coneGeometry args={[0.03, length * spike.scale, 8]} />
          <meshPhysicalMaterial
            color={spikeColor}
            emissive={glowColor}
            emissiveIntensity={glowIntensity * 0.8}
            roughness={0.3}
            metalness={0.4}
          />
        </mesh>
      ))}
    </group>
  );
}

// Holes/Voids component for Information dimension
export function Holes({ 
  count, 
  size, 
  color 
}: { 
  count: number; 
  size: number;
  color: THREE.Color;
}) {
  const holesData = useMemo(() => {
    const items: THREE.Vector3[] = [];
    
    for (let i = 0; i < count; i++) {
      // Distribute holes evenly
      const goldenRatio = (1 + Math.sqrt(5)) / 2;
      const theta = 2 * Math.PI * i / goldenRatio;
      const phi = Math.acos(1 - 2 * (i + 0.5) / count);
      
      const x = Math.sin(phi) * Math.cos(theta) * 0.5;
      const y = Math.sin(phi) * Math.sin(theta) * 0.5;
      const z = Math.cos(phi) * 0.5;
      
      items.push(new THREE.Vector3(x, y, z));
    }
    
    return items;
  }, [count]);
  
  if (count === 0) return null;
  
  // Dark void color
  const voidColor = new THREE.Color('#0a0a0a');
  
  return (
    <group>
      {holesData.map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[size, 16, 16]} />
          <meshBasicMaterial 
            color={voidColor} 
            transparent 
            opacity={0.95}
          />
        </mesh>
      ))}
      {/* Rim lighting around holes */}
      {holesData.map((pos, i) => (
        <mesh key={`rim-${i}`} position={pos}>
          <torusGeometry args={[size * 1.1, size * 0.15, 8, 24]} />
          <meshPhysicalMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.5}
            roughness={0.2}
            transmission={0.3}
          />
        </mesh>
      ))}
    </group>
  );
}

// Wireframe overlay for Knowledge dimension
export function WireframeOverlay({ 
  opacity, 
  color 
}: { 
  opacity: number;
  color: THREE.Color;
}) {
  const meshRef = useRef<THREE.LineSegments>(null);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
  });
  
  if (opacity < 0.05) return null;
  
  return (
    <lineSegments ref={meshRef}>
      <edgesGeometry args={[new THREE.IcosahedronGeometry(0.75, 2)]} />
      <lineBasicMaterial 
        color={color} 
        transparent 
        opacity={opacity * 0.6}
        linewidth={1}
      />
    </lineSegments>
  );
}

// Noise particles for challenge dimension - visible on light backgrounds
export function ChallengeNoise({ 
  intensity, 
  color 
}: { 
  intensity: number; 
  color: THREE.Color;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  
  const geometry = useMemo(() => {
    const count = Math.floor(150 * intensity);
    const positions = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 0.8 + Math.random() * 0.5;
      
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [intensity]);
  
  useFrame((state) => {
    if (!pointsRef.current) return;
    const positions = pointsRef.current.geometry.attributes.position;
    const time = state.clock.elapsedTime;
    
    for (let i = 0; i < positions.count; i++) {
      let x = positions.getX(i);
      let y = positions.getY(i);
      let z = positions.getZ(i);
      
      x += Math.sin(time + i) * 0.005 * intensity;
      y += Math.cos(time * 1.1 + i) * 0.005 * intensity;
      z += Math.sin(time * 0.9 + i * 0.5) * 0.005 * intensity;
      
      const dist = Math.sqrt(x*x + y*y + z*z);
      if (dist > 1.5 || dist < 0.7) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = 0.8 + Math.random() * 0.4;
        x = r * Math.sin(phi) * Math.cos(theta);
        y = r * Math.sin(phi) * Math.sin(theta);
        z = r * Math.cos(phi);
      }
      
      positions.setXYZ(i, x, y, z);
    }
    positions.needsUpdate = true;
  });
  
  if (intensity < 0.15) return null;
  
  const darkColor = color.clone().multiplyScalar(0.3);
  
  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={0.04 + intensity * 0.04}
        color={darkColor}
        transparent
        opacity={0.7 + intensity * 0.3}
        sizeAttenuation
      />
    </points>
  );
}
