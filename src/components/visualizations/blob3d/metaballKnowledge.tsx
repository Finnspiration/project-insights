// Knowledge-intensity layer: the orbiting shell, its glow and the inner pattern.
// Extracted verbatim from MetaballBlob.tsx, which had grown to 2,944 lines.

import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// NEW: Knowledge Orbit - visible particles orbiting OUTSIDE the blob
export function KnowledgeOrbit({
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
export function KnowledgeGlow({
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

// Inner pattern component based on knowledge type
export function InnerPattern({
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
export function KnowledgeVisualization({
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
