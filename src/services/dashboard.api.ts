/**
 * PHASE 8: DASHBOARD API CLIENT (Migrated to Phase 1 Shared Authenticated httpClient)
 * Connects frontend dashboard views to backend aggregated dashboard endpoints.
 */

import {
  HouseOverviewData,
  DashboardFloor,
  DashboardRoom,
  DashboardActivityItem,
  DashboardAutomationSummary,
} from '../types/dashboard';
import { IoTDevice } from '../types/device';
import { httpClient } from './http-client';

class DashboardApiService {
  private buildQuery(params: Record<string, string | number | undefined>): string {
    const search = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== '') {
        search.append(k, String(v));
      }
    }
    const qs = search.toString();
    return qs ? `?${qs}` : '';
  }

  public async getOverview(houseId?: string): Promise<HouseOverviewData> {
    return httpClient.get<HouseOverviewData>(
      `/dashboard/overview${this.buildQuery({ houseId })}`,
      'Gagal memuat overview dashboard'
    );
  }

  public async getFloors(houseId?: string): Promise<DashboardFloor[]> {
    return httpClient.get<DashboardFloor[]>(
      `/dashboard/floors${this.buildQuery({ houseId })}`,
      'Gagal memuat daftar lantai'
    );
  }

  public async getRooms(houseId?: string, floorId?: string): Promise<DashboardRoom[]> {
    return httpClient.get<DashboardRoom[]>(
      `/dashboard/rooms${this.buildQuery({ houseId, floorId })}`,
      'Gagal memuat daftar ruangan'
    );
  }

  public async getDevices(
    houseId?: string,
    floorId?: string,
    roomId?: string,
    category?: string
  ): Promise<IoTDevice[]> {
    return httpClient.get<IoTDevice[]>(
      `/dashboard/devices${this.buildQuery({ houseId, floorId, roomId, category })}`,
      'Gagal memuat daftar perangkat'
    );
  }

  public async getActivities(houseId?: string, limit: number = 30): Promise<DashboardActivityItem[]> {
    return httpClient.get<DashboardActivityItem[]>(
      `/dashboard/activities${this.buildQuery({ houseId, limit })}`,
      'Gagal memuat riwayat aktivitas'
    );
  }

  public async getAutomationSummary(houseId?: string): Promise<DashboardAutomationSummary> {
    return httpClient.get<DashboardAutomationSummary>(
      `/dashboard/automation-summary${this.buildQuery({ houseId })}`,
      'Gagal memuat ringkasan otomasi'
    );
  }

  public async controlDevice(
    deviceId: string,
    commandType: string,
    payload: Record<string, any> = {}
  ): Promise<any> {
    return httpClient.post<any>(
      `/dashboard/devices/${deviceId}/control`,
      { commandType, payload },
      'Gagal mengirimkan perintah perangkat'
    );
  }
}

export const dashboardApi = new DashboardApiService();
