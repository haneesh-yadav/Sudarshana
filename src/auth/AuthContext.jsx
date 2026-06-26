import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [user, setUser] = useState(() => {
    const email = localStorage.getItem('userEmail');
    const fullName = localStorage.getItem('userFullName');
    const userId = localStorage.getItem('selectedUserId');
    return email ? { email, fullName, userId } : null;
  });
  const [authReady, setAuthReady] = useState(false);

  const isAuthenticated = authReady && !!token;

  const login = (data) => {
    const { token, userId, email, fullName } = data;
    localStorage.setItem('token', token);
    localStorage.setItem('selectedUserId', String(userId));
    localStorage.setItem('userEmail', email);
    localStorage.setItem('userFullName', fullName || '');
    
    setToken(token);
    setUser({ email, fullName, userId });
    setAuthReady(true);
    
    // Dispatch custom event to notify other components/tabs
    window.dispatchEvent(new Event('tg-user-changed'));
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('selectedUserId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userFullName');
    localStorage.removeItem('isNewUser');

    setToken(null);
    setUser(null);
    setAuthReady(true);

    window.dispatchEvent(new Event('tg-user-changed'));
  };

  useEffect(() => {
    const validateStoredToken = async () => {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        setAuthReady(true);
        return;
      }

      try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) {
          logout();
          return;
        }

        const data = await response.json();
        if (data.status === 'SUCCESS') {
          localStorage.setItem('selectedUserId', String(data.userId));
          localStorage.setItem('userEmail', data.email);
          localStorage.setItem('userFullName', data.fullName || '');
          setToken(storedToken);
          setUser({ email: data.email, fullName: data.fullName || '', userId: data.userId });
        } else {
          logout();
          return;
        }
      } catch (err) {
        console.error('Failed to validate auth session:', err);
        logout();
        return;
      }

      setAuthReady(true);
    };

    validateStoredToken();
  }, []);

  // Keep state synced if storage changes in another tab / custom event triggers
  useEffect(() => {
    const handleAuthChange = () => {
      const storedToken = localStorage.getItem('token');
      const email = localStorage.getItem('userEmail');
      const fullName = localStorage.getItem('userFullName');
      const userId = localStorage.getItem('selectedUserId');

      setToken(storedToken);
      setUser(email ? { email, fullName, userId } : null);
    };

    window.addEventListener('storage', handleAuthChange);
    window.addEventListener('tg-user-changed', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleAuthChange);
      window.removeEventListener('tg-user-changed', handleAuthChange);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, authReady, user, token, login, logout }}>
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
