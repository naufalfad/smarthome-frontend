import { NodeInfo } from './house-model';

export type CameraPreset = 'ISO' | 'TOP' | 'FRONT' | 'RESET';

export interface SceneNodeHierarchyMeta {
  node: NodeInfo;
  parentRoom: NodeInfo | null;
  parentFloor: NodeInfo | null;
  hierarchyPath: string[]; // e.g. ["HOUSE_01", "FLOOR_01", "ROOM_LIVING", "OBJ_LIGHT_01"]
  descendantMeshNames: string[]; // All mesh node names inside this node
  isAnchor: boolean;
  isRoom: boolean;
  isFloor: boolean;
  isObject: boolean;
}

export interface SelectedNodeDetail {
  node: NodeInfo;
  parentRoom: NodeInfo | null;
  parentFloor: NodeInfo | null;
  hierarchyPath: string[];
  worldPosition?: [number, number, number];
  worldRotation?: [number, number, number];
  worldScale?: [number, number, number];
  meshCount: number;
}

export interface ViewerVisibilityState {
  activeFloor: string | null; // e.g. "FLOOR_01" or null for all floors
  isolatedRoom: string | null; // e.g. "ROOM_LIVING" or null for all rooms
  showAnchors: boolean;
  wireframe: boolean;
}

