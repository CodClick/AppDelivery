import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link, Outlet } from "react-router-dom";
import ShoppingCart from "@/components/ShoppingCart";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

const AppLayout = () => {
  const { currentUser, logOut } = useAuth();

  return (
    <div>
      <div className="fixed top-4 right-4 z-50">
        {currentUser ? (
          <Button onClick={logOut} variant="outline">
            Sair
          </Button>
        ) : (
          <Button asChild>
            <Link to="/login">Entrar</Link>
          </Button>
        )}
      </div>
      <Outlet />
      {/* Mova os componentes globais para o layout */}
      <ShoppingCart />
      <Toaster />
      <Sonner />
    </div>
  );
};

export default AppLayout;
