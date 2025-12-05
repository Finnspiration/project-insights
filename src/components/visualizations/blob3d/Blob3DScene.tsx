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

// Background gradient based on risk level
function BackgroundGradient({ 
  style 
}: { 
  style: 'neutral' | 'warm' | 'danger' | 'critical' 
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const colors = useMemo(() => {
    const styleColors: Record<string, { top: string; bottom: string }> = {
      neutral: { top: '#1a1a2e', bottom: '#16213e' },
      warm: { top: '#2d2416', bottom: '#1a1612' },
      danger: { top: '#2e1a1a', bottom: '#1e1212' },
      critical: { top: '#3d1a1a', bottom: '#2a0f0f' }
    };
    return styleColors[style] || styleColors.neutral;
  }, [style]);
  
  const topColor = useMemo(() => new THREE.Color(colors.top), [colors.top]);
  const bottomColor = useMemo(() => new THREE.Color(colors.bottom), [colors.bottom]);
  
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
          topColor: { value: topColor },
          bottomColor: { value: bottomColor },
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
            vec3 color = mix(bottomColor, topColor, vUv.y);
            gl_FragColor = vec4(color, 1.0);
          }
        `}
      />
    </mesh>
  );
}

// Atmospheric fog/haze effect
function AtmosphericHaze({ 
  color, 
  intensity 
}: { 
  color: string; 
  intensity: number 
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const threeColor = useMemo(() => new THREE.Color(color), [color]);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    meshRef.current.rotation.z = time * 0.05;
    
    const material = meshRef.current.material as THREE.MeshBasicMaterial;
    material.opacity = (0.05 + Math.sin(time * 0.5) * 0.02) * intensity;
  });
  
  if (intensity < 0.2) return null;
  
  return (
    <mesh ref={meshRef} position={[0, 0, -2]}>
      <circleGeometry args={[4, 64]} />
      <meshBasicMaterial
        color={threeColor}
        transparent
        opacity={0.08 * intensity}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

function Lights({ 
  glowColor, 
  glowIntensity,
  coreGlow,
  backgroundStyle
}: { 
  glowColor: string; 
  glowIntensity: number;
  coreGlow: number;
  backgroundStyle: string;
}) {
  // Increase light intensity for darker backgrounds
  const isDark = backgroundStyle !== 'neutral';
  const intensityMultiplier = isDark ? 1.3 : 1.0;
  
  return (
    <>
      {/* Main ambient light */}
      <ambientLight intensity={0.5 * intensityMultiplier} />
      
      {/* Key light */}
      <directionalLight
        position={[5, 5, 5]}
        intensity={1.4 * intensityMultiplier}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      
      {/* Fill light */}
      <directionalLight
        position={[-3, 3, -3]}
        intensity={0.7 * intensityMultiplier}
        color="#e0e8ff"
      />
      
      {/* Rim light */}
      <directionalLight
        position={[0, -2, 5]}
        intensity={0.5 * intensityMultiplier}
        color="#ffffff"
      />
      
      {/* Back light */}
      <directionalLight
        position={[-2, 1, -5]}
        intensity={0.4 * intensityMultiplier}
        color="#8080ff"
      />
      
      {/* Risk glow lights - much stronger now */}
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
        intensity={0.3 * intensityMultiplier}
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
          {/* Dark gradient background based on risk */}
          <BackgroundGradient style={data.backgroundStyle} />
          
          {/* Atmospheric haze for high risk */}
          <AtmosphericHaze 
            color={data.outerAuraColor} 
            intensity={data.outerAuraIntensity} 
          />
          
          {/* Lighting setup */}
          <Lights 
            glowColor={data.glowColor} 
            glowIntensity={data.glowIntensity}
            coreGlow={data.coreGlow}
            backgroundStyle={data.backgroundStyle}
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
