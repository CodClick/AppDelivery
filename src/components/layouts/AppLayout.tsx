import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link, Outlet, useNavigate } from "react-router-dom"; // Importe 'useNavigate'
import ShoppingCart from "@/components/ShoppingCart";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

const AppLayout = () => {
  const { currentUser, logOut } = useAuth();
  const navigate = useNavigate(); // Inicialize o hook de navegação

  // Função para lidar com o logout
  const handleLogout = async () => {
    await logOut();
    navigate("/login"); // Redireciona para a página de login após o logout
  };

  return (
    <div>
      <div className="fixed top-4 right-4 z-50">
        {currentUser ? (
          <Button onClick={handleLogout} variant="outline"> {/* Chame a nova função */}
            Sair
          </Button>
        ) : (
          <Button asChild>
            <Link to="/login">Entrar</Link>
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
