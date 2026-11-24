import { AuthUser, LoginResponse, RegisterPayload } from '../types/auth';
import { httpClient, tokenStorage } from './http-client';

export class AuthApiService {
  public getStoredToken(): string | null {
    return tokenStorage.getToken();
  }

  public setStoredToken(token: string): void {
    tokenStorage.setToken(token);
  }

  public getStoredUser(): AuthUser | null {
    return tokenStorage.getUser();
  }

  public setStoredUser(user: AuthUser): void {
    tokenStorage.setUser(user);
  }

  public clearStorage(): void {
    tokenStorage.clear();
  }

  public getAuthHeaders(): Record<string, string> {
    return httpClient.buildAuthHeaders({}, false, false);
  }

  /**
   * Unified login: accepts Customer Email or Staff Username + password (public, skipAuth = true)
   */
  public async login(identifier: string, password: string): Promise<LoginResponse> {
    const data = await httpClient.post<LoginResponse>(
      '/auth/login',
      { identifier: identifier.trim(), password },
      'Gagal masuk ke sistem',
      { skipAuth: true }
    );

    this.setStoredToken(data.token);
    this.setStoredUser(data.user);
    httpClient.resetUnauthorizedGuard();

    return data;
  }

  /**
   * Public Customer self-registration via Email + Password (server strictly assigns CUSTOMER role)
   */
  public async register(payload: RegisterPayload): Promise<LoginResponse> {
    const data = await httpClient.post<LoginResponse>(
      '/auth/register',
      {
        name: payload.name.trim(),
        email: payload.email.trim().toLowerCase(),
        password: payload.password,
        ...(payload.phone?.trim() ? { phone: payload.phone.trim() } : {}),
      },
      'Gagal mendaftarkan akun Customer',
      { skipAuth: true }
    );

    this.setStoredToken(data.token);
    this.setStoredUser(data.user);
    httpClient.resetUnauthorizedGuard();

    return data;
  }

  /**
   * Fetches current authenticated user profile
   */
  public async getMe(): Promise<AuthUser> {
    const token = this.getStoredToken();
    if (!token) {
      throw new Error('Sesi belum terotentikasi');
    }

    const profile = await httpClient.get<AuthUser>('/auth/me', 'Sesi telah berakhir');
    this.setStoredUser(profile);
    return profile;
  }

  /**
   * Clears session locally and notifies backend
   */
  public async logout(): Promise<void> {
    try {
      await httpClient.post('/auth/logout', undefined, 'Logout gagal', { skipAuth: true });
    } catch {
      // Always clear local storage even if network logout fails
    }
    this.clearStorage();
  }
}

export const authApi = new AuthApiService();
