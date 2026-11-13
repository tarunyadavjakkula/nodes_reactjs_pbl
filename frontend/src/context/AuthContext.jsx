import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('spendwise_token'));
  const [loading, setLoading] = useState(true);

  // Initialize and check current user on app load
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('spendwise_token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.success && res.data) {
            setUser(res.data);
          }
        } catch (err) {
          console.warn('Authentication token invalid or expired:', err.message);
          localStorage.removeItem('spendwise_token');
          localStorage.removeItem('spendwise_user');
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.success && res.data) {
      const { user: userData, token: userToken } = res.data;
      localStorage.setItem('spendwise_token', userToken);
      localStorage.setItem('spendwise_user', JSON.stringify(userData));
      setUser(userData);
      setToken(userToken);
      return userData;
    }
    throw new Error(res.message || 'Login failed');
  };

  const register = async (name, email, password, currency = 'USD') => {
    const res = await api.post('/auth/register', { name, email, password, currency });
    if (res.success && res.data) {
      const { user: userData, token: userToken } = res.data;
      localStorage.setItem('spendwise_token', userToken);
      localStorage.setItem('spendwise_user', JSON.stringify(userData));
      setUser(userData);
      setToken(userToken);
      return userData;
    }
    throw new Error(res.message || 'Registration failed');
  };

  const logout = () => {
    localStorage.removeItem('spendwise_token');
    localStorage.removeItem('spendwise_user');
    setUser(null);
    setToken(null);
  };

  const updateUser = (updatedData) => {
    setUser((prev) => {
      const nextUser = { ...prev, ...updatedData };
      localStorage.setItem('spendwise_user', JSON.stringify(nextUser));
      return nextUser;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
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

export const useAuth = () => useContext(AuthContext);

