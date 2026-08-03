// The body itself: lobes, the core, and how lobes relate to each other.
// Extracted verbatim from MetaballBlob.tsx, which had grown to 2,944 lines.

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Single organic lobe/sphere with complexity-driven shape
export function Lobe({ 
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
  culturalGlowIntensity,
  isSelected,
  symmetry,
  baseShape,
  crystalFaces,
  deformationIntensity,
  hasHolesInSurface,
  hasCraters
}: {
  position: [number, number, number];
  size: number;
  color: string;
  transmission: number;
  roughness: number;
  surfaceRoughness: number;
  surfaceSmoothing: number;
  thickness: number;
  ior: number;
  pulseSpeed: number;
  wobbleIntensity: number;
  index: number;
  glowColor: string;
  glowIntensity: number;
  culturalGlowIntensity: number;
  isSelected: boolean;
  symmetry: number;
  baseShape: 'sphere' | 'regular_crystal' | 'irregular_crystal' | 'chaotic_blob';
  crystalFaces: number;
  deformationIntensity: number;
  hasHolesInSurface: boolean;
  hasCraters: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshPhysicalMaterial>(null);
  
  const threeColor = useMemo(() => new THREE.Color(color), [color]);
  const threeGlowColor = useMemo(() => new THREE.Color(glowColor), [glowColor]);
  
  // One surface family, deformed continuously.
  //
  // This used to switch between four solids: a sphere, a 1.6-unit *cube*, a
  // dodecahedron and a noisy sphere. Six overlapping translucent cubes is
  // exactly what a complicated project rendered as — flat plates intersecting
  // each other, which no amount of framing could turn into a body. Large flat
  // faces read as slabs under a glass material; only curvature reads as volume.
  //
  // Now the body is always a subdivided icosphere and `deformationIntensity`
  // (the roughness gesture) decides how disturbed it is: smooth at 0,
  // agitated at 1. Same object, one spectrum.
  const geometry = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(1, 4);
    const positions = geo.attributes.position;

    if (deformationIntensity > 0.001) {
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        const z = positions.getZ(i);

        // Three octaves: broad lobes, surface swell, fine agitation. The index
        // term keeps sibling lobes from being identical.
        const low = Math.sin(x * 2 + index) * Math.cos(y * 2.3) * Math.sin(z * 1.8) * 0.40;
        const mid = Math.sin(x * 5 + y * 4 + index * 0.7) * 0.22;
        const high = Math.sin(x * 11 + z * 9 + index * 1.3) * Math.cos(y * 10) * 0.12;

        let deformation = 1 + (low + mid + high) * deformationIntensity;

        if (hasCraters && deformationIntensity > 0.4) {
          const crater = Math.sin(x * 7 + index * 2.5) * Math.sin(y * 7) * Math.sin(z * 7);
          if (crater > 0.55) deformation *= 1 - 0.22 * deformationIntensity;
        }

        positions.setXYZ(i, x * deformation, y * deformation, z * deformation);
      }
    }

    positions.needsUpdate = true;
    geo.computeVertexNormals();

    return geo;
  }, [deformationIntensity, index, hasCraters]);
  
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
    
    // More rotation variation for chaotic shapes
    const rotationMultiplier = baseShape === 'chaotic_blob' ? 0.3 : 0.1;
    meshRef.current.rotation.x = Math.sin(time * 0.3 + phaseOffset) * rotationMultiplier;
    meshRef.current.rotation.y = time * rotationMultiplier;
    
    if (materialRef.current) {
      const riskPulse = glowIntensity > 0.5 
        ? 1 + Math.sin(time * 3 + index) * 0.3 * glowIntensity 
        : 1;
      // Cultural neon glow - pulsing effect for cross-cultural
      const culturalPulse = culturalGlowIntensity > 0.5 
        ? 1 + Math.sin(time * 4 + index * 1.5) * 0.4 * culturalGlowIntensity 
        : 1;
      const baseEmissive = isSelected ? 0.6 : glowIntensity * 0.5 * riskPulse;
      const culturalEmissive = culturalGlowIntensity * 0.6 * culturalPulse;
      const targetEmissive = Math.max(baseEmissive, culturalEmissive);
      materialRef.current.emissiveIntensity = THREE.MathUtils.lerp(
        materialRef.current.emissiveIntensity,
        targetEmissive,
        0.1
      );
    }
  });
  
  // Adjust material properties based on shape type
  const materialRoughness = baseShape === 'sphere' ? 0.05 : 
                            baseShape === 'regular_crystal' ? 0.15 :
                            baseShape === 'irregular_crystal' ? 0.25 : 0.35;
  
  const materialMetalness = baseShape === 'regular_crystal' ? 0.2 :
                            baseShape === 'irregular_crystal' ? 0.15 : 0;
  
  // Neon effect: lower roughness and higher clearcoat for cultural diversity
  const neonRoughness = Math.max(0.02, materialRoughness - culturalGlowIntensity * 0.1);
  const neonClearcoat = Math.min(1.0, (baseShape === 'sphere' ? 1.0 : 0.6) + culturalGlowIntensity * 0.3);
  
  return (
    <mesh ref={meshRef} position={position} geometry={geometry}>
      <meshPhysicalMaterial
        ref={materialRef}
        color={threeColor}
        emissive={culturalGlowIntensity > 0.5 ? threeColor : (isSelected ? threeColor : threeGlowColor)}
        emissiveIntensity={Math.max(glowIntensity * 0.2, culturalGlowIntensity * 0.4)}
        roughness={neonRoughness}
        metalness={materialMetalness}
        transmission={transmission}
        thickness={thickness}
        ior={ior}
        clearcoat={neonClearcoat}
        clearcoatRoughness={baseShape === 'sphere' ? 0.02 : 0.15}
        envMapIntensity={1.5 + culturalGlowIntensity * 0.5}
        transparent
        opacity={0.95}
      />
    </mesh>
  );
}

// Central core sphere with IDG-based shape transformation
export function CoreSphere({ 
  color, 
  transmission, 
  pulseSpeed,
  coreGlow,
  coreVisibility,
  scale,
  coreShape,
  coreRings,
  coreRotationAxes,
  coreEmissivePattern,
  coreScale
}: { 
  color: string; 
  transmission: number;
  pulseSpeed: number;
  coreGlow: number;
  coreVisibility: number;
  scale: number;
  coreShape: 'sphere' | 'torus' | 'octahedron' | 'icosahedron' | 'starburst';
  coreRings: number;
  coreRotationAxes: number;
  coreEmissivePattern: 'solid' | 'pulse' | 'breathe' | 'radiate' | 'explode';
  coreScale: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const threeColor = useMemo(() => new THREE.Color(color), [color]);
  
  // Create geometry based on IDG shape
  const geometry = useMemo(() => {
    switch (coreShape) {
      case 'sphere':
        return new THREE.SphereGeometry(1, 64, 64);
      case 'torus':
        return new THREE.TorusGeometry(0.8, 0.35, 32, 64);
      case 'octahedron':
        return new THREE.OctahedronGeometry(1, 0);
      case 'icosahedron':
        return new THREE.IcosahedronGeometry(0.9, 1);
      case 'starburst':
        // Use icosahedron as base for starburst
        return new THREE.IcosahedronGeometry(0.6, 0);
      default:
        return new THREE.SphereGeometry(1, 64, 64);
    }
  }, [coreShape]);
  
  useFrame((state) => {
    if (!meshRef.current || !groupRef.current) return;
    const time = state.clock.elapsedTime;
    
    // Emissive pattern animation
    let emissiveMultiplier = 1;
    switch (coreEmissivePattern) {
      case 'breathe':
        emissiveMultiplier = 0.7 + Math.sin(time * 0.5) * 0.3;
        break;
      case 'pulse':
        emissiveMultiplier = 0.5 + Math.abs(Math.sin(time * 2)) * 0.5;
        break;
      case 'radiate':
        emissiveMultiplier = 0.6 + Math.sin(time * 1.5) * 0.2 + Math.sin(time * 3) * 0.2;
        break;
      case 'explode':
        emissiveMultiplier = 0.4 + Math.abs(Math.sin(time * 4)) * 0.6;
        break;
      default:
        emissiveMultiplier = 1;
    }
    
    // Scale based on visibility and core scale
    const visibleScale = (0.2 + coreVisibility * 0.3) * coreScale;
    const scaleAnim = coreEmissivePattern === 'explode' 
      ? 1 + Math.abs(Math.sin(time * 3)) * 0.15 
      : 1 + Math.sin(time * pulseSpeed * 0.7) * 0.08;
    meshRef.current.scale.setScalar(visibleScale * scale * scaleAnim);
    
    // Rotation based on axes
    if (coreRotationAxes >= 1) groupRef.current.rotation.y = time * 0.3;
    if (coreRotationAxes >= 2) groupRef.current.rotation.x = time * 0.2;
    if (coreRotationAxes >= 3) groupRef.current.rotation.z = time * 0.15;
    
    if (lightRef.current) {
      lightRef.current.intensity = coreGlow * coreVisibility * 3 * emissiveMultiplier;
    }
  });
  
  // Starburst rays
  const starburstRays = useMemo(() => {
    if (coreShape !== 'starburst') return null;
    const rays = [];
    for (let i = 0; i < coreRings; i++) {
      const phi = Math.acos(-1 + (2 * i) / coreRings);
      const theta = Math.sqrt(coreRings * Math.PI) * phi;
      rays.push({
        position: [
          Math.cos(theta) * Math.sin(phi),
          Math.sin(theta) * Math.sin(phi),
          Math.cos(phi)
        ] as [number, number, number],
        rotation: [phi, theta, 0] as [number, number, number]
      });
    }
    return rays;
  }, [coreShape, coreRings]);

  // Very low visibility = don't render. This has to come after every hook:
  // coreVisibility is derived from the morphology, so crossing the threshold
  // would otherwise change the hook count between renders and make React
  // throw "Rendered fewer hooks than expected".
  if (coreVisibility < 0.1) return null;

  return (
    <group ref={groupRef}>
      <mesh ref={meshRef} geometry={geometry}>
        <meshPhysicalMaterial
          color={threeColor}
          emissive={threeColor}
          emissiveIntensity={coreGlow * coreVisibility + 0.3}
          roughness={coreShape === 'sphere' ? 0.02 : 0.1}
          metalness={coreShape === 'octahedron' || coreShape === 'icosahedron' ? 0.3 : 0}
          transmission={transmission * (1 - coreVisibility * 0.3)}
          thickness={4}
          ior={2.0}
          clearcoat={1}
          clearcoatRoughness={0.02}
          envMapIntensity={2.5}
          transparent
          opacity={0.6 + coreVisibility * 0.3}
        />
      </mesh>
      
      {/* Starburst rays */}
      {starburstRays && starburstRays.map((ray, i) => (
        <mesh key={i} position={ray.position} rotation={ray.rotation}>
          <coneGeometry args={[0.08, 0.6, 8]} />
          <meshPhysicalMaterial
            color={threeColor}
            emissive={threeColor}
            emissiveIntensity={coreGlow * 0.8}
            roughness={0.1}
            transparent
            opacity={0.7}
          />
        </mesh>
      ))}
      
      {/* Extra ring for torus */}
      {coreShape === 'torus' && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.1, 0.08, 16, 48]} />
          <meshPhysicalMaterial
            color={threeColor}
            emissive={threeColor}
            emissiveIntensity={coreGlow * 0.5}
            roughness={0.1}
            transparent
            opacity={0.5}
          />
        </mesh>
      )}
      
      <pointLight
        ref={lightRef}
        color={threeColor}
        intensity={coreGlow * coreVisibility * 3}
        distance={4}
        decay={2}
      />
    </group>
  );
}

// Stakeholder Connections - tubes/strings between lobes for cooperative mode
export function StakeholderConnections({
  positions,
  thickness,
  color,
  pulseSpeed
}: {
  positions: [number, number, number][];
  thickness: number;
  color: THREE.Color;
  pulseSpeed: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  
  const connections = useMemo(() => {
    const lines: { start: THREE.Vector3; end: THREE.Vector3; midpoint: THREE.Vector3 }[] = [];
    
    // Connect each lobe to adjacent lobes
    for (let i = 0; i < positions.length; i++) {
      const nextIndex = (i + 1) % positions.length;
      const start = new THREE.Vector3(...positions[i]);
      const end = new THREE.Vector3(...positions[nextIndex]);
      const midpoint = start.clone().add(end).multiplyScalar(0.5);
      // Pull midpoint slightly toward center for curved appearance
      midpoint.multiplyScalar(0.85);
      lines.push({ start, end, midpoint });
    }
    
    return lines;
  }, [positions]);
  
  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.elapsedTime;
    
    // Gentle pulse on connections
    groupRef.current.children.forEach((child, i) => {
      const pulse = 1 + Math.sin(time * pulseSpeed + i * 0.5) * 0.15;
      child.scale.setScalar(pulse);
    });
  });
  
  return (
    <group ref={groupRef}>
      {connections.map((conn, i) => {
        const curve = new THREE.QuadraticBezierCurve3(conn.start, conn.midpoint, conn.end);
        const tubeGeo = new THREE.TubeGeometry(curve, 16, thickness, 8, false);
        
        return (
          <mesh key={i} geometry={tubeGeo}>
            <meshPhysicalMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.3}
              roughness={0.3}
              metalness={0.2}
              transmission={0.3}
              transparent
              opacity={0.8}
            />
          </mesh>
        );
      })}
    </group>
  );
}

// Collision Fragments - small particles that spawn from adversarial collisions
export function CollisionFragments({
  positions,
  intensity,
  color,
  fragmentCount
}: {
  positions: [number, number, number][];
  intensity: number;
  color: THREE.Color;
  fragmentCount: number;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const velocitiesRef = useRef<Float32Array | null>(null);
  const lifetimesRef = useRef<Float32Array | null>(null);
  
  const geometry = useMemo(() => {
    const count = Math.floor(fragmentCount * intensity * 30);
    const geo = new THREE.BufferGeometry();
    const positionsArr = new Float32Array(count * 3);
    velocitiesRef.current = new Float32Array(count * 3);
    lifetimesRef.current = new Float32Array(count);
    
    // Initialize fragments near random lobe positions
    for (let i = 0; i < count; i++) {
      const lobeIndex = Math.floor(Math.random() * positions.length);
      const lobe = positions[lobeIndex];
      
      positionsArr[i * 3] = lobe[0] + (Math.random() - 0.5) * 0.3;
      positionsArr[i * 3 + 1] = lobe[1] + (Math.random() - 0.5) * 0.3;
      positionsArr[i * 3 + 2] = lobe[2] + (Math.random() - 0.5) * 0.3;
      
      // Random outward velocity
      velocitiesRef.current[i * 3] = (Math.random() - 0.5) * 0.02;
      velocitiesRef.current[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
      velocitiesRef.current[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
      
      lifetimesRef.current[i] = Math.random();
    }
    
    geo.setAttribute('position', new THREE.BufferAttribute(positionsArr, 3));
    return geo;
  }, [positions, fragmentCount, intensity]);
  
  useFrame(() => {
    if (!pointsRef.current || !velocitiesRef.current || !lifetimesRef.current) return;
    
    const posAttr = pointsRef.current.geometry.attributes.position;
    
    for (let i = 0; i < posAttr.count; i++) {
      // Update lifetime
      lifetimesRef.current[i] -= 0.008;
      
      if (lifetimesRef.current[i] <= 0) {
        // Respawn at random lobe
        const lobeIndex = Math.floor(Math.random() * positions.length);
        const lobe = positions[lobeIndex];
        
        posAttr.setXYZ(
          i,
          lobe[0] + (Math.random() - 0.5) * 0.2,
          lobe[1] + (Math.random() - 0.5) * 0.2,
          lobe[2] + (Math.random() - 0.5) * 0.2
        );
        
        velocitiesRef.current[i * 3] = (Math.random() - 0.5) * 0.03;
        velocitiesRef.current[i * 3 + 1] = (Math.random() - 0.5) * 0.03;
        velocitiesRef.current[i * 3 + 2] = (Math.random() - 0.5) * 0.03;
        
        lifetimesRef.current[i] = 0.8 + Math.random() * 0.4;
      } else {
        // Move fragment
        posAttr.setXYZ(
          i,
          posAttr.getX(i) + velocitiesRef.current[i * 3],
          posAttr.getY(i) + velocitiesRef.current[i * 3 + 1],
          posAttr.getZ(i) + velocitiesRef.current[i * 3 + 2]
        );
      }
    }
    
    posAttr.needsUpdate = true;
  });
  
  if (intensity < 0.3) return null;
  
  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={0.06}
        color={color}
        transparent
        opacity={0.7}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
