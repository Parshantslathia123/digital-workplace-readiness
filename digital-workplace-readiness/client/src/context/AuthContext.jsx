import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('dwr_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('dwr_token');
      if (token) {
        try {
          const { data } = await api.get('/auth/me');
          setUser(data.user);
          localStorage.setItem('dwr_user', JSON.stringify(data.user));
        } catch (err) {
          localStorage.removeItem('dwr_token');
          localStorage.removeItem('dwr_user');
          setUser(null);
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('dwr_token', data.token);
    localStorage.setItem('dwr_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    localStorage.setItem('dwr_token', data.token);
    localStorage.setItem('dwr_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // ignore network errors on logout
    }
    localStorage.removeItem('dwr_token');
    localStorage.removeItem('dwr_user');
    setUser(null);
  };

  const updateUserLocal = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('dwr_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUserLocal }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
