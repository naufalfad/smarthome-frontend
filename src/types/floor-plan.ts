export type ObjectCategory =
  | 'LIVING_ROOM'
  | 'BEDROOM'
  | 'KITCHEN'
  | 'BATHROOM'
  | 'GENERAL';

export type RoomType =
  | 'LIVING_ROOM'
  | 'BEDROOM'
  | 'KITCHEN'
  | 'BATHROOM'
  | 'DINING_ROOM'
  | 'WORKSPACE'
  | 'GARAGE'
  | 'OTHER';

export interface PolygonPoint {
  x: number;
  y: number;
}

export interface Room {
  id: string;
  floorId: string;
  name: string;
  type: RoomType;
  color: string | null;
  polygonCoordinates: PolygonPoint[] | null;
  areaSquareMeters: number | null;
  isActive: boolean;
  floor?: number;
  floorPlanObjects?: FloorPlanObject[];
  _count?: { floorPlanObjects: number };
  createdAt?: string;
  updatedAt?: string;
}

export interface ObjectCatalogItem {
  id: string;
  name: string;
  category: ObjectCategory;
  assetPath: string;
  svgContent?: string | null;
  defaultWidth: number;
  defaultHeight: number;
  description?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface FloorPlanObject {
  id: string;
  floorPlanId: string;
  catalogObjectId?: string | null;
  name: string;
  category: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  roomId?: string | null;
  properties?: Record<string, any>;
  catalogObject?: ObjectCatalogItem | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CalibrationPoints {
  point1: { x: number; y: number };
  point2: { x: number; y: number };
  distanceMeters: number;
  pixelDistance?: number;
}

export interface FloorPlan {
  id: string;
  floorId: string;
  name: string;
  imagePath?: string | null;
  imageWidth?: number | null;
  imageHeight?: number | null;
  imageSize?: number | null;
  imageMimeType?: string | null;
  pixelsPerMeter?: number | null;
  isCalibrated: boolean;
  calibrationPoints?: CalibrationPoints | null;
  viewBoxX: number;
  viewBoxY: number;
  viewBoxWidth: number;
  viewBoxHeight: number;
  backgroundOpacity: number;
  isBackgroundVisible: boolean;
  gridSnap?: boolean;
  objects: FloorPlanObject[];
  floor?: Floor;
  createdAt: string;
  updatedAt: string;
}

export interface Floor {
  id: string;
  houseId: string;
  name: string;
  levelNumber: number;
  floorPlans: FloorPlan[];
  createdAt?: string;
  updatedAt?: string;
}

export type PropertyType =
  | 'HOUSE'
  | 'APARTMENT'
  | 'VILLA'
  | 'OFFICE'
  | 'SHOPHOUSE'
  | 'OTHER';

export type PropertySetupStatus =
  | 'DRAFT'
  | 'SURVEYING'
  | 'CONFIGURING'
  | 'TESTING'
  | 'READY_FOR_HANDOVER'
  | 'ACTIVE'
  | 'ARCHIVED';

export interface HouseOwnerSummary {
  id: string;
  userId: string;
  fullName: string;
  phone?: string | null;
  companyName?: string | null;
  user?: {
    email?: string | null;
  };
}

export interface House {
  id: string;
  name: string;
  description?: string | null;
  address?: string | null;
  propertyType?: PropertyType;
  hasPhysicalIot?: boolean;
  setupStatus?: PropertySetupStatus;
  customerId?: string | null;
  customer?: HouseOwnerSummary | null;
  publishStatus?: string;
  floors: Floor[];
  createdAt?: string;
  updatedAt?: string;
}

