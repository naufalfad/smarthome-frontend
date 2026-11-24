import {
  IoTDevice,
  DeviceCatalogItem,
  DeviceCapability,
  SimulationEngineStatus,
  DeviceTelemetryPoint,
  FloorPlanTelemetryData,
  DeviceCommandRecord,
  ProviderStatus,
  ProviderHealthCheck,
} from '../types/device';
import { httpClient } from './http-client';

class DeviceApiService {
  // ==========================================
  // IOT DEVICE CATALOG (PHASE 4)
  // ==========================================

  public async getCatalog(category?: string, search?: string): Promise<DeviceCatalogItem[]> {
    const params = new URLSearchParams();
    if (category && category !== 'ALL') params.append('category', category);
    if (search && search.trim()) params.append('search', search.trim());

    const qs = params.toString() ? `?${params.toString()}` : '';
    return httpClient.get<DeviceCatalogItem[]>(`/device-catalog${qs}`, 'Failed to fetch device catalog');
  }

  public async getCatalogById(id: string): Promise<DeviceCatalogItem> {
    return httpClient.get<DeviceCatalogItem>(`/device-catalog/${id}`, 'Failed to fetch catalog item');
  }

  public async getCatalogByType(deviceType: string): Promise<DeviceCatalogItem> {
    return httpClient.get<DeviceCatalogItem>(
      `/device-catalog/by-type/${encodeURIComponent(deviceType)}`,
      'Failed to fetch catalog item by type'
    );
  }

  public async getCapabilities(deviceType: string): Promise<DeviceCapability[]> {
    const json = await httpClient.requestEnvelope<{
      success: boolean;
      capabilities: DeviceCapability[];
    }>(
      `/device-catalog/by-type/${encodeURIComponent(deviceType)}/capabilities`,
      { method: 'GET' },
      'Failed to fetch device capabilities'
    );
    return json.capabilities;
  }

  // ==========================================
  // DEVICE INSTANCES (FLOOR PLAN PLACEMENT)
  // ==========================================

  public async getDevicesByFloorPlan(floorPlanId: string): Promise<IoTDevice[]> {
    return httpClient.get<IoTDevice[]>(
      `/floor-plans/${floorPlanId}/devices`,
      'Failed to fetch devices for floor plan'
    );
  }

  public async getDevicesByHouse(houseId: string): Promise<IoTDevice[]> {
    return httpClient.get<IoTDevice[]>(
      `/devices?houseId=${encodeURIComponent(houseId)}`,
      'Failed to fetch devices for house'
    );
  }

  public async getDeviceById(id: string): Promise<IoTDevice> {
    return httpClient.get<IoTDevice>(`/devices/${id}`, 'Failed to fetch device');
  }

  public async createDevice(
    floorPlanId: string,
    data: {
      name?: string;
      type?: string;
      catalogItemId?: string;
      x?: number;
      y?: number;
      normalizedX?: number;
      normalizedY?: number;
      rotation?: number;
      iconWidth?: number;
      iconHeight?: number;
      manualRoomName?: string;
      roomId?: string | null;
      configuration?: Record<string, any>;
      integrationStatus?: string;
      status?: string;
    }
  ): Promise<IoTDevice> {
    return httpClient.post<IoTDevice>(
      `/floor-plans/${floorPlanId}/devices`,
      data,
      'Failed to create device'
    );
  }

  public async updateDevice(
    id: string,
    data: Partial<IoTDevice>
  ): Promise<IoTDevice> {
    return httpClient.patch<IoTDevice>(`/devices/${id}`, data, 'Failed to update device');
  }

  public async updateDeviceConfiguration(
    id: string,
    configuration: Record<string, any>,
    isControlAction = false
  ): Promise<IoTDevice> {
    return httpClient.patch<IoTDevice>(
      `/devices/${id}/configuration`,
      { configuration, isControlAction },
      'Failed to update device configuration'
    );
  }

  public async deleteDevice(id: string): Promise<void> {
    await httpClient.delete(`/devices/${id}`, 'Failed to delete device');
  }

  public async updateTelemetry(
    id: string,
    telemetry: {
      status?: string;
      integrationStatus?: string;
      configuration?: Record<string, any>;
    }
  ): Promise<IoTDevice> {
    return httpClient.patch<IoTDevice>(
      `/devices/${id}/telemetry`,
      telemetry,
      'Failed to update device telemetry'
    );
  }

  // ==========================================
  // PHASE 5: BACKGROUND SIMULATION & TELEMETRY
  // ==========================================

  public async getSimulationStatus(): Promise<SimulationEngineStatus> {
    return httpClient.get<SimulationEngineStatus>(
      '/simulation/status',
      'Failed to fetch simulation status'
    );
  }

  public async getDeviceState(id: string): Promise<any> {
    return httpClient.get<any>(`/devices/${id}/state`, 'Failed to fetch device state');
  }

  public async getDeviceTelemetry(
    id: string,
    options?: { limit?: number; metricType?: string; since?: string }
  ): Promise<DeviceTelemetryPoint[]> {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.metricType) params.append('metricType', options.metricType);
    if (options?.since) params.append('since', options.since);

    const qs = params.toString() ? `?${params.toString()}` : '';
    return httpClient.get<DeviceTelemetryPoint[]>(
      `/devices/${id}/telemetry${qs}`,
      'Failed to fetch device telemetry'
    );
  }

  public async getFloorPlanTelemetry(floorPlanId: string): Promise<FloorPlanTelemetryData> {
    return httpClient.get<FloorPlanTelemetryData>(
      `/floor-plans/${floorPlanId}/telemetry/latest`,
      'Failed to fetch floor plan telemetry'
    );
  }

  public async controlDevice(
    id: string,
    command: {
      action?: string;
      property?: string;
      value?: any;
      payload?: any;
    }
  ): Promise<IoTDevice> {
    return httpClient.post<IoTDevice>(
      `/devices/${id}/control`,
      command,
      'Gagal mengirimkan kontrol perangkat'
    );
  }

  // ==========================================
  // PHASE 6: HARDWARE ABSTRACTION & COMMAND LIFECYCLE
  // ==========================================

  public async executeStandardizedCommand(
    id: string,
    command: {
      commandType: string;
      payload?: any;
      action?: string;
    }
  ): Promise<{
    commandId: string;
    status: 'SUCCESS' | 'FAILED';
    commandType: string;
    appliedConfig?: Record<string, any>;
    resultingStatus?: string;
    device?: IoTDevice;
  }> {
    return httpClient.post(
      `/devices/${id}/command`,
      command,
      'Gagal mengeksekusi perintah perangkat'
    );
  }

  public async getDeviceCommandHistory(
    id: string,
    limit = 20
  ): Promise<DeviceCommandRecord[]> {
    return httpClient.get<DeviceCommandRecord[]>(
      `/devices/${id}/commands?limit=${limit}`,
      'Gagal memuat riwayat perintah'
    );
  }

  public async getDeviceProviderState(id: string): Promise<any> {
    return httpClient.get<any>(
      `/devices/${id}/provider-state`,
      'Gagal memuat state provider perangkat'
    );
  }

  public async getProviderStatuses(): Promise<ProviderStatus[]> {
    return httpClient.get<ProviderStatus[]>(
      '/providers/status',
      'Gagal memuat status provider'
    );
  }

  public async getProviderHealth(): Promise<Record<string, ProviderHealthCheck>> {
    return httpClient.get<Record<string, ProviderHealthCheck>>(
      '/providers/health',
      'Gagal memuat kesehatan provider'
    );
  }

  public async getFloorPlanDevicesEnriched(floorPlanId: string): Promise<{
    providers: ProviderStatus[];
    devices: IoTDevice[];
  }> {
    return httpClient.get(
      `/floor-plans/${floorPlanId}/devices/enriched`,
      'Gagal memuat perangkat denah dengan provider'
    );
  }
}

export const deviceApi = new DeviceApiService();
