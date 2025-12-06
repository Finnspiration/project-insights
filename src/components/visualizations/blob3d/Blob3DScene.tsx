import { Suspense, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { MetaballBlob } from './MetaballBlob';
import { Blob3DData } from './blobMapping3D';

interface Blob3DSceneProps {
  data: Blob3DData;
  onHover?: (lobeIndex: number | null) => void;
  selectedLobe?: number | null;
  className?: string;
}

// Background gradient based on organizational stage (Laloux colors)
function BackgroundGradient({ 
  topColor,
  bottomColor
}: { 
  topColor: string;
  bottomColor: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const top = useMemo(() => new THREE.Color(topColor), [topColor]);
  const bottom = useMemo(() => new THREE.Color(bottomColor), [bottomColor]);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    // Subtle breathing animation for background
    const time = state.clock.elapsedTime;
    const scale = 1 + Math.sin(time * 0.3) * 0.02;
    meshRef.current.scale.setScalar(scale);
  });
  
  return (
    <mesh ref={meshRef} position={[0, 0, -5]}>
      <planeGeometry args={[20, 20]} />
      <shaderMaterial
        uniforms={{
          topColor: { value: top },
          bottomColor: { value: bottom },
        }}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform vec3 topColor;
          uniform vec3 bottomColor;
          varying vec2 vUv;
          void main() {
            // Add vignette effect for better contrast
            vec2 center = vUv - 0.5;
            float vignette = 1.0 - dot(center, center) * 0.8;
            vec3 color = mix(bottomColor, topColor, vUv.y);
            color *= vignette;
            gl_FragColor = vec4(color, 1.0);
          }
        `}
      />
    </mesh>
  );
}

// Atmospheric fog/haze effect - ENHANCED for risk visibility
function AtmosphericHaze({ 
  color, 
  intensity 
}: { 
  color: string; 
  intensity: number 
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const threeColor = useMemo(() => new THREE.Color(color), [color]);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    meshRef.current.rotation.z = time * 0.05;
    
    const material = meshRef.current.material as THREE.MeshBasicMaterial;
    // Much higher opacity for visibility
    material.opacity = (0.15 + Math.sin(time * 0.5) * 0.08) * intensity;
    
    // Animate warning ring
    if (ringRef.current) {
      const ringMaterial = ringRef.current.material as THREE.MeshBasicMaterial;
      const pulse = Math.sin(time * 3) * 0.5 + 0.5;
      ringMaterial.opacity = pulse * intensity * 0.6;
      ringRef.current.scale.setScalar(1.8 + pulse * 0.3);
    }
  });
  
  // Lower threshold - show even at low risk
  if (intensity < 0.1) return null;
  
  return (
    <group>
      {/* Main haze circle */}
      <mesh ref={meshRef} position={[0, 0, -2]}>
        <circleGeometry args={[5, 64]} />
        <meshBasicMaterial
          color={threeColor}
          transparent
          opacity={0.2 * intensity}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Pulsing warning ring for high risk */}
      {intensity > 0.4 && (
        <mesh ref={ringRef} position={[0, 0, -1]}>
          <ringGeometry args={[1.6, 2.0, 64]} />
          <meshBasicMaterial
            color={threeColor}
            transparent
            opacity={0.3 * intensity}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}

function Lights({ 
  glowColor, 
  glowIntensity,
  coreGlow
}: { 
  glowColor: string; 
  glowIntensity: number;
  coreGlow: number;
}) {
  return (
    <>
      {/* NEUTRAL ambient light - organizational stage only affects background now */}
      
      {/* Base white ambient for visibility */}
      <ambientLight intensity={0.35} />
      
      {/* Key light */}
      <directionalLight
        position={[5, 5, 5]}
        intensity={1.4}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      
      {/* Fill light */}
      <directionalLight
        position={[-3, 3, -3]}
        intensity={0.7}
        color="#e0e8ff"
      />
      
      {/* Rim light */}
      <directionalLight
        position={[0, -2, 5]}
        intensity={0.5}
        color="#ffffff"
      />
      
      {/* Back light */}
      <directionalLight
        position={[-2, 1, -5]}
        intensity={0.4}
        color="#8080ff"
      />
      
      {/* Risk glow lights */}
      <pointLight
        position={[0, 3, 0]}
        intensity={glowIntensity * 5}
        color={glowColor}
        distance={15}
      />
      
      <pointLight
        position={[3, 0, 0]}
        intensity={glowIntensity * 2.5}
        color={glowColor}
        distance={10}
      />
      <pointLight
        position={[-3, 0, 0]}
        intensity={glowIntensity * 2.5}
        color={glowColor}
        distance={10}
      />
      <pointLight
        position={[0, 0, 3]}
        intensity={glowIntensity * 2}
        color={glowColor}
        distance={10}
      />
      
      {/* Bottom glow */}
      <pointLight
        position={[0, -3, 0]}
        intensity={0.4 + coreGlow * 0.6}
        color="#4080ff"
        distance={10}
      />
      
      {/* Front fill */}
      <pointLight
        position={[0, 0, 4]}
        intensity={0.3}
        color="#ffffff"
        distance={8}
      />
    </>
  );
}

function LoadingFallback() {
  return (
    <mesh>
      <sphereGeometry args={[0.5, 32, 32]} />
      <meshStandardMaterial color="#666" wireframe />
    </mesh>
  );
}

export function Blob3DScene({ data, onHover, selectedLobe, className }: Blob3DSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  return (
    <div className={`w-full h-full min-h-[400px] ${className || ''}`}>
      <Canvas
        ref={canvasRef}
        camera={{ position: [0, 0, 4.5], fov: 45 }}
        dpr={[1, 2]}
        gl={{ 
          antialias: true,
          alpha: false, // No alpha for dark backgrounds
          powerPreference: 'high-performance'
        }}
      >
        <Suspense fallback={<LoadingFallback />}>
          {/* Gradient background based on organizational stage */}
          <BackgroundGradient 
            topColor={data.backgroundColors.top}
            bottomColor={data.backgroundColors.bottom}
          />
          
          {/* Atmospheric haze for high risk (separate from background) */}
          <AtmosphericHaze 
            color={data.outerAuraColor} 
            intensity={data.outerAuraIntensity} 
          />
          
          {/* Lighting setup - neutral (organizational only affects background) */}
          <Lights 
            glowColor={data.glowColor} 
            glowIntensity={data.glowIntensity}
            coreGlow={data.coreGlow}
          />
          
          {/* Environment map for reflections */}
          <Environment preset="city" />
          
          {/* The main blob */}
          <MetaballBlob 
            data={data} 
            onHover={onHover}
            selectedLobe={selectedLobe}
          />
          
          {/* Camera controls */}
          <OrbitControls
            enablePan={false}
            enableZoom={true}
            minDistance={2.5}
            maxDistance={8}
            autoRotate
            autoRotateSpeed={0.5}
            dampingFactor={0.1}
            enableDamping
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
