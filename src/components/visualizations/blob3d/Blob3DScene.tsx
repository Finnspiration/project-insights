import { Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { MetaballBlob } from './MetaballBlob';
import { Blob3DData } from './blobMapping3D';

interface Blob3DSceneProps {
  data: Blob3DData;
  onHover?: (lobeIndex: number | null) => void;
  selectedLobe?: number | null;
  className?: string;
}

function Lights({ glowColor, glowIntensity }: { glowColor: string; glowIntensity: number }) {
  return (
    <>
      {/* Main ambient light */}
      <ambientLight intensity={0.4} />
      
      {/* Key light - main illumination */}
      <directionalLight
        position={[5, 5, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      
      {/* Fill light - softer shadows */}
      <directionalLight
        position={[-3, 3, -3]}
        intensity={0.6}
        color="#e0e8ff"
      />
      
      {/* Rim light - edge highlights */}
      <directionalLight
        position={[0, -2, 5]}
        intensity={0.4}
        color="#ffffff"
      />
      
      {/* Colored accent light based on risk */}
      <pointLight
        position={[0, 3, 0]}
        intensity={glowIntensity * 2}
        color={glowColor}
        distance={10}
      />
      
      {/* Bottom glow */}
      <pointLight
        position={[0, -3, 0]}
        intensity={0.5}
        color="#4080ff"
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
        camera={{ position: [0, 0, 4], fov: 45 }}
        dpr={[1, 2]}
        gl={{ 
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance'
        }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={<LoadingFallback />}>
          {/* Lighting setup */}
          <Lights glowColor={data.glowColor} glowIntensity={data.glowIntensity} />
          
          {/* Environment map for realistic reflections */}
          <Environment preset="city" />
          
          {/* The main blob */}
          <MetaballBlob 
            data={data} 
            onHover={onHover}
            selectedLobe={selectedLobe}
          />
          
          {/* Contact shadow on floor */}
          <ContactShadows
            position={[0, -1.5, 0]}
            opacity={0.4}
            scale={5}
            blur={2}
            far={4}
            color="#000"
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
