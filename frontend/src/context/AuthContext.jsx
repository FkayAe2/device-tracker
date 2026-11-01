/**
 * context/AuthContext.jsx — Global authentication state
 */
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('bpe_user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('bpe_token') || null);

  function login(userData, tok) {
    setUser(userData);
    setToken(tok);
    localStorage.setItem('bpe_user', JSON.stringify(userData));
    localStorage.setItem('bpe_token', tok);
  }

  function logout() {
    setUser(null);
    setToken(null);
    localStorage.removeItem('bpe_user');
    localStorage.removeItem('bpe_token');
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

