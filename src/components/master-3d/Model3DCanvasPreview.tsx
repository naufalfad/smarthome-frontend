import React, { Suspense, useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Center, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { Box, Sparkles, AlertCircle, RefreshCw, Layers } from 'lucide-react';

interface Model3DCanvasPreviewProps {
  modelUrl?: string | null;
  dimensions?: {
    length: number; // X size in meters
    width: number;  // Y/depth size in meters
    height: number; // Z/height size in meters
  };
  color?: string;
  label?: string;
  placementTarget?: string;
  autoRotate?: boolean;
  className?: string;
  showGrid?: boolean;
}

// Subcomponent to load GLB safely
const GlbModel: React.FC<{ url: string }> = ({ url }) => {
  const { scene } = useGLTF(url);
  const cloned = React.useMemo(() => scene.clone(true), [scene]);

  return (
    <Center top>
      <primitive object={cloned} />
    </Center>
  );
};

// Fallback procedural 3D box with dimension markers
const ProceduralFallbackBox: React.FC<{
  dimensions: { length: number; width: number; height: number };
  color: string;
}> = ({ dimensions, color }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const lx = Math.max(dimensions.length, 0.1);
  const lz = Math.max(dimensions.width, 0.1);
  const ly = Math.max(dimensions.height, 0.05);

  const edgesGeo = React.useMemo(() => {
    const box = new THREE.BoxGeometry(lx, ly, lz);
    return new THREE.EdgesGeometry(box);
  }, [lx, ly, lz]);

  return (
    <Center top>
      <group>
        {/* Main Stylized Box */}
        <mesh ref={meshRef} castShadow receiveShadow>
          <boxGeometry args={[lx, ly, lz]} />
          <meshStandardMaterial
            color={color || '#6366F1'}
            roughness={0.35}
            metalness={0.25}
            polygonOffset
            polygonOffsetFactor={1}
          />
        </mesh>

        {/* Modern High-contrast Wireframe Accents */}
        <lineSegments geometry={edgesGeo}>
          <lineBasicMaterial color="#ffffff" opacity={0.75} transparent linewidth={1.5} />
        </lineSegments>
      </group>
    </Center>
  );
};

// Rotating Stage Rig
const SceneContent: React.FC<{
  modelUrl?: string | null;
  dimensions: { length: number; width: number; height: number };
  color: string;
  autoRotate: boolean;
  hasGlbError: boolean;
  onGlbError: () => void;
}> = ({ modelUrl, dimensions, color, autoRotate, hasGlbError, onGlbError }) => {
  return (
    <group>
      {/* Studio Lighting */}
      <ambientLight intensity={0.8} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0001}
      />
      <directionalLight position={[-5, 3, -5]} intensity={0.4} />
      <pointLight position={[0, -2, 2]} intensity={0.2} />

      {/* Model or Procedural Fallback */}
      {modelUrl && !hasGlbError ? (
        <Suspense
          fallback={
            <ProceduralFallbackBox dimensions={dimensions} color={color} />
          }
        >
          <GlbModel url={modelUrl} />
        </Suspense>
      ) : (
        <ProceduralFallbackBox dimensions={dimensions} color={color} />
      )}

      {/* Realistic Soft Contact Shadow */}
      <ContactShadows
        position={[0, 0, 0]}
        opacity={0.65}
        scale={Math.max(dimensions.length, dimensions.width) * 4 + 2}
        blur={2}
        far={4}
      />
    </group>
  );
};

export const Model3DCanvasPreview: React.FC<Model3DCanvasPreviewProps> = ({
  modelUrl,
  dimensions = { length: 0.6, width: 0.6, height: 0.4 },
  color = '#6366F1',
  label,
  placementTarget = 'FLOOR',
  autoRotate = false,
  className = 'w-full h-48',
  showGrid = true,
}) => {
  const [hasGlbError, setHasGlbError] = useState(false);
  const [isRotating, setIsRotating] = useState(autoRotate);
  const controlsRef = useRef<any>(null);

  const handleResetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  return (
    <div className={`relative rounded-xl overflow-hidden bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 ${className}`}>
      {/* Header Overlay Controls */}
      <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 pointer-events-none">
        <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-slate-300 border border-white/10 flex items-center gap-1">
          <Layers className="w-2.5 h-2.5 text-indigo-400" />
          {modelUrl && !hasGlbError ? 'GLB 3D' : '3D Box'}
        </span>
        {placementTarget && (
          <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700/60">
            {placementTarget}
          </span>
        )}
      </div>

      <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
        <button
          type="button"
          onClick={() => setIsRotating((prev) => !prev)}
          title={isRotating ? 'Hentikan Putaran' : 'Putar Otomatis'}
          className={`p-1 rounded-md text-xs transition-colors backdrop-blur-md border ${
            isRotating
              ? 'bg-indigo-600/80 text-white border-indigo-400/50'
              : 'bg-black/40 text-slate-400 border-white/10 hover:text-white'
          }`}
        >
          <Sparkles className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={handleResetCamera}
          title="Reset Sudut Pandang"
          className="p-1 rounded-md text-xs transition-colors backdrop-blur-md bg-black/40 text-slate-400 border border-white/10 hover:text-white"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>

      {/* Dimension Metrics Overlay Bottom */}
      <div className="absolute bottom-2 left-2 right-2 z-10 flex items-center justify-between text-[10px] font-mono text-slate-400 bg-black/50 backdrop-blur-md px-2 py-1 rounded-lg border border-white/5 pointer-events-none">
        <div className="flex items-center gap-2">
          <span>P: <strong className="text-slate-200">{dimensions.length.toFixed(2)}m</strong></span>
          <span>L: <strong className="text-slate-200">{dimensions.width.toFixed(2)}m</strong></span>
          <span>T: <strong className="text-slate-200">{dimensions.height.toFixed(2)}m</strong></span>
        </div>
        <span className="text-slate-500 text-[9px]">Tarik mouse untuk rotasi 360°</span>
      </div>

      {/* Dynamic Framing Calculation */}
      {(() => {
        const maxDim = Math.max(dimensions.length, dimensions.width, dimensions.height, 0.25);
        const camDist = Math.max(maxDim * 2.1, 1.4);
        const cameraPos: [number, number, number] = [camDist * 0.9, camDist * 0.75, camDist];

        return (
          <Canvas
            shadows
            camera={{ position: cameraPos, fov: 42 }}
            style={{ width: '100%', height: '100%', background: '#090d16' }}
            gl={{ antialias: true, alpha: false, preserveDrawingBuffer: true }}
          >
            <color attach="background" args={['#090d16']} />
            <SceneContent
              modelUrl={modelUrl}
              dimensions={dimensions}
              color={color}
              autoRotate={isRotating}
              hasGlbError={hasGlbError}
              onGlbError={() => setHasGlbError(true)}
            />
            {showGrid && (
              <gridHelper
                args={[Math.max(maxDim * 4, 6), 16, '#374151', '#1f2937']}
                position={[0, -0.001, 0]}
              />
            )}
            <OrbitControls
              ref={controlsRef}
              makeDefault
              autoRotate={isRotating}
              autoRotateSpeed={1.8}
              enablePan={false}
              minDistance={Math.max(maxDim * 0.8, 0.6)}
              maxDistance={Math.max(maxDim * 6, 8)}
              maxPolarAngle={Math.PI / 2 + 0.05}
            />
          </Canvas>
        );
      })()}
    </div>
  );
};
