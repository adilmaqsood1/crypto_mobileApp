import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { User } from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = '@crypto_app_token';
const USER_KEY = '@crypto_app_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Check for stored auth on mount
  useEffect(() => {
    checkStoredAuth();
  }, []);

  const checkStoredAuth = async () => {
    try {
      const [token, userJson] = await Promise.all([
        AsyncStorage.getItem(TOKEN_KEY),
        AsyncStorage.getItem(USER_KEY),
      ]);

      if (token && userJson) {
        const user = JSON.parse(userJson) as User;
        api.setToken(token);
        setState({
          user,
          token,
          isLoading: false,
          isAuthenticated: true,
        });
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Error checking stored auth:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const login = async (identifier: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await api.login(identifier, password);
      
      if (response.error || !response.data) {
        return {
          success: false,
          error: response.error || 'Login failed',
        };
      }

      const { access_token, user: backendUser } = response.data;
      
      // Map backend user to frontend User interface
      const user: User = {
        id: backendUser.id,
        email: backendUser.email,
        name: backendUser.full_name || backendUser.username,
        createdAt: backendUser.created_at,
        avatar: backendUser.avatar_url
      };

      // Store auth data
      await Promise.all([
        AsyncStorage.setItem(TOKEN_KEY, access_token),
        AsyncStorage.setItem(USER_KEY, JSON.stringify(user)),
      ]);

      api.setToken(access_token);

      setState({
        user,
        token: access_token,
        isLoading: false,
        isAuthenticated: true,
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      };
    }
  };

  const signup = async (
    email: string,
    password: string,
    name: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await api.signup(email, password, name);

      if (response.error || !response.data) {
        return {
          success: false,
          error: response.error || 'Signup failed',
        };
      }

      const { access_token, user: backendUser } = response.data;

      const user: User = {
        id: backendUser.id,
        email: backendUser.email,
        name: backendUser.full_name || backendUser.username,
        createdAt: backendUser.created_at,
        avatar: backendUser.avatar_url
      };

      await Promise.all([
        AsyncStorage.setItem(TOKEN_KEY, access_token),
        AsyncStorage.setItem(USER_KEY, JSON.stringify(user)),
      ]);

      api.setToken(access_token);

      setState({
        user,
        token: access_token,
        isLoading: false,
        isAuthenticated: true,
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Signup failed',
      };
    }
  };

  const logout = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(TOKEN_KEY),
        AsyncStorage.removeItem(USER_KEY),
      ]);
      api.setToken(null);
      setState({
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      });
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const updateUser = (user: User) => {
    setState(prev => ({ ...prev, user }));
    AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        signup,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
