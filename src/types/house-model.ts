export type ModelStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type NodeClassificationType =
  | 'ROOM'
  | 'FLOOR'
  | 'OBJ'
  | 'ANCHOR'
  | 'WALL'
  | 'WINDOW'
  | 'DOOR'
  | 'OTHER';

export interface NodeTransform {
  position: [number, number, number];
  rotation: [number, number, number, number];
  scale: [number, number, number];
}

export interface NodeInfo {
  index: number;
  name: string;
  type: 'Empty' | 'Mesh' | 'Group' | 'Camera' | 'Light';
  classification: NodeClassificationType;
  hasMesh: boolean;
  isEmpty: boolean;
  isAnchor: boolean;
  meshIndex?: number;
  parentIndex: number | null;
  parentName: string | null;
  childrenIndices: number[];
  childrenNames: string[];
  transform: NodeTransform;
  children?: NodeInfo[];
}

export interface MeshInfo {
  index: number;
  name: string;
  primitivesCount: number;
  materialIndices: number[];
  boundingBox?: {
    min: [number, number, number];
    max: [number, number, number];
  };
}

export interface MaterialInfo {
  index: number;
  name: string;
}

export interface BoundingBox3D {
  min: [number, number, number];
  max: [number, number, number];
  size: [number, number, number];
  center: [number, number, number];
}

export interface SceneInfo {
  sceneCount: number;
  defaultSceneIndex: number;
  sceneName: string;
  rootNodeIndices: number[];
  rootNodeNames: string[];
}

export interface GlbInspectionSummary {
  totalNodes: number;
  totalMeshes: number;
  totalMaterials: number;
  totalScenes: number;
  totalEmptyAnchors: number;
  totalRoomsDetected: number;
  totalFloorsDetected: number;
  totalDevicesDetected: number;
}

export interface GlbInspectionResult {
  summary: GlbInspectionSummary;
  scene: SceneInfo;
  boundingBox: BoundingBox3D;
  dimensions: {
    x: number;
    y: number;
    z: number;
    unitHint: string;
  };
  nodeTree: NodeInfo[];
  allNodesFlat: NodeInfo[];
  classifiedNodes: {
    rooms: string[];
    floors: string[];
    objects: string[];
    anchors: string[];
    walls: string[];
    windows: string[];
    doors: string[];
    other: string[];
  };
  meshes: MeshInfo[];
  materials: MaterialInfo[];
  inspectedAt: string;
}

export interface HouseModel {
  id: string;
  name: string;
  description: string | null;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  thumbnailPath: string | null;
  status: ModelStatus;
  modelMetadata: GlbInspectionResult | null;
  createdAt: string;
  updatedAt: string;
  rooms?: any[];
}

export interface HouseModelsPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface HouseModelsListResponse {
  models: HouseModel[];
  pagination: HouseModelsPagination;
}

