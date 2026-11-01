import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [providerProfile, setProviderProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.success && res.data) {
        setUser(res.data.user);
        setProviderProfile(res.data.providerProfile);
      } else {
        setUser(null);
        setProviderProfile(null);
      }
    } catch {
      setUser(null);
      setProviderProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (email, password) => {
    setError(null);
    try {
      const res = await api.post('/auth/login', { email, password });
      setUser(res.data.user);
      setProviderProfile(res.data.providerProfile);
      return res.data.user;
    } catch (err) {
      setError(err.message || 'Login failed');
      throw err;
    }
  };

  const register = async (formData) => {
    setError(null);
    try {
      const res = await api.post('/auth/register', formData);
      setUser(res.data.user);
      setProviderProfile(res.data.providerProfile);
      return res.data.user;
    } catch (err) {
      setError(err.message || 'Registration failed');
      throw err;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setUser(null);
      setProviderProfile(null);
    }
  };

  const updateProfile = async (data) => {
    const res = await api.put('/auth/profile', data);
    setUser(res.data.user);
    if (res.data.providerProfile) {
      setProviderProfile(res.data.providerProfile);
    }
    return res.data;
  };

  const refreshProfile = async () => {
    await fetchCurrentUser();
  };

  const value = {
    user,
    providerProfile,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    refreshProfile,
    isAdmin: user?.role === 'ADMIN',
    isProvider: user?.role === 'PROVIDER',
    isCustomer: user?.role === 'CUSTOMER',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
