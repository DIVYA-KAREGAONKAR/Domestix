// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/services/api';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: 'worker' | 'employer';
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isWorker: boolean;
  isEmployer: boolean;
  getAccessToken: () => string | null;
  login: (accessToken: string, userObject: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = (accessToken: string, userObject: User) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('user', JSON.stringify(userObject));
    api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    setUser(userObject);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const getAccessToken = () => localStorage.getItem('access_token') || "";

  const isWorker = user?.role === 'worker';
  const isEmployer = user?.role === 'employer';

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!user, user, isWorker, isEmployer, login, logout, getAccessToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
