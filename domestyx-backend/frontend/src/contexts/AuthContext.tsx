import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/services/api';

interface User {
  profile_image: string;
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: 'worker' | 'employer';
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean; 
  isWorker: boolean;
  isEmployer: boolean;
  getAccessToken: () => string | null;
  login: (accessToken: string, userObject: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); 

  useEffect(() => {
    const initAuth = () => {
      try {
        const token = localStorage.getItem('access_token');
        const storedUser = localStorage.getItem('user');
        
        if (token && storedUser) {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        localStorage.clear();
      } finally {
        setIsLoading(false); 
      }
    };
    initAuth();
  }, []);

  const login = (accessToken: string, userObject: User) => {
    // ✅ Force lowercase role to prevent "Worker" vs "worker" mismatch
    const normalizedUser: User = {
      ...userObject,
      role: userObject.role.toLowerCase() as 'worker' | 'employer'
    };

    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('user', JSON.stringify(normalizedUser));
    api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    
    setUser(normalizedUser);
    setIsLoading(false); 
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setIsLoading(false); 
  };

  const getAccessToken = () => localStorage.getItem('access_token');

  const isWorker = user?.role === 'worker';
  const isEmployer = user?.role === 'employer';

  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated: !!user, 
        user, 
        isLoading, 
        isWorker, 
        isEmployer, 
        login, 
        logout, 
        getAccessToken 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};