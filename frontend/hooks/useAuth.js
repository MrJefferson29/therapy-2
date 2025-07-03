import React, { useState, useEffect, useCallback, useContext, createContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login as apiLogin, register as apiRegister, getMyProfile } from '../api/auth';

// Add a type for the context value
const initialAuthContext = {
  user: null,
  token: null,
  loading: false,
  error: null,
  login: async () => false,
  register: async () => false,
  logout: async () => {},
  getProfile: async () => null,
};

const AuthContext = createContext(initialAuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Restore session on mount
  useEffect(() => {
    (async () => {
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    })();
  }, []);

  const login = useCallback(async ({ username, password }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiLogin({ username, password });
      if (res.token && res.user) {
        setToken(res.token);
        await AsyncStorage.setItem('token', res.token);
        await AsyncStorage.setItem('user', JSON.stringify(res.user));
        // Always fetch the latest profile after login to ensure role is up to date
        const profile = await getMyProfile(res.token);
        if (profile && profile.username) {
          setUser(profile);
          await AsyncStorage.setItem('user', JSON.stringify(profile));
        } else {
          setUser(res.user);
        }
        setLoading(false);
        return true;
      } else {
        setError(res.message || 'Login failed');
        setLoading(false);
        return false;
      }
    } catch (e) {
      setError('Network error');
      setLoading(false);
      return false;
    }
  }, []);

  const register = useCallback(async ({ username, email, password }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRegister({ username, email, password });
      if (res.message && res.message.toLowerCase().includes('success')) {
        setLoading(false);
        return true;
      } else {
        setError(res.message || 'Registration failed');
        setLoading(false);
        return false;
      }
    } catch (e) {
      setError('Network error');
      setLoading(false);
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    setToken(null);
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
  }, []);

  const getProfile = useCallback(async () => {
    if (!token) return null;
    try {
      const profile = await getMyProfile(token);
      if (profile && profile.username) {
        setUser(profile);
        await AsyncStorage.setItem('user', JSON.stringify(profile));
      }
      return profile;
    } catch (e) {
      setError('Failed to fetch profile');
      return null;
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, loading, error, login, register, logout, getProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
} 