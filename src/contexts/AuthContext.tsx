// src/contexts/AuthContext.tsx
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

interface UserAddress {
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}

interface CustomUser extends User {
  role?: string;
  empresa_id?: string;
  name?: string;
  phone?: string;
  address?: UserAddress;
}

interface AuthContextType {
  currentUser: CustomUser | null;
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
  const { currentUser: supabaseUser, loading: authStateLoading } = useAuthState();
  const [currentUser, setCurrentUser] = useState<CustomUser | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAndSetUser = async () => {
      setLoading(true);

      if (supabaseUser) {
        const { data, error } = await supabase
          .from("usuarios")
          .select("role, empresa_id, name, phone, cep, street, number, complement, neighborhood, city, state")
          .eq("id", supabaseUser.id)
          .single();

        if (data) {
          const updatedUser: CustomUser = {
            ...supabaseUser,
            role: data.role,
            empresa_id: data.empresa_id,
            name: data.name,
            phone: data.phone,
            address: {
                cep: data.cep,
                street: data.street,
                number: data.number,
                complement: data.complement,
                neighborhood: data.neighborhood,
                city: data.city,
                state: data.state,
            }
          };
          setCurrentUser(updatedUser);
          setUserRole(data.role);
          console.log("AuthContext: Usuário carregado com todos os dados de perfil.", updatedUser);
        } else {
          setCurrentUser(supabaseUser as CustomUser);
          setUserRole(null);
          console.warn("AuthContext: Dados de perfil não encontrados para o usuário:", supabaseUser.id, error?.message);
        }
      } else {
        setCurrentUser(null);
        setUserRole(null);
      }
      setLoading(false);
    };

    if (!authStateLoading) {
      fetchAndSetUser();
    }
  }, [supabaseUser, authStateLoading]);

  const signUp = async (email: string, password: string, name?: string, phone?: string) => {
    try {
      setLoading(true);
      const result = await authSignUp(email, password, name, phone);
      toast({ title: "Conta criada com sucesso", description: "Bem-vindo ao nosso aplicativo!" });
      return result;
    } catch (error: any) {
      toast({ title: "Erro ao criar conta", description: error.message, variant: "destructive" });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const result = await authSignIn(email, password);
      return result;
    } catch (error: any) {
      console.error("AuthContext: Erro capturado no signIn:", error.message);
      toast({
        title: "Erro ao fazer login",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logOut = async () => {
    try {
      setLoading(true);
      await authLogOut();
      toast({ title: "Logout realizado", description: "Você foi desconectado com sucesso." });
    } catch (error: any) {
      toast({ title: "Erro ao fazer logout", description: error.message, variant: "destructive" });
      throw error;
    } finally {
      setLoading(false);
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
      {children}
    </AuthContext.Provider>
  );
};
