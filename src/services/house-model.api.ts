import {
  HouseModel,
  HouseModelsListResponse,
  GlbInspectionResult,
  ModelStatus,
} from '../types/house-model';
import { httpClient } from './http-client';

class HouseModelApiService {
  /**
   * Returns streaming URL for the model's GLB binary
   */
  public getModelFileUrl(id: string): string {
    return httpClient.resolveUrl(`/house-models/${id}/file`);
  }

  /**
   * Retrieves paginated list of house models
   */
  public async getHouseModels(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: ModelStatus;
  } = {}): Promise<HouseModelsListResponse> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.search) query.set('search', params.search);
    if (params.status) query.set('status', params.status);

    const qs = query.toString() ? `?${query.toString()}` : '';
    return httpClient.get<HouseModelsListResponse>(
      `/house-models${qs}`,
      'Failed to fetch house models'
    );
  }

  /**
   * Retrieves single model details
   */
  public async getHouseModelById(id: string): Promise<HouseModel> {
    return httpClient.get<HouseModel>(
      `/house-models/${id}`,
      `Failed to fetch house model with id ${id}`
    );
  }

  /**
   * Uploads new GLB model with Bearer auth and real-time progress callback
   */
  public uploadHouseModel(
    name: string,
    description: string,
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<HouseModel> {
    const formData = new FormData();
    formData.append('name', name);
    if (description) formData.append('description', description);
    formData.append('file', file);

    return httpClient.uploadWithProgress<HouseModel>(
      '/house-models',
      formData,
      onProgress,
      'Failed to upload 3D GLB model'
    );
  }

  /**
   * Updates model information
   */
  public async updateHouseModel(
    id: string,
    data: { name?: string; description?: string; status?: ModelStatus }
  ): Promise<HouseModel> {
    return httpClient.patch<HouseModel>(
      `/house-models/${id}`,
      data,
      'Failed to update house model'
    );
  }

  /**
   * Deletes model and file
   */
  public async deleteHouseModel(id: string): Promise<void> {
    await httpClient.delete(`/house-models/${id}`, 'Failed to delete house model');
  }

  /**
   * Triggers re-inspection of model file
   */
  public async reinspectHouseModel(
    id: string
  ): Promise<{ model: HouseModel; inspection: GlbInspectionResult }> {
    return httpClient.post<{ model: HouseModel; inspection: GlbInspectionResult }>(
      `/house-models/${id}/inspect`,
      undefined,
      'Failed to re-inspect model'
    );
  }
}

export const houseModelApi = new HouseModelApiService();
