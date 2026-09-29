import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Organization, LoginPayload, RegisterPayload } from '../types';
import { api, getStoredToken, clearStoredToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<{ message: string; user: User }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load current user profile on app start if token exists
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = getStoredToken();
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const userData = await api.getCurrentUser();
        setUser(userData);
        if (userData.organization_name) {
          setOrganization({
            id: userData.organization_id || '',
            name: userData.organization_name,
          });
        } else if (userData.organization_id) {
          setOrganization({
            id: userData.organization_id,
            name: 'Organization Workspace',
          });
        }
        setToken(storedToken);
      } catch (err) {
        console.warn('Failed to restore authentication session:', err);
        clearStoredToken();
        setUser(null);
        setOrganization(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen to unauthorized event dispatched from api.ts
    const handleUnauthorized = () => {
      clearStoredToken();
      setUser(null);
      setOrganization(null);
      setToken(null);
    };

    window.addEventListener('dealmind:unauthorized', handleUnauthorized);
    window.addEventListener('dealmind:logout', handleUnauthorized);

    return () => {
      window.removeEventListener('dealmind:unauthorized', handleUnauthorized);
      window.removeEventListener('dealmind:logout', handleUnauthorized);
    };
  }, []);

  const login = async (payload: LoginPayload): Promise<void> => {
    const res = await api.login(payload);
    setUser(res.user);
    if (res.organization) {
      setOrganization(res.organization);
    } else if (res.user.organization_name) {
      setOrganization({
        id: res.user.organization_id || '',
        name: res.user.organization_name,
      });
    }
    setToken(res.access_token);
  };

  const register = async (payload: RegisterPayload): Promise<{ message: string; user: User }> => {
    return await api.register(payload);
  };

  const logout = () => {
    api.logout();
    setUser(null);
    setOrganization(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        register,
        logout,
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
