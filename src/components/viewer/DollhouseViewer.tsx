import React, { Suspense, useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import {
  OrbitControls,
  useGLTF,
  Center,
  ContactShadows,
  Html,
} from '@react-three/drei';
import * as THREE from 'three';
import {
  AlertCircle,
  Loader2,
  Box,
  Sparkles,
  HelpCircle,
  Layers,
} from 'lucide-react';
import { NodeInfo } from '../../types/house-model';
import {
  CameraPreset,
  SceneNodeHierarchyMeta,
} from '../../types/scene-interaction';
import { AnchorMarker } from './AnchorMarker';
import { ViewerToolbar } from './ViewerToolbar';

export interface DollhouseViewerProps {
  modelUrl: string;
  selectedNodeName: string | null;
  onSelectNode: (nodeName: string | null) => void;
  selectedRoomName?: string | null;
  onSelectRoom?: (roomName: string | null) => void;
  activeFloor?: string | 'ALL';
  onSelectFloor?: (floor: string | 'ALL') => void;
  isolatedRoom?: string | null;
  onClearIsolation?: () => void;
  showAnchors?: boolean;
  onToggleAnchors?: () => void;
  wireframe?: boolean;
  onToggleWireframe?: () => void;
  cameraPreset?: CameraPreset;
  onSelectPreset?: (preset: CameraPreset) => void;
  hierarchyMetaMap?: Map<string, SceneNodeHierarchyMeta>;
  allNodesFlat?: NodeInfo[];
  availableFloors?: string[];
  selectedNodeDisplayName?: string | null;
  selectedRoomDisplayName?: string | null;
  className?: string;
}

// Camera Rig to manage smooth camera preset framing & auto-fit
interface CameraRigProps {
  cameraPreset: CameraPreset;
  modelBounds: {
    center: THREE.Vector3;
    size: THREE.Vector3;
    maxDim: number;
  } | null;
}

const CameraRig: React.FC<CameraRigProps> = ({
  cameraPreset,
  modelBounds,
}) => {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  const applyCameraPreset = (preset: CameraPreset) => {
    const maxDim = modelBounds ? Math.max(modelBounds.maxDim, 8) : 12;
    const center = modelBounds ? modelBounds.center : new THREE.Vector3(0, 0, 0);

    const targetPos = new THREE.Vector3();

    switch (preset) {
      case 'TOP':
        // Top-down cutaway view
        targetPos.set(center.x, center.y + maxDim * 1.8, center.z + 0.001);
        break;
      case 'FRONT':
        // Front cutaway elevation view
        targetPos.set(center.x, center.y + maxDim * 0.35, center.z + maxDim * 1.6);
        break;
      case 'ISO':
      case 'RESET':
      default:
        // Classical 3D dollhouse isometric angle
        targetPos.set(
          center.x + maxDim * 1.15,
          center.y + maxDim * 1.15,
          center.z + maxDim * 1.15
        );
        break;
    }

    camera.position.copy(targetPos);
    camera.lookAt(center);

    if (controlsRef.current) {
      controlsRef.current.target.copy(center);
      controlsRef.current.update();
    }
  };

  useEffect(() => {
    applyCameraPreset(cameraPreset);
  }, [cameraPreset, modelBounds]);

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.06}
      minDistance={2}
      maxDistance={90}
      maxPolarAngle={Math.PI / 2 + 0.05} // Keep camera above dollhouse base
    />
  );
};

// Model Scene with safe material highlighting, anchor positioning, and raycasting
interface ModelSceneProps {
  url: string;
  selectedNodeName: string | null;
  selectedRoomName: string | null;
  activeFloor: string | 'ALL';
  isolatedRoom: string | null;
  wireframe: boolean;
  showAnchors: boolean;
  hierarchyMetaMap?: Map<string, SceneNodeHierarchyMeta>;
  allNodesFlat?: NodeInfo[];
  onSelectNode: (nodeName: string | null) => void;
  onSelectRoom?: (roomName: string | null) => void;
  onBoundsCalculated: (bounds: {
    center: THREE.Vector3;
    size: THREE.Vector3;
    maxDim: number;
  }) => void;
}

const ModelScene: React.FC<ModelSceneProps> = ({
  url,
  selectedNodeName,
  selectedRoomName,
  activeFloor,
  isolatedRoom,
  wireframe,
  showAnchors,
  hierarchyMetaMap,
  allNodesFlat = [],
  onSelectNode,
  onSelectRoom,
  onBoundsCalculated,
}) => {
  const { scene } = useGLTF(url);

  // Clone scene for safe non-destructive rendering
  const clonedScene = useMemo(() => {
    const cloned = scene.clone(true);

    // Deep-clone all materials once so changes never mutate Three.js GLTF cache
    cloned.traverse((child: any) => {
      if (child.isMesh && child.material) {
        if (!child.userData.__origMaterial) {
          if (Array.isArray(child.material)) {
            child.userData.__origMaterial = child.material.map((m: any) =>
              m.clone()
            );
            child.material = child.userData.__origMaterial.map((m: any) =>
              m.clone()
            );
          } else {
            child.userData.__origMaterial = child.material.clone();
            child.material = child.userData.__origMaterial.clone();
          }
        }
      }
    });

    return cloned;
  }, [scene]);

  // Extract spatial anchors world positions relative to scene
  const anchorEntries = useMemo(() => {
    const list: {
      node: NodeInfo;
      position: [number, number, number];
      parentRoom?: string;
      parentFloor?: string;
    }[] = [];

    // Force matrix world update so coordinates are exact
    clonedScene.updateMatrixWorld(true);

    allNodesFlat.forEach((node) => {
      if (node.isAnchor || node.name.toUpperCase().startsWith('ANCHOR_')) {
        const foundObj = clonedScene.getObjectByName(node.name);
        const meta = hierarchyMetaMap?.get(node.name);

        if (foundObj) {
          const worldPos = new THREE.Vector3();
          foundObj.getWorldPosition(worldPos);
          // Convert to clonedScene coordinate space
          clonedScene.worldToLocal(worldPos);

          list.push({
            node,
            position: [worldPos.x, worldPos.y, worldPos.z],
            parentRoom: meta?.parentRoom?.name,
            parentFloor: meta?.parentFloor?.name,
          });
        } else {
          // Fallback to transform position if node is virtual
          list.push({
            node,
            position: node.transform.position,
            parentRoom: meta?.parentRoom?.name,
            parentFloor: meta?.parentFloor?.name,
          });
        }
      }
    });

    return list;
  }, [clonedScene, allNodesFlat, hierarchyMetaMap]);

  // Compute model bounding box for camera fitting
  useEffect(() => {
    clonedScene.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(clonedScene);
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    box.getCenter(center);
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);

    onBoundsCalculated({ center, size, maxDim });
  }, [clonedScene, onBoundsCalculated]);

  // Apply Visibility Filtering & Safe Highlighting
  useEffect(() => {
    clonedScene.traverse((child: any) => {
      const childName = child.name;
      const parentName = child.parent?.name;
      const meta =
        hierarchyMetaMap?.get(childName) ||
        (parentName ? hierarchyMetaMap?.get(parentName) : undefined);

      // Floor Visibility Check
      let matchesFloor = true;
      if (activeFloor !== 'ALL') {
        const childFloor =
          meta?.parentFloor?.name ||
          (meta?.node.classification === 'FLOOR' ? meta.node.name : null);
        if (childFloor && childFloor !== activeFloor) {
          matchesFloor = false;
        }
      }

      // Room Isolation Check
      let matchesRoomIsolation = true;
      if (isolatedRoom) {
        const childRoom =
          meta?.parentRoom?.name ||
          (meta?.node.classification === 'ROOM' ? meta.node.name : null);
        if (childRoom && childRoom !== isolatedRoom) {
          matchesRoomIsolation = false;
        }
      }

      // Set visibility on meshes
      if (child.isMesh) {
        child.visible = matchesFloor && matchesRoomIsolation;

        // Apply highlighting
        if (child.visible && child.material) {
          const mats = Array.isArray(child.material)
            ? child.material
            : [child.material];

          // Direct node selection (Mesh or its parent group is selected)
          const isDirectSelected =
            selectedNodeName &&
            (childName === selectedNodeName ||
              parentName === selectedNodeName ||
              meta?.node.name === selectedNodeName);

          // Room selection (descendant of selected room)
          const isRoomSelected =
            selectedRoomName &&
            (meta?.parentRoom?.name === selectedRoomName ||
              childName === selectedRoomName);

          mats.forEach((mat: any) => {
            mat.wireframe = wireframe;

            if (isDirectSelected) {
              // High-visibility glowing violet highlight
              mat.emissive = new THREE.Color('#8B5CF6');
              mat.emissiveIntensity = 0.65;
            } else if (isRoomSelected) {
              // Soft translucent violet ambient tint for room enclosure
              mat.emissive = new THREE.Color('#A78BFA');
              mat.emissiveIntensity = 0.25;
            } else {
              // Reset to neutral
              mat.emissive = new THREE.Color(0, 0, 0);
              mat.emissiveIntensity = 0;
            }
            mat.needsUpdate = true;
          });
        }
      }
    });
  }, [
    clonedScene,
    selectedNodeName,
    selectedRoomName,
    activeFloor,
    isolatedRoom,
    wireframe,
    hierarchyMetaMap,
  ]);

  // Click Handler with intelligent node & room traversal
  const handleSceneClick = (e: any) => {
    e.stopPropagation();
    const clickedObj = e.object;
    if (!clickedObj) return;

    const clickedName = clickedObj.name;
    const parentName = clickedObj.parent?.name;

    const meta =
      hierarchyMetaMap?.get(clickedName) ||
      (parentName ? hierarchyMetaMap?.get(parentName) : undefined);

    if (meta) {
      if (meta.isObject || meta.isAnchor) {
        // Direct device/anchor selection
        onSelectNode(meta.node.name);
        if (meta.parentRoom) {
          onSelectRoom?.(meta.parentRoom.name);
        }
      } else if (meta.isRoom) {
        // Room clicked directly
        onSelectRoom?.(meta.node.name);
        onSelectNode(meta.node.name);
      } else if (meta.parentRoom) {
        // Wall, floor or ceiling clicked -> select room and the structural node
        onSelectRoom?.(meta.parentRoom.name);
        onSelectNode(meta.node.name);
      } else {
        onSelectNode(meta.node.name);
      }
    } else {
      onSelectNode(clickedName || parentName || null);
    }
  };

  // Filter anchors based on active floor and isolated room
  const visibleAnchors = useMemo(() => {
    return anchorEntries.filter((anchor) => {
      if (activeFloor !== 'ALL') {
        if (anchor.parentFloor && anchor.parentFloor !== activeFloor) {
          return false;
        }
      }
      if (isolatedRoom) {
        if (anchor.parentRoom && anchor.parentRoom !== isolatedRoom) {
          return false;
        }
      }
      return true;
    });
  }, [anchorEntries, activeFloor, isolatedRoom]);

  return (
    <group>
      <primitive object={clonedScene} onClick={handleSceneClick} />

      {/* Render 3D IoT Anchor Markers */}
      {showAnchors &&
        visibleAnchors.map((anchor) => (
          <AnchorMarker
            key={anchor.node.name}
            node={anchor.node}
            worldPosition={anchor.position}
            isSelected={selectedNodeName === anchor.node.name}
            onSelect={(name) => {
              onSelectNode(name);
              if (anchor.parentRoom) {
                onSelectRoom?.(anchor.parentRoom);
              }
            }}
          />
        ))}
    </group>
  );
};

// Canvas streaming loader
const CanvasLoader: React.FC = () => (
  <Html center>
    <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/95 border border-slate-200/80 shadow-xl backdrop-blur-sm text-center min-w-[210px]">
      <Loader2 className="w-6 h-6 text-[#8B5CF6] animate-spin mb-2" />
      <span className="text-xs font-bold text-[#181829]">
        Streaming 3D Dollhouse...
      </span>
      <span className="text-[10px] text-[#71758E] mt-0.5">
        Rendering cutaway isometric model
      </span>
    </div>
  </Html>
);

export const DollhouseViewer: React.FC<DollhouseViewerProps> = ({
  modelUrl,
  selectedNodeName,
  onSelectNode,
  selectedRoomName = null,
  onSelectRoom,
  activeFloor = 'ALL',
  onSelectFloor,
  isolatedRoom = null,
  onClearIsolation,
  showAnchors = true,
  onToggleAnchors,
  wireframe = false,
  onToggleWireframe,
  cameraPreset = 'ISO',
  onSelectPreset,
  hierarchyMetaMap,
  allNodesFlat = [],
  availableFloors = [],
  selectedNodeDisplayName = null,
  selectedRoomDisplayName = null,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [modelBounds, setModelBounds] = useState<{
    center: THREE.Vector3;
    size: THREE.Vector3;
    maxDim: number;
  } | null>(null);

  // Fullscreen support
  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(console.error);
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(console.error);
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () =>
      document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full min-h-[500px] rounded-[24px] overflow-hidden bg-gradient-to-br from-[#E6E8F4] via-[#ECEEF8] to-[#DFE2EE] border border-white/80 shadow-[0_12px_36px_-6px_rgba(112,118,150,0.08)] select-none ${className}`}
    >
      {/* 3D Canvas Viewport */}
      {hasError ? (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-[#181829]">
            Failed to Load 3D Model
          </h3>
          <p className="text-xs text-[#71758E] max-w-sm mt-1">
            Could not parse GLB asset. Check network connection or verify that the model file exists on server.
          </p>
          <button
            onClick={() => setHasError(false)}
            className="mt-4 px-4 py-2 rounded-full bg-[#181824] text-white text-xs font-bold hover:bg-slate-800 transition-colors"
          >
            Retry Loading
          </button>
        </div>
      ) : (
        <Canvas
          shadows
          camera={{ position: [14, 14, 14], fov: 42, near: 0.1, far: 1000 }}
          onPointerMissed={() => {
            onSelectNode(null);
            onSelectRoom?.(null);
          }}
          onError={() => setHasError(true)}
          className="w-full h-full"
        >
          {/* Studio Lighting for clean isometric cutaway appearance */}
          <ambientLight intensity={0.75} />
          <hemisphereLight
            color="#FFFFFF"
            groundColor="#D8DAE8"
            intensity={0.65}
          />
          <directionalLight
            castShadow
            position={[16, 26, 12]}
            intensity={1.3}
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-near={0.5}
            shadow-camera-far={60}
            shadow-camera-left={-12}
            shadow-camera-right={12}
            shadow-camera-top={12}
            shadow-camera-bottom={-12}
            shadow-bias={-0.0001}
          />
          <directionalLight position={[-16, 12, -12]} intensity={0.4} />

          <Suspense fallback={<CanvasLoader />}>
            <Center top>
              <ModelScene
                url={modelUrl}
                selectedNodeName={selectedNodeName}
                selectedRoomName={selectedRoomName}
                activeFloor={activeFloor}
                isolatedRoom={isolatedRoom}
                wireframe={wireframe}
                showAnchors={showAnchors}
                hierarchyMetaMap={hierarchyMetaMap}
                allNodesFlat={allNodesFlat}
                onSelectNode={onSelectNode}
                onSelectRoom={onSelectRoom}
                onBoundsCalculated={setModelBounds}
              />
            </Center>

            {/* Soft contact shadows beneath dollhouse floor */}
            <ContactShadows
              position={[0, -0.01, 0]}
              opacity={0.35}
              scale={28}
              blur={2.5}
              far={12}
              resolution={512}
              color="#201830"
            />
          </Suspense>

          <CameraRig
            cameraPreset={cameraPreset}
            modelBounds={modelBounds}
          />
        </Canvas>
      )}

      {/* Top Left Perspective & Selected Node Badges */}
      <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2 z-10 pointer-events-none">
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-xs text-xs font-bold text-[#181829]">
          <Box className="w-3.5 h-3.5 text-[#8B5CF6]" />
          <span>3D Dollhouse View</span>
        </div>

        {selectedRoomName && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-[#7C3AED] border border-purple-200/80 shadow-xs text-xs font-bold animate-in fade-in zoom-in-95">
            <span>Room: {selectedRoomDisplayName || selectedRoomName}</span>
          </div>
        )}

        {selectedNodeName && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#181824] text-white shadow-xs text-xs font-medium animate-in fade-in zoom-in-95">
            <Sparkles className="w-3 h-3 text-[#A78BFA]" />
            <span className="truncate max-w-[200px]">{selectedNodeDisplayName || selectedNodeName}</span>
          </div>
        )}
      </div>

      {/* Floating Interactive Viewer HUD Toolbar */}
      <ViewerToolbar
        cameraPreset={cameraPreset}
        onSelectCameraPreset={(preset: CameraPreset) => onSelectPreset?.(preset)}
        floorNames={availableFloors}
        activeFloor={activeFloor === 'ALL' ? null : activeFloor}
        onSelectFloor={(fl: string | null) => onSelectFloor?.(fl || 'ALL')}
        isolatedRoom={isolatedRoom}
        onClearIsolation={() => onClearIsolation?.()}
        showAnchors={showAnchors}
        onToggleAnchors={() => onToggleAnchors?.()}
        wireframe={wireframe}
        onToggleWireframe={() => onToggleWireframe?.()}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
      />

      {/* Helpful Orbit Hint Pill at Bottom Right */}
      <div className="absolute bottom-4 right-4 hidden md:flex items-center gap-1.5 text-[11px] text-[#71758E] px-3 py-1 rounded-full bg-white/80 border border-slate-200/60 pointer-events-none">
        <HelpCircle className="w-3.5 h-3.5 text-[#8B5CF6]" />
        <span>Orbit: Left Drag · Pan: Right Drag · Zoom: Scroll</span>
      </div>
    </div>
  );
};
