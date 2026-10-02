import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getStoredToken, setStoredToken } from '../api/apiClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(getStoredToken());
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      if (!getStoredToken()) {
        setUser(null);
        setLoading(false);
        return;
      }
      const data = await api.getMe();
      if (data.success && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
        setStoredToken(null);
      }
    } catch (err) {
      console.error('Failed to restore session:', err);
      setUser(null);
      setStoredToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email, password) => {
    const data = await api.login({ email, password });
    if (data.success && data.token) {
      setStoredToken(data.token);
      setToken(data.token);
      setUser(data.user);
    }
    return data;
  };

  const loginWithToken = (newToken, newUser) => {
    setStoredToken(newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (e) {
      // ignore
    }
    setStoredToken(null);
    setToken(null);
    setUser(null);
  };

  const updateDonorAvailability = async (newStatus) => {
    const res = await api.updateAvailability(newStatus);
    if (res.success) {
      setUser((prev) => ({
        ...prev,
        donorStatus: newStatus,
        isAvailable: newStatus === 'Active'
      }));
    }
    return res;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        loginWithToken,
        logout,
        refreshUser,
        updateDonorAvailability,
        isAuthenticated: !!user
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
