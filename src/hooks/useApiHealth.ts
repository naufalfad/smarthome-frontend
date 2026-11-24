import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { ApiHealthData, ConnectionStatus } from '../types/api';

export function useApiHealth() {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [data, setData] = useState<ApiHealthData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkHealth = useCallback(async () => {
    setStatus('connecting');
    setError(null);
    const start = performance.now();

    try {
      const response = await api.getHealth();
      const end = performance.now();
      setLatency(Math.round(end - start));
      setData(response.data || null);
      setStatus('online');
      setLastChecked(new Date());
    } catch (err: any) {
      setStatus('offline');
      setError(err?.message || 'Could not reach backend API server');
      setData(null);
      setLastChecked(new Date());
    }
  }, []);

  useEffect(() => {
    checkHealth();

    // Check health every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  return {
    status,
    data,
    error,
    latency,
    lastChecked,
    refresh: checkHealth,
    apiUrl: api.getBaseUrl(),
  };
}

