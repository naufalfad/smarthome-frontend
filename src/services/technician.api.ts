/**
 * PHASE 8: TECHNICIAN WORKSPACE API CLIENT
 * Connects to /api/technician endpoints for authenticated technicians.
 */

import { httpClient } from './http-client';
import { TechnicianWorkAssignment } from '../types/service-order';

class TechnicianApiService {
  public async getMyAssignments(): Promise<TechnicianWorkAssignment[]> {
    return httpClient.get<TechnicianWorkAssignment[]>(
      `/technician/assignments?_t=${Date.now()}`,
      'Gagal memuat daftar tugas teknisi'
    );
  }

  public async getMyAssignmentDetail(assignmentId: string): Promise<TechnicianWorkAssignment> {
    return httpClient.get<TechnicianWorkAssignment>(
      `/technician/assignments/${assignmentId}?_t=${Date.now()}`,
      'Gagal memuat detail tugas teknisi'
    );
  }
}

export const technicianApi = new TechnicianApiService();
export default technicianApi;
