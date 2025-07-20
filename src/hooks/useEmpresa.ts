import { useEffect, useState } from "react";
import { supabase } from "@/services/supabaseService";
import { useAuth } from "@/hooks/useAuth";

interface Empresa {
  id: string;
  nome: string;
  // outros campos se necessário
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

      // 1️⃣ Busca o usuário para pegar o empresa_id
      const { data: usuarioData, error: usuarioError } = await supabase
        .from("usuarios")
        .select("empresa_id")
        .eq("id", user.id)
        .single();

      if (usuarioError || !usuarioData?.empresa_id) {
        setErro("Usuário não possui empresa vinculada");
        setEmpresa(null);
        setLoading(false);
        return;
      }

      // 2️⃣ Agora busca a empresa com base no empresa_id
      const { data: empresaData, error: empresaError } = await supabase
        .from("empresas")
        .select("*")
        .eq("id", usuarioData.empresa_id)
        .single();

      if (empresaError) {
        setErro("Erro ao buscar empresa");
        setEmpresa(null);
      } else {
        setEmpresa(empresaData);
      }

      setLoading(false);
    };

    fetchEmpresa();
  }, [user]);

  return { empresa, loading, erro };
}
