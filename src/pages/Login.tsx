import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Link, useNavigate, useLocation } from "react-router-dom";
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
  const { signIn, currentUser, logOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // 1. Lógica de redirecionamento para usuários já logados
    if (currentUser) {
      const params = new URLSearchParams(location.search);
      const redirectSlug = params.get('redirectSlug');

      if (redirectSlug) {
        // Se a empresa_id do usuário não corresponder ao slug, nega o acesso e desloga
        if (currentUser.empresa_id !== redirectSlug) {
          toast({
            title: "Acesso Negado",
            description: "Você está logado em outra conta. Por favor, saia para acessar esta empresa.",
            variant: "destructive"
          });
          logOut();
          return;
        }

        // Se o slug corresponder, redireciona para a página do restaurante
        if (currentUser.role === 'admin') {
            navigate(`/${redirectSlug}/admin`, { replace: true });
        } else {
            navigate(`/${redirectSlug}`, { replace: true });
        }
      } else {
        // Redirecionamento padrão para a área de admin, caso não haja slug
        if (currentUser.role === 'admin' && currentUser.empresa_id) {
          const getEmpresaSlug = async () => {
            const { data } = await supabase
              .from('empresas')
              .select('slug')
              .eq('id', currentUser.empresa_id)
              .single();
            if (data) navigate(`/${data.slug}/admin`, { replace: true });
            else navigate('/', { replace: true });
          };
          getEmpresaSlug();
        } else {
          navigate('/', { replace: true });
        }
      }
    }
  }, [currentUser, navigate, location.search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setError("");
      setLoading(true);
      await signIn(email, password);
      // O useEffect lidará com o redirecionamento após o login
      toast({
        title: "Login realizado com sucesso",
        description: "Você foi conectado à sua conta",
      });
    } catch (e) {
      setError("Falha ao fazer login. Verifique seu email e senha.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">Entrar</h2>
          <p className="mt-2 text-sm text-gray-600">
            Ou{" "}
            <Link to="/register" className="font-medium text-brand hover:text-brand-600">
              criar uma nova conta
            </Link>
          </p>
        </div>
        
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
