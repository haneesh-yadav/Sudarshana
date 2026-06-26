import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, authReady } = useAuth();
  const location = useLocation();

  if (!authReady) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#09090b',
          color: '#f4f4f5',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        Checking session...
      </div>
    );
  }

  if (!isAuthenticated) {
    // Save attempted location to redirect back after successful login
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
}
