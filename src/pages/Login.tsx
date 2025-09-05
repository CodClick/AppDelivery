import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Lock } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, currentUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { slug } = useParams();

  const [companyData, setCompanyData] = useState({ logo_url: "", name: "" });

  // Efeito 1: Busca os dados da empresa (logo/nome) com base no slug da URL
  useEffect(() => {
    if (!slug) {
      setCompanyData({ logo_url: "", name: "" });
      return;
    }

    const fetchCompanyData = async () => {
      const { data, error } = await supabase
        .from('empresas')
        .select('logo_url, nome')
        .eq('slug', slug)
        .single();
        
      if (data) {
        setCompanyData({ logo_url: data.logo_url, name: data.nome });
      } else {
        setCompanyData({ logo_url: "", name: "" });
      }
    };
    
    fetchCompanyData();

  }, [slug]);

  // Efeito 2: Redireciona o usuário se ele já estiver logado
  useEffect(() => {
    const redirectToDashboard = async () => {
      if (currentUser) {
        const { data: empresa } = await supabase
          .from('empresas')
          .select('slug, role')
          .eq('admin_id', currentUser.id)
          .single();

        if (empresa && currentUser.role === 'admin') {
          navigate(`/${empresa.slug}/admin-dashboard`, { replace: true });
        } else if (empresa && currentUser.role === 'entregador') {
          navigate(`/${empresa.slug}/entregador`, { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      }
    };
    redirectToDashboard();
  }, [currentUser, navigate]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError("");
      setLoading(true);
      
      const { data: authData, error: authError } = await signIn(email, password);
      
      if (authError) {
        throw authError;
      }
      
      toast({
        title: "Login realizado com sucesso",
        description: "Você foi conectado à sua conta",
      });

      // A navegação será tratada pelo useEffect de redirecionamento, que é acionado
      // quando o estado do currentUser é atualizado com sucesso
      
    } catch (e: any) {
      setError(e.message || "Falha ao fazer login. Verifique seu email e senha.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-lg shadow-md">
        
        {companyData.logo_url ? (
          <div className="text-center">
            <img 
              src={companyData.logo_url} 
              alt={`Logo ${companyData.name}`} 
              className="mx-auto h-20 w-auto rounded-lg"
            />
            <h1 className="mt-4 text-2xl font-bold text-gray-900">{companyData.name}</h1>
          </div>
        ) : (
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">Entrar</h2>
            <p className="mt-2 text-sm text-gray-600">
              Ou{" "}
              <Link to="/register" className="font-medium text-brand hover:text-brand-600">
                criar uma nova conta
              </Link>
            </p>
          </div>
        )}
        
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="mt-1 relative">
                <Mail className="absolute top-3 left-3 text-gray-400 h-5 w-5" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <div className="mt-1 relative">
                <Lock className="absolute top-3 left-3 text-gray-400 h-5 w-5" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link to="/forgot-password" className="font-medium text-brand hover:text-brand-600">
                Esqueceu sua senha?
              </Link>
            </div>
          </div>
          
          <Button
            type="submit"
            className="w-full bg-brand hover:bg-brand-600"
            disabled={loading}
          >
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
        <div className="text-center mt-4">
          <span className="text-sm text-gray-600">É dono de restaurante?</span>
          <br />
          <Link to="/admin-register" className="text-brand hover:underline font-medium">
            Cadastre seu restaurante
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
