import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import ShoppingCart from "@/components/ShoppingCart";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

const AppLayout = () => {
  const { currentUser, logOut } = useAuth();
  const navigate = useNavigate();
  // NOVO: Importe e use o useLocation
  const location = useLocation();

  const handleLogout = async () => {
    await logOut();
    navigate("/login", { replace: true });
  };

  // NOVO: Extrai o slug do pathname da URL
  // Ex: '/best-pizza/cardapio' -> ['', 'best-pizza', 'cardapio'] -> 'best-pizza'
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const slug = pathSegments[0];
  
  // A URL de destino do botão 'Entrar' agora é dinâmica
  const loginLink = slug ? `/${slug}/login` : "/login";

  return (
    <div>
      <div className="fixed top-4 right-4 z-50">
        {currentUser ? (
          <Button onClick={handleLogout} variant="outline">
            Sair
          </Button>
        ) : (
          <Button asChild>
            <Link to={loginLink}>Entrar</Link>
          </Button>
        )}
      </div>
      <Outlet />
      <ShoppingCart />
      <Toaster />
      <Sonner />
    </div>
  );
};

export default AppLayout;
