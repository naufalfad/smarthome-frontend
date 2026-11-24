/**
 * PHASE 9: COMMERCIAL FIELD SURVEY API SERVICE
 *
 * Connects to /api/technician and /api/service-orders/admin endpoints
 * for field survey draft management, rooms inventory, electrical audit, photo uploads,
 * Super Admin revisions, and idempotent canonical property verification.
 */

import { httpClient } from './http-client';
import {
  FieldSurvey,
  SaveSurveyDraftPayload,
  SurveyPhoto,
  SurveyPhotoCategory,
  VerifySurveyResult,
} from '../types/field-survey';

class FieldSurveyApiService {
  // =========================================================================
  // TECHNICIAN SURVEY WORKSPACE ENDPOINTS
  // =========================================================================

  /**
   * Retrieves or initializes the field survey draft for an assigned job.
   */
  public async getOrCreateSurvey(assignmentId: string): Promise<FieldSurvey> {
    return httpClient.get<FieldSurvey>(
      `/technician/assignments/${assignmentId}/survey?_t=${Date.now()}`,
      'Gagal memuat draf survei lapangan'
    );
  }

  /**
   * Saves or updates field survey draft data (rooms, electrical, network, building).
   */
  public async saveSurveyDraft(
    assignmentId: string,
    payload: SaveSurveyDraftPayload
  ): Promise<FieldSurvey> {
    return httpClient.put<FieldSurvey>(
      `/technician/assignments/${assignmentId}/survey`,
      payload,
      'Gagal menyimpan draf survei'
    );
  }

  /**
   * Updates scheduled on-site survey visit date.
   */
  public async scheduleSurveyVisit(
    assignmentId: string,
    scheduledDate: string
  ): Promise<FieldSurvey> {
    return httpClient.patch<FieldSurvey>(
      `/technician/assignments/${assignmentId}/survey/schedule`,
      { scheduledDate },
      'Gagal memperbarui jadwal survei'
    );
  }

  /**
   * Uploads an internal documentation photograph for the survey.
   */
  public async uploadSurveyPhoto(
    assignmentId: string,
    file: File,
    category: SurveyPhotoCategory,
    title?: string,
    caption?: string,
    onProgress?: (percent: number) => void
  ): Promise<SurveyPhoto> {
    const formData = new FormData();
    formData.append('photo', file);
    formData.append('category', category);
    if (title && title.trim()) formData.append('title', title.trim());
    if (caption && caption.trim()) formData.append('caption', caption.trim());

    return httpClient.uploadWithProgress<SurveyPhoto>(
      `/technician/assignments/${assignmentId}/survey/photos`,
      formData,
      onProgress,
      'Gagal mengunggah foto dokumentasi survei'
    );
  }

  /**
   * Deletes a draft survey photo.
   */
  public async deleteSurveyPhoto(
    assignmentId: string,
    photoId: string
  ): Promise<void> {
    return httpClient.delete<void>(
      `/technician/assignments/${assignmentId}/survey/photos/${photoId}`,
      'Gagal menghapus foto survei'
    );
  }

  /**
   * Submits completed field survey for Super Admin review and verification.
   */
  public async submitSurvey(assignmentId: string): Promise<FieldSurvey> {
    return httpClient.post<FieldSurvey>(
      `/technician/assignments/${assignmentId}/survey/submit`,
      {},
      'Gagal mengajukan hasil survei'
    );
  }

  // =========================================================================
  // SUPER ADMIN REVIEW & VERIFICATION ENDPOINTS
  // =========================================================================

  /**
   * Super Admin: Retrieves complete survey details, room items, and photos.
   */
  public async getSurveyForAdmin(orderId: string): Promise<FieldSurvey> {
    return httpClient.get<FieldSurvey>(
      `/service-orders/admin/${orderId}/survey?_t=${Date.now()}`,
      'Gagal memuat hasil survei pesanan'
    );
  }

  /**
   * Super Admin: Requests revision on a submitted survey.
   */
  public async requestSurveyRevision(
    orderId: string,
    revisionReason: string,
    adminNotes?: string
  ): Promise<FieldSurvey> {
    return httpClient.post<FieldSurvey>(
      `/service-orders/admin/${orderId}/survey/request-revision`,
      { revisionReason, adminNotes },
      'Gagal mengirim permintaan revisi survei'
    );
  }

  /**
   * Super Admin: Verifies survey and atomically creates the canonical House entity.
   */
  public async verifySurveyAndCreateHouse(
    orderId: string,
    adminNotes?: string
  ): Promise<VerifySurveyResult> {
    return httpClient.post<VerifySurveyResult>(
      `/service-orders/admin/${orderId}/survey/verify`,
      { adminNotes },
      'Gagal memverifikasi survei dan membuat properti'
    );
  }

  /**
   * Returns authenticated stream URL or fetches photo Blob.
   */
  public getPhotoStreamUrl(photoId: string): string {
    return `${httpClient.getBaseUrl()}/surveys/photos/${photoId}`;
  }

  public async fetchPhotoBlob(photoId: string): Promise<Blob> {
    return httpClient.fetchBlob(`/surveys/photos/${photoId}`);
  }
}

export const fieldSurveyApi = new FieldSurveyApiService();
export default fieldSurveyApi;
