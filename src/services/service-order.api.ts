/**
 * PHASE 7: COMMERCIAL SERVICE ORDER API CLIENT
 * Connects to Customer order submission & lifecycle endpoints and
 * Super Admin review & decision endpoints.
 */

import { httpClient } from './http-client';
import {
  ServiceOrder,
  SubmitOrderPayload,
  CancelOrderPayload,
  AdminConfirmOrderPayload,
  AdminRejectOrderPayload,
  PaginatedOrdersResponse,
  ServiceOrderStatus,
} from '../types/service-order';

class ServiceOrderApiService {
  // =========================================================================
  // CUSTOMER ORDER APIS (/api/service-orders/...)
  // =========================================================================

  public async submitOrder(payload: SubmitOrderPayload): Promise<ServiceOrder> {
    return httpClient.post<ServiceOrder>(
      '/service-orders',
      payload,
      'Gagal mengajukan pesanan layanan'
    );
  }

  public async getMyOrders(options?: {
    status?: ServiceOrderStatus;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedOrdersResponse> {
    const params = new URLSearchParams();
    if (options?.status) params.append('status', options.status);
    if (options?.search && options.search.trim()) params.append('search', options.search.trim());
    if (options?.page) params.append('page', String(options.page));
    if (options?.limit) params.append('limit', String(options.limit));
    params.append('_t', String(Date.now()));

    const qs = `?${params.toString()}`;
    const envelope = await httpClient.requestEnvelope<{
      success: boolean;
      data: ServiceOrder[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
      message?: string;
    }>(`/service-orders${qs}`, { method: 'GET' }, 'Gagal mengambil riwayat pesanan');

    return {
      items: envelope.data || [],
      pagination: envelope.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 },
    };
  }

  public async getMyOrderById(id: string): Promise<ServiceOrder> {
    return httpClient.get<ServiceOrder>(
      `/service-orders/${id}?_t=${Date.now()}`,
      'Gagal mengambil detail pesanan'
    );
  }

  public async cancelMyOrder(id: string, payload?: CancelOrderPayload): Promise<ServiceOrder> {
    return httpClient.patch<ServiceOrder>(
      `/service-orders/${id}/cancel`,
      payload || {},
      'Gagal membatalkan pesanan layanan'
    );
  }

  // =========================================================================
  // SUPER ADMIN ORDER APIS (/api/service-orders/admin/...)
  // =========================================================================

  public async getAdminOrders(options?: {
    status?: ServiceOrderStatus;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedOrdersResponse> {
    const params = new URLSearchParams();
    if (options?.status) params.append('status', options.status);
    if (options?.search && options.search.trim()) params.append('search', options.search.trim());
    if (options?.page) params.append('page', String(options.page));
    if (options?.limit) params.append('limit', String(options.limit));
    params.append('_t', String(Date.now()));

    const qs = `?${params.toString()}`;
    const envelope = await httpClient.requestEnvelope<{
      success: boolean;
      data: ServiceOrder[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
      message?: string;
    }>(`/service-orders/admin/all${qs}`, { method: 'GET' }, 'Gagal mengambil daftar pesanan');

    return {
      items: envelope.data || [],
      pagination: envelope.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 },
    };
  }

  public async getAdminOrderById(id: string): Promise<ServiceOrder> {
    return httpClient.get<ServiceOrder>(
      `/service-orders/admin/${id}?_t=${Date.now()}`,
      'Gagal mengambil detail pesanan admin'
    );
  }

  public async confirmOrder(id: string, payload?: AdminConfirmOrderPayload): Promise<ServiceOrder> {
    return httpClient.patch<ServiceOrder>(
      `/service-orders/admin/${id}/confirm`,
      payload || {},
      'Gagal mengonfirmasi pesanan layanan'
    );
  }

  public async rejectOrder(id: string, payload: AdminRejectOrderPayload): Promise<ServiceOrder> {
    return httpClient.patch<ServiceOrder>(
      `/service-orders/admin/${id}/reject`,
      payload,
      'Gagal menolak pesanan layanan'
    );
  }

  // =========================================================================
  // PHASE 8: DISPATCH & TECHNICIAN ASSIGNMENT APIS
  // =========================================================================

  public async listTechnicians(): Promise<import('../types/service-order').TechnicianSummaryDTO[]> {
    return httpClient.get<import('../types/service-order').TechnicianSummaryDTO[]>(
      `/service-orders/admin/technicians?_t=${Date.now()}`,
      'Gagal memuat daftar teknisi'
    );
  }

  public async updateTechnicianAvailability(
    technicianProfileId: string,
    availabilityStatus: import('../types/service-order').TechnicianAvailabilityStatus
  ): Promise<import('../types/service-order').TechnicianSummaryDTO> {
    return httpClient.patch<import('../types/service-order').TechnicianSummaryDTO>(
      `/service-orders/admin/technicians/${technicianProfileId}/availability`,
      { availabilityStatus },
      'Gagal memperbarui status ketersediaan teknisi'
    );
  }

  public async assignTechnician(
    serviceOrderId: string,
    payload: import('../types/service-order').AssignTechnicianPayload
  ): Promise<any> {
    return httpClient.post<any>(
      `/service-orders/admin/${serviceOrderId}/assign`,
      payload,
      'Gagal menugaskan teknisi pada pesanan'
    );
  }

  public async reassignTechnician(
    serviceOrderId: string,
    payload: import('../types/service-order').ReassignTechnicianPayload
  ): Promise<any> {
    return httpClient.post<any>(
      `/service-orders/admin/${serviceOrderId}/reassign`,
      payload,
      'Gagal mengalihkan penugasan teknisi'
    );
  }

  public async getOrderAssignmentHistory(
    serviceOrderId: string
  ): Promise<import('../types/service-order').ServiceOrderAssignmentItem[]> {
    return httpClient.get<import('../types/service-order').ServiceOrderAssignmentItem[]>(
      `/service-orders/admin/${serviceOrderId}/assignments?_t=${Date.now()}`,
      'Gagal mengambil riwayat penugasan teknisi'
    );
  }

  // =========================================================================
  // PHASE 11: HANDOVER & PROPERTY ACTIVATION APIS
  // =========================================================================

  public async activateOrder(
    serviceOrderId: string,
    payload?: { adminNotes?: string }
  ): Promise<any> {
    return httpClient.post<any>(
      `/service-orders/admin/${serviceOrderId}/activate`,
      payload || {},
      'Gagal melakukan aktivasi dan serah terima properti'
    );
  }
}

export const serviceOrderApi = new ServiceOrderApiService();
export default serviceOrderApi;
