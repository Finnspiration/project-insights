import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Blob3DData } from './blobMapping3D';

interface MetaballBlobProps {
  data: Blob3DData;
  onHover?: (lobeIndex: number | null) => void;
  selectedLobe?: number | null;
}

// Spikes component for Complexity + Challenge visualization
function Spikes({ 
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
function Holes({ 
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
function WireframeOverlay({ 
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

// NEW: Knowledge Orbit - visible particles orbiting OUTSIDE the blob
function KnowledgeOrbit({
  particleCount,
  organization,
  color,
  pulseSpeed
}: {
  particleCount: number;
  organization: number; // 1 = ring, 0 = chaotic cloud
  color: THREE.Color;
  pulseSpeed: number;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const initialPositions = useRef<Float32Array | null>(null);
  
  const geometry = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const progress = i / particleCount;
      
      // Ring-based positioning (high organization) vs chaotic cloud (low)
      if (organization > 0.5) {
        // Organized ring(s)
        const ringIndex = Math.floor(progress * 3); // 3 rings
        const ringProgress = (progress * 3) % 1;
        const angle = ringProgress * Math.PI * 2;
        const radius = 1.0 + ringIndex * 0.15;
        const tilt = (ringIndex - 1) * 0.3;
        
        // Add some variation based on organization
        const variation = (1 - organization) * 0.3;
        
        positions[i * 3] = Math.cos(angle) * radius + (Math.random() - 0.5) * variation;
        positions[i * 3 + 1] = Math.sin(tilt) * Math.sin(angle) * 0.2 + (Math.random() - 0.5) * variation;
        positions[i * 3 + 2] = Math.sin(angle) * radius + (Math.random() - 0.5) * variation;
      } else {
        // Chaotic cloud
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = 0.9 + Math.random() * 0.6;
        
        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = r * Math.cos(phi);
      }
    }
    
    initialPositions.current = positions.slice();
    
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [particleCount, organization]);
  
  useFrame((state) => {
    if (!pointsRef.current || !initialPositions.current) return;
    const time = state.clock.elapsedTime;
    const positions = pointsRef.current.geometry.attributes.position;
    
    for (let i = 0; i < positions.count; i++) {
      const initX = initialPositions.current[i * 3];
      const initY = initialPositions.current[i * 3 + 1];
      const initZ = initialPositions.current[i * 3 + 2];
      
      if (organization > 0.5) {
        // Organized rotation
        const rotSpeed = pulseSpeed * 0.3 * (1 + (1 - organization) * 2);
        const angle = Math.atan2(initZ, initX) + time * rotSpeed;
        const radius = Math.sqrt(initX * initX + initZ * initZ);
        
        positions.setX(i, Math.cos(angle) * radius);
        positions.setY(i, initY + Math.sin(time * 2 + i * 0.1) * 0.05);
        positions.setZ(i, Math.sin(angle) * radius);
      } else {
        // Chaotic movement
        const chaos = 1 - organization;
        positions.setX(i, initX + Math.sin(time * 1.5 + i) * 0.15 * chaos);
        positions.setY(i, initY + Math.cos(time * 1.2 + i * 0.7) * 0.15 * chaos);
        positions.setZ(i, initZ + Math.sin(time * 0.9 + i * 1.3) * 0.15 * chaos);
      }
    }
    positions.needsUpdate = true;
  });
  
  if (particleCount < 20) return null;
  
  // Size based on organization: organized = smaller/uniform, chaotic = varied/larger
  const baseSize = organization > 0.5 ? 0.025 : 0.04;
  
  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={baseSize}
        color={color}
        transparent
        opacity={0.85}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// NEW: Knowledge Glow - Fresnel edge glow that varies in sharpness
function KnowledgeGlow({
  intensity,
  sharpness,
  color
}: {
  intensity: number;
  sharpness: number; // 1 = sharp edge, 0 = diffuse aura
  color: THREE.Color;
  pulseSpeed?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Create shader material for fresnel effect
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: color },
        intensity: { value: intensity },
        sharpness: { value: sharpness },
        time: { value: 0 }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        uniform float intensity;
        uniform float sharpness;
        uniform float time;
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
          vec3 viewDir = normalize(cameraPosition - vPosition);
          float fresnel = 1.0 - dot(viewDir, vNormal);
          
          // Sharpness controls the power of the fresnel
          float power = mix(1.0, 4.0, sharpness);
          fresnel = pow(fresnel, power);
          
          // Wider spread for lower sharpness
          float spread = mix(1.5, 1.0, sharpness);
          fresnel = fresnel * spread;
          
          // Subtle pulse for diffuse glow
          float pulse = 1.0 + sin(time * 2.0) * 0.1 * (1.0 - sharpness);
          
          float alpha = fresnel * intensity * pulse;
          gl_FragColor = vec4(glowColor, alpha * 0.6);
        }
      `,
      transparent: true,
      side: THREE.FrontSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
  }, [color, intensity, sharpness]);
  
  useFrame((state) => {
    if (material.uniforms) {
      material.uniforms.time.value = state.clock.elapsedTime;
    }
  });
  
  if (intensity < 0.1) return null;
  
  // Scale based on sharpness: sharp = tighter to blob, diffuse = larger
  const scale = sharpness > 0.5 ? 0.85 : 0.95 + (1 - sharpness) * 0.2;
  
  return (
    <mesh ref={meshRef} scale={scale}>
      <sphereGeometry args={[1, 32, 32]} />
      <primitive object={material} />
    </mesh>
  );
}

// Outer Aura/Glow for Risk visualization - ENHANCED
function OuterAura({ 
  intensity, 
  color,
  pulseSpeed 
}: { 
  intensity: number;
  color: string;
  pulseSpeed: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const innerMeshRef = useRef<THREE.Mesh>(null);
  const threeColor = useMemo(() => new THREE.Color(color), [color]);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    
    // Pulsing scale for dramatic effect - more intense pulsing at high risk
    const pulseAmount = intensity > 0.7 ? 0.2 : 0.1;
    const pulse = 1 + Math.sin(time * pulseSpeed * 1.5) * pulseAmount * intensity;
    meshRef.current.scale.setScalar(pulse);
    
    // Update opacity based on pulse
    const material = meshRef.current.material as THREE.MeshBasicMaterial;
    material.opacity = (0.25 + Math.sin(time * pulseSpeed * 2) * 0.15) * intensity;
    
    // Inner glow layer
    if (innerMeshRef.current) {
      const innerMat = innerMeshRef.current.material as THREE.MeshBasicMaterial;
      innerMat.opacity = (0.35 + Math.sin(time * pulseSpeed * 2.5) * 0.2) * intensity;
      innerMeshRef.current.scale.setScalar(1 + Math.sin(time * pulseSpeed * 2) * 0.05);
    }
  });
  
  // Show even at low risk levels
  if (intensity < 0.1) return null;
  
  return (
    <group>
      {/* Inner glow - closer to blob */}
      <mesh ref={innerMeshRef}>
        <sphereGeometry args={[1.15, 32, 32]} />
        <meshBasicMaterial
          color={threeColor}
          transparent
          opacity={0.4 * intensity}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Outer aura */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[1.6, 32, 32]} />
        <meshBasicMaterial
          color={threeColor}
          transparent
          opacity={0.25 * intensity}
          side={THREE.BackSide}
        />
      </mesh>
      
      {/* Critical risk: additional danger ring */}
      {intensity > 0.8 && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.4, 0.02, 16, 64]} />
          <meshBasicMaterial
            color={threeColor}
            transparent
            opacity={0.8}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}
    </group>
  );
}

// Inner pattern component based on knowledge type
function InnerPattern({ 
  pattern, 
  intensity, 
  color 
}: { 
  pattern: 'grid' | 'waves' | 'particles' | 'chaos'; 
  intensity: number;
  color: THREE.Color;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const pointsRef = useRef<THREE.Points>(null);
  
  const patternGeometry = useMemo(() => {
    const positions: number[] = [];
    const count = Math.floor(50 + intensity * 150);
    
    switch (pattern) {
      case 'grid':
        const gridSize = Math.ceil(Math.cbrt(count));
        for (let x = 0; x < gridSize; x++) {
          for (let y = 0; y < gridSize; y++) {
            for (let z = 0; z < gridSize; z++) {
              const px = (x / gridSize - 0.5) * 0.6;
              const py = (y / gridSize - 0.5) * 0.6;
              const pz = (z / gridSize - 0.5) * 0.6;
              if (Math.sqrt(px*px + py*py + pz*pz) < 0.35) {
                positions.push(px, py, pz);
              }
            }
          }
        }
        break;
        
      case 'waves':
        for (let i = 0; i < count; i++) {
          const ring = Math.floor(i / 20);
          const angle = (i % 20) / 20 * Math.PI * 2;
          const radius = 0.1 + ring * 0.08;
          if (radius < 0.4) {
            positions.push(
              Math.cos(angle) * radius,
              Math.sin(ring * 0.5) * 0.05,
              Math.sin(angle) * radius
            );
          }
        }
        break;
        
      case 'particles':
        for (let i = 0; i < count; i++) {
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          const r = Math.random() * 0.35;
          positions.push(
            r * Math.sin(phi) * Math.cos(theta),
            r * Math.sin(phi) * Math.sin(theta),
            r * Math.cos(phi)
          );
        }
        break;
        
      case 'chaos':
        for (let i = 0; i < count * 1.5; i++) {
          const t = i / count;
          const noise1 = Math.sin(t * 20 + Math.random() * 5) * 0.3;
          const noise2 = Math.cos(t * 15 + Math.random() * 5) * 0.3;
          const noise3 = Math.sin(t * 25 + Math.random() * 5) * 0.3;
          positions.push(noise1, noise2, noise3);
        }
        break;
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return geometry;
  }, [pattern, intensity]);
  
  useFrame((state) => {
    if (!groupRef.current || !pointsRef.current) return;
    const time = state.clock.elapsedTime;
    
    switch (pattern) {
      case 'waves':
        groupRef.current.rotation.y = time * 0.3;
        const positions = pointsRef.current.geometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
          positions.setY(i, Math.sin(time * 2 + i * 0.1) * 0.05);
        }
        positions.needsUpdate = true;
        break;
      case 'particles':
        groupRef.current.rotation.y = time * 0.5;
        groupRef.current.rotation.x = Math.sin(time * 0.3) * 0.2;
        break;
      case 'chaos':
        groupRef.current.rotation.x = time * 0.4;
        groupRef.current.rotation.y = time * 0.3;
        groupRef.current.rotation.z = time * 0.2;
        break;
      default:
        groupRef.current.rotation.y = time * 0.1;
    }
  });
  
  return (
    <group ref={groupRef}>
      <points ref={pointsRef} geometry={patternGeometry}>
        <pointsMaterial
          size={0.015}
          color={color}
          transparent
          opacity={0.7}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

// Noise particles for challenge dimension - visible on light backgrounds
function ChallengeNoise({ 
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

// Single organic lobe/sphere with deformable surface
function Lobe({ 
  position, 
  size, 
  color, 
  transmission,
  roughness,
  surfaceRoughness,
  surfaceSmoothing,
  thickness,
  ior,
  pulseSpeed,
  wobbleIntensity,
  index,
  glowColor,
  glowIntensity,
  isSelected,
  symmetry
}: {
  position: [number, number, number];
  size: number;
  color: string;
  transmission: number;
  roughness: number;
  surfaceRoughness: number;
  surfaceSmoothing: number; // NEW: 0 = faceted/crystalline, 1 = smooth/organic
  thickness: number;
  ior: number;
  pulseSpeed: number;
  wobbleIntensity: number;
  index: number;
  glowColor: string;
  glowIntensity: number;
  isSelected: boolean;
  symmetry: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshPhysicalMaterial>(null);
  
  const threeColor = useMemo(() => new THREE.Color(color), [color]);
  const threeGlowColor = useMemo(() => new THREE.Color(glowColor), [glowColor]);
  
  const geometry = useMemo(() => {
    // Segments based on surfaceSmoothing: low = faceted (8-16), high = smooth (48-64)
    const segments = Math.floor(8 + surfaceSmoothing * 56);
    
    // Use IcosahedronGeometry for low smoothing (crystalline), SphereGeometry for high (organic)
    let geo: THREE.BufferGeometry;
    if (surfaceSmoothing < 0.3) {
      // Faceted/crystalline look
      const detail = Math.floor(1 + surfaceSmoothing * 3);
      geo = new THREE.IcosahedronGeometry(1, detail);
    } else {
      // Smooth organic look
      geo = new THREE.SphereGeometry(1, segments, segments);
    }
    
    const positions = geo.attributes.position;
    
    // Apply surface roughness deformation (reduced for smooth surfaces)
    const deformationAmount = surfaceRoughness * (1 - surfaceSmoothing * 0.5);
    if (deformationAmount > 0.1) {
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        const z = positions.getZ(i);
        
        const noise = 
          Math.sin(x * 5 + index) * 
          Math.cos(y * 5 + index) * 
          Math.sin(z * 5 + index);
        
        const deformation = 1 + noise * deformationAmount * 0.3;
        
        positions.setXYZ(i, x * deformation, y * deformation, z * deformation);
      }
      positions.needsUpdate = true;
      geo.computeVertexNormals();
    }
    
    return geo;
  }, [surfaceRoughness, surfaceSmoothing, index]);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    
    const time = state.clock.elapsedTime;
    const phaseOffset = index * 0.5;
    
    const pulse = 1 + Math.sin(time * pulseSpeed + phaseOffset) * 0.08;
    meshRef.current.scale.setScalar(size * pulse);
    
    const asymmetryFactor = 1 - symmetry;
    const wobbleX = Math.sin(time * 1.2 + phaseOffset) * wobbleIntensity * 0.15 * (1 + asymmetryFactor);
    const wobbleY = Math.cos(time * 0.9 + phaseOffset) * wobbleIntensity * 0.12;
    const wobbleZ = Math.sin(time * 1.5 + phaseOffset * 2) * wobbleIntensity * 0.1 * (1 + asymmetryFactor);
    
    meshRef.current.position.x = position[0] + wobbleX;
    meshRef.current.position.y = position[1] + wobbleY;
    meshRef.current.position.z = position[2] + wobbleZ;
    
    meshRef.current.rotation.x = Math.sin(time * 0.3 + phaseOffset) * 0.1;
    meshRef.current.rotation.y = time * 0.1;
    
    if (materialRef.current) {
      const riskPulse = glowIntensity > 0.5 
        ? 1 + Math.sin(time * 3 + index) * 0.3 * glowIntensity 
        : 1;
      const targetEmissive = isSelected ? 0.6 : glowIntensity * 0.5 * riskPulse;
      materialRef.current.emissiveIntensity = THREE.MathUtils.lerp(
        materialRef.current.emissiveIntensity,
        targetEmissive,
        0.1
      );
    }
  });
  
  return (
    <mesh ref={meshRef} position={position} geometry={geometry}>
      <meshPhysicalMaterial
        ref={materialRef}
        color={threeColor}
        emissive={isSelected ? threeColor : threeGlowColor}
        emissiveIntensity={glowIntensity * 0.2}
        roughness={roughness}
        metalness={0.0}
        transmission={transmission}
        thickness={thickness}
        ior={ior}
        clearcoat={0.8}
        clearcoatRoughness={0.1}
        envMapIntensity={1.5}
        transparent
        opacity={0.95}
      />
    </mesh>
  );
}

// Central core sphere with enhanced visibility control
function CoreSphere({ 
  color, 
  transmission, 
  pulseSpeed,
  coreGlow,
  coreVisibility,
  scale
}: { 
  color: string; 
  transmission: number;
  pulseSpeed: number;
  coreGlow: number;
  coreVisibility: number;
  scale: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const threeColor = useMemo(() => new THREE.Color(color), [color]);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    const pulse = 1 + Math.sin(time * pulseSpeed * 0.7) * 0.08;
    
    // Scale based on visibility
    const visibleScale = 0.2 + coreVisibility * 0.3;
    meshRef.current.scale.setScalar(visibleScale * scale * pulse);
    meshRef.current.rotation.y = time * 0.2;
    
    if (lightRef.current) {
      lightRef.current.intensity = coreGlow * coreVisibility * 3 * pulse;
    }
  });
  
  // Very low visibility = don't render
  if (coreVisibility < 0.1) return null;
  
  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshPhysicalMaterial
          color={threeColor}
          emissive={threeColor}
          emissiveIntensity={coreGlow * coreVisibility + 0.2}
          roughness={0.05}
          transmission={transmission * (1 - coreVisibility * 0.3)}
          thickness={4}
          ior={2.0}
          clearcoat={1}
          clearcoatRoughness={0.02}
          envMapIntensity={2.5}
          transparent
          opacity={0.5 + coreVisibility * 0.4}
        />
      </mesh>
      <pointLight
        ref={lightRef}
        color={threeColor}
        intensity={coreGlow * coreVisibility * 3}
        distance={3}
        decay={2}
      />
    </group>
  );
}

export function MetaballBlob({ data, onHover, selectedLobe }: MetaballBlobProps) {
  const groupRef = useRef<THREE.Group>(null);
  
  const lobePositions = useMemo(() => {
    const positions: [number, number, number][] = [];
    const count = data.lobeCount;
    const spread = data.lobeSpread;
    const symmetry = data.symmetry;
    
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    
    for (let i = 0; i < count; i++) {
      const yBase = 1 - (i / (count - 1)) * 2;
      const yVariation = symmetry < 0.5 ? (Math.random() - 0.5) * 0.3 * (1 - symmetry) : 0;
      const y = yBase + yVariation;
      
      const radius = Math.sqrt(1 - y * y) * spread;
      const theta = goldenAngle * i;
      
      const asymmetryOffset = symmetry < 0.5 ? (Math.random() - 0.5) * 0.2 * (1 - symmetry) : 0;
      
      const x = Math.cos(theta) * radius + asymmetryOffset;
      const z = Math.sin(theta) * radius + asymmetryOffset;
      
      positions.push([x, y * spread * 0.6, z]);
    }
    
    return positions;
  }, [data.lobeCount, data.lobeSpread, data.symmetry]);
  
  const lobeColors = useMemo(() => {
    return lobePositions.map((_, i) => {
      const colorIndex = i % data.colors.length;
      return data.colors[colorIndex] || data.primaryColor;
    });
  }, [lobePositions, data.colors, data.primaryColor]);
  
  const primaryThreeColor = useMemo(() => new THREE.Color(data.primaryColor), [data.primaryColor]);
  const challengeColor = useMemo(() => new THREE.Color(data.glowColor), [data.glowColor]);
  const knowledgeGlowColor = useMemo(() => new THREE.Color(data.knowledgeGlowColor || data.primaryColor), [data.knowledgeGlowColor, data.primaryColor]);
  
  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = state.clock.elapsedTime * data.rotationSpeed * 0.3;
  });
  
  return (
    <group ref={groupRef} scale={data.resourceScale}>
      
      {/* Outer Aura for Risk */}
      <OuterAura 
        intensity={data.outerAuraIntensity}
        color={data.outerAuraColor}
        pulseSpeed={data.pulseSpeed}
      />
      
      {/* Spikes for Complexity + Challenge */}
      <Spikes 
        count={data.spikeCount}
        length={data.spikeLength}
        color={primaryThreeColor}
        glowColor={challengeColor}
        glowIntensity={data.glowIntensity}
      />
      
      {/* Holes/Voids for Information */}
      <Holes 
        count={data.holeCount}
        size={data.holeSize}
        color={primaryThreeColor}
      />
      
      {/* Wireframe overlay for Knowledge */}
      <WireframeOverlay 
        opacity={data.wireframeOpacity}
        color={primaryThreeColor}
      />
      
      {/* NEW: Knowledge Orbit - visible outer particles */}
      <KnowledgeOrbit
        particleCount={data.outerParticleCount}
        organization={data.outerParticleOrganization}
        color={knowledgeGlowColor}
        pulseSpeed={data.pulseSpeed}
      />
      
      {/* NEW: Knowledge Glow - Fresnel edge glow */}
      <KnowledgeGlow
        intensity={data.knowledgeGlowIntensity}
        sharpness={data.knowledgeGlowSharpness}
        color={knowledgeGlowColor}
      />
      
      {/* Challenge noise particles */}
      <ChallengeNoise 
        intensity={data.noiseIntensity} 
        color={challengeColor}
      />
      
      {/* Inner pattern based on knowledge */}
      <InnerPattern 
        pattern={data.innerPattern}
        intensity={data.wobbleIntensity}
        color={primaryThreeColor}
      />
      
      {/* Central glowing core - visibility controlled by development */}
      <CoreSphere 
        color={data.primaryColor}
        transmission={data.transmission}
        pulseSpeed={data.pulseSpeed}
        coreGlow={data.coreGlow}
        coreVisibility={data.coreVisibility}
        scale={data.resourceScale}
      />
      
      {/* Outer lobes/spheres */}
      {lobePositions.map((pos, i) => (
        <Lobe
          key={i}
          position={pos}
          size={data.lobeSize}
          color={lobeColors[i]}
          transmission={data.transmission}
          roughness={data.roughness}
          surfaceRoughness={data.surfaceRoughness}
          surfaceSmoothing={data.surfaceSmoothing}
          thickness={data.thickness}
          ior={data.ior}
          pulseSpeed={data.pulseSpeed}
          wobbleIntensity={data.wobbleIntensity}
          index={i}
          glowColor={data.glowColor}
          glowIntensity={data.glowIntensity}
          isSelected={selectedLobe === i}
          symmetry={data.symmetry}
        />
      ))}
    </group>
  );
}
