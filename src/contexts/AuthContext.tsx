import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          try {
            const { data: userData, error } = await supabase
              .from('usuarios')
              .select('id, nome, role, empresa_id')
              .eq('id', session.user.id)
              .single();
            
            if (error) {
              console.error('Erro ao buscar perfil do usuário:', error.message);
              setCurrentUser({ ...session.user, role: 'cliente', empresa_id: null });
            } else {
              setCurrentUser({ ...session.user, ...userData });
            }
          } catch (e) {
            console.error('Erro inesperado na busca do perfil:', e);
            setCurrentUser(null);
          }
        } else {
          setCurrentUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      authListener?.unsubscribe();
    };
  }, []);

  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const logOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Erro ao fazer logout:', error.message);
  };

  const value = {
    currentUser,
    loading,
    signIn,
    logOut
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
