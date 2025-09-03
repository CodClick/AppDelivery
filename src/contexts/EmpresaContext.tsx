import { createContext, useContext, useState, useEffect } from "react";
import supabase from "@/services/supabaseService";
import { useParams } from "react-router-dom";

type Empresa = {
  id: string;
  nome_fantasia?: string;
  slug: string;
  logo_url?: string;
  cor_primaria?: string;
};

type EmpresaContextType = {
  empresa: Empresa | null;
  loading: boolean;
  error: any;
};

const EmpresaContext = createContext<EmpresaContextType | undefined>(undefined);

export const useEmpresa = () => {
  const context = useContext(EmpresaContext);
  if (context === undefined) {
    throw new Error("useEmpresa must be used within an EmpresaProvider");
  }
  return context;
};

export const EmpresaProvider = ({ children }: { children: React.ReactNode }) => {
  const { slug } = useParams();
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const fetchEmpresa = async () => {
      setLoading(true);
      setError(null);
      if (!slug) {
        setLoading(false);
        setError({ message: "Nenhum slug de empresa fornecido." });
        return;
      }

      console.log("Slug detectado:", slug);

      const { data, error } = await supabase
        .from("empresas")
        .select("*")
        .eq("slug", slug)
        .single();

      if (error) {
        console.error("Erro ao buscar empresa pelo slug:", error);
        setError(error);
        setEmpresa(null);
      } else if (data) {
        console.log("Empresa carregada com sucesso:", data);
        setEmpresa(data);
        setError(null);
      } else {
        setError({ message: "Empresa não encontrada." });
        setEmpresa(null);
      }
      setLoading(false);
    };

    fetchEmpresa();
  }, [slug]);

  // Retorna um indicador de carregamento ou mensagem de erro enquanto os dados estão sendo buscados
  if (loading) {
    return <div className="h-screen w-full flex items-center justify-center">Carregando...</div>;
  }

  // Exibe uma mensagem de erro se a empresa não for encontrada
  if (error || !empresa) {
    return <div className="h-screen w-full flex items-center justify-center text-red-500">
      Ooops.. Empresa não encontrada!
    </div>;
  }

  // Retorna os filhos apenas quando a empresa for carregada com sucesso
  return (
    <EmpresaContext.Provider value={{ empresa, loading, error }}>
      {children}
    </EmpresaContext.Provider>
  );
};
