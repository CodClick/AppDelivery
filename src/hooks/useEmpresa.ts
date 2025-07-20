import { useEffect, useState } from "react";
import { supabase } from '@/services/supabaseService';
export { supabase };
import { useAuth } from "@/hooks/useAuth";

interface Empresa {
  id: string;
  nome: string;
  // Adicione outros campos conforme necessário
}

export function useEmpresa() {
  const { user } = useAuth();
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setEmpresa(null);
      setLoading(false);
      return;
    }

    const fetchEmpresa = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("empresas")
        .select("*")
        .eq("admin_id", user.id)
        .single();

      if (error) {
        console.error("Erro ao buscar empresa:", error.message);
        setErro(error.message);
        setEmpresa(null);
      } else {
        setEmpresa(data);
      }

      setLoading(false);
    };

    fetchEmpresa();
  }, [user]);

  return { empresa, loading, erro };
}
