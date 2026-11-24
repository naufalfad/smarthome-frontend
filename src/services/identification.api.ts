import {
  NodeIdentificationRecord,
  IdentificationOverviewSummary,
  UpsertIdentificationPayload,
  BulkConfirmPayload,
  BulkPreviewResponse,
  RevalidationReport,
  IdentifiedNodeType,
  IdentificationStatus,
} from '../types/identification';
import { httpClient } from './http-client';

class IdentificationApiService {
  public async getOverview(houseModelId: string): Promise<IdentificationOverviewSummary> {
    return httpClient.get<IdentificationOverviewSummary>(
      `/house-models/${houseModelId}/identifications/overview`,
      'Failed to fetch identification overview'
    );
  }

  public async getIdentifications(
    houseModelId: string,
    filters?: {
      nodeType?: IdentifiedNodeType;
      status?: IdentificationStatus;
      parentRoom?: string;
      parentFloor?: string;
      search?: string;
    }
  ): Promise<NodeIdentificationRecord[]> {
    const query = new URLSearchParams();
    if (filters?.nodeType) query.set('nodeType', filters.nodeType);
    if (filters?.status) query.set('status', filters.status);
    if (filters?.parentRoom) query.set('parentRoom', filters.parentRoom);
    if (filters?.parentFloor) query.set('parentFloor', filters.parentFloor);
    if (filters?.search) query.set('search', filters.search);

    const qs = query.toString() ? `?${query.toString()}` : '';
    const data = await httpClient.get<NodeIdentificationRecord[]>(
      `/house-models/${houseModelId}/identifications${qs}`,
      'Failed to fetch identifications'
    );
    return data || [];
  }

  public async getTree(houseModelId: string): Promise<any[]> {
    const data = await httpClient.get<any[]>(
      `/house-models/${houseModelId}/identifications/tree`,
      'Failed to fetch identification tree'
    );
    return data || [];
  }

  public async getByNode(houseModelId: string, nodeName: string): Promise<NodeIdentificationRecord> {
    return httpClient.get<NodeIdentificationRecord>(
      `/house-models/${houseModelId}/identifications/${encodeURIComponent(nodeName)}`,
      `Failed to fetch identification for node '${nodeName}'`
    );
  }

  public async upsert(
    houseModelId: string,
    payload: UpsertIdentificationPayload
  ): Promise<NodeIdentificationRecord> {
    return httpClient.post<NodeIdentificationRecord>(
      `/house-models/${houseModelId}/identifications`,
      payload,
      'Failed to save identification'
    );
  }

  public async bulkPreview(
    houseModelId: string,
    payload: BulkConfirmPayload
  ): Promise<BulkPreviewResponse> {
    return httpClient.post<BulkPreviewResponse>(
      `/house-models/${houseModelId}/identifications/bulk`,
      { ...payload, previewOnly: true },
      'Failed to generate bulk identification preview'
    );
  }

  public async bulkConfirm(
    houseModelId: string,
    payload: BulkConfirmPayload
  ): Promise<{ success: boolean; updatedCount: number }> {
    return httpClient.post<{ success: boolean; updatedCount: number }>(
      `/house-models/${houseModelId}/identifications/bulk`,
      { ...payload, previewOnly: false },
      'Failed to apply bulk identification'
    );
  }

  public async revalidate(houseModelId: string): Promise<RevalidationReport> {
    return httpClient.post<RevalidationReport>(
      `/house-models/${houseModelId}/identifications/revalidate`,
      undefined,
      'Failed to revalidate GLB identifications'
    );
  }
}

export const identificationApi = new IdentificationApiService();
