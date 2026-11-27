import React, { Suspense, useRef, useState, useEffect, useMemo, Component, ErrorInfo, ReactNode } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import {
  Box,
  Layers,
  Sparkles,
  Maximize2,
  Minimize2,
  RotateCcw,
  RotateCw,
  Lightbulb,
  Tag,
  Eye,
  Sliders,
  CheckCircle2,
  Lock,
  Unlock,
  Wind,
  Shield,
  Zap,
  Activity,
  ChevronRight,
  Info,
  X,
  MapPin,
  Video,
  Thermometer,
  Flame,
  Power,
  Radio,
} from 'lucide-react';
import { FloorPlan, FloorPlanObject, Room } from '../../types/floor-plan';
import { IoTDevice } from '../../types/device';
import { DashboardRoom } from '../../types/dashboard';
import { catalog3dApi } from '../../services/catalog-3d.api';
import { getPolygonVisualCenter } from '../../utils/polygon-label';

// ============================================================================
// TYPES & PROPS
// ============================================================================

export type CameraPreset = 'ISO' | 'TOP' | 'FRONT' | 'RESET';
export type WallMode = 'cutaway' | 'full';

export interface ProceduralDollhouseViewerProps {
  floorPlan?: FloorPlan | null;
  rooms: (DashboardRoom | Room)[];
  devices: IoTDevice[];
  furniture?: FloorPlanObject[];
  selectedDeviceId?: string | null;
  selectedRoomId?: string | null;
  onSelectDevice?: (dev: IoTDevice | null) => void;
  onOpenDeviceControl?: (dev: IoTDevice) => void;
  onUpdateDevice?: (id: string, updates: Partial<IoTDevice>) => Promise<void> | void;
  onSelectRoom?: (roomId: string | null) => void;
  className?: string;
  defaultWallMode?: WallMode;
  floors?: { id: string; name: string; levelNumber: number }[];
  activeFloorId?: string;
  onSelectFloor?: (floorId: string) => void;
  showDevicePins?: boolean;
}

// Error Boundary for safe 3D Model GLB rendering
class GlbErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { hasError: boolean }> {
  constructor(props: { fallback: ReactNode; children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('GlbErrorBoundary caught error loading 3D asset:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

// ============================================================================
// CAMERA RIG COMPONENT - ROCK SOLID STABILITY & SMOOTH DEVICE ZOOM-IN
// ============================================================================

interface CameraRigProps {
  cameraPreset: CameraPreset;
  presetTrigger: number;
  boundsSize: number;
  focusedDevicePos?: { x: number; y: number; z: number } | null;
  focusTrigger: number;
}

const CameraRig: React.FC<CameraRigProps> = ({
  cameraPreset,
  presetTrigger,
  boundsSize,
  focusedDevicePos,
  focusTrigger,
}) => {
  const { camera, gl } = useThree();
  const controlsRef = useRef<any>(null);
  const isFirstMountRef = useRef<boolean>(true);
  const lastTriggerRef = useRef<number>(0);
  const lastFocusTriggerRef = useRef<number>(0);
  const isTransitioningRef = useRef<boolean>(false);
  const targetCamPosRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const targetLookAtRef = useRef<THREE.Vector3>(new THREE.Vector3());

  const applyCameraPreset = (preset: CameraPreset) => {
    isTransitioningRef.current = false;
    const maxDim = Math.max(boundsSize, 10);
    const targetPos = new THREE.Vector3();

    switch (preset) {
      case 'TOP':
        // Top-down architectural cutaway plan
        targetPos.set(0, maxDim * 1.85, 0.001);
        break;
      case 'FRONT':
        // Front elevation angle
        targetPos.set(0, maxDim * 0.45, maxDim * 1.6);
        break;
      case 'ISO':
      case 'RESET':
      default:
        // Classical 3D dollhouse isometric angle
        targetPos.set(
          maxDim * 1.05,
          maxDim * 1.15,
          maxDim * 1.05
        );
        break;
    }

    camera.position.copy(targetPos);
    camera.lookAt(0, 0.5, 0);

    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0.5, 0);
      controlsRef.current.update();
    }
  };

  // ONLY execute when mounted initially or when presetTrigger explicitly changes via button click.
  useEffect(() => {
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      lastTriggerRef.current = presetTrigger;
      applyCameraPreset(cameraPreset);
      return;
    }

    if (lastTriggerRef.current !== presetTrigger) {
      lastTriggerRef.current = presetTrigger;
      applyCameraPreset(cameraPreset);
    }
  }, [presetTrigger]);

  // Smooth Zoom-In / Focus on 3D Device ONLY when focusTrigger increments explicitly on device click
  useEffect(() => {
    if (focusTrigger > 0 && focusTrigger !== lastFocusTriggerRef.current && focusedDevicePos) {
      lastFocusTriggerRef.current = focusTrigger;
      targetLookAtRef.current.set(focusedDevicePos.x, focusedDevicePos.y, focusedDevicePos.z);
      // Approach device from an optimal 45-degree angle ~3.2m away
      targetCamPosRef.current.set(
        focusedDevicePos.x + 2.2,
        focusedDevicePos.y + 1.8,
        focusedDevicePos.z + 2.2
      );
      isTransitioningRef.current = true;
    }
  }, [focusTrigger, focusedDevicePos]);

  // OrbitControls manual interaction listener: immediately yield 100% control to user on wheel or drag
  useEffect(() => {
    const ctrl = controlsRef.current;
    const dom = gl.domElement;
    const stopTransition = () => {
      isTransitioningRef.current = false;
    };

    if (ctrl) {
      ctrl.addEventListener('start', stopTransition);
    }
    if (dom) {
      dom.addEventListener('wheel', stopTransition, { passive: true });
      dom.addEventListener('pointerdown', stopTransition, { passive: true });
    }

    return () => {
      if (ctrl) ctrl.removeEventListener('start', stopTransition);
      if (dom) {
        dom.removeEventListener('wheel', stopTransition);
        dom.removeEventListener('pointerdown', stopTransition);
      }
    };
  }, [gl]);

  // Frame-by-frame smooth cinematic lerp towards focused device
  useFrame((_, delta) => {
    if (isTransitioningRef.current && controlsRef.current) {
      const step = Math.min(1, delta * 5.0);
      camera.position.lerp(targetCamPosRef.current, step);
      controlsRef.current.target.lerp(targetLookAtRef.current, step);
      controlsRef.current.update();

      if (
        camera.position.distanceTo(targetCamPosRef.current) < 0.04 &&
        controlsRef.current.target.distanceTo(targetLookAtRef.current) < 0.04
      ) {
        camera.position.copy(targetCamPosRef.current);
        controlsRef.current.target.copy(targetLookAtRef.current);
        controlsRef.current.update();
        isTransitioningRef.current = false;
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.06}
      minDistance={0.5}
      maxDistance={250}
      maxPolarAngle={Math.PI / 2 + 0.04}
    />
  );
};

// ============================================================================
// GLB MODEL SAFE LOADER & NORMALIZER
// ============================================================================

interface GlbRendererProps {
  url: string;
  fallback: ReactNode;
  targetWidth?: number;
  targetHeight?: number;
  targetDepth?: number;
}

const GlbRenderer: React.FC<GlbRendererProps> = ({
  url,
  fallback,
  targetWidth,
  targetHeight,
  targetDepth,
}) => {
  return (
    <GlbErrorBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <GlbPrimitive
          url={url}
          targetWidth={targetWidth}
          targetHeight={targetHeight}
          targetDepth={targetDepth}
        />
      </Suspense>
    </GlbErrorBoundary>
  );
};

const GlbPrimitive: React.FC<{
  url: string;
  targetWidth?: number;
  targetHeight?: number;
  targetDepth?: number;
}> = ({ url, targetWidth, targetHeight, targetDepth }) => {
  const { scene } = useGLTF(url);
  const cloned = useMemo(() => {
    const clone = scene.clone(true);
    // Auto-center and normalize bounding box
    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    // Center on floor (y=0 bottom, x & z centered)
    clone.position.x -= center.x;
    clone.position.y -= box.min.y;
    clone.position.z -= center.z;

    // Scale to match target dimensions if supplied
    if (targetWidth && targetDepth && size.x > 0 && size.z > 0) {
      const scaleX = targetWidth / size.x;
      const scaleZ = targetDepth / size.z;
      const scaleY = targetHeight && size.y > 0 ? targetHeight / size.y : Math.min(scaleX, scaleZ);
      clone.scale.set(scaleX, scaleY, scaleZ);
    }
    return clone;
  }, [scene, targetWidth, targetHeight, targetDepth]);

  return <primitive object={cloned} />;
};

// ============================================================================
// PROCEDURAL FURNITURE MESH COMPONENT (ACCURATE 2D <-> 3D ALIGNMENT)
// ============================================================================

interface FurnitureMeshProps {
  object: FloorPlanObject;
  to3DX: (x: number) => number;
  to3DZ: (y: number) => number;
  scale: number;
}

const FurnitureMesh: React.FC<FurnitureMeshProps> = ({ object, to3DX, to3DZ, scale }) => {
  const [hovered, setHovered] = useState<boolean>(false);

  // In 2D SVG, object.x and object.y represent the TOP-LEFT corner of the bounding box.
  // In Three.js, box geometries and 3D models are CENTER-PIVOTED at (0, 0, 0).
  // Therefore, the 3D position MUST be the center of the 2D object to match coordinates 100%!
  const objW = object.width || 80;
  const objH = object.height || 80;
  const centerX = (object.x || 0) + objW / 2;
  const centerY = (object.y || 0) + objH / 2;

  const posX = to3DX(centerX);
  const posZ = to3DZ(centerY);

  const w = Math.max(0.3, objW / scale);
  const d = Math.max(0.3, objH / scale);

  const catObj = object.catalogObject;
  const h = catObj?.dimensionHeight || (object.category?.includes('BED') ? 0.55 : object.category?.includes('TABLE') ? 0.75 : 0.65);
  const elevation = catObj?.defaultElevation || (catObj?.placementTarget === 'WALL' ? 1.0 : 0);
  const rotY = -((object.rotation || 0) * Math.PI) / 180;

  const color = useMemo(() => {
    const c = (object.category || '').toUpperCase();
    if (c.includes('BED')) return '#94A3B8';
    if (c.includes('LIVING') || c.includes('SOFA')) return '#64748B';
    if (c.includes('KITCHEN')) return '#CBD5E1';
    if (c.includes('BATH')) return '#E2E8F0';
    return '#D4A373'; // Warm architectural wood
  }, [object.category]);

  const fallbackBox = (
    <group position={[0, h / 2, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial
          color={color}
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>
      {/* Subtle top trim accent */}
      <mesh position={[0, h / 2 + 0.005, 0]}>
        <boxGeometry args={[w * 0.96, 0.01, d * 0.96]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.2} metalness={0.1} />
      </mesh>
    </group>
  );

  return (
    <group
      position={[posX, elevation, posZ]}
      rotation={[0, rotY, 0]}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
      }}
    >
      {catObj?.modelGlbPath ? (
        <GlbRenderer
          url={catalog3dApi.getObject3dModelUrl(catObj.id)}
          fallback={fallbackBox}
          targetWidth={w}
          targetHeight={h}
          targetDepth={d}
        />
      ) : (
        fallbackBox
      )}

      {/* Floating mini info on hover */}
      {hovered && (
        <Html position={[0, h + 0.35, 0]} center distanceFactor={14} style={{ pointerEvents: 'none' }}>
          <div className="px-2 py-1 rounded-lg bg-slate-900/90 text-white text-[10px] font-bold shadow-md whitespace-nowrap border border-slate-700 animate-in fade-in zoom-in-95 pointer-events-none">
            {object.name}
          </div>
        </Html>
      )}
    </group>
  );
};

// ============================================================================
// PROCEDURAL IOT DEVICE MESH & 3D FLOATING PIN COMPONENT
// ============================================================================

interface DeviceMeshProps {
  device: IoTDevice;
  to3DX: (x: number) => number;
  to3DZ: (y: number) => number;
  viewBoxWidth: number;
  viewBoxHeight: number;
  wallHeight: number;
  isSelected: boolean;
  enableDynamicLights: boolean;
  showDevicePins: boolean;
  onSelect: (dev: IoTDevice) => void;
}

const DeviceMesh: React.FC<DeviceMeshProps> = ({
  device,
  to3DX,
  to3DZ,
  viewBoxWidth,
  viewBoxHeight,
  wallHeight,
  isSelected,
  enableDynamicLights,
  showDevicePins,
  onSelect,
}) => {
  const [hovered, setHovered] = useState<boolean>(false);

  // Determine SVG coordinate
  const px = device.x ?? (device.normalizedX !== undefined ? device.normalizedX * viewBoxWidth : viewBoxWidth / 2);
  const py = device.y ?? (device.normalizedY !== undefined ? device.normalizedY * viewBoxHeight : viewBoxHeight / 2);

  const posX = to3DX(px);
  const posZ = to3DZ(py);

  // Elevation based on functional type & catalog target
  const catItem = device.catalogItem;
  const t = (device.type || '').toUpperCase();
  const isLight = t.includes('LIGHT') || t.includes('DIMMER');
  const isAc = t.includes('AC') || t.includes('THERMOSTAT');
  const isLock = t.includes('LOCK');
  const isCamera = t.includes('CAMERA') || t.includes('CCTV');

  const posY = useMemo(() => {
    const cfgElevation = (device.configuration as any)?.elevation;
    if (cfgElevation !== undefined && typeof cfgElevation === 'number') {
      return Math.min(cfgElevation, wallHeight - 0.05);
    }
    if (catItem?.defaultElevation !== undefined) {
      return Math.min(catItem.defaultElevation, wallHeight - 0.05);
    }
    if (isLight) return wallHeight - 0.05;
    if (isAc) return Math.min(2.1, wallHeight * 0.85);
    if (isLock) return Math.min(1.0, wallHeight * 0.7);
    if (isCamera) return wallHeight - 0.15;
    return Math.min(1.1, wallHeight * 0.75);
  }, [device.configuration, catItem, isLight, isAc, isLock, isCamera, wallHeight]);

  const cfg = (device.configuration as Record<string, any>) || {};
  const isPoweredOn = device.status === 'ON' || cfg.power === true;
  const isLocked = isLock && cfg.lockState !== 'UNLOCKED' && device.status !== 'UNLOCKED';

  // Device Icon Resolver for the 3D Floating Pin
  const getDeviceIcon = () => {
    if (isLight) return <Lightbulb className="w-4 h-4" />;
    if (isAc) return <Wind className="w-4 h-4" />;
    if (isLock) return isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />;
    if (isCamera) return <Video className="w-4 h-4" />;
    if (t.includes('TEMP') || t.includes('HUMID')) return <Thermometer className="w-4 h-4" />;
    if (t.includes('MOTION') || t.includes('PIR')) return <Activity className="w-4 h-4" />;
    if (t.includes('SMOKE') || t.includes('FIRE') || t.includes('GAS')) return <Flame className="w-4 h-4" />;
    return <Power className="w-4 h-4" />;
  };

  // Enlarged Architectural 3D Procedural Meshes (2.2x to 2.5x standard scale for strong presence)
  const renderDeviceProceduralMesh = () => {
    if (isLight) {
      return (
        <group>
          {/* Ceiling mount fixture rosette - Architectural Scale */}
          <mesh position={[0, 0.05, 0]}>
            <cylinderGeometry args={[0.28, 0.35, 0.09, 24]} />
            <meshStandardMaterial color="#334155" roughness={0.3} metalness={0.7} />
          </mesh>

          {/* Chrome Trim Ring */}
          <mesh position={[0, 0.01, 0]}>
            <cylinderGeometry args={[0.29, 0.29, 0.02, 24]} />
            <meshStandardMaterial color="#94A3B8" roughness={0.2} metalness={0.9} />
          </mesh>

          {/* Glowing or Dim Light Bulb Diffuser */}
          <mesh position={[0, -0.09, 0]}>
            <sphereGeometry args={[0.2, 24, 24]} />
            <meshStandardMaterial
              color={isPoweredOn ? '#FEF08A' : '#64748B'}
              emissive={isPoweredOn ? '#FEF08A' : '#000000'}
              emissiveIntensity={isPoweredOn ? 2.8 : 0}
              roughness={isPoweredOn ? 0.1 : 0.6}
            />
          </mesh>

          {/* Warm Floor Illumination Pool when Light is ON */}
          {isPoweredOn && (
            <mesh position={[0, -posY + 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.2, 1.8, 32]} />
              <meshBasicMaterial color="#FEF08A" transparent opacity={0.35} side={THREE.DoubleSide} />
            </mesh>
          )}

          {/* REAL 3D POINT LIGHT: Illuminates room floor and walls when ON */}
          {isPoweredOn && enableDynamicLights && (
            <pointLight
              position={[0, -0.25, 0]}
              intensity={2.8}
              distance={10}
              color="#FDE047"
              decay={2}
            />
          )}
        </group>
      );
    }

    if (isAc) {
      return (
        <group>
          {/* AC Wall unit body - Architectural Scale */}
          <mesh position={[0, 0, 0]} castShadow>
            <boxGeometry args={[1.2, 0.38, 0.28]} />
            <meshStandardMaterial color="#F8FAFC" roughness={0.3} metalness={0.15} />
          </mesh>
          {/* Active Cooling Vent & Status LED */}
          <mesh position={[0, -0.13, 0.142]}>
            <boxGeometry args={[1.05, 0.04, 0.01]} />
            <meshStandardMaterial
              color={isPoweredOn ? '#38BDF8' : '#94A3B8'}
              emissive={isPoweredOn ? '#38BDF8' : '#000000'}
              emissiveIntensity={isPoweredOn ? 2.5 : 0}
            />
          </mesh>
          {/* Temperature LED Screen on Unit */}
          <mesh position={[0.35, 0.05, 0.142]}>
            <boxGeometry args={[0.18, 0.08, 0.01]} />
            <meshStandardMaterial
              color={isPoweredOn ? '#0284C7' : '#334155'}
              emissive={isPoweredOn ? '#38BDF8' : '#000000'}
              emissiveIntensity={isPoweredOn ? 2.0 : 0}
            />
          </mesh>
          {/* Subtle cooling floor aura when AC is active */}
          {isPoweredOn && (
            <mesh position={[0, -posY + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.6, 1.8, 32]} />
              <meshBasicMaterial color="#38BDF8" transparent opacity={0.25} side={THREE.DoubleSide} />
            </mesh>
          )}
        </group>
      );
    }

    if (isLock) {
      const lockColor = isLocked ? '#EF4444' : '#10B981';
      return (
        <group>
          {/* Smart Lock Escutcheon Plate - Architectural Scale */}
          <mesh position={[0, 0, 0]} castShadow>
            <boxGeometry args={[0.22, 0.54, 0.09]} />
            <meshStandardMaterial color="#0F172A" roughness={0.2} metalness={0.85} />
          </mesh>
          {/* Touch Keypad Glass Plate */}
          <mesh position={[0, 0.12, 0.048]}>
            <boxGeometry args={[0.16, 0.22, 0.01]} />
            <meshStandardMaterial color="#020617" roughness={0.1} metalness={0.9} />
          </mesh>
          {/* Keyless Handle */}
          <mesh position={[0.1, -0.1, 0.065]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.026, 0.026, 0.26, 16]} />
            <meshStandardMaterial color="#64748B" roughness={0.2} metalness={0.9} />
          </mesh>
          {/* Smart Lock Status LED Indicator Ring */}
          <mesh position={[0, 0.12, 0.056]}>
            <ringGeometry args={[0.04, 0.068, 24]} />
            <meshStandardMaterial
              color={lockColor}
              emissive={lockColor}
              emissiveIntensity={2.8}
              roughness={0.1}
            />
          </mesh>
        </group>
      );
    }

    if (isCamera) {
      return (
        <group>
          {/* Security Camera Mount - Architectural Scale */}
          <mesh position={[0, 0.06, 0]}>
            <cylinderGeometry args={[0.16, 0.22, 0.07, 20]} />
            <meshStandardMaterial color="#0F172A" roughness={0.4} />
          </mesh>
          {/* Eyeball Dome Housing */}
          <mesh position={[0, -0.05, 0.05]}>
            <sphereGeometry args={[0.16, 20, 20]} />
            <meshStandardMaterial color="#1E293B" roughness={0.3} metalness={0.4} />
          </mesh>
          {/* Lens Barrel Ring */}
          <mesh position={[0, -0.05, 0.19]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.065, 0.065, 0.03, 16]} />
            <meshStandardMaterial color="#000000" roughness={0.1} metalness={0.95} />
          </mesh>
          {/* Lens Glass */}
          <mesh position={[0, -0.05, 0.206]}>
            <circleGeometry args={[0.045, 16]} />
            <meshStandardMaterial color="#0284C7" roughness={0.1} metalness={0.8} />
          </mesh>
          {/* Active Telemetry Red Dot */}
          <mesh position={[0.06, 0.04, 0.17]}>
            <sphereGeometry args={[0.018, 12, 12]} />
            <meshStandardMaterial color="#EF4444" emissive="#EF4444" emissiveIntensity={3} />
          </mesh>
        </group>
      );
    }

    // Default Smart Sensor / Switch Pod - Architectural Scale
    return (
      <group>
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[0.26, 0.26, 0.07]} />
          <meshStandardMaterial color="#F1F5F9" roughness={0.3} metalness={0.1} />
        </mesh>
        <mesh position={[0, 0.06, 0.038]}>
          <circleGeometry args={[0.032, 16]} />
          <meshStandardMaterial
            color={device.status === 'ONLINE' ? '#10B981' : '#64748B'}
            emissive={device.status === 'ONLINE' ? '#10B981' : '#000000'}
            emissiveIntensity={2.0}
          />
        </mesh>
      </group>
    );
  };

  return (
    <group
      position={[posX, posY, posZ]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(device);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
        document.body.style.cursor = 'default';
      }}
    >
      {/* 1. Base Ground Spatial Anchor Ring right on floor level */}
      <mesh position={[0, -posY + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.25, 0.42, 32]} />
        <meshBasicMaterial
          color={isPoweredOn ? '#F59E0B' : '#64748B'}
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 2. 3D GLB Model if available, or Enlarged Procedural Mesh with Orientation Rotation */}
      <group rotation={[0, -((device.rotation || 0) * Math.PI) / 180, 0]}>
        {catItem?.modelGlbPath ? (
          <GlbRenderer
            url={catalog3dApi.getDevice3dModelUrl(catItem.id)}
            fallback={renderDeviceProceduralMesh()}
          />
        ) : (
          renderDeviceProceduralMesh()
        )}
      </group>

      {/* 3. Pulsing Selection / Hover Beacon Ring on Floor */}
      {(isSelected || hovered) && (
        <mesh position={[0, -posY + 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.45, 0.7, 32]} />
          <meshBasicMaterial
            color={isSelected ? '#F59E0B' : '#8B5CF6'}
            transparent
            opacity={0.8}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* 4. ALWAYS-VISIBLE 3D SPATIAL SCREEN-SPACE PIN (Fixed Size - Never Shrunk by Distance) */}
      {showDevicePins && (
        <Html
          position={[0, 0.55, 0]}
          center
          zIndexRange={[100, 0]}
          className="pointer-events-auto select-none"
        >
          <div
            onClick={(e) => {
              e.stopPropagation();
              onSelect(device);
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className={`group flex flex-col items-center cursor-pointer transition-all duration-200 ${
              isSelected ? 'scale-125 z-50' : hovered ? 'scale-115 z-40' : 'hover:scale-110'
            }`}
            title={`${device.name} (${device.status}) - Klik untuk Zoom In`}
          >
            {/* Circular Pin Icon Badge (40px screen-space, highly visible) */}
            <div
              className={`relative flex items-center justify-center w-10 h-10 rounded-full shadow-2xl transition-all border-2 ${
                isLight
                  ? isPoweredOn
                    ? 'bg-amber-400 text-slate-950 border-amber-200 ring-4 ring-amber-400/40 shadow-amber-400/60'
                    : 'bg-slate-800 text-amber-300 border-slate-600 ring-2 ring-slate-700/50'
                  : isAc
                  ? isPoweredOn
                    ? 'bg-sky-500 text-white border-sky-200 ring-4 ring-sky-400/40 shadow-sky-500/60'
                    : 'bg-slate-800 text-sky-300 border-slate-600 ring-2 ring-slate-700/50'
                  : isLock
                  ? isLocked
                    ? 'bg-rose-600 text-white border-rose-200 ring-4 ring-rose-500/40 shadow-rose-600/60'
                    : 'bg-emerald-500 text-white border-emerald-200 ring-4 ring-emerald-400/40 shadow-emerald-500/60'
                  : isCamera
                  ? 'bg-indigo-600 text-white border-indigo-200 ring-4 ring-indigo-500/40 shadow-indigo-600/60'
                  : isPoweredOn
                  ? 'bg-purple-600 text-white border-purple-200 ring-4 ring-purple-400/40 shadow-purple-600/60'
                  : 'bg-slate-800 text-purple-300 border-slate-600 ring-2 ring-slate-700/50'
              }`}
            >
              {getDeviceIcon()}

              {/* Status Indicator Dot */}
              <span
                className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full ring-2 ring-slate-900 ${
                  isPoweredOn || (isLock && !isLocked)
                    ? 'bg-emerald-400 animate-pulse'
                    : device.status === 'OFFLINE'
                    ? 'bg-rose-500'
                    : 'bg-slate-400'
                }`}
              />
            </div>

            {/* Permanent High-Contrast Name Capsule */}
            <div
              className={`mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-lg whitespace-nowrap text-center max-w-[130px] truncate transition-colors border ${
                isSelected
                  ? 'bg-purple-900 text-white border-purple-400 ring-2 ring-purple-400/40'
                  : hovered
                  ? 'bg-slate-900 text-white border-slate-600'
                  : 'bg-slate-950/85 text-slate-100 border-white/20'
              }`}
            >
              {device.name}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
};

// ============================================================================
// PROCEDURAL ROOM (FLOOR + WALLS + LABEL + INTERACTIVE SELECTION)
// ============================================================================

interface ProceduralRoomProps {
  room: DashboardRoom | Room;
  to3DX: (x: number) => number;
  to3DZ: (y: number) => number;
  wallMode: WallMode;
  showLabels: boolean;
  isSelected?: boolean;
  onSelect?: (roomId: string) => void;
}

const ProceduralRoom: React.FC<ProceduralRoomProps> = ({
  room,
  to3DX,
  to3DZ,
  wallMode,
  showLabels,
  isSelected = false,
  onSelect,
}) => {
  const [hovered, setHovered] = useState<boolean>(false);

  const rawCoords = (room.polygonCoordinates as { x: number; y: number }[] | null) || [];
  if (rawCoords.length < 3) return null;

  // Convert 2D SVG points to 3D points
  const points3D = useMemo(() => {
    return rawCoords.map((pt) => ({
      x: to3DX(pt.x),
      z: to3DZ(pt.y),
    }));
  }, [rawCoords, to3DX, to3DZ]);

  // Compute Visual Center for Label (Pole of Inaccessibility - 100% guaranteed inside polygon)
  const visualCenter = useMemo(() => {
    const vc = getPolygonVisualCenter(rawCoords);
    return {
      x: to3DX(vc.x),
      z: to3DZ(vc.y),
    };
  }, [rawCoords, to3DX, to3DZ]);

  // Generate Floor Shape
  const floorGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(points3D[0].x, -points3D[0].z);
    for (let i = 1; i < points3D.length; i++) {
      shape.lineTo(points3D[i].x, -points3D[i].z);
    }
    shape.closePath();
    return new THREE.ShapeGeometry(shape);
  }, [points3D]);

  // Generate Floor Border Line Object with dynamic selection highlight
  const borderLine = useMemo(() => {
    const pts = points3D.map((p) => new THREE.Vector3(p.x, 0.007, p.z));
    pts.push(new THREE.Vector3(points3D[0].x, 0.007, points3D[0].z));
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const borderColor = isSelected ? '#8B5CF6' : hovered ? '#6366F1' : '#1E293B';
    const borderOpacity = isSelected ? 0.95 : hovered ? 0.8 : 0.5;
    const mat = new THREE.LineBasicMaterial({
      color: borderColor,
      transparent: true,
      opacity: borderOpacity,
    });
    return new THREE.Line(geo, mat);
  }, [points3D, isSelected, hovered]);

  // Wall metrics
  const ceiling = (room as any).ceilingHeight || 3.0;
  const currentWallHeight = wallMode === 'cutaway' ? 1.2 : ceiling;
  const wallThickness = 0.12;

  // Calculate Wall segments along each polygon edge
  const wallSegments = useMemo(() => {
    const list: {
      midX: number;
      midZ: number;
      length: number;
      angle: number;
    }[] = [];

    const n = points3D.length;
    for (let i = 0; i < n; i++) {
      const p1 = points3D[i];
      const p2 = points3D[(i + 1) % n];

      const dx = p2.x - p1.x;
      const dz = p2.z - p1.z;
      const len = Math.hypot(dx, dz);

      if (len < 0.05) continue; // Skip degenerate points

      const midX = (p1.x + p2.x) / 2;
      const midZ = (p1.z + p2.z) / 2;
      const angle = -Math.atan2(dz, dx);

      list.push({ midX, midZ, length: len, angle });
    }
    return list;
  }, [points3D]);

  const roomColor = room.color || '#3B82F6';

  return (
    <group
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.(room.id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
        document.body.style.cursor = 'default';
      }}
    >
      {/* 1. ROOM FLOOR MESH */}
      <mesh
        geometry={floorGeometry}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.003, 0]}
        receiveShadow
      >
        <meshStandardMaterial
          color={roomColor}
          roughness={0.4}
          metalness={0.1}
          transparent
          opacity={isSelected ? 0.95 : hovered ? 0.88 : 0.78}
          emissive={isSelected ? roomColor : '#000000'}
          emissiveIntensity={isSelected ? 0.25 : 0}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 2. FLOOR BORDER OUTLINE */}
      <primitive object={borderLine} />

      {/* 3. EXTRUDED 3D WALLS */}
      {wallSegments.map((seg, idx) => (
        <group key={`wall-${idx}`} position={[seg.midX, 0, seg.midZ]} rotation={[0, seg.angle, 0]}>
          {/* Main Wall Plaster Box */}
          <mesh position={[0, currentWallHeight / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[seg.length, currentWallHeight, wallThickness]} />
            <meshStandardMaterial
              color={isSelected ? '#F8FAFC' : '#F1F5F9'}
              roughness={0.8}
              metalness={0.05}
            />
          </mesh>

          {/* Architectural Wall Cap Trim */}
          <mesh position={[0, currentWallHeight + 0.01, 0]}>
            <boxGeometry args={[seg.length, 0.02, wallThickness + 0.02]} />
            <meshStandardMaterial
              color={isSelected ? '#7C3AED' : hovered ? '#6366F1' : '#64748B'}
              roughness={0.3}
              metalness={0.4}
            />
          </mesh>
        </group>
      ))}

      {/* 4. 3D FLOATING ROOM LABEL */}
      {showLabels && (
        <Html
          position={[visualCenter.x, 0.08, visualCenter.z]}
          center
          zIndexRange={[60, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <div
            className={`flex flex-col items-center px-2.5 py-1 rounded-xl backdrop-blur-md shadow-md border text-center select-none pointer-events-none transition-all duration-200 ${
              isSelected
                ? 'bg-purple-900/95 text-white border-purple-400 ring-2 ring-purple-500/50 scale-105'
                : 'bg-white/95 text-slate-800 border-slate-300 shadow-sm'
            }`}
          >
            <span className="text-[11px] font-black tracking-tight whitespace-nowrap">
              {room.name}
            </span>
            {room.areaSquareMeters && (
              <span className={`text-[9px] font-mono font-bold ${isSelected ? 'text-purple-200' : 'text-slate-500'}`}>
                {room.areaSquareMeters.toFixed(1)} m²
              </span>
            )}
          </div>
        </Html>
      )}
    </group>
  );
};

// ============================================================================
// MAIN PROCEDURAL DOLLHOUSE SCENE CONTENT
// ============================================================================

interface SceneContainerProps {
  floorPlan?: FloorPlan | null;
  rooms: (DashboardRoom | Room)[];
  devices: IoTDevice[];
  furniture: FloorPlanObject[];
  selectedDeviceId?: string | null;
  selectedRoomId?: string | null;
  wallMode: WallMode;
  showLabels: boolean;
  enableDynamicLights: boolean;
  showDevicePins: boolean;
  onSelectDevice?: (dev: IoTDevice) => void;
  onSelectRoom?: (roomId: string | null) => void;
}

const SceneContainer: React.FC<SceneContainerProps> = ({
  floorPlan,
  rooms,
  devices,
  furniture,
  selectedDeviceId,
  selectedRoomId,
  wallMode,
  showLabels,
  enableDynamicLights,
  showDevicePins,
  onSelectDevice,
  onSelectRoom,
}) => {
  const viewBoxW = floorPlan?.viewBoxWidth || 1600;
  const viewBoxH = floorPlan?.viewBoxHeight || 1000;
  const ppm = floorPlan?.pixelsPerMeter && floorPlan.pixelsPerMeter > 10 ? floorPlan.pixelsPerMeter : 50;

  const cx = viewBoxW / 2;
  const cy = viewBoxH / 2;

  const to3DX = (x: number) => (x - cx) / ppm;
  const to3DZ = (y: number) => (y - cy) / ppm;

  const activeWallHeight = wallMode === 'cutaway' ? 1.2 : 3.0;

  // Ground plane dimension based on floor plan extents
  const groundW = (viewBoxW / ppm) * 1.4;
  const groundH = (viewBoxH / ppm) * 1.4;

  return (
    <group>
      {/* 1. Base Ground Platform with Subtle Grid (Click outside deselects room & device) */}
      <mesh
        position={[0, -0.01, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          onSelectRoom?.(null);
        }}
      >
        <planeGeometry args={[groundW, groundH]} />
        <meshStandardMaterial color="#E2E8F0" roughness={0.9} metalness={0.05} />
      </mesh>
      <gridHelper args={[Math.max(groundW, groundH), 30, '#94A3B8', '#CBD5E1']} position={[0, 0, 0]} />

      {/* 2. Procedural Rooms (Floors + Walls with Selection Support) */}
      {rooms.map((rm) => (
        <ProceduralRoom
          key={rm.id}
          room={rm}
          to3DX={to3DX}
          to3DZ={to3DZ}
          wallMode={wallMode}
          showLabels={showLabels}
          isSelected={selectedRoomId === rm.id}
          onSelect={(id) => onSelectRoom?.(id)}
        />
      ))}

      {/* 3. Furniture Objects */}
      {furniture.map((obj) => (
        <FurnitureMesh
          key={obj.id}
          object={obj}
          to3DX={to3DX}
          to3DZ={to3DZ}
          scale={ppm}
        />
      ))}

      {/* 4. IoT Devices with Real Dynamic Lighting & 3D Spatial Pins */}
      {devices.map((dev) => (
        <DeviceMesh
          key={dev.id}
          device={dev}
          to3DX={to3DX}
          to3DZ={to3DZ}
          viewBoxWidth={viewBoxW}
          viewBoxHeight={viewBoxH}
          wallHeight={activeWallHeight}
          isSelected={selectedDeviceId === dev.id}
          enableDynamicLights={enableDynamicLights}
          showDevicePins={showDevicePins}
          onSelect={(d) => onSelectDevice?.(d)}
        />
      ))}
    </group>
  );
};

// ============================================================================
// EXPORTED PROCEDURAL DOLLHOUSE VIEWER
// ============================================================================

export const ProceduralDollhouseViewer: React.FC<ProceduralDollhouseViewerProps> = ({
  floorPlan,
  rooms = [],
  devices = [],
  furniture: propsFurniture,
  selectedDeviceId,
  selectedRoomId,
  onSelectDevice,
  onOpenDeviceControl,
  onUpdateDevice,
  onSelectRoom,
  className = '',
  defaultWallMode = 'cutaway',
  floors,
  activeFloorId,
  onSelectFloor,
  showDevicePins: propsShowPins,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Camera & Preset Trigger State
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('ISO');
  const [presetTrigger, setPresetTrigger] = useState<number>(1);
  const [focusTrigger, setFocusTrigger] = useState<number>(0);
  const [wallMode, setWallMode] = useState<WallMode>(defaultWallMode);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [enableDynamicLights, setEnableDynamicLights] = useState<boolean>(true);
  const [showDevicePins, setShowDevicePins] = useState<boolean>(propsShowPins !== undefined ? propsShowPins : true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [focusedDeviceId, setFocusedDeviceId] = useState<string | null>(selectedDeviceId || null);

  // Keep focusedDeviceId in sync with selectedDeviceId prop if changed from outside
  useEffect(() => {
    if (selectedDeviceId !== undefined) {
      setFocusedDeviceId(selectedDeviceId);
      if (selectedDeviceId) {
        setFocusTrigger((prev) => prev + 1);
      }
    }
  }, [selectedDeviceId]);

  // Compute Scene Bounding Box Metrics for Camera Rig
  const viewBoxW = floorPlan?.viewBoxWidth || 1600;
  const viewBoxH = floorPlan?.viewBoxHeight || 1000;
  const ppm = floorPlan?.pixelsPerMeter && floorPlan.pixelsPerMeter > 10 ? floorPlan.pixelsPerMeter : 50;
  const maxWorldDim = Math.max(viewBoxW, viewBoxH) / ppm;

  const cx = viewBoxW / 2;
  const cy = viewBoxH / 2;
  const to3DX = (x: number) => (x - cx) / ppm;
  const to3DZ = (y: number) => (y - cy) / ppm;

  // Compute 3D Coordinates of Focused Device for Smooth Camera Zoom-in
  const focusedDevice = useMemo(() => {
    if (!focusedDeviceId) return null;
    return devices.find((d) => d.id === focusedDeviceId) || null;
  }, [devices, focusedDeviceId]);

  const focusedDevicePos = useMemo(() => {
    if (!focusedDevice) return null;
    const px = focusedDevice.x ?? (focusedDevice.normalizedX !== undefined ? focusedDevice.normalizedX * viewBoxW : viewBoxW / 2);
    const py = focusedDevice.y ?? (focusedDevice.normalizedY !== undefined ? focusedDevice.normalizedY * viewBoxH : viewBoxH / 2);
    const posX = to3DX(px);
    const posZ = to3DZ(py);

    const t = (focusedDevice.type || '').toUpperCase();
    const isLight = t.includes('LIGHT') || t.includes('DIMMER');
    const isAc = t.includes('AC') || t.includes('THERMOSTAT');
    const isLock = t.includes('LOCK');
    const isCamera = t.includes('CAMERA') || t.includes('CCTV');

    const catItem = focusedDevice.catalogItem;
    const activeWallH = wallMode === 'cutaway' ? 1.2 : 3.0;
    const posY = catItem?.defaultElevation !== undefined
      ? Math.min(catItem.defaultElevation, activeWallH - 0.05)
      : isLight
      ? activeWallH - 0.05
      : isAc
      ? Math.min(2.1, activeWallH * 0.85)
      : isLock
      ? Math.min(1.0, activeWallH * 0.7)
      : isCamera
      ? activeWallH - 0.15
      : Math.min(1.1, activeWallH * 0.75);

    return { x: posX, y: posY, z: posZ };
  }, [focusedDevice, viewBoxW, viewBoxH, ppm, wallMode]);

  const focusedDeviceRoom = useMemo(() => {
    if (!focusedDevice?.roomId) return null;
    return rooms.find((r) => r.id === focusedDevice.roomId) || null;
  }, [rooms, focusedDevice]);

  const focusedDeviceMeta = useMemo(() => {
    if (!focusedDevice) return null;
    const t = (focusedDevice.type || '').toUpperCase();
    const isLight = t.includes('LIGHT') || t.includes('DIMMER');
    const isAc = t.includes('AC') || t.includes('THERMOSTAT');
    const isLock = t.includes('LOCK');
    const isCamera = t.includes('CAMERA') || t.includes('CCTV');

    const cfg = (focusedDevice.configuration as Record<string, any>) || {};
    const isPoweredOn = focusedDevice.status === 'ON' || cfg.power === true;
    const isLocked = isLock && cfg.lockState !== 'UNLOCKED' && focusedDevice.status !== 'UNLOCKED';

    let colorBg = 'bg-purple-600 text-white';
    let statusLabel = focusedDevice.status || 'ONLINE';

    if (isLight) {
      colorBg = isPoweredOn ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-400/30' : 'bg-slate-700 text-amber-200';
      statusLabel = isPoweredOn ? 'MENYALA (ON)' : 'PADAM (OFF)';
    } else if (isAc) {
      colorBg = isPoweredOn ? 'bg-sky-500 text-white ring-4 ring-sky-400/30' : 'bg-slate-700 text-sky-200';
      statusLabel = isPoweredOn ? `AKTIF (${cfg.temperature || 24}°C)` : 'STANDBY (OFF)';
    } else if (isLock) {
      colorBg = isLocked ? 'bg-rose-600 text-white ring-4 ring-rose-500/30' : 'bg-emerald-500 text-white ring-4 ring-emerald-400/30';
      statusLabel = isLocked ? 'TERKUNCI (LOCKED)' : 'TERBUKA (UNLOCKED)';
    } else if (isCamera) {
      colorBg = 'bg-indigo-600 text-white ring-4 ring-indigo-500/30';
      statusLabel = 'FEED AKTIF';
    }

    return {
      isLight,
      isAc,
      isLock,
      isCamera,
      isPoweredOn,
      isLocked,
      colorBg,
      statusLabel,
    };
  }, [focusedDevice]);

  // Helper to trigger preset change reliably without unwanted resets during zoom/drag
  const handleSelectPreset = (preset: CameraPreset) => {
    setFocusedDeviceId(null);
    setCameraPreset(preset === 'RESET' ? 'ISO' : preset);
    setPresetTrigger((prev) => prev + 1);
  };

  const handleSelectDevice = (dev: IoTDevice) => {
    setFocusedDeviceId(dev.id);
    setFocusTrigger((prev) => prev + 1);
    onSelectDevice?.(dev);
  };

  const handleResetFocus = () => {
    setFocusedDeviceId(null);
    onSelectDevice?.(null);
    handleSelectPreset('RESET');
  };

  // Combine furniture from floor plan objects or direct prop
  const combinedFurniture = useMemo(() => {
    return propsFurniture !== undefined ? propsFurniture : (floorPlan?.objects || []);
  }, [propsFurniture, floorPlan?.objects]);

  const selectedRoom = useMemo(() => {
    if (!selectedRoomId) return null;
    return rooms.find((r) => r.id === selectedRoomId) || null;
  }, [rooms, selectedRoomId]);

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full min-h-[500px] bg-gradient-to-b from-[#EAEFF8] via-[#E2E8F0] to-[#CBD5E1] overflow-hidden select-none ${className}`}
    >
      {/* 3D CANVAS VIEWPORT */}
      <Canvas
        shadows
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        camera={{ position: [15, 18, 15], fov: 45, near: 0.1, far: 300 }}
      >
        {/* Soft Ambient Environment Lighting */}
        <ambientLight intensity={0.9} color="#FFFFFF" />
        <directionalLight
          position={[18, 25, 20]}
          intensity={1.25}
          color="#FFFBEB"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-bias={-0.0001}
        />
        <directionalLight position={[-15, 12, -15]} intensity={0.4} color="#93C5FD" />

        {/* 3D Model Scene */}
        <Suspense fallback={null}>
          <SceneContainer
            floorPlan={floorPlan}
            rooms={rooms}
            devices={devices}
            furniture={combinedFurniture}
            selectedDeviceId={focusedDeviceId}
            selectedRoomId={selectedRoomId}
            wallMode={wallMode}
            showLabels={showLabels}
            enableDynamicLights={enableDynamicLights}
            showDevicePins={showDevicePins}
            onSelectDevice={handleSelectDevice}
            onSelectRoom={(id) => {
              onSelectRoom?.(id);
              if (id) setFocusedDeviceId(null);
            }}
          />

          {/* Soft Ground Contact Shadow */}
          <ContactShadows
            position={[0, -0.015, 0]}
            opacity={0.4}
            scale={maxWorldDim * 1.5}
            blur={2.4}
            far={10}
            color="#0F172A"
          />
        </Suspense>

        {/* Rock Solid Camera Rig with Smooth Device Zoom-In Lerp */}
        <CameraRig
          cameraPreset={cameraPreset}
          presetTrigger={presetTrigger}
          boundsSize={maxWorldDim}
          focusedDevicePos={focusedDevicePos}
          focusTrigger={focusTrigger}
        />
      </Canvas>

      {/* TOP LEFT PERSPECTIVE & SELECTED ROOM BADGES */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2 pointer-events-none">
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-slate-200 shadow-sm text-xs font-bold text-slate-800 pointer-events-auto">
          <Box className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
          <span>3D Dollhouse Twin</span>
        </div>
        <div className="px-3 py-1 rounded-full bg-purple-100 text-purple-800 border border-purple-200 text-[10px] font-mono font-bold uppercase shadow-xs pointer-events-auto">
          Realtime Telemetry Active
        </div>

        {selectedRoom && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-900/90 backdrop-blur-md text-white border border-purple-400 shadow-lg text-xs font-bold animate-in fade-in zoom-in-95 pointer-events-auto">
            <span>Ruangan: {selectedRoom.name}</span>
            {selectedRoom.areaSquareMeters && (
              <span className="text-[10px] font-mono text-purple-200">({selectedRoom.areaSquareMeters.toFixed(1)} m²)</span>
            )}
            <button
              type="button"
              onClick={() => onSelectRoom?.(null)}
              className="ml-1.5 p-0.5 rounded-full hover:bg-white/20 text-purple-200 hover:text-white cursor-pointer transition-colors"
              title="Batal pilih ruangan"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* TOP RIGHT FOCUSED DEVICE CLOSE-UP INSPECTOR */}
      {focusedDevice && focusedDeviceMeta && (
        <div className="absolute top-4 right-4 z-20 w-80 rounded-2xl bg-white/95 backdrop-blur-xl border border-white/80 shadow-2xl p-4 animate-in fade-in slide-in-from-right duration-200 pointer-events-auto">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-11 h-11 shrink-0 rounded-2xl flex items-center justify-center shadow-sm ${focusedDeviceMeta.colorBg}`}>
                {focusedDeviceMeta.isLight ? (
                  <Lightbulb className="w-5 h-5" />
                ) : focusedDeviceMeta.isAc ? (
                  <Wind className="w-5 h-5" />
                ) : focusedDeviceMeta.isLock ? (
                  focusedDeviceMeta.isLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />
                ) : focusedDeviceMeta.isCamera ? (
                  <Video className="w-5 h-5" />
                ) : (
                  <Power className="w-5 h-5" />
                )}
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-black text-slate-800 leading-tight truncate">
                  {focusedDevice.name}
                </h4>
                <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                  {focusedDeviceRoom ? `Ruangan: ${focusedDeviceRoom.name}` : focusedDevice.type}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleResetFocus}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              title="Tutup / Zoom Out"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Live Status Row */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-150 mb-3 text-xs">
            <span className="text-slate-500 font-medium">Status Realtime</span>
            <div className="flex items-center gap-1.5 font-bold">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  focusedDeviceMeta.isPoweredOn || (focusedDeviceMeta.isLock && !focusedDeviceMeta.isLocked)
                    ? 'bg-emerald-500 animate-pulse'
                    : 'bg-slate-400'
                }`}
              />
              <span className="font-mono text-slate-800">{focusedDeviceMeta.statusLabel}</span>
            </div>
          </div>

          {/* Zoom Out & Full Control Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetFocus}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              title="Kembali ke Tampilan Denah Utuh"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Zoom Out</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (onOpenDeviceControl) {
                  onOpenDeviceControl(focusedDevice);
                } else if (onSelectDevice) {
                  onSelectDevice(focusedDevice);
                }
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/30 transition-all cursor-pointer"
              title="Buka Modal Kontrol Lengkap"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Buka Kontrol</span>
            </button>
          </div>

          {/* Spatial Transformation Controls for Technicians */}
          {onUpdateDevice && (
            <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <RotateCw className="w-3.5 h-3.5 text-purple-600" />
                  <span>Rotasi Arah Hadap (Yaw)</span>
                </span>
                <span className="font-mono font-extrabold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md text-[11px] border border-purple-200">
                  {Math.round(focusedDevice.rotation || 0)}°
                </span>
              </div>

              {/* Quick Rotate Buttons */}
              <div className="grid grid-cols-4 gap-1">
                {[
                  { label: '⟲ -45°', delta: -45 },
                  { label: '⟳ +45°', delta: 45 },
                  { label: '90°', set: 90 },
                  { label: '180°', delta: 180 },
                ].map((btn, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      const currentRot = focusedDevice.rotation || 0;
                      const nextRot = btn.set !== undefined ? btn.set : (currentRot + btn.delta + 360) % 360;
                      onUpdateDevice(focusedDevice.id, { rotation: nextRot });
                    }}
                    className="py-1 px-1.5 rounded-lg bg-slate-50 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300 border border-slate-200 text-slate-700 text-[10px] font-bold transition-all text-center cursor-pointer"
                    title="Putar sudut arah hadap perangkat"
                  >
                    {btn.label}
                  </button>
                ))}
              </div>

              {/* Smooth Angle Slider */}
              <input
                type="range"
                min={0}
                max={360}
                step={5}
                value={focusedDevice.rotation || 0}
                onChange={(e) => {
                  const nextRot = Number(e.target.value);
                  onUpdateDevice(focusedDevice.id, { rotation: nextRot });
                }}
                className="w-full accent-purple-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                title="Geser slider untuk memutar sudut presisi"
              />

              {/* Horizontal Nudge Buttons (X & Z Floor Plane) */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] font-bold text-slate-600">Geser Bidang Lantai:</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      const step = 20;
                      const nextX = Math.max(0, (focusedDevice.x || 0) - step);
                      const nextNormX = viewBoxW > 0 ? nextX / viewBoxW : 0;
                      onUpdateDevice(focusedDevice.id, { x: nextX, normalizedX: nextNormX });
                    }}
                    className="p-1 px-2 rounded-md bg-slate-100 hover:bg-purple-100 hover:text-purple-700 text-slate-700 text-xs font-bold cursor-pointer transition-colors"
                    title="Geser Kiri (X-)"
                  >
                    ◀
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const step = 20;
                      const nextY = Math.max(0, (focusedDevice.y || 0) - step);
                      const nextNormY = viewBoxH > 0 ? nextY / viewBoxH : 0;
                      onUpdateDevice(focusedDevice.id, { y: nextY, normalizedY: nextNormY });
                    }}
                    className="p-1 px-2 rounded-md bg-slate-100 hover:bg-purple-100 hover:text-purple-700 text-slate-700 text-xs font-bold cursor-pointer transition-colors"
                    title="Geser Atas (Y-)"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const step = 20;
                      const nextY = (focusedDevice.y || 0) + step;
                      const nextNormY = viewBoxH > 0 ? nextY / viewBoxH : 0;
                      onUpdateDevice(focusedDevice.id, { y: nextY, normalizedY: nextNormY });
                    }}
                    className="p-1 px-2 rounded-md bg-slate-100 hover:bg-purple-100 hover:text-purple-700 text-slate-700 text-xs font-bold cursor-pointer transition-colors"
                    title="Geser Bawah (Y+)"
                  >
                    ▼
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const step = 20;
                      const nextX = (focusedDevice.x || 0) + step;
                      const nextNormX = viewBoxW > 0 ? nextX / viewBoxW : 0;
                      onUpdateDevice(focusedDevice.id, { x: nextX, normalizedX: nextNormX });
                    }}
                    className="p-1 px-2 rounded-md bg-slate-100 hover:bg-purple-100 hover:text-purple-700 text-slate-700 text-xs font-bold cursor-pointer transition-colors"
                    title="Geser Kanan (X+)"
                  >
                    ▶
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* BOTTOM CENTER FLOATING HUD TOOLBAR */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-white/90 backdrop-blur-xl border border-white/80 shadow-2xl">
        {/* Optional Multi-floor switcher */}
        {floors && floors.length > 1 && (
          <>
            <div className="flex items-center bg-slate-100/90 rounded-xl p-0.5">
              {floors.map((fl) => (
                <button
                  key={fl.id}
                  type="button"
                  onClick={() => onSelectFloor?.(fl.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeFloorId === fl.id
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title={`Pindah ke ${fl.name}`}
                >
                  {fl.name}
                </button>
              ))}
            </div>
            <div className="w-[1px] h-5 bg-slate-200 mx-0.5" />
          </>
        )}

        {/* Camera Preset Group */}
        <div className="flex items-center bg-slate-100/90 rounded-xl p-0.5">
          <button
            type="button"
            onClick={() => handleSelectPreset('ISO')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              cameraPreset === 'ISO' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Sudut Isometrik 3D"
          >
            ISO
          </button>
          <button
            type="button"
            onClick={() => handleSelectPreset('TOP')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              cameraPreset === 'TOP' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Tampak Atas (Top View)"
          >
            TOP
          </button>
          <button
            type="button"
            onClick={() => handleSelectPreset('FRONT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              cameraPreset === 'FRONT' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Tampak Depan (Front View)"
          >
            FRONT
          </button>
        </div>

        <div className="w-[1px] h-5 bg-slate-200 mx-0.5" />

        {/* Wall Mode Toggle: Cutaway vs Full */}
        <button
          type="button"
          onClick={() => setWallMode((prev) => (prev === 'cutaway' ? 'full' : 'cutaway'))}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
            wallMode === 'cutaway'
              ? 'bg-purple-50 text-purple-700 border-purple-200'
              : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
          }`}
          title="Ubah Tinggi Dinding (Cutaway 1.2m vs Penuh 3.0m)"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{wallMode === 'cutaway' ? 'Cutaway (1.2m)' : 'Dinding Penuh (3.0m)'}</span>
        </button>

        {/* 3D Floating Device Pins Toggle */}
        <button
          type="button"
          onClick={() => setShowDevicePins((prev) => !prev)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
            showDevicePins
              ? 'bg-purple-50 text-purple-700 border-purple-200'
              : 'bg-slate-100 text-slate-500 border-slate-200'
          }`}
          title="Tampilkan / Sembunyikan Pin Ikon IoT di 3D"
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Pin IoT</span>
        </button>

        {/* Dynamic 3D Lights Toggle */}
        <button
          type="button"
          onClick={() => setEnableDynamicLights((prev) => !prev)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
            enableDynamicLights
              ? 'bg-amber-50 text-amber-800 border-amber-300'
              : 'bg-slate-100 text-slate-500 border-slate-200 line-through'
          }`}
          title="Efek Lampu 3D Realtime"
        >
          <Lightbulb className="w-3.5 h-3.5" />
          <span>Lampu 3D</span>
        </button>

        {/* Room Labels Toggle */}
        <button
          type="button"
          onClick={() => setShowLabels((prev) => !prev)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
            showLabels
              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
              : 'bg-slate-100 text-slate-500 border-slate-200'
          }`}
          title="Tampilkan / Sembunyikan Label Ruangan"
        >
          <Tag className="w-3.5 h-3.5" />
          <span>Label</span>
        </button>

        <div className="w-[1px] h-5 bg-slate-200 mx-0.5" />

        {/* Reset View */}
        <button
          type="button"
          onClick={() => handleSelectPreset('RESET')}
          className="p-1.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Reset Sudut Pandang Kamera"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Fullscreen Button */}
        <button
          type="button"
          onClick={handleToggleFullscreen}
          className="p-1.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
