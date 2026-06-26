import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { User } from '../types';
import { setApiAccessToken } from '../services/api';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

interface AuthContextValue {
  user: User | null;
  login: (accessToken: string, refreshToken: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [hasSession, setHasSession] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedRefreshToken = localStorage.getItem('refreshToken');

    if (!storedUser || !storedRefreshToken) {
      setIsLoading(false);
      return;
    }

    // Eagerly refresh on page load so access token is ready before queries fire
    axios
      .post(`${BASE_URL}/auth/refresh`, { refreshToken: storedRefreshToken })
      .then((res) => {
        const { accessToken, refreshToken: newRefreshToken } = res.data.data;
        setApiAccessToken(accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        setUser(JSON.parse(storedUser));
        setHasSession(true);
      })
      .catch(() => {
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const login = (newAccessToken: string, newRefreshToken: string, newUser: User) => {
    localStorage.setItem('refreshToken', newRefreshToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setApiAccessToken(newAccessToken);
    setUser(newUser);
    setHasSession(true);
  };

  const logout = () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      fetch(`${BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      }).catch(() => {});
    }
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setApiAccessToken(null);
    setUser(null);
    setHasSession(false);
  };

  const updateUser = (updatedUser: User) => {
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        updateUser,
        isAuthenticated: !!user && hasSession,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
