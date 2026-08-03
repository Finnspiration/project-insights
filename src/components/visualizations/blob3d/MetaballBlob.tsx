import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Blob3DData } from './blobMapping3D';
import { ChallengeNoise, Holes, Spikes, WireframeOverlay } from './metaballSurface';
import { InnerPattern, KnowledgeGlow, KnowledgeOrbit, KnowledgeVisualization } from './metaballKnowledge';
import { RiskRing } from './metaballRisk';
import { IDGOuterManifestation } from './metaballIdg';
import { CollisionFragments, CoreSphere, Lobe, StakeholderConnections } from './metaballBody';

interface MetaballBlobProps {
  data: Blob3DData;
  onHover?: (lobeIndex: number | null) => void;
  selectedLobe?: number | null;
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
      
      {/* Risk Ring indicator */}
      <RiskRing 
        riskLevel={data.riskLevel}
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
