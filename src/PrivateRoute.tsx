import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

export const PrivateRoute = ({ children, role }: { children: React.ReactNode; role?: string }) => {
  const { currentUser, loading } = useAuth();
  if (loading) {
    return <div className="h-screen w-full flex items-center justify-center">Carregando...</div>;
  }
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  if (role && currentUser.role !== role) {
    return <Navigate to="/unauthorized" replace />;
  }
  return <>{children}</>;
};
