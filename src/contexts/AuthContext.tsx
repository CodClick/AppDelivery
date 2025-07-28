// src/contexts/AuthContext.tsx
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

// 1. Defina uma interface para o seu usuário personalizado que inclui o 'role'
// Isso é crucial para que o TypeScript saiba que 'currentUser' pode ter 'role'.
interface CustomUser extends User {
  role?: string; // Adicione a propriedade 'role' aqui
  // Adicione outras propriedades personalizadas da sua tabela 'usuarios' se houver
}

interface AuthContextType {
  currentUser: CustomUser | null; // Agora currentUser pode ter a propriedade 'role'
  userRole: string | null; // Mantido por compatibilidade, mas o ideal é usar currentUser.role
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
  const { currentUser: supabaseUser, loading } = useAuthState(); // Renomeado para evitar conflito
  const [currentUser, setCurrentUser] = useState<CustomUser | null>(null); // Novo estado para o usuário completo
  const [userRole, setUserRole] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAndSetUser = async () => {
      if (supabaseUser) {
        // Agora busca o role e outras informações personalizadas
        const { data, error } = await supabase
          .from("usuarios") // Verifique se o nome da tabela está correto ("usuarios")
          .select("role") // Selecione apenas as colunas que você precisa
          .eq("id", supabaseUser.id)
          .single();

        if (data?.role) {
          const updatedUser: CustomUser = { ...supabaseUser, role: data.role };
          setCurrentUser(updatedUser);
          setUserRole(data.role); // Atualiza o userRole separado também
          console.log("AuthContext: Usuário carregado com role:", data.role); // Debug
        } else {
          // Se não encontrar o role, define o usuário sem role ou com um role padrão se desejar
          setCurrentUser(supabaseUser as CustomUser); // Mantém o usuário do Supabase
          setUserRole(null);
          console.warn("Role não encontrada para o usuário:", supabaseUser.id, error?.message);
        }
      } else {
        setCurrentUser(null);
        setUserRole(null);
      }
    };

    fetchAndSetUser();
  }, [supabaseUser]); // Dependência do usuário original do Supabase

  const signUp = async (email: string, password: string, name?: string, phone?: string) => {
    try {
      const result = await authSignUp(email, password, name, phone);
      // Após o signup, o useAuthState vai detectar o novo usuário e acionar o useEffect acima.
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
      // Após o signIn, o useAuthState vai detectar o novo usuário e acionar o useEffect acima.
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
      // Após o logout, useAuthState definirá supabaseUser como null, e o useEffect acima limpará o estado.
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
    currentUser, // Agora currentUser já contém o role
    userRole, // Mantido para compatibilidade se necessário, mas currentUser.role é preferível
    loading, // Este 'loading' vem do useAuthState, indica se a sessão inicial está carregando
    signUp,
    signIn,
    logOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children} {/* Renderiza children apenas depois que o carregamento inicial do auth terminar */}
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
