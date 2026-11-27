/**
 * PHASE 8: USER DASHBOARD & SMART HOME EXPERIENCE TYPES
 */

import { IoTDevice } from './device';
import { FloorPlan } from './floor-plan';
import { AutomationExecution } from './automation';

export interface EnvironmentalMetric {
  value: number | null;
  unit: string;
  updatedAt: string | null;
  status: 'NORMAL' | 'WARNING' | 'UNAVAILABLE';
  deviceName?: string | null;
  thresholdGuide?: string;
}

export interface HouseOverviewData {
  houseSummary: {
    id: string;
    name: string;
    address?: string | null;
    propertyType?: string;
    hasPhysicalIot?: boolean;
    setupStatus?: string;
    customerId?: string | null;
    clientName: string | null;
    publishStatus: string;
    totalFloors: number;
    totalRooms: number;
    totalDevices: number;
    activeDevices: number;
    offlineDevices: number;
    automationStatus: {
      isRunning: boolean;
      activeRulesCount: number;
      totalRulesCount: number;
      lastTriggeredAt: string | null;
    };
  };
  environmental: {
    temperature: EnvironmentalMetric;
    humidity: EnvironmentalMetric;
    aqi: EnvironmentalMetric;
    pm25: EnvironmentalMetric;
    pm10: EnvironmentalMetric;
  };
  deviceSummary: {
    lighting: { category: string; label: string; total: number; active: number; devices: IoTDevice[] };
    climate: { category: string; label: string; total: number; active: number; devices: IoTDevice[] };
    security: { category: string; label: string; total: number; active: number; devices: IoTDevice[] };
    sensors: { category: string; label: string; total: number; active: number; devices: IoTDevice[] };
  };
  quickStats: {
    totalDevices: number;
    activeDevices: number;
    warningSensorsCount: number;
    activeAutomationsCount: number;
  };
}

export interface DashboardFloor {
  id: string;
  name: string;
  levelNumber: number;
  floorPlan: FloorPlan | null;
  roomCount: number;
  deviceCount: number;
  rooms: { id: string; name: string; type: string; color: string | null }[];
}

export interface DashboardRoom {
  id: string;
  name: string;
  type: string;
  floor: number;
  floorId: string | null;
  floorName: string;
  color: string;
  polygonCoordinates?: { x: number; y: number }[] | null;
  areaSquareMeters?: number | null;
  ceilingHeight?: number | null;
  deviceCount: number;
  environmental: {
    temperature: number | null;
    humidity: number | null;
  };
  devices: {
    id: string;
    name: string;
    type: string;
    status: string;
    category: string;
    configuration?: any;
    normalizedX: number;
    normalizedY: number;
  }[];
}

export interface DashboardActivityItem {
  id: string;
  type: 'MANUAL_COMMAND' | 'AUTOMATION_TRIGGER';
  title: string;
  description: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'PROCESSING' | 'SKIPPED' | 'PARTIAL_SUCCESS';
  timestamp: string;
  source: 'USER_MANUAL' | 'AUTOMATION';
  deviceId?: string | null;
  deviceName?: string | null;
  roomName?: string | null;
  payload?: any;
  errorMessage?: string | null;
}

export interface DashboardRuleSummary {
  id: string;
  name: string;
  description?: string | null;
  enabled: boolean;
  priority: number;
  triggerType: string;
  conditionCount: number;
  actionCount: number;
  targetDevices: string[];
  lastTriggeredAt?: string | null;
  lastExecutionStatus?: string | null;
  executionCount: number;
}

export interface DashboardAutomationSummary {
  activeCount: number;
  inactiveCount: number;
  totalCount: number;
  rules: DashboardRuleSummary[];
  recentExecutions: AutomationExecution[];
}
