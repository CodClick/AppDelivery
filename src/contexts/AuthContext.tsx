// src/contexts/AuthContext.tsx
import { useContext } from "react";
import React, { createContext, useEffect, useState } from "react";
import { useAuthState } from "@/hooks/useAuthState"; // Assumindo que este hook fornece User e um 'loading' básico
import {
  signUp as authSignUp,
  signIn as authSignIn,
  logOut as authLogOut,
} from "@/services/authService";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

interface CustomUser extends User {
  role?: string;
}

interface AuthContextType {
  currentUser: CustomUser | null;
  userRole: string | null;
  loading: boolean; // Este 'loading' será o loading combinado
  signUp: (
    email: string,
    password: string,
    name?: string,
    phone?: string
  ) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  logOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser: supabaseUser, loading: authStateLoading } = useAuthState(); // Loading da sessão Supabase
  const [currentUser, setCurrentUser] = useState<CustomUser | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true); // Novo estado de loading COMBINADO para o AuthContext

  useEffect(() => {
    const fetchAndSetUser = async () => {
      setLoading(true); // Começa a carregar
      if (supabaseUser) {
        // Busca o role e outras informações personalizadas
        const { data, error } = await supabase
          .from("usuarios")
          .select("role")
          .eq("id", supabaseUser.id)
          .single();

        if (data?.role) {
          const updatedUser: CustomUser = { ...supabaseUser, role: data.role };
          setCurrentUser(updatedUser);
          setUserRole(data.role);
          console.log("AuthContext: Usuário carregado com role:", data.role);
        } else {
          setCurrentUser(supabaseUser as CustomUser);
          setUserRole(null); // Define como null se o role não for encontrado
          console.warn("Role não encontrada para o usuário:", supabaseUser.id, error?.message);
        }
      } else {
        setCurrentUser(null);
        setUserRole(null);
      }
      setLoading(false); // Termina de carregar
    };

    // Apenas busca o role se o loading básico do authStateLoading for falso
    // e se o supabaseUser mudou (ou seja, a sessão básica foi carregada ou mudou).
    if (!authStateLoading) {
      fetchAndSetUser();
    }
  }, [supabaseUser, authStateLoading]); // Depende tanto do usuário quanto do loading básico do useAuthState

  // Funções de Autenticação (signIn, signUp, logOut) - Mantenha as que você já tem.
  // Certifique-se de que elas também acionam a lógica de atualização do role
  // (o useEffect acima já cuida disso quando `supabaseUser` muda).

  const signUp = async (email: string, password: string, name?: string, phone?: string) => {
    try {
      setLoading(true); // Inicia carregamento ao tentar signup
      const result = await authSignUp(email, password, name, phone);
      toast({
        title: "Conta criada com sucesso",
        description: "Bem-vindo ao nosso aplicativo!",
      });
      return result;
    } catch (error: any) {
      toast({
        title: "Erro ao criar conta",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false); // Termina carregamento
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true); // Inicia carregamento ao tentar login
      const result = await authSignIn(email, password);
      toast({
        title: "Login realizado",
        description: "Você entrou com sucesso.",
      });
      return result;
    } catch (error: any) {
      toast({
        title: "Erro ao fazer login",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false); // Termina carregamento
    }
  };

  const logOut = async () => {
    try {
      setLoading(true); // Inicia carregamento ao tentar logout
      await authLogOut();
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao fazer logout",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false); // Termina carregamento
    }
  };

  const value = {
    currentUser,
    userRole,
    loading, // Use este 'loading' combinado
    signUp,
    signIn,
    logOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children} {/* Removi o !loading aqui para deixar o PrivateRoute lidar com isso */}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
