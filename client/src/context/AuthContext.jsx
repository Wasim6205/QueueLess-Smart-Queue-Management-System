import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('queueless:token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore user session on startup if token exists
  useEffect(() => {
    async function restoreSession() {
      const storedToken = localStorage.getItem('queueless:token');
      if (!storedToken) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const data = await authApi.me();
        setUser(data.user);
        setToken(storedToken);
      } catch (err) {
        console.warn('[Auth] Session restore failed, clearing token.');
        localStorage.removeItem('queueless:token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    restoreSession();
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await authApi.login({ email, password });
    localStorage.setItem('queueless:token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('queueless:token');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, isAuthenticated: Boolean(user) }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;

