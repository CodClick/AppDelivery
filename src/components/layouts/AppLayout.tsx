import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link, Outlet, useNavigate } from "react-router-dom";
import ShoppingCart from "@/components/ShoppingCart";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

const AppLayout = () => {
  const { currentUser, logOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logOut();
    navigate("/login", { replace: true });
  };

  return (
    <div>
      <div className="fixed top-4 right-4 z-50">
        {currentUser ? (
          <Button onClick={handleLogout} variant="outline">
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
