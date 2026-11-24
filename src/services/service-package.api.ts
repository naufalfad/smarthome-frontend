/**
 * PHASE 6: SERVICE PACKAGE API CLIENT
 * Connects to Super Admin package management and Customer package catalog endpoints.
 */

import { httpClient } from './http-client';
import {
  ServicePackage,
  CreatePackagePayload,
  UpdatePackagePayload,
  PackageStatus,
} from '../types/service-package';

class ServicePackageApiService {
  // =========================================================================
  // SUPER ADMIN MANAGEMENT APIs
  // =========================================================================

  public async getAdminPackages(options?: {
    status?: PackageStatus;
    search?: string;
    hasPhysicalIot?: boolean;
    hasThreeD?: boolean;
  }): Promise<ServicePackage[]> {
    const params = new URLSearchParams();
    if (options?.status) params.append('status', options.status);
    if (options?.search && options.search.trim()) params.append('search', options.search.trim());
    if (options?.hasPhysicalIot !== undefined) params.append('hasPhysicalIot', String(options.hasPhysicalIot));
    if (options?.hasThreeD !== undefined) params.append('hasThreeD', String(options.hasThreeD));
    params.append('_t', String(Date.now()));

    const qs = `?${params.toString()}`;
    return httpClient.get<ServicePackage[]>(`/service-packages${qs}`, 'Gagal mengambil daftar paket layanan');
  }

  public async getAdminPackageById(id: string): Promise<ServicePackage> {
    return httpClient.get<ServicePackage>(
      `/service-packages/${id}?_t=${Date.now()}`,
      'Gagal mengambil detail paket layanan'
    );
  }

  public async createPackage(payload: CreatePackagePayload): Promise<ServicePackage> {
    return httpClient.post<ServicePackage>('/service-packages', payload, 'Gagal membuat paket layanan baru');
  }

  public async updatePackage(id: string, payload: UpdatePackagePayload): Promise<ServicePackage> {
    return httpClient.put<ServicePackage>(`/service-packages/${id}`, payload, 'Gagal memperbarui paket layanan');
  }

  public async activatePackage(id: string): Promise<ServicePackage> {
    return httpClient.patch<ServicePackage>(`/service-packages/${id}/activate`, {}, 'Gagal mengaktifkan paket layanan');
  }

  public async deactivatePackage(id: string): Promise<ServicePackage> {
    return httpClient.patch<ServicePackage>(`/service-packages/${id}/deactivate`, {}, 'Gagal menonaktifkan paket layanan');
  }

  public async archivePackage(id: string): Promise<ServicePackage> {
    return httpClient.patch<ServicePackage>(`/service-packages/${id}/archive`, {}, 'Gagal mengarsipkan paket layanan');
  }

  public async deletePackage(id: string): Promise<{ success: boolean; message: string }> {
    return httpClient.delete<{ success: boolean; message: string }>(`/service-packages/${id}`, 'Gagal menghapus paket layanan');
  }

  // =========================================================================
  // CUSTOMER CATALOG APIs (ACTIVE PACKAGES ONLY)
  // =========================================================================

  public async getCatalogPackages(): Promise<ServicePackage[]> {
    return httpClient.get<ServicePackage[]>(
      `/catalog/packages?_t=${Date.now()}`,
      'Gagal memuat katalog paket layanan'
    );
  }

  public async getCatalogPackageById(idOrSlug: string): Promise<ServicePackage> {
    return httpClient.get<ServicePackage>(
      `/catalog/packages/${idOrSlug}?_t=${Date.now()}`,
      'Gagal memuat rincian paket layanan'
    );
  }
}

export const servicePackageApi = new ServicePackageApiService();
