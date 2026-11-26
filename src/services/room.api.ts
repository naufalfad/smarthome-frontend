import { Room, PolygonPoint, FloorPlanObject } from '../types/floor-plan';
import { httpClient } from './http-client';

class RoomApiService {
  public async getRoomsByFloor(floorId: string): Promise<Room[]> {
    return httpClient.get<Room[]>(`/floors/${floorId}/rooms`, 'Failed to fetch rooms');
  }

  public async createRoom(
    floorId: string,
    data: {
      name: string;
      type?: string;
      color?: string;
      polygonCoordinates?: PolygonPoint[];
      ceilingHeight?: number;
    }
  ): Promise<Room> {
    return httpClient.post<Room>(`/floors/${floorId}/rooms`, data, 'Failed to create room');
  }

  public async getRoomById(id: string): Promise<Room> {
    return httpClient.get<Room>(`/rooms/${id}`, 'Failed to fetch room');
  }

  public async updateRoom(id: string, data: Partial<Room>): Promise<Room> {
    return httpClient.patch<Room>(`/rooms/${id}`, data, 'Failed to update room');
  }

  public async updateRoomPolygon(
    id: string,
    polygonCoordinates: PolygonPoint[]
  ): Promise<{
    room: Room;
    areaPx: number;
    areaSquareMeters: number | null;
    orphanedObjects: any[];
    hasOrphanedObjects: boolean;
  }> {
    return httpClient.patch(
      `/rooms/${id}/polygon`,
      { polygonCoordinates },
      'Failed to update room polygon'
    );
  }

  public async updateRoomColor(id: string, color: string): Promise<Room> {
    return httpClient.patch<Room>(
      `/rooms/${id}/color`,
      { color },
      'Failed to update room color'
    );
  }

  public async deleteRoom(id: string): Promise<void> {
    await httpClient.delete(`/rooms/${id}`, 'Failed to delete room');
  }

  public async assignObjectToRoom(
    floorPlanId: string,
    objectId: string,
    roomId: string | null
  ): Promise<FloorPlanObject> {
    return httpClient.patch<FloorPlanObject>(
      `/floor-plans/${floorPlanId}/objects/${objectId}/room`,
      { roomId },
      'Failed to assign object to room'
    );
  }

  public async detectSpatialRooms(floorPlanId: string): Promise<{
    floorPlanId: string;
    totalObjects: number;
    detections: Array<{
      objectId: string;
      objectName: string;
      category: string;
      center: PolygonPoint;
      currentRoomId: string | null;
      detectedRoomId: string | null;
      detectedRoomName: string | null;
      isMatched: boolean;
    }>;
  }> {
    return httpClient.get(
      `/floor-plans/${floorPlanId}/spatial-detect`,
      'Failed to detect spatial rooms'
    );
  }
}

export const roomApi = new RoomApiService();
