/**
 * PHASE 1: SHARED AUTHENTICATED HTTP TRANSPORT CLIENT
 *
 * Centralizes:
 * - Dynamic Authorization: Bearer <token> header injection
 * - Token & user storage access (single source of truth)
 * - Consistent 401 Unauthorized handling (anti-loop, debounced)
 * - Consistent 403 Forbidden handling (non-destructive: preserves token)
 * - Safe network error handling (never clears token on network errors)
 * - JSON, FormData multipart, XMLHttpRequest upload progress, and binary Blob streams
 */

import { AuthUser } from '../types/auth';

export const API_BASE_URL = (
  (import.meta as any)?.env?.VITE_API_BASE_URL || 'http://localhost:5000/api'
).replace(/\/+$/, '');

const TOKEN_KEY = 'smarthome_auth_token';
const USER_KEY = 'smarthome_auth_user';

export class HttpError extends Error {
  public readonly status: number;
  public readonly data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.data = data;
  }
}

export interface HttpRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  skipAuth?: boolean;
  signal?: AbortSignal;
}

type UnauthorizedCallback = (reason?: string) => void;
type ForbiddenCallback = (message: string) => void;

export const tokenStorage = {
  getToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  setToken(token: string): void {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // Ignore storage quota / private mode errors
    }
  },

  getUser(): AuthUser | null {
    try {
      const data = localStorage.getItem(USER_KEY);
      return data ? (JSON.parse(data) as AuthUser) : null;
    } catch {
      return null;
    }
  },

  setUser(user: AuthUser): void {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch {
      // Ignore storage errors
    }
  },

  clear(): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {
      // Ignore storage errors
    }
  },
};

class SharedHttpClient {
  private baseUrl: string;
  private onUnauthorized: UnauthorizedCallback | null = null;
  private onForbidden: ForbiddenCallback | null = null;
  private unauthorizedDispatchInFlight = false;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public resolveUrl(pathOrUrl: string): string {
    if (/^https?:\/\//i.test(pathOrUrl)) {
      return pathOrUrl;
    }
    const cleanPath = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
    return `${this.baseUrl}${cleanPath}`;
  }

  public setOnUnauthorized(cb: UnauthorizedCallback | null): void {
    this.onUnauthorized = cb;
  }

  public setOnForbidden(cb: ForbiddenCallback | null): void {
    this.onForbidden = cb;
  }

  /**
   * Resets the unauthorized dispatch guard (called after a fresh successful login)
   */
  public resetUnauthorizedGuard(): void {
    this.unauthorizedDispatchInFlight = false;
  }

  public buildAuthHeaders(
    extraHeaders: Record<string, string> = {},
    skipAuth = false,
    isFormData = false
  ): Record<string, string> {
    const headers: Record<string, string> = { ...extraHeaders };

    // Never manually set Content-Type for FormData so browser computes multipart boundary
    if (!isFormData && !headers['Content-Type'] && !headers['content-type']) {
      headers['Content-Type'] = 'application/json';
    }

    if (!skipAuth) {
      const token = tokenStorage.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private handleStatusPolicy(status: number, message: string, skipAuth = false): void {
    if (status === 401 && !skipAuth) {
      // Guard against multiple concurrent requests triggering duplicate session clears/redirects
      if (!this.unauthorizedDispatchInFlight) {
        this.unauthorizedDispatchInFlight = true;
        tokenStorage.clear();
        if (this.onUnauthorized) {
          this.onUnauthorized(message);
        }
        // Release guard after a short window so future sessions behave normally
        setTimeout(() => {
          this.unauthorizedDispatchInFlight = false;
        }, 1500);
      }
      return;
    }

    if (status === 403 && !skipAuth) {
      // 403 Forbidden MUST NOT clear the token — user is authenticated, just lacks permission
      if (this.onForbidden) {
        this.onForbidden(message);
      }
    }
  }

  /**
   * Low-level fetch wrapper that injects Bearer token and handles 401/403 consistently.
   * Never clears tokens on transient network failures.
   */
  public async requestRaw(
    pathOrUrl: string,
    options: HttpRequestOptions = {}
  ): Promise<Response> {
    const { method = 'GET', body, headers: extraHeaders, skipAuth = false, signal } = options;
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    const headers = this.buildAuthHeaders(extraHeaders, skipAuth, isFormData);

    const fetchOptions: RequestInit = {
      method,
      headers,
      signal,
    };

    if (body !== undefined && method !== 'GET') {
      fetchOptions.body = isFormData
        ? (body as FormData)
        : typeof body === 'string'
        ? body
        : JSON.stringify(body);
    }

    // Note: fetch() rejection (network offline/DNS/CORS) propagates directly WITHOUT clearing token
    return fetch(this.resolveUrl(pathOrUrl), fetchOptions);
  }

  /**
   * Executes an HTTP request and parses the full JSON envelope.
   * Throws HttpError on non-2xx responses or `{ success: false }`.
   */
  public async requestEnvelope<T = any>(
    pathOrUrl: string,
    options: HttpRequestOptions = {},
    fallbackError = 'Permintaan ke server gagal diproses'
  ): Promise<T> {
    const res = await this.requestRaw(pathOrUrl, options);

    let json: any = null;
    try {
      json = await res.json();
    } catch {
      // Response had empty or non-JSON body
    }

    if (!res.ok || (json && json.success === false)) {
      const errorMsg =
        json?.message ||
        (typeof json?.error === 'string' ? json.error : null) ||
        `${fallbackError} (HTTP ${res.status})`;

      this.handleStatusPolicy(res.status, errorMsg, options.skipAuth);
      throw new HttpError(errorMsg, res.status, json);
    }

    return json as T;
  }

  /**
   * Executes an HTTP request and unwraps `json.data` from standard ApiResponse envelopes.
   */
  public async requestData<T = any>(
    pathOrUrl: string,
    options: HttpRequestOptions = {},
    fallbackError = 'Permintaan ke server gagal diproses'
  ): Promise<T> {
    const envelope = await this.requestEnvelope<{ success: boolean; data: T; message?: string }>(
      pathOrUrl,
      options,
      fallbackError
    );
    return envelope.data;
  }

  public get<T = any>(
    pathOrUrl: string,
    fallbackError?: string,
    options?: Omit<HttpRequestOptions, 'method' | 'body'>
  ): Promise<T> {
    return this.requestData<T>(pathOrUrl, { ...options, method: 'GET' }, fallbackError);
  }

  public post<T = any>(
    pathOrUrl: string,
    body?: unknown,
    fallbackError?: string,
    options?: Omit<HttpRequestOptions, 'method' | 'body'>
  ): Promise<T> {
    return this.requestData<T>(pathOrUrl, { ...options, method: 'POST', body }, fallbackError);
  }

  public put<T = any>(
    pathOrUrl: string,
    body?: unknown,
    fallbackError?: string,
    options?: Omit<HttpRequestOptions, 'method' | 'body'>
  ): Promise<T> {
    return this.requestData<T>(pathOrUrl, { ...options, method: 'PUT', body }, fallbackError);
  }

  public patch<T = any>(
    pathOrUrl: string,
    body?: unknown,
    fallbackError?: string,
    options?: Omit<HttpRequestOptions, 'method' | 'body'>
  ): Promise<T> {
    return this.requestData<T>(pathOrUrl, { ...options, method: 'PATCH', body }, fallbackError);
  }

  public delete<T = any>(
    pathOrUrl: string,
    fallbackError?: string,
    options?: Omit<HttpRequestOptions, 'method' | 'body'>
  ): Promise<T> {
    return this.requestData<T>(pathOrUrl, { ...options, method: 'DELETE' }, fallbackError);
  }

  /**
   * Fetches a binary resource (e.g. floor plan image or GLB model) with Bearer authentication.
   */
  public async fetchBlob(
    pathOrUrl: string,
    signal?: AbortSignal
  ): Promise<Blob> {
    const res = await this.requestRaw(pathOrUrl, {
      method: 'GET',
      headers: { Accept: '*/*' },
      signal,
    });

    if (!res.ok) {
      let errorMsg = `Gagal memuat berkas (HTTP ${res.status})`;
      try {
        const json = await res.json();
        if (json?.message) errorMsg = json.message;
      } catch {
        // Non-JSON error body
      }
      this.handleStatusPolicy(res.status, errorMsg, false);
      throw new HttpError(errorMsg, res.status);
    }

    return res.blob();
  }

  /**
   * Uploads FormData using XMLHttpRequest with Bearer Token and real-time upload progress.
   */
  public uploadWithProgress<T = any>(
    pathOrUrl: string,
    formData: FormData,
    onProgress?: (percent: number) => void,
    fallbackError = 'Gagal mengunggah berkas'
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', this.resolveUrl(pathOrUrl));

      const token = tokenStorage.getToken();
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      if (onProgress && xhr.upload) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        try {
          const response = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300 && response?.success) {
            resolve(response.data as T);
          } else {
            const msg = response?.message || `${fallbackError} (HTTP ${xhr.status})`;
            this.handleStatusPolicy(xhr.status, msg, false);
            reject(new HttpError(msg, xhr.status, response));
          }
        } catch (err: any) {
          reject(new HttpError(`Gagal memproses respons server: ${err?.message || err}`, xhr.status));
        }
      };

      xhr.onerror = () => {
        // Network error — do NOT clear stored token
        reject(new Error('Kesalahan jaringan terjadi saat mengunggah berkas'));
      };

      xhr.send(formData);
    });
  }
}

export const httpClient = new SharedHttpClient(API_BASE_URL);
