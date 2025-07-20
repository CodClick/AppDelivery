import { useContext } from "react";
import React, { createContext, useEffect, useState } from "react";
import { useAuthState } from "@/hooks/useAuthState";
import {
  signUp as authSignUp,
  signIn as authSignIn,
  logOut as authLogOut,
} from "@/services/authService";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

interface AuthContextType {
  currentUser: User | null;
  userRole: string | null;
  loading: boolean;
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
  const { currentUser, loading } = useAuthState();
  const [userRole, setUserRole] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUserRole = async () => {
      if (currentUser) {
        const { data, error } = await supabase
          .from("usuarios")
          .select("role")
          .eq("id", currentUser.id)
          .single();

        if (data?.role) {
          setUserRole(data.role);
        } else {
          console.warn("Role não encontrada para o usuário atual.", error);
          setUserRole(null);
        }
      } else {
        setUserRole(null);
      }
    };

    fetchUserRole();
  }, [currentUser]);
  
  const signUp = async (email: string, password: string, name?: string, phone?: string) => {
    try {
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
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
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
    }
  };

  const logOut = async () => {
    try {
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
    }
  };

  const value = {
    currentUser,
    userRole,
    loading,
    signUp,
    signIn,
    logOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
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
