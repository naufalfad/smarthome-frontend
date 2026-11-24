import { ApiHealthResponse, ApiResponse } from '../types/api';
import { httpClient } from './http-client';

class ApiService {
  public getBaseUrl(): string {
    return httpClient.getBaseUrl();
  }

  /**
   * Public health check endpoint: GET /api/health
   */
  public async getHealth(): Promise<ApiHealthResponse> {
    return httpClient.requestEnvelope<ApiHealthResponse>(
      '/health',
      { method: 'GET', skipAuth: true },
      'Health check failed'
    );
  }

  /**
   * Authenticated database connectivity check: GET /api/health/db
   */
  public async getDbHealth(): Promise<ApiResponse> {
    return httpClient.requestEnvelope<ApiResponse>(
      '/health/db',
      { method: 'GET' },
      'Database health check failed'
    );
  }
}

export const api = new ApiService();
