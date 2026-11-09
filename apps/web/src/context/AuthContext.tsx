import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { UserSummary } from '@teamos/shared';

interface AuthContextType {
  user: UserSummary | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, confirmPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('teamos_access_token');
      if (token) {
        try {
          const res = await apiClient.get('/auth/me');
          setUser(res.data);
        } catch (err) {
          localStorage.removeItem('teamos_access_token');
          localStorage.removeItem('teamos_refresh_token');
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiClient.post('/auth/login', { email, password });
    localStorage.setItem('teamos_access_token', res.data.accessToken);
    if (res.data.refreshToken) {
      localStorage.setItem('teamos_refresh_token', res.data.refreshToken);
    }
    setUser(res.data.user);
  };

  const register = async (name: string, email: string, password: string, confirmPassword: string) => {
    const res = await apiClient.post('/auth/register', { name, email, password, confirmPassword });
    localStorage.setItem('teamos_access_token', res.data.accessToken);
    if (res.data.refreshToken) {
      localStorage.setItem('teamos_refresh_token', res.data.refreshToken);
    }
    setUser(res.data.user);
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('teamos_refresh_token');
    try {
      await apiClient.post('/auth/logout', { refreshToken });
    } catch (e) {
      // Ignore network errors during logout
    } finally {
      localStorage.removeItem('teamos_access_token');
      localStorage.removeItem('teamos_refresh_token');
      localStorage.removeItem('teamos_active_workspace_id');
      setUser(null);
      window.location.href = '/login';
    }
  };

  const updateUser = async (name: string) => {
    const res = await apiClient.patch('/auth/profile', { name });
    setUser(res.data);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

