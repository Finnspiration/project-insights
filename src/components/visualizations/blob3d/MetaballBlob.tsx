import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Blob3DData } from './blobMapping3D';

interface MetaballBlobProps {
  data: Blob3DData;
  onHover?: (lobeIndex: number | null) => void;
  selectedLobe?: number | null;
}

// Single organic lobe/sphere component
function Lobe({ 
  position, 
  size, 
  color, 
  secondaryColor,
  transmission,
  roughness,
  thickness,
  ior,
  pulseSpeed,
  wobbleIntensity,
  index,
  glowColor,
  glowIntensity,
  isSelected
}: {
  position: [number, number, number];
  size: number;
  color: string;
  secondaryColor: string;
  transmission: number;
  roughness: number;
  thickness: number;
  ior: number;
  pulseSpeed: number;
  wobbleIntensity: number;
  index: number;
  glowColor: string;
  glowIntensity: number;
  isSelected: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshPhysicalMaterial>(null);
  
  // Convert color strings to THREE colors
  const threeColor = useMemo(() => new THREE.Color(color), [color]);
  const threeSecondaryColor = useMemo(() => new THREE.Color(secondaryColor), [secondaryColor]);
  const threeGlowColor = useMemo(() => new THREE.Color(glowColor), [glowColor]);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    
    const time = state.clock.elapsedTime;
    const phaseOffset = index * 0.5;
    
    // Pulsing scale animation
    const pulse = 1 + Math.sin(time * pulseSpeed + phaseOffset) * 0.08;
    meshRef.current.scale.setScalar(size * pulse);
    
    // Wobble position
    const wobbleX = Math.sin(time * 1.2 + phaseOffset) * wobbleIntensity * 0.15;
    const wobbleY = Math.cos(time * 0.9 + phaseOffset) * wobbleIntensity * 0.12;
    const wobbleZ = Math.sin(time * 1.5 + phaseOffset * 2) * wobbleIntensity * 0.1;
    
    meshRef.current.position.x = position[0] + wobbleX;
    meshRef.current.position.y = position[1] + wobbleY;
    meshRef.current.position.z = position[2] + wobbleZ;
    
    // Subtle rotation
    meshRef.current.rotation.x = Math.sin(time * 0.3 + phaseOffset) * 0.1;
    meshRef.current.rotation.y = time * 0.1;
    
    // Update emissive for selection
    if (materialRef.current) {
      const targetEmissive = isSelected ? 0.5 : glowIntensity * 0.2;
      materialRef.current.emissiveIntensity = THREE.MathUtils.lerp(
        materialRef.current.emissiveIntensity,
        targetEmissive,
        0.1
      );
    }
  });
  
  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[1, 64, 64]} />
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

// Central core sphere
function CoreSphere({ 
  color, 
  transmission, 
  pulseSpeed,
  glowIntensity 
}: { 
  color: string; 
  transmission: number;
  pulseSpeed: number;
  glowIntensity: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const threeColor = useMemo(() => new THREE.Color(color), [color]);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    const pulse = 1 + Math.sin(time * pulseSpeed * 0.7) * 0.05;
    meshRef.current.scale.setScalar(0.5 * pulse);
    meshRef.current.rotation.y = time * 0.2;
  });
  
  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 64, 64]} />
      <meshPhysicalMaterial
        color={threeColor}
        emissive={threeColor}
        emissiveIntensity={glowIntensity * 0.5 + 0.2}
        roughness={0.1}
        transmission={transmission * 0.8}
        thickness={3}
        ior={1.8}
        clearcoat={1}
        clearcoatRoughness={0.05}
        envMapIntensity={2}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
}

export function MetaballBlob({ data, onHover, selectedLobe }: MetaballBlobProps) {
  const groupRef = useRef<THREE.Group>(null);
  
  // Generate lobe positions in a spherical arrangement
  const lobePositions = useMemo(() => {
    const positions: [number, number, number][] = [];
    const count = data.lobeCount;
    const spread = data.lobeSpread;
    
    // Golden angle distribution for even spacing
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    
    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2; // -1 to 1
      const radius = Math.sqrt(1 - y * y) * spread;
      const theta = goldenAngle * i;
      
      const x = Math.cos(theta) * radius;
      const z = Math.sin(theta) * radius;
      
      positions.push([x, y * spread * 0.6, z]);
    }
    
    return positions;
  }, [data.lobeCount, data.lobeSpread]);
  
  // Rotate the entire blob group
  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = state.clock.elapsedTime * data.rotationSpeed * 0.3;
  });
  
  return (
    <group ref={groupRef}>
      {/* Central core */}
      <CoreSphere 
        color={data.primaryColor}
        transmission={data.transmission}
        pulseSpeed={data.pulseSpeed}
        glowIntensity={data.glowIntensity}
      />
      
      {/* Outer lobes */}
      {lobePositions.map((pos, i) => (
        <Lobe
          key={i}
          position={pos}
          size={data.lobeSize}
          color={i % 2 === 0 ? data.primaryColor : data.secondaryColor}
          secondaryColor={data.secondaryColor}
          transmission={data.transmission}
          roughness={data.roughness}
          thickness={data.thickness}
          ior={data.ior}
          pulseSpeed={data.pulseSpeed}
          wobbleIntensity={data.wobbleIntensity}
          index={i}
          glowColor={data.glowColor}
          glowIntensity={data.glowIntensity}
          isSelected={selectedLobe === i}
        />
      ))}
    </group>
  );
}
