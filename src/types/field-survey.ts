/**
 * PHASE 9: COMMERCIAL FIELD SURVEY TYPES
 *
 * Types for technician survey data collection, rooms inventory, electrical/network audits,
 * survey photos, and Super Admin verification workflow.
 */

export type FieldSurveyStatus = 'DRAFT' | 'SUBMITTED' | 'REVISION_REQUIRED' | 'VERIFIED';

export type SurveyPhotoCategory =
  | 'MAIN_PANEL'
  | 'SUB_PANEL'
  | 'ELECTRICITY_METER'
  | 'ROUTER_WIFI'
  | 'ROOM_OVERVIEW'
  | 'WALL_OUTLET'
  | 'CEILING_OBSTACLE'
  | 'OTHER';

export type RoomType =
  | 'LIVING_ROOM'
  | 'BEDROOM'
  | 'KITCHEN'
  | 'BATHROOM'
  | 'DINING_ROOM'
  | 'WORKSPACE'
  | 'GARAGE'
  | 'OTHER';

export interface SurveyRoomItem {
  id: string;
  surveyId: string;
  roomName: string;
  roomType: RoomType;
  floorLevel: number;
  lengthMeters?: number | string | null;
  widthMeters?: number | string | null;
  heightMeters?: number | string | null;
  wallOutletsCount: number;
  lightSwitchesCount: number;
  existingAcUnits: number;
  acUnitModel?: string | null;
  notes?: string | null;
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SurveyRoomItemInput {
  id?: string;
  roomName: string;
  roomType?: RoomType;
  floorLevel?: number;
  lengthMeters?: number | string | null;
  widthMeters?: number | string | null;
  heightMeters?: number | string | null;
  wallOutletsCount?: number;
  lightSwitchesCount?: number;
  existingAcUnits?: number;
  acUnitModel?: string | null;
  notes?: string | null;
  displayOrder?: number;
}

export interface SurveyPhoto {
  id: string;
  surveyId: string;
  category: SurveyPhotoCategory;
  title: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  caption?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface FieldSurveyHistoryItem {
  id: string;
  surveyId: string;
  previousStatus?: FieldSurveyStatus | null;
  newStatus: FieldSurveyStatus;
  actorUserId?: string | null;
  actorRole: string;
  actionNote?: string | null;
  createdAt: string;
  actorUser?: {
    id: string;
    name?: string | null;
    username?: string | null;
    email?: string | null;
    role: string;
  } | null;
}

export interface FieldSurvey {
  id: string;
  serviceOrderId: string;
  assignmentId: string;
  technicianProfileId: string;
  status: FieldSurveyStatus;
  scheduledDate?: string | null;
  surveyedAt?: string | null;
  submittedAt?: string | null;
  verifiedAt?: string | null;
  verifiedByAdminId?: string | null;
  revisionReason?: string | null;
  adminReviewNotes?: string | null;

  // Building & Structure
  buildingType?: string | null;
  totalFloors: number;
  estimatedAreaM2?: number | string | null;
  wallStructureMaterial?: string | null;
  ceilingHeightMeters?: number | string | null;

  // Electrical Audit
  mainBreakerAmps?: number | null;
  mainsVoltageVolts?: number | string | null;
  groundingStatus?: string | null;
  hasSubPanels: boolean;
  subPanelLocations?: string | null;
  electricalNotes?: string | null;

  // Network & Wi-Fi
  ispProvider?: string | null;
  connectionType?: string | null;
  measuredDownloadSpeed?: number | string | null;
  measuredUploadSpeed?: number | string | null;
  mainRouterLocation?: string | null;
  wifiCoverageRating?: string | null;
  networkNotes?: string | null;

  // Qualitative Observations
  customerSpecialRequests?: string | null;
  installationObstacles?: string | null;
  technicianNotes?: string | null;

  // Relations
  rooms: SurveyRoomItem[];
  photos: SurveyPhoto[];
  history?: FieldSurveyHistoryItem[];
  serviceOrder?: {
    id: string;
    orderNumber: string;
    packageName: string;
    packageCode: string;
    packageSnapshot: any;
    propertyName: string;
    propertyAddress: string;
    houseId?: string | null;
    status: string;
  };
  technicianProfile?: {
    id: string;
    user?: {
      id: string;
      name?: string | null;
      email?: string | null;
      phone?: string | null;
    };
  };
  packageSnapshot?: {
    maxRooms?: number | null;
    maxDevices?: number | null;
    packageName?: string;
  };

  createdAt?: string;
  updatedAt?: string;
}

export interface SaveSurveyDraftPayload {
  buildingType?: string | null;
  totalFloors?: number;
  estimatedAreaM2?: number | string | null;
  wallStructureMaterial?: string | null;
  ceilingHeightMeters?: number | string | null;
  mainBreakerAmps?: number | null;
  mainsVoltageVolts?: number | string | null;
  groundingStatus?: string | null;
  hasSubPanels?: boolean;
  subPanelLocations?: string | null;
  electricalNotes?: string | null;
  ispProvider?: string | null;
  connectionType?: string | null;
  measuredDownloadSpeed?: number | string | null;
  measuredUploadSpeed?: number | string | null;
  mainRouterLocation?: string | null;
  wifiCoverageRating?: string | null;
  networkNotes?: string | null;
  customerSpecialRequests?: string | null;
  installationObstacles?: string | null;
  technicianNotes?: string | null;
  rooms?: SurveyRoomItemInput[];
}

export interface VerifySurveyResult {
  house: {
    id: string;
    name: string;
    address: string;
    propertyType: string;
    setupStatus: string;
    floors: Array<{
      id: string;
      name: string;
      levelNumber: number;
      floorPlan?: { id: string; name: string };
    }>;
  };
  survey: FieldSurvey;
  alreadyCreated: boolean;
}
