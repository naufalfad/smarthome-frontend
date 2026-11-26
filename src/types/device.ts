export type DeviceType =
  // Standard Phase 4 & Phase 11 Canonical Types
  | 'SMART_LIGHT'
  | 'SMART_DIMMER'
  | 'SMART_AC'
  | 'SMART_LOCK'
  | 'SMART_SWITCH'
  | 'SMART_PLUG'
  | 'SMART_CURTAIN'
  | 'SMART_WATER_VALVE'
  | 'SMART_EXHAUST_FAN'
  | 'SMART_SIREN'
  | 'TEMP_HUMIDITY_SENSOR'
  | 'WATER_LEVEL_SENSOR'
  | 'AUTO_DUSK_DAWN_LIGHT'
  | 'AUTO_PIR_NIGHT_LIGHT'
  | 'WATER_LEAK_SENSOR'
  | 'SMOKE_FIRE_SENSOR'
  | 'GAS_LEAK_SENSOR'
  | 'DOOR_WINDOW_SENSOR'
  | 'PIR_MOTION_SENSOR'
  | 'PRESENCE_RADAR_SENSOR'
  | 'AIR_QUALITY_SENSOR'
  | 'ENERGY_MONITOR'
  | 'OUTDOOR_CAMERA'
  | 'INDOOR_CAMERA'
  | 'VIDEO_DOORBELL'
  | 'SMART_DISPLAY_HUB'
  // Legacy / Short Form Types
  | 'LIGHT'
  | 'SWITCH'
  | 'SOCKET'
  | 'THERMOSTAT'
  | 'AC'
  | 'LOCK'
  | 'DOOR_SENSOR'
  | 'WINDOW_SENSOR'
  | 'MOTION_SENSOR'
  | 'CAMERA'
  | 'SMOKE_DETECTOR'
  | 'WATER_LEAK'
  | 'CURTAIN'
  | 'FAN'
  | 'SPEAKER'
  | 'OTHER';

export type DevicePropertyType = 'boolean' | 'number' | 'string' | 'enum';

export interface DeviceCapability {
  property: string;
  label: string;
  type: DevicePropertyType;
  unit?: string;
  defaultValue: any;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  controllable: boolean;
  description?: string;
}

export interface DeviceCatalogItem {
  id: string;
  name: string;
  deviceType: string;
  category: 'LIGHTING' | 'CLIMATE' | 'SECURITY' | 'SENSORS' | string;
  description?: string | null;
  icon: string;
  color?: string | null;
  defaultWidth: number;
  defaultHeight: number;
  capabilities: DeviceCapability[];
  defaultConfiguration: Record<string, any>;
  isActive: boolean;
  modelGlbPath?: string | null;
  placementTarget?: 'WALL' | 'CEILING' | 'FLOOR' | 'TABLETOP' | string;
  defaultElevation?: number;
  dimensionLength?: number;
  dimensionWidth?: number;
  dimensionHeight?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type DeviceStatus = 'ONLINE' | 'OFFLINE' | 'ALERT' | 'ON' | 'OFF' | 'LOCKED' | 'UNLOCKED';

export type DeviceIntegrationStatus =
  | 'UNCONFIGURED'
  | 'SIMULATED'
  | 'INTEGRATED'
  | 'ERROR';

export type PublishStatus = 'DRAFT' | 'PREVIEW' | 'PUBLISHED';

export interface IoTDevice {
  id: string;
  name: string;
  type: DeviceType;
  status: DeviceStatus | string;
  integrationStatus: DeviceIntegrationStatus | string;
  x: number;
  y: number;
  normalizedX: number;
  normalizedY: number;
  rotation: number;
  iconWidth?: number;
  iconHeight?: number;
  manualRoomName?: string | null;
  configuration?: Record<string, any> | null;
  catalogItemId?: string | null;
  catalogItem?: DeviceCatalogItem | null;
  // Phase 6 Hardware Abstraction & Provider Layer
  providerType?: string; // "VIRTUAL", "ESP32", "MQTT", etc.
  providerConfig?: Record<string, any> | null;
  connectionStatus?: 'ONLINE' | 'OFFLINE' | 'UNKNOWN' | string;
  lastSeenAt?: string | null;
  isSimulated?: boolean;
  dataSource?: string;
  houseId?: string | null;
  floorId?: string | null;
  floorPlanId?: string | null;
  roomId?: string | null;
  room?: {
    id: string;
    name: string;
    type: string;
    color?: string | null;
  } | null;
  floor?: {
    id: string;
    name: string;
    levelNumber: number;
  } | null;
  telemetry?: {
    id?: string;
    metricType?: string;
    value?: number | null;
    unit?: string | null;
    timestamp?: string;
  }[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PublishValidationResult {
  canPublish: boolean;
  publishStatus: PublishStatus | string;
  publishedAt: string | null;
  totalFloors: number;
  totalDevices: number;
  unconfiguredDevices: number;
  checks: {
    hasHouse: boolean;
    hasFloorPlanImage: boolean;
    hasDevices: boolean;
    allDevicesHaveValidType: boolean;
  };
  validationErrors: string[];
  warnings: string[];
}

export interface ClientDashboardData {
  isPublished: boolean;
  publishStatus: PublishStatus | string;
  publishedAt?: string | null;
  houseId?: string;
  houseName?: string;
  clientName?: string | null;
  message?: string;
  house?: {
    id: string;
    name: string;
    description?: string | null;
    clientName?: string | null;
    clientEmail?: string | null;
    floors: Array<{
      id: string;
      name: string;
      levelNumber: number;
      floorPlan: {
        id: string;
        name: string;
        imagePath?: string | null;
        imageWidth?: number | null;
        imageHeight?: number | null;
        viewBoxWidth: number;
        viewBoxHeight: number;
        backgroundOpacity: number;
        isBackgroundVisible: boolean;
      } | null;
      rooms: Array<{
        id: string;
        name: string;
        type: string;
        color?: string | null;
        polygonCoordinates?: Array<{ x: number; y: number }> | null;
      }>;
    }>;
    devices: IoTDevice[];
  };
}

export interface DeviceTelemetryPoint {
  id: string;
  deviceId: string;
  timestamp: string;
  metricType: string;
  value?: number | null;
  stringValue?: string | null;
  unit?: string | null;
  isSimulated: boolean;
}

export interface SimulationEngineStatus {
  isRunning: boolean;
  intervalMs: number;
  totalTicks: number;
  lastTickAt: string | null;
  lastTickDurationMs: number;
  simulatedDeviceCount: number;
  activeErrors: number;
  lastError: string | null;
}

export interface FloorPlanTelemetryData {
  engine: {
    isRunning: boolean;
    intervalMs: number;
    lastTickAt: string | null;
  };
  devices: Array<{
    id: string;
    name: string;
    type: string;
    status: string;
    integrationStatus: string;
    configuration?: Record<string, any>;
    updatedAt: string;
    latestTelemetry: DeviceTelemetryPoint[];
  }>;
}

export interface DeviceCommandRecord {
  id: string;
  deviceId: string;
  commandType: string;
  payload: Record<string, any>;
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | string;
  errorMessage?: string | null;
  executionResult?: Record<string, any> | null;
  createdAt: string;
  completedAt?: string | null;
}

export interface ProviderStatus {
  providerType: string;
  name: string;
  isInitialized: boolean;
  isRunning: boolean;
  isHardware: boolean;
  managedDevicesCount: number;
  activeErrors: number;
  lastError?: string | null;
  startedAt?: string | null;
  metadata?: Record<string, any>;
}

export interface ProviderHealthCheck {
  providerType: string;
  isHealthy: boolean;
  message: string;
  timestamp: string;
  details?: Record<string, any>;
}



