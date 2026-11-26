import { httpClient, tokenStorage } from './http-client.js';
import { DeviceCatalogItem } from '../types/device.js';
import { ObjectCatalogItem } from '../types/floor-plan.js';

export interface CreateDeviceCatalogPayload {
  name: string;
  deviceType: string;
  category: string;
  description?: string;
  icon?: string;
  color?: string;
  defaultWidth?: number;
  defaultHeight?: number;
  placementTarget?: string;
  defaultElevation?: number;
  dimensionLength?: number;
  dimensionWidth?: number;
  dimensionHeight?: number;
  capabilities?: any[];
  defaultConfiguration?: Record<string, any>;
}

export interface CreateObjectCatalogPayload {
  name: string;
  category: string;
  description?: string;
  assetPath?: string;
  svgContent?: string;
  defaultWidth?: number;
  defaultHeight?: number;
  placementTarget?: string;
  defaultElevation?: number;
  dimensionLength?: number;
  dimensionWidth?: number;
  dimensionHeight?: number;
}

class Catalog3dApiService {
  // ==========================================
  // IOT DEVICE CATALOG (3D ENHANCED)
  // ==========================================

  public async getDeviceCatalog(category?: string, search?: string): Promise<DeviceCatalogItem[]> {
    const params = new URLSearchParams();
    if (category && category !== 'ALL') params.append('category', category);
    if (search && search.trim()) params.append('search', search.trim());
    const qs = params.toString() ? `?${params.toString()}` : '';
    return httpClient.get<DeviceCatalogItem[]>(`/device-catalog${qs}`, 'Gagal memuat katalog perangkat');
  }

  public async createDeviceCatalogItem(payload: CreateDeviceCatalogPayload): Promise<DeviceCatalogItem> {
    return httpClient.post<DeviceCatalogItem>('/device-catalog', payload, 'Gagal menambahkan katalog perangkat');
  }

  public async updateDeviceCatalogItem(
    id: string,
    payload: Partial<CreateDeviceCatalogPayload & { isActive: boolean }>
  ): Promise<DeviceCatalogItem> {
    return httpClient.patch<DeviceCatalogItem>(`/device-catalog/${id}`, payload, 'Gagal memperbarui katalog perangkat');
  }

  public async deleteDeviceCatalogItem(id: string): Promise<any> {
    return httpClient.delete(`/device-catalog/${id}`, 'Gagal menghapus katalog perangkat');
  }

  public async uploadDevice3dModel(
    id: string,
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<DeviceCatalogItem> {
    const formData = new FormData();
    formData.append('file', file);

    if (onProgress) {
      return httpClient.uploadWithProgress<DeviceCatalogItem>(
        `/device-catalog/${id}/model-3d`,
        formData,
        onProgress,
        'Gagal mengunggah model 3D perangkat'
      );
    }
    return httpClient.post<DeviceCatalogItem>(
      `/device-catalog/${id}/model-3d`,
      formData,
      'Gagal mengunggah model 3D perangkat'
    );
  }

  public getDevice3dModelUrl(id: string): string {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
    const token = tokenStorage.getToken();
    const qs = token ? `?token=${encodeURIComponent(token)}` : '';
    return `${baseUrl}/device-catalog/${id}/model-3d${qs}`;
  }

  // ==========================================
  // FURNITURE & INTERIOR ADDONS CATALOG (3D)
  // ==========================================

  public async getObjectCatalog(category?: string, search?: string): Promise<ObjectCatalogItem[]> {
    const params = new URLSearchParams();
    if (category && category !== 'ALL') params.append('category', category);
    if (search && search.trim()) params.append('search', search.trim());
    const qs = params.toString() ? `?${params.toString()}` : '';
    return httpClient.get<ObjectCatalogItem[]>(`/object-catalog${qs}`, 'Gagal memuat katalog perabot interior');
  }

  public async createObjectCatalogItem(payload: CreateObjectCatalogPayload): Promise<ObjectCatalogItem> {
    return httpClient.post<ObjectCatalogItem>('/object-catalog', payload, 'Gagal menambahkan katalog perabot');
  }

  public async updateObjectCatalogItem(
    id: string,
    payload: Partial<CreateObjectCatalogPayload & { isActive: boolean }>
  ): Promise<ObjectCatalogItem> {
    return httpClient.patch<ObjectCatalogItem>(`/object-catalog/${id}`, payload, 'Gagal memperbarui katalog perabot');
  }

  public async deleteObjectCatalogItem(id: string): Promise<any> {
    return httpClient.delete(`/object-catalog/${id}`, 'Gagal menghapus katalog perabot');
  }

  public async uploadObject3dModel(
    id: string,
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<ObjectCatalogItem> {
    const formData = new FormData();
    formData.append('file', file);

    if (onProgress) {
      return httpClient.uploadWithProgress<ObjectCatalogItem>(
        `/object-catalog/${id}/model-3d`,
        formData,
        onProgress,
        'Gagal mengunggah model 3D perabot'
      );
    }
    return httpClient.post<ObjectCatalogItem>(
      `/object-catalog/${id}/model-3d`,
      formData,
      'Gagal mengunggah model 3D perabot'
    );
  }

  public getObject3dModelUrl(id: string): string {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
    const token = tokenStorage.getToken();
    const qs = token ? `?token=${encodeURIComponent(token)}` : '';
    return `${baseUrl}/object-catalog/${id}/model-3d${qs}`;
  }
}

export const catalog3dApi = new Catalog3dApiService();
