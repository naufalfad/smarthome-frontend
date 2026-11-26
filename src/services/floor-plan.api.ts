import {
  House,
  Floor,
  FloorPlan,
  FloorPlanObject,
  ObjectCatalogItem,
} from '../types/floor-plan';
import { httpClient } from './http-client';

class FloorPlanApiService {
  // ==========================================
  // HOUSES & FLOORS
  // ==========================================

  public async getHouses(filters?: { customerId?: string }): Promise<House[]> {
    const qs = filters?.customerId
      ? `?customerId=${encodeURIComponent(filters.customerId)}`
      : '';
    return httpClient.get<House[]>(`/houses${qs}`, 'Failed to fetch houses');
  }

  public async getHouseById(id: string): Promise<House> {
    return httpClient.get<House>(`/houses/${id}`, 'Failed to fetch house');
  }

  public async createHouse(data: {
    name: string;
    description?: string;
    address?: string;
    propertyType?: House['propertyType'];
    hasPhysicalIot?: boolean;
    customerId?: string;
  }): Promise<House> {
    return httpClient.post<House>('/houses', data, 'Failed to create house');
  }

  public async addFloor(
    houseId: string,
    data: { name?: string; levelNumber?: number }
  ): Promise<Floor> {
    return httpClient.post<Floor>(`/houses/${houseId}/floors`, data, 'Failed to add floor');
  }

  public async deleteFloor(houseId: string, floorId: string): Promise<House> {
    return httpClient.delete<House>(
      `/houses/${houseId}/floors/${floorId}`,
      'Failed to delete floor'
    );
  }

  // ==========================================
  // FLOOR PLAN & BACKGROUND
  // ==========================================

  public async getPlanByFloor(floorId: string): Promise<FloorPlan> {
    return httpClient.get<FloorPlan>(
      `/floor-plans/by-floor/${floorId}`,
      'Failed to fetch floor plan'
    );
  }

  public async getPlanById(id: string): Promise<FloorPlan> {
    return httpClient.get<FloorPlan>(`/floor-plans/${id}`, 'Failed to fetch floor plan');
  }

  public getBackgroundImageUrl(id: string, version?: string | number): string {
    return httpClient.resolveUrl(
      `/floor-plans/${id}/image${version ? `?v=${encodeURIComponent(version)}` : ''}`
    );
  }

  public async updatePlanConfig(
    id: string,
    data: {
      name?: string;
      viewBoxX?: number;
      viewBoxY?: number;
      viewBoxWidth?: number;
      viewBoxHeight?: number;
      backgroundOpacity?: number;
      isBackgroundVisible?: boolean;
      gridSnap?: boolean;
    }
  ): Promise<FloorPlan> {
    return httpClient.patch<FloorPlan>(
      `/floor-plans/${id}`,
      data,
      'Failed to update floor plan config'
    );
  }

  public async uploadBackground(id: string, file: File): Promise<FloorPlan> {
    const formData = new FormData();
    formData.append('image', file);

    return httpClient.post<FloorPlan>(
      `/floor-plans/${id}/background`,
      formData,
      'Failed to upload background image'
    );
  }

  public async deleteBackground(id: string): Promise<FloorPlan> {
    return httpClient.delete<FloorPlan>(
      `/floor-plans/${id}/background`,
      'Failed to remove background image'
    );
  }

  public async saveCalibration(
    id: string,
    calibration: {
      point1: { x: number; y: number };
      point2: { x: number; y: number };
      distanceMeters: number;
    }
  ): Promise<FloorPlan> {
    return httpClient.post<FloorPlan>(
      `/floor-plans/${id}/calibration`,
      calibration,
      'Failed to save scale calibration'
    );
  }

  public async resetCalibration(id: string): Promise<FloorPlan> {
    return httpClient.delete<FloorPlan>(
      `/floor-plans/${id}/calibration`,
      'Failed to reset scale calibration'
    );
  }

  public async rotatePlan(id: string): Promise<FloorPlan> {
    return httpClient.post<FloorPlan>(
      `/floor-plans/${id}/rotate`,
      {},
      'Failed to rotate floor plan'
    );
  }

  // ==========================================
  // OBJECT CATALOG
  // ==========================================

  public async getCatalogItems(options?: {
    category?: string;
    search?: string;
  }): Promise<ObjectCatalogItem[]> {
    const query = new URLSearchParams();
    if (options?.category && options.category !== 'ALL') {
      query.set('category', options.category);
    }
    if (options?.search) {
      query.set('search', options.search);
    }

    const qs = query.toString() ? `?${query.toString()}` : '';
    return httpClient.get<ObjectCatalogItem[]>(
      `/object-catalog${qs}`,
      'Failed to fetch catalog items'
    );
  }

  public async getCatalogCategories(): Promise<string[]> {
    return httpClient.get<string[]>(
      '/object-catalog/categories',
      'Failed to fetch catalog categories'
    );
  }

  // ==========================================
  // OBJECT INSTANCES
  // ==========================================

  public async createObject(
    floorPlanId: string,
    data: {
      catalogObjectId?: string;
      name: string;
      category: string;
      x: number;
      y: number;
      width?: number;
      height?: number;
      rotation?: number;
      zIndex?: number;
      properties?: Record<string, any>;
    }
  ): Promise<FloorPlanObject> {
    return httpClient.post<FloorPlanObject>(
      `/floor-plans/${floorPlanId}/objects`,
      data,
      'Failed to create object'
    );
  }

  public async updateObject(
    floorPlanId: string,
    objectId: string,
    data: Partial<FloorPlanObject>
  ): Promise<FloorPlanObject> {
    return httpClient.patch<FloorPlanObject>(
      `/floor-plans/${floorPlanId}/objects/${objectId}`,
      data,
      'Failed to update object'
    );
  }

  public async deleteObject(floorPlanId: string, objectId: string): Promise<void> {
    await httpClient.delete(
      `/floor-plans/${floorPlanId}/objects/${objectId}`,
      'Failed to delete object'
    );
  }

  public async duplicateObject(
    floorPlanId: string,
    objectId: string
  ): Promise<FloorPlanObject> {
    return httpClient.post<FloorPlanObject>(
      `/floor-plans/${floorPlanId}/objects/${objectId}/duplicate`,
      undefined,
      'Failed to duplicate object'
    );
  }

  public async batchUpdateObjects(
    floorPlanId: string,
    updates: Array<{ id: string } & Partial<FloorPlanObject>>
  ): Promise<FloorPlanObject[]> {
    return httpClient.put<FloorPlanObject[]>(
      `/floor-plans/${floorPlanId}/objects/batch`,
      { updates },
      'Failed to batch update objects'
    );
  }

  // ==========================================
  // PHASE 11: IOT COMMISSIONING & HANDOVER
  // ==========================================

  public async getHouseQuota(houseId: string): Promise<{
    houseId: string;
    currentDevices: number;
    maxDevices: number | null;
    isQuotaReached: boolean;
    serviceOrder: { id: string; orderNumber: string; maxDevices: number | null } | null;
  }> {
    return httpClient.get(`/houses/${houseId}/quota?_t=${Date.now()}`, 'Gagal memuat kuota perangkat');
  }

  public async placeHouseDevice(houseId: string, data: any): Promise<any> {
    return httpClient.post(`/houses/${houseId}/devices`, data, 'Gagal menempatkan perangkat IoT');
  }

  public async markReadyForHandover(houseId: string): Promise<{
    house: House;
    deviceCount: number;
  }> {
    return httpClient.post(`/houses/${houseId}/ready-for-handover`, {}, 'Gagal menandai siap serah terima');
  }
}

export const floorPlanApi = new FloorPlanApiService();
