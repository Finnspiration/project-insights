import { useRef, useMemo, useState } from 'react';
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

// NEW: IDG Outer Manifestation - energy extending beyond the blob
function IDGOuterManifestation({
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
  
  // Geometric rays for "Thinking" (Tænkning)
  const ThinkingRays = () => {
    const groupRef = useRef<THREE.Group>(null);
    
    const rays = useMemo(() => {
      const items: { direction: THREE.Vector3; length: number }[] = [];
      // Create rays pointing in geometric directions (like axes)
      const directions = [
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(-1, 0, 0),
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0, -1, 0),
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(0, 0, -1),
        // Diagonals
        new THREE.Vector3(1, 1, 0).normalize(),
        new THREE.Vector3(-1, 1, 0).normalize(),
        new THREE.Vector3(1, -1, 0).normalize(),
        new THREE.Vector3(-1, -1, 0).normalize(),
        new THREE.Vector3(0, 1, 1).normalize(),
        new THREE.Vector3(0, -1, 1).normalize(),
      ];
      
      for (let i = 0; i < Math.min(particleCount, directions.length); i++) {
        items.push({
          direction: directions[i],
          length: radius * (0.8 + Math.random() * 0.4)
        });
      }
      return items;
    }, [radius, particleCount]);
    
    useFrame((state) => {
      if (!groupRef.current) return;
      const time = state.clock.elapsedTime;
      
      // Slow rotation
      groupRef.current.rotation.y = time * animationSpeed * 0.2;
      groupRef.current.rotation.x = Math.sin(time * animationSpeed * 0.15) * 0.1;
    });
    
    return (
      <group ref={groupRef}>
        {rays.map((ray, i) => {
          const midpoint = ray.direction.clone().multiplyScalar(ray.length * 0.5 + 0.4);
          const rotation = new THREE.Euler(
            Math.atan2(ray.direction.y, Math.sqrt(ray.direction.x ** 2 + ray.direction.z ** 2)),
            Math.atan2(ray.direction.x, ray.direction.z),
            0
          );
          
          return (
            <group key={i}>
              {/* Line ray */}
              <mesh position={midpoint} rotation={rotation}>
                <cylinderGeometry args={[0.015, 0.015, ray.length, 8]} />
                <meshBasicMaterial
                  color={threeColor}
                  transparent
                  opacity={0.6 * intensity}
                  blending={THREE.AdditiveBlending}
                />
              </mesh>
              {/* Endpoint node */}
              <mesh position={ray.direction.clone().multiplyScalar(ray.length + 0.4)}>
                <sphereGeometry args={[0.04, 8, 8]} />
                <meshBasicMaterial
                  color={threeColor}
                  transparent
                  opacity={0.8 * intensity}
                  blending={THREE.AdditiveBlending}
                />
              </mesh>
            </group>
          );
        })}
        {/* Central grid cube wireframe */}
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(radius * 0.5, radius * 0.5, radius * 0.5)]} />
          <lineBasicMaterial color={threeColor} transparent opacity={0.4 * intensity} />
        </lineSegments>
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
  
  // Explosive rays for "Acting" (Handling)
  const ActingRays = () => {
    const groupRef = useRef<THREE.Group>(null);
    const raysRef = useRef<THREE.Group>(null);
    
    const rays = useMemo(() => {
      const items: { direction: THREE.Vector3; baseLength: number }[] = [];
      for (let i = 0; i < particleCount; i++) {
        // Random directions for explosive effect
        const phi = Math.acos(2 * Math.random() - 1);
        const theta = Math.random() * Math.PI * 2;
        
        items.push({
          direction: new THREE.Vector3(
            Math.sin(phi) * Math.cos(theta),
            Math.sin(phi) * Math.sin(theta),
            Math.cos(phi)
          ),
          baseLength: radius * (0.5 + Math.random() * 0.5)
        });
      }
      return items;
    }, [particleCount, radius]);
    
    useFrame((state) => {
      if (!raysRef.current) return;
      const time = state.clock.elapsedTime;
      
      raysRef.current.children.forEach((rayGroup, i) => {
        const ray = rays[i];
        if (!ray) return;
        
        // Pulsing extension - rays shoot out and retract
        const pulse = (Math.sin(time * animationSpeed + i * 0.3) + 1) * 0.5;
        const currentLength = ray.baseLength * (0.3 + pulse * 0.7);
        
        const cylinder = rayGroup.children[0] as THREE.Mesh;
        const tip = rayGroup.children[1] as THREE.Mesh;
        
        if (cylinder && tip) {
          cylinder.scale.y = currentLength / ray.baseLength;
          cylinder.position.copy(ray.direction.clone().multiplyScalar(currentLength * 0.5 + 0.3));
          tip.position.copy(ray.direction.clone().multiplyScalar(currentLength + 0.3));
          
          // Tip glow intensity
          const tipMat = tip.material as THREE.MeshBasicMaterial;
          tipMat.opacity = (0.5 + pulse * 0.5) * intensity;
        }
      });
      
      // Slow rotation
      if (groupRef.current) {
        groupRef.current.rotation.y = time * animationSpeed * 0.1;
      }
    });
    
    return (
      <group ref={groupRef}>
        <group ref={raysRef}>
          {rays.map((ray, i) => {
            const rotation = new THREE.Euler(
              Math.atan2(ray.direction.y, Math.sqrt(ray.direction.x ** 2 + ray.direction.z ** 2)),
              Math.atan2(ray.direction.x, ray.direction.z),
              0
            );
            
            return (
              <group key={i}>
                {/* Ray line */}
                <mesh rotation={rotation}>
                  <cylinderGeometry args={[0.02, 0.005, ray.baseLength, 6]} />
                  <meshBasicMaterial
                    color={threeColor}
                    transparent
                    opacity={0.7 * intensity}
                    blending={THREE.AdditiveBlending}
                  />
                </mesh>
                {/* Glowing tip */}
                <mesh>
                  <sphereGeometry args={[0.05, 8, 8]} />
                  <meshBasicMaterial
                    color={threeColor}
                    transparent
                    opacity={0.9 * intensity}
                    blending={THREE.AdditiveBlending}
                  />
                </mesh>
              </group>
            );
          })}
        </group>
        {/* Central explosion core */}
        <mesh>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshBasicMaterial
            color={threeColor}
            transparent
            opacity={0.4 * intensity}
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
      {manifestationType === 'geometric_rays' && <ThinkingRays />}
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

// NEW: Knowledge Visualization - distinct shapes for each knowledge level
function KnowledgeVisualization({
  shape,
  intensity,
  scale,
  color,
  supernovaRayCount,
  supernovaExpansionRate,
  pulseSpeed
}: {
  shape: 'grid3d' | 'mesh_sphere' | 'crystal' | 'supernova';
  intensity: number;
  scale: number;
  color: string;
  supernovaRayCount: number;
  supernovaExpansionRate: number;
  pulseSpeed: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const threeColor = useMemo(() => new THREE.Color(color), [color]);
  const materialRef = useRef<THREE.LineBasicMaterial>(null);
  
  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.elapsedTime;
    
    // Different rotation speeds based on shape
    switch (shape) {
      case 'grid3d':
        groupRef.current.rotation.y = time * 0.1;
        groupRef.current.rotation.x = Math.sin(time * 0.2) * 0.1;
        break;
      case 'mesh_sphere':
        groupRef.current.rotation.y = time * 0.15;
        groupRef.current.rotation.x = time * 0.1;
        break;
      case 'crystal':
        groupRef.current.rotation.y = time * 0.2;
        groupRef.current.rotation.z = Math.sin(time * 0.3) * 0.15;
        break;
      case 'supernova':
        groupRef.current.rotation.y = time * 0.3;
        // Pulsing scale for supernova
        const pulse = 1 + Math.sin(time * pulseSpeed) * 0.15 * supernovaExpansionRate;
        groupRef.current.scale.setScalar(scale * pulse);
        break;
    }
    
    // Update material opacity for pulsing effect
    if (materialRef.current) {
      materialRef.current.opacity = 0.6 + Math.sin(time * 2) * 0.2 * intensity;
    }
  });
  
  if (intensity < 0.1) return null;
  
  return (
    <group ref={groupRef} scale={scale}>
      {shape === 'grid3d' && <Grid3D color={threeColor} intensity={intensity} />}
      {shape === 'mesh_sphere' && <MeshSphere color={threeColor} intensity={intensity} />}
      {shape === 'crystal' && <KnowledgeCrystal color={threeColor} intensity={intensity} />}
      {shape === 'supernova' && (
        <Supernova 
          color={threeColor} 
          intensity={intensity} 
          rayCount={supernovaRayCount} 
          expansionRate={supernovaExpansionRate}
          pulseSpeed={pulseSpeed}
        />
      )}
    </group>
  );
}

// 3D Grid for Routine knowledge
function Grid3D({ color, intensity }: { color: THREE.Color; intensity: number }) {
  const gridSize = 5;
  const spacing = 0.25;
  
  const lines = useMemo(() => {
    const positions: [THREE.Vector3, THREE.Vector3][] = [];
    const offset = (gridSize - 1) * spacing / 2;
    
    // Create grid lines in all 3 dimensions
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const x = i * spacing - offset;
        const y = j * spacing - offset;
        
        // Lines along Z axis
        positions.push([
          new THREE.Vector3(x, y, -offset),
          new THREE.Vector3(x, y, offset)
        ]);
        
        // Lines along Y axis
        positions.push([
          new THREE.Vector3(x, -offset, y),
          new THREE.Vector3(x, offset, y)
        ]);
        
        // Lines along X axis
        positions.push([
          new THREE.Vector3(-offset, x, y),
          new THREE.Vector3(offset, x, y)
        ]);
      }
    }
    
    return positions;
  }, []);
  
  // Create intersection points
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const offset = (gridSize - 1) * spacing / 2;
    
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        for (let k = 0; k < gridSize; k++) {
          pts.push(new THREE.Vector3(
            i * spacing - offset,
            j * spacing - offset,
            k * spacing - offset
          ));
        }
      }
    }
    
    return pts;
  }, []);
  
  return (
    <group>
      {/* Grid lines */}
      {lines.map((line, i) => (
        <line key={i}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              array={new Float32Array([
                line[0].x, line[0].y, line[0].z,
                line[1].x, line[1].y, line[1].z
              ])}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial 
            color={color} 
            transparent 
            opacity={0.4 * intensity}
            linewidth={1}
          />
        </line>
      ))}
      
      {/* Intersection points */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={points.length}
            array={new Float32Array(points.flatMap(p => [p.x, p.y, p.z]))}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.04}
          color={color}
          transparent
          opacity={0.8 * intensity}
          sizeAttenuation
        />
      </points>
    </group>
  );
}

// Mesh Sphere for Adaptive knowledge
function MeshSphere({ color, intensity }: { color: THREE.Color; intensity: number }) {
  const meshRef = useRef<THREE.LineSegments>(null);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    
    // Gentle undulating movement
    meshRef.current.rotation.x = Math.sin(time * 0.3) * 0.2;
    meshRef.current.rotation.y = time * 0.2;
    
    // Breathing scale
    const scale = 1 + Math.sin(time * 0.5) * 0.05;
    meshRef.current.scale.setScalar(scale);
  });
  
  return (
    <group>
      {/* Main wireframe sphere */}
      <lineSegments ref={meshRef}>
        <edgesGeometry args={[new THREE.IcosahedronGeometry(0.7, 2)]} />
        <lineBasicMaterial 
          color={color} 
          transparent 
          opacity={0.7 * intensity}
          linewidth={1}
        />
      </lineSegments>
      
      {/* Inner sphere for depth */}
      <lineSegments scale={0.5}>
        <edgesGeometry args={[new THREE.IcosahedronGeometry(0.7, 1)]} />
        <lineBasicMaterial 
          color={color} 
          transparent 
          opacity={0.4 * intensity}
          linewidth={1}
        />
      </lineSegments>
      
      {/* Vertices as points */}
      <points>
        <icosahedronGeometry args={[0.7, 2]} />
        <pointsMaterial
          size={0.03}
          color={color}
          transparent
          opacity={0.9 * intensity}
          sizeAttenuation
        />
      </points>
    </group>
  );
}

// Multi-faceted Crystal for Innovative knowledge
function KnowledgeCrystal({ color, intensity }: { color: THREE.Color; intensity: number }) {
  const groupRef = useRef<THREE.Group>(null);
  
  // Create multiple overlapping crystal shapes
  const crystals = useMemo(() => {
    return [
      { geo: new THREE.OctahedronGeometry(0.5, 0), scale: 1.0, rotation: [0, 0, 0] },
      { geo: new THREE.TetrahedronGeometry(0.35, 0), scale: 1.2, rotation: [Math.PI / 4, Math.PI / 4, 0] },
      { geo: new THREE.OctahedronGeometry(0.3, 0), scale: 1.1, rotation: [Math.PI / 6, 0, Math.PI / 6] },
    ];
  }, []);
  
  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.elapsedTime;
    
    groupRef.current.children.forEach((child, i) => {
      child.rotation.y = time * 0.3 * (i % 2 === 0 ? 1 : -1);
      child.rotation.x = Math.sin(time * 0.2 + i) * 0.2;
    });
  });
  
  return (
    <group ref={groupRef}>
      {crystals.map((crystal, i) => (
        <group key={i} scale={crystal.scale} rotation={crystal.rotation as any}>
          {/* Wireframe edges */}
          <lineSegments>
            <edgesGeometry args={[crystal.geo]} />
            <lineBasicMaterial 
              color={color} 
              transparent 
              opacity={0.8 * intensity}
              linewidth={2}
            />
          </lineSegments>
          
          {/* Semi-transparent faces */}
          <mesh>
            <primitive object={crystal.geo.clone()} />
            <meshPhysicalMaterial
              color={color}
              transparent
              opacity={0.2 * intensity}
              roughness={0.1}
              metalness={0.3}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      ))}
      
      {/* Glowing core */}
      <mesh>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.8 * intensity}
        />
      </mesh>
    </group>
  );
}

// Supernova for Breakthrough knowledge
function Supernova({ 
  color, 
  intensity, 
  rayCount, 
  expansionRate,
  pulseSpeed
}: { 
  color: THREE.Color; 
  intensity: number; 
  rayCount: number;
  expansionRate: number;
  pulseSpeed: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const raysRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Points>(null);
  
  // Generate ray directions
  const rays = useMemo(() => {
    const items: { direction: THREE.Vector3; length: number }[] = [];
    
    for (let i = 0; i < rayCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      items.push({
        direction: new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta),
          Math.sin(phi) * Math.sin(theta),
          Math.cos(phi)
        ),
        length: 0.5 + Math.random() * 0.7
      });
    }
    
    return items;
  }, [rayCount]);
  
  // Explosion particles
  const particleGeometry = useMemo(() => {
    const count = 200;
    const positions = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 0.3 + Math.random() * 0.8;
      
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);
  
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    // Animate rays - extending and contracting
    if (raysRef.current) {
      raysRef.current.children.forEach((ray, i) => {
        const pulse = 1 + Math.sin(time * pulseSpeed * 2 + i * 0.5) * 0.3 * expansionRate;
        ray.scale.y = pulse;
      });
    }
    
    // Animate particles - expanding outward
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        let x = positions.getX(i);
        let y = positions.getY(i);
        let z = positions.getZ(i);
        
        // Expand outward
        const expansion = 1 + Math.sin(time * 2 + i * 0.1) * 0.02 * expansionRate;
        positions.setX(i, x * expansion);
        positions.setY(i, y * expansion);
        positions.setZ(i, z * expansion);
        
        // Reset if too far
        const dist = Math.sqrt(x*x + y*y + z*z);
        if (dist > 1.2) {
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          const r = 0.3;
          positions.setX(i, r * Math.sin(phi) * Math.cos(theta));
          positions.setY(i, r * Math.sin(phi) * Math.sin(theta));
          positions.setZ(i, r * Math.cos(phi));
        }
      }
      positions.needsUpdate = true;
    }
    
    // Rotate entire supernova
    if (groupRef.current) {
      groupRef.current.rotation.y = time * 0.2;
    }
  });
  
  return (
    <group ref={groupRef}>
      {/* Central bright core */}
      <mesh>
        <sphereGeometry args={[0.2, 32, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.95 * intensity}
        />
      </mesh>
      
      {/* Glowing halo */}
      <mesh>
        <sphereGeometry args={[0.35, 32, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.4 * intensity}
          side={THREE.BackSide}
        />
      </mesh>
      
      {/* Rays shooting outward */}
      <group ref={raysRef}>
        {rays.map((ray, i) => (
          <mesh
            key={i}
            position={ray.direction.clone().multiplyScalar(0.15)}
            quaternion={new THREE.Quaternion().setFromUnitVectors(
              new THREE.Vector3(0, 1, 0),
              ray.direction
            )}
          >
            <coneGeometry args={[0.03, ray.length, 8]} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={0.7 * intensity}
            />
          </mesh>
        ))}
      </group>
      
      {/* Explosion particles */}
      <points ref={particlesRef} geometry={particleGeometry}>
        <pointsMaterial
          size={0.03}
          color={color}
          transparent
          opacity={0.8 * intensity}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
        />
      </points>
      
      {/* Outer shockwave ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.8, 0.85, 64]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.5 * intensity}
          side={THREE.DoubleSide}
        />
      </mesh>
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

// Single organic lobe/sphere with complexity-driven shape
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
  
  const geometry = useMemo(() => {
    let geo: THREE.BufferGeometry;
    
    switch (baseShape) {
      case 'sphere':
        // Perfect smooth sphere for Simple
        geo = new THREE.SphereGeometry(1, 64, 64);
        break;
        
      case 'regular_crystal':
        // Regular crystal - cube shape for complicated
        geo = new THREE.BoxGeometry(1.6, 1.6, 1.6);
        break;
        
      case 'irregular_crystal':
        // Irregular crystal - deformed platonic solid
        geo = new THREE.DodecahedronGeometry(1, 0);
        break;
        
      case 'chaotic_blob':
        // Chaotic blob - organic deformed sphere base
        geo = new THREE.SphereGeometry(1, 24, 24);
        break;
        
      default:
        geo = new THREE.SphereGeometry(1, 32, 32);
    }
    
    const positions = geo.attributes.position;
    
    // Apply deformation based on complexity type
    if (baseShape === 'irregular_crystal' && deformationIntensity > 0) {
      // Asymmetric deformation for irregular crystals
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        const z = positions.getZ(i);
        
        // Unique deformation per vertex with index-based variation
        const noise1 = Math.sin(x * 4 + index * 1.7) * Math.cos(y * 3.5) * 0.3;
        const noise2 = Math.cos(z * 5 + index * 2.1) * Math.sin(x * 2.8) * 0.25;
        const noise3 = Math.sin(y * 3.2 + z * 4.1 + index) * 0.2;
        
        const deformation = 1 + (noise1 + noise2 + noise3) * deformationIntensity * 0.5;
        
        positions.setXYZ(i, x * deformation, y * deformation, z * deformation);
      }
    } else if (baseShape === 'chaotic_blob') {
      // Chaotic deformation with bulges, indentations, and asymmetry
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        const z = positions.getZ(i);
        
        // Multiple noise frequencies for organic chaos
        const lowFreq = Math.sin(x * 2 + index) * Math.cos(y * 2.3) * Math.sin(z * 1.8) * 0.4;
        const midFreq = Math.sin(x * 5 + y * 4 + index * 0.7) * 0.25;
        const highFreq = Math.sin(x * 10 + z * 8 + index * 1.3) * Math.cos(y * 9) * 0.15;
        
        // Add bulges (positive) and craters (negative)
        const bulgeAngle = Math.atan2(z, x);
        const bulgeMask = Math.sin(bulgeAngle * 3 + index) * 0.3;
        
        let deformation = 1 + (lowFreq + midFreq + highFreq + bulgeMask) * deformationIntensity;
        
        // Add crater-like depressions
        if (hasCraters) {
          const craterNoise = Math.sin(x * 7 + index * 2.5) * Math.sin(y * 7) * Math.sin(z * 7);
          if (craterNoise > 0.5) {
            deformation *= 0.7; // Create indentation
          }
        }
        
        positions.setXYZ(i, x * deformation, y * deformation, z * deformation);
      }
    } else if (baseShape === 'regular_crystal') {
      // Slight uniform variation to keep it clean but not perfect
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        const z = positions.getZ(i);
        
        const subtleNoise = 1 + Math.sin(index * 0.5) * 0.05;
        positions.setXYZ(i, x * subtleNoise, y * subtleNoise, z * subtleNoise);
      }
    }
    
    positions.needsUpdate = true;
    geo.computeVertexNormals();
    
    return geo;
  }, [baseShape, deformationIntensity, index, hasCraters]);
  
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
function CoreSphere({ 
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
  
  // Very low visibility = don't render
  if (coreVisibility < 0.1) return null;
  
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
function StakeholderConnections({
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
function CollisionFragments({
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

export function MetaballBlob({ data, onHover, selectedLobe }: MetaballBlobProps) {
  const groupRef = useRef<THREE.Group>(null);
  const lobeRefs = useRef<(THREE.Mesh | null)[]>([]);
  const lobeVelocitiesRef = useRef<THREE.Vector3[]>([]);
  
  // Base positions calculated from spread and count
  const basePositions = useMemo(() => {
    const positions: [number, number, number][] = [];
    const count = data.lobeCount;
    const spread = data.lobesTouching ? 0.15 : data.lobeSpread; // Very close for unified
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
    
    // Initialize velocities for animated modes
    lobeVelocitiesRef.current = positions.map(() => new THREE.Vector3(
      (Math.random() - 0.5) * 0.01,
      (Math.random() - 0.5) * 0.01,
      (Math.random() - 0.5) * 0.01
    ));
    
    return positions;
  }, [data.lobeCount, data.lobeSpread, data.symmetry, data.lobesTouching]);
  
  const [animatedPositions, setAnimatedPositions] = useState<[number, number, number][]>(basePositions);
  
  // Animate lobe positions based on stakeholder mode
  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.elapsedTime;
    groupRef.current.rotation.y = time * data.rotationSpeed * 0.3;
    
    // Update lobe positions based on movement pattern
    if (data.lobeMovementPattern !== 'static') {
      const newPositions = [...basePositions].map((pos, i): [number, number, number] => {
        const basePos = new THREE.Vector3(...pos);
        
        switch (data.lobeMovementPattern) {
          case 'gentle':
            // Gentle synchronized breathing
            const breathe = Math.sin(time * 0.5 + i * 0.3) * 0.05;
            return [
              basePos.x * (1 + breathe),
              basePos.y * (1 + breathe),
              basePos.z * (1 + breathe)
            ];
            
          case 'diverging':
            // Moving away from center in different directions
            const divergeAmount = Math.sin(time * 0.3 + i * 1.2) * 0.15;
            const direction = basePos.clone().normalize();
            return [
              basePos.x + direction.x * divergeAmount,
              basePos.y + direction.y * divergeAmount * 0.5,
              basePos.z + direction.z * divergeAmount
            ];
            
          case 'chaotic':
            // Chaotic movement with occasional "collision bounces"
            const chaos = 0.08;
            const chaoticOffset = new THREE.Vector3(
              Math.sin(time * 2 + i * 4.1) * chaos + Math.sin(time * 5 + i) * chaos * 0.5,
              Math.cos(time * 1.7 + i * 3.2) * chaos * 0.5,
              Math.sin(time * 2.3 + i * 2.8) * chaos + Math.cos(time * 4 + i * 2) * chaos * 0.5
            );
            return [
              basePos.x + chaoticOffset.x,
              basePos.y + chaoticOffset.y,
              basePos.z + chaoticOffset.z
            ];
            
          default:
            return [basePos.x, basePos.y, basePos.z];
        }
      });
      
      setAnimatedPositions(newPositions);
    }
  });
  
  const lobePositions = data.lobeMovementPattern === 'static' ? basePositions : animatedPositions;
  
  const lobeColors = useMemo(() => {
    return lobePositions.map((_, i) => {
      const colorIndex = i % data.colors.length;
      return data.colors[colorIndex] || data.primaryColor;
    });
  }, [lobePositions, data.colors, data.primaryColor]);
  
  const primaryThreeColor = useMemo(() => new THREE.Color(data.primaryColor), [data.primaryColor]);
  const challengeColor = useMemo(() => new THREE.Color(data.glowColor), [data.glowColor]);
  const knowledgeGlowColor = useMemo(() => new THREE.Color(data.knowledgeGlowColor || data.primaryColor), [data.knowledgeGlowColor, data.primaryColor]);
  
  return (
    <group ref={groupRef} scale={data.resourceScale}>
      
      {/* Outer Aura for Risk */}
      <OuterAura 
        intensity={data.outerAuraIntensity}
        color={data.outerAuraColor}
        pulseSpeed={data.pulseSpeed}
      />
      
      {/* NEW: IDG Outer Manifestation - energy extending beyond the blob */}
      <IDGOuterManifestation
        manifestationType={data.idgOuterManifestation}
        radius={data.idgOuterRadius}
        intensity={data.idgOuterIntensity}
        particleCount={data.idgOuterParticleCount}
        color={data.idgOuterColor}
        animationSpeed={data.idgOuterAnimationSpeed}
        primaryColor={primaryThreeColor}
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
      
      {/* NEW: Knowledge Visualization Shape */}
      <KnowledgeVisualization
        shape={data.knowledgeShape}
        intensity={data.knowledgeShapeIntensity}
        scale={data.knowledgeShapeScale}
        color={data.knowledgeShapeColor}
        supernovaRayCount={data.supernovaRayCount}
        supernovaExpansionRate={data.supernovaExpansionRate}
        pulseSpeed={data.pulseSpeed}
      />
      
      {/* Central glowing core - visibility controlled by development */}
      <CoreSphere 
        color={data.primaryColor}
        transmission={data.transmission}
        pulseSpeed={data.pulseSpeed}
        coreGlow={data.coreGlow}
        coreVisibility={data.coreVisibility}
        scale={data.resourceScale}
        coreShape={data.coreShape}
        coreRings={data.coreRings}
        coreRotationAxes={data.coreRotationAxes}
        coreEmissivePattern={data.coreEmissivePattern}
        coreScale={data.coreScale}
      />
      
      {/* Stakeholder Connections - tubes for cooperative mode */}
      {data.showConnections && (
        <StakeholderConnections
          positions={lobePositions}
          thickness={data.connectionThickness}
          color={primaryThreeColor}
          pulseSpeed={data.pulseSpeed}
        />
      )}
      
      {/* Collision Fragments - particles for adversarial mode */}
      {data.stakeholderMode === 'adversarial' && (
        <CollisionFragments
          positions={lobePositions}
          intensity={data.collisionIntensity}
          color={challengeColor}
          fragmentCount={data.lobeCount}
        />
      )}
      
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
          culturalGlowIntensity={data.culturalGlowIntensity}
          isSelected={selectedLobe === i}
          symmetry={data.symmetry}
          baseShape={data.baseShape}
          crystalFaces={data.crystalFaces}
          deformationIntensity={data.deformationIntensity}
          hasHolesInSurface={data.hasHolesInSurface}
          hasCraters={data.hasCraters}
        />
      ))}
    </group>
  );
}
