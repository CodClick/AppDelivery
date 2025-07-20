import { useEffect, useState } from "react";
import supabase from "@/services/supabaseService";

export function useEmpresa(userId: string | null) {
  const [empresa, setEmpresa] = useState<any>(null);

  useEffect(() => {
    const fetchEmpresa = async () => {
      if (!userId) return;

      const { data, error } = await supabase
        .from("empresas")
        .select("*")
        .eq("admin_id", userId)
        .single();

      if (error) {
        console.error("Erro ao buscar empresa:", error);
        return;
      }

      setEmpresa(data);
    };

    fetchEmpresa();
  }, [userId]);

  return { empresa };
}
