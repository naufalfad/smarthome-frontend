import { useState, useEffect } from 'react';
import { httpClient } from '../services/http-client';

interface AuthenticatedBlobResult {
  blobUrl: string | null;
  loading: boolean;
  error: string | null;
}

/**
 * Fetches a protected binary asset (floor plan image, 3D GLB model, etc.)
 * using the shared authenticated httpClient and exposes a safe object URL
 * with automatic abort and memory cleanup.
 */
export function useAuthenticatedBlobUrl(sourceUrl: string | null | undefined): AuthenticatedBlobResult {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sourceUrl) {
      setBlobUrl(null);
      setLoading(false);
      setError(null);
      return;
    }

    // If already a local blob or data URL, use directly
    if (sourceUrl.startsWith('blob:') || sourceUrl.startsWith('data:')) {
      setBlobUrl(sourceUrl);
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    let activeObjectUrl: string | null = null;
    let isMounted = true;

    setLoading(true);
    setError(null);

    httpClient
      .fetchBlob(sourceUrl, controller.signal)
      .then((blob) => {
        if (!isMounted) return;
        activeObjectUrl = URL.createObjectURL(blob);
        setBlobUrl(activeObjectUrl);
        setLoading(false);
      })
      .catch((err: any) => {
        if (!isMounted || err?.name === 'AbortError') return;
        setBlobUrl(null);
        setError(err?.message || 'Gagal memuat berkas media');
        setLoading(false);
      });

    return () => {
      isMounted = false;
      controller.abort();
      if (activeObjectUrl) {
        URL.revokeObjectURL(activeObjectUrl);
      }
    };
  }, [sourceUrl]);

  return { blobUrl, loading, error };
}
