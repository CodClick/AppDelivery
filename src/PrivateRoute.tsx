import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useEmpresa } from "@/contexts/EmpresaContext";

export const PrivateRoute = ({ children, role }: { children: React.ReactNode; role?: string }) => {
  const { currentUser, loading } = useAuth();
  const { empresa, loading: empresaLoading } = useEmpresa();

  if (loading || empresaLoading) {
    return <div className="h-screen w-full flex items-center justify-center">Carregando...</div>;
  }
  
  if (!currentUser) {
    return <Navigate to={`/login${empresa?.slug ? `?redirectSlug=${empresa.slug}` : ''}`} replace />;
  }

  // Se o usuário logado não tiver um role definido, o acesso é negado
  if (!currentUser.role) {
    console.error("Usuário logado sem role definido. Acesso negado.");
    return <Navigate to="/unauthorized" replace />;
  }
  
  // Verificação de permissão baseada na role do usuário
  if (role && currentUser.role !== role) {
    console.error(`Tentativa de acesso não autorizado: Permissão '${role}' negada para o usuário '${currentUser.role}'.`);
    return <Navigate to="/unauthorized" replace />;
  }
  
  // Verificação de posse da empresa para a rota de admin
  if (role === 'admin' && empresa) {
      if (!currentUser.empresa_id) {
          console.error("Usuário admin sem empresa_id definido. Acesso negado.");
          return <Navigate to="/unauthorized" replace />;
      }
      if (currentUser.id !== empresa.admin_id) {
          console.error("Tentativa de acesso não autorizado: O usuário não é o admin desta empresa.");
          return <Navigate to="/unauthorized" replace />;
      }
  }

  return <>{children}</>;
};
