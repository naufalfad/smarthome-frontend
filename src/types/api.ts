export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: unknown;
  timestamp: string;
}

export interface ApiHealthData {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptimeSeconds: number;
  environment: string;
  nodeVersion: string;
  memoryUsageMb: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
  };
  system: {
    platform: string;
    cpus: number;
  };
}

export interface ApiHealthResponse extends ApiResponse<ApiHealthData> {}

export type ConnectionStatus = 'connecting' | 'online' | 'offline';

