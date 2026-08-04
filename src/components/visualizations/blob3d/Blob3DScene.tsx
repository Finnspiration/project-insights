import { Suspense, useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
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

// The organizational stage used to paint the entire viewport at full
// saturation, which meant one dimension owned roughly half the pixels and the
// blob itself owned about fifteen percent. The stage is still readable here,
// but as a wash the form can sit on top of — the saturated version of the
// colour now rims the body instead (see Lights).
const BACKGROUND_TINT = 0.16;

/** The stage stays legible on a calm project, where risk contributes nothing. */
const HALO_FLOOR = 0.22;

function SceneBackground({ topColor }: { topColor: string }) {
  const { scene } = useThree();
  const color = useMemo(() => {
    const paper = new THREE.Color('#f7f6f2');
    return paper.lerp(new THREE.Color(topColor), BACKGROUND_TINT);
  }, [topColor]);

  useEffect(() => {
    scene.background = color;
  }, [scene, color]);

  return null;
}

// Soft halo behind the form: coloured by the organizational stage,
// sized and strengthened by risk.
/** Soft-edged disc: opaque at the centre, gone by the rim. */
function useRadialFalloff() {
  return useMemo(() => {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.45, 'rgba(255,255,255,0.85)');
    gradient.addColorStop(0.75, 'rgba(255,255,255,0.32)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, []);
}

function AtmosphericHaze({ 
  color, 
  intensity 
}: { 
  color: string; 
  intensity: number 
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const threeColor = useMemo(() => new THREE.Color(color), [color]);
  const falloff = useRadialFalloff();
  
  const forward = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;

    // Billboard: face the camera and sit directly behind the form, whatever
    // angle autoRotate has swung to. As a fixed plane in world space this
    // drifted out of frame and was seen edge-on.
    state.camera.getWorldDirection(forward);
    meshRef.current.position.copy(forward).multiplyScalar(2.2);
    meshRef.current.quaternion.copy(state.camera.quaternion);

    const material = meshRef.current.material as THREE.MeshBasicMaterial;
    // Risk pulses the halo above its floor.
    material.opacity = HALO_FLOOR + (0.26 + Math.sin(time * 0.5) * 0.05) * intensity;
  });
  
  return (
    <group>
      {/* Sized in apparent terms, not world units: the halo sits 2.2 further
          from the camera than the form, so radius 2.3 reads as a disc about a
          fifth wider than the body. Radius 5 was a background; 1.8 would have
          been hidden behind the body exactly. */}
      <mesh ref={meshRef}>
        <circleGeometry args={[2.3, 64]} />
        <meshBasicMaterial
          color={threeColor}
          alphaMap={falloff}
          transparent
          depthWrite={false}
          opacity={HALO_FLOOR + 0.3 * intensity}
        />
      </mesh>
    </group>
  );
}

function Lights({ 
  glowColor, 
  glowIntensity,
  coreGlow,
  organizationalColor
}: { 
  organizationalColor: string;
  glowColor: string; 
  glowIntensity: number;
  coreGlow: number;
}) {
  return (
    <>
      {/* The rig delivered ~5.45 units of irradiance at the origin, against a
          body that also mirrors an Environment("city") sky. Everything below
          is roughly 40% of what it was; the environment map now carries more
          of the fill, which is what it is for. */}
      
      {/* Base white ambient for visibility */}
      <ambientLight intensity={0.28} />
      
      {/* Key light */}
      <directionalLight
        position={[5, 5, 5]}
        intensity={0.85}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      
      {/* Fill light */}
      <directionalLight
        position={[-3, 3, -3]}
        intensity={0.42}
        color="#e0e8ff"
      />
      
      {/* Rim light — carries the organizational stage now that the background
          no longer shouts it, and outlining the silhouette is exactly what a
          portrait needs. */}
      <directionalLight
        position={[0, -2, 5]}
        intensity={0.32}
        color="#ffffff"
      />

      {/* Back rim in the stage colour */}
      <directionalLight
        position={[-2, 1, -5]}
        intensity={0.65}
        color={organizationalColor}
      />
      
      {/* Risk glow lights */}
      <pointLight
        position={[0, 3, 0]}
        intensity={glowIntensity * 2.2}
        color={glowColor}
        distance={15}
      />
      
      <pointLight
        position={[3, 0, 0]}
        intensity={glowIntensity * 1.1}
        color={glowColor}
        distance={10}
      />
      <pointLight
        position={[-3, 0, 0]}
        intensity={glowIntensity * 1.1}
        color={glowColor}
        distance={10}
      />
      <pointLight
        position={[0, 0, 3]}
        intensity={glowIntensity * 0.9}
        color={glowColor}
        distance={10}
      />
      
      {/* Bottom glow */}
      <pointLight
        position={[0, -3, 0]}
        intensity={0.2 + coreGlow * 0.3}
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
        camera={{ position: [0, 0.95, 3.85], fov: 45 }}
        dpr={[1, 2]}
        gl={{ 
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance'
        }}
      >
        <Suspense fallback={<LoadingFallback />}>
          {/* Full viewport background - organizational stage color */}
          <SceneBackground topColor={data.backgroundColors.top} />
          
          {/* Atmospheric haze for high risk (separate from background) */}
          <AtmosphericHaze 
            color={data.backgroundColors.top} 
            intensity={data.outerAuraIntensity} 
          />
          
          {/* Lighting setup - neutral (organizational only affects background) */}
          <Lights 
            glowColor={data.glowColor} 
            glowIntensity={data.glowIntensity}
            coreGlow={data.coreGlow}
            organizationalColor={data.backgroundColors.top}
        />
          
          {/* Environment for reflections - background disabled to show organizational color */}
          <Environment preset="city" background={false} />
          
          {/* The main blob */}
          <MetaballBlob 
            data={data} 
            onHover={onHover}
            selectedLobe={selectedLobe}
          />
          
          {/* Camera controls */}
          <OrbitControls
            target={[0, 0, 0]}
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
