import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

// ─── Types ────────────────────────────────────────────────────────────────────

type User = {
  id: string;
  email: string;
  username: string;
  role: 'player' | 'stadium_manager' | 'admin';
  email_verified: boolean;
  avatar_url: string | null;
  has_profile?: boolean;
  player_profile?: any;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On app start, restore session and validate token with server
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        const storedUser = await AsyncStorage.getItem('user');
        if (storedToken && storedUser) {
          // Validate token is still valid by hitting /users/me
          try {
            const response = await api.get('/users/me');
            const freshUser = response.data.data;
            await AsyncStorage.setItem('user', JSON.stringify(freshUser));
            setToken(storedToken);
            setUser(freshUser);
          } catch {
            // Token invalid or account deleted — clear session
            await AsyncStorage.multiRemove(['token', 'user']);
          }
        }
      } catch {
        await AsyncStorage.multiRemove(['token', 'user']);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { token: newToken, user: newUser } = response.data.data;

    await AsyncStorage.setItem('token', newToken);
    await AsyncStorage.setItem('user', JSON.stringify(newUser));

    setToken(newToken);
    setUser(newUser);
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['token', 'user']);
    setToken(null);
    setUser(null);
  };

  // Refresh user data from the server (e.g. after profile update)
  const refreshUser = async () => {
    try {
      const response = await api.get('/users/me');
      const updatedUser = response.data.data;
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch {
      // If refresh fails, leave existing user data as-is
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
