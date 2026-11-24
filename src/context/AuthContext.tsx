import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthUser, UserRole, RegisterPayload } from '../types/auth';
import { authApi } from '../services/auth.api';
import { httpClient, HttpError } from '../services/http-client';

interface AuthContextType {
  user: AuthUser | null;
  role: UserRole | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authNotice: string | null;
  clearAuthNotice: () => void;
  login: (identifier: string, password: string) => Promise<AuthUser>;
  register: (payload: RegisterPayload) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => authApi.getStoredUser());
  const [token, setToken] = useState<string | null>(() => authApi.getStoredToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  // Register global 401 & 403 handlers on shared HTTP client
  useEffect(() => {
    httpClient.setOnUnauthorized((reason) => {
      setUser(null);
      setToken(null);
      if (reason) {
        setAuthNotice(reason);
      }
    });

    httpClient.setOnForbidden((message) => {
      // Do NOT clear session on 403 Forbidden; surface permission notice safely
      setAuthNotice(message);
    });

    return () => {
      httpClient.setOnUnauthorized(null);
      httpClient.setOnForbidden(null);
    };
  }, []);

  // Initialize and verify stored session on mount (preserves session across page refresh)
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = authApi.getStoredToken();
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const profile = await authApi.getMe();
        setUser(profile);
        setToken(storedToken);
      } catch (err) {
        // Only clear stored session on explicit 401 Unauthorized;
        // preserve session on transient network errors
        if (err instanceof HttpError && err.status === 401) {
          setUser(null);
          setToken(null);
          authApi.clearStorage();
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = useCallback(async (identifier: string, password: string): Promise<AuthUser> => {
    setIsLoading(true);
    setAuthNotice(null);
    try {
      const { user: loggedInUser, token: authToken } = await authApi.login(identifier, password);
      setUser(loggedInUser);
      setToken(authToken);
      return loggedInUser;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (payload: RegisterPayload): Promise<AuthUser> => {
    setIsLoading(true);
    setAuthNotice(null);
    try {
      const { user: registeredUser, token: authToken } = await authApi.register(payload);
      setUser(registeredUser);
      setToken(authToken);
      return registeredUser;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    authApi.logout();
    setUser(null);
    setToken(null);
    setAuthNotice(null);
  }, []);

  const clearAuthNotice = useCallback(() => {
    setAuthNotice(null);
  }, []);

  const value: AuthContextType = {
    user,
    role: user?.role || null,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    authNotice,
    clearAuthNotice,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
