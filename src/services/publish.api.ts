import { PublishValidationResult } from '../types/device';
import { httpClient } from './http-client';

class PublishApiService {
  public async getPublishStatus(houseId: string): Promise<PublishValidationResult> {
    return httpClient.get<PublishValidationResult>(
      `/publish/houses/${houseId}/status`,
      'Failed to check publish status'
    );
  }

  public async publishHouse(houseId: string): Promise<any> {
    return httpClient.post<any>(
      `/publish/houses/${houseId}/publish`,
      undefined,
      'Failed to publish house dashboard'
    );
  }

  public async previewHouse(houseId: string): Promise<any> {
    return httpClient.post<any>(
      `/publish/houses/${houseId}/preview`,
      undefined,
      'Failed to set preview status'
    );
  }

  public async unpublishHouse(houseId: string): Promise<any> {
    return httpClient.post<any>(
      `/publish/houses/${houseId}/unpublish`,
      undefined,
      'Failed to unpublish house'
    );
  }
}

export const publishApi = new PublishApiService();
