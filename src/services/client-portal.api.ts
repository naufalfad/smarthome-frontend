import { ClientDashboardData, IoTDevice } from '../types/device';
import { httpClient } from './http-client';

class ClientPortalApiService {
  public async getDashboard(houseId: string): Promise<ClientDashboardData> {
    return httpClient.get<ClientDashboardData>(
      `/client/houses/${houseId}`,
      'Failed to load client dashboard'
    );
  }

  public async controlDevice(
    houseId: string,
    deviceId: string,
    command: { action: string; payload?: any }
  ): Promise<IoTDevice> {
    return httpClient.post<IoTDevice>(
      `/client/houses/${houseId}/devices/${deviceId}/control`,
      command,
      'Failed to control device'
    );
  }
}

export const clientPortalApi = new ClientPortalApiService();
